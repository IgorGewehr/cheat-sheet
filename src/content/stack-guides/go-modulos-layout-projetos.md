---
title: "Go: Módulos e Layout de Projetos Empresariais"
category: stack-guides
stack: [Go]
tags: [golang, project-layout, modules, internal, architecture]
excerpt: "Como organizar um serviço Go sem copiar boilerplate cego: módulos, packages, cmd, internal, migrations, api e boundaries que sobrevivem ao crescimento."
related: [go-primeiros-passos, go-clean-hexagonal, golang-microservices]
updated: "2026-05-07"
---

## O problema real

Layout de projeto em Go vira religião rápido. O critério sênior não é "qual template famoso usar", mas se a estrutura torna dependências óbvias, reduz acoplamento e facilita evolução.

Um microsserviço empresarial precisa separar:

- entrypoints executáveis;
- domínio e casos de uso;
- adaptadores HTTP, banco, fila e cache;
- contratos OpenAPI;
- migrations;
- scripts operacionais;
- testes de integração.

## Layout recomendado para sua stack

```text
billing-service/
  cmd/
    api/
      main.go
    worker/
      main.go
  internal/
    app/
      invoice/
        create_invoice.go
        pay_invoice.go
    domain/
      invoice.go
      money.go
      errors.go
    adapters/
      http/
        router.go
        handlers.go
        middleware.go
      postgres/
        db.go
        invoice_repository.go
      rabbitmq/
        publisher.go
        consumer.go
      redis/
        idempotency.go
    config/
      config.go
    observability/
      logger.go
      tracing.go
  api/
    openapi.yaml
  db/
    migrations/
    query/
      invoices.sql
  docker/
  docker-compose.yml
  go.mod
  sqlc.yaml
```

## `cmd/`

`cmd/` contém entrypoints. Cada subpasta deve ser um executável pequeno que faz wiring:

1. carrega config;
2. abre conexões;
3. cria repositories;
4. cria use cases;
5. sobe servidor ou worker;
6. trata shutdown.

Evite colocar regra de negócio em `main.go`. `main` é composição, não domínio.

## `internal/`

`internal/` é especial em Go: packages dentro dele só podem ser importados por código dentro do módulo pai. Isso protege o serviço de virar biblioteca acidental.

Para microsserviço, prefira `internal/` como padrão. Use `pkg/` apenas se você realmente quer expor uma biblioteca para outros módulos. Em produto empresarial, isso é mais raro do que parece.

## Packages por capacidade, não por camada genérica

Um erro comum é criar `controllers`, `services`, `repositories`, `models` globais. Isso cresce como gaveta bagunçada.

Prefira agrupar por domínio ou capacidade:

```text
internal/app/invoice
internal/app/customer
internal/adapters/postgres
internal/adapters/http
```

O domínio fica no centro; adaptadores orbitam.

## Nomes importam

Em Go, o nome do package aparece no uso:

```go
postgres.NewInvoiceRepository(pool)
invoice.NewCreateUseCase(repo)
```

Evite package `utils`, `common`, `helpers`. Eles escondem responsabilidade. Se algo é de tempo, chame `clock`. Se é de dinheiro, chame `money`. Se é idempotência, chame `idempotency`.

## Critério de domínio

Você dominou este card quando consegue justificar cada pasta pela direção de dependência e consegue impedir que o projeto vire um CRUD gigante com packages genéricos.
