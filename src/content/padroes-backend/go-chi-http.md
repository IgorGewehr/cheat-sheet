---
title: "Go + Chi: HTTP Profissional"
category: padroes-backend
stack: [Go, Chi, HTTP]
tags: [golang, chi, rest, middleware, graceful-shutdown]
excerpt: "Como construir APIs HTTP em Go com Chi: roteamento, middlewares, validação, envelopes de erro, timeouts e shutdown correto."
related: [http-fundamentos-api, go-sdd-openapi, go-errors-context]
updated: "2026-05-07"
---

## Por que Chi

Chi é um router HTTP pequeno e idiomático para Go. Ele usa `net/http`, compõe middlewares com clareza e não tenta virar framework full-stack. Para serviços empresariais, isso é excelente: menos mágica, mais controle.

## Estrutura de router

```go
func NewRouter(deps Deps) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(timeoutMiddleware(10 * time.Second))
	r.Use(loggingMiddleware(deps.Logger))

	r.Get("/healthz", deps.Health.Handle)

	r.Route("/v1/invoices", func(r chi.Router) {
		r.Post("/", deps.InvoiceHandler.Create)
		r.Get("/{id}", deps.InvoiceHandler.Get)
		r.Post("/{id}/pay", deps.InvoiceHandler.Pay)
	})

	return r
}
```

## Handler não deve conter caso de uso inteiro

Handler é adaptador. Ele traduz HTTP para comando de aplicação e traduz resposta de aplicação para HTTP.

```go
func (h Handler) Create(w http.ResponseWriter, r *http.Request) {
	var input CreateInvoiceRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json")
		return
	}
	if err := input.Validate(); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed")
		return
	}

	cmd := invoice.CreateCommand{
		CustomerID: input.CustomerID,
		Amount:     input.Amount,
	}

	out, err := h.create.Execute(r.Context(), cmd)
	if err != nil {
		h.writeUseCaseError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, out)
}
```

## Middleware é política transversal

Use middleware para comportamento que atravessa endpoints:

- request id;
- auth;
- logging;
- panic recovery;
- timeout;
- CORS;
- rate limit;
- métricas.

Não use middleware para esconder regra de negócio.

## Graceful shutdown

Serviço profissional não morre no meio de request sem tentar encerrar com dignidade.

```go
srv := &http.Server{
	Addr:              cfg.HTTPAddr,
	Handler:           router,
	ReadHeaderTimeout: 5 * time.Second,
}

go func() {
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Fatal("http server failed", zap.Error(err))
	}
}()

<-ctx.Done()
shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
defer cancel()
_ = srv.Shutdown(shutdownCtx)
```

## Erros HTTP padronizados

Use códigos técnicos estáveis, não mensagens soltas:

```json
{
  "error": {
    "code": "invoice_already_paid",
    "message": "Invoice is already paid"
  }
}
```

Isso permite frontend, logs, dashboards e suporte falarem a mesma língua.

## Critério de domínio

Você dominou este card quando seus handlers são finos, todos os endpoints têm contrato de erro previsível e o servidor encerra sem cortar requests em andamento.
