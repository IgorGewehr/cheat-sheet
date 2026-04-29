---
title: "Prompt: módulo CRUD genérico em NestJS"
category: prompts
stack: [NestJS, PostgreSQL, Drizzle]
tags: [crud, prompt, nest]
excerpt: "Template enxuto pra módulos CRUD onde regra de negócio é fina. Não vire engenharia em demasia, mas mantenha padrão."
related: [prompt-modulo-financeiro, nest-module-organization, dto-validation]
updated: 2026-04
---

## Quando usar

Pra módulos onde a regra é simples: cadastro de fornecedor, categoria, configuração. Não invente DDD onde não tem domínio.

## Prompt template

> Crie um módulo CRUD `<nome>` no nosso Nest 11 + Drizzle, multi-tenant.
>
> **Estrutura**:
> ```
> src/modules/<nome>/
> ├── <nome>.module.ts
> ├── <nome>.public-api.ts        # interface exposta
> ├── http/<nome>.controller.ts
> ├── http/dtos/                  # zod schemas (importados de packages/shared)
> ├── data/<nome>.schema.ts       # drizzle table
> ├── data/<nome>.repository.ts   # query helpers
> └── service/<nome>.service.ts   # uso simples; sem use cases separados (CRUD)
> ```
>
> **Tabela**:
> - UUID v7 PK, `tenant_id`, `branch_id` (se aplicável), `created_at`/`updated_at` TIMESTAMPTZ, `deleted_at` (soft delete).
> - Constraints: NOT NULL no que precisa, único parcial ignorando `deleted_at`.
> - Índices: `(tenant_id, ...)` óbvios.
>
> **Endpoints REST**:
> - `GET /<nome>` (lista paginada, filtros básicos via query string, ordenação)
> - `GET /<nome>/:id`
> - `POST /<nome>` (cria)
> - `PATCH /<nome>/:id` (atualização parcial)
> - `DELETE /<nome>/:id` (soft delete)
>
> **Validação**: zod schemas em `packages/shared/<nome>-schemas.ts`. ZodValidationPipe. 400 com issues estruturadas.
>
> **Auth**: guard `@RequirePermission('<nome>.<action>')`. Por padrão filtra por filial conforme `session.scope`.
>
> **Audit**: toda mutação loga em `audit_log` com diff.
>
> **Tests**: 1 teste por endpoint; integração com Postgres real (testcontainers).
>
> **NÃO faça**:
> - Use cases separados se a regra é só "CRUD com validação".
> - Repository em pasta `domain/ports` (não há domínio rico aqui).
> - Eventos de domínio se não há consumidor previsto.
>
> Mantenha enxuto, fácil de ler.

## Como auditar

- [ ] Toda query filtra por `tenant_id` (e branch quando aplicável).
- [ ] Soft delete funciona; constraints únicos ignoram deletados.
- [ ] Endpoints validam input com zod.
- [ ] PublicApi exposta minimamente; service interno não vaza.
- [ ] Sem boilerplate desnecessário (não criou DDD onde não precisa).
- [ ] Audit log gravando.
- [ ] Permissions definidas e testadas.
