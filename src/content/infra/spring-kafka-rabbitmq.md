---
title: "Spring Kafka & RabbitMQ: Eventos, DLQ, Idempotência"
category: infra
stack: [Spring Boot, Kotlin, Kafka, RabbitMQ]
tags: [kafka, rabbitmq, messaging, dlq, idempotency, backpressure]
excerpt: "Mensageria em Spring com Kotlin: Spring Kafka vs Spring AMQP, consumers idempotentes, DLT/DLQ, retry exponencial, schema registry e como NÃO duplicar pedido."
related: [spring-outbox-pattern, event-driven, background-jobs]
updated: "2026-05-11"
---

## Kafka vs RabbitMQ (rápido)

| | Kafka | RabbitMQ |
|---|---|---|
| Modelo | log particionado | broker com filas |
| Retenção | dias/semanas (configurável) | até consumir |
| Replay | sim, nativo | não trivial |
| Throughput | milhões msg/s | dezenas de milhares |
| Ordering | dentro de partition | dentro de queue |
| Topologia | producer → topic → consumer group | producer → exchange → queue → consumer |
| Caso ideal | event sourcing, analytics, alta volumetria | task queue, RPC pattern, work distribution |

**Regra prática**: eventos de domínio + analytics + replay = Kafka. Filas de tarefas + RPC + roteamento por header = RabbitMQ. Há overlap; escolha pela necessidade dominante.

## Spring Kafka — Producer

```kotlin
implementation("org.springframework.kafka:spring-kafka")
implementation("org.springframework.kafka:spring-kafka")
```

```yaml
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BROKERS:localhost:9092}
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all
      enable-idempotence: true
      retries: 5
    consumer:
      group-id: billing-service
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties:
        spring.deserializer.value.delegate.class: org.springframework.kafka.support.serializer.JsonDeserializer
        spring.json.trusted.packages: "com.igor.billing.events"
        isolation.level: read_committed
    listener:
      ack-mode: manual_immediate
      concurrency: 3
```

Pontos críticos:
- `acks: all` + `enable-idempotence: true` = exactly-once dentro de uma sessão de produtor (não end-to-end).
- `isolation.level: read_committed` = consumer só vê mensagens commitadas (transacional).
- `ErrorHandlingDeserializer` = mensagem corrompida não derruba consumer.
- `ack-mode: manual_immediate` = você commitam offset depois do processo, não automático.

Producer:

```kotlin
@Component
class PedidoEventoPublisher(
    private val kafka: KafkaTemplate<String, Any>,
) {
    fun publicar(evento: PedidoCriado) {
        kafka.send("pedido-criado", evento.id.valor.toString(), evento)
            .whenComplete { r, e ->
                if (e != null) log.error("falha publicando $evento", e)
            }
    }
}
```

**Key estável**: use ID do aggregate como key Kafka. Garante ordenação dentro da partition (todas as mensagens do mesmo pedido vão pra mesma partition).

## Consumer

```kotlin
@Component
class PedidoCriadoListener(
    private val notificar: NotificarUseCase,
    private val processados: ProcessamentoRepository,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @KafkaListener(topics = ["pedido-criado"], groupId = "notificacao-service")
    fun handle(
        @Payload evento: PedidoCriado,
        @Header(KafkaHeaders.RECEIVED_KEY) key: String,
        @Header(KafkaHeaders.OFFSET) offset: Long,
        ack: Acknowledgment,
    ) {
        val msgId = "${evento.id}-${offset}"

        if (processados.jaProcessou(msgId)) {
            log.info("idempotência: já processei $msgId")
            ack.acknowledge()
            return
        }

        try {
            notificar.cliente(evento.id, evento.cliente)
            processados.marcar(msgId)
            ack.acknowledge()
        } catch (e: TransienteException) {
            log.warn("falha transiente em $msgId, vai retentar", e)
            throw e        // listener container retenta
        } catch (e: Exception) {
            log.error("falha definitiva em $msgId", e)
            ack.acknowledge() // descarta, vai pro DLT via container
            throw e
        }
    }
}
```

## Dead Letter Topic (DLT)

```kotlin
@Bean
fun errorHandler(template: KafkaTemplate<Any, Any>): DefaultErrorHandler {
    val recoverer = DeadLetterPublishingRecoverer(template) { record, _ ->
        TopicPartition("${record.topic()}.DLT", record.partition())
    }
    return DefaultErrorHandler(
        recoverer,
        ExponentialBackOff(1_000L, 2.0).apply { maxInterval = 60_000L },
    ).apply {
        addNotRetryableExceptions(
            IllegalArgumentException::class.java,
            NotFoundException::class.java,
        )
        setRetryListeners(/* ... */)
    }
}
```

Após N falhas, mensagem vai pro tópico `pedido-criado.DLT`. Você monitora esse tópico, alerta no oncall, e tem um operator (CLI / job) para **reprocessar manualmente** após corrigir o bug.

## Idempotência de consumer

Kafka entrega **at-least-once** por default. Você precisa **lidar com duplicatas**.

Três estratégias:

1. **Tabela de processados** (acima): `processados` é tabela `(msg_id PK, processado_em)`. Antes de processar, verifica. Depois, insere.

2. **Idempotência natural** (`UPSERT`): operação que aplicar 2× dá mesmo resultado. `INSERT ... ON CONFLICT DO NOTHING`.

3. **Versionamento**: mensagem carrega versão; só processa se versão maior que a atual.

Sem isso, você duplica pedido / cobra cliente 2× / etc.

## Spring AMQP (RabbitMQ)

```kotlin
implementation("org.springframework.boot:spring-boot-starter-amqp")
```

```yaml
spring:
  rabbitmq:
    addresses: ${RABBITMQ_URL:amqp://localhost:5672}
    listener:
      simple:
        prefetch: 50
        acknowledge-mode: manual
        retry:
          enabled: true
          initial-interval: 1s
          multiplier: 2
          max-interval: 30s
          max-attempts: 5
```

Topology (exchanges, queues, bindings):

```kotlin
@Configuration
class RabbitConfig {
    @Bean fun pedidosExchange() = TopicExchange("pedidos")

    @Bean
    fun pedidoCriadoQueue() = QueueBuilder.durable("notificacao.pedido-criado")
        .withArgument("x-dead-letter-exchange", "pedidos.dlx")
        .withArgument("x-dead-letter-routing-key", "notificacao.pedido-criado")
        .build()

    @Bean
    fun pedidoCriadoBinding(): Binding =
        BindingBuilder.bind(pedidoCriadoQueue())
            .to(pedidosExchange())
            .with("pedido.criado")

    @Bean fun dlxExchange() = DirectExchange("pedidos.dlx")
    @Bean fun dlq() = QueueBuilder.durable("notificacao.pedido-criado.dlq").build()
    @Bean fun dlqBinding(): Binding =
        BindingBuilder.bind(dlq()).to(dlxExchange()).with("notificacao.pedido-criado")
}
```

Producer:

```kotlin
@Component
class PedidoEventoAmqpPublisher(private val template: RabbitTemplate) {
    fun publicar(evento: PedidoCriado) {
        template.convertAndSend("pedidos", "pedido.criado", evento)
    }
}
```

Consumer com manual ack:

```kotlin
@Component
class PedidoCriadoAmqpListener(private val notificar: NotificarUseCase) {

    @RabbitListener(queues = ["notificacao.pedido-criado"])
    fun handle(
        @Payload evento: PedidoCriado,
        channel: Channel,
        @Header(AmqpHeaders.DELIVERY_TAG) tag: Long,
    ) {
        try {
            notificar.cliente(evento.id, evento.cliente)
            channel.basicAck(tag, false)
        } catch (e: TransienteException) {
            channel.basicNack(tag, false, true)  // requeue
        } catch (e: Exception) {
            channel.basicNack(tag, false, false) // vai pra DLQ
        }
    }
}
```

## Schema Registry (Avro / Protobuf / JSON Schema)

JSON simples evolui mal. Em arquitetura com 10+ serviços consumidores, use **schema registry**:

- [Confluent Schema Registry](https://docs.confluent.io/platform/current/schema-registry/) com Avro/Protobuf.
- [Apicurio Registry](https://www.apicur.io/registry/) (open source).

Vantagens: validação de compatibilidade (backward/forward), evolução versionada, bloqueio de breaking change em CI.

## Tracing / Observability

Spring Boot 3 + Micrometer Tracing já propaga `trace_id` em headers Kafka/AMQP. Em produção:

```yaml
management:
  tracing:
    sampling:
      probability: 0.1   # 10% das mensagens trace-adas
```

Você abre o trace no Tempo/Jaeger e vê: HTTP → Kafka → consumer → DB. Vida fácil em incidente.

## Anti-padrões

1. **Consumer não idempotente**: at-least-once vira at-twice na primeira queda de broker.
2. **Sem DLT/DLQ**: mensagem ruim trava consumer eternamente.
3. **`acks=1` em prod**: você perde mensagem se broker líder cai antes de replicar.
4. **Autoack**: você commitar offset antes de processar = perdeu a mensagem se app crashar.
5. **JSON sem schema registry em arquitetura grande**: dia em que alguém renomeia campo, tudo quebra silenciosamente.
6. **Producer dentro de TX direto**: use **outbox pattern**.

## Critério de domínio

Você dominou este card quando consegue: configurar Kafka producer com idempotence e acks=all; implementar consumer idempotente com tabela de processados; configurar DLT com exponential backoff; explicar a diferença entre Kafka e RabbitMQ em 3 frases; e listar 3 motivos pra usar schema registry em arquitetura grande.
