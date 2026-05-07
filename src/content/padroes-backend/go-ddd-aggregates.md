---
title: "Go: DDD Pragmático, Aggregates e Invariantes"
category: padroes-backend
stack: [Go, DDD]
tags: [golang, ddd, aggregates, domain-events, invariants]
excerpt: "DDD em Go para sistemas caros: linguagem ubíqua, aggregates, invariantes, eventos de domínio e onde parar antes do excesso de abstração."
related: [ddd-light-erp, go-clean-hexagonal, go-outbox-idempotency]
updated: "2026-05-07"
---

## DDD não é pasta, é entendimento

Domain-Driven Design começa com linguagem ubíqua: a mesma linguagem entre engenharia, produto, operação e negócio. Se o negócio fala "fatura", "liquidação", "estorno" e o código fala `ThingProcessor`, você perdeu conhecimento.

Em Go, DDD costuma funcionar melhor com tipos pequenos, métodos claros e invariantes explícitas.

## Aggregate

Aggregate é um conjunto de objetos tratado como unidade de consistência. Ele protege invariantes.

Exemplo: uma fatura não pode ser paga duas vezes.

```go
type Invoice struct {
	id     string
	total  Money
	status Status
	events []DomainEvent
}

func (i *Invoice) Pay(at time.Time) error {
	if i.status == StatusPaid {
		return ErrAlreadyPaid
	}
	if i.total.IsZero() {
		return ErrZeroTotal
	}

	i.status = StatusPaid
	i.events = append(i.events, InvoicePaid{InvoiceID: i.id, PaidAt: at})
	return nil
}
```

Campos não exportados forçam alteração por métodos. Isso protege regra.

## Invariante

Invariante é uma regra que precisa continuar verdadeira depois de qualquer operação válida.

Exemplos:

- pedido pago não pode receber alteração de valor;
- saldo não pode ficar negativo;
- documento fiscal emitido não pode ser deletado;
- idempotency key não pode produzir dois efeitos diferentes.

## Domain event

Evento de domínio descreve algo que aconteceu no negócio. Ele não é mensagem RabbitMQ ainda. Primeiro ele pertence ao domínio; depois uma camada de aplicação decide publicar ou persistir.

```go
type InvoicePaid struct {
	InvoiceID string
	PaidAt    time.Time
}
```

## Onde parar

Nem todo CRUD precisa de aggregate rico. Se a operação só cadastra uma tabela auxiliar sem regra forte, use case simples basta.

DDD é valioso quando há:

- dinheiro;
- auditoria;
- workflow;
- concorrência;
- regra fiscal;
- eventos;
- múltiplos times falando do mesmo domínio.

## Critério de domínio

Você dominou este card quando consegue identificar aggregates pelos limites de consistência e colocar regras críticas dentro do domínio, não espalhadas em handlers e SQL.
