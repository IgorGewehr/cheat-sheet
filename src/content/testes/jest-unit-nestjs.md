---
title: "Jest — Unit Testing em NestJS com TypeScript"
category: testes
stack: [NestJS, Jest, TypeScript]
tags: [jest, unit-test, mock, spy, nestjs]
excerpt: "Unit tests em NestJS sem subir o framework. Use TestingModule só em integration tests. Fakes > mocks pra lógica de domínio."
related: [tdd-red-green-refactor, nestjs-integration-testing, use-cases, repository-pattern]
updated: "2026-05"
---

## Setup jest.config no NestJS

```ts
// jest.config.ts
import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: { "^.+\\.(t|j)s$": "ts-jest" },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

export default config;
```

## Padrão: use case com fakes (sem TestingModule)

Para use cases, controllers e domain logic — **não precisa de Nest**:

```ts
// pedido.spec.ts
import { CriarPedidoUseCase } from "./criar-pedido.usecase";

// Fake em memória — implementação real, sem jest.fn()
class InMemoryPedidoRepository implements PedidoRepository {
  private store = new Map<string, Pedido>();
  async save(p: Pedido) { this.store.set(p.id, p); }
  async findById(id: string) { return this.store.get(id) ?? null; }
  getAll() { return [...this.store.values()]; }
}

describe("CriarPedidoUseCase", () => {
  let repo: InMemoryPedidoRepository;
  let useCase: CriarPedidoUseCase;

  beforeEach(() => {
    repo = new InMemoryPedidoRepository();
    useCase = new CriarPedidoUseCase(repo, new InMemoryProdutoRepository(), new InMemoryEventBus());
  });

  // testes aqui
});
```

## Quando usar jest.fn() (mocks)

Use mocks para dependências **externas e sem lógica**: envio de email, chamada HTTP, clock.

```ts
const emailService = { enviarConfirmacao: jest.fn().mockResolvedValue(undefined) };
const useCase = new ProcessarPedidoUseCase(repo, emailService);

await useCase.execute({ pedidoId: "p1" });

expect(emailService.enviarConfirmacao).toHaveBeenCalledWith(
  expect.objectContaining({ para: "cliente@email.com" })
);
```

## Testando com spies — comportamento real + observação

```ts
const repo = new InMemoryPedidoRepository();
const saveSpy = jest.spyOn(repo, "save");

await useCase.execute(input);

expect(saveSpy).toHaveBeenCalledTimes(1);
// O save original rodou — só observamos
```

## Testando entidades de domínio (sem DI)

```ts
// pedido.entity.spec.ts
describe("Pedido.cancelar()", () => {
  it("cancela pedido pendente", () => {
    const pedido = Pedido.criar({ clienteId: "c1", itens: [fakeItem()] });
    pedido.cancelar("motivo");
    expect(pedido.status).toBe("cancelado");
    expect(pedido.domainEvents).toContainEqual(
      expect.objectContaining({ type: "PedidoCancelado" })
    );
  });

  it("lança erro ao cancelar entregue", () => {
    const pedido = pedidoEntregueFactory();
    expect(() => pedido.cancelar("motivo")).toThrow(PedidoJaEntregueError);
  });
});
```

## Testando com tempo controlado

```ts
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-01-15T10:00:00Z"));
});

afterEach(() => jest.useRealTimers());

it("exige data no futuro", () => {
  expect(() => Agendamento.criar({ data: new Date("2026-01-14") }))
    .toThrow(DataPassadaError);
});
```

## Cobertura que importa

Não corra atrás de 100% de cobertura de linhas. **Cubra comportamentos:**

```ts
// cada branch de if/else com comportamento diferente
// cada erro de domínio lançado
// cada evento publicado
// cada edge case de negócio (zero, negativo, limite máximo)
```

Configuração recomendada (não bloqueia CI em cobertura artificial):

```json
// package.json
{
  "jest": {
    "coverageThreshold": {
      "global": { "branches": 70, "functions": 80, "lines": 80 }
    }
  }
}
```

## Organização dos arquivos de teste

```
src/modules/financeiro/
├── application/
│   ├── criar-fatura.usecase.ts
│   └── criar-fatura.usecase.spec.ts   ← ao lado do arquivo
├── domain/
│   ├── fatura.entity.ts
│   └── fatura.entity.spec.ts
└── tests/
    └── fakes/
        ├── in-memory-fatura.repository.ts
        └── in-memory-event-bus.ts
```

Fakes ficam em `tests/fakes/` e são importados por múltiplos specs do módulo.

## Como pedir pra IA

> "Dado esses testes que já escrevi para `LiquidarFaturaUseCase` [cole os specs], implemente a classe e as entidades de domínio necessárias. Use `InMemoryFaturaRepository` que já existe em `tests/fakes/`. Não use banco de dados, não use TestingModule."

## Auditoria

- [ ] Tests de use case e entity não importam nada de `@nestjs/*`.
- [ ] Fakes existem como classes, não como objetos `jest.fn()` avulsos.
- [ ] Cada comportamento tem um `it()` próprio com nome descritivo.
- [ ] `jest.fn()` só para dependências externas (email, HTTP, S3).
- [ ] `afterEach(() => jest.clearAllMocks())` no setup global.

## Anti-padrões

- `jest.mock("../repository")` no topo do arquivo para repositório de domínio — use fake.
- `expect(result).toBeDefined()` como único assert — não testa nada de negócio.
- Testar os internos de implementação (espiar propriedades privadas).
- Shared mutable state entre testes (`let pedido: Pedido` no `describe` sem `beforeEach`).
