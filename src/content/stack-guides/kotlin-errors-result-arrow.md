---
title: "Kotlin: Errors, Result<T> e Either (Arrow)"
category: stack-guides
stack: [Kotlin, Arrow]
tags: [kotlin, errors, result, either, arrow, exceptions]
excerpt: "Quando lançar exception, quando retornar Result<T>, quando usar Either da Arrow — o critério sênior para tratar falhas em domínio sem virar Java cosmético."
related: [kotlin-linguagem-essencial, spring-web-controllers, spring-hexagonal-kotlin]
updated: "2026-05-11"
---

## A pergunta central

Toda função pode falhar. Em Kotlin você tem três caminhos:

1. **Exception**: lança `throw IllegalStateException(...)`. Default Java/Spring. Não aparece no tipo.
2. **`Result<T>`**: tipo da stdlib (`Result.success(v)` / `Result.failure(e)`). Sucesso ou Throwable.
3. **`Either<E, A>`**: da biblioteca [Arrow](https://arrow-kt.io/). Sucesso (`Right`) com tipo OU erro (`Left`) com tipo do domínio.

Cada um tem lugar. Misturar tudo é cheiro.

## Quando usar Exception

Use para **falhas excepcionais que não fazem parte do contrato**:

- Bug do programador: `requireNotNull(x)`, `error("estado impossível")`.
- Falha de infra fora do controle: `SQLException`, `IOException`, `OutOfMemoryError`.
- Validação de pré-condição quebrada: `require(idade >= 0) { "idade inválida" }`.

```kotlin
fun comprar(quantidade: Int, estoque: Int) {
    require(quantidade > 0) { "quantidade deve ser > 0" }
    require(quantidade <= estoque) { "estoque insuficiente" }
    // ...
}
```

`require()`, `check()`, `error()` são funções idiomáticas Kotlin para guards. Lançam `IllegalArgumentException`, `IllegalStateException` e `IllegalStateException`.

**Não use exception para fluxo de domínio esperado** (pedido recusado, cupom inválido, saldo insuficiente). Isso é **caso de negócio**, não erro técnico.

## Quando usar Result<T>

`kotlin.Result<T>` é útil quando o caller decide se trata ou propaga:

```kotlin
fun buscarUsuario(id: String): Result<Usuario> = runCatching {
    httpClient.get("/users/$id").body<Usuario>()
}

// uso:
buscarUsuario("123")
    .onSuccess { renderizar(it) }
    .onFailure { log.warn("falha", it); fallback() }

// ou:
val nome = buscarUsuario("123")
    .map { it.nome }
    .getOrElse { "desconhecido" }
```

`runCatching { ... }` captura qualquer Throwable e empacota. Útil em fronteira de integração externa (HTTP, parsing, IO).

Limitações: `Result` carrega **Throwable**, sem tipo específico. Não substitui modelagem de erros de domínio.

## Quando usar Either<E, A> (Arrow)

Para **erros de domínio modelados como tipos**, use `Either` ou `sealed class`:

```kotlin
sealed interface CriarPedidoErro {
    data object EstoqueInsuficiente : CriarPedidoErro
    data class CupomInvalido(val codigo: String) : CriarPedidoErro
    data object UsuarioBloqueado : CriarPedidoErro
}

fun criarPedido(req: PedidoRequest): Either<CriarPedidoErro, Pedido> = either {
    val usuario = repo.find(req.userId)
    ensure(usuario.ativo) { CriarPedidoErro.UsuarioBloqueado }

    val estoque = estoqueService.consultar(req.skus)
    ensure(estoque.suficiente(req.quantidades)) { CriarPedidoErro.EstoqueInsuficiente }

    val cupom = req.cupom?.let { c ->
        cupomService.validar(c).bind() // se Left, sai daqui com esse Left
    }

    Pedido.novo(usuario, req.itens, cupom)
}
```

`either { ... }` builder + `bind()` + `ensure()` (Arrow 1.2+) dão sintaxe linear e clara para erros tipados. O controller mapeia `Either` para HTTP:

```kotlin
@PostMapping
fun criar(@RequestBody req: PedidoRequest): ResponseEntity<*> =
    criarPedido(req).fold(
        ifLeft = { erro -> mapearErro(erro) },
        ifRight = { pedido -> ResponseEntity.status(201).body(pedido) }
    )

fun mapearErro(e: CriarPedidoErro): ResponseEntity<ProblemDetail> = when (e) {
    is CriarPedidoErro.EstoqueInsuficiente -> problema(409, "Estoque insuficiente")
    is CriarPedidoErro.CupomInvalido -> problema(400, "Cupom inválido: ${e.codigo}")
    is CriarPedidoErro.UsuarioBloqueado -> problema(403, "Usuário bloqueado")
}
```

O compilador garante exaustividade no `when`. Adicionou erro novo? Quebra build em todos os mapeadores.

## Regra prática para escolher

```
Bug do programador (precondição quebrada, estado impossível)
  → throw + require/check/error

Falha de infra externa que pode ser absorvida (HTTP timeout, parse JSON)
  → Result<T> com runCatching, ou exception se propagar

Caso de negócio modelado (recusa, validação de domínio)
  → sealed class + Either<E, A> ou retorno tipado
```

## Anti-padrões comuns

**1. Usar exception como controle de fluxo de domínio**:

```kotlin
// ❌ ruim
fun aplicarCupom(c: Cupom) {
    if (c.expirado) throw CupomExpiradoException(c.codigo)
}

// ✓ bom
fun aplicarCupom(c: Cupom): Either<CupomErro, Pedido> {
    if (c.expirado) return CupomErro.Expirado(c.codigo).left()
    // ...
}
```

Exception é cara em JVM (stack trace) e esconde fluxo no controle. Não use para "negocialmente recusado".

**2. Result<T> em todo lugar virando Java cosmético**:

```kotlin
// ❌ ruim — verboso e perde stack trace
fun salvar(p: Pedido): Result<Unit> = runCatching { repo.save(p) }
```

Em camada infra, `repo.save()` que joga exception é OK. O caller pega no boundary (interceptor de erro).

**3. `getOrThrow()` em todo `Result`**:

```kotlin
// ❌ inútil
buscarUsuario(id).getOrThrow()    // equivalente a exception direta
```

Se você sempre joga, não usa `Result`. Use exception direto.

## Critério de domínio

Você dominou este card quando consegue: decidir entre exception, Result e Either pra cada cenário; explicar por que exception é cara em JVM e por que isso importa em hot path; usar `either { ... }` da Arrow com `bind()`; e listar 3 anti-padrões reais de uso de Result.
