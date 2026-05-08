---
title: "Go: Resiliência Distribuída — Circuit Breaker, Retry, Hedging, Bulkhead"
category: padroes-backend
stack: [Go, sony/gobreaker, cenkalti/backoff, OpenTelemetry]
tags: [resilience, circuit-breaker, retry, timeout, bulkhead, hedging, golang]
excerpt: "Padrões de resiliência aplicados em Go: timeouts em camadas, retry com backoff+jitter, circuit breaker, bulkhead e hedging — sem cargo cult."
related: [go-errors-context, go-rabbitmq-event-driven, go-redis-cache-idempotencia, go-microservices-enterprise]
updated: "2026-05-08"
---

## Resiliência é decisão de produto

Resiliência custa caro em complexidade. Cada padrão abaixo só vale se você tiver:

- SLO definido para o caminho;
- métrica para validar antes/depois;
- entendimento do modo de falha que está atacando.

Aplicar todos os padrões em todos os clients é a forma mais comum de falhar — você empilha latência, retries em retries, e cria thundering herd quando o downstream se recupera.

## Timeout é o primeiro patamar

Todo client de I/O precisa de timeout explícito. Sem timeout, uma dependência lenta vira saturação de goroutines.

```go
client := &http.Client{
    Timeout: 5 * time.Second,
    Transport: &http.Transport{
        MaxIdleConns:          100,
        MaxIdleConnsPerHost:   20,
        IdleConnTimeout:       90 * time.Second,
        TLSHandshakeTimeout:   3 * time.Second,
        ResponseHeaderTimeout: 4 * time.Second,
    },
}
```

`Timeout` cobre o request inteiro. Em chamadas longas você precisa também de `context.WithTimeout` para honrar deadline propagado:

```go
ctx, cancel := context.WithTimeout(parentCtx, 5*time.Second)
defer cancel()
req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
```

Regra sênior: **timeout do filho < timeout do pai**. Se seu handler tem deadline de 2s, não chame downstream com timeout de 5s.

## Retry com backoff exponencial e jitter

Retry sem jitter é causa comum de thundering herd: todos os clients tentam novamente no mesmo segundo.

```go
import "github.com/cenkalti/backoff/v4"

func chargeCard(ctx context.Context, payload Payload) error {
    op := func() error {
        err := gateway.Charge(ctx, payload)
        if isPermanent(err) {
            return backoff.Permanent(err)
        }
        return err
    }

    bo := backoff.NewExponentialBackOff()
    bo.InitialInterval = 200 * time.Millisecond
    bo.MaxInterval     = 2 * time.Second
    bo.MaxElapsedTime  = 8 * time.Second
    bo.RandomizationFactor = 0.5 // jitter

    return backoff.Retry(op, backoff.WithContext(bo, ctx))
}
```

Princípios:

- **só retry idempotente** ou com idempotency key;
- erros de validação (4xx exceto 408/429) **não** são retryables;
- 429 deve respeitar `Retry-After` se vier;
- `backoff.Permanent` interrompe a cadeia para erros que nunca vão funcionar;
- número total de tentativas precisa caber no timeout do handler pai.

## Circuit Breaker

Circuit breaker corta chamada para downstream que está claramente quebrado, evitando que o serviço chamador segure goroutines em vão.

```go
import "github.com/sony/gobreaker"

cb := gobreaker.NewCircuitBreaker(gobreaker.Settings{
    Name:        "billing-gateway",
    MaxRequests: 3,                   // half-open: requests permitidos
    Interval:    60 * time.Second,    // janela de contagem
    Timeout:     30 * time.Second,    // tempo até tentar half-open
    ReadyToTrip: func(c gobreaker.Counts) bool {
        // abre se >= 5 requests e taxa de falha > 60%
        return c.Requests >= 5 && float64(c.TotalFailures)/float64(c.Requests) > 0.6
    },
    OnStateChange: func(name string, from, to gobreaker.State) {
        log.Warn("breaker", "name", name, "from", from, "to", to)
    },
})

result, err := cb.Execute(func() (any, error) {
    return gateway.Charge(ctx, payload)
})
```

Estados:

- **Closed**: tudo passa, contagem ativa;
- **Open**: requests falham imediatamente com `ErrOpenState`, sem chamar o downstream;
- **Half-Open**: depois de `Timeout`, libera `MaxRequests` para sondar.

Combinar breaker + retry exige cuidado: retry "por dentro" do breaker conta como uma chamada. Geralmente o breaker vai por fora.

## Bulkhead

Bulkhead limita concorrência por dependência, evitando que uma fila lenta consuma todo o pool de goroutines.

```go
type Bulkhead struct {
    sem chan struct{}
}

func New(max int) *Bulkhead { return &Bulkhead{sem: make(chan struct{}, max)} }

func (b *Bulkhead) Do(ctx context.Context, fn func() error) error {
    select {
    case b.sem <- struct{}{}:
        defer func() { <-b.sem }()
        return fn()
    case <-ctx.Done():
        return ctx.Err()
    }
}
```

Use por dependência: 50 conexões para o gateway lento não devem matar as 200 disponíveis para o gateway rápido.

## Hedging

Em chamadas tail-latency-sensitive, você pode disparar uma segunda tentativa em paralelo após pequeno delay e usar a primeira que responder. Útil quando p99 importa muito mais que custo extra.

```go
func hedgedGet(ctx context.Context, url string) (*http.Response, error) {
    type result struct {
        resp *http.Response
        err  error
    }
    ch := make(chan result, 2)

    go func() { resp, err := http.Get(url); ch <- result{resp, err} }()

    timer := time.NewTimer(50 * time.Millisecond)
    defer timer.Stop()

    select {
    case r := <-ch:
        return r.resp, r.err
    case <-timer.C:
        go func() { resp, err := http.Get(url); ch <- result{resp, err} }()
    }

    r := <-ch
    return r.resp, r.err
}
```

Use só onde:

- request é idempotente;
- custo extra é aceitável;
- você sabe o p50 e o p99 do downstream.

## Composição

Ordem usual da fora para dentro:

1. timeout do handler;
2. bulkhead da dependência;
3. circuit breaker;
4. retry com backoff;
5. timeout do client HTTP/gRPC;
6. chamada efetiva.

Cada camada precisa de teste de integração que prove o comportamento sob falha — Testcontainers + toxiproxy, por exemplo.

## Observabilidade dos padrões

Sem métrica, esses padrões viram suposição. Exporte:

- `circuit_breaker_state{name=...}`;
- `retry_attempts_total{operation=...}`;
- `bulkhead_inflight{name=...}` e `bulkhead_rejected_total`;
- `request_duration_seconds_bucket{operation=..., outcome=...}`.

Em incidente, você precisa enxergar quem segurou o quê.

## Anti-padrões comuns

- retry agressivo sem jitter, sem cap de tentativas;
- breaker com `Timeout` muito curto que oscila;
- timeout filho maior que pai — gera leaks de goroutine no caller;
- retry de 5xx em endpoints **não** idempotentes — duplica cobranças;
- bulkhead global compartilhado entre dependências independentes.

## Critério de domínio

Você dominou este card quando consegue desenhar a stack de resiliência de um endpoint olhando para o SLO, a taxa de erro do downstream e o impacto de p99 — e remover camadas que não estão pagando o custo de complexidade.
