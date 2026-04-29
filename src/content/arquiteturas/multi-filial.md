---
title: "Empresas com filiais — modelagem e permissões"
category: arquiteturas
stack: [PostgreSQL, NestJS]
tags: [erp, multi-filial, organização]
excerpt: "Hierarquia organização → empresa → filial → departamento. Permissões cascateiam, dados ficam ligados à filial, relatórios consolidam."
related: [multi-tenant-strategies, rbac-vs-abac, auth-architecture]
updated: 2026-04
---

## A confusão clássica

Multi-tenant ≠ multi-filial.
- **Tenant** = cliente da sua plataforma (uma empresa cliente).
- **Filial** = subdivisão dentro de UM tenant.

Um tenant tem N empresas (CNPJs), cada empresa tem N filiais, cada filial tem N departamentos. Tudo sob o mesmo tenant.

## Modelo canônico

```
Tenant (workspace do cliente)
  └─ Organization (grupo empresarial — opcional)
       └─ Company (empresa, 1 CNPJ)
            └─ Branch (filial — pode ter CNPJ próprio em filiais)
                 └─ Department (departamento operacional)
```

Tabelas:

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  ...
);

CREATE TABLE branches (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  cnpj TEXT,            -- pode ter CNPJ próprio
  apelido TEXT NOT NULL,
  endereco JSONB NOT NULL,
  ...
);

CREATE TABLE departments (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  branch_id UUID NOT NULL REFERENCES branches(id),
  nome TEXT NOT NULL,
  ...
);
```

Toda tabela transacional carrega **`tenant_id` + `branch_id`** (ou `company_id` se for documento corporativo). Indexar `(tenant_id, branch_id, ...)`.

## Membership e permissão

Um usuário pode pertencer a várias filiais, com papéis diferentes:

```sql
CREATE TABLE memberships (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  branch_id UUID NOT NULL,        -- ou nullable se "todas as filiais"
  role TEXT NOT NULL,             -- gerente, vendedor, financeiro...
  scope TEXT NOT NULL DEFAULT 'branch', -- branch | company | tenant
  UNIQUE (tenant_id, user_id, branch_id, role)
);
```

`scope` define até onde o usuário enxerga:
- `branch`: só dados da filial específica.
- `company`: dados de todas as filiais daquela empresa.
- `tenant`: tudo.

## Filtros automáticos

Em vez de cada query lembrar de filtrar:

```sql
-- ruim: cada query tem que lembrar
SELECT * FROM invoices WHERE tenant_id = ? AND branch_id IN (...);

-- melhor: middleware seta contexto + RLS aplica
SET app.tenant_id = '...';
SET app.branch_ids = '{uuid1,uuid2}';
SET app.scope = 'company';
```

Com RLS, a policy decide o que retorna baseado no scope. Erro humano de "esquecer o filtro" some.

## Filtros vs visibilidade

Cuidado com a diferença:
- **Filtro de listagem**: mostrar só o que o usuário pode ver.
- **Permissão de ação**: mesmo vendo, só pode editar se tiver papel.

Não confunda. Vendedor pode VER nota fiscal pra conferir, mas só financeiro EDITA.

## Relatórios cross-filial

Usuários com scope `company` ou `tenant` precisam de visões consolidadas. Considere:
- View materializada com agregados por filial, refrescada periodicamente.
- Read model separado (CQRS-lite) pra relatório.

Não tente usar a mesma tabela transacional pra relatório consolidado de tenant inteiro com 5 anos de dados.

## Como pedir pra IA

> "Modele filiais pro nosso ERP. Empresas têm 1+ filiais (cada filial pode ter CNPJ próprio). Usuário pertence a 1+ filiais com papel por filial. Implemente: (1) tabela `memberships` com scope branch/company/tenant; (2) middleware Nest que carrega contexto do usuário e seta variáveis de sessão Postgres; (3) RLS policy nas tabelas transacionais filtrando por filial conforme scope; (4) endpoint `GET /relatorios/vendas` que agrega por filial."

## Como auditar

- [ ] Toda tabela transacional tem `branch_id` (ou `company_id` quando faz sentido).
- [ ] Membership tem `scope` explícito, não inferido.
- [ ] Não existe endpoint que lista dados sem aplicar filtro de filial automaticamente.
- [ ] Há audit log que registra qual filial o usuário tava operando ao fazer cada ação.
- [ ] Relatórios consolidados não rodam contra tabela transacional sem agregação.
- [ ] Trocar de filial no header/menu reflete em TODAS as listagens (não só algumas).

## Anti-padrões

- Permissão por filial codada em `if` espalhado pelos services.
- Esquecer de gravar `branch_id` em alguma tabela e ter que adivinhar depois.
- Membership sem `scope`, dependendo de papel pra decidir visibilidade.
