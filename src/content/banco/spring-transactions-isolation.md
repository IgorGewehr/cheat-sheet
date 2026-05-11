---
title: "Spring @Transactional: Isolation, Propagation, Pitfalls"
category: banco
stack: [Spring Boot, Kotlin, JPA, PostgreSQL]
tags: [transaction, jpa, isolation, propagation, locks]
excerpt: "@Transactional sem mistério: isolation levels e por que default não basta, propagation que faz o que parece, quando começa/termina e os 5 bugs clássicos que pegam até pleno."
related: [spring-data-jpa, spring-outbox-pattern, n-plus-1]
updated: "2026-05-11"
---

## Onde colocar @Transactional

Regra sênior: **na fronteira do use case (Application Service)**.

```kotlin
@Service
class CriarPedidoUseCase(
    private val repo: PedidoJpaRepository,
    private val estoque: EstoqueService,
    private val outbox: OutboxRepository,
) {

    @Transactional
    fun executar(cmd: CriarPedidoCommand): Pedido {
        val pedido = Pedido.novo(cmd)
        estoque.reservar(pedido.itens)            // dentro da TX
        repo.save(pedido)
        outbox.salvar(PedidoCriado(pedido.id))    // dentro da TX (outbox!)
        return pedido
    }
}
```

NÃO no controller (transação ampla, conexão segurada na resposta HTTP). NÃO no repository (granular demais; várias operações relacionadas viram TXs separadas).

## Como funciona por baixo

`@Transactional` é AOP. Spring cria proxy. Quando você chama o método **através do proxy**, ele:

1. abre transação (`connection.setAutoCommit(false)`);
2. executa o método;
3. commit no sucesso;
4. rollback se exception não-checked (default).

Implicações:

```kotlin
@Service
class PedidoService(private val repo: PedidoJpaRepository) {

    fun criarBatch(items: List<CriarPedidoCommand>) {
        items.forEach { criar(it) }   // ❌ chamada interna — NÃO passa pelo proxy!
    }

    @Transactional
    fun criar(cmd: CriarPedidoCommand) {
        // ...
    }
}
```

`criar()` chamado de `criarBatch()` **não abre transação** — chamada direta no `this`, ignora proxy. O famoso self-invocation gotcha.

Soluções:

- Mover `criar()` para outro bean injetado.
- Usar `TransactionTemplate` programático.
- Injetar `ApplicationContext` e pegar o próprio bean (gambiarra, evite).

## Isolation Levels

```kotlin
@Transactional(isolation = Isolation.REPEATABLE_READ)
fun executar(cmd: Command) = ...
```

| Level | O que evita | Performance |
|---|---|---|
| `READ_UNCOMMITTED` | nada (dirty read OK) | máxima — não use |
| `READ_COMMITTED` | dirty read | default PG, bom para 90% |
| `REPEATABLE_READ` | dirty + non-repeatable read | mais lock |
| `SERIALIZABLE` | todos os fenômenos | mais lock + retry |

Fenômenos:

- **Dirty read**: vê dado de TX não commitada.
- **Non-repeatable read**: leitura do mesmo registro dá valores diferentes na mesma TX.
- **Phantom read**: query com filtro retorna conjunto diferente.

Para **operações financeiras críticas** (transferência de saldo, decremento de estoque), considere `SERIALIZABLE` em PG (que usa Serializable Snapshot Isolation — sem locks adicionais, mas pode dar `SQLException` de conflito que você deve retry).

## Propagation

```kotlin
@Transactional(propagation = Propagation.REQUIRES_NEW)
fun auditar(evento: AuditoriaEvento) = ...
```

| Propagation | Comportamento |
|---|---|
| `REQUIRED` (default) | usa TX existente, ou cria nova |
| `REQUIRES_NEW` | sempre suspende TX atual e cria nova |
| `SUPPORTS` | usa se existir, sem TX se não |
| `NOT_SUPPORTED` | suspende TX atual, roda sem TX |
| `MANDATORY` | exige TX existente (falha se não tem) |
| `NEVER` | falha se houver TX |
| `NESTED` | savepoint dentro da TX atual (PG suporta) |

Uso clássico de `REQUIRES_NEW`: **auditoria que deve persistir mesmo se TX principal falha**:

```kotlin
@Service
class FaturarUseCase(private val auditor: AuditorService) {
    @Transactional
    fun faturar(p: Pedido) {
        try {
            // ... lógica que pode falhar
        } catch (e: Exception) {
            auditor.registrarFalha(p, e)   // grava em TX nova
            throw e                         // propaga e dá rollback na principal
        }
    }
}

@Service
class AuditorService(private val repo: AuditoriaRepository) {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun registrarFalha(p: Pedido, e: Exception) { ... }
}
```

## Rollback Rules

Default: **rollback apenas em RuntimeException + Error**. Checked exceptions (já que Kotlin não tem nativas, é raro) não dão rollback.

```kotlin
@Transactional(rollbackFor = [Exception::class])
fun executar() = ...
```

Em Kotlin todas as exceptions são unchecked, então default funciona. Cuidado com bibliotecas Java que lançam checked (Hibernate `OptimisticLockException` é unchecked, ok).

## Read-only optimization

```kotlin
@Transactional(readOnly = true)
fun buscar(id: PedidoId): Pedido? = ...
```

Diz pro Hibernate: **não vai mudar nada**. Ele evita dirty checking, libera otimizações de driver, reduz pressão. Em queries de listagem, **use sempre**.

## Timeout

```kotlin
@Transactional(timeout = 5)   // segundos
fun pesado() = ...
```

Sem timeout, query lenta pode segurar conexão por minutos e travar pool. Sempre limite — 5-10s em operações OLTP típicas.

## Locks otimistas vs pessimistas (recap)

**Otimista** (`@Version` na entidade):

```kotlin
@Entity
class PedidoEntity(@Version var version: Long = 0, ...)
```

Hibernate adiciona `WHERE version = ?` em update. Conflito → `OptimisticLockException`. Retry no caller.

**Pessimista**:

```kotlin
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM PedidoEntity p WHERE p.id = :id")
fun lockForUpdate(id: Long): PedidoEntity?
```

`SELECT ... FOR UPDATE`. Outras TXs esperam. Use em hot path com alta contenção (decremento de saldo) onde otimista daria retry constante.

## 5 bugs clássicos

**1. Self-invocation** (já visto): chama método anotado do mesmo bean, sem proxy.

**2. `@Transactional` em método `private` ou `final`**: AOP não consegue interceptar.

```kotlin
@Transactional      // ❌ não funciona
private fun salvar() = ...
```

Em Kotlin, classes e funções são `final` por default. Use plugin `kotlin-spring` (já incluído via `kotlin("plugin.spring")`) que abre classes Spring (`@Service`, `@Component`, `@Configuration`) automaticamente.

**3. Transação longa segurando conexão**:

```kotlin
@Transactional
fun sincronizar() {
    val itens = repo.findAll()
    itens.forEach { httpClient.notificar(it) }   // ❌ HTTP dentro de TX!
}
```

Pool de conexão DB tem 10 conexões. Cada HTTP demora 200ms. Tudo trava. Faça HTTP **fora** da TX.

**4. Exception engolida + rollback inconsistente**:

```kotlin
@Transactional
fun processar() {
    try {
        repo.save(x)
    } catch (e: Exception) {
        log.error("falhou", e)   // engole, não rethrow
    }
    repo.save(y)   // ❌ TX marcada para rollback, save é descartado
}
```

Após exception em TX, Spring marca para rollback. Qualquer commit é forçado a rollback. Não engula.

**5. `@Transactional` em chamada async**:

```kotlin
@Async
@Transactional
fun processar() = ...     // ❌ async cria nova thread, TX não propaga
```

`@Async` muda thread; ThreadLocal de TX se perde. Comece TX dentro do método async se precisar.

## Spring + Coroutines

Para `suspend fun`:

```kotlin
@Service
class CriarPedidoUseCase(private val repo: PedidoJpaRepository) {

    @Transactional
    suspend fun executar(cmd: CriarPedidoCommand): Pedido = withContext(Dispatchers.IO) {
        repo.save(Pedido.novo(cmd))
    }
}
```

`@Transactional` funciona com `suspend` desde Spring 6 — usa `CoroutineContext` para propagar. JPA continua bloqueante, use `Dispatchers.IO`.

## Critério de domínio

Você dominou este card quando consegue: posicionar `@Transactional` corretamente; explicar self-invocation e como contornar; escolher entre `READ_COMMITTED` e `SERIALIZABLE` com critério; usar `REQUIRES_NEW` para auditoria com motivo; e listar 5 bugs reais que afetaram produção.
