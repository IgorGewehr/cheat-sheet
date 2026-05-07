---
title: "Go: Migrations com Goose ou Atlas"
category: banco
stack: [Go, PostgreSQL, Goose, Atlas]
tags: [migrations, database, schema, zero-downtime, golang]
excerpt: "Como versionar schema PostgreSQL em serviços Go: Goose, Atlas, rollback honesto, expand/contract e o que precisa passar em review."
related: [migrations-zero-downtime, audit-migration, go-postgres-pgx-sqlc]
updated: "2026-05-07"
---

## Migration é mudança de contrato

Schema de banco é contrato entre código, dados históricos, jobs, relatórios e operação. Migration ruim derruba produção mesmo quando o código compila.

Em Go, duas escolhas comuns:

- Goose: simples, SQL-first, fácil de rodar em CI e local.
- Atlas: mais poderoso, com workflow declarativo/diff e governança de schema.

## Goose

Arquivo:

```sql
-- +goose Up
CREATE TABLE invoices (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL,
  total_cents bigint NOT NULL,
  currency text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE invoices;
```

Goose é ótimo quando você quer controle explícito e migrations legíveis em code review.

## Atlas

Atlas fica interessante quando você precisa de:

- diffs de schema;
- validação no CI;
- política de lint;
- gestão mais formal de ambientes;
- times maiores mexendo em schema.

## Rollback honesto

Nem todo rollback é seguro. Remover coluna com dados não volta magicamente. Em produção, prefira expand/contract:

1. adicionar coluna nova nullable;
2. publicar código que escreve coluna nova e antiga;
3. backfill;
4. publicar código que lê coluna nova;
5. remover coluna antiga em outro deploy.

## Checklist de review

Antes de aceitar migration:

- ela roda em banco grande?
- cria índice de forma segura?
- altera coluna com lock perigoso?
- tem backfill separado?
- o código é compatível durante deploy gradual?
- há rollback operacional documentado?
- `sqlc generate` foi rodado depois da mudança?

## Critério de domínio

Você dominou este card quando não trata migration como apêndice do PR, mas como operação de produção com risco, ordem e compatibilidade.
