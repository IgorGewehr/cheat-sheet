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

## Pool tuning sênior

Configurar pool sem entender Postgres é otimizar no escuro. Regra prática:

```go
cfg, _ := pgxpool.ParseConfig(databaseURL)
cfg.MaxConns = 20
cfg.MinConns = 5
cfg.MaxConnLifetime = 30 * time.Minute
cfg.MaxConnIdleTime = 5 * time.Minute
cfg.HealthCheckPeriod = 1 * time.Minute
```

`MaxConns` por instância **× réplicas** ≤ `max_connections` do Postgres (menos margem para outros clients/admin). Postgres não escala bem além de algumas centenas de conexões — para isso existe **PgBouncer** em modo transaction.

Em PgBouncer transaction mode você **perde** prepared statements server-side. Use `pgx` com `default_query_exec_mode=cache_describe` ou `simple_protocol`, e teste com `EXPLAIN`.

## Prepared statements e batch

Para queries chamadas em loop hot, prepare uma vez, execute várias:

```go
batch := &pgx.Batch{}
for _, item := range items {
    batch.Queue("INSERT INTO line_items(invoice_id, sku, qty) VALUES ($1,$2,$3)",
        invoiceID, item.SKU, item.Qty)
}
br := pool.SendBatch(ctx, batch)
defer br.Close()
for range items {
    if _, err := br.Exec(); err != nil { return err }
}
```

`SendBatch` envia um único round-trip — diferença de 50ms × N para 50ms total quando N é grande.

## COPY para ingestão massiva

Para milhões de linhas, `INSERT` em loop perde feio para `COPY`:

```go
_, err := pool.CopyFrom(ctx,
    pgx.Identifier{"events"},
    []string{"id", "type", "payload", "created_at"},
    pgx.CopyFromRows(rows),
)
```

`COPY` chega em 10-100x mais rápido que `INSERT` individuais para bulk load (importação inicial, ETL, reprocessamento).

## LISTEN/NOTIFY para baixa latência

Para eventos intra-DB sem fila externa, `LISTEN/NOTIFY` é gratuito:

```go
conn, _ := pool.Acquire(ctx)
defer conn.Release()
_, _ = conn.Exec(ctx, "LISTEN invoices_paid")

for {
    notif, err := conn.Conn().WaitForNotification(ctx)
    if err != nil { return err }
    handlePaid(notif.Payload)
}
```

Limites: payload máximo 8000 bytes, sem persistência (notificações enquanto offline são perdidas), uma conexão dedicada por listener. Para volume alto e durabilidade, use RabbitMQ/Kafka.

## Pitfalls que aparecem em produção

- **N+1 escondido por sqlc**: queries simples viram laços sem você notar. Resolva com `JOIN` ou `WHERE id = ANY($1)` recebendo array.
- **Transação longa**: cada `BEGIN` segura uma conexão do pool. Operações HTTP/IO fora de transação. Em pool de 20, 20 transações longas = pool zerado.
- **`SELECT FOR UPDATE` em ordem inconsistente** entre queries → deadlock. Sempre lock na mesma ordem (ex: `ORDER BY id`).
- **Migrations e queries em deploy diferente**: rode migration **antes** do deploy do código que depende dela. Revisar plano expand/contract evita downtime.
- **Pool exausto silencioso**: monitore `pgxpool.Stat()` — `AcquireDuration_p99` é sinal precoce.

## Listas e arrays

Postgres tem arrays nativos. Use quando representar "lista pequena de valores escalares" sem semântica relacional:

```go
var tags []string
err := pool.QueryRow(ctx, "SELECT tags FROM articles WHERE id=$1", id).Scan(&tags)

_, err = pool.Exec(ctx, "UPDATE articles SET tags=$1 WHERE id=$2", []string{"go","sre"}, id)
```

`pgx` mapeia `[]string`, `[]int64`, etc. nativamente. Para JSONB, `pgtype.JSONB` ou desserialize manual.

## Critério de domínio

Você dominou este card quando consegue olhar uma query lenta no Postgres, decidir entre criar índice, mudar a query, paginar, materializar view ou trocar `INSERT` por `COPY` — e justificar a escolha com `EXPLAIN ANALYZE`, não com sensação.
