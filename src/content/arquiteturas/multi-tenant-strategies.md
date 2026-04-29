---
title: "Multi-tenancy — pool, silo, bridge"
category: arquiteturas
stack: [PostgreSQL, NestJS]
tags: [multi-tenant, erp, escala]
excerpt: "Decisão crítica de ERP. Tem três estratégias canônicas, cada uma com tradeoff real de custo, isolamento e operação."
related: [multi-filial, postgres-erp-checklist, auth-architecture]
updated: 2026-04
---

## As três estratégias

| Estratégia | Banco | Schema | Tabela | Custo | Isolamento | Backup/restore por tenant |
|---|---|---|---|---|---|---|
| **Pool** (shared) | 1 | 1 | `tenant_id` em cada linha | 💲 baixo | fraco (depende do código não ter bug) | difícil |
| **Bridge** (schema-per-tenant) | 1 | N | tabelas por schema | 💲💲 médio | médio (RLS ou search_path) | médio |
| **Silo** (DB-per-tenant) | N | N | tabelas por DB | 💲💲💲 alto | forte | fácil |

## Pool — shared everything

Toda tabela tem `tenant_id`. Toda query filtra por `tenant_id`. Indexar `(tenant_id, ...)` em tudo.

**Use quando**: muitos tenants pequenos (SaaS B2C/B2SMB), custo crítico, dados não muito sensíveis.

**Reforço de segurança**: Postgres **Row-Level Security (RLS)** + `SET app.tenant_id` por conexão. Isso protege contra bug de query (esquecer o WHERE).

```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

## Bridge — schema por tenant

Cada tenant tem seu schema (`tenant_xyz.invoices`). Conexão seta `search_path = tenant_xyz, public`.

**Use quando**: dezenas a centenas de tenants, precisa de isolamento mais forte, mas custo de N bancos é demais. Migrations rodam em N schemas — automatize.

**Cuidado**: `pg_dump` por schema funciona, mas pool de conexões precisa ser por tenant ou setar search_path por sessão.

## Silo — banco por tenant

Cada tenant tem banco (e potencialmente servidor) próprio.

**Use quando**: poucos tenants grandes, requisitos legais (LGPD, GDPR data residency), tenants enterprise que pagam pra ter isolamento.

**Cuidado**: explosão operacional. N versões de schema rodando simultaneamente. Você precisa de pipeline de migration, monitoramento e backup por tenant.

## Heurística de escolha

- ERP B2B com tenants médios e dados sensíveis (financeiro, fiscal): **bridge**, com migração pra silo só pros tenants enterprise.
- SaaS pequeno, muitos tenants: **pool com RLS**.
- ERP enterprise com poucos clientes grandes: **silo**.

Não troque depois. Migrar de pool pra silo é doloroso.

## Como pedir pra IA

> "Estamos escolhendo multi-tenancy pro nosso ERP novo. Tenants são empresas médias (50-500 usuários cada, ~50 tenants no início, projeção 500 em 3 anos). Dados financeiros e fiscais. Quero **bridge** com schema-per-tenant em Postgres. Implemente: (1) interceptor Nest que pega `tenantId` do JWT e seta `search_path` na conexão; (2) sistema de migration que roda em todos os schemas; (3) script pra provisionar schema novo quando tenant é criado."

## Como auditar

- [ ] Existe um único lugar onde `tenant_id`/`search_path` é injetado. Nenhum service "esquece".
- [ ] Há teste que tenta vazar dados entre tenants e falha (com ou sem RLS).
- [ ] Migrations rodam em ambiente de staging com pelo menos 3 tenants antes de prod.
- [ ] Backup/restore por tenant é documentado e testado (já tentou restaurar 1 tenant?).
- [ ] Telemetria mostra latência/erros por tenant (pra detectar tenant ruidoso).

## Anti-padrões

- "Pool" sem RLS, confiando que o código nunca esquecerá `WHERE tenant_id = ?`. Vai vazar.
- Schema-per-tenant com pool de conexões compartilhado sem setar search_path. Tenant A vê tabela do tenant B.
- Nome do tenant no schema (`schema_acme_corp`). Use ID estável (UUID) — empresas mudam de nome.
