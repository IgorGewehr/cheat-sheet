---
title: "Go: Microsserviços Empresariais de Alto Valor"
category: arquiteturas
stack: [Go, Chi, PostgreSQL, RabbitMQ, Redis, Docker]
tags: [golang, microservices, enterprise, architecture, bounded-context]
excerpt: "Arquitetura para dois microsserviços Go de alto valor: boundaries, dados por serviço, APIs, eventos, idempotência, operação e governança técnica."
related: [microservices-quando-usar, modular-monolith, go-outbox-idempotency]
updated: "2026-05-07"
---

## O que muda quando o serviço custa caro

Em projeto de centenas de milhares de dólares, o problema não é só "fazer endpoint". O sistema precisa sobreviver a:

- mudança de requisito;
- auditoria;
- falha parcial;
- deploy gradual;
- concorrência;
- incidentes;
- entrada de novos devs;
- integração com outros sistemas.

Go ajuda, mas não substitui arquitetura.

## Boundary de serviço

Microsserviço deve representar uma capacidade de negócio com dados próprios. Não divida por tabela nem por controller.

Bons candidatos:

- billing;
- identity;
- notifications;
- ledger;
- document processing;
- risk analysis.

Mau sinal:

- `user-crud-service`;
- `reports-service` lendo banco de todo mundo;
- serviço que só existe porque "microservices é moderno".

## Banco por serviço

Cada serviço deve possuir seu schema/dados. Outro serviço não deve ler tabelas internas diretamente.

Integração acontece por:

- API HTTP;
- eventos;
- views/projeções específicas;
- contratos versionados.

## Comunicação

Use HTTP quando precisa de resposta imediata e consistência de interação.

Use eventos quando algo aconteceu e outros contextos podem reagir.

Exemplo:

- Billing expõe `POST /v1/invoices`.
- Billing publica `InvoiceCreated`.
- Notification consome e envia e-mail.
- Ledger consome e cria lançamento contábil.

## Governança mínima

Cada serviço deve ter:

- OpenAPI;
- README operacional;
- migrations;
- Dockerfile;
- Compose local;
- health/readiness;
- logs estruturados;
- testes unitários e integração;
- checklist de produção;
- ADRs para decisões relevantes.

## Critério de domínio

Você dominou este card quando consegue defender por que dois serviços devem ser separados, qual dado cada um possui e como eles continuam corretos quando RabbitMQ, Redis ou outro serviço falha.
