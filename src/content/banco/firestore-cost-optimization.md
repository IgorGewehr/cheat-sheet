---
title: "Firestore — otimização de custo (paginação, listeners, índices)"
category: banco
stack: [Firestore, Firebase]
tags: [firestore, custo, performance, paginacao, indices]
excerpt: "Firestore cobra por document read. Dashboard com onSnapshot sem limit() é o caminho mais rápido pra fatura de R$ 5k/mês. Paginação não é 'feature futura' — é a primeira otimização."
related: [firestore-multi-tenant, n-plus-1, ai-sem-paginacao]
updated: 2026-04
---

## O modelo de cobrança

- **Read** = R$ X por documento lido. `get()` que retorna 500 docs = 500 reads.
- **Listener** (`onSnapshot`) = 1 read por documento + 1 read por mudança recebida.
- **Listener ativo em coleção de 5k docs** que muda 100x/dia = 500k reads/dia/usuário.

Multiplique por usuários simultâneos. Não passa muito tempo até virar problema.

## As 5 armadilhas mais caras

### 1. `onSnapshot` sem `limit()`
```ts
// ❌ R$ proporcional ao tamanho da coleção
onSnapshot(collection(db, 'clientes'), ...);

// ✅ Limit + paginação
onSnapshot(query(collection(db, 'clientes'),
  orderBy('createdAt', 'desc'), limit(50)), ...);
```

### 2. Listener vivo em página fechada
React com `useEffect` sem cleanup vaza listener. Em Next.js App Router com transição de página, é fácil ter 5+ listeners do mesmo dado vivos. Sempre retorne o `unsubscribe`.

### 3. Resolver foreign key com N+1
```ts
// ❌ N+1 — 1 query + N reads
const sales = await getSales();
for (const s of sales) {
  s.client = await getClient(s.clientId); // ouch
}

// ✅ Batch com `where in` (max 30 ids por query)
const ids = unique(sales.map(s => s.clientId));
const clients = await batchedWhereIn(ids); // helper que quebra em chunks de 30
```

Pra muitos joins regulares, **denormalize**: salve `clientName` no documento de venda. Custa storage, economiza N reads.

### 4. Query global (collection group) sem filtro de tenant
`collectionGroup('mensagens')` numa app multi-tenant lê **todas as mensagens de todos os clientes**. Filtre por `businessId` no query — e tenha o índice composto.

### 5. Aggregate em memória
Calcular total de vendas do mês carregando todas as vendas em memória = 10k reads. Use **aggregation queries** (`getCountFromServer`, `getAggregateFromServer`) — 1 read.

## Padrões pra dashboards

| Caso | Solução |
|---|---|
| KPI hoje (1 número) | `getCountFromServer` ou doc agregador atualizado por trigger |
| Lista paginada | `limit(N)` + cursor (`startAfter`) |
| Tempo real | `onSnapshot` com `limit` baixo + "ver mais" carrega histórico via `get` |
| Histórico longo | export pro BigQuery, queries SQL lá |

## Doc agregador (poor man's CQRS)

Pro KPI "total vendido hoje" não puxar 5k docs:
- Coleção `dailyStats/{businessId}_{yyyy-mm-dd}` com `total`, `count`, `byChannel`.
- Cloud Function ou trigger no servidor incrementa `total` quando uma venda é criada.
- Dashboard lê 1 doc.

Trade-off: precisa cuidar de consistência (idempotency key, retry).

## Índices compostos

Toda query com `where + orderBy` em campos diferentes precisa de índice composto. Firestore loga link pra criar — **não ignore**, ou query falha em produção.

Em multi-tenant, sempre comece o índice por `tenantId/businessId`:
```
(tenantId, createdAt DESC)
(tenantId, status, createdAt DESC)
```

## Sintomas de problema

- Fatura mensal cresce linear com base de usuários, não com receita.
- Latência de página de listagem cresce com tempo.
- Dashboard demora >2s pra abrir.
- Console mostra "X documents read in Y queries" alto em sessões curtas.

## Checklist

- [ ] Toda listagem tem `limit()`.
- [ ] Todo `onSnapshot` tem cleanup no `useEffect`.
- [ ] KPIs caros vêm de docs agregadores, não de query.
- [ ] N+1 resolvido com `where in` em chunks ou denormalização.
- [ ] Índices compostos criados (não confiar em "Firestore vai criar quando precisar").
- [ ] Monitor mensal: reads/dia em ambientes diferentes.
