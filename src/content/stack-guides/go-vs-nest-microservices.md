---
title: "Go vs NestJS pra microsserviços em 2026"
category: stack-guides
stack: [Go, NestJS]
tags: [microservices, performance]
excerpt: "Nest pra serviço de domínio com regra rica. Go pra serviço de alta performance/concorrência ou compute-heavy. Não troque tudo por modinha."
related: [microservices-quando-usar, nest-module-organization]
updated: 2026-04
---

## Onde Nest brilha

- Serviço com **lógica de negócio rica** (financeiro, fiscal, vendas) — DDD/Clean fica natural.
- Time já manda em TS — reutilização de código (zod schemas, types) com o Next.
- Ferramentas maduras: Drizzle/Prisma, BullMQ, class-validator, NestJS CLI.
- Iteração rápida em domínio que ainda muda.

## Onde Go brilha

- Serviço **alto throughput** (milhares de RPS), baixa latência, baixo footprint de memória.
- **Concorrência pesada** (consumer de fila, scraper, worker que faz fan-out massivo).
- **Stateful sem framework** (gateway, proxy, agente). Binário único, sem runtime.
- Compute-heavy (parsing, transformação) — GC mais previsível, paralelismo barato (goroutines).
- Quando você quer um serviço que **roda em qualquer lugar** sem dor de Node.

## Onde NÃO faz diferença real

- CRUD com regra simples. Tanto faz, escolha o que o time domina. Não troque por "Go é mais rápido" se a query no Postgres é o gargalo.
- Latência sub-50ms quando a chamada externa demora 200ms. Otimizar o errado.

## Tradeoffs concretos

| | Nest (Node) | Go |
|---|---|---|
| Performance bruta | boa, V8 + libs nativas | melhor (compilado, GC fino) |
| Latência cold start (serverless) | média | excelente |
| Memória | alta | baixa |
| DX | excelente (TS, ecossistema) | boa, mais verbosa |
| Bibliotecas pra ERP | vastas (auth, ORM, validação) | precisa montar mais |
| Time learning curve | TS é familiar | curva real, mas finita |
| Código compartilhado com Next | ✅ (zod, types) | ❌ (precisa OpenAPI/Buf) |

## Receita pragmática pra ERP

1. **Comece tudo em Nest**. Modular monolith.
2. Quando um módulo virar gargalo de performance que **realmente** justifica, **e** vai virar serviço, **avalie** Go.
3. Se for serviço de integração com filas pesadas, ou compute (transformação fiscal, geração de boletos em batch, parsing de XML em volume), Go vence.
4. Se for serviço de domínio com muita regra mutável, fica Nest.

Não tenha tudo em Go por estética. Polyglot tem custo (CI, padrões, contratos, deploy).

## Comunicação entre eles

- **HTTP + JSON** com OpenAPI gerado dos dois lados.
- **gRPC + Protobuf** se quer contrato forte e perf — mas exige investimento.
- **NATS / Kafka** pra eventos.

Se mistura linguagens, contrato versionado é obrigatório (não é mais "tipo TS" — é Protobuf, JSON Schema, ou similar).

## Como pedir pra IA

> "Avalie se o módulo X (descrição) deve virar microsserviço em Go. Critérios: throughput esperado, paralelismo, complexidade de domínio, time disponível, custo de polyglot. Se sim, esboço de estrutura pasta + libs Go (chi/echo, sqlc/pgx, zerolog, otel). Se não, mantenha em Nest e otimize ali."

## Anti-padrões

- "Vamos refatorar tudo pra Go pra escalar." Se Postgres é gargalo, mudança de linguagem não ajuda.
- "Cada microsserviço numa linguagem diferente". Time pequeno multiplicando dor.
- Go pra CRUD com 5 RPS porque "tá na moda".
