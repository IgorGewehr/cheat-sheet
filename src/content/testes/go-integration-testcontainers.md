---
title: "Go: Testes de Integração com Testcontainers"
category: testes
stack: [Go, testcontainers, PostgreSQL, Redis, RabbitMQ]
tags: [golang, integration-testing, testcontainers, postgres, redis, rabbitmq]
excerpt: "Testes de integração state of the art em Go: dependências reais efêmeras, migrations, isolamento por teste e contratos com Postgres, Redis e RabbitMQ."
related: [go-testing-testify, go-postgres-pgx-sqlc, go-rabbitmq-event-driven]
updated: "2026-05-08"
---

## Por que Testcontainers

Mocks não provam SQL, migrations, constraints, serialização RabbitMQ ou comportamento real do Redis. Testcontainers sobe dependências reais em containers efêmeros para testes automatizados.

Use para:

- repository PostgreSQL;
- migrations;
- idempotência Redis;
- consumer RabbitMQ;
- fluxo HTTP + banco;
- contrato de integração entre adapters.

## O que integração prova

Teste de integração não substitui teste unitário. Ele prova o que só aparece quando tecnologia real entra:

- SQL gerado bate com schema real;
- migration realmente cria o índice/constraint esperado;
- `pgx` mapeia nullable types corretamente;
- RabbitMQ entrega, redeliver e DLQ funcionam;
- Redis aplica TTL e atomicidade esperada;
- Docker/CI consegue subir dependências.

Se o risco é regra de domínio, teste unitário. Se o risco é contrato com infraestrutura, teste integração.

## Banco real

Fluxo recomendado:

1. sobe Postgres;
2. roda migrations;
3. cria pool pgx;
4. executa teste;
5. limpa container.

```go
func TestInvoiceRepository_Save(t *testing.T) {
	ctx := context.Background()
	pool := testdb.StartPostgres(t, ctx)

	repo := postgres.NewInvoiceRepository(pool)
	err := repo.Save(ctx, invoiceFixture())
	require.NoError(t, err)

	got, err := repo.FindByID(ctx, "inv_123")
	require.NoError(t, err)
	assert.Equal(t, "inv_123", got.ID())
}
```

Teste constraint, não só insert feliz:

```go
func TestInvoiceRepository_IdempotencyKeyIsUnique(t *testing.T) {
	ctx := context.Background()
	pool := testdb.StartPostgres(t, ctx)
	repo := postgres.NewIdempotencyRepository(pool)

	err := repo.Save(ctx, "key-123", "hash-a", responseFixture())
	require.NoError(t, err)

	err = repo.Save(ctx, "key-123", "hash-b", responseFixture())
	require.ErrorIs(t, err, idempotency.ErrKeyConflict)
}
```

Esse teste prova uma regra que o banco precisa reforçar, não só o código.

## Isolamento

Estratégias:

- container por package;
- schema por teste;
- transação com rollback;
- truncate entre testes.

Para velocidade, container por package com truncate costuma ser bom. Para concorrência máxima, schema por teste é mais isolado.

## Helper de teste

Crie helpers pequenos para não poluir cada teste:

```go
func StartPostgres(t *testing.T, ctx context.Context) *pgxpool.Pool {
	t.Helper()

	container := startPostgresContainer(t, ctx)
	dsn := container.ConnectionString(t, ctx)
	runMigrations(t, dsn)

	pool, err := pgxpool.New(ctx, dsn)
	require.NoError(t, err)

	t.Cleanup(func() {
		pool.Close()
		container.Terminate(ctx)
	})

	return pool
}
```

O teste deve mostrar intenção de negócio, não detalhes de boot de container.

## RabbitMQ

Teste consumer com:

- exchange real;
- queue real;
- mensagem JSON real;
- ack/nack observado;
- DLQ para falha permanente;
- idempotência com reentrega.

Exemplo de cenário:

```go
func TestLedgerConsumer_DeduplicatesInvoicePaid(t *testing.T) {
	ctx := context.Background()
	env := testenv.Start(t, ctx, testenv.WithPostgres(), testenv.WithRabbitMQ())

	msg := invoicePaidMessage("evt_123", "inv_123")
	env.Publish(ctx, "billing.events", "invoice.paid.v1", msg)
	env.Publish(ctx, "billing.events", "invoice.paid.v1", msg)

	require.Eventually(t, func() bool {
		count := env.LedgerEntriesCount(ctx, "inv_123")
		return count == 1
	}, 5*time.Second, 100*time.Millisecond)
}
```

`Eventually` é aceitável em teste assíncrono, desde que tenha timeout curto e logs bons quando falha.

## Cuidado com flakiness

Teste de integração precisa de readiness explícita. Não confie em `sleep`.

Use healthchecks, retry com timeout e logs do container quando falhar.

Outras defesas:

- use `t.Helper()` em helpers;
- imprima logs do container quando teste falha;
- limite paralelismo quando Postgres/RabbitMQ é compartilhado;
- prefira nomes únicos por teste;
- não dependa de ordem global entre testes;
- rode no CI com Docker disponível e timeout realista.

## Estratégia de CI

Separe suites:

```bash
go test ./...                    # rápido
go test -race ./...              # concorrência
go test -tags=integration ./...  # containers
```

Assim você roda o ciclo rápido a cada mudança e a suíte pesada antes de merge/deploy.

## Critério de domínio

Você dominou este card quando bugs de SQL, migration, Redis e RabbitMQ aparecem no CI antes de aparecerem em staging.
