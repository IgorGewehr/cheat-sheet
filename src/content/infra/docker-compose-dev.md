---
title: "docker-compose pro dev local"
category: infra
stack: [Docker, PostgreSQL, Redis]
tags: [docker, dev]
excerpt: "Postgres + Redis + serviços rodando local com 1 comando. Ninguém precisa instalar nada na máquina."
related: [docker-multistage]
updated: 2026-04
---

## Setup mínimo

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: erp
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: erp_dev
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U erp"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 5

  mailhog:                              # captura e-mails em dev
    image: mailhog/mailhog
    ports: ["1025:1025", "8025:8025"]

volumes:
  pgdata:
```

`docker compose up -d` e pronto. App roda na máquina com hot reload, banco no container.

## App no compose? Depende

- **Não** se você está iterando muito (volume mount + reload tem caveats).
- **Sim** pra simular ambiente parecido com prod ou pra onboarding rápido.

Se incluir:

```yaml
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      target: build           # roda no stage de build pra dev
    command: pnpm --filter api dev
    volumes:
      - ./:/app
      - /app/node_modules     # evita sobrescrever node_modules do container
    ports: ["3001:3001"]
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://erp:dev@postgres:5432/erp_dev
      REDIS_URL: redis://redis:6379
```

## Profiles

Use profiles pra serviços opcionais (kafka, observability stack):

```yaml
  kafka:
    profiles: ["kafka"]
    image: bitnami/kafka:3.7
    ...
```

`docker compose --profile kafka up -d`.

## Inicialização

`init.sql` em `/docker-entrypoint-initdb.d/` cria DBs/usuários na primeira subida. Pra seed da app, use comando do app (`pnpm seed`).

## Telemetria local — opcional

Stack OTel local pra ver tracing dos seus serviços:

```yaml
  otel-collector:
    image: otel/opentelemetry-collector-contrib
    profiles: ["obs"]
    volumes: [./otel.yaml:/etc/otelcol/config.yaml]
    command: ["--config=/etc/otelcol/config.yaml"]

  jaeger:
    image: jaegertracing/all-in-one
    profiles: ["obs"]
    ports: ["16686:16686"]
```

## Como pedir pra IA

> "Crie docker-compose.yml pro nosso ERP local: Postgres 17, Redis 7, MailHog. Healthchecks. Volume persistente pro Postgres. Inclua profile `obs` com OTel Collector + Jaeger. Inclua exemplo de variáveis no `.env.example` (DATABASE_URL, REDIS_URL, etc). Documente comandos: `docker compose up -d`, `docker compose --profile obs up`, `docker compose down -v` (apaga volumes)."

## Auditoria

- [ ] Healthchecks em todo serviço crítico.
- [ ] App espera `postgres:service_healthy` antes de subir.
- [ ] Volume persistente nomeado pro Postgres (não anônimo).
- [ ] `.env.example` checked-in, `.env` no .gitignore.
- [ ] Sem porta exposta desnecessariamente em serviços só-internos.
- [ ] Versão major de cada imagem fixada (`:17`, não `:latest`).
- [ ] Comando documentado pra reset (`down -v && up`).
