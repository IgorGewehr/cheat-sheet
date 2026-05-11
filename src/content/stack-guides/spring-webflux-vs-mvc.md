---
title: "Spring WebFlux vs MVC: Quando Escolher (e Quando NÃO)"
category: stack-guides
stack: [Spring Boot, Kotlin, WebFlux, Spring MVC]
tags: [spring-mvc, webflux, reactive, coroutines, throughput]
excerpt: "MVC bloqueante com Tomcat, WebFlux reativo com Netty, Virtual Threads (Project Loom): quando cada um faz sentido na vida real e por que default sênior é MVC + suspend em Kotlin."
related: [kotlin-coroutines, spring-boot-essentials, spring-performance-jvm-tuning]
updated: "2026-05-11"
---

## O dilema histórico

Spring tem duas pilhas web:

| Stack | Server | Modelo | Default |
|---|---|---|---|
| **Spring MVC** | Tomcat / Jetty / Undertow | thread-per-request (Servlet API) | sim |
| **Spring WebFlux** | Netty (default) ou Servlet 3.1+ | event loop (Reactive Streams) | não |

A propaganda de WebFlux: throughput maior, menos threads, melhor uso de memória. A realidade enterprise: ecosistema todo é bloqueante (JPA, JDBC, libs de SAP/Salesforce/SOAP/SEFAZ), então a complexidade do reactor raramente paga o preço.

## Quando usar Spring MVC (default)

- Você usa JPA, JDBC ou QualquerLibBloqueante.
- Aplicação CRUD enterprise, ERP, plataforma corporativa.
- Equipe não tem fluência em Reactive Streams.
- Time de Ops sabe debugar Tomcat, não Netty.
- Sua dor é cuidar do domínio, não throughput de 200k req/s.

Em Kotlin, você ainda escreve controllers `suspend` em MVC desde Spring 6:

```kotlin
@RestController
class PedidoController(private val uc: BuscarPedidoUseCase) {

    @GetMapping("/pedidos/{id}")
    suspend fun buscar(@PathVariable id: String): PedidoResponse =
        uc.executar(id).toResponse()
}
```

O Spring MVC com Servlet 3.1+ rodando suspend Kotlin usa async dispatcher do Tomcat. Throughput ótimo para 99% dos serviços enterprise. E você mantém JPA bloqueante via `withContext(Dispatchers.IO)`.

## Quando usar WebFlux

- Você está construindo um **gateway HTTP** (proxy reverso) com milhares de conexões idle.
- Cliente faz **long polling / SSE / WebSocket** com muitos peers.
- Backend é **100% reativo**: R2DBC, Spring Data Reactive, Redis Lettuce reactive, Mongo reactive.
- **Streaming bidirecional** (chat, telemetria, jogos).
- Sua app é um **edge service** com I/O massivo e CPU baixa.

Exemplo de controller WebFlux:

```kotlin
@RestController
class TelemetriaController(private val repo: TelemetriaRepository) {

    @GetMapping("/eventos", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun stream(): Flow<Evento> = repo.stream()
        .filter { it.tipo == "critico" }
}
```

Em WebFlux, retorne `Flow<T>`, `Mono<T>`, `Flux<T>`. Tudo é não-bloqueante. Tudo. Uma chamada blocking acidental destrói o event loop e seu throughput cai 50×.

## Virtual Threads (Project Loom): muda o jogo

Java 21 trouxe **Virtual Threads** (Project Loom). Threads gerenciadas pela JVM, super leves, que **bloqueiam sem travar OS thread**.

```yaml
# application.yml
spring:
  threads:
    virtual:
      enabled: true
```

Com isso, **Spring MVC com virtual threads pode ter throughput similar a WebFlux** para 90% das cargas, sem reescrever nada. JPA continua "bloqueante" no código, mas a JVM agora schedula virtual threads — você tem milhões delas.

Em maio/2026, o uso recomendado em projetos novos enterprise:

1. **Spring MVC + Virtual Threads (Java 21+)** se você usa JPA/JDBC.
2. **Spring MVC + coroutines suspend** se quer concorrência estruturada em código.
3. **WebFlux** só se sua stack é 100% não-bloqueante (R2DBC + Redis Lettuce + WebClient).

## Cuidados em coexistência

Não dá pra misturar `WebMvc` e `WebFlux` na mesma app sem dor de cabeça. Spring escolhe um (detecta pelo classpath). Se tem `spring-boot-starter-web` E `spring-boot-starter-webflux`, dá conflito.

Se você precisa de WebFlux só para um endpoint streaming, considere:
- usar **SSE no MVC** (`SseEmitter`) — funciona, simples.
- separar em **microserviço dedicado** se a carga justifica.

## WebClient vs RestClient vs HTTP Interface

Para chamar APIs externas:

| Cliente | Bloqueia | Quando |
|---|---|---|
| `RestTemplate` | sim | legado, evite em projetos novos |
| `RestClient` (Spring 6.1+) | sim | substituto moderno do RestTemplate; suporta interceptors |
| `WebClient` | não | quando você precisa de não-bloqueante |
| `HTTP Interface` | depende | declarativo (`@HttpExchange`), elegante |

Exemplo `HTTP Interface` (Spring 6.1+):

```kotlin
interface PagamentoApi {
    @GetExchange("/pagamentos/{id}")
    suspend fun obter(@PathVariable id: String): PagamentoResponse

    @PostExchange("/pagamentos")
    suspend fun criar(@RequestBody req: CriarPagamentoRequest): PagamentoResponse
}

@Configuration
class HttpConfig {
    @Bean
    fun pagamentoApi(client: WebClient): PagamentoApi {
        val factory = HttpServiceProxyFactory.builderFor(
            WebClientAdapter.create(client)
        ).build()
        return factory.createClient(PagamentoApi::class.java)
    }
}
```

Interface declarativa, suspend nativo, sem implementar handler manual. É o padrão moderno em 2026.

## Anti-padrões frequentes

1. **WebFlux + JPA**: bloqueia o event loop. Sempre. Catástrofe.
2. **`block()` em produção**: você reverteu todo benefício do reactor.
3. **WebClient em controller MVC sem `.block()`**: vaza Mono/Flux pro Jackson serializar — não funciona.
4. **Migrar tudo pra WebFlux "pra performance"** sem ter medido nada.

## Critério de domínio

Você dominou este card quando consegue: explicar quando MVC bloqueia e quando suspend salva; listar 3 limitações reais do WebFlux em projeto enterprise; ativar Virtual Threads no Spring Boot; usar HTTP Interface declarativa; e dizer por que `block()` no WebFlux destrói o benefício.
