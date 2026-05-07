---
title: "Go: Arquitetura Hexagonal sem Cerimônia"
category: padroes-backend
stack: [Go, Clean Architecture, Hexagonal Architecture]
tags: [golang, hexagonal, clean-architecture, ports-adapters, use-cases]
excerpt: "Como aplicar arquitetura hexagonal em Go sem transformar o projeto em teatro: domínio no centro, portas pequenas, adaptadores explícitos e testes melhores."
related: [hexagonal, clean-architecture, use-cases, go-ddd-aggregates]
updated: "2026-05-07"
---

## A ideia central

Arquitetura hexagonal separa o centro do sistema das tecnologias ao redor. O centro contém domínio e casos de uso. As bordas contêm HTTP, PostgreSQL, RabbitMQ, Redis e qualquer integração externa.

O objetivo não é desenhar hexágono bonito. O objetivo é conseguir trocar um adaptador, testar regra de negócio sem subir infraestrutura e impedir que detalhes de framework vazem para o domínio.

## Ports e adapters

Port é uma interface que o centro precisa. Adapter é uma implementação técnica.

```go
type InvoiceRepository interface {
	FindByID(ctx context.Context, id string) (Invoice, error)
	Save(ctx context.Context, inv Invoice) error
}
```

PostgreSQL implementa:

```go
type Repository struct {
	q *db.Queries
}

func (r Repository) Save(ctx context.Context, inv invoice.Invoice) error {
	// sqlc/pgx aqui
	return nil
}
```

## Use case como boundary

Use case orquestra uma intenção do usuário ou do sistema:

```go
type PayInvoice struct {
	repo   InvoiceRepository
	clock  Clock
	events EventPublisher
}

func (uc PayInvoice) Execute(ctx context.Context, cmd PayInvoiceCommand) error {
	inv, err := uc.repo.FindByID(ctx, cmd.InvoiceID)
	if err != nil {
		return err
	}
	if err := inv.Pay(uc.clock.Now()); err != nil {
		return err
	}
	if err := uc.repo.Save(ctx, inv); err != nil {
		return err
	}
	return uc.events.Publish(ctx, InvoicePaid{InvoiceID: inv.ID})
}
```

## O que não fazer

Evite interfaces para tudo antes de ter motivo. Interface demais cria ruído. Aplique interface nas bordas em que você quer:

- trocar implementação;
- testar use case com fake;
- reduzir dependência de infraestrutura;
- expressar contrato de domínio.

## Dependência aponta para dentro

HTTP conhece use case. PostgreSQL conhece domínio. Domínio não conhece HTTP, sqlc, pgx, Chi, RabbitMQ nem Redis.

Se `internal/domain` importa `github.com/go-chi/chi`, a arquitetura quebrou.

## Critério de domínio

Você dominou este card quando consegue desenhar a direção das dependências e escrever um teste de use case sem Postgres, Redis ou servidor HTTP.
