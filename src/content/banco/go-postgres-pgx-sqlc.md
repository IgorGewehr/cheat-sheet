---
title: "Go + PostgreSQL: sqlc, pgx e Queries Tipadas"
category: banco
stack: [Go, PostgreSQL, sqlc, pgx]
tags: [golang, postgres, sqlc, pgx, database]
excerpt: "Persistência Go de nível profissional: SQL explícito, geração tipada com sqlc, pool pgx, nullable types, transações e trade-offs contra ORM."
related: [postgres-indexes-explain, n-plus-1, go-transactions-repositories]
updated: "2026-05-07"
---

## Por que sqlc + pgx

Em Go, `sqlc + pgx` é uma combinação forte para sistemas empresariais: você escreve SQL real, o `sqlc` gera código Go tipado, e o `pgx` fornece driver/pool PostgreSQL moderno.

Você ganha:

- controle total do SQL;
- checagem de tipos em build;
- performance previsível;
- menos mágica que ORM;
- integração boa com transações.

Você perde:

- abstrações automáticas de relacionamento;
- produtividade inicial de CRUD simples;
- portabilidade entre bancos.

Para microsserviços PostgreSQL-first, essa troca costuma valer.

## Query sqlc

`db/query/invoices.sql`:

```sql
-- name: FindInvoiceByID :one
SELECT id, customer_id, total_cents, currency, status, created_at
FROM invoices
WHERE id = $1;

-- name: CreateInvoice :one
INSERT INTO invoices (id, customer_id, total_cents, currency, status)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, customer_id, total_cents, currency, status, created_at;
```

O `sqlc` gera structs e métodos. O repositório adapta esses tipos para domínio.

## pgxpool

```go
pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
if err != nil {
	return nil, err
}
if err := pool.Ping(ctx); err != nil {
	return nil, err
}
```

Pool é recurso crítico. Configure de acordo com capacidade do Postgres e concorrência do serviço. Mais conexões nem sempre significam mais performance.

## Nullable types

Banco tem `NULL`; domínio muitas vezes não deveria ter. Traduza com intenção.

```go
if row.PaidAt.Valid {
	inv.PaidAt = &row.PaidAt.Time
}
```

Se `NULL` representa estado de domínio, modele isso explicitamente. Se representa dado ruim, corrija schema.

## Repository adapter

```go
func (r Repository) FindByID(ctx context.Context, id string) (invoice.Invoice, error) {
	row, err := r.q.FindInvoiceByID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return invoice.Invoice{}, invoice.ErrNotFound
	}
	if err != nil {
		return invoice.Invoice{}, fmt.Errorf("find invoice: %w", err)
	}
	return mapInvoice(row), nil
}
```

## Critério de domínio

Você dominou este card quando consegue escrever queries SQL conscientemente, gerar tipos com sqlc e impedir que structs de banco virem seu modelo de domínio por acidente.
