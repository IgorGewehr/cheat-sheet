---
title: "Kotlin Coroutines: Structured Concurrency em Backend"
category: stack-guides
stack: [Kotlin, kotlinx.coroutines]
tags: [kotlin, coroutines, structured-concurrency, flow, suspend]
excerpt: "Corrotinas para serviços Spring Boot: suspend functions, structured concurrency, Flow, supervisorScope, withContext e por que isso elimina callback hell sem reinventar threads."
related: [kotlin-linguagem-essencial, spring-webflux-vs-mvc, spring-resilience4j]
updated: "2026-05-11"
---

## O que é uma corrotina

Corrotina é uma **computação suspendível** — pode pausar (sem bloquear thread), ceder à thread, e retomar depois. Conceitualmente é uma thread leve gerenciada pelo runtime, não pelo SO. Em JVM, você pode ter milhões de corrotinas; threads OS são caras (~1MB de stack cada).

```kotlin
suspend fun buscarPedido(id: String): Pedido {
    val cabecalho = httpClient.get("/pedidos/$id")    // suspende, libera thread
    val itens = httpClient.get("/pedidos/$id/itens")  // suspende, libera thread
    return Pedido(cabecalho, itens)
}
```

A keyword `suspend` marca função que **pode** suspender. Compila para máquina de estados (continuation passing style) — não há mágica em runtime.

## Structured Concurrency

A regra que diferencia corrotinas modernas de threads/callbacks: **toda corrotina vive dentro de um escopo, e o escopo só termina quando todas as filhas terminam**.

```kotlin
suspend fun buscarPedidoEnriquecido(id: String): PedidoCompleto = coroutineScope {
    val pedido = async { repoPedido.find(id) }
    val cliente = async { clienteService.find(id) }
    val pagamento = async { pagamentoService.find(id) }

    PedidoCompleto(pedido.await(), cliente.await(), pagamento.await())
}
```

`coroutineScope` executa as três chamadas em paralelo. Se uma falhar, **cancela as outras automaticamente** e propaga a exception. Sem leak. Sem thread perdida. Sem callback aninhado.

## Builders: launch, async, runBlocking

| Builder | Retorna | Uso |
|---|---|---|
| `launch` | `Job` | "fire and forget" dentro de scope |
| `async` | `Deferred<T>` | espera resultado com `.await()` |
| `runBlocking` | T | só em `main()` ou testes — bloqueia thread |
| `withContext` | T | troca de dispatcher dentro de suspend |
| `coroutineScope` | T | escopo estruturado dentro de suspend |
| `supervisorScope` | T | filhas independentes (uma falha não cancela outras) |

`launch` em service:

```kotlin
@Service
class NotificacaoService(private val scope: CoroutineScope) {
    fun notificarAssincrono(evento: Evento) {
        scope.launch {
            emailClient.enviar(evento.email)
            smsClient.enviar(evento.sms)
        }
    }
}
```

⚠️ **Nunca crie um `CoroutineScope` solto**. Use um bean controlado pelo lifecycle do Spring ou um `@Component` que implementa `DisposableBean` para cancelar no shutdown.

## Dispatchers: onde a corrotina roda

```kotlin
suspend fun salvar(p: Pedido) = withContext(Dispatchers.IO) {
    repository.save(p)   // JDBC bloqueia thread
}
```

| Dispatcher | Quando |
|---|---|
| `Dispatchers.Default` | CPU-bound (cálculo, parsing) — pool = núcleos |
| `Dispatchers.IO` | I/O bloqueante (JDBC, file, socket sync) — pool elástico |
| `Dispatchers.Unconfined` | não use em produção (testes) |
| custom (`Executor.asCoroutineDispatcher()`) | tuning específico |

**Regra**: chamadas suspend nativas (`ktor http`, `r2dbc`) não precisam de `withContext`. Bibliotecas bloqueantes (JDBC, JPA, Mongo síncrono) sempre dentro de `Dispatchers.IO`.

## Flow: streams reativos

Para coleções assíncronas:

```kotlin
fun pedidosDoCliente(clienteId: String): Flow<Pedido> = flow {
    var pagina = 0
    while (true) {
        val batch = repository.findByCliente(clienteId, pagina, 100)
        if (batch.isEmpty()) break
        batch.forEach { emit(it) }
        pagina++
    }
}

// uso:
pedidosDoCliente("123")
    .filter { it.total > BigDecimal("100") }
    .map { it.toResumo() }
    .take(50)
    .collect { processar(it) }
```

Flow é **cold** (só executa quando coletado), e suspende com backpressure automática.

Operadores comuns: `map`, `filter`, `take`, `drop`, `onEach`, `catch`, `flatMapMerge`, `chunked`, `debounce`, `combine`, `zip`.

## SupervisorScope: falhas independentes

```kotlin
suspend fun enviarNotificacoes(eventos: List<Evento>): List<Resultado> = supervisorScope {
    eventos.map { e ->
        async {
            runCatching { notificar(e) }
                .map { Resultado.Sucesso(e.id) }
                .getOrElse { Resultado.Falha(e.id, it.message ?: "?") }
        }
    }.awaitAll()
}
```

Em `supervisorScope`, falha de uma corrotina filha **NÃO cancela** as irmãs. Use para batch de operações independentes onde você quer todos os resultados.

## Cancellation

Toda corrotina é cancelável; basta cooperar:

```kotlin
suspend fun processarLote(items: List<Item>) {
    items.forEach { item ->
        ensureActive()              // verifica cancelamento manualmente
        processar(item)
    }
}
```

Chamadas suspend nativas (`delay`, `withContext`, IO de Ktor) checam cancellation automaticamente. Loops longos com código blocking devem chamar `ensureActive()` ou `yield()`.

## Integração Spring

Spring 6 / Spring Boot 3 tem suporte first-class para corrotinas:

```kotlin
@RestController
class PedidoController(private val uc: BuscarPedidoUseCase) {

    @GetMapping("/pedidos/{id}")
    suspend fun buscar(@PathVariable id: String): PedidoResponse =
        uc.executar(id).toResponse()
}
```

O Spring detecta `suspend` e bridga para o reactor internamente. Funciona com MVC (Servlet 3.1 async) e com WebFlux.

⚠️ **JPA é bloqueante**. Use `withContext(Dispatchers.IO)` em chamadas a `JpaRepository`. Se você quer suspend de verdade no DB, troque para R2DBC ou Spring Data JDBC com pool elástico.

## Erros comuns

1. **`runBlocking` em controller**: bloqueia thread do Tomcat. Use `suspend fun` direto.
2. **`GlobalScope.launch`**: scope eterno; não cancela no shutdown da app. Memory leak.
3. **Esquecer `withContext(IO)` em chamada JDBC**: bloqueia dispatcher Default; pool de 4 threads do meu MBP morre.
4. **`async` sem `await()` em loop**: corrotinas perdidas, exception silenciosa.
5. **Mutar estado compartilhado de várias corrotinas**: use `Mutex`, `Atomic*`, ou repassar como parâmetro.

## Critério de domínio

Você dominou este card quando consegue: explicar structured concurrency em duas frases; escolher entre `launch`/`async`/`withContext`; identificar quando usar `supervisorScope` em vez de `coroutineScope`; integrar corrotina com chamada JDBC bloqueante corretamente; e listar 3 motivos pra nunca usar `GlobalScope`.
