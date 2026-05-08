---
title: "Go + RabbitMQ: Eventos, Consumers e Backpressure"
category: infra
stack: [Go, RabbitMQ]
tags: [rabbitmq, event-driven, messaging, consumers, dlq, golang]
excerpt: "RabbitMQ em serviços Go: exchanges, queues, routing keys, acknowledgements, retries, DLQ, prefetch e consumers idempotentes."
related: [event-driven, background-jobs, go-outbox-idempotency]
updated: "2026-05-08"
---

## RabbitMQ não é só fila

RabbitMQ é broker de mensagens. O modelo mental correto envolve:

- exchange recebe mensagens;
- routing key ajuda a rotear;
- queue armazena mensagens;
- binding liga exchange e queue;
- consumer processa;
- ack confirma processamento.

Tipos comuns de exchange:

- `direct`: routing key exata;
- `topic`: padrões como `invoice.*`;
- `fanout`: broadcast para filas ligadas.

## Topologia como decisão de arquitetura

Uma topologia explícita evita acoplamento invisível:

```text
exchange: billing.events (topic)

routing keys:
  invoice.created.v1
  invoice.paid.v1
  payment.failed.v1

queues:
  ledger.invoice-paid
    binding: invoice.paid.v1

  notification.billing-events
    binding: invoice.*.v1

  analytics.billing-events
    binding: #.v1
```

O nome da queue deve refletir o consumidor, não só o evento. Isso permite cada consumidor ter retry, DLQ e velocidade próprios.

## Ack, nack e responsabilidade

Consumer só deve dar `ack` depois de concluir o efeito esperado. Se der `ack` antes e falhar no meio, a mensagem foi perdida.

Se falhou de forma temporária, use retry. Se falhou por payload inválido ou regra impossível, mande para DLQ.

DLQ, dead-letter queue, é uma fila para mensagens que não podem seguir o fluxo normal. Ela não é lixeira; é instrumento de operação.

## Classifique erros

Nem todo erro merece retry.

| Tipo | Exemplo | Ação |
|---|---|---|
| Temporário | Postgres indisponível, timeout | retry com backoff |
| Permanente | JSON inválido, versão desconhecida | DLQ |
| Domínio esperado | evento duplicado | ack sem efeito |
| Bug | panic no handler | retry limitado + alerta |

Em Go, modele isso:

```go
type PermanentError struct {
	Err error
}

func (e PermanentError) Error() string { return e.Err.Error() }
func (e PermanentError) Unwrap() error { return e.Err }
```

O wrapper do consumer decide se manda para DLQ ou requeue.

## Prefetch é backpressure

Prefetch limita quantas mensagens não confirmadas o broker entrega ao consumer.

Se seu consumer usa Postgres e cada mensagem abre transação, prefetch precisa respeitar:

- pool de conexões;
- latência média;
- custo do handler;
- número de réplicas.

Sem prefetch, você cria concorrência sem governança.

Exemplo mental:

```text
pgx pool: 20 conexões
replicas do consumer: 4
operações por mensagem: 1 transação

prefetch seguro inicial: 4 ou 5 por réplica
```

Se cada réplica recebe 50 mensagens e todas tentam transação, você cria 200 operações concorrentes para um pool de 20. Isso não é escala; é fila escondida.

## Consumer idempotente

RabbitMQ entrega pelo menos uma vez. "At least once" significa que duplicatas são possíveis. Então o handler precisa ser idempotente.

Estratégias:

- chave de idempotência no payload;
- tabela `processed_messages`;
- operação de domínio naturalmente idempotente;
- unique constraint no banco;
- Redis com TTL para deduplicação curta, quando perda depois do TTL é aceitável.

## Wrapper de consumer

O handler de domínio deve ser simples. O wrapper cuida de ack/nack/log/metrics.

```go
func (c Consumer) Consume(delivery amqp.Delivery) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	err := c.handler.Handle(ctx, Message{
		ID:   delivery.MessageId,
		Body: delivery.Body,
	})

	switch {
	case err == nil:
		_ = delivery.Ack(false)
	case errors.As(err, new(PermanentError)):
		c.logger.Warn("permanent message failure", zap.Error(err))
		_ = delivery.Reject(false)
	default:
		c.logger.Error("temporary message failure", zap.Error(err))
		_ = delivery.Nack(false, true)
	}
}
```

Em produção, retry com `Nack(requeue=true)` puro pode gerar loop quente. Prefira retry com delay usando exchange/queue de retry ou campo `next_attempt_at` quando o evento vem de outbox interna.

## Evento não é comando

Evento descreve algo que aconteceu: `InvoicePaid`.

Comando pede uma ação: `PayInvoice`.

Misturar os dois produz acoplamento ruim. Consumers de evento devem reagir a fatos, não depender de ordem mental escondida.

## Schema de evento

Evento precisa carregar metadados operacionais:

```json
{
  "eventId": "018f...",
  "eventType": "invoice.paid",
  "eventVersion": 1,
  "occurredAt": "2026-05-08T10:00:00Z",
  "producer": "billing-service",
  "aggregateId": "inv_123",
  "correlationId": "req_456",
  "data": {
    "invoiceId": "inv_123",
    "amountCents": 5000,
    "currency": "BRL"
  }
}
```

Sem `eventId`, idempotência fica frágil. Sem `eventVersion`, evolução quebra consumidores. Sem `correlationId`, debug distribuído fica cego.

## Testes essenciais

- mensagem válida gera efeito e `ack`;
- mensagem duplicada dá `ack` sem duplicar efeito;
- JSON inválido vai para DLQ/reject sem requeue infinita;
- Postgres temporariamente indisponível gera retry;
- prefetch e pool não saturam em carga prevista;
- evento v2 não quebra consumer v1 se compatível.

## Critério de domínio

Você dominou este card quando consegue desenhar exchange/queue/binding, configurar prefetch com intenção e provar que reprocessar a mesma mensagem não duplica efeito financeiro.
