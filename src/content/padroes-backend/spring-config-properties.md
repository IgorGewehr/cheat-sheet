---
title: "Spring Config: @ConfigurationProperties Type-Safe"
category: padroes-backend
stack: [Spring Boot, Kotlin]
tags: [spring, config, properties, type-safe, validation]
excerpt: "Configuração em Spring Boot do jeito sênior: @ConfigurationProperties com Kotlin data class, validação no boot, ordem de precedência e secrets fora do repo."
related: [spring-boot-essentials, spring-logging-mdc, secrets-management]
updated: "2026-05-11"
---

## Por que não @Value

Você verá em código legado:

```kotlin
// ❌ não faça isso em projeto novo
@Value("\${pagamento.api.url}")
private lateinit var apiUrl: String

@Value("\${pagamento.api.timeout-ms:5000}")
private var timeoutMs: Int = 5000
```

Problemas: dispersos pela base, sem validação centralizada, sem tipo composto, falham em runtime quando faltar propriedade. Para projeto novo: **`@ConfigurationProperties`** sempre.

## @ConfigurationProperties em Kotlin

```kotlin
@ConfigurationProperties(prefix = "pagamento")
data class PagamentoProperties(
    val api: ApiProperties,
    val retry: RetryProperties = RetryProperties(),
    val features: Set<String> = emptySet(),
) {
    data class ApiProperties(
        val url: String,
        val timeoutMs: Int = 5000,
        val tokenHeader: String = "X-Auth-Token",
    )

    data class RetryProperties(
        val maxAttempts: Int = 3,
        val backoffMs: Long = 200,
        val maxDelayMs: Long = 5000,
    )
}
```

Ative com `@ConfigurationPropertiesScan` no `@SpringBootApplication`:

```kotlin
@SpringBootApplication
@ConfigurationPropertiesScan
class Application

fun main(args: Array<String>) {
    runApplication<Application>(*args)
}
```

E injete:

```kotlin
@Service
class PagamentoClient(private val props: PagamentoProperties) {
    fun comprar(p: Pedido) = httpClient
        .timeout(Duration.ofMillis(props.api.timeoutMs))
        .header(props.api.tokenHeader, token())
        .post(props.api.url, p)
}
```

application.yml:

```yaml
pagamento:
  api:
    url: https://api.pagamentos.com/v2
    timeout-ms: 8000
  retry:
    max-attempts: 5
    backoff-ms: 250
  features:
    - sandbox
    - tracing
```

Type-safe, validável, autocompleta no IntelliJ.

## Validação no boot

```kotlin
@ConfigurationProperties(prefix = "pagamento")
@Validated
data class PagamentoProperties(
    @field:NotBlank val tokenSecret: String,
    @field:Valid val api: ApiProperties,
) {
    data class ApiProperties(
        @field:Pattern(regexp = "https://.*")
        val url: String,

        @field:Min(100) @field:Max(60_000)
        val timeoutMs: Int,
    )
}
```

Se `pagamento.api.url` não começar com `https://`, a app **não sobe**. Falha rápida em ambiente errado.

## Ordem de Precedência (importante)

Spring Boot busca propriedades nesta ordem (mais alta vence):

1. Argumentos da linha de comando (`--server.port=9000`)
2. Variáveis de ambiente (`SERVER_PORT=9000`)
3. `application-{profile}.yml` (ativo)
4. `application.yml`
5. Properties default em classpath
6. Defaults da auto-config

**Use ENV em produção**. Kubernetes ConfigMap/Secret monta como variável. Não bote secrets em `application-prod.yml` no Git.

Variável de ambiente vira propriedade convertendo case:

```text
SERVER_PORT              → server.port
PAGAMENTO_API_URL        → pagamento.api.url
PAGAMENTO_API_TIMEOUT_MS → pagamento.api.timeout-ms
```

## application.yml por profile

```yaml
# application.yml — defaults
spring:
  application:
    name: billing-service

pagamento:
  retry:
    max-attempts: 3

---
spring:
  config:
    activate:
      on-profile: dev
pagamento:
  api:
    url: http://localhost:8081/mock

---
spring:
  config:
    activate:
      on-profile: prod
pagamento:
  api:
    url: ${PAGAMENTO_API_URL}
    timeout-ms: ${PAGAMENTO_TIMEOUT_MS:8000}
```

Placeholder `${VAR:default}` lê de ENV com fallback.

## Externalização: Vault / AWS Secrets Manager

Para secrets, integre Spring Cloud Config + Vault:

```yaml
spring:
  config:
    import: "vault://"
  cloud:
    vault:
      uri: https://vault.internal:8200
      authentication: KUBERNETES
      kv:
        backend: secret
        application-name: billing-service
```

Aí no `application.yml`:

```yaml
db:
  password: ${db-password}   # vem do Vault
```

Em AWS: Spring Cloud AWS Secrets Manager. Em GCP: Secret Manager. Princípio é o mesmo — o app nunca vê arquivo de secret no FS.

## Refresh em runtime

Você pode marcar propriedades como atualizáveis sem restart:

```kotlin
@ConfigurationProperties("pagamento")
@RefreshScope
data class PagamentoProperties(/* ... */)
```

Trigger via `POST /actuator/refresh`. Útil para feature flags, limiares de circuit breaker. Cuidado: o bean é recriado, então cuide de estado interno (pool de conexões não deveria estar aqui).

## Property metadata (autocompletar no IDE)

Anote para o IntelliJ entender as propriedades:

```kotlin
@ConfigurationProperties("pagamento")
data class PagamentoProperties(
    /**
     * URL base da API de pagamentos. Deve usar HTTPS.
     */
    val apiUrl: String,
)
```

O Spring Boot tem processor de anotação que gera `META-INF/spring-configuration-metadata.json`. Comentários KDoc viram tooltips em `application.yml`.

## Anti-padrões frequentes

1. **`@Value` em projeto novo**: prefira `@ConfigurationProperties`.
2. **`secret: hunter2` em YAML**: usa ENV ou Vault.
3. **Sem validação e descobrir em prod que `timeout-ms` é `null`**: anote `@Validated`.
4. **Profile chamado `dev` com `db: prod-db.host`**: profile é comportamento, não ambiente real.
5. **Properties espalhadas por toda a app**: agrupe por contexto (`pagamento`, `auth`, `db`).

## Critério de domínio

Você dominou este card quando consegue: criar `@ConfigurationProperties` com nested data class em Kotlin; validar config no boot; explicar a ordem de precedência (com 5 níveis); usar ENV pra secret e listar 3 motivos pra não usar `@Value` em projeto novo.
