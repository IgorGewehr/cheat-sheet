---
title: "Spring Validation: Jakarta Bean Validation com Kotlin"
category: padroes-backend
stack: [Spring Boot, Kotlin, Jakarta Validation]
tags: [validation, jakarta, hibernate-validator, kotlin, bean-validation]
excerpt: "Bean Validation 3.0 com Kotlin sem armadilha: @field:, validações customizadas, grupos, cross-field e por que `@NotBlank` direto no parâmetro do construtor não funciona."
related: [spring-web-controllers, kotlin-linguagem-essencial, spring-data-jpa]
updated: "2026-05-11"
---

## A armadilha Kotlin

Em Java:

```java
public record CriarPedidoRequest(@NotBlank String clienteId) {}
```

Em Kotlin, a tradução literal **NÃO funciona como esperado**:

```kotlin
// ❌ a anotação vai pro parâmetro do construtor — ignorada por Bean Validation
data class CriarPedidoRequest(@NotBlank val clienteId: String)
```

Você precisa de `@field:`:

```kotlin
// ✓ a anotação vai pro field gerado
data class CriarPedidoRequest(
    @field:NotBlank
    val clienteId: String,
)
```

Por quê? Kotlin gera o construtor + field + getter/setter + ... e por padrão a anotação vai pro construtor parameter. Bean Validation lê do field/getter. Use `@field:` (ou `@get:` em alguns frameworks) para ser explícito.

## As anotações que cobrem 90% dos casos

```kotlin
data class UsuarioRequest(
    @field:NotBlank
    @field:Size(min = 2, max = 80)
    val nome: String,

    @field:Email
    @field:NotBlank
    val email: String,

    @field:Pattern(regexp = "^\\d{11}$", message = "CPF deve ter 11 dígitos")
    val cpf: String,

    @field:Min(18)
    @field:Max(120)
    val idade: Int,

    @field:Past
    val nascimento: LocalDate,

    @field:DecimalMin(value = "0.0", inclusive = false)
    @field:Digits(integer = 10, fraction = 2)
    val salario: BigDecimal,

    @field:NotEmpty
    @field:Size(max = 5)
    @field:Valid // valida cada elemento
    val telefones: List<TelefoneRequest>,
)
```

Cheat sheet:

| Anotação | Para | Notas |
|---|---|---|
| `@NotNull` | qualquer | não nulo |
| `@NotBlank` | String | não nulo + não vazio + não whitespace |
| `@NotEmpty` | String/Collection | não nulo + tem 1+ elemento |
| `@Size(min, max)` | String/Collection | tamanho |
| `@Min`, `@Max` | número | valor mínimo/máximo |
| `@Positive`, `@PositiveOrZero` | número | > 0 ou >= 0 |
| `@DecimalMin`, `@DecimalMax` | BigDecimal | usa string para precisão |
| `@Digits(integer, fraction)` | BigDecimal | dígitos inteiros + decimais |
| `@Past`, `@PastOrPresent` | data | passada |
| `@Future`, `@FutureOrPresent` | data | futura |
| `@Email` | String | regex frouxo — não substitui MX check |
| `@Pattern` | String | regex |
| `@AssertTrue` / `@AssertFalse` | Boolean | valor explícito |
| `@Valid` | aninhado | propaga validação |

## Ativando validação

No controller:

```kotlin
@RestController
class PedidoController(private val uc: CriarPedidoUseCase) {

    @PostMapping("/pedidos")
    fun criar(@Valid @RequestBody req: CriarPedidoRequest): ResponseEntity<PedidoResponse> {
        return ResponseEntity.created(uri).body(uc.executar(req.toCmd()).toResponse())
    }
}
```

`@Valid` no `@RequestBody` faz o Spring rodar Bean Validation antes do método. Se falha, lança `MethodArgumentNotValidException` (capturado pelo `@ControllerAdvice`).

Em parâmetros simples (`@PathVariable`, `@RequestParam`) use `@Validated` na classe:

```kotlin
@RestController
@Validated
class BuscaController {

    @GetMapping("/buscar")
    fun buscar(
        @RequestParam @NotBlank @Size(min = 2) termo: String,
        @RequestParam @Min(1) @Max(100) limite: Int = 20,
    ): ResultadoBusca = ...
}
```

`@Validated` na classe ativa validação de parâmetros simples. Falha lança `ConstraintViolationException`.

## Validação customizada

Para regras de domínio, crie sua anotação:

```kotlin
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [CpfValidator::class])
@MustBeDocumented
annotation class CpfValido(
    val message: String = "CPF inválido",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
)

class CpfValidator : ConstraintValidator<CpfValido, String?> {
    override fun isValid(value: String?, ctx: ConstraintValidatorContext): Boolean {
        if (value.isNullOrBlank()) return true   // deixa @NotBlank cuidar disso
        return CpfValidatorImpl.validar(value)
    }
}
```

Uso:

```kotlin
data class UsuarioRequest(
    @field:NotBlank
    @field:CpfValido
    val cpf: String,
)
```

**Regra**: validadores customizados **não** devem validar null/blank. Encadeie com `@NotBlank`. Validador único = uma responsabilidade.

## Cross-field validation

Quando a regra envolve dois campos, anote a classe:

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [PeriodoValidoValidator::class])
annotation class PeriodoValido(
    val message: String = "data fim deve ser após data início",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
)

class PeriodoValidoValidator : ConstraintValidator<PeriodoValido, PeriodoRequest> {
    override fun isValid(req: PeriodoRequest, ctx: ConstraintValidatorContext): Boolean {
        if (req.inicio == null || req.fim == null) return true
        val ok = req.fim.isAfter(req.inicio)
        if (!ok) {
            ctx.disableDefaultConstraintViolation()
            ctx.buildConstraintViolationWithTemplate("data fim deve ser após início")
                .addPropertyNode("fim")
                .addConstraintViolation()
        }
        return ok
    }
}

@PeriodoValido
data class PeriodoRequest(val inicio: LocalDate?, val fim: LocalDate?)
```

## Validation Groups

Mesmo DTO, regras diferentes em criar vs atualizar:

```kotlin
interface Criacao
interface Atualizacao

data class UsuarioRequest(
    @field:Null(groups = [Criacao::class])
    @field:NotNull(groups = [Atualizacao::class])
    val id: UUID?,

    @field:NotBlank(groups = [Criacao::class, Atualizacao::class])
    val nome: String,
)

@PostMapping
fun criar(@Validated(Criacao::class) @RequestBody req: UsuarioRequest) = ...

@PutMapping("/{id}")
fun atualizar(@Validated(Atualizacao::class) @RequestBody req: UsuarioRequest) = ...
```

Use com parcimônia. Geralmente dois DTOs separados são mais legíveis.

## Validação fora do controller

```kotlin
@Service
class PromocaoService(private val validator: Validator) {
    fun criar(req: CriarPromocaoCommand) {
        val violations = validator.validate(req)
        if (violations.isNotEmpty()) {
            throw ConstraintViolationException(violations)
        }
        // ...
    }
}
```

Útil em commands de domínio onde a validação não vem de um controller HTTP (mensageria, batch, scheduled).

## Critério de domínio

Você dominou este card quando consegue: usar `@field:` corretamente em Kotlin; escolher entre `@NotBlank`, `@NotEmpty`, `@NotNull`; criar uma anotação customizada para validar CPF/CNPJ; explicar a diferença entre `@Valid` no parâmetro e `@Validated` na classe; e implementar cross-field validation.
