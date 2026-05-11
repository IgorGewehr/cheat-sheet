---
title: "Spring Logging: Logback Estruturado, MDC e Correlation"
category: infra
stack: [Spring Boot, Logback, Kotlin]
tags: [logging, logback, mdc, correlation-id, observability]
excerpt: "Logging em Spring Boot pronto para produção: Logback JSON, MDC com correlation ID, structured logging, level por package e por que `println` é cheiro de júnior."
related: [spring-config-properties, spring-observability-micrometer-otel, observability]
updated: "2026-05-11"
---

## Por que isso importa

Logs são sua maior ferramenta de diagnóstico em produção. Em um incidente de domingo de manhã, **a única coisa que te separa de descobrir o bug em 3 min vs 3 horas** é se seus logs:

- têm correlation ID que liga request ao log;
- são JSON estruturado que o seu agregador (Datadog, Splunk, Loki) parsea;
- têm campos importantes como atributos (não enterrados em mensagem livre);
- têm level apropriado (não tudo `INFO`).

## Setup: SLF4J + Logback

Spring Boot já vem com SLF4J + Logback. Não troque por Log4j2 sem motivo.

Em Kotlin, idiomático:

```kotlin
class PagamentoService(private val client: PagamentoClient) {
    private val log = LoggerFactory.getLogger(javaClass)

    fun processar(p: Pedido) {
        log.info("processando pedido id={} total={}", p.id, p.total)
    }
}
```

Use **placeholders `{}`**, não interpolação. Logback só formata se o level estiver ativo (lazy). `log.info("$p")` é cara mesmo em level OFF.

Para um logger top-level idiomático:

```kotlin
inline fun <reified T> logger(): Logger = LoggerFactory.getLogger(T::class.java)

class PagamentoService {
    private val log = logger<PagamentoService>()
}
```

## MDC: contexto por request

MDC (Mapped Diagnostic Context) é um Map<String, String> por thread/coroutine que o Logback inclui em cada mensagem.

```kotlin
MDC.put("requestId", UUID.randomUUID().toString())
MDC.put("userId", auth.userId)
try {
    log.info("inicia operação")
    // ... toda chamada herda esses campos
} finally {
    MDC.clear()
}
```

Filter para correlation ID:

```kotlin
@Component
class CorrelationIdFilter : OncePerRequestFilter() {
    private val HEADER = "X-Correlation-Id"

    override fun doFilterInternal(
        req: HttpServletRequest,
        resp: HttpServletResponse,
        chain: FilterChain,
    ) {
        val id = req.getHeader(HEADER) ?: UUID.randomUUID().toString()
        try {
            MDC.put("correlationId", id)
            resp.setHeader(HEADER, id)
            chain.doFilter(req, resp)
        } finally {
            MDC.clear()
        }
    }
}
```

Agora todo log dentro daquele request tem `correlationId` automático. O client pode passar o mesmo ID em chamadas internas (HTTP client interceptor) e você consegue rastrear request entre serviços.

⚠️ **MDC + Corrotinas**: cuidado. MDC vive em ThreadLocal e corrotinas trocam de thread. Use `MDCContext` do `kotlinx-coroutines-slf4j`:

```kotlin
withContext(MDCContext()) {
    log.info("dentro da coroutine, MDC herdado")
}
```

## Logback structured (JSON)

`logback-spring.xml`:

```xml
<configuration>
    <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <includeMdcKeyName>correlationId</includeMdcKeyName>
            <includeMdcKeyName>userId</includeMdcKeyName>
            <customFields>{"service":"billing-service","env":"${SPRING_PROFILES_ACTIVE:-dev}"}</customFields>
        </encoder>
    </appender>

    <springProfile name="dev">
        <appender name="PRETTY" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%cyan(%d{HH:mm:ss.SSS}) %highlight(%-5level) [%X{correlationId:-}] %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="DEBUG">
            <appender-ref ref="PRETTY"/>
        </root>
    </springProfile>

    <springProfile name="prod">
        <root level="INFO">
            <appender-ref ref="JSON"/>
        </root>
    </springProfile>
</configuration>
```

Dependência:

```kotlin
implementation("net.logstash.logback:logstash-logback-encoder:8.0")
```

Em prod sai JSON:

```json
{
  "@timestamp": "2026-05-11T14:23:01.123Z",
  "level": "INFO",
  "thread": "http-nio-8080-exec-3",
  "logger": "PagamentoService",
  "message": "processando pedido id=PED-123 total=99.90",
  "correlationId": "a1b2c3d4-...",
  "userId": "USR-456",
  "service": "billing-service",
  "env": "prod"
}
```

Datadog/Loki/Splunk consomem isso diretamente, sem regex.

## Level por package

```yaml
# application.yml
logging:
  level:
    root: INFO
    com.igor.billing: INFO
    com.igor.billing.infra.http: DEBUG    # debug em adapter HTTP
    org.hibernate.SQL: WARN                # silencia SQL spam
    org.springframework.web: INFO
```

Em dev você pode ligar `org.hibernate.SQL: DEBUG` + `org.hibernate.orm.jdbc.bind: TRACE` para ver SQL e parâmetros.

## O que logar

**Sempre logue**:
- entrada e saída de fronteiras importantes (HTTP request final, evento processado, batch finalizado);
- decisões de negócio importantes (pedido rejeitado, fraude detectada);
- chamadas a sistemas externos (request, response status, duration);
- transições de estado importantes (workflow avançou de A pra B).

**Nunca logue**:
- senhas, tokens, CPF/CNPJ completo, dados de cartão (PCI-DSS), dados sensíveis LGPD;
- payload completo de request (use sample/elision);
- payload completo de response (idem);
- toda iteração de loop em hot path.

```kotlin
// ❌ ruim
log.info("usuario logado: senha=$senha email=$email")

// ✓ bom
log.info("usuario logado userId={} emailMasked={}", user.id, mask(user.email))
```

## Níveis (e quando usar)

| Level | Quando |
|---|---|
| `TRACE` | nunca em prod; trace de fluxo |
| `DEBUG` | dev local, troubleshooting via flag |
| `INFO` | eventos significativos de negócio |
| `WARN` | algo está estranho mas não quebrou |
| `ERROR` | algo quebrou, alguém precisa olhar |

**Não logue tudo como ERROR**. WARN é seu amigo: alerta sem acordar oncall.

## Sampling em alta volumetria

Para serviço com 50k req/s, logar toda request é caro. Logback tem `TurboFilter`:

```xml
<turboFilter class="ch.qos.logback.classic.turbo.ReconfigureOnChangeFilter"/>
```

Ou estratégia em código: log a cada N requests, ou só erros.

## Anti-padrões frequentes

1. **`println("debug: $x")`**: nunca chega no agregador, suja stdout.
2. **`e.printStackTrace()`**: idem.
3. **Mensagens livres sem campos estruturados**: `"pedido criado!"` é inútil. `"pedido criado pedidoId={} total={}"`.
4. **Logar exception sem `,e` no final**: você perde stack trace.
5. **Concatenação manual: `log.info("x: " + foo)`**: sem benefício de lazy.

```kotlin
// ❌
log.error("falha: " + e.message)

// ✓
log.error("falha no processamento pedidoId={}", pedidoId, e)
```

## Critério de domínio

Você dominou este card quando consegue: configurar Logback JSON para prod e legível para dev via `springProfile`; implementar MDC com correlation ID via filter; explicar diferença entre TRACE/DEBUG/INFO/WARN/ERROR; listar 5 coisas que NUNCA devem aparecer em log; e fazer MDC funcionar com corrotinas Kotlin.
