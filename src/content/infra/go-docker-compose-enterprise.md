---
title: "Go: Docker e Compose para Ambiente Empresarial"
category: infra
stack: [Go, Docker, Docker Compose, PostgreSQL, Redis, RabbitMQ]
tags: [docker, compose, containers, golang, local-development]
excerpt: "Ambiente Go reproduzível: Dockerfile multi-stage, Compose com Postgres/Redis/RabbitMQ, healthchecks, migrations e ergonomia local."
related: [docker-compose-dev, docker-multistage, container-security]
updated: "2026-05-07"
---

## Objetivo

Um serviço empresarial deve subir localmente de forma previsível. Novo dev, CI e agente de IA precisam conseguir rodar o ambiente sem ritual manual.

Stack local mínima:

- app Go;
- PostgreSQL;
- Redis;
- RabbitMQ;
- migrations;
- testes de integração.

## Dockerfile multi-stage

```dockerfile
ARG GO_VERSION=1.26

FROM golang:${GO_VERSION}-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -o /out/api ./cmd/api

FROM gcr.io/distroless/static-debian12
COPY --from=builder /out/api /api
EXPOSE 8080
ENTRYPOINT ["/api"]
```

Use `scratch` ou distroless conforme necessidade de CA certs, debug e política da empresa.

## Compose

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
      POSTGRES_DB: app
    ports: ["127.0.0.1:5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7
    command: ["redis-server", "--requirepass", "${REDIS_PASSWORD:?set REDIS_PASSWORD}"]
    ports: ["127.0.0.1:6379:6379"]

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:?set RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:?set RABBITMQ_PASSWORD}
    ports: ["127.0.0.1:5672:5672", "127.0.0.1:15672:15672"]
```

Esse Compose é somente local. Mantenha um `.env.example` com os nomes das variáveis, mas sem segredos reais. Em ambientes compartilhados, não exponha Postgres, Redis ou RabbitMQ em interfaces públicas.

## Healthcheck do app

Separe:

- `liveness`: processo está vivo?
- `readiness`: consegue atender tráfego? Banco/fila essenciais estão prontos?

Em Compose local, healthcheck evita corrida entre app e dependências.

## Migrations

Não esconda migrations dentro do boot sem decisão consciente. Em muitos times, migration roda como job separado no deploy. Localmente, pode haver comando:

```bash
goose -dir db/migrations postgres "$DATABASE_URL" up
```

## Critério de domínio

Você dominou este card quando seu projeto sobe com um comando, falha de dependência é visível e a imagem final não carrega toolchain nem arquivos desnecessários.
