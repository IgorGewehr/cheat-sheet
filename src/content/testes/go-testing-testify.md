---
title: "Go: Testes com testing, testify e Table-Driven Tests"
category: testes
stack: [Go, testing, testify]
tags: [golang, testing, testify, tdd, table-driven-tests]
excerpt: "Testes Go idiomáticos: testing padrão, testify com moderação, table-driven tests, fakes, fixtures e asserções que protegem comportamento."
related: [tdd-red-green-refactor, test-data-builders, go-integration-testcontainers]
updated: "2026-05-07"
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

## O que testar em unidade

Teste unidade quando quer validar regra sem infraestrutura:

- invariantes de aggregate;
- validação de comando;
- cálculo de dinheiro;
- política de retry;
- tradução de erro;
- decisão de roteamento.

Não teste getter/setter. Teste comportamento.

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

## Critério de domínio

Você dominou este card quando seus testes explicam regra de negócio, falham com mensagem útil e não quebram a cada refactor interno legítimo.
