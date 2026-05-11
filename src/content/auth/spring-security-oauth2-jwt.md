---
title: "Spring Security 6 + OAuth2: JWT, OIDC, RBAC, Refresh Rotation"
category: auth
stack: [Spring Boot, Kotlin, Spring Security, OAuth2, JWT]
tags: [spring-security, oauth2, oidc, jwt, rbac, refresh-token]
excerpt: "Spring Security 6 com OAuth2 Resource Server: JWT/PASETO sem armadilha (alg confusion), OAuth2 Login com PKCE, OIDC com Keycloak, RBAC vs ABAC e refresh token rotation correto."
related: [spring-security-pratico, oauth-2-1, rbac-vs-abac, session-cookie-vs-jwt]
updated: "2026-05-11"
---

## Estado da arte 2026

OAuth 2.1 (consolidação do 2.0 + boas práticas) é o padrão. Em Spring:

- **Resource Server**: valida token JWT/opaque (mais comum em backend).
- **OAuth2 Client**: app que delega login (SPA → IdP).
- **Authorization Server**: emite tokens (Keycloak, Auth0, Cognito, Spring Authorization Server).

Em arquitetura típica enterprise:

```text
Browser  → SPA → /api  (Resource Server: valida JWT)
   ↓
Keycloak (IdP) → emite JWT após login (OAuth2 Authorization Code + PKCE)
```

## Spring Security 6 — Resource Server (backend valida JWT)

```kotlin
implementation("org.springframework.boot:spring-boot-starter-security")
implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
```

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com/realms/billing
          # ou jwk-set-uri: https://auth.example.com/.well-known/jwks.json
```

Spring busca JWKS do issuer e valida assinatura. Tokens **expirados ou inválidos** retornam 401 automático.

Config de filter chain:

```kotlin
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig {

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            .csrf { it.disable() }                       // API stateless
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/produtos/**").permitAll()
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    .anyRequest().authenticated()
            }
            .oauth2ResourceServer { oauth2 ->
                oauth2.jwt { jwt ->
                    jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())
                }
            }
            .exceptionHandling { exceptions ->
                exceptions
                    .authenticationEntryPoint(unauthorizedHandler())
                    .accessDeniedHandler(forbiddenHandler())
            }
            .build()
    }

    private fun jwtAuthenticationConverter(): JwtAuthenticationConverter {
        val converter = JwtGrantedAuthoritiesConverter().apply {
            setAuthoritiesClaimName("roles")
            setAuthorityPrefix("ROLE_")
        }
        return JwtAuthenticationConverter().apply {
            setJwtGrantedAuthoritiesConverter(converter)
        }
    }
}
```

## Lendo o token no controller

```kotlin
@RestController
class PedidoController {

    @GetMapping("/api/meus-pedidos")
    fun meusPedidos(
        @AuthenticationPrincipal jwt: Jwt,
    ): List<Pedido> {
        val userId = jwt.subject
        val email = jwt.getClaimAsString("email")
        val tenant = jwt.getClaimAsString("tenant_id")
        return service.porUsuario(userId, tenant)
    }
}
```

`@AuthenticationPrincipal Jwt` injeta o token decodificado. Você lê claims sem reimplementar parsing.

## Method security: @PreAuthorize

```kotlin
@Service
class PedidoService {

    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
    fun buscarPedidosDoUsuario(userId: String): List<Pedido> = ...

    @PreAuthorize("@pedidoSecurity.podeEditar(#id, authentication)")
    fun atualizar(id: UUID, dados: PedidoUpdate): Pedido = ...
}
```

SpEL no `@PreAuthorize`. Componente customizado (`pedidoSecurity`) carrega regra complexa fora da anotação.

## OAuth2 Login (app server-side, ex: BFF)

```kotlin
implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
```

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          keycloak:
            client-id: billing-bff
            client-secret: ${KEYCLOAK_SECRET}
            scope: openid,profile,email
            authorization-grant-type: authorization_code
            client-authentication-method: client_secret_basic
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
        provider:
          keycloak:
            issuer-uri: https://auth.example.com/realms/billing
```

```kotlin
http
    .oauth2Login { oauth2 ->
        oauth2.userInfoEndpoint { userInfo ->
            userInfo.oidcUserService(oidcUserService())
        }
    }
    .logout { logout ->
        logout.logoutSuccessHandler(oidcLogoutSuccessHandler())
    }
```

Spring cuida do fluxo Authorization Code com PKCE (automático em SPA browser). User pousa em `/login/oauth2/code/keycloak`, Spring valida `code`, troca por token, cria sessão.

## PKCE: obrigatório em SPA

PKCE = Proof Key for Code Exchange. Cliente público (SPA) NÃO consegue guardar secret. PKCE evita interceptação do `code`:

1. Cliente gera `code_verifier` aleatório.
2. Manda `code_challenge = SHA256(code_verifier)` na requisição.
3. Após receber `code`, manda `code_verifier` na troca por token.
4. AS valida hash.

Spring Security 6 ativa PKCE automaticamente para clientes públicos. Em SPA com biblioteca como `oidc-client-ts`, é nativo.

## JWT: armadilhas

**Alg confusion**:

```text
JWT header: {"alg": "none"}
```

Token "sem assinatura". Spring Security 6 **rejeita** por default. Cuidado se você decodifica manualmente — sempre exija algoritmo esperado.

**RS256 vs HS256**: prefira RS256 (assimétrico). HS256 (simétrico) tem chave compartilhada entre Resource Server e Authorization Server — vazamento em um expõe todos.

**Expiração curta** (`exp`): 5-15 minutos. Refresh token com vida maior (8h-30d).

**Audience** (`aud`): valide. Token emitido pra API X não vale na API Y.

```kotlin
@Bean
fun jwtDecoder(props: OAuth2ResourceServerProperties): JwtDecoder {
    val decoder = NimbusJwtDecoder.withJwkSetUri(props.jwt.jwkSetUri).build()
    decoder.setJwtValidator(
        DelegatingOAuth2TokenValidator(
            JwtValidators.createDefaultWithIssuer(props.jwt.issuerUri),
            JwtAudienceValidator("billing-api"),
        )
    )
    return decoder
}
```

## PASETO: alternativa ao JWT

PASETO (Platform-Agnostic SEcurity TOkens) corrige falhas históricas de JWT:

- algoritmo no padrão (não negociável → sem alg confusion);
- v4.public usa Ed25519 (mais rápido e seguro);
- estrutura mais simples.

Em Spring, use [paseto4j](https://github.com/Acti0nHank/paseto4j). Adoção menor que JWT, mas tecnicamente superior. Em projeto novo greenfield onde você controla cliente, considere.

## Refresh Token Rotation

Refresh token é arma se não rotacionar. Pattern correto:

1. Cliente envia refresh token para `/token`.
2. Servidor emite **novo** access + **novo** refresh.
3. **Revoga o refresh antigo**.
4. Se o antigo for usado de novo (replay), **revoga tudo** do user (sinal de comprometimento).

Keycloak e Auth0 implementam isso nativamente. Spring Authorization Server também.

## Sessão vs JWT

| | Session Cookie | JWT Bearer |
|---|---|---|
| State | server-side store | stateless |
| Revocação | imediata (limpa session) | difícil (espera expiração) |
| Escala | precisa de store compartilhado | trivial |
| CSRF | precisa proteção | imune (Bearer, não Cookie) |
| Tamanho | pequeno (id) | maior (claims) |
| Para BFF | ✓ | desnecessário |
| Para SPA + API stateless | inferior | ✓ |
| Mobile | menos comum | comum |

**Padrão**: BFF web-only com sessão. SPA + API stateless ou mobile com JWT.

## RBAC vs ABAC

**RBAC (Role-Based)**: usuário tem papel; papel tem permissões. Simples, escala bem em organizações pequenas/médias.

```kotlin
@PreAuthorize("hasRole('GERENTE')")
fun aprovarDesconto(id: UUID, valor: BigDecimal): Aprovacao
```

**ABAC (Attribute-Based)**: regra envolve atributos do usuário, recurso, ação, contexto.

```kotlin
@PreAuthorize("@aprovacaoPolicy.aplica(authentication, #id, #valor)")
fun aprovarDesconto(id: UUID, valor: BigDecimal): Aprovacao

@Component
class AprovacaoPolicy(private val repo: PedidoRepository) {
    fun aplica(auth: Authentication, pedidoId: UUID, valor: BigDecimal): Boolean {
        val pedido = repo.findById(pedidoId)
        val papel = auth.authorities.map { it.authority }
        return when {
            "ROLE_DIRETOR" in papel -> true
            "ROLE_GERENTE" in papel && valor < BigDecimal("1000") -> true
            "ROLE_VENDEDOR" in papel && pedido.vendedorId == auth.name && valor < BigDecimal("100") -> true
            else -> false
        }
    }
}
```

RBAC é o default; ABAC quando regras crescem em complexidade.

## Anti-padrões

1. **JWT secret no application.yml**: secret compartilhado vaza.
2. **Sem validação de `aud`**: token de outra API aceito.
3. **Refresh token vida eterna**: comprometeu uma vez, comprometeu para sempre.
4. **HS256 sem rotação**: chave única exposta = todos os tokens vulneráveis.
5. **`SecurityContext` lookup manual em vez de `@AuthenticationPrincipal`**: boilerplate sem benefício.

## Critério de domínio

Você dominou este card quando consegue: configurar Resource Server validando JWT de Keycloak; usar `@PreAuthorize` com bean customizado para ABAC; explicar PKCE em SPA; descrever refresh token rotation correto; e listar 3 motivos pra preferir RS256 sobre HS256.
