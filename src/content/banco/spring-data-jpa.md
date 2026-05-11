---
title: "Spring Data JPA: Queries, EntityGraph, N+1, Projections"
category: banco
stack: [Spring Boot, Kotlin, JPA, Hibernate, PostgreSQL]
tags: [jpa, hibernate, n-plus-1, entity-graph, projections, query]
excerpt: "JPA do jeito sênior em Kotlin: entidade vs domínio, derived queries, @Query JPQL, EntityGraph contra N+1, projections DTO e os pitfalls de lazy loading que matam produção."
related: [spring-transactions-isolation, n-plus-1, spring-flyway-migrations]
updated: "2026-05-11"
---

## Entidade JPA em Kotlin: cuidados

```kotlin
@Entity
@Table(name = "pedidos")
class Pedido(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "cliente_id", nullable = false)
    var clienteId: String,

    @Column(nullable = false)
    var total: BigDecimal,

    @OneToMany(mappedBy = "pedido", cascade = [CascadeType.ALL], orphanRemoval = true)
    var itens: MutableList<ItemPedido> = mutableListOf(),

    @CreationTimestamp
    var criadoEm: Instant? = null,
)
```

Pontos sênior:

- **`class` normal, NÃO `data class`**: `equals/hashCode` por identidade (`id`), não por campos. Data class fica frágil em PersistenceContext.
- **`var` em campos JPA**: precisa de setter; JPA constrói via reflection e popula campo a campo.
- **`MutableList` para coleção `@OneToMany`**: o Hibernate substitui por implementação dele (`PersistentBag`).
- Construtor com defaults torna possível **construtor sem args** (requerido por JPA) sem boilerplate.

Plugin Gradle obrigatório:

```kotlin
plugins {
    kotlin("plugin.jpa") version "2.0.20"
    kotlin("plugin.spring") version "2.0.20"
}
```

O plugin `kotlin-jpa` gera construtor sem args para classes anotadas com `@Entity` em compile time. Sem ele, JPA quebra.

⚠️ **Separe entidade JPA do modelo de domínio**:

```kotlin
// domain/Pedido.kt — puro Kotlin
class Pedido private constructor(
    val id: PedidoId,
    val clienteId: ClienteId,
    private val _itens: MutableList<ItemPedido>,
) {
    val itens: List<ItemPedido> get() = _itens.toList()
    fun adicionar(item: ItemPedido) { /* invariantes aqui */ }
    companion object {
        fun novo(cliente: ClienteId, itens: List<ItemPedido>): Pedido = ...
    }
}

// infra/PedidoEntity.kt — JPA
@Entity @Table(name = "pedidos")
class PedidoEntity(...)  // ← outra classe
```

E faça o mapping entidade ↔ domínio explicitamente. Não comparta uma classe que tem `@Entity` e regra de negócio: você acabou de juntar duas razões pra mudar (DB schema e regra de negócio).

## Repository

```kotlin
interface PedidoJpaRepository : JpaRepository<PedidoEntity, Long> {

    // Derived query — Spring monta SQL pelo nome
    fun findByClienteIdAndStatus(clienteId: String, status: Status): List<PedidoEntity>

    // Top + Sort
    fun findTop10ByClienteIdOrderByCriadoEmDesc(clienteId: String): List<PedidoEntity>

    // Query JPQL explícita — preferir quando complexa
    @Query("""
        SELECT p FROM PedidoEntity p
        WHERE p.clienteId = :cliente
        AND p.total > :minimo
        ORDER BY p.criadoEm DESC
    """)
    fun caros(cliente: String, minimo: BigDecimal, page: Pageable): Page<PedidoEntity>

    // Modificação — sempre @Modifying + @Transactional no caller
    @Modifying
    @Query("UPDATE PedidoEntity p SET p.status = :novo WHERE p.id = :id")
    fun atualizarStatus(id: Long, novo: Status): Int
}
```

**Derived queries** são úteis até 3-4 condições. Acima disso, JPQL explícita. Não force `findByClienteIdAndStatusAndTotalGreaterThanAndCriadoEmBetween` — vira ilegível.

## N+1: o pesadelo mais comum

```kotlin
val pedidos: List<PedidoEntity> = repo.findAll()
pedidos.forEach { pedido ->
    println("${pedido.id}: ${pedido.itens.size}")  // ⚠️ 1 SELECT por pedido!
}
```

Lazy loading dispara 1 SELECT por iteração. 1000 pedidos = 1001 queries. Banco se rende.

Solução 1: **fetch join**:

```kotlin
@Query("""
    SELECT DISTINCT p FROM PedidoEntity p
    LEFT JOIN FETCH p.itens
    WHERE p.clienteId = :cliente
""")
fun findComItens(cliente: String): List<PedidoEntity>
```

Solução 2: **EntityGraph** (declarativo):

```kotlin
@EntityGraph(attributePaths = ["itens", "itens.produto"])
@Query("SELECT p FROM PedidoEntity p WHERE p.clienteId = :cliente")
fun findComItens(cliente: String): List<PedidoEntity>
```

Solução 3: **Batch fetching** (Hibernate):

```kotlin
@OneToMany(mappedBy = "pedido")
@BatchSize(size = 50)
var itens: MutableList<ItemEntity> = mutableListOf()
```

Carrega itens de 50 pedidos em 1 query agrupada por `pedido_id IN (...)`. Melhor que N+1, pior que fetch.

## Projections: leitura sem entidade

Quando você só precisa de campos para listagem/dashboard:

```kotlin
interface PedidoResumoView {
    val id: Long
    val clienteId: String
    val total: BigDecimal
}

@Query("""
    SELECT p.id AS id, p.clienteId AS clienteId, p.total AS total
    FROM PedidoEntity p
    WHERE p.clienteId = :cliente
""")
fun resumosDoCliente(cliente: String): List<PedidoResumoView>
```

Ou DTO direto:

```kotlin
data class PedidoResumoDto(val id: Long, val clienteId: String, val total: BigDecimal)

@Query("""
    SELECT new com.igor.billing.PedidoResumoDto(p.id, p.clienteId, p.total)
    FROM PedidoEntity p
    WHERE p.clienteId = :cliente
""")
fun resumosDto(cliente: String): List<PedidoResumoDto>
```

Vantagens: zero overhead de PersistenceContext, sem lazy loading, ideal para leitura read-only. **CQRS-leve**: comandos usam entidade, queries usam projections.

## Paginação correta

```kotlin
val page: Page<PedidoEntity> = repo.findByClienteId(
    clienteId,
    PageRequest.of(0, 20, Sort.by("criadoEm").descending())
)
```

Retorne `Page`, não `List`. Frontend precisa de `totalElements`, `totalPages` para paginar.

⚠️ Em datasets enormes, `count(*)` que vem com `Page` é caro. Considere:

- `Slice<T>` em vez de `Page<T>`: não calcula total.
- Cursor pagination (`WHERE id > :ultimo LIMIT N`) para tabelas com 100M+ linhas.

## Locks: pessimista vs otimista

**Otimista** (preferida):

```kotlin
@Entity
class PedidoEntity(
    @Version
    var version: Long = 0,
    // ...
)
```

Hibernate adiciona `WHERE version = ?` em todo UPDATE. Conflito → `OptimisticLockException` → você decide se retry ou propaga.

**Pessimista** (só quando precisa mesmo):

```kotlin
@Query("SELECT p FROM PedidoEntity p WHERE p.id = :id")
@Lock(LockModeType.PESSIMISTIC_WRITE)
fun lockForUpdate(id: Long): PedidoEntity?
```

Gera `SELECT ... FOR UPDATE`. Outras sessões esperam. Use só em hot path concorrente sério (ex: decremento de saldo).

## Anti-padrões frequentes

1. **`@Entity` no domínio**: acopla DB schema a regra de negócio.
2. **Lazy + Jackson**: entidade lazy serializada explode com `LazyInitializationException`. Use DTO.
3. **`FetchType.EAGER` "pra resolver"**: você acabou de carregar grafo enorme em toda query.
4. **N+1 ignorado em prod**: ative `hibernate.generate_statistics` e veja contagem.
5. **`@Transactional` em controller**: transação muito ampla, mantém connection muito tempo.
6. **`saveAndFlush` em loop**: flush 1× no fim, não a cada item.

## Detectar N+1 automaticamente

Bibliotecas:
- [hypersistence-utils](https://github.com/vladmihalcea/hypersistence-utils) — `@Query` com hints + métricas.
- [datasource-proxy](https://github.com/jdbc-observations/datasource-proxy) — loga queries com stack.
- `org.hibernate.SQL=DEBUG` + `org.hibernate.orm.jdbc.bind=TRACE` em dev — vê tudo.

Em CI, falhe build se uma rota gerar >10 queries:

```kotlin
@Test
fun `listar pedidos não gera N+1`() {
    SQLStatementCountValidator.reset()
    repo.findComItens("CLI-1")
    SQLStatementCountValidator.assertSelectCount(1)
}
```

## Critério de domínio

Você dominou este card quando consegue: explicar por que `data class` não é boa entidade JPA; resolver N+1 com fetch join, EntityGraph e batch fetching; escolher entre lock otimista e pessimista; usar projection para query read-only; e detectar N+1 em teste automatizado.
