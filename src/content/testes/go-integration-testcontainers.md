---
title: "Go: Testes de Integração com Testcontainers"
category: testes
stack: [Go, testcontainers, PostgreSQL, Redis, RabbitMQ]
tags: [golang, integration-testing, testcontainers, postgres, redis, rabbitmq]
excerpt: "Testes de integração state of the art em Go: dependências reais efêmeras, migrations, isolamento por teste e contratos com Postgres, Redis e RabbitMQ."
related: [go-testing-testify, go-postgres-pgx-sqlc, go-rabbitmq-event-driven]
updated: "2026-05-07"
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

## Isolamento

Estratégias:

- container por package;
- schema por teste;
- transação com rollback;
- truncate entre testes.

Para velocidade, container por package com truncate costuma ser bom. Para concorrência máxima, schema por teste é mais isolado.

## RabbitMQ

Teste consumer com:

- exchange real;
- queue real;
- mensagem JSON real;
- ack/nack observado;
- DLQ para falha permanente;
- idempotência com reentrega.

## Cuidado com flakiness

Teste de integração precisa de readiness explícita. Não confie em `sleep`.

Use healthchecks, retry com timeout e logs do container quando falhar.

## Critério de domínio

Você dominou este card quando bugs de SQL, migration, Redis e RabbitMQ aparecem no CI antes de aparecerem em staging.
