---
title: "Go: Padrões para Microsserviços"
category: stack-guides
tags: [golang, microservices, grpc, docker, patterns]
stack: [Go, gRPC, Docker, PostgreSQL, Redis, Kafka]
excerpt: Go é a linguagem de facto para microsserviços de alta performance. Goroutines, binários pequenos, startup rápido e ótima lib padrão — mas os padrões de estrutura importam muito.
related: [golang-chi-gin-fiber, golang-grpc, event-driven, microservices-quando-usar, background-jobs]
updated: "2026-04"
---

## Por que Go para microsserviços

| Característica | Go | Node.js | Java |
|---|---|---|---|
| Startup time | ~10ms | ~200ms | ~2-5s |
| Memória idle | ~10MB | ~50MB | ~100-300MB |
| Binário | ~10MB estático | deps node_modules | JAR + JVM |
| Concorrência | Goroutines (nativas) | Event loop (single-thread) | Threads |
| Docker image | ~15MB (scratch) | ~200MB+ | ~300MB+ |

## Estrutura padrão de um microsserviço Go

```
/cmd/
  server/main.go          — entry point (cobra ou flag)
/internal/
  /domain/                — entidades de negócio (sem deps externas)
    user.go
    user_repository.go    — interface (não implementação)
  /application/           — use cases / handlers
    create_user.go
    get_user.go
  /infrastructure/
    /postgres/
      user_repo.go        — implementação do repository
    /grpc/
      server.go           — servidor gRPC
      handler.go
    /http/
      router.go           — endpoints REST (se necessário)
  /config/
    config.go             — Viper ou env vars validadas
/pkg/
  /errors/                — tipos de erro compartilhados
  /logger/                — slog wrapper
  /tracer/                — OpenTelemetry setup
```

## Injeção de dependências em Go (sem framework)

```go
// main.go — wire manual, simples e explícito
func main() {
    cfg := config.Load()

    db, err := postgres.Connect(cfg.DatabaseURL)
    if err != nil {
        log.Fatal("db connect:", err)
    }

    // Repository (infra layer)
    userRepo := postgres.NewUserRepository(db)

    // Use case (application layer)
    createUser := application.NewCreateUser(userRepo)
    getUser    := application.NewGetUser(userRepo)

    // gRPC server (infra layer)
    grpcServer := grpc.NewServer(createUser, getUser)
    grpcServer.Serve(cfg.GRPCPort)
}
```

## Concorrência idiomática — worker pool

```go
// Worker pool com channels — pattern básico para processamento paralelo
func processOrders(orders []Order, workers int) []Result {
    jobs    := make(chan Order, len(orders))
    results := make(chan Result, len(orders))

    // Sobe N workers
    for i := 0; i < workers; i++ {
        go func() {
            for order := range jobs {
                results <- processOrder(order)
            }
        }()
    }

    // Envia jobs
    for _, o := range orders {
        jobs <- o
    }
    close(jobs)

    // Coleta resultados
    out := make([]Result, 0, len(orders))
    for range orders {
        out = append(out, <-results)
    }
    return out
}
```

## Context propagation — obrigatório em todo serviço

```go
// Cancellation, deadlines e tracing via context
func (s *UserService) GetUser(ctx context.Context, id string) (*User, error) {
    // Context propaga cancellation do request HTTP/gRPC para o banco
    return s.repo.FindByID(ctx, id)
}

// Timeout por operação
func callExternalAPI(ctx context.Context, id string) (*Response, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
    return http.DefaultClient.Do(req)
}
```

## Observabilidade com OpenTelemetry

```go
// Tracing automático — veja latência de cada operação
import "go.opentelemetry.io/otel"

func (s *UserService) GetUser(ctx context.Context, id string) (*User, error) {
    ctx, span := otel.Tracer("user-service").Start(ctx, "GetUser")
    defer span.End()

    span.SetAttributes(attribute.String("user.id", id))

    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        span.RecordError(err)
        return nil, err
    }
    return user, nil
}
```

## Health check obrigatório

```go
// /health — usado pelo k8s/docker para liveliness e readiness
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    if err := db.PingContext(r.Context()); err != nil {
        w.WriteHeader(http.StatusServiceUnavailable)
        json.NewEncoder(w).Encode(map[string]string{"db": "down"})
        return
    }
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
})
```

## Dockerfile otimizado (multi-stage)

```dockerfile
# Build stage
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# Runtime stage — imagem mínima (~15MB)
FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/server /server
EXPOSE 8080 9090
ENTRYPOINT ["/server"]
```

## Como pedir pra IA

```
Crie um microsserviço Go com:
- Estrutura: /cmd, /internal/domain, /internal/application, /internal/infrastructure
- Interface de repositório no domain, implementação no infrastructure/postgres
- Injeção de dependências manual no main.go (sem wire)
- Context propagado em todos os métodos de service e repository
- gRPC server com proto definido em /proto
- Health check endpoint HTTP
- OpenTelemetry para tracing
- Dockerfile multi-stage com scratch como base final
Stack: Go {{versão}}, {{framework}}, pgx/v5, {{protobuf}}
```
