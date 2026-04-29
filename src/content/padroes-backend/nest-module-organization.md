---
title: "Organização de módulos no NestJS"
category: padroes-backend
stack: [NestJS]
tags: [nest, organização, modular]
excerpt: "Um módulo Nest = um bounded context. Não um por feature minúscula. Public API explícita pra quem importa."
related: [modular-monolith, clean-architecture, repository-pattern, use-cases]
updated: 2026-04
---

## Granularidade

❌ Errado: módulo por arquivo (`user-service.module`, `user-controller.module`).
❌ Errado: módulo gigante (`AppModule` com 50 services).
✅ Certo: **módulo por bounded context** (`FinanceiroModule`, `EstoqueModule`, `AuthModule`, `RelatoriosModule`).

Dentro do módulo, sub-pastas por camada (não por feature).

## Estrutura recomendada

```
src/modules/financeiro/
├── financeiro.module.ts
├── financeiro.public-api.ts       # interface exposta pra outros módulos
├── domain/
│   ├── invoice.entity.ts
│   ├── ports/invoice.repository.ts
├── application/
│   ├── create-invoice.usecase.ts
│   ├── settle-invoice.usecase.ts
├── infrastructure/
│   ├── drizzle-invoice.repository.ts
│   ├── financeiro.public-api.impl.ts
├── http/
│   ├── invoice.controller.ts
│   ├── dtos/
└── tests/
```

## PublicApi explícita

Outros módulos NÃO podem importar `CreateInvoiceUseCase` direto. Eles importam `FinanceiroPublicApi`:

```ts
// financeiro.public-api.ts
export abstract class FinanceiroPublicApi {
  abstract criarFatura(input: CriarFaturaInput): Promise<FaturaResumo>;
  abstract buscarFatura(id: string): Promise<FaturaResumo | null>;
}

// financeiro.module.ts
@Module({
  providers: [
    CreateInvoiceUseCase,
    SettleInvoiceUseCase,
    DrizzleInvoiceRepository,
    { provide: InvoiceRepository, useExisting: DrizzleInvoiceRepository },
    { provide: FinanceiroPublicApi, useClass: FinanceiroPublicApiImpl },
  ],
  exports: [FinanceiroPublicApi],   // SÓ a public API sai
})
export class FinanceiroModule {}
```

Outros módulos: `constructor(private readonly financeiro: FinanceiroPublicApi)`. Não conhecem nada do interior.

## Reforço por lint

ESLint rule (`eslint-plugin-boundaries` ou regras custom) ou `dependency-cruiser` pra falhar build se alguém importar `modules/financeiro/application/*` de fora.

## Shared

Crie `shared/` pra coisas verdadeiramente comuns (`Result<T>`, decorators de auth, paginação). Cuidado pra não virar lixeira.

Coisas técnicas reutilizáveis (logger, error filter) ficam em `infra/` ou módulos `core/`.

## Bootstrap

`AppModule` só importa os módulos de domínio + módulos transversais (`AuthModule`, `LoggingModule`). Sem providers diretos.

## Como pedir pra IA

> "Crie `EstoqueModule` no nosso Nest seguindo nosso padrão: pasta `modules/estoque` com `domain/application/infrastructure/http`, `EstoquePublicApi` exposta. O módulo só exporta `EstoquePublicApi`. Inclua exemplo: `FinanceiroModule` consumindo `EstoquePublicApi.baixarItens(...)` em vez de importar diretamente. Adicione regra ESLint que falha se outro módulo importar `modules/estoque/**` que não seja `public-api`."

## Auditoria

- [ ] Cada módulo de negócio exporta SOMENTE sua `PublicApi`.
- [ ] Outros módulos só dependem de `PublicApi` (verificável por lint).
- [ ] Estrutura de pastas por camada (domain/app/infra/http), não por feature CRUD.
- [ ] Sem `forwardRef` entre módulos de domínio (sintoma de fronteira errada).
- [ ] Migrations e schemas separados por módulo (prefixo de tabela ou schema).
- [ ] Testes por módulo, não pasta `tests/` global.

## Anti-padrões

- `AppModule` importando 50 providers diretamente.
- Módulo "shared" com tudo dentro.
- Service do módulo A injetando repository do módulo B (deveria ir via PublicApi).
- Módulo sem `exports` (esconde tudo) ou exportando tudo (sem encapsulamento).
