---
title: "Integration Testing em NestJS — TestingModule + Supertest"
category: testes
stack: [NestJS, Jest, Supertest, Drizzle, PostgreSQL]
tags: [integration-test, nestjs, supertest, testingmodule, drizzle]
excerpt: "Sobe o módulo real com banco de teste. Testa o fluxo HTTP completo: controller → use case → repositório → DB."
related: [jest-unit-nestjs, tdd-red-green-refactor, nestjs-guards-interceptors, testing-pyramid-nestjs]
updated: "2026-05"
---

## Por que integration tests em Nest

Unit tests cobrem lógica isolada. Integration tests cobrem o fio completo:

```
POST /faturas → AuthGuard → ValidationPipe → Controller → UseCase → Repository → DB
```

Bugs de wiring de DI, guards mal configurados, serialização de DTO errada — só aparecem aqui.

## Setup do banco de teste

Use um banco PostgreSQL separado só pra testes, resetado a cada suite:

```ts
// test/helpers/test-db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "@/lib/db/schema";

export async function createTestDb() {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = drizzle(pool, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return { db, pool };
}

export async function cleanTestDb(db: ReturnType<typeof drizzle>) {
  // limpa na ordem inversa das foreign keys
  await db.delete(schema.pedidoItens);
  await db.delete(schema.pedidos);
  await db.delete(schema.clientes);
}
```

## Setup do TestingModule

```ts
// test/helpers/create-test-app.ts
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "@/app.module";
import { DomainErrorFilter } from "@/infra/filters/domain-error.filter";

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new DomainErrorFilter());
  await app.init();
  return app;
}
```

## Teste de rota completo

```ts
import * as request from "supertest";
import { INestApplication } from "@nestjs/common";
import { createTestApp } from "../helpers/create-test-app";
import { cleanTestDb } from "../helpers/test-db";

describe("POST /pedidos (integration)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanTestDb(app.get("DB"));
  });

  afterAll(async () => {
    await app.close();
  });

  it("cria pedido e retorna 201 com id", async () => {
    await seedCliente(app, "c1");
    await seedProduto(app, { id: "p1", preco: 100, estoque: 5 });

    const res = await request(app.getHttpServer())
      .post("/pedidos")
      .set("Authorization", `Bearer ${await getTestToken(app)}`)
      .send({ clienteId: "c1", itens: [{ produtoId: "p1", quantidade: 2 }] });

    expect(res.status).toBe(201);
    expect(res.body.pedidoId).toBeDefined();
  });

  it("retorna 400 com quantidade inválida", async () => {
    const res = await request(app.getHttpServer())
      .post("/pedidos")
      .set("Authorization", `Bearer ${await getTestToken(app)}`)
      .send({ clienteId: "c1", itens: [{ produtoId: "p1", quantidade: 0 }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("QuantidadeInvalidaError");
  });

  it("retorna 401 sem token", async () => {
    const res = await request(app.getHttpServer())
      .post("/pedidos")
      .send({ clienteId: "c1", itens: [] });

    expect(res.status).toBe(401);
  });
});
```

## Estratégia de banco de teste

### Opção A: banco compartilhado + limpeza por `beforeEach`
- Simples, funciona bem para suites pequenas
- `cleanTestDb()` precisa respeitar a ordem das foreign keys
- Problema: paralelismo pode causar conflito — use `--runInBand` no CI

### Opção B: schema por teste (isolamento real)
```ts
const schemaName = `test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
await db.execute(sql`CREATE SCHEMA ${sql.identifier(schemaName)}`);
// ... roda testes no schema isolado
await db.execute(sql`DROP SCHEMA ${sql.identifier(schemaName)} CASCADE`);
```

### Opção C: transactions revertidas (rápido)
```ts
beforeEach(async () => { await db.execute(sql`BEGIN`) });
afterEach(async () => { await db.execute(sql`ROLLBACK`) });
```

## Testando guards e autenticação

```ts
it("bloqueia rota sem ROLE_ADMIN", async () => {
  const token = await getTestToken(app, { role: "user" }); // não admin

  const res = await request(app.getHttpServer())
    .delete("/admin/usuarios/123")
    .set("Authorization", `Bearer ${token}`);

  expect(res.status).toBe(403);
});
```

## Variáveis de ambiente para testes

```env
# .env.test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/brain_test
JWT_SECRET=test-secret-key-not-for-production
```

```json
// package.json
{
  "scripts": {
    "test:integration": "dotenv -e .env.test -- jest --testRegex='.integration.spec.ts$' --runInBand"
  }
}
```

## Quanto cobrir com integration tests

Regra: **1 integration test por rota principal** cobrindo o caminho feliz + o erro mais comum. Os edge cases ficam nos unit tests do use case.

| Coverage alvo | Tipo |
|---|---|
| Lógica de domínio | Unit test (100%) |
| Wiring DI + pipeline HTTP | Integration (happy path + auth) |
| Fluxo completo usuário | E2E Playwright |

## Como pedir pra IA

> "Crie integration tests para `POST /pedidos` usando nosso padrão: `createTestApp()`, `supertest`, banco em `TEST_DATABASE_URL`. Cubra: 201 com dados válidos, 400 com quantidade 0 (retorna `QuantidadeInvalidaError`), 401 sem token, 422 com estoque insuficiente. Use `beforeEach(cleanTestDb)` e `beforeAll(createTestApp)`."

## Auditoria

- [ ] Cada rota crítica tem pelo menos 1 integration test cobrindo happy path.
- [ ] Auth (401/403) está coberta por integration test, não só por unit test do guard.
- [ ] Banco de teste é diferente do desenvolvimento (variável `TEST_DATABASE_URL`).
- [ ] `afterAll(() => app.close())` em todo arquivo de integration test.
- [ ] CI roda integration tests com `--runInBand` para evitar conflito de banco.

## Anti-padrões

- Subir `TestingModule` com todos os módulos da aplicação pra testar um use case — use instanciação direta.
- Integration tests sem limpeza de banco entre suites — produz testes que passam na ordem mas falham em paralelo.
- Mockar o banco nos integration tests — derrota o propósito.
- Tests que dependem de ordem de execução (um test cria dados que outro usa).
