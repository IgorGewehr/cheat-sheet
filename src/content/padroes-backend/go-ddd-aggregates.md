---
title: "Go: DDD Pragmático, Aggregates e Invariantes"
category: padroes-backend
stack: [Go, DDD]
tags: [golang, ddd, aggregates, domain-events, invariants]
excerpt: "DDD em Go para sistemas caros: linguagem ubíqua, aggregates, invariantes, eventos de domínio e onde parar antes do excesso de abstração."
related: [ddd-light-erp, go-clean-hexagonal, go-outbox-idempotency]
updated: "2026-05-08"
---

## DDD não é pasta, é entendimento

Domain-Driven Design começa com linguagem ubíqua: a mesma linguagem entre engenharia, produto, operação e negócio. Se o negócio fala "fatura", "liquidação", "estorno" e o código fala `ThingProcessor`, você perdeu conhecimento.

Em Go, DDD costuma funcionar melhor com tipos pequenos, métodos claros e invariantes explícitas.

## DDD em uma frase prática

DDD é transformar conhecimento de negócio em modelo executável. O código não só armazena dados; ele impede estados impossíveis.

Modelo anêmico:

```go
invoice.Status = "paid"
```

Modelo rico:

```go
err := invoice.Pay(clock.Now())
```

A diferença não é estética. No segundo caso, existe um lugar óbvio para validar se a fatura já foi paga, se foi cancelada, se o valor é válido e quais eventos precisam nascer.

## Linguagem ubíqua

Linguagem ubíqua é vocabulário compartilhado. Não é só traduzir termos para inglês; é alinhar significado.

Exemplo:

| Negócio fala | Código deveria falar | Cuidado |
|---|---|---|
| Fatura | `Invoice` | não chamar de `BillingRecord` se o time não usa esse termo |
| Liquidação | `Settlement` | talvez não seja o mesmo que pagamento |
| Estorno | `Refund` ou `Chargeback` | termos diferentes podem ter regras diferentes |
| Lançamento | `LedgerEntry` | não misturar com evento de domínio |

Quando você não entende o termo, pare e pergunte. Esse é trabalho sênior.

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

## Constructor e restore

Em Go, use construtor para criar estado novo e função de restore para reconstruir do banco.

```go
func NewInvoice(id ID, customerID CustomerID, total Money) (Invoice, error) {
	if total.IsZero() {
		return Invoice{}, ErrZeroTotal
	}

	inv := Invoice{
		id:         id,
		customerID: customerID,
		total:      total,
		status:     StatusOpen,
	}
	inv.record(InvoiceCreated{InvoiceID: id.String()})
	return inv, nil
}

func Restore(params RestoreParams) (Invoice, error) {
	if params.ID == "" {
		return Invoice{}, ErrInvalidID
	}
	if !params.Status.IsKnown() {
		return Invoice{}, ErrInvalidStatus
	}
	if params.Total.IsZero() && params.Status != StatusDraft {
		return Invoice{}, ErrInvalidPersistedState
	}
	return Invoice{
		id:     params.ID,
		total:  params.Total,
		status: params.Status,
	}, nil
}
```

`NewInvoice` aplica regra de criação e gera evento novo. `Restore` reconstrói algo que já aconteceu. Misturar os dois gera bug sutil: carregar do banco não deveria emitir `InvoiceCreated` de novo.

## Invariante

Invariante é uma regra que precisa continuar verdadeira depois de qualquer operação válida.

Exemplos:

- pedido pago não pode receber alteração de valor;
- saldo não pode ficar negativo;
- documento fiscal emitido não pode ser deletado;
- idempotency key não pode produzir dois efeitos diferentes.

## Aggregate boundary

Boundary de aggregate é limite transacional. Tudo que precisa ser consistente no mesmo commit deve estar dentro do mesmo aggregate ou ser coordenado pelo mesmo use case.

Perguntas para descobrir boundary:

- Que regra precisa ser sempre verdadeira?
- Quais objetos mudam juntos?
- Qual é a menor unidade que precisa de lock?
- Posso aceitar consistência eventual entre esses conceitos?

Exemplo:

- `Invoice` e suas linhas podem estar no mesmo aggregate se total depende das linhas.
- `Invoice` e `LedgerEntry` geralmente não precisam estar no mesmo aggregate; ledger pode reagir ao evento `InvoicePaid`.

Isso reduz lock, acoplamento e transações gigantes.

## Domain event

Evento de domínio descreve algo que aconteceu no negócio. Ele não é mensagem RabbitMQ ainda. Primeiro ele pertence ao domínio; depois uma camada de aplicação decide publicar ou persistir.

```go
type InvoicePaid struct {
	InvoiceID string
	PaidAt    time.Time
}
```

Um aggregate pode acumular eventos:

```go
func (i *Invoice) record(event DomainEvent) {
	i.events = append(i.events, event)
}

func (i *Invoice) PullEvents() []DomainEvent {
	events := i.events
	i.events = nil
	return events
}
```

O use case chama `PullEvents` e grava na outbox dentro da mesma transação.

## Value Objects

Value object representa conceito pelo valor, não por identidade. Dinheiro é exemplo clássico.

```go
type Money struct {
	cents    int64
	currency string
}

func NewMoney(cents int64, currency string) (Money, error) {
	if cents < 0 {
		return Money{}, ErrNegativeMoney
	}
	if currency == "" {
		return Money{}, ErrMissingCurrency
	}
	return Money{cents: cents, currency: currency}, nil
}

func (m Money) Add(other Money) (Money, error) {
	if m.currency != other.currency {
		return Money{}, ErrCurrencyMismatch
	}
	if other.cents > 0 && m.cents > math.MaxInt64-other.cents {
		return Money{}, ErrMoneyOverflow
	}
	return Money{cents: m.cents + other.cents, currency: m.currency}, nil
}
```

Isso elimina bugs como somar BRL com USD ou aceitar valor negativo onde não pode.

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

## DDD com IA

Se a IA escreve a sintaxe, seu trabalho fica ainda mais importante:

- nomear conceitos corretamente;
- definir invariantes;
- escolher aggregate boundaries;
- decidir onde há consistência forte ou eventual;
- rejeitar modelo anêmico gerado automaticamente;
- revisar se o código expressa o domínio ou só persiste DTO.

Prompt ruim: "crie CRUD de invoice".

Prompt melhor:

```text
Modele o aggregate Invoice em Go.
Invariantes:
- Invoice começa Open.
- Invoice cancelada não pode ser paga.
- Invoice paga não pode alterar total.
- Pay gera evento InvoicePaid.
- NewInvoice gera InvoiceCreated.
Use campos não exportados, constructor, Restore e testes table-driven.
Não importe HTTP, SQL ou RabbitMQ no domínio.
```

## Exercício prático

Modele `Invoice`, `Payment` e `LedgerEntry`. Depois decida:

- quais são entities?
- quais são value objects?
- qual é aggregate root?
- qual regra exige transação?
- qual regra pode ser eventual?
- quais eventos nascem?

Se você consegue responder isso antes de codar, você está pensando como engenheiro, não como digitador de framework.

## Critério de domínio

Você dominou este card quando consegue identificar aggregates pelos limites de consistência e colocar regras críticas dentro do domínio, não espalhadas em handlers e SQL.
