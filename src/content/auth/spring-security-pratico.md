---
title: "Spring Security: OWASP, Injection, Supply Chain, Headers"
category: auth
stack: [Spring Boot, Kotlin, Spring Security]
tags: [security, owasp, sql-injection, ssrf, csrf, headers, supply-chain]
excerpt: "Segurança prática em Spring Boot enterprise: OWASP Top 10 com exemplos em Kotlin, headers que protegem (HSTS, CSP, X-Frame), proteção contra SSRF, supply chain (OWASP DC) e o checklist real de produção."
related: [owasp-top10, spring-security-oauth2-jwt, secrets-management]
updated: "2026-05-11"
---

## OWASP Top 10 em Spring

### A01: Broken Access Control

Falha mais comum: autorização inconsistente entre endpoints.

```kotlin
// ❌ qualquer um pode buscar qualquer pedido
@GetMapping("/pedidos/{id}")
fun buscar(@PathVariable id: UUID): Pedido = repo.findById(id)

// ✓ checa propriedade
@GetMapping("/pedidos/{id}")
@PreAuthorize("@pedidoSecurity.podeVer(#id, authentication.name)")
fun buscar(@PathVariable id: UUID): Pedido = repo.findById(id)

@Component
class PedidoSecurity(private val repo: PedidoRepository) {
    fun podeVer(id: UUID, userId: String): Boolean =
        repo.findById(id)?.clienteId?.toString() == userId
}
```

Use `@PreAuthorize` em **métodos sensíveis**. Não confie só em filtro de path.

### A02: Cryptographic Failures

```kotlin
// ❌ MD5/SHA1 para senha
val hash = MessageDigest.getInstance("MD5").digest(password.toByteArray())

// ✓ bcrypt/argon2
val encoder = BCryptPasswordEncoder(strength = 12)
val hash = encoder.encode(password)
encoder.matches(input, hash)
```

`BCryptPasswordEncoder` é nativo Spring Security. Strength **12+** em 2026.

Para dados em repouso:
- chaves em AWS KMS / GCP KMS / Vault Transit.
- nunca hard-code em `application.yml`.
- TLS 1.2+ em tudo (TLS 1.0/1.1 são banidos).

### A03: Injection (SQL, JPQL, Command)

**SQL Injection** clássica:

```kotlin
// ❌ concatenação
@Query("SELECT p FROM Pedido p WHERE p.status = '" + status + "'")
fun buscarPorStatus(status: String): List<Pedido>

// ✓ parametrizado
@Query("SELECT p FROM Pedido p WHERE p.status = :status")
fun buscarPorStatus(@Param("status") status: String): List<Pedido>
```

JPA + JPQL parametrizado é seguro. **Cuidado com `nativeQuery = true`** + concatenação:

```kotlin
// ❌ nativa concatenada
@Query(value = "SELECT * FROM pedidos WHERE status = '${status}'", nativeQuery = true)
```

Idem `EntityManager.createNativeQuery(sql)` com `+ input`.

**Command injection**:

```kotlin
// ❌ shell
Runtime.getRuntime().exec("pdf-convert ${userFilename}")

// ✓ array, sem shell
ProcessBuilder("pdf-convert", userFilename).start()
```

### A04: Insecure Design

Não há fix técnico — desenho ruim. Threat modeling (STRIDE) e revisão de arquitetura.

### A05: Security Misconfiguration

**Defaults perigosos**:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: "*"   # ❌ expõe /heapdump, /env, /threaddump
```

Restrinja:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  server:
    port: 8081   # actuator em porta separada, não exposta
```

**Stack trace em response**: nunca.

```kotlin
@ExceptionHandler(Exception::class)
fun erro(ex: Exception): ProblemDetail {
    log.error("erro interno", ex)
    return ProblemDetail.forStatusAndDetail(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Erro processando requisição"   // não vaze ex.message
    )
}
```

### A06: Vulnerable and Outdated Components

**Supply chain**:

```kotlin
plugins {
    id("org.owasp.dependencycheck") version "10.0.4"
}

dependencyCheck {
    failBuildOnCVSS = 7.0f
    suppressionFiles = listOf("dependency-check-suppressions.xml")
}

tasks.check { dependsOn("dependencyCheckAnalyze") }
```

Pipeline CI roda `./gradlew dependencyCheckAnalyze`. Build falha se vulnerabilidade CVSS >= 7. Combine com:

- **Renovate / Dependabot**: PR automático pra atualizar dep com vuln;
- **Snyk / GitHub Advanced Security**: alerta proativo;
- **OSV-Scanner**: deps + container.

### A07: Authentication Failures

- Bcrypt strength 12+.
- Senha mínima 12 chars (NIST 2017+).
- MFA obrigatória para admin.
- Sessão com timeout (30min de inatividade).
- JWT com expiração curta + refresh token rotativo.

### A08: Software / Data Integrity

Cuidado com **deserialização não confiável**:

```kotlin
// ❌ Jackson default com type info
val mapper = ObjectMapper()
mapper.enableDefaultTyping()   // PERIGOSO

// ✓ deserialize tipo concreto
val pedido = mapper.readValue(json, Pedido::class.java)
```

Java legacy: `ObjectInputStream.readObject()` com dados externos = remote code execution. Não use.

### A09: Security Logging and Monitoring

- log de **tentativa de login** (sucesso e falha);
- log de **mudança de privilégio**;
- log de **acesso a dado sensível**;
- ALERT em padrões anômalos (login de IP novo, 100 falhas em 1 min).

Não logue:
- senha;
- token;
- CPF / cartão (mascare);
- payload com dado pessoal completo.

### A10: SSRF (Server-Side Request Forgery)

```kotlin
// ❌ usuário fornece URL
fun importarDeUrl(url: String) {
    val data = restClient.get().uri(url).retrieve().body<String>()
    // ...
}
```

Atacante envia `http://169.254.169.254/latest/meta-data/iam/security-credentials/` (AWS metadata).

```kotlin
// ✓ allowlist + validar host
val hostsPermitidos = setOf("storage.example.com", "cdn.example.com")

fun importarDeUrl(url: String) {
    val parsed = URI(url)
    require(parsed.scheme == "https") { "só HTTPS" }
    require(parsed.host in hostsPermitidos) { "host não permitido" }
    require(parsed.host !in BLOCKLIST_INTERNAL) { "host interno" }
    // bloqueia: 127.0.0.1, 169.254.*, 10.*, 172.16-31.*, 192.168.*

    val data = restClient.get().uri(url).retrieve().body<String>()
}
```

## Headers de segurança

Spring Security 6 inclui defaults úteis. Configure CSP e HSTS:

```kotlin
@Configuration
class SecurityConfig {
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            .headers { headers ->
                headers
                    .httpStrictTransportSecurity { it.maxAgeInSeconds(31536000).includeSubDomains(true) }
                    .contentSecurityPolicy { it.policyDirectives("default-src 'self'; script-src 'self'") }
                    .frameOptions { it.deny() }                              // X-Frame-Options
                    .contentTypeOptions { }                                  // X-Content-Type-Options: nosniff
                    .referrerPolicy { it.policy(ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN) }
                    .permissionsPolicy { it.policy("geolocation=(), microphone=()") }
            }
            // ...
            .build()
    }
}
```

| Header | Por que |
|---|---|
| `Strict-Transport-Security` | força HTTPS |
| `Content-Security-Policy` | mitiga XSS |
| `X-Frame-Options: DENY` | mitiga clickjacking |
| `X-Content-Type-Options: nosniff` | mitiga MIME sniffing |
| `Referrer-Policy` | controla `Referer` enviado |
| `Permissions-Policy` | restringe APIs (geo, camera) |

## CSRF

Para API REST com JWT (stateless), **desabilite CSRF**:

```kotlin
http.csrf { it.disable() }
```

CSRF protege contra ataques de form/cookie em sessão. Token Bearer não está vulnerável a CSRF clássico.

Para app server-side com sessão cookie: **mantenha CSRF ativo** (default Spring).

## Secrets

Nunca:

```yaml
db:
  password: hunter2   # ❌ em git
```

Sempre:

```yaml
db:
  password: ${DB_PASSWORD}   # ✓ ENV
```

Ou Vault/Secrets Manager (`spring-cloud-vault`, `spring-cloud-aws-secrets-manager`).

**Rotacione regularmente** (90 dias para credenciais críticas).

## Scanning

| Ferramenta | Para |
|---|---|
| OWASP Dependency Check | deps Java/Maven/Gradle |
| Snyk / GitHub Advanced Security | deps + SAST |
| Trivy | imagens Docker |
| SonarQube / SonarCloud | code smells + SAST |
| Semgrep | regras customizadas SAST |
| ZAP (OWASP) | DAST contra app rodando |

Não use só uma — combine SAST (estático), DAST (dinâmico) e SCA (deps).

## Anti-padrões

1. **"Aplicação interna, não precisa de segurança"**: a maioria dos breaches vem de dentro.
2. **`@PreAuthorize` confiando em campo arbitrário**: valide propriedade no service.
3. **Stack trace na response**: mapa do código pro atacante.
4. **Dependência atualizada uma vez por ano**: CVE conhecida ficou 11 meses exposta.
5. **JWT secret hardcoded**: use chave RSA/EC + rotação.

## Critério de domínio

Você dominou este card quando consegue: configurar `@PreAuthorize` com bean de segurança; bloquear SSRF com allowlist; configurar OWASP Dependency Check no Gradle; explicar quando desabilitar CSRF é correto; e listar 5 headers de segurança que toda app deve enviar.
