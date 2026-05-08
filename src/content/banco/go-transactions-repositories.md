---
title: "Go: Transações, Repositórios e Unit of Work"
category: banco
stack: [Go, PostgreSQL, pgx, sqlc]
tags: [transactions, repository-pattern, unit-of-work, isolation, golang]
excerpt: "Como desenhar transações em Go: boundary no use case, pgx.Tx, sqlc com executor, isolation levels e repositórios sem fantasia de ORM."
related: [go-postgres-pgx-sqlc, repository-pattern, outbox-pattern]
updated: "2026-05-08"
---

## Transação pertence ao caso de uso

Transação é boundary de consistência. Ela deve envolver uma intenção de negócio completa, não cada método de repositório isolado.

Exemplo: pagar fatura pode precisar:

- carregar fatura;
- alterar status;
- inserir evento outbox;
- gravar chave de idempotência.

Tudo isso deve confirmar ou falhar junto.

## Boundary transacional

Boundary transacional responde: "quais mudanças precisam ser verdadeiras juntas agora?"

Para `PayInvoice`, uma boundary forte pode incluir:

- marcar invoice como paga;
- registrar payment;
- inserir evento outbox;
- gravar idempotency key;
- atualizar `updated_at`.

Ela provavelmente não deve incluir:

- enviar e-mail;
- chamar serviço de analytics;
- gerar relatório;
- atualizar ledger de outro serviço.

Esses efeitos saem por evento e aceitam consistência eventual.

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

No `sqlc.yaml`, a ideia é permitir que `New(db DBTX)` receba pool ou tx:

```yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "db/query"
    schema: "db/migrations"
    gen:
      go:
        package: "db"
        out: "internal/adapters/postgres/db"
        sql_package: "pgx/v5"
```

O código gerado costuma aceitar uma interface compatível. O repository decide se usa pool direto ou tx injetada.

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

## Exemplo completo: idempotência + aggregate + outbox

```go
func (uc PayInvoice) Execute(ctx context.Context, cmd PayInvoiceCommand) (PayInvoiceResult, error) {
	var result PayInvoiceResult

	err := uc.uow.WithinTx(ctx, func(ctx context.Context, tx TxDeps) error {
		cached, found, err := tx.Idempotency.Find(ctx, cmd.IdempotencyKey)
		if err != nil {
			return err
		}
		if found {
			result = cached.PayInvoiceResult
			return nil
		}

		inv, err := tx.Invoices.FindForUpdate(ctx, cmd.InvoiceID)
		if err != nil {
			return err
		}

		if err := inv.Pay(cmd.PaidAt); err != nil {
			return err
		}

		if err := tx.Invoices.Save(ctx, inv); err != nil {
			return err
		}

		for _, event := range inv.PullEvents() {
			if err := tx.Outbox.Append(ctx, event); err != nil {
				return err
			}
		}

		result = mapResult(inv)
		return tx.Idempotency.Save(ctx, cmd.IdempotencyKey, cmd.RequestHash, result)
	})
	if err != nil {
		return PayInvoiceResult{}, err
	}
	return result, nil
}
```

Esse exemplo junta as decisões modernas: domínio protege regra, transação protege consistência local, outbox protege publicação e idempotência protege repetição do cliente.

## Isolation levels

Isolation level define quanto uma transação enxerga de concorrência.

- `Read Committed`: padrão comum; bom para muitos casos.
- `Repeatable Read`: protege leituras repetidas.
- `Serializable`: mais forte, pode exigir retry.

Use lock pessimista quando precisa impedir duas operações simultâneas sobre o mesmo aggregate:

```sql
SELECT * FROM invoices WHERE id = $1 FOR UPDATE;
```

## Anomalias que importam

| Anomalia | Exemplo | Defesa comum |
|---|---|---|
| Lost update | dois pagamentos alteram a mesma fatura | `SELECT FOR UPDATE` ou optimistic locking |
| Dirty read | ler dado não commitado | PostgreSQL evita no `Read Committed` |
| Non-repeatable read | valor muda entre duas leituras | `Repeatable Read` |
| Write skew | duas transações passam validação separada e quebram regra conjunta | constraint, lock ou `Serializable` |

Não escolha isolation level por estética. Escolha pela anomalia que sua regra não tolera.

## Optimistic locking

Quando colisão é rara, você pode usar versão:

```sql
UPDATE invoices
SET status = $2, version = version + 1
WHERE id = $1 AND version = $3;
```

Se nenhuma linha foi alterada, alguém modificou antes. O use case decide retry ou conflito.

## Repository não é dono da regra

Repository persiste e reconstrói. Ele pode traduzir erro técnico para erro de domínio, como unique violation para `ErrDuplicateIdempotencyKey`, mas não deve decidir se invoice pode ser paga.

Regra fica no aggregate/use case. Banco reforça com constraints. Essa dupla é poderosa: código expressa intenção, banco impede corrupção.

## Testes que você precisa

- pagar fatura duas vezes em paralelo não duplica pagamento;
- idempotency key repetida retorna mesma resposta;
- mesma key com payload diferente retorna conflito;
- outbox é gravada na mesma transação;
- erro ao salvar outbox faz rollback do pagamento;
- lock ou versionamento impede lost update.

## Critério de domínio

Você dominou este card quando consegue apontar exatamente qual use case abre transação, quais writes precisam ser atômicos e quais erros devem disparar retry.
