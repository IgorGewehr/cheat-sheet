---
title: "Spring + Testcontainers: Postgres, Kafka, Redis Reais nos Testes"
category: testes
stack: [Spring Boot, Kotlin, Testcontainers, Docker]
tags: [testcontainers, integration-tests, docker, postgres, kafka, redis]
excerpt: "Testcontainers em Spring Boot 3: containers efêmeros para Postgres/Kafka/Redis, shared containers entre testes, @ServiceConnection (3.1+), seed e CI rápido."
related: [spring-data-jpa, kotlin-testing-junit-kotest-mockk, spring-kafka-rabbitmq]
updated: "2026-05-11"
---

## Por que Testcontainers

Mock de banco mente. H2 não é PostgreSQL — sintaxe diferente, comportamento de transação diferente, índices diferentes. Em produção, sua query usa `JSONB`; em teste com H2, não compila.

Testcontainers sobe **container Docker real do banco**, popula schema com Flyway, roda o teste, derruba container. Você testa contra exatamente o que vai pra prod.

## Setup

```kotlin
testImplementation("org.testcontainers:junit-jupiter:1.20.2")
testImplementation("org.testcontainers:postgresql:1.20.2")
testImplementation("org.testcontainers:kafka:1.20.2")
testImplementation("org.springframework.boot:spring-boot-testcontainers")
```

Requer Docker rodando localmente e no CI.

## Spring Boot 3.1+: @ServiceConnection

Antes era boilerplate. Agora:

```kotlin
@SpringBootTest
@Testcontainers
class PedidoIntegrationTest {

    companion object {
        @Container
        @ServiceConnection
        val postgres = PostgreSQLContainer("postgres:16-alpine")
            .withDatabaseName("billing")
            .withUsername("test")
            .withPassword("test")
    }

    @Autowired lateinit var repo: PedidoJpaRepository

    @Test
    fun `salva e recupera pedido com itens`() {
        val pedido = PedidoEntity(clienteId = "C-1", total = BigDecimal("100"))
        val salvo = repo.save(pedido)
        repo.findById(salvo.id!!).isPresent shouldBe true
    }
}
```

`@ServiceConnection` configura `spring.datasource.*` automaticamente. Flyway aplica migrations. Tudo funciona.

## Shared container: testes mais rápidos

Cada `@SpringBootTest` reinicia container = lento. Compartilhe:

```kotlin
// AbstractIntegrationTest.kt
@SpringBootTest
@Testcontainers
@Tag("integration")
abstract class AbstractIntegrationTest {

    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres = PostgreSQLContainer("postgres:16-alpine").apply {
            withReuse(true)
            start()
        }

        @Container
        @ServiceConnection
        @JvmStatic
        val redis = GenericContainer("redis:7-alpine")
            .withExposedPorts(6379)
            .withReuse(true)
            .apply { start() }
    }
}

// PedidoIntegrationTest.kt
class PedidoIntegrationTest : AbstractIntegrationTest() {
    @Autowired lateinit var repo: PedidoJpaRepository

    @Test fun `salva pedido`() = ...
}
```

`withReuse(true)` + `~/.testcontainers.properties`:

```properties
testcontainers.reuse.enable=true
```

Containers ficam vivos entre runs locais. Em CI desativa (cada build começa zerado).

## Kafka real

```kotlin
companion object {
    @Container
    @ServiceConnection
    val kafka = KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.7.1"))
}
```

E em consumer:

```kotlin
@Test
fun `consome PedidoCriado e publica NotificacaoEnviada`() {
    producer.send("pedido-criado", PedidoCriadoEvento("PED-1"))

    await().atMost(Duration.ofSeconds(10)).untilAsserted {
        val recebidas = repo.findAll()
        recebidas.size shouldBe 1
        recebidas[0].pedidoId shouldBe "PED-1"
    }
}
```

Usa [Awaitility](http://www.awaitility.org/) para polling assíncrono — não use `Thread.sleep`.

## Múltiplos containers + DynamicPropertySource (pré-3.1)

Se você usa Spring Boot < 3.1 ou container customizado:

```kotlin
@SpringBootTest
@Testcontainers
class MultiContainerTest {

    companion object {
        @Container
        val postgres = PostgreSQLContainer("postgres:16-alpine")

        @Container
        val rabbitmq = RabbitMQContainer("rabbitmq:3.13-management-alpine")

        @JvmStatic
        @DynamicPropertySource
        fun props(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
            registry.add("spring.rabbitmq.host", rabbitmq::getHost)
            registry.add("spring.rabbitmq.port", rabbitmq::getAmqpPort)
        }
    }
}
```

`@ServiceConnection` resolve isso para Postgres, Kafka, Redis, MongoDB, Cassandra. Para containers customizados, use `@DynamicPropertySource`.

## Seed do banco

Você raramente quer seed em migration. Use init script:

```kotlin
val postgres = PostgreSQLContainer("postgres:16-alpine")
    .withInitScript("test-data.sql")
```

Ou em `@BeforeEach`:

```kotlin
@BeforeEach
fun setUp() {
    repo.deleteAll()
    repo.saveAll(listOf(/* fixtures */))
}
```

⚠️ `@Transactional` em teste rolla as alterações no final, mas containers compartilhados acumulam dados de testes paralelos. Decida estratégia:

- `@Transactional` em todo teste → rollback automático (mas pode quebrar testes que precisam ver commit).
- `deleteAll()` em `@BeforeEach` → simples, lento.
- Truncate via SQL → rápido, agressivo.

## DevServices alternative

Spring Boot 3.1+ tem suporte alternativo via `@ServiceConnection` em **bean de teste**:

```kotlin
@TestConfiguration(proxyBeanMethods = false)
class TestcontainersConfig {
    @Bean
    @ServiceConnection
    fun postgres(): PostgreSQLContainer<*> =
        PostgreSQLContainer("postgres:16-alpine")
            .withReuse(true)
}

@SpringBootTest
@Import(TestcontainersConfig::class)
class PedidoTest { ... }
```

E ainda melhor: use no `bootRun` para dev local rápido:

```kotlin
// SpringBootApplicationTest.kt em src/test
fun main(args: Array<String>) {
    fromApplication<Application>()
        .with(TestcontainersConfig::class)
        .run(*args)
}
```

Roda app com Postgres/Kafka/Redis em containers. Zero docker-compose.

## Performance e CI

Otimizações:

1. **Imagens Alpine**: `postgres:16-alpine` em vez de `postgres:16` (200MB vs 600MB).
2. **`tmpfs` para dados**: `withTmpFs(mapOf("/var/lib/postgresql/data" to "rw"))` — banco em RAM, 5× mais rápido.
3. **Reuse local + isolado em CI**: `testcontainers.reuse.enable=true` em `.local`, off em CI.
4. **Ryuk container**: limpa órfãos. Em K8s CI desliga (`TESTCONTAINERS_RYUK_DISABLED=true`) com cleanup manual.
5. **Parallel test**: cuidado com schemas compartilhados; use schema diferente por teste ou container por teste.

## Anti-padrões

1. **H2 em vez de Testcontainers**: você está testando algo que não é seu banco.
2. **`@DirtiesContext` em todo teste**: reinicia ApplicationContext, build vira eterno.
3. **`Thread.sleep(2000)`**: use Awaitility com timeout.
4. **Container começar dentro do teste** (sem `@Container`): vazamento, dois containers no mesmo build.
5. **Dependências do teste no PATH global do dev**: docker daemon não rodando vira erro só no commit.

## Critério de domínio

Você dominou este card quando consegue: configurar `PostgreSQLContainer` com `@ServiceConnection`; compartilhar container entre testes com `@Tag` e classe base; testar publish/consume Kafka esperando assincronicamente; e configurar Testcontainers no `bootRun` para dev local.
