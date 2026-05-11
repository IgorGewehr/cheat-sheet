---
title: "Spring + OpenAPI: SDD com springdoc"
category: padroes-backend
stack: [Spring Boot, Kotlin, OpenAPI, springdoc]
tags: [openapi, springdoc, sdd, contract-first, swagger, contract-test]
excerpt: "Spec-Driven Development com Spring Boot: gerar contrato a partir do código ou código a partir do contrato — escolha consciente, contract tests e por que docs auto-geradas não substituem desenho de API."
related: [spring-web-controllers, spring-microservices-enterprise, go-contract-sdd-tests]
updated: "2026-05-11"
---

## O que é SDD

Spec-Driven Development = **o contrato HTTP é artefato de primeira classe**. Não comentário; arquivo versionado, revisado em PR, validado em CI. Em projetos enterprise com múltiplos times consumidores, isso vale ouro:

- frontend gera client TypeScript do mesmo contrato;
- mobile gera cliente Swift/Kotlin;
- QA escreve contract tests sem ler código;
- docs ficam **sempre** atualizadas.

Duas estratégias:

1. **Contract-First**: você escreve `openapi.yaml` e gera código (interfaces de controller). Mais disciplina, melhor para multi-time.
2. **Code-First**: você anota controllers e o springdoc gera o `openapi.json`. Mais ágil, melhor para serviço único.

## Code-First com springdoc

Dependência:

```kotlin
implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")
// para WebFlux: springdoc-openapi-starter-webflux-ui
```

Configuração:

```yaml
springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
    operationsSorter: method
```

Acesse `/swagger-ui.html`. Funciona, sem código adicional. Mas para qualidade enterprise, anote:

```kotlin
@RestController
@RequestMapping("/api/v1/pedidos")
@Tag(name = "Pedidos", description = "Gerenciamento de pedidos do ERP")
class PedidoController(private val uc: CriarPedidoUseCase) {

    @Operation(
        summary = "Cria um novo pedido",
        description = "Cria pedido com itens e dispara evento PedidoCriado para fila de processamento."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Pedido criado",
            headers = [Header(name = "Location", description = "URI do recurso")]),
        ApiResponse(responseCode = "400", description = "Dados inválidos"),
        ApiResponse(responseCode = "409", description = "Estoque insuficiente"),
    )
    @PostMapping
    fun criar(
        @Valid @RequestBody req: CriarPedidoRequest,
    ): ResponseEntity<PedidoResponse> = ...
}

@Schema(description = "Payload para criação de pedido")
data class CriarPedidoRequest(
    @field:Schema(description = "ID do cliente", example = "CLI-12345")
    @field:NotBlank
    val clienteId: String,

    @field:Schema(description = "Lista de itens")
    @field:Size(min = 1, max = 50)
    val itens: List<ItemRequest>,
)
```

Anotações que valem o investimento:
- `@Operation(summary, description)` em cada endpoint.
- `@ApiResponse` para cada status code possível.
- `@Schema(description, example)` em campos não-óbvios.
- `@Tag` para agrupar.

**Pula**: `@Parameter` em variáveis óbvias, `@RequestBody` (já inferido), descrições genéricas tipo "ID do recurso".

## Contract-First com OpenAPI Generator

Para projetos com clientes externos, contrato-primeiro:

`api/openapi.yaml`:

```yaml
openapi: 3.1.0
info:
  title: Billing Service API
  version: 1.2.0
paths:
  /pedidos:
    post:
      operationId: criarPedido
      tags: [Pedidos]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CriarPedidoRequest"
      responses:
        "201":
          description: Pedido criado
          headers:
            Location:
              schema: { type: string }
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PedidoResponse"
        "409":
          $ref: "#/components/responses/Conflito"
components:
  schemas:
    CriarPedidoRequest:
      type: object
      required: [clienteId, itens]
      properties:
        clienteId:
          type: string
          example: "CLI-12345"
        itens:
          type: array
          minItems: 1
          maxItems: 50
          items:
            $ref: "#/components/schemas/ItemRequest"
```

`build.gradle.kts`:

```kotlin
plugins {
    id("org.openapi.generator") version "7.7.0"
}

openApiGenerate {
    generatorName.set("kotlin-spring")
    inputSpec.set("$rootDir/api/openapi.yaml")
    outputDir.set("$buildDir/generated/openapi")
    apiPackage.set("com.igor.billing.api")
    modelPackage.set("com.igor.billing.api.model")
    configOptions.set(mapOf(
        "useTags" to "true",
        "interfaceOnly" to "true",
        "useSpringBoot3" to "true",
        "documentationProvider" to "springdoc",
    ))
}

sourceSets.main {
    java.srcDir("$buildDir/generated/openapi/src/main/kotlin")
}

tasks.compileKotlin { dependsOn("openApiGenerate") }
```

O gerador cria interfaces `PedidosApi`:

```kotlin
interface PedidosApi {
    @PostMapping("/pedidos")
    fun criarPedido(@Valid @RequestBody req: CriarPedidoRequest): ResponseEntity<PedidoResponse>
}
```

Você **implementa** essa interface no seu controller. Se o contrato muda e a interface mudar, build quebra — falha rápida.

## Contract Tests

Garantir que a app respeita o spec:

```kotlin
@WebMvcTest
class OpenApiContractTest(@Autowired val mockMvc: MockMvc) {

    @Test
    fun `contrato respeita o spec OpenAPI`() {
        val validator = OpenApiInteractionValidator
            .createForSpecificationUrl("classpath:openapi.yaml")
            .build()

        mockMvc.post("/api/v1/pedidos") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"clienteId":"CLI-1","itens":[{"sku":"S","quantidade":1}]}"""
        }.andExpect {
            status { isCreated() }
        }.andDo {
            handle { result ->
                val request = SimpleRequest.from(result.request)
                val response = SimpleResponse.from(result.response)
                validator.validate(request, response).also { report ->
                    if (report.hasErrors()) error(report.toString())
                }
            }
        }
    }
}
```

Use lib [atlassian/swagger-request-validator](https://bitbucket.org/atlassian/swagger-request-validator/). Roda em CI: spec e código divergem? Falha o build.

## Versionamento da API

| Estratégia | Quando |
|---|---|
| **URI**: `/v1/`, `/v2/` | mais comum, simples |
| **Header**: `Accept: application/vnd.app.v2+json` | mais HTTP-idiomático, complexo de evoluir |
| **Query**: `?version=2` | feio, evitar |

Em enterprise, **breaking change = nova major version**. Você mantém v1 enquanto consumidores migram.

## Boas práticas de design

1. **Nouns, não verbs**: `POST /pedidos`, não `POST /criarPedido`.
2. **Plurals**: `/pedidos`, não `/pedido`.
3. **Status codes corretos**: 201 + Location no POST que cria, 204 no DELETE.
4. **Paginação consistente**: `?page=0&size=20` + meta `{totalElements, totalPages}`.
5. **Filtragem por query**: `GET /pedidos?status=PAGO&clienteId=C-1`.
6. **Idempotency**: `POST /pedidos` com `Idempotency-Key` header.
7. **Errors padronizados**: RFC 7807 ProblemDetail.
8. **Timestamps em ISO-8601 UTC**: `2026-05-11T14:23:01Z`.
9. **IDs estáveis e opacos**: UUID, não `incrementId`.
10. **Nunca expor schema interno do banco**: o contrato é a forma do mundo externo.

## Anti-padrões

1. **Mudança breaking sem nova versão**: clientes quebram em produção.
2. **Spec gerada mas não revisada**: contrato fica sujo, ninguém entende.
3. **Doc swagger pública sem auth na rota /swagger-ui**: vazamento de schema interno.
4. **Misturar code-first e contract-first**: divergência silenciosa.

## Critério de domínio

Você dominou este card quando consegue: escolher entre code-first e contract-first com critério; anotar controller para gerar spec rica com springdoc; gerar interfaces Kotlin a partir de `openapi.yaml`; escrever um contract test; e listar 5 práticas de design REST que separam júnior de sênior.
