---
title: "Drizzle vs Prisma em 2026"
category: banco
stack: [PostgreSQL, NestJS, Drizzle, Prisma]
tags: [orm, drizzle, prisma]
excerpt: "Drizzle ganhou tração em 2025-26: SQL-first, sem runtime engine, edge-friendly. Prisma ainda válido pra DX e migrations maduras."
related: [repository-pattern, n-plus-1, postgres-erp-checklist]
updated: 2026-04
---

## Onde cada um brilha

| | Drizzle | Prisma |
|---|---|---|
| Modelo | TS puro (schema em código) | DSL (`schema.prisma`) |
| Queries | SQL-like (similar a knex) | API fluente |
| Performance | Sem runtime intermediário, perto do node-postgres | Prisma engine (Rust) — bom, mas latência de cold start |
| Edge runtime | ✅ nativo | ⚠️ melhorou em 2025/26 mas mais pesado |
| Migrations | `drizzle-kit` (boa, evolui) | maduro, com migrate dev/deploy bem rodados |
| Type safety | Excelente | Excelente |
| DX em queries complexas | Mais perto do SQL real (bom pra quem manja) | Abstrai mais (bom pra quem não manja) |
| Multi-schema (tenant) | Suporte direto | Trabalhoso |

## Recomendação

- **Projeto novo, time conhece SQL, multi-tenant com schemas, edge/serverless**: Drizzle.
- **Time prefere DSL declarativo, queries simples, infra tradicional, gosta de migrations Prisma**: Prisma.

Ambos servem. Não troque de um pra outro a cada hype.

## Drizzle — exemplo

```ts
// schema
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  tenantCreatedIdx: index("inv_tenant_created").on(t.tenantId, t.createdAt),
}));

// query
const rows = await db.select().from(invoices)
  .where(and(eq(invoices.tenantId, tenant), eq(invoices.status, "open")))
  .orderBy(desc(invoices.createdAt))
  .limit(50);
```

## Prisma — exemplo

```prisma
model Invoice {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  total     Decimal  @db.Decimal(14,2)
  status    String
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, createdAt])
  @@map("invoices")
}
```

```ts
const rows = await prisma.invoice.findMany({
  where: { tenantId: tenant, status: "open" },
  orderBy: { createdAt: "desc" }, take: 50,
});
```

## Migrations

Ambos geram migrations a partir do schema. Em ambos, **revise o SQL gerado** antes de aplicar em produção. Migrations sem-downtime é trabalho seu, não da ferramenta.

## Como pedir pra IA

> "Modele o schema Drizzle para módulo `financeiro` (invoices + payments + ledger entries). Use UUID v7 (helper externo) como PK. Multi-tenant com `tenantId` em todas. Defina índices `(tenantId, status, dueDate)` e `(tenantId, customerId)`. Crie `DrizzleInvoiceRepository` que implementa `InvoiceRepository` (interface no domain). Mapeamento explícito row ↔ entidade."

## Auditoria

- [ ] Você escolheu por motivo claro (não hype).
- [ ] Migrations geradas são REVISADAS, não aplicadas cegamente.
- [ ] Tipos TypeScript do schema combinam com domain (ou há mapeamento explícito).
- [ ] Queries de leitura pesada estão otimizadas (com `EXPLAIN`), independente do ORM.
