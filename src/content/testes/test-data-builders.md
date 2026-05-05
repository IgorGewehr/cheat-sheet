---
title: "Test Data Builders — Fakes, Factories e Seeds"
category: testes
stack: [NestJS, Jest, TypeScript, Drizzle]
tags: [test-data, builder-pattern, object-mother, factories, seeds, fixtures]
excerpt: "Dados de teste hardcoded em linha são frágeis. Builder pattern centraliza criação, permite override cirúrgico e elimina estado compartilhado entre testes."
related: [jest-unit-nestjs, nestjs-integration-testing, tdd-red-green-refactor, drizzle-schema-queries]
updated: "2026-05"
---

## O problema sem builders

```ts
// ❌ Dados espalhados em cada teste — frágil e repetitivo
it("cancela pedido", async () => {
  const pedido = new Pedido({
    id: "p1",
    clienteId: "c1",
    tenantId: "t1",
    status: "pendente",
    total: 1000,
    itens: [{ produtoId: "prod1", quantidade: 2, precoUnit: 500 }],
    criadoEm: new Date("2026-01-01"),
  });
  // Mudar a assinatura do construtor quebra 40 testes
});
```

```ts
// ✅ Builder com override cirúrgico — só muda o que importa pro teste
it("cancela pedido", async () => {
  const pedido = buildPedido({ status: "pendente" });
  // Campos irrelevantes têm defaults sensatos
});
```

## Padrão: Builder com defaults inteligentes

```ts
// tests/builders/pedido.builder.ts
import { Pedido, PedidoItem } from "@/modules/pedidos/domain/pedido.entity";

type PedidoOverrides = Partial<{
  id: string;
  clienteId: string;
  tenantId: string;
  status: "pendente" | "confirmado" | "cancelado" | "entregue";
  total: number;
  itens: PedidoItem[];
}>;

export function buildPedido(overrides: PedidoOverrides = {}): Pedido {
  return Pedido.reconstituir({
    id: overrides.id ?? "ped-" + nanoid(8),
    clienteId: overrides.clienteId ?? "cli-default",
    tenantId: overrides.tenantId ?? "tenant-default",
    status: overrides.status ?? "pendente",
    total: overrides.total ?? 1000,
    itens: overrides.itens ?? [buildPedidoItem()],
    criadoEm: new Date("2026-01-15T10:00:00Z"),
  });
}

export function buildPedidoItem(overrides: Partial<PedidoItem> = {}): PedidoItem {
  return {
    produtoId: overrides.produtoId ?? "prod-default",
    quantidade: overrides.quantidade ?? 1,
    precoUnit: overrides.precoUnit ?? 1000,
  };
}

// Variantes semânticas para estados específicos
export const pedidoEntregue = (overrides: PedidoOverrides = {}) =>
  buildPedido({ ...overrides, status: "entregue" });

export const pedidoCancelado = (overrides: PedidoOverrides = {}) =>
  buildPedido({ ...overrides, status: "cancelado" });
```

## Uso em testes — override só do que importa

```ts
import { buildPedido, pedidoEntregue } from "@/tests/builders/pedido.builder";

describe("Pedido.cancelar()", () => {
  it("cancela pedido pendente", () => {
    const pedido = buildPedido({ status: "pendente" });
    pedido.cancelar("motivo");
    expect(pedido.status).toBe("cancelado");
  });

  it("lança erro ao cancelar pedido entregue", () => {
    const pedido = pedidoEntregue();
    expect(() => pedido.cancelar("motivo")).toThrow(PedidoJaEntregueError);
  });

  it("cancela pedido de cliente específico", () => {
    const pedido = buildPedido({ clienteId: "cli-vip", status: "pendente" });
    pedido.cancelar("cliente solicitou");
    expect(pedido.clienteId).toBe("cli-vip");
  });
});
```

## Factories para InMemory repositories

O builder cria entidades de domínio. A factory popula o repositório em memória:

```ts
// tests/fakes/in-memory-pedido.repository.ts
export class InMemoryPedidoRepository implements PedidoRepository {
  private store = new Map<string, Pedido>();

  async save(p: Pedido) { this.store.set(p.id, p); }
  async findById(id: string) { return this.store.get(id) ?? null; }
  async findByTenant(tenantId: string) {
    return [...this.store.values()].filter((p) => p.tenantId === tenantId);
  }
  getAll() { return [...this.store.values()]; }
  clear() { this.store.clear(); }

  // Helper: pre-popula o repositório com N pedidos
  withPedidos(...pedidos: Pedido[]) {
    pedidos.forEach((p) => this.store.set(p.id, p));
    return this; // fluent
  }
}

// Uso:
const repo = new InMemoryPedidoRepository().withPedidos(
  buildPedido({ id: "p1", status: "pendente" }),
  buildPedido({ id: "p2", status: "confirmado" }),
);
```

## Seeds para integration tests (banco real)

Seeds inserem dados no PostgreSQL de teste via Drizzle. Fácil de chamar em `beforeEach`:

```ts
// tests/seeds/pedido.seed.ts
import { db } from "@/db";
import * as schema from "@/db/schema";

export async function seedCliente(overrides: Partial<typeof schema.clientes.$inferInsert> = {}) {
  const [row] = await db.insert(schema.clientes).values({
    id: nanoid(),
    tenantId: "tenant-test",
    nome: "Cliente Teste",
    email: `cliente-${nanoid(4)}@test.com`,
    ...overrides,
  }).returning();
  return row;
}

export async function seedPedido(
  clienteId: string,
  overrides: Partial<typeof schema.pedidos.$inferInsert> = {},
) {
  const [row] = await db.insert(schema.pedidos).values({
    id: nanoid(),
    tenantId: "tenant-test",
    clienteId,
    status: "pendente",
    total: "1000.00",
    ...overrides,
  }).returning();
  return row;
}
```

```ts
// integration test usando seeds
describe("GET /pedidos (integration)", () => {
  let cliente: typeof schema.clientes.$inferSelect;

  beforeEach(async () => {
    await cleanTestDb(db);
    cliente = await seedCliente({ nome: "João Silva" });
    await seedPedido(cliente.id, { status: "pendente" });
    await seedPedido(cliente.id, { status: "confirmado" });
  });

  it("lista pedidos do cliente", async () => {
    const res = await request(app.getHttpServer())
      .get(`/pedidos?clienteId=${cliente.id}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
  });
});
```

## Organização dos arquivos

```
src/
  modules/pedidos/
    domain/
      pedido.entity.ts
      pedido.entity.spec.ts        ← usa builders
    application/
      criar-pedido.usecase.spec.ts ← usa builders + InMemory
    tests/
      builders/
        pedido.builder.ts          ← builders de domínio (unit tests)
      fakes/
        in-memory-pedido.repository.ts
        in-memory-event-bus.ts

test/                              ← integration e E2E (fora de src/)
  seeds/
    pedido.seed.ts                 ← seeds de banco (integration tests)
    cliente.seed.ts
  helpers/
    create-test-app.ts
    clean-test-db.ts
```

## Gerando IDs únicos sem `uuid()`

```ts
// Para testes, IDs previsíveis facilitam debug:
export function testId(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// Uso:
buildPedido({ id: testId("pedido") })
// → "pedido-1714924800000-x7k2"
// Legível no erro, único entre testes paralelos
```

## Regra de ouro: defaults que nunca colidem

Builders com IDs fixos (`id: "pedido-1"`) causam conflito em testes paralelos ou sequenciais sem limpeza. Use sempre:

```ts
// ✅ IDs aleatórios por padrão
id: overrides.id ?? crypto.randomUUID()

// ✅ Emails únicos por padrão (colisão causa erro de unique constraint)
email: overrides.email ?? `test-${nanoid(6)}@test.com`

// ❌ IDs fixos — quebra em paralelo
id: overrides.id ?? "pedido-default"
```

## Como pedir pra IA

> "Crie builders para o módulo `financeiro`: `buildFatura({ status, clienteId, valor })` e `buildPagamento({ faturaId, valor })`. Defaults: id = `crypto.randomUUID()`, tenantId = 'tenant-test', status = 'pendente', valor = 1000. Crie variantes `faturaLiquidada()` e `faturaVencida()`. Crie também `InMemoryFaturaRepository` com método `withFaturas(...fats)` fluente e `seedFatura(clienteId, overrides)` para integration tests com Drizzle."

## Auditoria

- [ ] Builders existem para todas as entidades de domínio com testes.
- [ ] Nenhum ID fixo em builder sem override explícito — IDs sempre únicos por default.
- [ ] Seeds retornam a row inserida para uso nos testes.
- [ ] InMemory repositories têm método `clear()` ou `withX()` para setup rápido.
- [ ] Variantes semânticas (`pedidoEntregue`, `faturaVencida`) estão em builders, não duplicadas nos testes.

## Anti-padrões

- Builders que retornam objetos com IDs fixos hardcoded — testes falham em paralelo.
- Seeds que não fazem `returning()` — você não tem o ID gerado para usar nos asserts.
- Testes que modificam o objeto retornado pelo builder e afetam outros testes (shared state).
- `beforeAll` com seed compartilhado entre testes de estados diferentes — use `beforeEach`.
- Passar objeto inteiro de outro domínio como override em vez de só o ID (acopla domínios).
