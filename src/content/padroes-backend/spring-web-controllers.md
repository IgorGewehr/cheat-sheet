---
title: "Spring Web MVC: Controllers, ControllerAdvice, ProblemDetail"
category: padroes-backend
stack: [Spring Boot, Kotlin]
tags: [spring-web, controller, problem-detail, rfc7807, rest, kotlin]
excerpt: "Controllers REST do jeito sênior em Kotlin: ResponseEntity tipada, @ControllerAdvice global, ProblemDetail RFC 7807, headers, validação automática e os padrões que separam júnior de pleno."
related: [spring-boot-essentials, spring-validation-bean, spring-openapi-springdoc]
updated: "2026-05-11"
---

## Anatomia de um Controller

```kotlin
@RestController
@RequestMapping("/api/v1/pedidos")
class PedidoController(
    private val criar: CriarPedidoUseCase,
    private val buscar: BuscarPedidoUseCase,
) {

    @PostMapping
    fun criar(
        @Valid @RequestBody req: CriarPedidoRequest,
        uriBuilder: UriComponentsBuilder,
    ): ResponseEntity<PedidoResponse> {
        val pedido = criar.executar(req.toCommand())
        val uri = uriBuilder.path("/api/v1/pedidos/{id}")
            .buildAndExpand(pedido.id.valor)
            .toUri()
        return ResponseEntity.created(uri).body(pedido.toResponse())
    }

    @GetMapping("/{id}")
    fun buscar(@PathVariable id: UUID): ResponseEntity<PedidoResponse> =
        buscar.por(PedidoId(id))
            ?.toResponse()
            ?.let { ResponseEntity.ok(it) }
            ?: ResponseEntity.notFound().build()
}
```

Pontos sênior já nessa amostra:
- `@RestController` (combina `@Controller` + `@ResponseBody`).
- `@RequestMapping` versionado (`/v1/`).
- `ResponseEntity<T>` tipado — não retornar `Any`/`Map<String, Any>`.
- `created()` com `Location` header (HTTP REST correto, não `200 OK` em POST).
- Conversão **explícita** entre Request DTO → Command de domínio → Response DTO. Sem expor entidade JPA.
- `@PathVariable id: UUID` — Spring converte. Não pegue como `String` "porque é mais fácil".

## DTOs separados de domínio

```kotlin
data class CriarPedidoRequest(
    @field:NotBlank
    val clienteId: String,
    @field:Size(min = 1, max = 50)
    val itens: List<ItemRequest>,
) {
    fun toCommand() = CriarPedidoCommand(
        clienteId = ClienteId(clienteId),
        itens = itens.map { it.toItem() },
    )
}

data class PedidoResponse(
    val id: UUID,
    val clienteId: String,
    val total: BigDecimal,
    val criadoEm: Instant,
)

fun Pedido.toResponse() = PedidoResponse(
    id = id.valor,
    clienteId = clienteId.valor,
    total = total,
    criadoEm = criadoEm,
)
```

**Por que separar**: o DTO é seu contrato HTTP. Mudou o domínio? Pode mudar o DTO sem quebrar clientes. Adicionou campo interno (auditoria, soft delete)? Não vaza pra API. Entidade JPA tem lazy-load — passar pro Jackson é receita de erro intermitente.

## Status Codes Corretos

| Status | Quando |
|---|---|
| `200 OK` | GET com corpo / PUT com corpo |
| `201 Created` | POST que criou — adicione `Location` header |
| `202 Accepted` | aceito mas processamento assíncrono |
| `204 No Content` | DELETE bem-sucedido / PUT sem corpo |
| `400 Bad Request` | payload mal formado / validação |
| `401 Unauthorized` | sem credencial ou inválida |
| `403 Forbidden` | autenticado, mas sem permissão |
| `404 Not Found` | recurso inexistente |
| `409 Conflict` | violação de regra (cupom duplicado, estoque) |
| `422 Unprocessable Entity` | payload válido mas semanticamente errado |
| `429 Too Many Requests` | rate limit |
| `500 Internal Server Error` | bug nosso |
| `502 / 503 / 504` | dependência externa quebrada |

Não use `200 OK` para tudo. Não use `500` para erro de cliente. Não use `404` para erro de autorização.

## ControllerAdvice Global

```kotlin
@RestControllerAdvice
class ApiExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun validacao(ex: MethodArgumentNotValidException): ProblemDetail =
        ProblemDetail.forStatus(HttpStatus.BAD_REQUEST).apply {
            title = "Dados inválidos"
            detail = ex.bindingResult.fieldErrors
                .joinToString(", ") { "${it.field}: ${it.defaultMessage}" }
            setProperty("violacoes", ex.bindingResult.fieldErrors.map {
                mapOf("campo" to it.field, "mensagem" to it.defaultMessage)
            })
        }

    @ExceptionHandler(PedidoNaoEncontradoException::class)
    fun naoEncontrado(ex: PedidoNaoEncontradoException): ProblemDetail =
        ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.message ?: "Pedido não encontrado")
            .apply { title = "Pedido não encontrado" }

    @ExceptionHandler(EstoqueInsuficienteException::class)
    fun conflito(ex: EstoqueInsuficienteException): ProblemDetail =
        ProblemDetail.forStatus(HttpStatus.CONFLICT).apply {
            title = "Estoque insuficiente"
            detail = ex.message
            setProperty("skuFaltante", ex.sku)
        }

    @ExceptionHandler(Exception::class)
    fun genericErro(ex: Exception, request: HttpServletRequest): ProblemDetail {
        log.error("erro não tratado em ${request.method} ${request.requestURI}", ex)
        return ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR).apply {
            title = "Erro interno"
            detail = "Ocorreu um erro processando sua requisição"
        }
    }
}
```

## ProblemDetail (RFC 7807)

Spring 6 adicionou `ProblemDetail` como representação padrão de erro. JSON exemplo:

```json
{
  "type": "about:blank",
  "title": "Estoque insuficiente",
  "status": 409,
  "detail": "SKU ABC-123 indisponível",
  "instance": "/api/v1/pedidos",
  "skuFaltante": "ABC-123"
}
```

Vantagens vs JSON ad-hoc:
- Padrão IANA (todo cliente sabe parsear).
- `type` pode apontar para doc do erro (`type = URI("https://api.docs/errors/estoque")`).
- Properties extras são serializadas naturalmente.
- Frontend pode tratar genericamente: "tem `title` e `detail`? mostro".

**Nunca exponha stack trace ou query SQL em `detail`**. Isso é vazamento de informação.

## Validation com Jakarta

```kotlin
data class CriarPedidoRequest(
    @field:NotBlank(message = "clienteId é obrigatório")
    val clienteId: String,

    @field:Size(min = 1, max = 50, message = "deve ter 1-50 itens")
    @field:Valid
    val itens: List<ItemRequest>,

    @field:DecimalMin(value = "0.0", inclusive = false)
    val descontoPercentual: BigDecimal? = null,
)

data class ItemRequest(
    @field:NotBlank
    val sku: String,
    @field:Positive
    val quantidade: Int,
)
```

**Atenção em Kotlin**: use `@field:` para que a anotação fique no field gerado, não no parâmetro do construtor. Sem isso, `@NotBlank` é ignorada silenciosamente.

`@Valid` no `@RequestBody` ativa a validação. `@Valid` em campo recursiva pra elementos da lista.

## Headers e Content Negotiation

```kotlin
@GetMapping("/{id}", produces = [MediaType.APPLICATION_JSON_VALUE])
fun buscar(@PathVariable id: UUID): ResponseEntity<PedidoResponse> = ...

@PostMapping(consumes = [MediaType.APPLICATION_JSON_VALUE])
fun criar(@RequestBody req: CriarPedidoRequest): ResponseEntity<PedidoResponse> = ...
```

Para retornar CSV/PDF: registre `HttpMessageConverter`. Para idioma: `LocaleResolver`. Não invente parsing manual — Spring já tem.

## Anti-padrões frequentes

1. **`@Autowired` em field**: quebra teste e esconde dependências.
2. **Retornar entidade JPA**: lazy-load explode, vaza schema.
3. **`Map<String, Any>` como response**: contrato sem tipo, frontend sofre.
4. **Try/catch em controller**: deixa pro `@ControllerAdvice`.
5. **`@GetMapping` sem `produces`**: ambíguo em content negotiation.
6. **Validation via `if/else` no controller**: use Bean Validation.
7. **Versionamento por query string** (`?v=2`): use path (`/v2/`) ou Accept header.

## Critério de domínio

Você dominou este card quando consegue: escrever um Controller com Request DTO, Response DTO e mapeamento explícito; tratar erros via `@RestControllerAdvice` com ProblemDetail; explicar quando usar 409 vs 422 vs 400; usar `@field:NotBlank` em Kotlin e dizer por que `@NotBlank` direto não funciona; e listar 3 motivos pra nunca retornar entidade JPA.
