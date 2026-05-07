---
title: "Go: Errors, Context e Cancelamento"
category: stack-guides
stack: [Go]
tags: [golang, errors, context, cancellation, deadlines]
excerpt: "O coração operacional de Go em backend: erros explícitos, wrapping, sentinels, context propagation, timeouts e cancelamento correto."
related: [go-sintaxe-tipos-controle, go-chi-http, go-postgres-pgx-sqlc]
updated: "2026-05-07"
---

## Erro em Go é valor

Go não usa exceções para fluxo normal. Funções retornam `error` explicitamente:

```go
invoice, err := repo.FindByID(ctx, id)
if err != nil {
	return Invoice{}, fmt.Errorf("find invoice: %w", err)
}
```

O `%w` faz wrapping. Isso preserva a causa original para `errors.Is` e `errors.As`.

## Sentinels e tipos de erro

Sentinel error é um valor comparável usado para representar uma condição conhecida.

```go
var ErrInvoiceNotFound = errors.New("invoice not found")
```

Uso:

```go
if errors.Is(err, invoice.ErrInvoiceNotFound) {
	http.Error(w, "not found", http.StatusNotFound)
	return
}
```

Use sentinel para estados de domínio estáveis: não encontrado, conflito, regra violada. Use tipos de erro quando precisa carregar campos.

```go
type ValidationError struct {
	Field string
	Rule  string
}

func (e ValidationError) Error() string {
	return e.Field + " violates " + e.Rule
}
```

## Context não é saco de dependências

`context.Context` carrega cancelamento, deadline e valores request-scoped. Ele não deve carregar logger global, config, db ou service.

Regra prática:

- primeiro parâmetro de funções que fazem I/O deve ser `ctx context.Context`;
- não armazene `context.Context` em struct;
- sempre chame `defer cancel()` quando criar timeout;
- passe o context até banco, HTTP client, Redis e RabbitMQ quando a lib suportar.

```go
func (r Repository) FindByID(ctx context.Context, id string) (Invoice, error) {
	row := r.pool.QueryRow(ctx, findInvoiceSQL, id)
	// ...
}
```

## Timeouts

Timeout sem contexto vira promessa vazia. Em serviço HTTP, o request já tem context; você pode derivar um timeout menor para dependência externa.

```go
ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
defer cancel()

result, err := client.AuthorizePayment(ctx, command)
```

## Tradução de erro por camada

Não deixe erro de PostgreSQL vazar para HTTP como texto cru. Faça tradução nas bordas.

```go
switch {
case errors.Is(err, invoice.ErrNotFound):
	writeError(w, http.StatusNotFound, "invoice_not_found")
case errors.Is(err, invoice.ErrAlreadyPaid):
	writeError(w, http.StatusConflict, "invoice_already_paid")
default:
	logger.Error("request failed", zap.Error(err))
	writeError(w, http.StatusInternalServerError, "internal_error")
}
```

## Critério de domínio

Você dominou este card quando consegue explicar a diferença entre erro de domínio, erro de infraestrutura e erro HTTP, e quando todo I/O do seu serviço aceita `context.Context`.
