---
title: "Go Checkpoint Tier 3 — Persistência, Arquitetura, gRPC, Resiliência"
category: checklists
stack: [Go, PostgreSQL, RabbitMQ, Redis, gRPC]
tags: [checkpoint, exercicios, golang, hexagonal, ddd, grpc, resilience, pleno, exam-prep]
excerpt: "8 challenges para validar tier 3 antes do exame: transações, hexagonal, DDD, eventos, resiliência distribuída e trade-offs reais — passe e você está pronto pra entrevista pleno/sênior júnior."
related: [go-clean-hexagonal, go-ddd-aggregates, go-rabbitmq-event-driven, go-redis-cache-idempotencia, go-resilience-patterns, golang-grpc]
updated: "2026-05-08"
---

## Como usar

Tier 3 é onde "saber Go" vira "saber arquitetar Go". Resolva sem consultar primeiro. Se acertar 6+ você pode fazer o exame de tier 3.

---

## 1. 🧠 Transação que não é

```go
func (s Service) CreateInvoice(ctx context.Context, req CreateReq) (Invoice, error) {
    inv, err := s.repo.Insert(ctx, req)
    if err != nil { return Invoice{}, err }

    if err := s.events.PublishInvoiceCreated(ctx, inv); err != nil {
        return Invoice{}, err
    }

    return inv, nil
}
```

Aponte o problema e diga o nome do padrão que resolve.

<details>
<summary>Resposta</summary>

**Dual write problem**: se o publish falhar, o invoice ficou no banco mas o evento nunca saiu — consumers ignoram. Se rodasse na ordem inversa, o evento sai e o banco falha — pior ainda.

Padrão: **Outbox**. Salve evento numa tabela `outbox` na **mesma transação** do insert. Um worker separado lê outbox e publica em RabbitMQ, marcando como sent. Garante at-least-once entre banco e fila.
</details>

---

## 2. 🛠️ Repository boundary

Você tem este código em uma camada de aplicação. O que está errado pela ótica de hexagonal?

```go
package application

import "github.com/jackc/pgx/v5/pgxpool"

type CreateInvoiceUseCase struct {
    pool *pgxpool.Pool
}

func (uc *CreateInvoiceUseCase) Execute(ctx context.Context, cmd Command) error {
    _, err := uc.pool.Exec(ctx, "INSERT INTO invoices ...")
    return err
}
```

<details>
<summary>Resposta</summary>

Application layer importou `pgxpool` — vazou infraestrutura para o domínio. Em hexagonal, application define **port** (interface), infra implementa **adapter**:

```go
// application/invoice.go
type InvoiceRepository interface {
    Save(ctx context.Context, inv invoice.Invoice) error
}

type CreateInvoiceUseCase struct {
    repo InvoiceRepository  // port
}

// infrastructure/postgres/invoice_repo.go (importa pgx)
type InvoiceRepository struct { q *db.Queries }
func (r *InvoiceRepository) Save(...) error { ... }
```

Wiring no `cmd/api/main.go`. Use case fica testável com fake.
</details>

---

## 3. 🧠 Aggregate boundary

Você está modelando um sistema de pedidos. Recebe a sugestão: "Order tem N OrderItems, então Order é um aggregate root e OrderItem é entity dentro dele". O time discorda. Por quê pode estar errado e qual é a heurística?

<details>
<summary>Resposta</summary>

Heurística: aggregate **protege uma invariante de consistência**. Pergunte "qual invariante quebra se eu modificar OrderItem sem passar por Order?".

- Se "soma dos itens precisa bater com `total` do order" → sim, Order é aggregate, mude itens só pelo Order.
- Se itens podem ser editados livremente sem ferir consistência → talvez sejam entities independentes, e Order só faz referência por ID.

A regra "se A tem muitos B então A é aggregate" é a forma mais comum de criar aggregates gigantes que viram contention de banco. **Aggregate pequeno é melhor**.
</details>

---

## 4. 🛠️ Idempotency key

Endpoint `POST /charges` recebe header `Idempotency-Key`. Esboce a lógica server-side:

- mesma chave + mesmo payload → retorna response anterior.
- mesma chave + payload diferente → conflito.
- chave nova → processa normalmente.

<details>
<summary>Resposta</summary>

```go
type StoredResult struct {
    PayloadHash string
    Status      int
    Body        []byte
    CreatedAt   time.Time
}

func (h *Handler) Charge(w http.ResponseWriter, r *http.Request) {
    key := r.Header.Get("Idempotency-Key")
    body, _ := io.ReadAll(r.Body)
    payloadHash := sha256Hex(body)

    if key != "" {
        if cached, ok := h.idempotency.Get(r.Context(), key); ok {
            if cached.PayloadHash != payloadHash {
                respondError(w, http.StatusConflict, "idempotency key reused with different payload")
                return
            }
            w.WriteHeader(cached.Status)
            w.Write(cached.Body)
            return
        }
    }

    // processa, captura status e body, salva em h.idempotency com TTL
}
```

Pontos críticos: salvar **dentro da mesma transação** que cria o charge (ou usar outbox), TTL típico 24h, escopo por usuário/tenant para evitar adversário usar chave já usada.
</details>

---

## 5. 🧠 gRPC vs REST

Você está desenhando comunicação entre `billing-service` e `notification-service` (mesma empresa). Liste 4 critérios para escolher gRPC vs REST/JSON e dê o veredito.

<details>
<summary>Resposta</summary>

Critérios:

1. **Latência**: gRPC sobre HTTP/2 com proto é ~30% menor payload e parse mais rápido.
2. **Contrato**: proto gera client e server tipados — mudanças incompatíveis ficam visíveis em build, não em runtime.
3. **Streaming**: gRPC tem streaming bidirecional nativo, REST precisa de SSE/WebSocket.
4. **Operação**: REST com OpenAPI tem mais ferramenta de debug (Postman, browsers, curl). gRPC requer grpcurl/Bloomrpc.

Para entre microsserviços internos: **gRPC** (ou Connect-Go se quiser também HTTP/1.1).
Para API pública/SPA/mobile: REST/JSON.
</details>

---

## 6. 🛠️ Circuit breaker

Implemente estados de um circuit breaker em pseudo-código (closed → open → half-open → closed). Quais 3 parâmetros configurar?

<details>
<summary>Resposta</summary>

Estados:

- **Closed**: passa tudo, conta falhas. Se taxa de falha em janela passa do limiar com volume mínimo → **Open**.
- **Open**: rejeita imediatamente (`ErrOpenState`), sem chamar downstream. Após timeout → **Half-Open**.
- **Half-Open**: libera N requests de prova. Todos OK → **Closed**. Qualquer falha → **Open**.

Parâmetros:

1. **Threshold**: % de falha + volume mínimo (ex: ≥ 60% em ≥ 5 requests).
2. **Open timeout**: quanto tempo fica em open antes de tentar half-open.
3. **Half-open trials**: quantos requests de prova liberar antes de decidir.

`sony/gobreaker` cobre isso em ~100 linhas de Go.
</details>

---

## 7. 🧠 Cache pitfall

O dev escreveu:

```go
func (s Service) GetInvoice(ctx context.Context, id string) (Invoice, error) {
    if cached, ok := s.cache.Get(ctx, "invoice:"+id); ok {
        return cached, nil
    }
    inv, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return Invoice{}, err
    }
    s.cache.Set(ctx, "invoice:"+id, inv, 24*time.Hour)
    return inv, nil
}
```

Existem 3 problemas que aparecem em produção. Liste.

<details>
<summary>Resposta</summary>

1. **Sem invalidação**: quando o invoice muda, o cache fica obsoleto por 24h. Precisa de evict no path de update OU TTL menor + tolerância ao stale.
2. **Cache stampede**: se a chave expira durante pico, N requests batem no banco simultaneamente. Mitigação: single-flight (`golang.org/x/sync/singleflight`), early refresh ou jittered TTL.
3. **Cache de erro**: se a query falhar, nada é cacheado — bom. Mas se a query retornar "não encontrado", o código loga isso como erro? Cuidado para não cachear `nil` como hit válido — separe miss/empty.
</details>

---

## 8. 🛠️ Backpressure

Seu consumer RabbitMQ está processando 50 mensagens por segundo, mas o banco só aguenta 20 inserts/s. Sintomas: pool de conexões zerado, latência subindo, eventual OOM. O que ajustar?

<details>
<summary>Resposta</summary>

Três alavancas, na ordem:

1. **Prefetch do consumer**: `channel.Qos(prefetch=20, global=false)`. Sem isso o RabbitMQ entrega tudo, o consumer enfileira em memória e o pool de DB sofre.
2. **Concorrência interna**: limite a `n` workers consumindo do channel interno; o resto fica na fila do RabbitMQ (broker é o buffer correto).
3. **Pool de DB**: confirme que `MaxConns` está dimensionado e que a transação não está mais longa que o necessário (libera conexão rápido).

Não tente "acelerar o banco" — backpressure é solução. Broker é o reservatório, processe no ritmo do recurso mais escasso.
</details>

---

## Critério para fazer o exame Tier 3

- 6+ dos 8 corretos sem consultar.
- Identificou dual-write na questão 1 e nomeou outbox.
- Esboçou idempotency-key (questão 4) com handling de payload diverging.
- Sabe argumentar gRPC vs REST com 4 critérios (questão 5).
- Sabe diagnosticar gargalo distribuído com pelo menos 3 alavancas (questão 8).

Pronto: rode `/skills/go-enterprise/exam/3`.
