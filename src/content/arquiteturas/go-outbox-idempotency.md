---
title: "Go: Outbox, Idempotência e Consistência Eventual"
category: arquiteturas
stack: [Go, PostgreSQL, RabbitMQ, Redis]
tags: [outbox, idempotency, eventual-consistency, rabbitmq, postgres]
excerpt: "O padrão que separa serviço amador de serviço robusto: gravar estado e evento atomicamente, publicar depois, deduplicar consumo e aceitar consistência eventual."
related: [outbox-pattern, go-rabbitmq-event-driven, go-transactions-repositories]
updated: "2026-05-08"
---

## O problema

Você precisa salvar uma fatura no Postgres e publicar `InvoiceCreated` no RabbitMQ. Se salvar e falhar ao publicar, outros serviços nunca saberão. Se publicar e falhar ao salvar, outros serviços reagem a algo que não existe.

Não há transação distribuída simples entre Postgres e RabbitMQ. Outbox resolve isso.

## Matriz de falhas

O padrão só fica óbvio quando você olha os pontos de quebra.

| Sequência | Falha | Consequência sem outbox | Defesa |
|---|---|---|---|
| salva banco, publica evento | processo cai antes de publicar | dado existe, evento some | outbox pendente |
| publica evento, salva banco | banco falha depois | evento fala de dado inexistente | nunca publique antes do commit |
| publica evento, marca publicado | processo cai entre os dois | evento duplica | consumer idempotente |
| consumer processa, ack | processo cai antes do ack | broker reentrega | deduplicação |
| consumer ack, processa | processo cai depois do ack | efeito some | ack só depois do commit |

Outbox não promete ausência de duplicata. Ele promete que mudança de estado e intenção de publicar são atômicas.

## Como funciona

Na mesma transação do caso de uso:

1. altera estado do aggregate;
2. insere evento em `outbox_events`;
3. commita.

Um publisher separado lê eventos pendentes e publica no RabbitMQ. Depois marca como publicado.

```sql
CREATE TABLE outbox_events (
  id uuid PRIMARY KEY,
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
```

Em produção, geralmente vale um schema mais operacional:

```sql
CREATE TABLE outbox_events (
  id uuid PRIMARY KEY,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL,
  event_version integer NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE INDEX outbox_pending_idx
ON outbox_events (next_attempt_at, created_at)
WHERE status = 'pending';
```

`status`, `attempts` e `locked_until` permitem retry controlado e múltiplos publishers sem briga.

## Publisher com lock

Um publisher busca lote pequeno, reivindica os eventos e libera a transação antes de publicar no broker. Não publique no RabbitMQ enquanto segura lock/transação de banco: operação de rede é lenta e falhável.

```sql
WITH candidates AS (
  SELECT id
  FROM outbox_events
  WHERE status = 'pending'
    AND next_attempt_at <= now()
    AND (locked_until IS NULL OR locked_until < now())
  ORDER BY created_at
  LIMIT 50
  FOR UPDATE SKIP LOCKED
)
UPDATE outbox_events
SET locked_until = now() + interval '2 minutes',
    attempts = attempts + 1
WHERE id IN (SELECT id FROM candidates)
RETURNING id, event_type, event_version, payload;
```

`SKIP LOCKED` permite vários workers competirem sem processar a mesma linha ao mesmo tempo. A transação que executa esse claim deve commitar rápido. Depois disso, a publicação acontece fora da transação.

Pseudo-fluxo:

```go
func (p Publisher) PublishPending(ctx context.Context) error {
	events, err := p.outbox.LockPending(ctx, 50)
	if err != nil {
		return err
	}

	for _, event := range events {
		err := p.broker.Publish(ctx, event.RoutingKey(), event.Payload)
		if err != nil {
			if markErr := p.outbox.MarkFailed(ctx, event.ID, err); markErr != nil {
				p.logger.Error("mark outbox failed", zap.Error(markErr), zap.String("event_id", event.ID))
				return markErr
			}
			continue
		}
		if err := p.outbox.MarkPublished(ctx, event.ID); err != nil {
			p.logger.Error("mark outbox published failed", zap.Error(err), zap.String("event_id", event.ID))
			return err
		}
	}

	return nil
}
```

Essa versão ainda pode duplicar evento se publicar no broker e falhar antes de `MarkPublished`. Por isso o consumer não pode confiar em entrega única.

## Publicação pode duplicar

O publisher pode publicar e cair antes de marcar `published_at`. Então o consumer pode receber duplicata.

Por isso, consumer precisa ser idempotente.

Tabela de deduplicação:

```sql
CREATE TABLE processed_messages (
  message_id uuid PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);
```

Em sistemas multi-tenant ou com múltiplos handlers, prefira incluir consumidor:

```sql
CREATE TABLE processed_messages (
  tenant_id uuid NOT NULL,
  consumer_name text NOT NULL,
  message_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, consumer_name, message_id)
);
```

Se `message_id` é globalmente único e confiável, o tenant pode parecer redundante. Em sistemas multi-tenant, manter o escopo explícito melhora isolamento, auditoria e investigação.

Ao consumir:

1. inicia transação;
2. tenta inserir `message_id`;
3. se conflito, ignora;
4. aplica efeito;
5. commit;
6. ack.

Exemplo do padrão em Go:

```go
func (c Consumer) Handle(ctx context.Context, msg Message) error {
	return c.uow.WithinTx(ctx, func(ctx context.Context, tx TxDeps) error {
		inserted, err := tx.Messages.TryMarkProcessed(ctx, "ledger", msg.ID)
		if err != nil {
			return err
		}
		if !inserted {
			return nil
		}

		event, err := DecodeInvoicePaid(msg.Body)
		if err != nil {
			return PermanentError{Err: err}
		}

		return tx.Ledger.CreateEntry(ctx, LedgerEntry{
			InvoiceID: event.InvoiceID,
			Amount:    event.Amount,
		})
	})
}
```

O ack no RabbitMQ acontece fora, depois que `Handle` retorna sucesso.

Se `Handle` retorna `PermanentError`, o dispatcher externo deve enviar para DLQ ou rejeitar sem requeue, registrar métrica/alerta e então impedir loop infinito de mensagem venenosa. Erro permanente não é "tente de novo para sempre".

## Exactly-once é promessa perigosa

Na prática empresarial, busque efeito exatamente uma vez, não entrega exatamente uma vez. A rede duplica, broker reentrega, processo cai. Seu design precisa tolerar repetição.

## Ordering e aggregate

Outbox preserva ordem de criação no banco, mas seu broker e seus consumers podem processar em paralelo. Se a ordem importa, defina a unidade de ordenação: normalmente `aggregate_id`.

Exemplos:

- eventos da mesma fatura devem ser processados em ordem;
- eventos de faturas diferentes podem processar em paralelo;
- consumer deve tolerar evento antigo, duplicado ou já aplicado.

Não use "ordem global perfeita" como requisito sem necessidade. Ela custa caro e reduz throughput.

## Idempotência de comando vs idempotência de evento

São problemas diferentes:

- idempotência de comando protege entrada HTTP, como `POST /payments`;
- idempotência de evento protege reprocessamento assíncrono, como `InvoicePaid` duplicado.

No HTTP, salve `Idempotency-Key`, hash do request e response. No consumer, salve `message_id` por consumidor. Misturar os dois costuma gerar buraco.

## Critério de domínio

Você dominou este card quando consegue explicar o ponto exato de falha entre banco e broker e demonstrar por teste que publicar/consumir duas vezes não duplica dinheiro, e-mail ou lançamento.
