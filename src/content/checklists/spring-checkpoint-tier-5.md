---
title: "Checkpoint Tier 5 — Produção Sênior, Segurança, AI-Era"
category: checklists
stack: [Spring Boot, Kotlin, JVM, Spring Security, Spring AI]
tags: [checkpoint, production, security, observability, performance, ai, capstone]
excerpt: "Validação final antes de capstone: produção sênior, segurança OWASP, observabilidade, performance JVM, OAuth2, Spring AI e entrevista sênior. Aprovação ≥ 75."
related: [spring-microservice-production-checklist, spring-security-pratico, spring-ai-integration]
updated: "2026-05-11"
---

## Como usar

Tier 5 é a régua sênior. Marque dominado quando consegue **liderar a decisão** sobre o tema, não só implementá-la. Após completar, faça o exame Tier 5 (`/skills/spring-boot-kotlin/exam/5`). Aprovação ≥ 75.

## Microsserviços Empresariais

- [ ] Critério para dividir microsserviço (time, escala, ciclo de release, BC).
- [ ] Monolito modular como ponto de partida; dividir quando dor real aparece.
- [ ] Dados por serviço (regra de ouro).
- [ ] Comunicação síncrona (REST/gRPC) vs assíncrona (eventos): quando cada um.
- [ ] Service discovery via K8s DNS (substitui Eureka).
- [ ] Anti-Corruption Layer entre seu domínio e integração externa.
- [ ] Saga orquestrada vs coreografada.
- [ ] Quando Spring Cloud adiciona valor (parcimônia).
- [ ] API Gateway: terminação TLS, auth básica, rate limit, routing.

## Outbox Pattern

- [ ] Tabela outbox com index parcial em `processed_at IS NULL`.
- [ ] Escrita atômica: aggregate + outbox na mesma TX.
- [ ] Relay (poller) com `FOR UPDATE SKIP LOCKED` para multi-pod.
- [ ] CDC com Debezium para volumes maiores.
- [ ] Cleanup de outbox antigo.
- [ ] Consumer idempotente (tabela processados ou UPSERT).
- [ ] Outbox + Saga compensatória.

## Observabilidade

- [ ] Os 3 pilares: metrics + tracing + logs com `traceId` correlacionado.
- [ ] Micrometer registry → Prometheus.
- [ ] Métricas customizadas: `Counter`, `Timer`, `DistributionSummary`.
- [ ] Cardinality: tags low-cardinality only (NUNCA userId/email).
- [ ] Observation API: gerar métrica + span juntos.
- [ ] OpenTelemetry Collector como sidecar.
- [ ] Sampling 10-20% em prod (não 100%).
- [ ] Health: liveness sem deps externas; readiness com.
- [ ] SLO definidos com burn rate alert.
- [ ] Dashboard pra incidente: RED + USE + business metrics.

## Performance JVM

- [ ] GC: G1 default; ZGC para heap grande + latência crítica.
- [ ] `MaxRAMPercentage` em container, não `Xmx`.
- [ ] JFR em prod (overhead <2%).
- [ ] async-profiler para flame graphs.
- [ ] HikariCP dimensionamento (5-20 conexões típico, não 200).
- [ ] PgBouncer entre app e PG em alta carga.
- [ ] Detectar pool exausto: `connections.pending` sustentado.
- [ ] Virtual Threads (JDK 21) como alternativa a corrotinas para I/O.
- [ ] PersistenceContext gigante em batch: flush + clear.

## Segurança

- [ ] OWASP Top 10 com exemplos concretos em Spring/Kotlin.
- [ ] Broken Access Control: `@PreAuthorize` com bean customizado.
- [ ] Crypto: bcrypt strength 12+, TLS 1.2+, KMS para chaves.
- [ ] Injection: JPQL parametrizado, `ProcessBuilder` em vez de shell.
- [ ] SSRF: allowlist de hosts permitidos.
- [ ] Supply chain: OWASP DC + Renovate/Dependabot + Trivy.
- [ ] Headers: HSTS, CSP, X-Frame, X-Content-Type-Options, Referrer-Policy.
- [ ] CSRF: desabilitar em API REST stateless; manter em sessão-cookie.
- [ ] Secrets em ENV/Vault, NUNCA em git.
- [ ] Stack trace NUNCA na response.

## Spring Security & OAuth2

- [ ] Spring Security 6 com `oauth2ResourceServer` validando JWT.
- [ ] JWT: validação `iss`, `aud`, `exp`; algoritmo fixado (RS256+).
- [ ] PKCE obrigatório em SPA.
- [ ] PASETO como alternativa moderna ao JWT.
- [ ] Refresh token rotation: revoga antigo, emite novo.
- [ ] Session cookie vs JWT — quando cada um.
- [ ] RBAC simples + ABAC com bean customizado em SpEL.
- [ ] OIDC com Keycloak / Auth0 / Cognito.

## Docker & Deploy

- [ ] Dockerfile multi-stage com layertools Spring Boot.
- [ ] User não-root, healthcheck embutido.
- [ ] Buildpacks (`bootBuildImage`) ou JIB como alternativa.
- [ ] Distroless para minimizar superfície.
- [ ] K8s `securityContext`: `runAsNonRoot`, `readOnlyRootFilesystem`, `dropAllCapabilities`.
- [ ] Resource requests + limits dimensionados.
- [ ] Tag imutável (`v1.2.3`), NUNCA `latest`.
- [ ] Trivy / Grype scan no CI.

## GraalVM Native

- [ ] Quando vale (lambda, cold start, autoscale K8s).
- [ ] Quando NÃO vale (monolito 24h up, batch longo).
- [ ] `spring.aot.enabled=true` + `./gradlew nativeCompile`.
- [ ] Reflection hints via AOT processor (Spring 3 automático).
- [ ] `@RegisterReflectionForBinding` para libs externas.
- [ ] Trade-off: startup <100ms vs build 5-10min.

## Spring AI

- [ ] `ChatClient` unificado para Anthropic/OpenAI/Bedrock.
- [ ] Structured output via `entity(Class)`.
- [ ] Streaming SSE com `Flux<String>`.
- [ ] Function calling com `@Tool` + validação de input.
- [ ] RAG: chunking, embeddings, pgvector, retrieval, reranking.
- [ ] `QuestionAnswerAdvisor` para RAG automatizado.
- [ ] Advisors customizados (cache, log, rate limit).
- [ ] MCP Server expondo domínio para clients (Claude Desktop, Cursor).
- [ ] Controle de custo: cache, modelo menor, prompt cache, métricas de tokens.
- [ ] Mitigação de hallucination: grounding, citações, schema rígido, eval suite.

## Entrevista Sênior

- [ ] Banco de 7 histórias STAR ensaiadas.
- [ ] 5 perguntas substantivas para o entrevistador.
- [ ] Trade-offs articulados, não receitas.
- [ ] System design: notificações, RAG, multi-tenant, financeiro.
- [ ] JVM internals: GC, escape analysis, classpath, JIT tiers.
- [ ] Spring deep: AOP, transactions, lifecycle, autoconfiguration.
- [ ] Banco: índices, locks, isolation, MVCC.
- [ ] Padrões: hexagonal, DDD, Saga, Outbox, CQRS.
- [ ] Comunicação: explicar pensando em voz alta.

## Production Checklist

- [ ] Aplicou o checklist completo a um serviço real.
- [ ] Identificou e fechou 5+ gaps de segurança.
- [ ] Implementou outbox em integração crítica.
- [ ] Refatorou observability: traces correlacionados, dashboards limpos.
- [ ] Documentou runbook de incidente.
- [ ] Configurou rollback estratégico (blue-green ou canary).

## Antes do Capstone

- [ ] Domina Tier 0-4 com fluência: revisar checkpoints anteriores.
- [ ] Leu "Designing Data-Intensive Applications" (Kleppmann).
- [ ] Praticou system design com 3 cenários (notificações, RAG, marketplace).
- [ ] Mock interview com colega ou ferramenta.
- [ ] Tem repo público com 1+ projeto Spring Boot + Kotlin demonstrável.

## Capstone esperado

- 2 microsserviços empresariais integrados via Kafka + gRPC.
- Banco Postgres próprio por serviço, Flyway, Testcontainers.
- Hexagonal + DDD em ambos.
- Spring Security + JWT entre eles.
- Outbox pattern em pelo menos um.
- Observability completa: Prometheus + Grafana + Tempo + Loki.
- CI/CD com testes + build de imagem + vuln scan.
- README explicando decisões, ADRs, runbook.

## Critério de domínio

Você completou o Tier 5 quando: pode dar entrevista sênior em qualquer Big Tech ou empresa enterprise com confiança; consegue revisar arquitetura de outro time e propor melhorias com base em medição; constrói novo microsserviço Spring/Kotlin pronto pra prod do zero em 1-2 semanas; e ensina cada item desta lista para um pleno.
