---
title: "Go Checkpoint Tier 1 — Base, HTTP, Concorrência, Generics"
category: checklists
stack: [Go]
tags: [checkpoint, exercicios, golang, concorrencia, generics, junior, exam-prep]
excerpt: "8 challenges para fixar tier 1 antes do exame: layout de projeto, error wrapping, channel patterns, generics, HTTP e configuração — passe nos 8 e você está pronto pra entrevista júnior+."
related: [go-modulos-layout-projetos, go-errors-context, go-concorrencia-goroutines, go-generics-modernos, go-chi-http]
updated: "2026-05-08"
---

## Como usar

Resolva mentalmente ou rabisque, abra o card relacionado **só depois** de tentar. Se você não consegue resolver pelo menos 6 dos 8 sem olhar, repita os cards do tier antes de fazer o exame.

Cada challenge tem nível: ⚡ rápido, 🧠 raciocínio, 🛠️ mãos na massa.

---

## 1. ⚡ Spot the leak

```go
func processOrders(orders []Order) {
    for _, order := range orders {
        go func() {
            charge(order)
        }()
    }
}
```

Dois bugs sérios. Quais e como corrige cada um?

<details>
<summary>Resposta</summary>

1. **Capture de variável de loop**: `order` é a mesma variável reutilizada, todas as goroutines podem ver o último valor (em Go < 1.22). Corrija com `go func(o Order) { charge(o) }(order)` ou em Go 1.22+ confie no novo escopo do `for`.
2. **Sem condição de término / sem context / sem WaitGroup**: a função retorna sem esperar e sem cancelamento. Use `errgroup.Group` ou `sync.WaitGroup` + `context.Context` propagado.
</details>

---

## 2. 🧠 Errors

Você está revisando este wrapper:

```go
func GetUser(id string) (User, error) {
    u, err := repo.Find(id)
    if err != nil {
        return User{}, errors.New("user not found")
    }
    return u, nil
}
```

Aponte 3 problemas e mostre a versão sênior.

<details>
<summary>Resposta</summary>

1. Perde o erro original — `errors.Is/As` não funciona mais com a causa raiz.
2. Mente sobre o tipo: erro pode ser timeout, conexão perdida, etc., não só "not found".
3. Sem context propagado.

Versão sênior:

```go
var ErrUserNotFound = errors.New("user not found")

func GetUser(ctx context.Context, id string) (User, error) {
    u, err := repo.Find(ctx, id)
    if errors.Is(err, ErrUserNotFound) {
        return User{}, ErrUserNotFound
    }
    if err != nil {
        return User{}, fmt.Errorf("get user %s: %w", id, err)
    }
    return u, nil
}
```
</details>

---

## 3. 🛠️ Worker pool

Implemente uma função `RunWorkers(ctx, n, jobs, handler)` que:

- consome de `<-chan Job`;
- usa `n` workers;
- para limpinho quando o context cancela OU o channel fecha;
- propaga erro do primeiro handler que falhar e cancela os outros.

<details>
<summary>Resposta</summary>

```go
import "golang.org/x/sync/errgroup"

func RunWorkers(ctx context.Context, n int, jobs <-chan Job, handle func(context.Context, Job) error) error {
    g, gctx := errgroup.WithContext(ctx)
    for i := 0; i < n; i++ {
        g.Go(func() error {
            for {
                select {
                case <-gctx.Done():
                    return gctx.Err()
                case job, ok := <-jobs:
                    if !ok { return nil }
                    if err := handle(gctx, job); err != nil { return err }
                }
            }
        })
    }
    return g.Wait()
}
```

`errgroup.WithContext` cancela o contexto derivado quando o primeiro retorno é erro — exatamente o comportamento pedido.
</details>

---

## 4. ⚡ Channel sutileza

O que cada uma destas operações faz?

```go
var ch chan int
ch <- 1            // (a)

c2 := make(chan int)
close(c2)
v, ok := <-c2      // (b)
c2 <- 1            // (c)

c3 := make(chan int, 1)
c3 <- 1
c3 <- 2            // (d)
```

<details>
<summary>Resposta</summary>

(a) Bloqueia para sempre — send em canal `nil` nunca progride.
(b) `v=0, ok=false` — recebe zero value de canal fechado, sem bloquear.
(c) **Panic** — send em canal fechado.
(d) Bloqueia até alguém receber — buffer cheio.
</details>

---

## 5. 🛠️ Generics

Implemente uma função `GroupBy[T any, K comparable](items []T, key func(T) K) map[K][]T`. Em seguida diga em **uma linha** quando você **não** usaria generics aqui.

<details>
<summary>Resposta</summary>

```go
func GroupBy[T any, K comparable](items []T, key func(T) K) map[K][]T {
    out := make(map[K][]T)
    for _, item := range items {
        k := key(item)
        out[k] = append(out[k], item)
    }
    return out
}
```

Não usaria generics se o código só agrupa um tipo concreto em um único lugar — `func GroupOrdersByCustomer(...)` é mais legível e evita a constraint extra de `comparable`.
</details>

---

## 6. 🧠 HTTP middleware

Por que essa middleware vaza memória sob carga?

```go
func RequestID(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        id := uuid.NewString()
        ctx := context.WithValue(r.Context(), "request_id", id)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

<details>
<summary>Resposta</summary>

A chave do `context.WithValue` é uma string raw — colide com qualquer outro middleware que use a mesma string. Não é "vazamento de memória" no sentido literal, mas o problema sênior é **collision risk** e é o que o vet/lint reporta. Use chave tipada:

```go
type requestIDKey struct{}
ctx := context.WithValue(r.Context(), requestIDKey{}, id)
```

Adicional: convém propagar o ID de volta no header `X-Request-ID` da resposta para o client poder correlacionar.
</details>

---

## 7. 🛠️ Config validation

Escreva uma função `Load() (Config, error)` que:

- lê env vars;
- exige `DATABASE_URL` no boot;
- usa default `:8080` para `HTTP_ADDR`;
- proíbe `DATABASE_URL` apontando para `localhost` quando `ENVIRONMENT=production`.

<details>
<summary>Resposta</summary>

```go
type Config struct {
    Environment string
    HTTPAddr    string
    DatabaseURL string
}

func Load() (Config, error) {
    cfg := Config{
        Environment: getenv("ENVIRONMENT", "development"),
        HTTPAddr:    getenv("HTTP_ADDR", ":8080"),
        DatabaseURL: os.Getenv("DATABASE_URL"),
    }
    if cfg.DatabaseURL == "" {
        return Config{}, errors.New("DATABASE_URL is required")
    }
    if cfg.Environment == "production" && strings.Contains(cfg.DatabaseURL, "localhost") {
        return Config{}, errors.New("production database cannot point to localhost")
    }
    return cfg, nil
}

func getenv(k, def string) string {
    if v := os.Getenv(k); v != "" { return v }
    return def
}
```

Falhar no boot é a regra — config inválida no primeiro request é difícil de diagnosticar.
</details>

---

## 8. 🧠 Generics armadilha

Por que isso **não** compila?

```go
func Sum[T any](xs []T) T {
    var total T
    for _, x := range xs {
        total += x
    }
    return total
}
```

<details>
<summary>Resposta</summary>

`any` não suporta operador `+`. A constraint precisa garantir que o tipo é "somável":

```go
type Numeric interface {
    ~int | ~int64 | ~float32 | ~float64
}

func Sum[T Numeric](xs []T) T { ... }
```

Em Go 1.21+ existe `cmp.Ordered` e `golang.org/x/exp/constraints.Ordered` para casos comuns.
</details>

---

## Critério para fazer o exame Tier 1

- 6 ou mais dos 8 corretos sem consultar.
- Conseguiu apontar bugs em código real (questões 1, 2, 6).
- Implementou worker pool com errgroup (questão 3).
- Sabe explicar quando NÃO usar generics (questão 5).

Se passou: rode o exame em `/skills/go-enterprise/exam/1`. Se não passou: revise os cards `go-concorrencia-goroutines`, `go-errors-context`, `go-generics-modernos` e refaça em outro dia.
