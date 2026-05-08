---
title: "Go: Observabilidade — slog, OpenTelemetry, Métricas e Traces"
category: infra
stack: [Go, slog, Zap, Zerolog, OpenTelemetry, Prometheus]
tags: [observability, logging, tracing, metrics, slog, golang, opentelemetry]
excerpt: "Observabilidade Go moderna: slog (1.21+ stdlib), OTel SDK, métricas RED/USE, traces correlacionados e diagnóstico sob pressão sem cargo cult."
related: [observability, opentelemetry-observabilidade, go-benchmarks-profiling, go-resilience-patterns]
updated: "2026-05-08"
---

## Observabilidade é capacidade de resposta

Observabilidade não é instalar dashboard. É conseguir responder durante incidente:

- o que falhou?
- quando começou?
- quantos usuários afetou?
- qual dependência degradou?
- houve retry, timeout ou saturação?
- qual request causou o erro?

## Logs estruturados — comece pelo slog

Desde Go 1.21 o stdlib tem `log/slog`. Em projeto novo, comece por ele — sem dependência externa, formato JSON nativo, integração com `context`.

```go
import "log/slog"

logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level:     slog.LevelInfo,
    AddSource: true,
}))
slog.SetDefault(logger)

slog.InfoContext(ctx, "invoice paid",
    "invoice_id", inv.ID,
    "customer_id", inv.CustomerID,
    "amount_cents", inv.Total.Cents,
)
```

Use `slog.LogValuer` para redação automática de tipos sensíveis:

```go
type Token string
func (t Token) LogValue() slog.Value { return slog.StringValue("[REDACTED]") }
```

Quando Zap/Zerolog ainda fazem sentido: hot path com milhões de logs por segundo onde 100ns por log importa, ou códigos legados que já dependem deles. Para 95% dos casos, slog é suficiente e mais portátil.

```go
// Equivalente em Zap, ainda comum em codebases existentes
logger.Info("invoice paid",
    zap.String("invoice_id", inv.ID),
    zap.String("customer_id", inv.CustomerID),
    zap.Int64("amount_cents", inv.Total.Cents),
)
```

## Níveis de log

- `debug`: detalhes de desenvolvimento.
- `info`: eventos normais importantes.
- `warn`: algo estranho, mas recuperável.
- `error`: falha que precisa investigação.
- `fatal`: processo vai encerrar.

Não logue secrets, tokens, senhas, documentos sensíveis ou payload financeiro inteiro sem política clara.

## Correlation ID

Cada request deve ter identificador propagado:

- log;
- trace;
- evento publicado;
- chamada HTTP interna.

Isso permite reconstruir caminho entre serviços.

## Métricas e traces

Use métricas para tendência e alerta:

- taxa de requests;
- taxa de erro;
- duração;
- tamanho de fila;
- retries;
- conexões do pool.

Use traces para caminho de uma operação:

- HTTP handler;
- use case;
- query PostgreSQL;
- publish RabbitMQ;
- chamada externa.

## OpenTelemetry SDK em Go

O setup mínimo para tracing distribuído + métricas:

```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

func initTracer(ctx context.Context, serviceName, otlpEndpoint string) (func(context.Context) error, error) {
    exp, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint(otlpEndpoint),
        otlptracegrpc.WithInsecure(),
    )
    if err != nil { return nil, err }

    res, _ := resource.Merge(
        resource.Default(),
        resource.NewWithAttributes(semconv.SchemaURL,
            semconv.ServiceName(serviceName),
            semconv.ServiceVersion(version),
        ),
    )

    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exp),
        sdktrace.WithResource(res),
        sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(0.1))),
    )
    otel.SetTracerProvider(tp)
    return tp.Shutdown, nil
}
```

Sampling 100% explode custo. Comece em 10% (`TraceIDRatioBased(0.1)`) e use **tail sampling** no collector para sempre amostrar erros e p99 lentos.

## Trace propagation entre serviços

Use `otelhttp` ou `otelchi` para que cada request HTTP propague trace context automaticamente:

```go
import "github.com/riandyrn/otelchi"

r := chi.NewRouter()
r.Use(otelchi.Middleware("billing-api"))
```

Para chamar downstream com trace propagado:

```go
import "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"

client := http.Client{Transport: otelhttp.NewTransport(http.DefaultTransport)}
```

Isso injeta `traceparent` no header automaticamente. Sem isso, traces ficam fragmentados em cada serviço.

## Métricas Prometheus + OTel

Prefira o SDK OTel para métricas também — exporter para Prometheus está no contrib:

```go
import "go.opentelemetry.io/otel/metric"

meter := otel.Meter("billing")
requestCounter, _ := meter.Int64Counter("http_requests_total")
requestDuration, _ := meter.Float64Histogram("http_request_duration_seconds")

requestCounter.Add(ctx, 1, metric.WithAttributes(
    attribute.String("route", route),
    attribute.Int("status", status),
))
```

Mantenha cardinalidade baixa. `attribute.String("user_id", ...)` em métrica explode séries — use só em traces e logs.

## RED, USE e SLOs

- **RED** (request-driven): Rate, Errors, Duration por endpoint.
- **USE** (resource): Utilization, Saturation, Errors por recurso (CPU, fila, pool).
- **SLOs**: traduzem RED em compromisso ("99,5% das requests respondidas < 300ms em janela de 30 dias").

Sem SLO, você corre atrás de cada alerta. Com SLO, prioriza pelo error budget.

## Critério de domínio

Você dominou este card quando consegue debugar uma falha sem abrir o código primeiro: parte do trace de uma request com erro, identifica span lento, confirma com métrica de saturação do recurso e fecha hipótese com log estruturado correlacionado pelo trace_id.
