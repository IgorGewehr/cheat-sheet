---
title: "Go: Testes com testing, testify e Table-Driven Tests"
category: testes
stack: [Go, testing, testify]
tags: [golang, testing, testify, tdd, table-driven-tests]
excerpt: "Testes Go idiomáticos: testing padrão, testify com moderação, table-driven tests, fakes, fixtures e asserções que protegem comportamento."
related: [tdd-red-green-refactor, test-data-builders, go-integration-testcontainers]
updated: "2026-05-08"
---

## O básico

Go já vem com framework de teste:

```go
func TestMoney_Add(t *testing.T) {
	got, err := Money{Cents: 100}.Add(Money{Cents: 50})
	require.NoError(t, err)
	assert.Equal(t, int64(150), got.Cents)
}
```

`testify/require` encerra o teste ao falhar. `testify/assert` registra falha e continua. Use `require` quando a próxima linha depende da anterior.

## O papel dos testes na era da IA

Se a IA escreve sintaxe, testes viram especificação executável. Você usa testes para prender o comportamento que importa e deixar a IA trocar implementação sem quebrar a intenção.

Um bom teste diz:

- qual regra existe;
- qual cenário importa;
- qual efeito deve acontecer;
- qual efeito não deve acontecer;
- qual erro representa a falha.

Teste ruim só repete a implementação.

## Table-driven tests

Bom para várias entradas do mesmo comportamento:

```go
func TestInvoice_CanBePaid(t *testing.T) {
	tests := []struct {
		name    string
		status  Status
		wantErr error
	}{
		{name: "open invoice", status: StatusOpen},
		{name: "already paid", status: StatusPaid, wantErr: ErrAlreadyPaid},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			inv := NewInvoice(tt.status)
			err := inv.Pay(time.Now())
			require.ErrorIs(t, err, tt.wantErr)
		})
	}
}
```

Subtestes (`t.Run`) deixam falhas legíveis.

Uma versão mais rica testa transição de estado e evento:

```go
func TestInvoice_Pay(t *testing.T) {
	tests := []struct {
		name       string
		invoice    Invoice
		wantErr    error
		wantStatus Status
		wantEvents int
	}{
		{
			name:       "open invoice can be paid",
			invoice:    openInvoiceFixture(),
			wantStatus: StatusPaid,
			wantEvents: 1,
		},
		{
			name:       "paid invoice cannot be paid again",
			invoice:    paidInvoiceFixture(),
			wantErr:    ErrAlreadyPaid,
			wantStatus: StatusPaid,
			wantEvents: 0,
		},
		{
			name:       "cancelled invoice cannot be paid",
			invoice:    cancelledInvoiceFixture(),
			wantErr:    ErrCancelled,
			wantStatus: StatusCancelled,
			wantEvents: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.invoice.Pay(time.Date(2026, 5, 8, 10, 0, 0, 0, time.UTC))

			require.ErrorIs(t, err, tt.wantErr)
			assert.Equal(t, tt.wantStatus, tt.invoice.Status())
			assert.Len(t, tt.invoice.PullEvents(), tt.wantEvents)
		})
	}
}
```

Esse teste não pergunta "como Pay foi implementado". Ele pergunta "que comportamento Pay garante".

## O que testar em unidade

Teste unidade quando quer validar regra sem infraestrutura:

- invariantes de aggregate;
- validação de comando;
- cálculo de dinheiro;
- política de retry;
- tradução de erro;
- decisão de roteamento.

Não teste getter/setter. Teste comportamento.

## Arrange, Act, Assert

Estruture teste como narrativa:

```go
func TestPayInvoice_DoesNotSaveWhenRuleFails(t *testing.T) {
	// Arrange
	repo := &fakeRepo{invoice: paidInvoiceFixture()}
	outbox := &fakeOutbox{}
	uc := newPayInvoiceUseCase(repo, outbox)

	// Act
	err := uc.Execute(context.Background(), PayInvoiceCommand{InvoiceID: "inv_123"})

	// Assert
	require.ErrorIs(t, err, ErrAlreadyPaid)
	assert.False(t, repo.saved)
	assert.Empty(t, outbox.events)
}
```

Os asserts negativos são importantes: eles provam que o sistema não salvou nem publicou quando a regra falhou.

## Fakes em vez de mocks frágeis

Para use case, fake simples costuma ser melhor que mock verboso.

```go
type fakeRepo struct {
	invoice Invoice
	saved   bool
}

func (f *fakeRepo) FindByID(ctx context.Context, id string) (Invoice, error) {
	return f.invoice, nil
}

func (f *fakeRepo) Save(ctx context.Context, inv Invoice) error {
	f.saved = true
	f.invoice = inv
	return nil
}
```

## Quando usar mock

Mock é útil quando a interação é o comportamento, por exemplo:

- garantir que um publisher foi chamado com evento específico;
- garantir que retry chamou três vezes;
- simular timeout de cliente externo.

Mas para repositório e regra de domínio, fake costuma produzir teste mais legível e menos acoplado a ordem interna de chamadas.

## Pirâmide prática para Go enterprise

| Camada | Ferramenta | O que protege |
|---|---|---|
| Domínio | `testing` + table tests | invariantes e value objects |
| Use case | fakes + `testify` | orquestração e efeitos |
| Adapter DB | Testcontainers Postgres | SQL, migrations, constraints |
| HTTP | `httptest` + OpenAPI validator | contrato e erros |
| Consumer | RabbitMQ real ou fake de delivery | ack/nack, idempotência |
| Sistema | Compose/e2e pontual | fluxo crítico entre serviços |

Você não precisa testar tudo em todo nível. Precisa escolher o nível mais barato que prova o risco.

## Test smell

Sinais de teste ruim:

- falha quando renomeia variável interna;
- precisa de 80 linhas de setup para regra simples;
- mock verifica sequência irrelevante de chamadas;
- só testa caminho feliz;
- não testa erro de domínio;
- usa banco real para testar cálculo puro;
- usa fake quando SQL/constraint é justamente o risco.

## Critério de domínio

Você dominou este card quando seus testes explicam regra de negócio, falham com mensagem útil e não quebram a cada refactor interno legítimo.
