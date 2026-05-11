---
title: "Spring + Micrometer + OpenTelemetry: Observabilidade Completa"
category: infra
stack: [Spring Boot, Kotlin, Micrometer, OpenTelemetry, Prometheus]
tags: [observability, micrometer, opentelemetry, prometheus, tracing, metrics]
excerpt: "Observabilidade em Spring Boot 3 sem cargo cult: Micrometer + OTel para métricas/tracing/logs correlacionados, RED/USE, SLOs e dashboards que servem ao incidente."
related: [spring-logging-mdc, observability, opentelemetry-observabilidade]
updated: "2026-05-11"
---

## Os 3 pilares

| Pilar | O que dá | Onde mora |
|---|---|---|
| **Metrics** | "quantos? quão rápido?" | Prometheus, Datadog |
| **Tracing** | "por que essa request foi lenta?" | Jaeger, Tempo, Datadog APM |
| **Logs** | "o que aconteceu nesse momento?" | Loki, Elasticsearch, Splunk |

A magia acontece quando **um trace_id liga os três**: você acha trace lento no Tempo, copia o ID, busca logs no Loki, vê métricas no mesmo período no Grafana. Diagnose em 2 minutos.

## Setup Spring 3 + Micrometer + OTel

Spring Boot 3 trouxe **Observation API** unificada. Micrometer cuida de métricas, Micrometer Tracing cuida de spans, e tudo é exportável via OpenTelemetry.

```kotlin
implementation("org.springframework.boot:spring-boot-starter-actuator")
implementation("io.micrometer:micrometer-registry-prometheus")
implementation("io.micrometer:micrometer-tracing-bridge-otel")
implementation("io.opentelemetry:opentelemetry-exporter-otlp")
implementation("net.ttddyy.observation:datasource-micrometer-spring-boot:1.0.5")
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    distribution:
      percentiles-histogram:
        http.server.requests: true
      slo:
        http.server.requests: 100ms,300ms,500ms,1s,3s
    tags:
      application: ${spring.application.name}
      env: ${SPRING_PROFILES_ACTIVE}
  tracing:
    sampling:
      probability: 0.1
  otlp:
    metrics:
      export:
        url: http://otel-collector:4318/v1/metrics
    tracing:
      endpoint: http://otel-collector:4318/v1/traces
```

## Métricas: o que medir (RED + USE)

**RED** (para serviços):
- **R**ate: requisições por segundo
- **E**rrors: taxa de erro
- **D**uration: latência (p50, p95, p99)

**USE** (para recursos):
- **U**tilization: % de uso (CPU, memória, pool de conexão)
- **S**aturation: fila acumulando
- **E**rrors: falhas de recurso

Spring Boot já mede automaticamente:
- `http.server.requests` — RED de HTTP
- `jvm.memory.used` — memória JVM
- `hikaricp.connections.active` — pool de conexão
- `kafka.consumer.records.consumed.total` — consumo Kafka

## Métricas customizadas

```kotlin
@Service
class PedidoMetrics(meterRegistry: MeterRegistry) {

    private val pedidosCriados = Counter.builder("pedidos.criados")
        .description("Total de pedidos criados")
        .tag("env", System.getenv("ENV") ?: "dev")
        .register(meterRegistry)

    private val tempoConfirmacao = Timer.builder("pedido.tempo_confirmacao")
        .description("Tempo entre PEDIDO_CRIADO e PEDIDO_CONFIRMADO")
        .publishPercentiles(0.5, 0.95, 0.99)
        .publishPercentileHistogram()
        .sla(Duration.ofMillis(100), Duration.ofSeconds(1), Duration.ofSeconds(5))
        .register(meterRegistry)

    private val valorMedio = DistributionSummary.builder("pedido.valor")
        .baseUnit("BRL")
        .publishPercentiles(0.5, 0.95)
        .register(meterRegistry)

    fun registrarCriacao(motivo: String) {
        Counter.builder("pedidos.criados")
            .tag("motivo", motivo)
            .register(meterRegistry)
            .increment()
    }

    fun medirConfirmacao(duracao: Duration) {
        tempoConfirmacao.record(duracao)
    }

    fun registrarValor(valor: BigDecimal) {
        valorMedio.record(valor.toDouble())
    }
}
```

⚠️ **Cardinality**: cada combinação única de tags vira série temporal. `userId` como tag = milhões de séries = Prometheus morre. Use tags **baixa cardinalidade** (status, código de erro, env, endpoint).

## Observation API

Spring 6 introduziu API unificada que produz **métrica + trace simultaneamente**:

```kotlin
@Service
class PagamentoService(private val observationRegistry: ObservationRegistry) {

    fun processar(p: Pedido): Resultado =
        Observation.createNotStarted("pagamento.processar", observationRegistry)
            .lowCardinalityKeyValue("status", "pending")
            .highCardinalityKeyValue("pedido.id", p.id.toString())
            .observe {
                // ... lógica
            }
}
```

`lowCardinalityKeyValue` vira tag de métrica. `highCardinalityKeyValue` vai só pra trace (não vira série temporal).

## Tracing

Cada request HTTP gera um span. Chamada interna (HTTP/gRPC/Kafka) propaga `traceparent` header automaticamente. Span aninhado mostra cascata.

```kotlin
@Service
class CriarPedidoService(/* ... */) {

    @Observed(name = "criar.pedido", contextualName = "criar-pedido-uc")
    fun executar(cmd: CriarPedidoCommand): Pedido {
        // ...
    }
}
```

`@Observed` (Spring 3+) cria span. Para spans manuais:

```kotlin
val tracer: Tracer  // injetado

fun executar() {
    val span = tracer.nextSpan().name("validar_estoque").start()
    try {
        span.tag("itens.count", "5")
        // ...
    } finally {
        span.end()
    }
}
```

## Trace correlation em logs

MDC com `traceId` e `spanId`:

```xml
<!-- logback-spring.xml -->
<pattern>%d %-5level [%X{traceId:-},%X{spanId:-}] %logger{36} - %msg%n</pattern>
```

Em JSON, o `LogstashEncoder` já inclui ambos se MDC estiver populado. Micrometer Tracing popula MDC automaticamente.

Output exemplo:

```text
2026-05-11 14:23:01 INFO [a1b2c3d4...,e5f6g7h8...] PedidoController - pedido criado
```

Você acha trace, copia `a1b2c3d4`, busca todos logs com aquele ID. Caminho completo da request.

## OpenTelemetry Collector

Não exporte direto de cada app pro Datadog/Tempo. Use **OTel Collector** como sidecar/daemon:

```text
[Spring App] --OTLP--> [OTel Collector] --remote write--> [Prometheus]
                                        --OTLP--> [Tempo/Jaeger]
                                        --batch--> [Loki via promtail]
```

Vantagens: buffer em caso de queda do backend, transformação de dados, multiplexação para múltiplos destinos, separação de responsabilidade.

## Health Checks

```yaml
management:
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true
      group:
        liveness:
          include: livenessState
        readiness:
          include: readinessState, db, kafka
```

K8s probes:

```yaml
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  periodSeconds: 5
```

**Liveness**: "app está viva?". Falha = restart pod.
**Readiness**: "pronta pra receber tráfego?". Falha = tira do load balancer mas não restart.

Não inclua dependência externa em liveness (Kafka down não deve restartar seu pod; pod sobe e Kafka continua down, ciclo infinito).

## SLOs

Service Level Objectives = compromisso medido. Ex:

- **99.9% das requests** em `<300ms` p95.
- **<0.1% taxa de erro** mensal.

Prometheus alerta:

```yaml
- alert: HighErrorRate
  expr: |
    sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
    / sum(rate(http_server_requests_seconds_count[5m])) > 0.01
  for: 5m
```

**Sem SLO, alarme vira ruído**: você é acordado por p99 ruim em janela de 10 chamadas. Com SLO + burn rate alert, só é acordado quando importa.

## Dashboards: o que mostrar

Dashboard de serviço bom tem (top to bottom):

1. **Health**: RPS, error rate, p50/p95/p99 de latência.
2. **Dependencies**: latência por dependência (DB, Kafka, external API).
3. **Resource**: CPU, memória, JVM (GC, heap), connection pool.
4. **Business**: métricas de domínio (pedidos criados, valor médio).

Não bote 30 painéis. Em incidente, ninguém tem tempo de procurar.

## Anti-padrões

1. **Métrica com `userId` como tag**: cardinality explosion.
2. **Tracing 100% sem amostragem**: storage e custo explodem.
3. **Log + métrica + trace separados sem `traceId`**: você tem dados, não tem investigação.
4. **Liveness inclui DB**: DB cai, todos os pods reiniciam, pioram.
5. **Sem SLO**: alarme dispara o tempo todo; equipe ignora; um real fica enterrado.

## Critério de domínio

Você dominou este card quando consegue: configurar métricas Prometheus com tags low-cardinality; criar `Timer` customizado; explicar diferença entre liveness e readiness; configurar correlação trace_id em logs; e listar 3 cuidados ao adicionar tag a métrica.
