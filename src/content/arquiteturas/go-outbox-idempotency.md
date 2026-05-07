---
title: "Go: Outbox, Idempotência e Consistência Eventual"
category: arquiteturas
stack: [Go, PostgreSQL, RabbitMQ, Redis]
tags: [outbox, idempotency, eventual-consistency, rabbitmq, postgres]
excerpt: "O padrão que separa serviço amador de serviço robusto: gravar estado e evento atomicamente, publicar depois, deduplicar consumo e aceitar consistência eventual."
related: [outbox-pattern, go-rabbitmq-event-driven, go-transactions-repositories]
updated: "2026-05-07"
---

## O problema

Você precisa salvar uma fatura no Postgres e publicar `InvoiceCreated` no RabbitMQ. Se salvar e falhar ao publicar, outros serviços nunca saberão. Se publicar e falhar ao salvar, outros serviços reagem a algo que não existe.

Não há transação distribuída simples entre Postgres e RabbitMQ. Outbox resolve isso.

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

Ao consumir:

1. inicia transação;
2. tenta inserir `message_id`;
3. se conflito, ignora;
4. aplica efeito;
5. commit;
6. ack.

## Exactly-once é promessa perigosa

Na prática empresarial, busque efeito exatamente uma vez, não entrega exatamente uma vez. A rede duplica, broker reentrega, processo cai. Seu design precisa tolerar repetição.

## Critério de domínio

Você dominou este card quando consegue explicar o ponto exato de falha entre banco e broker e demonstrar por teste que publicar/consumir duas vezes não duplica dinheiro, e-mail ou lançamento.
