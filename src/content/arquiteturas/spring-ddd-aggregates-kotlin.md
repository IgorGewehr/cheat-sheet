---
title: "DDD Pragmático em Kotlin: Aggregates, Sealed, Domain Events"
category: arquiteturas
stack: [Spring Boot, Kotlin, DDD]
tags: [ddd, aggregate, sealed-class, domain-event, invariant, ubiquitous-language]
excerpt: "DDD aplicado em Kotlin sem dogma: aggregates como sealed classes, invariantes em factory, domain events sem framework, bounded contexts e a régua para decidir quando parar."
related: [spring-hexagonal-kotlin, ddd-light-erp, spring-outbox-pattern]
updated: "2026-05-11"
---

## A pergunta antes do DDD

DDD vale o investimento quando você tem **complexidade de domínio real**: regras de negócio intrincadas, vocabulário próprio, mudanças frequentes em regras. Em CRUD simples, DDD vira cerimônia. Não cole DDD em tudo.

Sintomas de domínio que merece DDD:
- jurídico, fiscal, financeiro, ERP, marketplace, healthcare;
- workflow com estados e transições restritas;
- regras que mudam por cliente / por país / por época;
- glossário que time de negócio e dev disputam.

## Ubiquitous Language

Mesmo vocabulário no código, no banco, na conversa, no doc. Não tenha `Order` no Java, `pedido` no BD, "venda" no Slack. Escolha um — **em PT-BR se o negócio fala PT-BR**.

```kotlin
// ❌ tradução cosmética desconecta do negócio
class Order(val customer: Customer, val items: List<Item>)

// ✓ alinhado com o glossário
class Pedido(val cliente: Cliente, val itens: List<ItemPedido>)
```

## Value Objects

Objetos identificados pelo valor, não por ID. Imutáveis.

```kotlin
@JvmInline
value class CNPJ(val valor: String) {
    init {
        require(valor.length == 14) { "CNPJ deve ter 14 dígitos" }
        require(CNPJValidator.valido(valor)) { "CNPJ inválido: $valor" }
    }
}

@JvmInline
value class Dinheiro(val valor: BigDecimal) {
    init { require(valor.scale() <= 2) { "máximo 2 casas decimais" } }
    operator fun plus(outro: Dinheiro) = Dinheiro(valor + outro.valor)
    operator fun times(qtd: Int) = Dinheiro(valor.multiply(BigDecimal(qtd)))
    fun isMaiorQue(outro: Dinheiro) = valor > outro.valor
}

data class Endereco(
    val logradouro: String,
    val numero: String,
    val cep: String,
    val cidade: String,
    val uf: String,
) {
    init {
        require(cep.matches(Regex("\\d{8}"))) { "CEP deve ter 8 dígitos" }
        require(uf.length == 2) { "UF inválida" }
    }
}
```

`@JvmInline value class` em Kotlin: zero overhead em runtime (compilador unboxa para o tipo interno). `CNPJ("123456789012345")` é literalmente `String` em bytecode, mas no código tem tipo distinto. Você nunca passa CNPJ onde se espera CPF.

## Entidade

Identificada por ID, mutável internamente, com comportamento.

```kotlin
@JvmInline value class PedidoId(val valor: UUID)

class Pedido private constructor(
    val id: PedidoId,
    val cliente: ClienteId,
    private val _itens: MutableList<ItemPedido>,
    private var _status: Status,
    private val _eventos: MutableList<EventoDominio> = mutableListOf(),
) {
    val itens: List<ItemPedido> get() = _itens.toList()
    val status: Status get() = _status
    val eventos: List<EventoDominio> get() = _eventos.toList()
    val total: Dinheiro get() = _itens.fold(Dinheiro.zero) { acc, i -> acc + i.subtotal }

    fun adicionar(item: ItemPedido) {
        require(_status == Status.PENDENTE) { "pedido $_status não aceita itens" }
        require(_itens.size < MAX_ITENS) { "máximo $MAX_ITENS itens" }
        _itens.add(item)
    }

    fun confirmar() {
        require(_status == Status.PENDENTE) { "só PENDENTE pode confirmar" }
        require(_itens.isNotEmpty()) { "pedido sem itens" }
        require(total.isMaiorQue(Dinheiro.zero)) { "total deve ser > 0" }
        _status = Status.CONFIRMADO
        _eventos += PedidoConfirmado(id, total)
    }

    fun cancelar(motivo: String) {
        require(_status in setOf(Status.PENDENTE, Status.CONFIRMADO)) {
            "$_status não pode ser cancelado"
        }
        _status = Status.CANCELADO
        _eventos += PedidoCancelado(id, motivo)
    }

    companion object {
        private const val MAX_ITENS = 50
        fun novo(cliente: ClienteId): Pedido =
            Pedido(PedidoId(UUID.randomUUID()), cliente, mutableListOf(), Status.PENDENTE)

        fun reconstituir(id: PedidoId, cliente: ClienteId, status: Status, itens: List<ItemPedido>): Pedido =
            Pedido(id, cliente, itens.toMutableList(), status)
    }
}
```

Pontos sênior:
- **construtor privado + factory**: você não cria `Pedido` em estado inconsistente.
- **`reconstituir` separada de `novo`**: criar (gera UUID, status inicial) é diferente de hidratar do banco (recebe estado).
- **Invariantes em `require`**: regras explícitas dentro do método de mudança.
- **`_eventos` interno**: domain events acumulam dentro da entidade, dispatched depois pelo application service.

## Aggregate

Aggregate = **cluster de entidades que muda atomicamente**. Tem uma **raiz** (entry point externa) e **invariantes internas**. Modificação externa só passa pela raiz.

`Pedido` é aggregate root. `ItemPedido` faz parte do aggregate (não tem repositório próprio, sempre acessado por `Pedido`).

Regras:
1. **Referência entre aggregates é por ID**, não por objeto. `Pedido` tem `clienteId: ClienteId`, não `cliente: Cliente`.
2. **Transação por aggregate**: uma TX afeta um aggregate. Mudanças cruzadas viram **eventos** + eventual consistency.
3. **Pequeno é bonito**: aggregate grande = locks longos, conflito otimista frequente. Quebre por critério de transação.

## Sealed para máquina de estados

```kotlin
sealed interface StatusPagamento {
    data object Pendente : StatusPagamento
    data class Aprovado(val transacaoId: String, val aprovadoEm: Instant) : StatusPagamento
    data class Recusado(val motivo: MotivoRecusa) : StatusPagamento
    data class Estornado(val estornoId: String, val estornadoEm: Instant) : StatusPagamento

    val terminal: Boolean
        get() = this is Recusado || this is Estornado
}

class Pagamento(
    val id: PagamentoId,
    private var _status: StatusPagamento = StatusPagamento.Pendente,
) {
    val status: StatusPagamento get() = _status

    fun aprovar(transacaoId: String) {
        check(_status is StatusPagamento.Pendente) { "só PENDENTE pode ser aprovado" }
        _status = StatusPagamento.Aprovado(transacaoId, Instant.now())
    }

    fun estornar(estornoId: String) = when (val s = _status) {
        is StatusPagamento.Aprovado -> {
            _status = StatusPagamento.Estornado(estornoId, Instant.now())
        }
        else -> error("não pode estornar de $s")
    }
}
```

`when` exaustivo sobre sealed = compilador valida todos os ramos. Adicionou novo status? Quebra build.

## Domain Events

```kotlin
sealed interface EventoDominio {
    val ocorridoEm: Instant
}

data class PedidoCriado(
    val id: PedidoId,
    val cliente: ClienteId,
    override val ocorridoEm: Instant = Instant.now(),
) : EventoDominio

data class PedidoConfirmado(
    val id: PedidoId,
    val total: Dinheiro,
    override val ocorridoEm: Instant = Instant.now(),
) : EventoDominio
```

Eventos acumulam dentro da entidade (lista `_eventos`). Application service publica após persistir:

```kotlin
class ConfirmarPedidoService(
    private val repo: PedidoRepository,
    private val publisher: DomainEventPublisher,
) : ConfirmarPedidoUseCase {

    @Transactional
    override fun executar(id: PedidoId) {
        val pedido = repo.buscar(id) ?: throw PedidoNaoEncontrado(id)
        pedido.confirmar()
        repo.salvar(pedido)
        pedido.eventos.forEach { publisher.publicar(it) }   // dentro da TX (outbox!)
    }
}
```

Em produção, **publish via outbox pattern** dentro da TX para garantir at-least-once (ver card sobre outbox). Não publish direto no broker dentro da TX — se TX falhar, evento foi e dado não.

## Domain Service

Quando a lógica não pertence a nenhum aggregate (envolve vários), use Domain Service:

```kotlin
class CalculadoraDescontoFidelidade(
    private val historico: HistoricoCompras,
) {
    fun calcular(cliente: Cliente, pedido: Pedido): PercentualDesconto {
        val anos = historico.anosComoCliente(cliente.id)
        val ticketMedio = historico.ticketMedio(cliente.id)
        return when {
            anos >= 10 && ticketMedio.isMaiorQue(Dinheiro(BigDecimal("500"))) -> PercentualDesconto(15)
            anos >= 5 -> PercentualDesconto(10)
            anos >= 2 -> PercentualDesconto(5)
            else -> PercentualDesconto.zero
        }
    }
}
```

Domain Service vive em `domain/`. Recebe interfaces (`HistoricoCompras` é port). Implementação injeta dependências reais em `application/`.

## Bounded Context

Cada **contexto delimitado** tem seu próprio modelo. `Cliente` no contexto Vendas pode ser **diferente** de `Cliente` no contexto Cobrança — mesmo nome, atributos e regras diferentes.

```text
billing-service/        ← contexto Faturamento
    domain/Cliente      ← tem dadosFiscais, limites de crédito
    
sales-service/          ← contexto Vendas
    domain/Cliente      ← tem preferências, histórico, segmento
```

Comunicação entre contextos via **eventos** (assíncrono, preferível) ou **HTTP/gRPC** (síncrono, mais acoplado).

## Quando parar

Não invente DDD em:
- CRUD: cadastro de cidades, lista de paises, dropdown values;
- batches: pipeline de ETL, conversão de arquivo;
- proxies / gateways: serviço que só repassa;
- componente puramente técnico: cache layer, auth middleware.

DDD vale **na regra de negócio rica**. O resto é boilerplate honesto.

## Anti-padrões frequentes

1. **Anemia**: entidade só com getter/setter, lógica em "service" externo. Devolveu pra modelo de domínio anêmico.
2. **`@Entity` JPA na entidade de domínio**: já vimos. Separe.
3. **Aggregate gigante** (`Pedido` carrega `Cliente`, `Vendedor`, `Estoque`, ...): locks longos, performance ruim.
4. **Eventos vazando contrato de domínio para HTTP API externa**: evento de domínio é interno; cliente externo recebe DTO diferente.
5. **Mapping caótico**: tenha convenção (extension functions em arquivo `Mappers.kt`, ou MapStruct).

## Critério de domínio

Você dominou este card quando consegue: modelar aggregate com invariantes e factory; usar `@JvmInline value class` para VOs; expressar máquina de estados via sealed class; descrever 3 motivos pra eventos serem despachados via outbox, não direto; e dizer 3 situações onde DDD é overkill.
