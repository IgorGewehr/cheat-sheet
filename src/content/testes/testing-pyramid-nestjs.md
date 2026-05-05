---
title: "Pirâmide de Testes — NestJS + Next.js"
category: testes
stack: [NestJS, Next.js, Jest, Playwright, TypeScript]
tags: [testing-pyramid, estrategia-testes, cobertura, ci-cd]
excerpt: "Muitos unit tests, alguns integration, poucos E2E. Cada camada tem um custo e um contrato."
related: [tdd-red-green-refactor, jest-unit-nestjs, nestjs-integration-testing, playwright-nextjs]
updated: "2026-05"
---

## A pirâmide

```
         /‾‾‾‾‾‾‾‾‾‾‾\
        /   E2E (5%)   \       Playwright — fluxos completos de usuário
       /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
      /  Integration (25%) \   Supertest — rotas HTTP + banco real
     /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
    /      Unit (70%)        \  Jest — use cases, entities, domain logic
   /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
```

**Custo**: E2E > Integration > Unit  
**Velocidade**: Unit < Integration < E2E  
**Confiança sobre UI**: E2E > Integration > Unit

## O que vai em cada camada

### Unit (70%) — sem framework, sem banco

| O que testar | Exemplo |
|---|---|
| Use cases | `CriarPedidoUseCase` com fakes em memória |
| Entidades de domínio | `Pedido.cancelar()`, `Fatura.liquidar()` |
| Value Objects | `CPF.validar()`, `Dinheiro.somar()` |
| Funções puras | helpers, formatters, validators |
| Guards e Pipes isolados | `RolesGuard` com `Reflector` fake |

**Ferramentas**: Jest + InMemory fakes. Roda em < 1s por arquivo.

### Integration (25%) — Nest real, banco real

| O que testar | Exemplo |
|---|---|
| Rotas HTTP | `POST /pedidos` 201 + 400 + 401 |
| Autenticação/autorização | Guard bloqueando rota sem role |
| Serialização de DTO | response body com campos corretos |
| Migrations e queries | queries Drizzle contra PostgreSQL real |
| Event listeners | job acionado após evento |

**Ferramentas**: TestingModule + Supertest + PostgreSQL de teste. Roda em segundos por suite.

### E2E (5%) — browser real, app completo

| O que testar | Exemplo |
|---|---|
| Fluxos críticos de negócio | Login → criar pedido → ver na listagem |
| Casos de regressão visuais | Layout não quebrou após refator |
| Integrações de terceiros | Webhook chegando → estado atualizado |

**Ferramentas**: Playwright. Roda em minutos. Só no CI de staging.

## Configuração de scripts npm

```json
{
  "scripts": {
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:integration": "dotenv -e .env.test -- jest --config jest.integration.config.ts --runInBand",
    "test:e2e": "playwright test",
    "test:all": "npm test && npm run test:integration && npm run test:e2e"
  }
}
```

## jest.config separados

```ts
// jest.config.ts — unit tests (padrão)
export default {
  testRegex: ".*\\.spec\\.ts$",
  testPathIgnorePatterns: ["\\.integration\\.spec\\.ts$"],
};

// jest.integration.config.ts
export default {
  testRegex: ".*\\.integration\\.spec\\.ts$",
  testEnvironment: "node",
};
```

## CI/CD pipeline de testes

```yaml
# .github/workflows/test.yml
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - run: npm ci
      - run: npm test -- --ci --coverage

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_DB: brain_test, POSTGRES_PASSWORD: postgres }
        ports: ["5432:5432"]
    steps:
      - run: npm ci
      - run: npm run test:integration
    env:
      TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/brain_test

  e2e:
    runs-on: ubuntu-latest
    needs: [unit, integration]   # só roda se os anteriores passaram
    steps:
      - run: npm ci && npx playwright install --with-deps
      - run: npm run build && npm run start:test &
      - run: npm run test:e2e
```

## Frontend (Next.js) — pirâmide análoga

| Camada | Ferramenta | O que testar |
|---|---|---|
| Unit | Jest + React Testing Library | Hooks com lógica, Server Actions, formatters |
| Component | RTL | Componentes com estado relevante |
| E2E | Playwright | Fluxos completos no browser |

**Não testar**: componentes puramente de layout sem lógica. Regressions visuais ficam com Playwright + screenshots.

## Como decidir onde colocar um teste

1. **Lógica pura sem dependência de infra** → unit test.
2. **Depende de DI, HTTP ou banco** → integration test.
3. **Depende de comportamento de usuário no browser** → E2E.
4. **Depende de timing, animações, visual** → Playwright com screenshots.

## Auditoria

- [ ] Novos use cases têm unit tests antes de ir pra review.
- [ ] Rotas novas têm pelo menos 1 integration test (happy + 401).
- [ ] E2E cobre os 3 fluxos mais críticos do produto.
- [ ] CI falha se unit ou integration quebrarem.
- [ ] Tempo de unit suite < 30s, integration < 2min.

## Anti-padrões

- "Vou testar tudo com E2E" — lento, frágil, diagnóstico difícil.
- Testar implementação em vez de comportamento (testes que quebram em refactor sem mudar comportamento).
- Cobertura de linhas como KPI principal — linha coberta ≠ comportamento testado.
- Skip em CI para "agilizar o build" — o skip vira regra permanente.
