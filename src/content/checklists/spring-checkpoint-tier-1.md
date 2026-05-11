---
title: "Checkpoint Tier 1 — Kotlin & Spring Boot Essentials"
category: checklists
stack: [Kotlin, Spring Boot]
tags: [checkpoint, kotlin, spring, web, validation, testing]
excerpt: "Validação dos fundamentos Kotlin + Spring Boot antes de avançar para persistência. Critérios objetivos para se considerar pronto pro próximo tier."
related: [kotlin-linguagem-essencial, spring-boot-essentials, spring-web-controllers]
updated: "2026-05-11"
---

## Como usar este checkpoint

Marque cada critério como **dominado** quando você consegue **explicar para outra pessoa** e **escrever de cabeça**. Repita os tópicos que ainda hesita. Não pule.

Após completar, faça o exame Tier 1 (`/skills/spring-boot-kotlin/exam/1`). Aprovação ≥ 70.

## Linguagem Kotlin

- [ ] Diferença entre `val` e `var`; quando preferir cada um.
- [ ] Null-safety: `?`, `?.`, `?:`, `!!`; por que `!!` é cheiro.
- [ ] Smart cast após `if (x == null) return`.
- [ ] `data class` vs `class` vs `value class @JvmInline`.
- [ ] `sealed class/interface` para tipos algébricos; exaustividade em `when`.
- [ ] `when` como expressão; ranges, `is`, `in`.
- [ ] Extension functions; quando usar (e quando NÃO).
- [ ] Scope functions: `let`, `apply`, `also`, `run`, `with` — diferenças.
- [ ] Collections imutáveis vs mutáveis; sempre retornar imutável de API pública.
- [ ] `MutableList` em campo JPA `@OneToMany`.

## Setup e Gradle

- [ ] JDK 21+, Gradle wrapper, IntelliJ.
- [ ] `build.gradle.kts` com `jvmToolchain(21)`.
- [ ] `gradle/libs.versions.toml` (version catalog).
- [ ] Multi-module com `domain`, `application`, `infra`, `app`.
- [ ] Convention plugin em `buildSrc/`.
- [ ] Plugin `kotlin-spring` (abre classes) e `kotlin-jpa` (constructor sem args).
- [ ] `./gradlew run`, `build`, `test`, `dependencies`.

## Errors

- [ ] Quando usar exception, `Result<T>`, `Either<E, A>` (Arrow).
- [ ] `require`, `check`, `error` para guards.
- [ ] Não usar exception para controle de fluxo de domínio.
- [ ] Sealed class de erros de domínio + `Either` para casos negociais.
- [ ] `runCatching` em fronteira de integração externa.

## Spring Boot Essentials

- [ ] Diferença entre Spring Framework e Spring Boot.
- [ ] Auto-configuration: o que é, como funciona, como debugar (`--debug`).
- [ ] `ApplicationContext`, beans, constructor injection (NUNCA `@Autowired` em field).
- [ ] Profiles via `application.yml` + `SPRING_PROFILES_ACTIVE`.
- [ ] Lifecycle: `ApplicationReadyEvent`, `ContextClosedEvent`.
- [ ] Graceful shutdown: `server.shutdown=graceful` + K8s preStop.
- [ ] Actuator: `/health`, `/health/liveness`, `/health/readiness`, `/prometheus`.
- [ ] Endpoints actuator que NUNCA expor: `/env`, `/heapdump`, `/threaddump` publicamente.

## Web MVC

- [ ] `@RestController`, `@RequestMapping`, `@GetMapping`, etc.
- [ ] `ResponseEntity<T>` tipado.
- [ ] HTTP status codes: 200, 201 (+ Location), 204, 400, 401, 403, 404, 409, 422, 429, 500.
- [ ] Conversão Request DTO → Command de domínio → Response DTO.
- [ ] NUNCA retornar entidade JPA da API.
- [ ] `@RestControllerAdvice` para tratamento global de erros.
- [ ] `ProblemDetail` (RFC 7807).
- [ ] Versionamento de API por path (`/v1/`).

## Validation

- [ ] `@field:NotBlank`, `@field:Size`, etc. — sempre `@field:` em Kotlin.
- [ ] `@Valid` em `@RequestBody`.
- [ ] `@Validated` na classe para parâmetros simples.
- [ ] Anotação customizada com `ConstraintValidator`.
- [ ] Cross-field validation a nível de classe.

## Coroutines

- [ ] `suspend fun`, `coroutineScope`, `launch`, `async`, `withContext`.
- [ ] Structured concurrency (filhas cancelam quando pai cancela).
- [ ] Dispatchers: `Default` (CPU), `IO` (bloqueante), por que evitar `Unconfined`.
- [ ] `supervisorScope` vs `coroutineScope`.
- [ ] `Flow<T>` cold streams; operadores `map`, `filter`, `flatMapMerge`.
- [ ] `MDCContext` para corrotinas + MDC SLF4J.
- [ ] NUNCA `GlobalScope.launch`.

## WebFlux vs MVC

- [ ] Quando MVC é a escolha certa (90% dos casos enterprise).
- [ ] Quando WebFlux faz sentido (streaming, gateway).
- [ ] Virtual Threads (JDK 21) e impacto.
- [ ] `WebClient` vs `RestClient` vs `HTTP Interface`.

## Config

- [ ] `@ConfigurationProperties` + `@ConfigurationPropertiesScan`.
- [ ] Nested data class para grouping.
- [ ] Validação no boot via `@Validated`.
- [ ] Ordem de precedência: args → ENV → profile yml → yml default.
- [ ] Secrets em ENV/Vault, nunca em git.
- [ ] Por que NÃO usar `@Value` em projeto novo.

## Logging

- [ ] SLF4J + Logback como default Spring Boot.
- [ ] Placeholders `{}`, não interpolação.
- [ ] MDC com correlation ID via filter.
- [ ] `logback-spring.xml` com `springProfile` dev (pretty) vs prod (JSON).
- [ ] Levels: TRACE/DEBUG/INFO/WARN/ERROR — quando cada um.
- [ ] Nunca logar: senha, token, CPF/CNPJ completo.

## Testing

- [ ] JUnit 5 + Kotest StringSpec/BehaviorSpec.
- [ ] MockK: `every`, `coEvery`, `verify`, `relaxed`.
- [ ] `@MockkBean` em vez de `@MockBean` (Mockito).
- [ ] Spring Test slices: `@WebMvcTest`, `@DataJpaTest`, `@JsonTest`.
- [ ] Quando usar `@SpringBootTest` (raramente).
- [ ] Nomear teste por comportamento, não por método.
- [ ] TDD: red, green, refactor — quando vale.

## Antes de avançar para Tier 2

- [ ] Criou um serviço Spring Boot do zero com Controller, Validation, ControllerAdvice, testes JUnit/Kotest.
- [ ] Configurou Logback JSON em prod e pretty em dev.
- [ ] Implementou correlation ID via filter.
- [ ] Estruturou projeto multi-module com convention plugin.
- [ ] Escreveu pelo menos 10 testes seguindo padrão Kotest + MockK.
- [ ] Leu Spring Boot 3 reference docs (módulo Web).

## Critério de domínio

Você está pronto para o Tier 2 quando: consegue dar entrevista júnior-pleno sólida na maioria desses tópicos; escreve API REST com validação e tratamento de erro do zero em 1h; e explica por que `@field:` em Kotlin sem hesitar.
