---
title: "Drizzle ORM — Schema, Queries, Migrations e Transações"
category: banco
stack: [PostgreSQL, Drizzle, NestJS, TypeScript]
tags: [drizzle, orm, schema, migrations, transactions, queries, postgresql]
excerpt: "Referência completa de Drizzle: definir schema com tipos corretos, queries SQL-like com segurança de tipos, migrations com drizzle-kit, transações."
related: [drizzle-vs-prisma-2026, repository-pattern, n-plus-1, migrations-zero-downtime, postgres-indexes-explain]
updated: "2026-05"
---

## Schema — definindo tabelas

```ts
// src/db/schema.ts
import {
  pgTable, uuid, text, numeric, timestamp, boolean,
  integer, pgEnum, index, uniqueIndex, primaryKey,
} from "drizzle-orm/pg-core";

// Enum PostgreSQL nativo
export const pedidoStatusEnum = pgEnum("pedido_status", [
  "pendente", "confirmado", "cancelado", "entregue",
]);

export const clientes = pgTable("clientes", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tenantId:   uuid("tenant_id").notNull(),
  nome:       text("nome").notNull(),
  email:      text("email").notNull(),
  ativo:      boolean("ativo").notNull().default(true),
  criadoEm:   timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  tenantIdx:       index("cli_tenant_idx").on(t.tenantId),
  emailUnicoIdx:   uniqueIndex("cli_email_unique").on(t.tenantId, t.email),
}));

export const pedidos = pgTable("pedidos", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tenantId:   uuid("tenant_id").notNull(),
  clienteId:  uuid("cliente_id").notNull().references(() => clientes.id),
  status:     pedidoStatusEnum("status").notNull().default("pendente"),
  total:      numeric("total", { precision: 14, scale: 2 }).notNull(),
  criadoEm:   timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  tenantClienteIdx: index("ped_tenant_cliente").on(t.tenantId, t.clienteId),
  tenantStatusIdx:  index("ped_tenant_status").on(t.tenantId, t.status),
}));

export const pedidoItens = pgTable("pedido_itens", {
  pedidoId:   uuid("pedido_id").notNull().references(() => pedidos.id, { onDelete: "cascade" }),
  produtoId:  uuid("produto_id").notNull(),
  quantidade: integer("quantidade").notNull(),
  precoUnit:  numeric("preco_unit", { precision: 14, scale: 2 }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.pedidoId, t.produtoId] }),
}));
```

## Tipos inferidos

```ts
// Tipo de uma row do banco (coluna a coluna)
export type Cliente = typeof clientes.$inferSelect;
// { id: string; tenantId: string; nome: string; email: string; ativo: boolean; ... }

// Tipo para INSERT (campos opcionais com default ficam opcionais)
export type NewCliente = typeof clientes.$inferInsert;
// { id?: string; tenantId: string; nome: string; email: string; ativo?: boolean; ... }
```

## Queries básicas

```ts
import { db } from "@/db";
import { eq, and, or, like, gte, lte, desc, asc, count, sql } from "drizzle-orm";

// SELECT com filtro
const lista = await db.select()
  .from(pedidos)
  .where(and(
    eq(pedidos.tenantId, tenantId),
    eq(pedidos.status, "pendente"),
  ))
  .orderBy(desc(pedidos.criadoEm))
  .limit(50)
  .offset(page * 50);

// SELECT campos específicos (evita over-fetching)
const resumos = await db.select({
  id: pedidos.id,
  status: pedidos.status,
  total: pedidos.total,
  clienteNome: clientes.nome,
})
.from(pedidos)
.leftJoin(clientes, eq(pedidos.clienteId, clientes.id))
.where(eq(pedidos.tenantId, tenantId));

// INSERT
const [novoPedido] = await db.insert(pedidos)
  .values({ tenantId, clienteId, total: "1500.00" })
  .returning();  // retorna a row inserida

// UPDATE
await db.update(pedidos)
  .set({ status: "confirmado", atualizadoEm: new Date() })
  .where(and(eq(pedidos.id, pedidoId), eq(pedidos.tenantId, tenantId)));

// DELETE
await db.delete(pedidos)
  .where(and(eq(pedidos.id, pedidoId), eq(pedidos.tenantId, tenantId)));
```

## JOIN com tipagem completa

```ts
const pedidosComCliente = await db
  .select({
    pedido: pedidos,     // spread: traz todas as colunas de pedidos
    cliente: {
      nome: clientes.nome,
      email: clientes.email,
    },
  })
  .from(pedidos)
  .innerJoin(clientes, eq(pedidos.clienteId, clientes.id))
  .where(eq(pedidos.tenantId, tenantId));

// Tipo inferido automaticamente:
// { pedido: Pedido; cliente: { nome: string; email: string } }[]
```

## Contagem e paginação

```ts
const [{ total }] = await db
  .select({ total: count() })
  .from(pedidos)
  .where(eq(pedidos.tenantId, tenantId));

const items = await db.select()
  .from(pedidos)
  .where(eq(pedidos.tenantId, tenantId))
  .limit(pageSize)
  .offset(page * pageSize);

return { items, total: Number(total), page, pageSize };
```

## CTEs — `$with` para queries complexas

```ts
const topClientes = db.$with("top_clientes").as(
  db.select({ clienteId: pedidos.clienteId, totalGasto: sql<string>`sum(${pedidos.total})` })
    .from(pedidos)
    .where(eq(pedidos.tenantId, tenantId))
    .groupBy(pedidos.clienteId)
    .having(sql`sum(${pedidos.total}) > 10000`)
);

const resultado = await db
  .with(topClientes)
  .select({ nome: clientes.nome, totalGasto: topClientes.totalGasto })
  .from(topClientes)
  .innerJoin(clientes, eq(topClientes.clienteId, clientes.id))
  .orderBy(desc(sql`${topClientes.totalGasto}::numeric`));
```

## Transações

```ts
// Transação simples — rollback automático se der erro
const resultado = await db.transaction(async (tx) => {
  const [pedido] = await tx.insert(pedidos)
    .values({ tenantId, clienteId, total: "0" })
    .returning();

  const itens = await tx.insert(pedidoItens)
    .values(inputItens.map(i => ({ pedidoId: pedido.id, ...i })))
    .returning();

  const total = itens.reduce((acc, i) => acc + Number(i.precoUnit) * i.quantidade, 0);

  await tx.update(pedidos)
    .set({ total: total.toFixed(2) })
    .where(eq(pedidos.id, pedido.id));

  return { pedido, itens };
});

// Transação com nível de isolamento
await db.transaction(async (tx) => {
  // lógica aqui
}, { isolationLevel: "serializable" });
```

## Migrations com drizzle-kit

```ts
// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",          // pasta onde ficam os .sql de migration
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

```bash
# Gera migration a partir da diferença entre schema e banco atual
npx drizzle-kit generate

# Aplica migrations pendentes
npx drizzle-kit migrate

# Verifica o que seria gerado (dry-run)
npx drizzle-kit diff

# Studio — UI pra inspecionar o banco
npx drizzle-kit studio
```

**Sempre revise o SQL gerado** em `drizzle/` antes de aplicar. Drizzle pode gerar DROP COLUMN se você renomeou — o nome correto da operação seria RENAME.

## Integração com NestJS via módulo

```ts
// db/database.module.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export const DB = Symbol("DRIZZLE_DB");
export type Database = ReturnType<typeof drizzle<typeof schema>>;

@Global()
@Module({
  providers: [
    {
      provide: DB,
      useFactory: (config: AppConfigService) => {
        const pool = new Pool({ connectionString: config.databaseUrl, max: 10 });
        return drizzle(pool, { schema });
      },
      inject: [AppConfigService],
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}

// Em um repository:
@Injectable()
export class DrizzlePedidoRepository implements PedidoRepository {
  constructor(@Inject(DB) private db: Database) {}

  async findById(id: string): Promise<Pedido | null> {
    const [row] = await this.db.select().from(schema.pedidos).where(eq(schema.pedidos.id, id));
    return row ? this.toDomain(row) : null;
  }
}
```

## Como pedir pra IA

> "Crie schema Drizzle para módulo `estoque` (produtos + movimentações). Produto: uuid PK, tenantId (notNull), nome, sku (unique por tenant), preco (numeric 14,2), estoqueAtual (integer). Movimentação: id, produtoId (FK cascade), tipo (enum 'entrada'|'saida'), quantidade, criadoEm. Índices: (tenantId, sku) unique, (tenantId, criadoEm). Inclua `$inferSelect` e `$inferInsert` exportados como tipos. Sem migrations — só o schema.ts."

## Auditoria

- [ ] `numeric` para valores monetários (nunca `float/real`).
- [ ] `timestamp` sempre com `{ withTimezone: true }`.
- [ ] UUIDs como PK — `uuid().primaryKey().defaultRandom()`.
- [ ] Índices compostos incluem `tenantId` primeiro (queries filtram sempre por tenant).
- [ ] Migrations revisadas antes de aplicar em produção.
- [ ] Repository mapeia row → domain entity (sem vazar tipos de schema para o domínio).

## Anti-padrões

- `float` ou `double precision` para dinheiro — arredondamento acumula erro.
- `timestamp` sem timezone — comportamento inconsistente em servidores com timezone diferente.
- Queries sem filtro por `tenantId` em sistema multi-tenant.
- Usar `db` diretamente no use case (deveria ser via repository).
- `select()` sem campos específicos quando só precisa de 3 colunas de tabela com 20.
