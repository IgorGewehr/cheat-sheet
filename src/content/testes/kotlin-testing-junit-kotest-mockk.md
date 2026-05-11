---
title: "Kotlin Testing: JUnit 5, Kotest, MockK, AssertJ"
category: testes
stack: [Kotlin, JUnit 5, Kotest, MockK, AssertJ]
tags: [testing, junit, kotest, mockk, assertj, spring-test]
excerpt: "Stack de testes Kotlin profissional: JUnit 5 com Spring, Kotest para DSL expressiva, MockK para mock idiomático, AssertJ vs Kotest assertions e slices @WebMvcTest/@DataJpaTest."
related: [kotlin-linguagem-essencial, spring-testcontainers, tdd-red-green-refactor]
updated: "2026-05-11"
---

## A stack

| Lib | Para |
|---|---|
| **JUnit 5 (Jupiter)** | engine padrão, default Spring Boot |
| **Kotest** | DSL expressiva (`StringSpec`, `BehaviorSpec`), assertions ricas |
| **MockK** | mock idiomático Kotlin (suporta `suspend`, top-level, classes finais) |
| **AssertJ** | assertions fluentes Java-style |
| **Spring Boot Test** | slices, `@SpringBootTest`, Testcontainers |

Vai ter JUnit 5 sempre. **Escolha entre Kotest e AssertJ** (você não precisa dos dois). Em equipe vinda de Java, AssertJ é mais familiar. Em equipe Kotlin nova, Kotest faz código mais fluido.

## Setup Gradle

```kotlin
dependencies {
    testImplementation("org.springframework.boot:spring-boot-starter-test") {
        exclude(group = "org.mockito") // usamos MockK
    }
    testImplementation("io.kotest:kotest-runner-junit5:5.9.1")
    testImplementation("io.kotest:kotest-assertions-core:5.9.1")
    testImplementation("io.kotest.extensions:kotest-extensions-spring:1.3.0")
    testImplementation("io.mockk:mockk:1.13.13")
    testImplementation("com.ninja-squad:springmockk:4.0.2")
}

tasks.test {
    useJUnitPlatform()
}
```

## JUnit 5 puro

```kotlin
class CalculadoraDescontoTest {

    private val calc = CalculadoraDesconto()

    @Test
    fun `aplica 10% para clientes premium`() {
        val resultado = calc.aplicar(BigDecimal("100"), Cliente.PREMIUM)
        assertEquals(BigDecimal("90"), resultado)
    }

    @ParameterizedTest
    @CsvSource(
        "100, REGULAR, 100",
        "100, PREMIUM, 90",
        "100, VIP,      80",
    )
    fun `aplica desconto por tipo`(valor: String, tipo: Cliente, esperado: String) {
        assertEquals(BigDecimal(esperado), calc.aplicar(BigDecimal(valor), tipo))
    }
}
```

Backticks permitem nomes legíveis em PT-BR. Sênior nomeia teste como **frase de comportamento esperado**.

## Kotest DSL

```kotlin
class CalculadoraDescontoSpec : StringSpec({
    val calc = CalculadoraDesconto()

    "aplica 10% para premium" {
        calc.aplicar(BigDecimal("100"), Cliente.PREMIUM) shouldBe BigDecimal("90")
    }

    "data-driven via withData" {
        withData(
            row(BigDecimal("100"), Cliente.REGULAR, BigDecimal("100")),
            row(BigDecimal("100"), Cliente.PREMIUM, BigDecimal("90")),
            row(BigDecimal("100"), Cliente.VIP,     BigDecimal("80")),
        ) { (valor, tipo, esperado) ->
            calc.aplicar(valor, tipo) shouldBe esperado
        }
    }
})

class PedidoBehaviorSpec : BehaviorSpec({
    given("um pedido com 3 itens") {
        val pedido = Pedido.com(3.itens())
        `when`("calculo o total") {
            val total = pedido.total()
            then("é a soma dos itens") {
                total shouldBe BigDecimal("150")
            }
        }
    }
})
```

`StringSpec` é minimalista; `BehaviorSpec` é BDD; `FunSpec` é familiar. Use **um único estilo no projeto**.

## MockK essencial

```kotlin
class CriarPedidoUseCaseTest : StringSpec({
    val repo = mockk<PedidoRepository>()
    val publisher = mockk<EventoPublisher>(relaxed = true)
    val uc = CriarPedidoUseCase(repo, publisher)

    "salva e publica evento" {
        val cmd = CriarPedidoCommand(clienteId = "C-1", itens = listOf())
        every { repo.save(any()) } returns Pedido(PedidoId(1), cmd.clienteId)

        val resultado = uc.executar(cmd)

        resultado.clienteId shouldBe "C-1"
        verify(exactly = 1) { repo.save(any()) }
        verify { publisher.publicar(any<PedidoCriado>()) }
    }

    "suspend function" {
        val client = mockk<EstoqueClient>()
        coEvery { client.consultar("SKU-1") } returns Estoque(10)

        runTest { client.consultar("SKU-1") shouldBe Estoque(10) }
    }
})
```

| Construção | Para |
|---|---|
| `mockk<T>()` | mock estrito (qualquer chamada não stubbed lança) |
| `mockk<T>(relaxed = true)` | retorna valores default para tudo |
| `mockk<T>(relaxUnitFun = true)` | só Unit functions são "relaxadas" (sweet spot) |
| `every { }` | stub para chamada normal |
| `coEvery { }` | stub para `suspend fun` |
| `verify { }` | confere chamada feita |
| `coVerify { }` | confere chamada `suspend` feita |
| `mockkStatic(...)` | mocka função top-level / static |

⚠️ **MockK precisa de plugin para mockar classes finais**. Em Spring, classes geram CGLIB. Spring MockK (`@MockkBean`, `@SpykBean`) já vem configurado.

## Spring Test Slices

Carregar `@SpringBootTest` inteiro custa segundos. Use slices:

```kotlin
@WebMvcTest(PedidoController::class)
class PedidoControllerTest(@Autowired val mockMvc: MockMvc) {

    @MockkBean
    lateinit var uc: CriarPedidoUseCase

    @Test
    fun `POST cria pedido`() {
        every { uc.executar(any()) } returns Pedido.novo()

        mockMvc.post("/pedidos") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"clienteId":"C-1","itens":[]}"""
        }.andExpect {
            status { isCreated() }
            header { exists("Location") }
        }
    }
}
```

Slices comuns:

| Slice | Carrega | Para |
|---|---|---|
| `@WebMvcTest` | Controllers + Filters | testes de HTTP |
| `@DataJpaTest` | JPA + repository + H2/Testcontainers | testes de query |
| `@JsonTest` | só Jackson | serialização |
| `@RestClientTest` | RestTemplate/WebClient | client HTTP |
| `@SpringBootTest(webEnvironment = MOCK)` | tudo (lento) | smoke E2E |

## Assertions: AssertJ vs Kotest

```kotlin
// AssertJ
assertThat(pedido.itens)
    .hasSize(3)
    .extracting<String> { it.sku }
    .containsExactly("SKU-1", "SKU-2", "SKU-3")

// Kotest
pedido.itens shouldHaveSize 3
pedido.itens.map { it.sku } shouldContainExactly listOf("SKU-1", "SKU-2", "SKU-3")
```

Kotest tem matchers ricos: `shouldBe`, `shouldNotBe`, `shouldContain`, `shouldHaveSize`, `shouldStartWith`, `shouldThrow`, `shouldBeInstanceOf`, `shouldMatch` (regex), etc.

Para erros:

```kotlin
shouldThrow<EstoqueInsuficienteException> {
    uc.executar(comandoComEstoqueZero())
}
```

## Test naming convention

Sênior nomeia teste por **comportamento esperado**, não pela função:

```kotlin
// ❌ acoplado à implementação
fun testCalcular() { ... }

// ✓ comportamento
fun `retorna 90 quando aplica 10% sobre 100`() { ... }
fun `lança StatusInvalido quando cancela pedido já entregue`() { ... }
```

## TDD ciclo

1. **Vermelho**: escreva teste que falha (compila mas falha).
2. **Verde**: implemente o mínimo que faz passar.
3. **Refator**: melhore o código (e o teste!) mantendo verde.

Use isto em **lógica de domínio**. Em CRUD de boilerplate, TDD-after (escreve teste depois) é aceitável. Mas em regras de negócio complexas (cálculo, máquina de estados, validação composta), TDD-first paga.

## Anti-padrões frequentes

1. **`@SpringBootTest` em tudo**: build lento, equipe ignora teste.
2. **Mockar tudo, inclusive value objects**: teste vira fantasia que sempre passa.
3. **Asserções fracas (`shouldNotBe null`)**: passe a verificar o conteúdo.
4. **Teste que depende de ordem (`@Order`)**: cheiro de estado compartilhado.
5. **Teste sem nome semântico**: revisor não consegue dizer o que falhou sem ler corpo.

## Critério de domínio

Você dominou este card quando consegue: escrever um teste Kotest com `StringSpec`; mockar `suspend fun` com MockK e `coEvery`; escolher entre `@WebMvcTest`, `@DataJpaTest`, `@SpringBootTest`; explicar a diferença entre `mockk<T>(relaxed = true)` e estrito; e nomear teste por comportamento, não por método.
