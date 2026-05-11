---
title: "Spring + Kotlin: Arquitetura Hexagonal Pragmática"
category: arquiteturas
stack: [Spring Boot, Kotlin]
tags: [hexagonal, ports-adapters, clean-architecture, ddd, modules]
excerpt: "Hexagonal em Kotlin enterprise: domínio puro sem Spring, ports/adapters, use cases, módulos Gradle por camada e a fronteira que impede infraestrutura vazar pro core."
related: [hexagonal, clean-architecture, spring-ddd-aggregates-kotlin]
updated: "2026-05-11"
---

## A regra única

Hexagonal (Ports & Adapters, Alistair Cockburn 2005) tem **uma regra que importa**: dependências apontam pra dentro. O **domínio** não conhece infraestrutura. A infra conhece o domínio.

```text
                  ┌───────────────────────┐
                  │      DOMINIO          │
                  │   (regras de negócio) │
                  └───▲───────────────▲───┘
                      │               │
              ┌───────┴────┐    ┌─────┴──────┐
              │APPLICATION │    │APPLICATION │
              │ port IN    │    │ port OUT   │
              │(use case)  │    │(repository)│
              └───▲────────┘    └─────▲──────┘
                  │                   │
        ┌─────────┴────────┐  ┌───────┴────────┐
        │ ADAPTER IN       │  │ ADAPTER OUT    │
        │ (HTTP, Kafka     │  │ (JPA, HTTP     │
        │  consumer, CLI)  │  │  client, Kafka │
        └──────────────────┘  │  producer)     │
                              └────────────────┘
```

- **Domain**: entidades, value objects, agregados, domain services. Zero Spring, zero JPA.
- **Application**: use cases (input ports) e interfaces de dependência (output ports).
- **Adapter In**: controllers HTTP, consumers Kafka, jobs schedulados — chamam use cases.
- **Adapter Out**: implementações JPA, clients HTTP, publisher Kafka — implementam output ports.

## Módulos Gradle por camada

```text
billing-service/
├── app/                       # main, configuração Spring
├── adapter-in-http/           # controllers + DTOs HTTP
├── adapter-in-messaging/      # consumers Kafka
├── adapter-out-persistence/   # JPA entities + repositories
├── adapter-out-messaging/     # producers Kafka
├── adapter-out-external/      # clients HTTP de APIs externas
├── application/               # use cases + ports
└── domain/                    # núcleo
```

Dependências:

```kotlin
// domain/build.gradle.kts — ZERO dependência de framework
plugins { id("billing.kotlin-conventions") }
dependencies { testImplementation(libs.bundles.testing) }

// application/build.gradle.kts
dependencies {
    implementation(project(":domain"))
}

// adapter-out-persistence/build.gradle.kts
dependencies {
    implementation(project(":application"))
    implementation(libs.spring.boot.data.jpa)
}

// app/build.gradle.kts — assembla tudo
dependencies {
    implementation(project(":adapter-in-http"))
    implementation(project(":adapter-in-messaging"))
    implementation(project(":adapter-out-persistence"))
    implementation(project(":adapter-out-messaging"))
    runtimeOnly("org.postgresql:postgresql")
}
```

O compilador é seu linter de arquitetura. Tentou importar `org.springframework.*` em `domain/`? Build quebra.

## Domain puro

```kotlin
// domain/PedidoId.kt
@JvmInline
value class PedidoId(val valor: UUID)

// domain/Pedido.kt
class Pedido private constructor(
    val id: PedidoId,
    val cliente: ClienteId,
    private val _itens: MutableList<ItemPedido>,
    var status: Status = Status.PENDENTE,
) {
    val itens: List<ItemPedido> get() = _itens.toList()
    val total: BigDecimal get() = _itens.sumOf { it.subtotal }

    fun adicionar(item: ItemPedido) {
        require(status == Status.PENDENTE) { "pedido $status não aceita itens" }
        require(_itens.size < 50) { "máximo 50 itens" }
        _itens.add(item)
    }

    fun confirmar() {
        require(status == Status.PENDENTE) { "só PENDENTE pode confirmar" }
        require(_itens.isNotEmpty()) { "pedido sem itens" }
        status = Status.CONFIRMADO
    }

    companion object {
        fun novo(cliente: ClienteId): Pedido =
            Pedido(PedidoId(UUID.randomUUID()), cliente, mutableListOf())
    }
}

// domain/Status.kt
enum class Status { PENDENTE, CONFIRMADO, ENTREGUE, CANCELADO }
```

Note: invariantes vivem no domínio (`require`), construtor privado, factory function (`novo`), encapsulamento de coleção (`_itens` privada, `itens` cópia imutável).

## Application: use cases + ports

```kotlin
// application/CriarPedidoUseCase.kt
interface CriarPedidoUseCase {
    fun executar(cmd: CriarPedidoCommand): PedidoId
}

data class CriarPedidoCommand(
    val cliente: ClienteId,
    val itens: List<ItemPedido>,
)

// application/PedidoRepository.kt (port OUT)
interface PedidoRepository {
    fun salvar(pedido: Pedido)
    fun buscar(id: PedidoId): Pedido?
}

// application/EstoqueClient.kt (port OUT)
interface EstoqueClient {
    fun reservar(itens: List<ItemPedido>): Reserva
    fun cancelar(reserva: Reserva)
}

// application/CriarPedidoService.kt
class CriarPedidoService(
    private val pedidos: PedidoRepository,
    private val estoque: EstoqueClient,
    private val eventos: EventoPublisher,
) : CriarPedidoUseCase {

    override fun executar(cmd: CriarPedidoCommand): PedidoId {
        val pedido = Pedido.novo(cmd.cliente)
        cmd.itens.forEach { pedido.adicionar(it) }

        estoque.reservar(pedido.itens)
        pedidos.salvar(pedido)
        eventos.publicar(PedidoCriado(pedido.id))

        return pedido.id
    }
}
```

`application` declara contratos como interfaces. Implementações ficam em `adapter-out-*`.

## Adapter Out (Persistence)

```kotlin
// adapter-out-persistence/PedidoEntity.kt
@Entity @Table(name = "pedidos")
class PedidoEntity(
    @Id val id: UUID,
    @Column val clienteId: UUID,
    @Column val status: String,
    @Column val total: BigDecimal,
    @OneToMany(mappedBy = "pedido", cascade = [CascadeType.ALL])
    val itens: MutableList<ItemEntity> = mutableListOf(),
)

// adapter-out-persistence/PedidoJpaRepository.kt
interface PedidoJpaRepository : JpaRepository<PedidoEntity, UUID>

// adapter-out-persistence/PedidoRepositoryAdapter.kt
@Component
class PedidoRepositoryAdapter(
    private val jpa: PedidoJpaRepository,
) : PedidoRepository {

    override fun salvar(pedido: Pedido) {
        val entity = toEntity(pedido)
        jpa.save(entity)
    }

    override fun buscar(id: PedidoId): Pedido? =
        jpa.findById(id.valor).orElse(null)?.let(::toDomain)
}

private fun toEntity(p: Pedido) = PedidoEntity(
    id = p.id.valor,
    clienteId = p.cliente.valor,
    status = p.status.name,
    total = p.total,
    itens = p.itens.map { ItemEntity(/*...*/) }.toMutableList(),
)

private fun toDomain(e: PedidoEntity) = Pedido.reconstituir(
    id = PedidoId(e.id),
    cliente = ClienteId(e.clienteId),
    status = Status.valueOf(e.status),
    itens = e.itens.map(::toItemDomain),
)
```

Mapeamento explícito. Sim, é boilerplate. Em compensação, mudou DB schema? Só toca em `adapter-out-persistence`. Domínio segue intacto.

## Adapter In (HTTP)

```kotlin
// adapter-in-http/PedidoController.kt
@RestController @RequestMapping("/api/v1/pedidos")
class PedidoController(private val criar: CriarPedidoUseCase) {

    @PostMapping
    fun criar(@Valid @RequestBody req: CriarPedidoRequest): ResponseEntity<PedidoResponse> {
        val id = criar.executar(req.toCommand())
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(PedidoResponse(id.valor))
    }
}
```

O controller só **traduz HTTP → command, executa use case, traduz domain → response**. Lógica zero.

## Configuração de wiring

```kotlin
// app/BeanConfig.kt
@Configuration
class UseCaseConfig {
    @Bean
    fun criarPedidoUseCase(
        pedidos: PedidoRepository,
        estoque: EstoqueClient,
        eventos: EventoPublisher,
    ): CriarPedidoUseCase = CriarPedidoService(pedidos, estoque, eventos)
}
```

`application/` não tem `@Service` em quem implementa o use case (mantém puro). O módulo `app/` cria o bean. Alternativa: anotar a impl com `@Service` direto, mas vira acoplamento a Spring no application — escolha de time.

## Teste de domínio (puro, rápido)

```kotlin
class PedidoTest : StringSpec({
    "não permite confirmar sem itens" {
        val p = Pedido.novo(ClienteId(UUID.randomUUID()))
        shouldThrow<IllegalArgumentException> { p.confirmar() }
    }

    "calcula total a partir dos itens" {
        val p = Pedido.novo(ClienteId(UUID.randomUUID()))
        p.adicionar(ItemPedido("SKU-1", 2, BigDecimal("50")))
        p.adicionar(ItemPedido("SKU-2", 1, BigDecimal("25")))
        p.total shouldBe BigDecimal("125")
    }
})
```

Roda em 20ms. Sem Spring. Sem JPA. Sem Testcontainers. Lindo.

## Teste de use case (com fakes)

```kotlin
class CriarPedidoServiceTest : StringSpec({
    val pedidos = InMemoryPedidoRepository()
    val estoque = FakeEstoqueClient()
    val eventos = InMemoryEventoPublisher()
    val service = CriarPedidoService(pedidos, estoque, eventos)

    "publica evento PedidoCriado ao criar" {
        service.executar(CriarPedidoCommand(...))
        eventos.publicados.shouldHaveSingleElement { it is PedidoCriado }
    }
})

class InMemoryPedidoRepository : PedidoRepository {
    private val store = mutableMapOf<PedidoId, Pedido>()
    override fun salvar(pedido: Pedido) { store[pedido.id] = pedido }
    override fun buscar(id: PedidoId): Pedido? = store[id]
}
```

Fakes manuais > mocks em service de use case. Lê como spec.

## Quando NÃO usar hexagonal

- **CRUD chato genuíno**: forms admin, gestão de cadastro. Pode ser controller → repo direto. Não cole hexagonal em todo lugar.
- **Spike / POC**: 2 dias de prova de conceito não precisam de 4 módulos.
- **Time pequeno + escopo conhecido**: monolito modular plano serve.

Hexagonal pesa em projetos com **lógica de domínio rica** (ERP, financeiro, marketplace, GovTech). Em projeto trivial, vira cerimônia.

## Anti-padrões frequentes

1. **`@Entity` na pasta `domain/`**: já perdeu o jogo.
2. **`@Service` no use case** (sem motivo): pequeno acoplamento aceitável; jogue fora regra se time decidir.
3. **DTO HTTP referenciado de `domain`**: nunca. Direção é HTTP → command (em application) → domain.
4. **`PedidoRepository` em `domain/`**: vai pra `application/` (port). Domínio não decide infra.
5. **Mapeamento manual gigante**: considere [MapStruct](https://mapstruct.org/) ou extension functions Kotlin em arquivo `Mappers.kt`.

## Critério de domínio

Você dominou este card quando consegue: estruturar projeto em 8 módulos Gradle com fronteiras claras; explicar por que `PedidoRepository` é interface em `application` e classe em `adapter-out-persistence`; testar domínio sem Spring; e identificar quando hexagonal é overkill.
