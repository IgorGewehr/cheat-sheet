---
title: "Armadilha IA: N+1 Query"
category: armadilhas-ia
tags: [banco, performance, orm, prisma, typeorm]
stack: [NestJS, Prisma, TypeORM, PostgreSQL]
excerpt: A IA gera busca em loop quase sempre. Um endpoint com 100 pedidos vira 101 queries sem que ninguém perceba no code review.
related: [n-plus-1, repository-pattern, dto-validation]
updated: "2026-04"
---

## O que a IA costuma gerar (parece correto, quebra em produção)

```typescript
// IA gera isso — parece limpo, mas é N+1 puro
async getOrdersWithDetails(userId: string) {
  const orders = await prisma.order.findMany({ where: { userId } });

  return Promise.all(
    orders.map(async (order) => ({
      ...order,
      items: await prisma.orderItem.findMany({ where: { orderId: order.id } }), // N queries
      customer: await prisma.user.findUnique({ where: { id: order.userId } }),  // N queries
    }))
  );
}
```

Com 500 pedidos: **1001 queries** numa única requisição.

## Por que isso explode em produção

- Cada `await` dentro de `.map()` dispara uma query independente
- ORMs como Prisma e TypeORM não fazem batching automático por padrão
- O problema fica invisível em dev (5-10 registros) e explode em prod (milhares)
- Connection pool esgota → timeout em cascata → 500 para todos os usuários

## A versão correta com Prisma (include / eager loading)

```typescript
async getOrdersWithDetails(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      customer: true,
    },
  });
  // 1 query com JOINs — sempre
}
```

## A versão correta com TypeORM (QueryBuilder)

```typescript
async getOrdersWithDetails(userId: string) {
  return this.orderRepo
    .createQueryBuilder("order")
    .leftJoinAndSelect("order.items", "item")
    .leftJoinAndSelect("order.customer", "customer")
    .where("order.userId = :userId", { userId })
    .getMany();
}
```

## Como detectar no code review

- [ ] Existe `await` dentro de `.map()` ou `.forEach()` acessando o banco?
- [ ] O ORM usa `findMany` seguido de acesso a relacionamento sem `include`/`relations`?
- [ ] O endpoint retorna listas de objetos com sub-objetos carregados separadamente?
- [ ] Há loop com `findById` / `findUnique` chamados por elemento?

## Prompt para evitar esta armadilha

```
Ao gerar qualquer endpoint que retorna lista com dados relacionados,
use SEMPRE eager loading (include no Prisma, relations no TypeORM,
ou QueryBuilder com joins explícitos).
NUNCA faça fetch de relacionamentos dentro de .map() ou loop.
Prefira uma única query com joins a múltiplas queries em sequência.
```
