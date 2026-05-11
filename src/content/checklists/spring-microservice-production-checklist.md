---
title: "Checklist de Produção: Microsserviço Spring Boot + Kotlin"
category: checklists
stack: [Spring Boot, Kotlin]
tags: [checklist, production, readiness, kotlin, spring]
excerpt: "Critérios sênior para subir microsserviço Spring/Kotlin em prod com confiança: segurança, dados, operação, rollback e DR. Marque cada um antes do go-live."
related: [spring-microservices-enterprise, spring-security-pratico, spring-observability-micrometer-otel]
updated: "2026-05-11"
---

## Como usar

Cada bloco abaixo é checkpoint binário (passa ou falha). Não passa? Não vai pra prod. Sênior é quem usa essa lista antes do deploy, não quem aprende após o incidente.

## Segurança

- [ ] **Spring Security configurado** com `oauth2ResourceServer` ou equivalente; rotas auth-protected explícitas.
- [ ] **`@PreAuthorize` em métodos sensíveis** (admin, dado de outro usuário, financeiro).
- [ ] **CSRF**: desabilitado em API REST stateless, habilitado em app sessão-cookie.
- [ ] **Headers**: HSTS, CSP, X-Frame, X-Content-Type-Options, Referrer-Policy configurados.
- [ ] **TLS 1.2+** em todas as conexões (DB, Kafka, HTTP client externo).
- [ ] **Secrets**: nenhum em git. ENV ou Vault. Rotação documentada.
- [ ] **JWT**: validação de `iss`, `aud`, `exp`; algoritmo fixado (RS256+).
- [ ] **OWASP Dependency Check** no CI; build falha em CVSS ≥ 7.
- [ ] **Trivy / Grype** scan da imagem no CI.
- [ ] **Stack trace nunca** vaza na response.
- [ ] **`/actuator/env`, `/heapdump`, `/threaddump` NÃO** expostos publicamente.
- [ ] **SSRF**: validação allowlist em URLs aceitas de usuário.
- [ ] **SQL injection**: nenhum `nativeQuery=true` com concatenação. JPQL parametrizado.
- [ ] **Senhas**: bcrypt strength ≥ 12. Argon2 considerado.
- [ ] **MFA** obrigatória para roles admin.

## Dados

- [ ] **Flyway/Liquibase** versionando schema; `ddl-auto: validate` em prod.
- [ ] **Migrations zero-downtime**: backward-compat com versão anterior do código.
- [ ] **Backup** automatizado e testado (restore funciona).
- [ ] **PITR** habilitado se RPO < 24h.
- [ ] **Pool HikariCP** dimensionado: cardinality testada, sem `connections.pending` sustentado.
- [ ] **N+1** auditado em queries de hot path (assert count em teste).
- [ ] **EntityGraph** ou fetch join em endpoints que carregam aggregates.
- [ ] **Read-only TX** em queries de listagem.
- [ ] **Lock timeout** configurado: `lock_timeout` no PG, statement_timeout sensato.
- [ ] **Indexes** auditados em queries críticas via `EXPLAIN ANALYZE`.
- [ ] **Cleanup** de tabelas que crescem (outbox, audit, sessions) agendado.
- [ ] **LGPD/GDPR**: dados sensíveis criptografados em repouso onde aplicável.

## Mensageria

- [ ] **Producer Kafka**: `acks=all`, `enable.idempotence=true`, retries configurados.
- [ ] **Consumer Kafka**: `ack-mode=manual_immediate`, idempotência por msg_id.
- [ ] **DLT / DLQ** configurada com policy de retry (exponential backoff + jitter).
- [ ] **Monitoramento de lag**: consumer lag alerta antes de virar incidente.
- [ ] **Outbox pattern** para publicar evento que depende de TX do DB.
- [ ] **Schema registry** se houver múltiplos consumidores (Avro/Protobuf).

## Observabilidade

- [ ] **Logs estruturados** (JSON) em prod via Logback + LogstashEncoder.
- [ ] **MDC** com `correlationId`/`traceId` em todos os logs.
- [ ] **Métricas Prometheus** expostas em `/actuator/prometheus`.
- [ ] **Tracing OTel** configurado com amostragem (10-20%).
- [ ] **Health checks** corretos: liveness só interno, readiness inclui deps.
- [ ] **Dashboards Grafana** com RED por endpoint + USE por recurso.
- [ ] **SLOs definidos** (p95 < X ms, error rate < Y%) com burn rate alert.
- [ ] **Logs com PII** nunca: senha, token, CPF/CNPJ completo mascarados.
- [ ] **Alertas com runbook** linkado (não disparar alerta sem ação clara).

## Resiliência

- [ ] **Timeouts em todas as chamadas externas** (HTTP client, DB, Kafka producer).
- [ ] **Circuit Breaker** em dependências externas críticas.
- [ ] **Retry com jitter** em operações idempotentes.
- [ ] **Fallback** ou degradação graciosa em falha de dependência.
- [ ] **Bulkhead / semáforo** em chamadas custosas.
- [ ] **Rate limit** em endpoints públicos.
- [ ] **Chaos test** ao menos uma vez (mata pod, lentidão simulada).

## Deploy & Operação

- [ ] **Imagem Docker multi-stage** com user não-root, healthcheck.
- [ ] **Tag imutável** (`v1.2.3` ou `sha-abc123`), não `latest`.
- [ ] **`readOnlyRootFilesystem: true`** no K8s onde possível.
- [ ] **Resource requests + limits** definidos (CPU, memória).
- [ ] **Graceful shutdown**: `server.shutdown=graceful`, `preStop` hook.
- [ ] **HPA** configurado se carga varia (CPU > 70% ou métrica custom).
- [ ] **Liveness e readiness** diferentes; liveness não inclui deps externas.
- [ ] **Anti-affinity** entre pods (não todos em mesma zona).
- [ ] **Pod Disruption Budget** para garantir alta disponibilidade em manutenção.
- [ ] **Network policies** restringindo egress + ingress.

## Configuração

- [ ] **`@ConfigurationProperties` type-safe** com `@Validated`.
- [ ] **Validação no boot**: app não sobe com config inválida.
- [ ] **Profiles** separando dev/staging/prod sem secrets em YAML.
- [ ] **Feature flags** em vez de deploy para liga/desliga risco.
- [ ] **Pool de conexão DB** dimensionado para carga + buffer.

## Testes

- [ ] **Cobertura mínima ≥ 80%** em domínio e application.
- [ ] **Testes de integração** com Testcontainers (Postgres real, não H2).
- [ ] **Contract tests** se há consumidores externos.
- [ ] **Smoke test** rodando após deploy automatizado.
- [ ] **Load test** baseline registrado (k6, Gatling).
- [ ] **Pipeline de CI**: testa, lint, vuln scan, build em < 10 min.

## Documentação

- [ ] **README** com setup local em < 30 minutos.
- [ ] **OpenAPI** gerado e versionado.
- [ ] **ADRs** (Architecture Decision Records) das decisões não óbvias.
- [ ] **Runbook**: o que fazer em incidente. Endpoint X retorna 500? Comece por...
- [ ] **Diagrama** de arquitetura (C4 model preferível).
- [ ] **DLT/DLQ runbook**: como reprocessar mensagem morta.
- [ ] **Onboarding doc**: novo dev produz feature em < 1 semana.

## Rollback / Recovery

- [ ] **Migration backward-compatible**: versão anterior do app funciona com schema novo.
- [ ] **Deploy progressivo** (canary, blue-green): permite rollback rápido.
- [ ] **Feature flag** para desligar feature defeituosa sem deploy.
- [ ] **Backup restore testado** ao menos trimestralmente.
- [ ] **Plano de DR documentado**: RTO e RPO claros.

## Gestão de Custos

- [ ] **Resource requests** baseados em medição real, não chute.
- [ ] **Métricas de custo** (DB, Kafka, egress) visíveis.
- [ ] **Limpeza** de recursos órfãos (pod, PVC, snapshot antigos).
- [ ] **Pool de conexão** não dimensionado para 1000 quando 20 servem.

## Cultura (não-código)

- [ ] **Postmortem blameless** em incidente importante; ação concreta no backlog.
- [ ] **On-call** rotação com SLA de resposta documentado.
- [ ] **Game day** trimestral simulando incidente.
- [ ] **Knowledge sharing**: incidente recente discutido em retro.

## Como aplicar

1. Imprima ou cole no PR de release: confirma que todos os itens valem.
2. Em projeto novo, use como roadmap de release 1.0.
3. Em projeto existente: faça audit, marque o que falta, transforme em backlog.
4. Reavalie a cada 6 meses — a lista evolui.

## Critério de domínio

Você dominou este checklist quando consegue: levar serviço novo do zero ao prod confiante; explicar cada item ao time; identificar quais itens são mais importantes pro seu domínio específico; e propor adição de itens que faltam para o contexto da empresa.
