---
title: "Spring + Resilience4j: Timeout, Retry, Circuit Breaker, Bulkhead"
category: padroes-backend
stack: [Spring Boot, Kotlin, Resilience4j]
tags: [resilience, resilience4j, circuit-breaker, retry, timeout, bulkhead]
excerpt: "Resilience4j em Spring com Kotlin: timeouts em camadas, retry com backoff+jitter, circuit breaker que não amplifica problema, bulkhead com semáforo e quando NÃO usar."
related: [go-resilience-patterns, spring-redis-cache-idempotencia, spring-kafka-rabbitmq]
updated: "2026-05-11"
---

## Resiliência: o que isso significa

Resiliência é **continuar útil quando dependência falha**. Não é "código sem bug". É arquitetura que sobrevive ao mundo real: rede instável, serviço dependente caído, banco lento, integração com SEFAZ tirando férias.

Os 4 padrões clássicos:

| Padrão | Resolve |
|---|---|
| **Timeout** | espera infinita por dependência travada |
| **Retry** | falha transiente (network blip, server reboot) |
| **Circuit Breaker** | parar de bater em dependência caída |
| **Bulkhead** | uma chamada lenta esgotar todas as threads |

Há outros (hedging, fallback, rate limit), mas esses 4 cobrem 90%.

## Setup

```kotlin
dependencies {
    implementation("io.github.resilience4j:resilience4j-spring-boot3:2.2.0")
    implementation("io.github.resilience4j:resilience4j-kotlin:2.2.0")
    implementation("io.github.resilience4j:resilience4j-reactor:2.2.0")
    implementation("org.springframework.boot:spring-boot-starter-aop")
}
```

```yaml
resilience4j:
  timelimiter:
    instances:
      pagamentoApi:
        timeoutDuration: 3s
        cancelRunningFuture: true

  retry:
    instances:
      pagamentoApi:
        maxAttempts: 3
        waitDuration: 200ms
        retryExceptions:
          - java.io.IOException
          - org.springframework.web.client.ResourceAccessException
        ignoreExceptions:
          - com.igor.billing.PagamentoRecusadoException
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2

  circuitbreaker:
    instances:
      pagamentoApi:
        slidingWindowType: COUNT_BASED
        slidingWindowSize: 20
        failureRateThreshold: 50
        slowCallRateThreshold: 70
        slowCallDurationThreshold: 2s
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 3
        minimumNumberOfCalls: 10

  bulkhead:
    instances:
      pagamentoApi:
        maxConcurrentCalls: 10
        maxWaitDuration: 100ms
```

## Timeout: a primeira coisa

```kotlin
@Service
class PagamentoService(private val client: PagamentoClient) {

    @CircuitBreaker(name = "pagamentoApi", fallbackMethod = "fallbackProcessar")
    @Retry(name = "pagamentoApi")
    @TimeLimiter(name = "pagamentoApi")
    suspend fun processar(p: Pedido): Resultado {
        return client.cobrar(p.toRequest())
    }

    private suspend fun fallbackProcessar(p: Pedido, ex: Throwable): Resultado {
        log.warn("fallback acionado pra pedido ${p.id}", ex)
        return Resultado.PROCESSAR_DEPOIS
    }
}
```

⚠️ **Ordem de anotações importa**: `@Retry` antes de `@CircuitBreaker` significa "retry abre breaker"; depois, "breaker conta retry como uma só". Geralmente: `CircuitBreaker > Retry > RateLimiter > TimeLimiter > Bulkhead`.

**Cada camada tem seu timeout**:

```text
Cliente HTTP → API Gateway (10s)
              → Service A (8s)
                → Service B (5s)
                  → DB (2s)
                  → external API (3s, com retry interno)
```

Timeout interno **sempre menor** que externo. Senão cliente desiste, mas você ainda está esperando.

## Retry: cuidado com amplificação

```kotlin
@Retry(name = "pagamentoApi")
suspend fun cobrar(req: CobrancaRequest): Resposta = client.cobrar(req)
```

Configuração crítica:

- **retryExceptions**: lista o que vale retry (network, timeout). Não retente erro do cliente (400, 422).
- **ignoreExceptions**: erros de domínio (`PagamentoRecusadoException` — 4xx) não devem retentar.
- **enableExponentialBackoff: true**: dobra espera entre tentativas (200ms, 400ms, 800ms).
- **maxAttempts: 3-5**: mais que isso é gourmet de problema.

**Sem jitter, retry é arma**. Cenário típico: serviço cai por 30s. 1000 clientes retentam ao mesmo tempo. Quando volta, recebe 1000 simultâneos e cai de novo. Use jitter (randomização):

```yaml
resilience4j:
  retry:
    instances:
      pagamentoApi:
        randomizedWaitFactor: 0.5  # ±50% no waitDuration
```

⚠️ **Operações NÃO idempotentes não retentam**: pagar 2× é mais caro que pagar 0×. Operações idempotentes (busca, idempotency-key, query) retentam livremente.

## Circuit Breaker: para de bater em quem está caído

**Estados**:
- **CLOSED**: fluxo normal, contando falhas.
- **OPEN**: dependência considerada quebrada — falha fast, sem chamar.
- **HALF_OPEN**: testa permitindo N chamadas; sucesso volta pra CLOSED, falha volta pra OPEN.

```yaml
failureRateThreshold: 50           # 50% das últimas N chamadas falharam → OPEN
minimumNumberOfCalls: 10           # antes disso, só conta
slidingWindowSize: 20              # janela das últimas 20 chamadas
waitDurationInOpenState: 30s       # tempo até tentar HALF_OPEN
permittedNumberOfCallsInHalfOpenState: 3
slowCallRateThreshold: 70          # 70% de calls lentas → também OPEN
slowCallDurationThreshold: 2s
```

Benefício: quando dependência cai, você **não acumula 1000 threads esperando**. Falha rápido com 503 ou fallback.

Sem isso, dependência ruim derruba seu serviço inteiro — o famoso _cascade failure_.

## Bulkhead: isolamento de pool

```yaml
bulkhead:
  instances:
    pagamentoApi:
      maxConcurrentCalls: 10
      maxWaitDuration: 100ms
```

Tem 10 chamadas em paralelo? Décima primeira espera 100ms; se não liberar, falha. Limita "explosão de chamadas" de um endpoint problemático esgotar todo o pool de threads.

Em Kotlin/corrotinas, prefira `Semaphore`:

```kotlin
val sem = Semaphore(permits = 10)

suspend fun cobrar(req: CobrancaRequest): Resposta = sem.withPermit {
    client.cobrar(req)
}
```

## Fallback: respostas degradadas

```kotlin
@CircuitBreaker(name = "categoriasApi", fallbackMethod = "categoriasFallback")
fun categorias(): List<Categoria> = client.buscar()

private fun categoriasFallback(ex: Throwable): List<Categoria> = listOf(
    Categoria("padrao", "Geral")
)
```

Fallback bom: dado cacheado, padrão razoável, mensagem útil para o usuário. Fallback ruim: lista vazia silenciosa (usuário acha que não tem nada), exception genérica.

## TimeLimiter (deadline)

```yaml
timelimiter:
  instances:
    pagamentoApi:
      timeoutDuration: 3s
      cancelRunningFuture: true
```

Para `suspend fun`/Mono, propaga cancelamento. Para `Future`, cancela a thread (pode dar leak se a operação não checar interrupt).

## Observabilidade

Resilience4j publica métricas Micrometer:

- `resilience4j.circuitbreaker.calls{name, kind, state}`
- `resilience4j.retry.calls{name, kind}`
- `resilience4j.bulkhead.available.concurrent.calls{name}`
- `resilience4j.timelimiter.calls{name}`

Dashboard mínimo: estado do breaker (CLOSED/OPEN), taxa de erro, latência p99, calls/s. Quando alarme dispara, você já sabe qual dependência caiu.

## Quando NÃO usar

1. **Operação rara** (uma vez por hora): overhead não justifica.
2. **Chamada interna no mesmo processo**: você já controla.
3. **Operação não-idempotente sem cuidado**: retry vai duplicar.
4. **Em vez de fix de causa raiz**: timeout escondendo bug é técnica do desespero.

## Anti-padrões

1. **Retry sem jitter**: thundering herd.
2. **Retry em operação não idempotente**: cobrança 2×.
3. **Sem timeout**: dependência trava o serviço.
4. **Breaker sem `minimumNumberOfCalls`**: 2 chamadas falhando abre breaker.
5. **Fallback que esconde problema**: lista vazia silenciosa em vez de notificar.
6. **Tudo decorado, nada testado**: simule falha em teste com Toxiproxy/WireMock.

## Critério de domínio

Você dominou este card quando consegue: explicar ordem certa de anotações Resilience4j; configurar retry com backoff + jitter; configurar circuit breaker para abrir só com volume suficiente; descrever um cenário onde retry sem idempotência é desastre; e listar 3 cuidados em fallback.
