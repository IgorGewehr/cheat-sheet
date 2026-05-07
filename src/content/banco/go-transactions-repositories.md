---
title: "Go: Transações, Repositórios e Unit of Work"
category: banco
stack: [Go, PostgreSQL, pgx, sqlc]
tags: [transactions, repository-pattern, unit-of-work, isolation, golang]
excerpt: "Como desenhar transações em Go: boundary no use case, pgx.Tx, sqlc com executor, isolation levels e repositórios sem fantasia de ORM."
related: [go-postgres-pgx-sqlc, repository-pattern, outbox-pattern]
updated: "2026-05-07"
---

## Transação pertence ao caso de uso

Transação é boundary de consistência. Ela deve envolver uma intenção de negócio completa, não cada método de repositório isolado.

Exemplo: pagar fatura pode precisar:

- carregar fatura;
- alterar status;
- inserir evento outbox;
- gravar chave de idempotência.

Tudo isso deve confirmar ou falhar junto.

## sqlc com executor

Configure `sqlc` para gerar queries que aceitam uma interface compatível com `pgxpool.Pool` e `pgx.Tx`. Assim o mesmo repository roda dentro ou fora de transação.

Modelo:

```go
type DBTX interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
	Query(context.Context, string, ...any) (pgx.Rows, error)
	QueryRow(context.Context, string, ...any) pgx.Row
}
```

## Unit of Work pragmático

```go
func (u UnitOfWork) WithinTx(ctx context.Context, fn func(ctx context.Context, tx TxDeps) error) error {
	tx, err := u.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	deps := TxDeps{
		Invoices: postgres.NewInvoiceRepository(tx),
		Outbox:   postgres.NewOutboxRepository(tx),
	}

	if err := fn(ctx, deps); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
```

O `defer Rollback` é seguro: depois do commit, rollback retorna erro ignorável.

## Isolation levels

Isolation level define quanto uma transação enxerga de concorrência.

- `Read Committed`: padrão comum; bom para muitos casos.
- `Repeatable Read`: protege leituras repetidas.
- `Serializable`: mais forte, pode exigir retry.

Use lock pessimista quando precisa impedir duas operações simultâneas sobre o mesmo aggregate:

```sql
SELECT * FROM invoices WHERE id = $1 FOR UPDATE;
```

## Critério de domínio

Você dominou este card quando consegue apontar exatamente qual use case abre transação, quais writes precisam ser atômicos e quais erros devem disparar retry.
