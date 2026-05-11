---
title: "Spring + Outbox Pattern: Consistência Eventual Sem Caos"
category: padroes-backend
stack: [Spring Boot, Kotlin, Kafka, PostgreSQL, Debezium]
tags: [outbox, kafka, consistency, debezium, transactional-outbox, eventually-consistent]
excerpt: "Outbox pattern em Spring: por que publicar evento dentro da TX falha; tabela outbox + relay (poller ou Debezium); idempotência no consumer; Sagas e consistência eventual."
related: [spring-kafka-rabbitmq, outbox-pattern, saga-pattern]
updated: "2026-05-11"
---

## O problema

Você quer **atualizar o banco E publicar evento atomicamente**:

```kotlin
@Transactional
fun confirmar(pedido: Pedido) {
    repo.save(pedido)
    kafka.send("pedido-confirmado", PedidoConfirmado(pedido.id))  // ⚠️
}
```

Cenários ruins:
- Kafka indisponível por 3s. TX commita; evento perdido. Subsistema fica desincronizado.
- App crasha entre `save` e `send`. DB tem o pedido, Kafka não.
- Kafka responde sucesso (acks=all) mas crash logo após; consumer não vê; DB tem.
- TX dá rollback após `send` por outro motivo; evento já foi pro mundo, mas dado não existe.

**Nenhuma combinação de retry/timeout salva**. Você precisa de **atomicidade entre DB e broker**, e não existe nativamente (2PC é frágil e lento).

## A solução: Outbox

Em vez de publicar direto, **escreva o evento no MESMO DB**, na mesma TX:

```text
TX:
  INSERT INTO pedidos (...)
  INSERT INTO outbox (id, aggregate_id, topic, payload, created_at)
COMMIT
```

Tudo atômico no DB. Depois, um **relay** lê a tabela `outbox` e publica no Kafka. Se falha, retry. Se duplica, consumer é idempotente.

## Tabela outbox

```sql
CREATE TABLE outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    payload JSONB NOT NULL,
    headers JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    attempt_count INT NOT NULL DEFAULT 0,
    last_error TEXT
);

CREATE INDEX idx_outbox_unprocessed
    ON outbox (created_at)
    WHERE processed_at IS NULL;
```

Index parcial em `processed_at IS NULL` mantém leitura rápida mesmo com milhões de eventos antigos.

## Escrita do outbox

```kotlin
@Service
class ConfirmarPedidoUseCase(
    private val repo: PedidoRepository,
    private val outbox: OutboxRepository,
    private val objectMapper: ObjectMapper,
) {

    @Transactional
    fun executar(id: PedidoId) {
        val pedido = repo.buscar(id) ?: throw PedidoNaoEncontrado(id)
        pedido.confirmar()
        repo.salvar(pedido)

        pedido.eventos.forEach { evento ->
            outbox.salvar(
                OutboxEntry(
                    aggregateType = "Pedido",
                    aggregateId = pedido.id.valor.toString(),
                    topic = topicoPara(evento),
                    payload = objectMapper.writeValueAsString(evento),
                    headers = mapOf(
                        "trace-id" to MDC.get("correlationId").orEmpty(),
                        "event-type" to evento::class.simpleName.orEmpty(),
                    ),
                )
            )
        }
    }
}
```

`repo.salvar` e `outbox.salvar` dentro da MESMA `@Transactional`. Tudo ou nada.

## Relay: Poller (versão simples)

```kotlin
@Component
class OutboxPoller(
    private val outboxRepo: OutboxRepository,
    private val kafka: KafkaTemplate<String, String>,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Scheduled(fixedDelayString = "PT1S")
    fun publicar() {
        val pendentes = outboxRepo.naoProcessados(limit = 100)
        if (pendentes.isEmpty()) return

        pendentes.forEach { entry ->
            try {
                val record = ProducerRecord<String, String>(
                    entry.topic,
                    entry.aggregateId,
                    entry.payload,
                )
                entry.headers.forEach { (k, v) -> record.headers().add(k, v.toByteArray()) }

                kafka.send(record).get(5, TimeUnit.SECONDS)
                outboxRepo.marcarProcessado(entry.id)

            } catch (e: Exception) {
                log.error("falha publicando outbox ${entry.id}", e)
                outboxRepo.registrarFalha(entry.id, e.message ?: "?")
            }
        }
    }
}
```

Roda a cada 1s, pega 100 não processados, publica, marca. Em paralelo entre pods? Cuidado:

```sql
SELECT id FROM outbox
WHERE processed_at IS NULL
ORDER BY created_at
LIMIT 100
FOR UPDATE SKIP LOCKED;
```

`FOR UPDATE SKIP LOCKED` (PG 9.5+) faz cada pod pegar lote diferente sem bloqueio. Sem isso, vários pods publicam o mesmo evento.

## Relay: CDC com Debezium (versão robusta)

Em alta volumetria, polling é caro. Debezium lê **WAL do Postgres** (Change Data Capture):

```yaml
# debezium connector config
name: outbox-connector
config:
  connector.class: io.debezium.connector.postgresql.PostgresConnector
  database.hostname: postgres
  database.dbname: billing
  table.include.list: public.outbox
  transforms: outbox
  transforms.outbox.type: io.debezium.transforms.outbox.EventRouter
  transforms.outbox.table.field.event.id: id
  transforms.outbox.table.field.event.key: aggregate_id
  transforms.outbox.route.by.field: topic
  transforms.outbox.route.topic.replacement: ${routedByValue}
```

Vantagens:
- **latência <100ms** entre commit e Kafka;
- **sem polling** consumindo CPU/IO do DB;
- **escala**: Debezium lê WAL sequencialmente;
- **at-least-once garantido** via offset do connector.

Custos:
- complexidade operacional: Kafka Connect, Debezium, monitoring;
- precisa de `wal_level=logical` no Postgres;
- recuperação de falha do connector é manual;
- replication slot pode encher disco se connector trava.

**Quando usar**: throughput >100 events/s, latência <1s crítica. Em projeto menor, poller é mais simples e suficiente.

## Cleanup

Tabela `outbox` cresce. Limpe:

```sql
DELETE FROM outbox
WHERE processed_at IS NOT NULL
  AND processed_at < NOW() - INTERVAL '7 days';
```

7 dias é razoável para auditoria. Em compliance estrito, mova para tabela de arquivo antes de deletar.

## Consumer idempotente

At-least-once = você vai receber **duplicata** alguma hora. Conf prevenir:

```kotlin
@KafkaListener(topics = ["pedido-confirmado"])
fun handle(@Payload evento: PedidoConfirmado, @Header(KafkaHeaders.RECEIVED_KEY) key: String) {
    val idEvento = evento.idEvento.toString()

    if (processados.jaProcessou(idEvento)) {
        return  // duplicata, descarta
    }

    transactionTemplate.execute {
        notificarUseCase.executar(evento)
        processados.marcar(idEvento)
    }
}
```

Tabela `processados (id_evento PK)` simples. Ou idempotência natural via UPSERT:

```kotlin
@Transactional
fun aplicar(evento: SaldoCreditado) {
    repo.upsert(evento.contaId, evento.valor, evento.versao)
    // SQL: INSERT ... ON CONFLICT (id) DO UPDATE WHERE excluded.versao > saldo.versao
}
```

## Saga + Outbox

Saga distribuída usa eventos. Cada compensação publica evento via outbox. Mesmo princípio: TX local atômica, eventual consistency via broker.

```text
PedidoCriado → estoque consome → publica EstoqueReservado
                                ↘ via outbox
PedidoCriado → pagamento consome → publica PagamentoAprovado
                                  ↘ via outbox
                                  
... ou ...

PedidoCriado → pagamento consome → publica PagamentoRecusado
                                  ↘ via outbox
                                  ↘ estoque ouve → libera reserva
```

## CDC vs Outbox application-level

Existe técnica concorrente: **CDC direto da tabela de domínio** (sem outbox). Debezium lê INSERTs em `pedidos` e publica.

Vantagem: sem tabela outbox.
Desvantagem: você publica **estado**, não evento. Cliente recebe "linha mudou" e tem que computar o que aconteceu. Perde a expressividade de domain event.

**Outbox é preferível em arquitetura DDD**: você publica eventos rico em semântica, não delta de linha.

## Anti-padrões

1. **Publicar direto sem outbox**: já vimos os cenários.
2. **`@TransactionalEventListener(phase = AFTER_COMMIT)` para Kafka**: ainda perde se app crasha entre commit e listener.
3. **Outbox em DB diferente do agregado**: você não tem TX entre eles. Volta ao problema.
4. **Não limpar outbox**: tabela explode, performance degrada.
5. **Consumer não idempotente**: at-least-once vira at-twice em produção.

## Critério de domínio

Você dominou este card quando consegue: explicar por que publish direto não é atômico; criar tabela outbox com index parcial; implementar poller com `FOR UPDATE SKIP LOCKED`; descrever quando vale Debezium vs poller; e listar 2 cuidados em consumer at-least-once.
