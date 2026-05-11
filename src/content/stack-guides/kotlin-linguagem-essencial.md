---
title: "Kotlin: Linguagem Essencial — Tipos, Null-Safety, Sealed, When"
category: stack-guides
stack: [Kotlin]
tags: [kotlin, null-safety, sealed-class, data-class, when, scope-functions]
excerpt: "O subset de Kotlin que cobre 90% do código de produção: val/var, null-safety, data classes, sealed classes, when exaustivo, scope functions e o type system que elimina classes de bug."
related: [kotlin-primeiros-passos, kotlin-errors-result-arrow, kotlin-coroutines]
updated: "2026-05-11"
---

## Declarações: val vs var

```kotlin
val nome: String = "Igor"     // imutável (preferida — 95% dos casos)
var contador: Int = 0          // mutável
```

A regra é: **`val` por padrão, `var` só quando precisar mutar**. Isso elimina toda uma classe de bugs de concorrência. Em código de domínio, você raramente deveria ver `var`.

Tipos podem ser inferidos: `val nome = "Igor"` funciona. Explicite o tipo quando ele não estiver óbvio (retorno de função pública sempre explícito — é parte do contrato).

## Null-Safety: o assassino do NPE

Em Kotlin, **toda variável é não-nula por padrão**. Permitir null exige `?`:

```kotlin
val nome: String = null    // ❌ compile error
val nome: String? = null   // ✓ explicitamente nullable

val tamanho = nome?.length         // safe call: retorna null se nome for null
val tamanho = nome?.length ?: 0    // Elvis: default se null
val tamanho = nome!!.length        // ❌ "trust me bro" — lança NPE
```

Regra sênior: **`!!` é cheiro de design ruim**. Reestruture para que o tipo já garanta não-nulo. Use `requireNotNull(x) { "x não pode ser nulo após validação" }` quando for guarda explícita.

Smart casts: após verificar null, o compilador "sabe":

```kotlin
fun saudar(nome: String?) {
    if (nome == null) return
    println(nome.length)   // smart cast: já é String não-nulo aqui
}
```

## Data Classes: structs sem boilerplate

```kotlin
data class Pedido(
    val id: PedidoId,
    val itens: List<Item>,
    val total: BigDecimal,
)

val p1 = Pedido(PedidoId(1), listOf(), BigDecimal.ZERO)
val p2 = p1.copy(total = BigDecimal.TEN)   // copy imutável
```

Geram automaticamente `equals`, `hashCode`, `toString`, `copy` e `componentN()`. Use para **dados sem comportamento**: DTOs, requests, value objects.

Não use data class para entidades JPA — o `copy()` quebra `equals` por identidade. Use class normal com `id` na chave.

## Sealed Classes: tipos algébricos

```kotlin
sealed interface ResultadoPagamento {
    data class Aprovado(val transacaoId: String) : ResultadoPagamento
    data class Recusado(val motivo: String) : ResultadoPagamento
    data object Pendente : ResultadoPagamento
}

fun processar(r: ResultadoPagamento) = when (r) {
    is ResultadoPagamento.Aprovado -> "ok: ${r.transacaoId}"
    is ResultadoPagamento.Recusado -> "recusado: ${r.motivo}"
    is ResultadoPagamento.Pendente -> "aguardando"
    // Sem else! Compilador verifica exaustividade.
}
```

Esse é o pattern mais poderoso para modelagem de domínio. Use sealed para **estados finitos** (status de pedido, tipo de pagamento, resultado de validação). Adicionou um caso novo? O compilador quebra TODOS os `when` que ficaram não-exaustivos.

## When: switch com superpoderes

```kotlin
val nivel = when (val score = calcular()) {
    in 0..39 -> "Reprovado"
    in 40..69 -> "Recuperação"
    in 70..89 -> "Aprovado"
    in 90..100 -> "Honra"
    else -> error("score inválido: $score")
}
```

`when` é expressão (retorna valor). Suporta ranges, `is`, `in`, condições arbitrárias (`when { x > 10 -> ... }`).

## Extension Functions

```kotlin
fun String.toSlug(): String =
    lowercase()
        .replace(Regex("[^a-z0-9]+"), "-")
        .trim('-')

"Pedido Cancelado!".toSlug()   // "pedido-cancelado"
```

Adiciona métodos a tipos existentes (incluindo Java) **sem herdar nem modificar**. Use para criar DSLs internas e para encapsular operações comuns. Não abuse: extensions com lógica de negócio "perdida" fora do domínio são armadilha.

## Scope Functions: let/run/apply/also/with

| Função | Recebe | Retorna | Uso típico |
|---|---|---|---|
| `let` | `it` | resultado do bloco | transformação encadeada |
| `run` | `this` | resultado do bloco | múltiplas chamadas em obj |
| `apply` | `this` | objeto recebido | inicialização (builder) |
| `also` | `it` | objeto recebido | side effect (log) |
| `with` | `this` | resultado do bloco | acesso a obj externo |

```kotlin
val pedido = Pedido(...)
    .apply { adicionar(item) }      // configura, retorna pedido
    .also { log.info("criado: $it") } // side effect
    .let { repository.salvar(it) }    // transforma para entidade
```

Regra sênior: **escolha 1-2 e seja consistente**. Misturar todas é poluição. Em domínio prefiro `let` (chain) e `apply` (init); evito `with` (acopla a objeto externo).

## Collections: imutável vs mutável

```kotlin
val lista: List<Int> = listOf(1, 2, 3)              // imutável
val mutavel: MutableList<Int> = mutableListOf()      // mutável

lista.map { it * 2 }              // [2, 4, 6] — nova lista
lista.filter { it > 1 }            // [2, 3]
lista.groupBy { it % 2 == 0 }      // {true=[2], false=[1, 3]}
lista.sumOf { it }                 // 6
lista.fold(0) { acc, n -> acc + n }
```

**Sempre retorne `List` (imutável) de funções públicas**, mesmo que você use `MutableList` internamente. Imutável é seguro pra concorrência e mais fácil de raciocinar.

## Critério de domínio

Você dominou este card quando consegue: modelar um domínio (pedido, pagamento, status) usando sealed classes; usar when exaustivo sem `else`; explicar por que `!!` é cheiro; escolher entre `let`, `apply`, `also` com critério; e por que entidades JPA não devem ser data class.
