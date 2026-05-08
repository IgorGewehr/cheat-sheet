---
title: "Go: Arquitetura Hexagonal sem Cerimônia"
category: padroes-backend
stack: [Go, Clean Architecture, Hexagonal Architecture]
tags: [golang, hexagonal, clean-architecture, ports-adapters, use-cases]
excerpt: "Como aplicar arquitetura hexagonal em Go sem transformar o projeto em teatro: domínio no centro, portas pequenas, adaptadores explícitos e testes melhores."
related: [hexagonal, clean-architecture, use-cases, go-ddd-aggregates]
updated: "2026-05-08"
---

## A ideia central

Arquitetura hexagonal separa o centro do sistema das tecnologias ao redor. O centro contém domínio e casos de uso. As bordas contêm HTTP, PostgreSQL, RabbitMQ, Redis e qualquer integração externa.

O objetivo não é desenhar hexágono bonito. O objetivo é conseguir trocar um adaptador, testar regra de negócio sem subir infraestrutura e impedir que detalhes de framework vazem para o domínio.

## O mapa das camadas

Um serviço Go empresarial pode seguir esta direção de dependência:

```text
cmd/api
  -> internal/adapters/http
    -> internal/app/invoice
      -> internal/domain/invoice
    -> ports definidos pelo app

internal/adapters/postgres
  -> internal/domain/invoice

internal/adapters/rabbitmq
  -> eventos definidos pelo app/domain
```

O centro não sabe que existe Chi, pgx, Redis ou RabbitMQ. Isso permite que a parte intelectual do sistema, as regras, continue estável enquanto tecnologias mudam.

## Três tipos de código

Pense no serviço em três famílias:

| Tipo | Pergunta | Exemplo |
|---|---|---|
| Domínio | O que é verdadeiro no negócio? | `Invoice.Pay()` |
| Aplicação | Qual fluxo executa uma intenção? | `PayInvoice.Execute()` |
| Adaptador | Como falo com o mundo? | HTTP handler, pgx repository, RabbitMQ publisher |

Quando um arquivo mistura os três, ele vira difícil de testar e de mudar.

## Ports e adapters

Port é uma interface que o centro precisa. Adapter é uma implementação técnica.

```go
type InvoiceRepository interface {
	FindByID(ctx context.Context, id string) (Invoice, error)
	Save(ctx context.Context, inv Invoice) error
}
```

Em Go, a interface deve ficar perto de quem a consome. Se o use case precisa salvar invoice, ele define a porta mínima:

```go
type InvoiceStore interface {
	FindForUpdate(ctx context.Context, id invoice.ID) (invoice.Invoice, error)
	Save(ctx context.Context, inv invoice.Invoice) error
}
```

Isso evita a interface gorda `Repository` com 25 métodos que todo fake precisa implementar.

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

O adapter traduz entre modelos:

```go
func mapRow(row db.Invoice) (invoice.Invoice, error) {
	total, err := invoice.NewMoney(row.TotalCents, row.Currency)
	if err != nil {
		return invoice.Invoice{}, err
	}
	status, err := invoice.ParseStatus(row.Status)
	if err != nil {
		return invoice.Invoice{}, err
	}

	return invoice.Restore(invoice.RestoreParams{
		ID:     invoice.ID(row.ID.String()),
		Total:  total,
		Status: status,
	})
}
```

`Restore` é útil quando você recria aggregate a partir do banco sem passar por regra de criação nova.

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

Uma versão mais realista separa transação e publicação via outbox:

```go
func (uc PayInvoice) Execute(ctx context.Context, cmd PayInvoiceCommand) error {
	return uc.uow.WithinTx(ctx, func(ctx context.Context, tx TxDeps) error {
		inv, err := tx.Invoices.FindForUpdate(ctx, cmd.InvoiceID)
		if err != nil {
			return err
		}

		if err := inv.Pay(uc.clock.Now()); err != nil {
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

		return nil
	})
}
```

Repare no detalhe: o use case não publica no RabbitMQ diretamente dentro da transação. Ele grava outbox. Isso reduz o acoplamento entre regra de negócio e infraestrutura assíncrona.

## Teste que prova a arquitetura

O melhor sinal de arquitetura hexagonal boa é teste de use case sem infraestrutura real:

```go
func TestPayInvoice_AlreadyPaid(t *testing.T) {
	repo := &fakeInvoiceStore{invoice: paidInvoiceFixture()}
	outbox := &fakeOutbox{}
	uc := PayInvoice{
		uow:   fakeUOW{Invoices: repo, Outbox: outbox},
		clock: fixedClock{},
	}

	err := uc.Execute(context.Background(), PayInvoiceCommand{InvoiceID: "inv_123"})

	require.ErrorIs(t, err, invoice.ErrAlreadyPaid)
	assert.False(t, repo.saved)
	assert.Empty(t, outbox.events)
}
```

Esse teste ensina muito: regra inválida não salva estado e não emite evento.

## O que não fazer

Evite interfaces para tudo antes de ter motivo. Interface demais cria ruído. Aplique interface nas bordas em que você quer:

- trocar implementação;
- testar use case com fake;
- reduzir dependência de infraestrutura;
- expressar contrato de domínio.

Anti-patterns comuns:

- `internal/domain` importando `database/sql`, `pgx`, `chi` ou `zap`;
- handler HTTP abrindo transação diretamente;
- repository validando regra de negócio;
- use case recebendo `*http.Request`;
- DTO OpenAPI sendo usado como entidade de domínio;
- package `utils` concentrando conhecimento importante.

## Dependência aponta para dentro

HTTP conhece use case. PostgreSQL conhece domínio. Domínio não conhece HTTP, sqlc, pgx, Chi, RabbitMQ nem Redis.

Se `internal/domain` importa `github.com/go-chi/chi`, a arquitetura quebrou.

## Exercício prático

Pegue uma feature como "pagar fatura" e escreva quatro arquivos:

1. domínio: `Invoice.Pay`;
2. aplicação: `PayInvoice.Execute`;
3. adapter HTTP: `POST /v1/invoices/{id}/pay`;
4. adapter Postgres: `FindForUpdate` e `Save`.

Depois responda: se amanhã trocar Chi por outro router, qual arquivo muda? Se trocar Postgres por outro storage, qual arquivo muda? Se a regra de pagamento mudar, qual arquivo muda? Arquitetura boa concentra cada mudança no lugar certo.

## Critério de domínio

Você dominou este card quando consegue desenhar a direção das dependências e escrever um teste de use case sem Postgres, Redis ou servidor HTTP.
