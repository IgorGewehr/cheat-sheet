---
title: "OpenTelemetry — Observabilidade sem vendor lock-in"
category: "infra"
stack: ["OpenTelemetry", "Node.js", "TypeScript", "Jaeger", "Grafana", "Datadog"]
tags: ["observabilidade", "tracing", "métricas", "logs", "otel", "distributed-tracing"]
excerpt: "Instrumentação de Node.js com traces distribuídos, métricas customizadas e correlação de logs sem depender de um vendor específico. Troque o backend de observabilidade sem mudar o código da aplicação."
related: [sre-reliability, kubernetes-workloads]
updated: 2026-05
---

## Visão Geral

OpenTelemetry (OTel) é o padrão open-source para instrumentação de aplicações. Define uma API/SDK única para traces, métricas e logs — você coleta uma vez, exporta para qualquer backend (Jaeger, Grafana Tempo, Datadog, Honeycomb, New Relic). Sem lock-in de vendor.

Os três pilares:
- **Traces**: rastreio de uma requisição através de múltiplos serviços (spans)
- **Métricas**: counters, histogramas, gauges para dashboards e alertas
- **Logs**: logs estruturados correlacionados com trace IDs

---

## Quando usar / Quando não usar

**Use quando:**
- Sistema distribuído (2+ serviços) onde você precisa rastrear uma requisição ponta-a-ponta
- Quer trocar ou usar múltiplos backends de observabilidade
- Precisa correlacionar logs com traces automaticamente
- SLO baseado em latência (p95, p99) requer histogramas reais, não médias

**Não use quando:**
- App monolítica simples — `console.log` + Sentry pode ser suficiente
- Budget zero — OTel Collector + backend tem custo operacional
- Time ainda não definiu o que vai monitorar — instrumentação sem USE/RED method é ruído

---

## Trade-offs

| Vantagem | Desvantagem |
|---|---|
| Sem vendor lock-in — troca o backend sem mudar código | Setup inicial complexo (Collector, pipelines, backends) |
| Auto-instrumentação para HTTP, DB, Redis, gRPC | Overhead de CPU/memória (~2-5% em produção) |
| Correlação automática de traces entre serviços via W3C Trace Context | Sampling mal configurado → custo explode ou perda de dados |
| SDK padronizado (mesma API em Node, Python, Go, Java) | Semantic conventions mudam entre versões (breaking changes) |
| OTel Collector como intermediário — não muda app para trocar backend | Debug de problemas no Collector pode ser trabalhoso |

---

## Implementação

### Instalação

```bash
npm install \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/exporter-metrics-otlp-http \
  @opentelemetry/sdk-metrics \
  @opentelemetry/api
```

### `src/instrumentation.ts` — inicialização (ANTES de qualquer import)

```typescript
// CRÍTICO: este arquivo deve ser carregado antes de qualquer outro módulo
// Node.js: node --require ./dist/instrumentation.js server.js
// Next.js 15: usar instrumentation.ts na raiz (suporte nativo)

import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { Resource } from '@opentelemetry/resources'
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from '@opentelemetry/semantic-conventions'
import { TraceIdRatioBasedSampler, ParentBasedSampler } from '@opentelemetry/sdk-trace-base'

const resource = Resource.default().merge(
  new Resource({
    [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'myapp-api',
    [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? 'development',
  })
)

// Sampling: 100% em dev, 10% em prod (ajuste conforme volume e custo)
const sampler = new ParentBasedSampler({
  root: new TraceIdRatioBasedSampler(
    process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  ),
})

const sdk = new NodeSDK({
  resource,
  sampler,

  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
      ?? 'http://otel-collector:4318/v1/traces',
  }),

  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT
        ?? 'http://otel-collector:4318/v1/metrics',
    }),
    exportIntervalMillis: 30_000,  // exporta métricas a cada 30s
  }),

  instrumentations: [
    getNodeAutoInstrumentations({
      // Instrumentação automática para: http, express/fastify, pg, redis, grpc, etc
      '@opentelemetry/instrumentation-http': {
        // Ignora health checks — muito barulho nos traces
        ignoreIncomingRequestHook: (req) =>
          req.url?.includes('/health') ?? false,
      },
      '@opentelemetry/instrumentation-fs': {
        enabled: false,  // fs é muito verboso
      },
    }),
  ],
})

sdk.start()

// Graceful shutdown
process.on('SIGTERM', async () => {
  await sdk.shutdown()
})
```

### Traces customizados em serviços de negócio

```typescript
import { trace, SpanStatusCode, context, propagation } from '@opentelemetry/api'

const tracer = trace.getTracer('myapp.billing', '1.0.0')

// Serviço com spans customizados
export class BillingService {
  async processInvoice(invoiceId: string, userId: string): Promise<Invoice> {
    // Cria um span filho do span atual (da requisição HTTP)
    return tracer.startActiveSpan('billing.process_invoice', async (span) => {
      // Adiciona atributos ao span — aparecem no Jaeger/Grafana
      span.setAttributes({
        'invoice.id': invoiceId,
        'user.id': userId,
        'billing.currency': 'BRL',
      })

      try {
        const invoice = await this.invoiceRepo.findById(invoiceId)

        // Span filho para operação específica
        const charged = await tracer.startActiveSpan(
          'billing.charge_customer',
          async (childSpan) => {
            childSpan.setAttribute('payment.method', invoice.paymentMethod)
            try {
              const result = await this.paymentGateway.charge(invoice)
              childSpan.setAttribute('payment.transaction_id', result.transactionId)
              childSpan.setStatus({ code: SpanStatusCode.OK })
              return result
            } catch (err) {
              // Registra o erro no span — aparece como span com erro
              childSpan.recordException(err as Error)
              childSpan.setStatus({
                code: SpanStatusCode.ERROR,
                message: (err as Error).message,
              })
              throw err
            } finally {
              childSpan.end()
            }
          }
        )

        span.setAttribute('billing.amount', invoice.total)
        span.setStatus({ code: SpanStatusCode.OK })
        return invoice

      } catch (err) {
        span.recordException(err as Error)
        span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message })
        throw err
      } finally {
        span.end()  // SEMPRE chamar end()
      }
    })
  }
}
```

### Propagação de contexto entre serviços (trace distribuído)

```typescript
import { propagation, context } from '@opentelemetry/api'

// Serviço A chama Serviço B — injeta trace context no header
async function callServiceB(payload: unknown): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Injeta traceparent, tracestate (W3C Trace Context)
  propagation.inject(context.active(), headers)

  return fetch('http://service-b/api/process', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

// Serviço B extrai o contexto automaticamente via auto-instrumentação HTTP
// A auto-instrumentação do @opentelemetry/instrumentation-http faz isso
// Se precisar extrair manualmente:
async function handler(req: Request): Promise<Response> {
  const extractedContext = propagation.extract(context.active(), req.headers)
  return context.with(extractedContext, async () => {
    // Agora qualquer span criado aqui é filho do trace do Serviço A
    return tracer.startActiveSpan('service-b.process', async (span) => {
      // ...
      span.end()
    })
  })
}
```

### Métricas customizadas

```typescript
import { metrics } from '@opentelemetry/api'

const meter = metrics.getMeter('myapp.billing', '1.0.0')

// Counter: incrementa, nunca decrementa (ex: total de pedidos)
const ordersCounter = meter.createCounter('billing.orders.total', {
  description: 'Total de pedidos processados',
  unit: '1',
})

// Histogram: distribuição de valores (ex: latência, tamanho de payload)
const invoiceProcessingDuration = meter.createHistogram(
  'billing.invoice.processing_duration',
  {
    description: 'Tempo para processar uma fatura em ms',
    unit: 'ms',
    // Boundaries customizados para latência (p50, p90, p95, p99)
    advice: {
      explicitBucketBoundaries: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
    },
  }
)

// Gauge: valor atual que pode subir e descer (ex: jobs na fila)
const queueDepthGauge = meter.createObservableGauge('billing.queue.depth', {
  description: 'Número de itens na fila de processamento',
})

queueDepthGauge.addCallback(async (result) => {
  const depth = await queue.size()
  result.observe(depth, { 'queue.name': 'invoice-processing' })
})

// Usando as métricas
export async function processInvoice(invoice: Invoice) {
  const start = performance.now()
  const attributes = {
    'invoice.type': invoice.type,
    'customer.tier': invoice.customer.tier,
  }

  try {
    await doProcessing(invoice)

    ordersCounter.add(1, { ...attributes, 'result': 'success' })
  } catch (err) {
    ordersCounter.add(1, { ...attributes, 'result': 'error' })
    throw err
  } finally {
    invoiceProcessingDuration.record(performance.now() - start, attributes)
  }
}
```

### Correlação de logs com trace IDs

```typescript
import { trace, context } from '@opentelemetry/api'
import pino from 'pino'

// Logger que injeta trace IDs automaticamente em cada log
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    log(obj) {
      const span = trace.getActiveSpan()
      if (span) {
        const spanContext = span.spanContext()
        return {
          ...obj,
          trace_id: spanContext.traceId,
          span_id: spanContext.spanId,
          trace_flags: spanContext.traceFlags,
        }
      }
      return obj
    },
  },
})

// Uso: cada log dentro de um span terá trace_id e span_id
// Isso permite correlacionar no Grafana: "clique no log → vá para o trace"
export class InvoiceService {
  async process(id: string) {
    logger.info({ invoice_id: id }, 'Iniciando processamento')
    // → { "trace_id": "abc...", "span_id": "def...", "invoice_id": "...", "msg": "..." }
  }
}
```

### OTel Collector — docker-compose para desenvolvimento

```yaml
# docker-compose.observability.yml
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.100.0
    volumes:
      - ./otel-collector.yaml:/etc/otelcol-contrib/config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "8888:8888"   # Métricas do próprio Collector

  jaeger:
    image: jaegertracing/all-in-one:1.57
    ports:
      - "16686:16686"  # UI
      - "14250:14250"  # gRPC para traces

  prometheus:
    image: prom/prometheus:v2.52.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:10.4.0
    ports:
      - "3001:3000"
    environment:
      GF_AUTH_ANONYMOUS_ENABLED: "true"
```

```yaml
# otel-collector.yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
    timeout: 5s
    send_batch_size: 1000
  memory_limiter:
    check_interval: 1s
    limit_percentage: 75

exporters:
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true
  prometheus:
    endpoint: 0.0.0.0:8889
  # Para produção: datadog, grafana cloud, honeycomb, etc
  # Troca o exporter sem mudar o código da aplicação

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [jaeger]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheus]
```

---

## Armadilhas comuns

**1. `span.end()` esquecido**
Spans não finalizados ficam pendentes e vazam memória. Use sempre o padrão `startActiveSpan` com try/finally, ou o helper:
```typescript
// Helper para garantir end()
async function withSpan<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (err) {
      span.recordException(err as Error)
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw err
    } finally {
      span.end()
    }
  })
}
```

**2. Sampling 100% em produção com alto volume**
10 000 req/s × 100% = custo de armazenamento muito alto. Use `TraceIdRatioBasedSampler(0.01)` para 1% ou Head-based + Tail-based sampling no Collector.

**3. Auto-instrumentação carregada depois do módulo**
`require('./instrumentation')` deve ser o PRIMEIRO import do entrypoint. Em Next.js 15, use o arquivo `instrumentation.ts` na raiz que é carregado antes do app.

**4. Atributos sensíveis em spans**
Não coloque `user.password`, tokens ou PII em atributos de span. Dados de spans são indexados e armazenados em texto claro no backend.

**5. Usar `console.log` sem correlação de trace**
Logs sem `trace_id` são impossíveis de correlacionar com traces. Sempre use um logger estruturado que injeta o context ativo.

---

## Links e referências

- [OpenTelemetry JS — Getting Started](https://opentelemetry.io/docs/languages/js/getting-started/)
- [Auto-instrumentations Node](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/metapackages/auto-instrumentations-node)
- [OTel Collector](https://opentelemetry.io/docs/collector/)
- [Semantic Conventions](https://opentelemetry.io/docs/concepts/semantic-conventions/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [Grafana Tempo — backend gratuito para traces](https://grafana.com/oss/tempo/)
