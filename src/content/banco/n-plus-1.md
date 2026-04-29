---
title: "N+1 — detectar e prevenir"
category: banco
stack: [PostgreSQL, NestJS]
tags: [performance, n-plus-1]
excerpt: "O bug de performance número 1 em ORM. Lista 100 pedidos, faz 1 query + 100 queries pra carregar cliente de cada. Prevenção é hábito."
related: [postgres-erp-checklist, repository-pattern, cqrs-lite]
updated: 2026-04
---

## O sintoma

```ts
const pedidos = await db.query.pedidos.findMany();
for (const p of pedidos) {
  const cliente = await db.query.clientes.findFirst({ where: eq(clientes.id, p.clienteId) });
  // ...
}
```

100 pedidos = 101 queries. Lento. Em produção, com 1000+ tenants pedindo isso ao mesmo tempo: timeout.

## Como detectar

- **`pg_stat_statements`**: queries muito repetidas com mesma forma.
- **Logs em dev**: ligue log de SQL e veja "select clientes where id = ?" 100 vezes.
- **APM** (Sentry, OpenTelemetry, Datadog) com tracing de queries.
- **Tests**: assert no número de queries de um endpoint (algumas libs).

## Prevenção — leituras

### Eager loading (join)

```ts
// Drizzle relational queries
const pedidos = await db.query.pedidos.findMany({
  with: { cliente: true, itens: { with: { produto: true } } },
});
```

Cuidado: 1 query gigante com N joins pode ser pior que N pequenas. Use `EXPLAIN`.

### DataLoader

Para casos onde join não cabe (GraphQL, BFF), use `DataLoader` que agrega chaves em batch:

```ts
const clienteLoader = new DataLoader(async (ids) => {
  const rows = await db.select().from(clientes).where(inArray(clientes.id, ids as string[]));
  return ids.map(id => rows.find(r => r.id === id) ?? null);
});

await clienteLoader.load(p.clienteId);  // bate 1 query final agrupada
```

### Read model (CQRS-lite)

Pra tela de listagem, escreva uma query SQL única que traz tudo. Não use o repository do agregado.

## Prevenção — escritas em loop

```ts
for (const item of itens) {
  await db.insert(itensPedido).values(item);  // N queries
}
// melhor:
await db.insert(itensPedido).values(itens);    // 1 query
```

## Cuidado com lazy properties

Em libs com lazy loading (Prisma `relations` em include automático em alguns casos), checar plano de execução. "Mágica" cobra fatura.

## Como pedir pra IA

> "Audite o endpoint `GET /pedidos` por N+1. Hoje retorna 50 pedidos com cliente, vendedor e itens. Refatore pra: (1) query única com joins, mapeando pra DTO; (2) ou repositório com eager loading; (3) compare planos com EXPLAIN. Inclua teste que falha se número de queries > 3 (use spy no driver)."

## Auditoria

- [ ] Endpoints de listagem testados sob carga e com `pg_stat_statements`.
- [ ] Joins ou DataLoader em qualquer relação carregada em loop.
- [ ] Insert/update em loop substituídos por batch.
- [ ] Tracing de queries habilitado em dev/staging.
- [ ] CI ou lint pega padrões óbvios (loop com `await db...` no corpo).

## Anti-padrões

- "Vou usar lazy loading e ver depois". O depois nunca vem.
- Resolver N+1 fazendo query gigante com 7 joins quando 2 queries simples seriam mais rápidas.
- Esquecer N+1 em `forEach`/`map` async (cada iteração pode estar batendo no DB).
