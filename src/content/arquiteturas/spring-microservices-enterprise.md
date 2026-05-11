---
title: "Spring Microsserviços Enterprise: Bounded Context, Deploy Independente"
category: arquiteturas
stack: [Spring Boot, Kotlin]
tags: [microservices, bounded-context, modular-monolith, spring-cloud, deploy]
excerpt: "Microsserviços em Spring sem cargo cult: começar com monolito modular, fronteira por bounded context, dados por serviço, contratos versionados e quando dividir de verdade."
related: [spring-hexagonal-kotlin, microservices-quando-usar, modular-monolith]
updated: "2026-05-11"
---

## A pergunta antes da arquitetura

Antes de "qual stack de microsserviços?", responda: **você precisa de microsserviços?**

Sintomas que justificam microsserviços:
- equipes (3+) competindo por mesmo repo, releases bloqueadas;
- partes do sistema com perfis de escala diferente (algumas 10 req/s, outras 10k req/s);
- bounded contexts com modelos de domínio incompatíveis;
- ciclo de release independente desejado;
- stack heterogêneo justificado (parte em Kotlin, parte em Python para ML).

Sem isso, **monolito modular vence**: mesma fronteira lógica, deploy único, latência local, transação única.

## Monolito modular como ponto de partida

```text
billing-monolith/
├── app/                        # main
├── domain-pedidos/             # módulo Gradle
├── domain-pagamentos/
├── domain-estoque/
├── domain-cliente/
├── adapter-in-http/
├── adapter-out-persistence/
└── ...
```

Cada `domain-*` é um Bounded Context. Dependências entre eles: **só por interface pública** (eventos de domínio, façades). Não pode `pagamentos` importar entidade de `pedidos` diretamente.

Quando uma dor real aparece (escala, time, ciclo de release), você **extrai um módulo para serviço separado** — o trabalho é pequeno porque a fronteira já existe.

## Anatomia de um microsserviço

```text
billing-service/
├── app/                    # main (Spring Boot)
├── domain/                 # núcleo do contexto
├── application/            # use cases + ports
├── adapter-in-http/        # REST API externa
├── adapter-in-grpc/        # gRPC interna
├── adapter-in-messaging/   # consumers Kafka
├── adapter-out-persistence/ # JPA → próprio Postgres
├── adapter-out-messaging/  # producers Kafka
├── adapter-out-external/   # clients de outros serviços
├── deploy/
│   ├── Dockerfile
│   ├── k8s/                # manifests
│   └── helm/               # chart
└── api/openapi.yaml
```

## Dados por serviço: a regra de ouro

Cada serviço tem seu **próprio banco**. Sem exceção. Compartilhar tabela = você acabou de criar um monolito com pretensão de microsserviço.

```text
billing-service     → billing_db (Postgres)
sales-service       → sales_db (Postgres)
catalog-service     → catalog_db (MongoDB)
notifications       → notifications_db (Postgres) + Redis
```

Acesso entre serviços: **API pública** (REST/gRPC) ou **eventos** (Kafka). Não acesse o DB do colega.

## Comunicação síncrona vs assíncrona

**Síncrono (REST/gRPC)**:
- caller espera resposta;
- acoplamento temporal (B precisa estar UP);
- usado em queries, comandos críticos com confirmação imediata;
- exige circuit breaker, retry, timeout.

**Assíncrono (eventos)**:
- caller publica e segue;
- acoplamento desacoplado em tempo;
- usado em notificações, integração eventual, fan-out;
- exige idempotência, outbox, DLQ.

**Padrão sênior**: comandos = síncrono quando possível, eventos = side effects + fan-out. Não confunda RPC com evento; "OrderService.publish(OrderCreated)" não é o mesmo que "post(/orders)".

## Service Discovery

Em K8s, **DNS interno** resolve. `billing-service.namespace.svc.cluster.local` é endereço. Não use Eureka/Consul a menos que esteja fora de K8s.

```kotlin
@Bean
fun pagamentoApi(): PagamentoApi {
    val client = WebClient.builder()
        .baseUrl("http://pagamento-service:8080")  // K8s service
        .build()
    return HttpServiceProxyFactory.builderFor(WebClientAdapter.create(client))
        .build()
        .createClient(PagamentoApi::class.java)
}
```

## Contratos: a parte que mais quebra

Como serviços evoluem independentemente, contrato muda. Cuidados:

- **versionamento na URL** (`/v1/`, `/v2/`) para mudança breaking.
- **proto/openapi versionado** em monorepo `contracts/` ou repo dedicado.
- **consumer-driven contract tests** (Pact, Spring Cloud Contract): consumidor declara o que espera; provider testa.
- **backward compat por 2 versões**: adicione campo opcional; deprecate antes de remover.

```kotlin
// Spring Cloud Contract — provedor
@AutoConfigureStubRunner
@SpringBootTest
class PagamentoControllerTest {
    // verifica que API respeita contrato declarado em pagamento.yml
}
```

## Spring Cloud (use com parcimônia)

Spring Cloud foi importante quando Spring Boot precisava de service discovery, config server, gateway. Em 2026, **K8s nativo faz a maioria das coisas**:

| Spring Cloud | Substituto K8s |
|---|---|
| Eureka | K8s Service + DNS |
| Config Server | ConfigMap / Vault / external-secrets |
| Hystrix (descontinuado) | Resilience4j |
| Zuul / Spring Cloud Gateway | Ingress (Nginx, Traefik) ou Istio |
| Sleuth | Micrometer Tracing (Spring 3 nativo) |
| Spring Cloud Stream | Spring Kafka direto |

**Use Spring Cloud só onde agrega**:
- `spring-cloud-starter-config` se tem múltiplos serviços que compartilham config;
- `spring-cloud-gateway` se você quer API Gateway em Spring (vs externo);
- `spring-cloud-openfeign` se prefere declarative client.

Não puxe Spring Cloud "porque é arquitetura de microsserviço". É infra.

## Anti-Corruption Layer (ACL)

Quando consome serviço externo com modelo diferente do seu domínio, traduza explicitamente:

```kotlin
// adapter-out-external/SefazCliente.kt
class SefazCliente(private val rawClient: SefazRawApi) {
    fun consultarNF(chave: String): NotaFiscal {
        val xml = rawClient.consulta(chave)
        return SefazTradutor.deXmlParaDomain(xml)
    }
}
```

ACL evita que o "vocabulário esquisito da SEFAZ" suje seu domínio. O domínio recebe `NotaFiscal` limpa; o tradutor cuida das esquisitices do XML.

## Saga: transação distribuída sem 2PC

Operação cruza serviços (criar pedido → reservar estoque → cobrar pagamento). Não há transação ACID atravessando.

**Saga orquestrada**:

```kotlin
class CriarPedidoSagaOrchestrator(
    private val pedidos: PedidoClient,
    private val estoque: EstoqueClient,
    private val pagamento: PagamentoClient,
) {
    suspend fun executar(cmd: CriarPedidoCommand): Resultado {
        val pedido = pedidos.criar(cmd)

        val reserva = try {
            estoque.reservar(pedido.itens)
        } catch (e: Exception) {
            pedidos.cancelar(pedido.id)
            return Resultado.FalhaEstoque
        }

        val cobranca = try {
            pagamento.cobrar(pedido.total)
        } catch (e: Exception) {
            estoque.liberar(reserva)
            pedidos.cancelar(pedido.id)
            return Resultado.FalhaPagamento
        }

        pedidos.confirmar(pedido.id, cobranca.id)
        return Resultado.Sucesso(pedido.id)
    }
}
```

**Saga coreografada**: cada serviço escuta eventos e age (não há orquestrador central). Mais resiliente, mais difícil de seguir o fluxo.

Padrão sênior: **orquestrada** para fluxos críticos de negócio (mais rastreável), **coreografada** para fan-out de notificações.

## Service Mesh (Istio / Linkerd)

Tem 30+ serviços, mTLS interno, observability automática, traffic shaping? Vale Istio. Tem 5 serviços? Não vale a complexidade.

## API Gateway

Cliente externo bate em **um endpoint** e o Gateway roteia. Responsabilidades:

- terminação TLS;
- autenticação básica (token JWT validado);
- rate limit por cliente;
- request/response transformation;
- agregação ocasional (BFF — backend for frontend).

Não bote lógica de negócio no Gateway. Ele é router + transformador.

## Quando dividir: o teste real

Você divide microsserviço quando:

- **time diferente** vai mantê-lo;
- **escala diferente** justifica recursos diferentes;
- **release independente** é necessária;
- **bounded context** é claramente distinto.

Não divida porque "é arquitetura moderna". Microsserviços têm **custo operacional alto**: 10× mais infra, observability mais complexa, debug distribuído, consistência eventual.

## Anti-padrões frequentes

1. **Mesmo banco para múltiplos serviços**: não é microsserviço, é monolito disfarçado.
2. **Tantos serviços que CRUD vira chamada de 5 hops**: latência insuportável.
3. **Spring Cloud porque sim**: complexidade desnecessária em projeto K8s nativo.
4. **Eventos como RPC** (publish e espera resposta): use RPC direto.
5. **2PC ou XA Transactions**: lentíssimo, frágil. Use Saga.

## Critério de domínio

Você dominou este card quando consegue: explicar quando monolito modular vence microsserviços; descrever 3 motivos pra cada serviço ter seu DB; mostrar uma Saga orquestrada com compensação; listar 4 funções do API Gateway; e dizer 3 substitutos K8s para componentes Spring Cloud.
