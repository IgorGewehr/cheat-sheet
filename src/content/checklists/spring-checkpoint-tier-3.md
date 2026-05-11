---
title: "Checkpoint Tier 3 — Persistência, Arquitetura, Mensageria, gRPC"
category: checklists
stack: [Spring Boot, Kotlin, JPA, Kafka, RabbitMQ, gRPC]
tags: [checkpoint, jpa, hexagonal, ddd, kafka, grpc, resilience]
excerpt: "Validação dos fundamentos sênior pleno: JPA, transações, hexagonal, DDD, mensageria, Redis, gRPC e resiliência. Critérios objetivos antes do Tier 4."
related: [spring-data-jpa, spring-hexagonal-kotlin, spring-kafka-rabbitmq]
updated: "2026-05-11"
---

## Como usar

Marque cada item dominado. Cada bloco pressupõe domínio do Tier 1. Após completar, faça o exame Tier 3 (`/skills/spring-boot-kotlin/exam/3`). Aprovação ≥ 70.

## Spec-Driven Development (SDD)

- [ ] OpenAPI/Swagger como contrato de primeira classe.
- [ ] springdoc-openapi: code-first com anotações `@Operation`, `@ApiResponse`, `@Schema`.
- [ ] Contract-first com OpenAPI Generator + interfaces Kotlin.
- [ ] Contract tests (Spring Cloud Contract, atlassian/swagger-request-validator).
- [ ] Versionamento por path; breaking change = nova major.
- [ ] Design REST: nouns, plurals, idempotency, ProblemDetail RFC 7807.

## JPA / Spring Data

- [ ] `@Entity` class normal, NÃO `data class` (equals/hashCode quebra).
- [ ] Plugin `kotlin-jpa` (construtor sem args).
- [ ] Separação Entity JPA ↔ Domain (módulos diferentes).
- [ ] Mapping bidirecional Entity ↔ Domain.
- [ ] Derived queries até 3-4 condições; acima JPQL explícita.
- [ ] N+1: identificar com log SQL, mitigar com fetch join / `@EntityGraph` / `@BatchSize`.
- [ ] Projections (interface ou DTO) para read-only.
- [ ] Lock otimista (`@Version`) vs pessimista (`@Lock`).
- [ ] Paginação `Page<T>` vs `Slice<T>` vs cursor.
- [ ] `spring.jpa.hibernate.ddl-auto: validate` em prod.

## Flyway / Migrations

- [ ] Versionamento `V1__`, `V2__`, `R__`, `B__`.
- [ ] Convenção de nome com timestamp em times grandes.
- [ ] Baseline em base legada.
- [ ] Backward compat: ADD nullable → dual-write → ALTER NOT NULL.
- [ ] Remover coluna: deploy sem uso → drop.
- [ ] Renomear: 5 deploys (add, dual-write, dual-read, switch, drop).
- [ ] PG: `ADD COLUMN ... DEFAULT` (PG 11+) sem reescrever tabela.
- [ ] Dados de seed em código (por profile), NÃO em migration.

## Transactions

- [ ] `@Transactional` no application service / use case.
- [ ] Self-invocation gotcha; soluções (outro bean, TransactionTemplate).
- [ ] Plugin `kotlin-spring` para abrir classes (não-final).
- [ ] Isolation: `READ_COMMITTED` default, `SERIALIZABLE` em ops financeiras críticas.
- [ ] Propagation: `REQUIRES_NEW` para auditoria que sobrevive a rollback.
- [ ] Read-only TX em queries (`@Transactional(readOnly=true)`).
- [ ] Timeout (`timeout = 5`).
- [ ] Nunca chamada HTTP/Kafka externa dentro de TX (segura connection).

## Testcontainers

- [ ] Postgres real, NUNCA H2 em projeto sério.
- [ ] `@ServiceConnection` (Spring 3.1+) para auto-config.
- [ ] Container compartilhado entre testes com classe abstrata.
- [ ] `withReuse(true)` localmente, off em CI.
- [ ] Kafka, RabbitMQ, Redis containers reais.
- [ ] Awaitility para asserções assíncronas (`Thread.sleep` é cheiro).
- [ ] Configuração no `bootRun` para dev local.

## Arquitetura Hexagonal

- [ ] Domínio puro: zero Spring, zero JPA, zero framework.
- [ ] Application: use cases + ports (interfaces).
- [ ] Adapter-In: HTTP, Kafka consumer, gRPC server.
- [ ] Adapter-Out: JPA repo, Kafka producer, HTTP client.
- [ ] Direção de dependência sempre pra dentro: app → adapter → application → domain.
- [ ] Módulos Gradle por camada — compilador é o linter de arquitetura.
- [ ] Mapping explícito Entity ↔ Domain.
- [ ] Quando hexagonal é overkill (CRUD trivial).

## DDD

- [ ] Ubiquitous language consistente (PT-BR se o negócio fala PT-BR).
- [ ] Value Objects: `@JvmInline value class` para tipos primitivos opacos.
- [ ] Entity com construtor privado + factory + invariantes em `require`.
- [ ] Aggregate root + boundary de transação.
- [ ] Referência entre aggregates por ID, não por objeto.
- [ ] Sealed class para máquina de estados.
- [ ] Domain Events acumulados na entidade.
- [ ] Domain Services para lógica que cruza aggregates.
- [ ] Bounded Context: mesmo nome, modelos diferentes em contextos diferentes.

## Kafka

- [ ] Producer: `acks=all`, `enable.idempotence=true`, retries.
- [ ] Consumer: `manual_immediate` ack, idempotência por msg_id.
- [ ] Key = aggregate ID para ordenação dentro da partition.
- [ ] DLT com `DefaultErrorHandler` + `ExponentialBackOff`.
- [ ] `notRetryableExceptions` para erros definitivos (validation).
- [ ] Schema registry (Avro/Protobuf) em arquitetura com 10+ consumers.
- [ ] Lag monitoring + alerta antes de virar incidente.

## RabbitMQ

- [ ] Topology em `@Configuration`: Exchange, Queue, Binding.
- [ ] DLX (Dead Letter Exchange) + DLQ.
- [ ] `acknowledge-mode: manual` + retry + max-attempts.
- [ ] Prefetch dimensionado.
- [ ] Quando RabbitMQ > Kafka (task queue, RPC pattern).

## Redis

- [ ] `@Cacheable` com cache manager + TTL por cache.
- [ ] Cache-aside como padrão; write-through/behind com cuidado.
- [ ] Idempotency keys: SETNX + resultado cacheado.
- [ ] Distributed lock com Redisson (`tryLock(wait, lease)`).
- [ ] Rate limit com Bucket4j ou Resilience4j (Redisson como alternativa).
- [ ] Pub/Sub para invalidação de cache (não para evento de domínio confiável).

## gRPC

- [ ] Protobuf como contrato: regras de número de campo, `reserved`, enum `_UNSPECIFIED = 0`.
- [ ] Serialização `BigDecimal` como string.
- [ ] grpc-kotlin para suspend e Flow.
- [ ] Interceptors para auth, logging, tracing.
- [ ] Status codes gRPC: `NOT_FOUND`, `FAILED_PRECONDITION`, `ALREADY_EXISTS`, etc.
- [ ] Deadlines propagados entre serviços.
- [ ] mTLS em prod (ou service mesh).
- [ ] Quando gRPC > REST (interno entre microsserviços) e vice-versa.

## Resilience4j

- [ ] Ordem de anotações: `@CircuitBreaker > @Retry > @TimeLimiter > @Bulkhead`.
- [ ] Timeout em todas as chamadas externas.
- [ ] Retry: `enableExponentialBackoff`, `randomizedWaitFactor` (jitter), `notRetryableExceptions`.
- [ ] Circuit breaker: `failureRateThreshold`, `slidingWindowSize`, `minimumNumberOfCalls`.
- [ ] Fallback com dado degradado útil.
- [ ] NUNCA retry em operação não-idempotente.
- [ ] Métricas Resilience4j expostas para Prometheus.

## Antes de avançar para Tier 4

- [ ] Implementou serviço com 3 entidades JPA, 2 use cases, repositórios + adapters.
- [ ] Estruturou em 6+ módulos Gradle hexagonais.
- [ ] Consumiu Kafka topic com idempotência + DLT.
- [ ] Resolveu um N+1 real via fetch join ou EntityGraph.
- [ ] Implementou migration zero-downtime em coluna nova.
- [ ] Configurou circuit breaker + retry + fallback em chamada HTTP externa.
- [ ] Escreveu testes de integração com Testcontainers (Postgres + Kafka).
- [ ] Modelou um aggregate completo com sealed status + domain events.

## Critério de domínio

Você está pronto para o Tier 4 quando: implementa serviço backend com hexagonal/DDD + persistência + mensageria do zero em 1-2 dias; consegue dar entrevista pleno-sênior em todos os tópicos; e identifica + corrige N+1 em produção sem hesitar.
