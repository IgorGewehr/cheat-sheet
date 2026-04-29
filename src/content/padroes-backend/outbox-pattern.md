---
title: "Outbox Pattern — publicar evento sem dual write"
category: padroes-backend
stack: [NestJS, PostgreSQL]
tags: [eventos, integração, consistência]
excerpt: "Grava o evento numa tabela na MESMA transação do dado. Um worker publica depois. Sem perda, sem dual write."
related: [event-driven, saga-pattern, microservices-quando-usar]
updated: 2026-04
---

## O problema

Você quer:
1. Salvar pedido no DB.
2. Publicar `PedidoCriado` no broker (Kafka/Rabbit/Redis Streams).

Se faz nessa ordem e o broker está fora → DB salvo, evento perdido (inconsistência).
Se faz na ordem inversa → evento publicado, DB falha (consumidores agem em algo que não existe).

**Não use dois sistemas em uma "transação distribuída" caseira.** Sempre vai vazar.

## Solução: Outbox

Mesma transação grava o agregado **e** uma linha na tabela `outbox`. Worker separado lê outbox e publica no broker.

```sql
CREATE TABLE outbox (
  id UUID PRIMARY KEY,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
CREATE INDEX ON outbox (occurred_at) WHERE published_at IS NULL;
```

```ts
await db.transaction(async (tx) => {
  await pedidoRepo.save(pedido, tx);
  await tx.insert(outbox).values({
    id: crypto.randomUUID(),
    aggregate_type: 'Pedido',
    aggregate_id: pedido.id.value,
    event_type: 'PedidoCriado',
    payload: pedido.toEvent(),
  });
});
```

## Worker

Job recorrente:

```ts
async function publishOutbox() {
  const batch = await db.execute(sql`
    SELECT * FROM outbox
    WHERE published_at IS NULL
    ORDER BY occurred_at LIMIT 100
    FOR UPDATE SKIP LOCKED;
  `);
  for (const row of batch) {
    await broker.publish(row.event_type, row.payload);
    await db.execute(sql`UPDATE outbox SET published_at = now() WHERE id = ${row.id}`);
  }
}
```

`FOR UPDATE SKIP LOCKED` permite múltiplos workers em paralelo.

## Garantias

- **At-least-once**. Consumidores precisam ser idempotentes (use `event.id` como dedup key).
- Ordenação **por agregado** (use `aggregate_id` como partition key no broker).
- Ordenação total não é garantida e geralmente não importa.

## Quando NÃO precisa

- Eventos só in-process (mesmo deploy, mesma transação). Use event bus simples.
- Você não tem broker (mas vai precisar quando crescer — pense de novo).

## Como pedir pra IA

> "Implemente Outbox em Postgres + Nest. Tabela `outbox` (schema acima). Cada use case que dispara evento integration-level grava na outbox dentro da mesma `db.transaction`. Worker `OutboxPublisher` (cron a cada 1s) publica no Kafka. Marca `published_at`. Suporta múltiplas instâncias rodando em paralelo (SKIP LOCKED). Inclua dedup no consumer com tabela `processed_events(event_id PK)`."

## Auditoria

- [ ] Insert no outbox e save do agregado **na mesma transação**.
- [ ] Worker usa `FOR UPDATE SKIP LOCKED` (ou equivalente).
- [ ] Há retry com backoff em falha de publicação.
- [ ] Existe alerta se `outbox` tem registros não publicados há > N minutos.
- [ ] Consumer tem dedup por `event.id`.
- [ ] Limpeza/arquivamento de outbox antigo (não vire tabela infinita).

## Anti-padrões

- Publicar evento ANTES de commitar transação.
- Tentar coordenar broker e DB com 2PC sem ferramenta nativa de saga.
- Esquecer dedup no consumer e dobrar lançamentos financeiros.
- Outbox sem índice em `(published_at IS NULL, occurred_at)` — query do worker fica lenta.
