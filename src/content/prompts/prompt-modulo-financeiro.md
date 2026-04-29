---
title: "Prompt: módulo financeiro completo"
category: prompts
stack: [NestJS, Next.js, PostgreSQL]
tags: [financeiro, prompt, erp]
excerpt: "Template testado pra pedir um módulo financeiro completo. Cobre regras, idempotência, auditoria, integração e checklist de saída."
related: [prompt-modulo-crud-nest, modular-monolith, outbox-pattern, soft-delete-audit]
updated: 2026-04
---

## Quando usar

Antes de pedir um módulo financeiro/contábil/contas-a-pagar/contas-a-receber pra IA, cole esse prompt como base e ajuste.

## Prompt template

> Você está implementando um módulo `financeiro` para nosso ERP. Stack: NestJS 11, PostgreSQL 17, Drizzle, monorepo Turbo.
>
> **Arquitetura obrigatória**:
> - Modular Monolith. O módulo segue Clean Architecture lite: `domain/application/infrastructure/http`.
> - Expor APENAS `FinanceiroPublicApi`. Nada de seus internals fora.
> - Domain puro TS — zero dependência de Nest/Drizzle/HTTP.
> - Multi-tenant: toda tabela tem `tenant_id`; queries respeitam contexto via RLS.
>
> **Domínio**:
> - Agregado raiz: `Lancamento` (pode ser a pagar ou a receber, com `direcao`).
> - Value objects: `Money` (NUMERIC(14,2), com soma/sub seguras, comparações), `DataDevida`, `Status` ('aberto'|'pago'|'parcialmente-pago'|'cancelado'|'estornado').
> - Regras invariantes:
>   - Não pode quitar lançamento `cancelado`.
>   - Soma de `Pagamento`s não pode exceder `valorTotal`.
>   - Estorno gera **lançamento contrário**, não muda valor original.
>   - Cancelamento só permitido se não tem pagamento.
>
> **Casos de uso (cada um em classe separada com `execute`)**:
> - `CriarLancamentoUseCase`
> - `RegistrarPagamentoUseCase` (idempotente via `pagamento.idempotencyKey`)
> - `CancelarLancamentoUseCase`
> - `EstornarPagamentoUseCase`
> - `ListarLancamentosQueryService` (CQRS-lite, SQL direto otimizado, com filtros e paginação cursor)
>
> **Persistência**:
> - Drizzle. Schema: `lancamentos`, `pagamentos`, `categorias_financeiras`. UUID v7 PK. NUMERIC(14,2) pra dinheiro. TIMESTAMPTZ. Soft delete (`deleted_at`).
> - Índices: `(tenant_id, status, data_devida)`, `(tenant_id, cliente_id)`, `(tenant_id, deleted_at)`.
>
> **Eventos** (publica via outbox):
> - `LancamentoCriado`, `LancamentoPago`, `LancamentoCancelado`, `PagamentoEstornado`.
> - Outros módulos (ex.: notificacoes, contabil) consomem.
>
> **HTTP**:
> - Controllers Nest com Zod schemas (compartilhado com front via `packages/shared`).
> - Endpoints: criar/listar/obter/cancelar lançamento; registrar pagamento; estornar pagamento.
> - Auth: guard `@RequirePermission('financeiro.lancamentos.criar')` e similares. Filial filtrada via session.
>
> **Auditoria**:
> - Toda mutação grava em `audit_log` (entity_type, entity_id, action, diff JSONB, actor_id, ip, ua).
>
> **Idempotência**:
> - Endpoints de mutação aceitam `Idempotency-Key` no header. Salvo em tabela `idempotency_records(tenant_id, key) UNIQUE`. Repetir = retorna resposta original.
>
> **Testes**:
> - Domain: invariantes (Money, Lancamento) — TS puro, sem Nest.
> - Use cases: com `InMemoryRepository`s.
> - Integração: 1-2 fluxos críticos com Postgres real (testcontainers).
>
> **Entregáveis**:
> 1. Estrutura de pastas com arquivos vazios indicando responsabilidades.
> 2. Schemas Drizzle + migration.
> 3. Domain entities + VOs com testes unitários.
> 4. Use cases + testes.
> 5. Controllers + DTOs + auth guards.
> 6. Outbox + listener exemplo.
> 7. README do módulo com decisões.
>
> Não use lib pesada como nestjs/cqrs. Mantenha simples e revisável.

## Como auditar a resposta

- [ ] Domain não importa Nest/Drizzle.
- [ ] Money usa NUMERIC, não float. Operações criam novos valores (imutabilidade).
- [ ] Estornos NÃO alteram lançamento original (linha contrária).
- [ ] Idempotência testada (mesmo `Idempotency-Key` retorna mesmo resultado, não duplica).
- [ ] Outbox + DB no mesmo `db.transaction`.
- [ ] RLS / context de tenant aplicado.
- [ ] Audit log grava cada mutação.
- [ ] Testes do domain rodam sem subir nada.
- [ ] PublicApi exposta, internals escondidos.
