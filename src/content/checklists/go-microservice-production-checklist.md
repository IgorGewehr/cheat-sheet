---
title: "Checklist: Microsserviço Go Pronto para Produção"
category: checklists
stack: [Go, Chi, PostgreSQL, RabbitMQ, Redis, Docker]
tags: [golang, production-readiness, checklist, architecture, quality]
excerpt: "Checklist sênior para aceitar um serviço Go empresarial: contrato, banco, fila, idempotência, testes, observabilidade, segurança, deploy e operação."
related: [go-microservices-enterprise, go-outbox-idempotency, go-docker-compose-enterprise]
updated: "2026-05-07"
---

## Contrato HTTP

- OpenAPI existe e está versionada.
- Endpoints têm status codes explícitos.
- Erros seguem envelope estável.
- Paginação, filtros e ordenação estão documentados.
- Operações críticas definem idempotência.
- Breaking changes são detectáveis em review.

## Go e arquitetura

- `cmd/` só faz wiring e boot.
- Domínio não importa Chi, pgx, Redis ou RabbitMQ.
- Use cases expressam intenção de negócio.
- Interfaces existem nas bordas certas.
- `context.Context` passa por todo I/O.
- Erros de domínio são traduzidos nas bordas.

## PostgreSQL

- Migrations rodam do zero em banco limpo.
- Migrations perigosas seguem expand/contract.
- Queries sqlc são revisadas como parte do design.
- Índices suportam queries críticas.
- Transações têm boundary no use case.
- Constraints protegem invariantes essenciais.

## RabbitMQ e eventos

- Exchanges, queues e routing keys estão documentadas.
- Consumers usam ack/nack corretamente.
- DLQ existe para falha permanente.
- Prefetch respeita banco e throughput.
- Eventos têm schema e versionamento.
- Consumers são idempotentes.

## Redis

- Cache tem TTL e estratégia de invalidação.
- Idempotency key guarda hash do request.
- Redis não é fonte de verdade para dado crítico.
- Falha de cache é degradável quando possível.

## Testes

- Domínio tem testes unitários legíveis.
- Use cases usam fakes simples.
- Repositories rodam contra Postgres real.
- Redis/RabbitMQ são testados com Testcontainers onde importa.
- Contrato OpenAPI é validado.
- `go test -race ./...` passa.

## Operação

- Logs são estruturados.
- Request/correlation id atravessa serviços.
- Métricas RED/USE existem.
- Traces cobrem dependências críticas.
- Health e readiness são separados.
- Shutdown é gracioso.
- Dockerfile é multi-stage.
- Compose local sobe dependências.

## Segurança

- Secrets não estão no repo.
- Config é validada no boot.
- AuthN/AuthZ são testadas.
- Inputs são validados.
- Timeouts existem para dependências externas.
- Imagem final não carrega toolchain.

## Critério de aceite

Um serviço só está pronto quando alguém consegue: rodar local, entender contrato, executar testes, diagnosticar falha e fazer rollback sem depender da memória de quem escreveu.
