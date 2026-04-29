---
title: "Observabilidade — OpenTelemetry + logs + Sentry"
category: infra
stack: [NestJS, Next.js, Go]
tags: [observability, otel, logs, monitoring]
excerpt: "Logs estruturados, traces distribuídos com OTel, métricas pra alertar, e Sentry pra erros. Sem isso, microsserviço é caixa preta."
related: [microservices-quando-usar]
updated: 2026-04
---

## Os três pilares

1. **Logs** — eventos discretos, contextualizados.
2. **Métricas** — séries temporais agregadas (latência, RPS, erros).
3. **Traces** — caminho de uma request pelo sistema.

OpenTelemetry (OTel) é o padrão. Em 2026, todo backend novo nasce com OTel desde o dia 1.

## Logs estruturados

Use **pino** (Node) ou **zerolog** (Go). NUNCA `console.log`.

```ts
import pino from "pino";
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "api", env: process.env.NODE_ENV },
});

logger.info({ pedidoId, clienteId, total }, "Pedido criado");
```

Regras:
- Sempre JSON.
- Inclua `traceId` (vem do OTel) pra correlacionar com traces.
- NÃO logue PII bruto (e-mail, CPF). Mascare.
- Não logue payloads gigantes (cuidado em controllers).

## OpenTelemetry — instrumentação

```ts
// instrumentation.ts (Next 15+ tem suporte direto via experimental.instrumentationHook)
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const sdk = new NodeSDK({
  serviceName: "api",
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();
```

Auto-instrumentation pega HTTP, Postgres, Redis, fetch automaticamente. Spans manuais quando precisa:

```ts
import { trace } from "@opentelemetry/api";
const tracer = trace.getTracer("billing");
await tracer.startActiveSpan("calcularImpostos", async (span) => {
  span.setAttribute("invoice.id", id);
  try { return await calcular(); }
  finally { span.end(); }
});
```

## Backends

- **Self-hosted**: OTel Collector → Jaeger/Tempo (traces) + Loki (logs) + Prometheus/Mimir (métricas) + Grafana.
- **Managed**: Datadog, New Relic, Honeycomb, Grafana Cloud, Sentry (também faz tracing leve).

Em ERP B2B começando: Grafana Cloud ou Sentry. Self-host só quando volume justificar custo de operação.

## Métricas que importam

Pra qualquer serviço web (RED):
- **R**ate (RPS).
- **E**rrors (erros / total).
- **D**uration (p50, p95, p99).

Pra workers/filas (USE):
- **U**tilization (uso do worker).
- **S**aturation (lag da fila).
- **E**rrors.

Por endpoint, por serviço, por tenant (ajuda detectar tenant ruidoso).

## Sentry pra erros

Sentry captura exceções com contexto, stack trace e session replay. Configure source maps pra ver erro no TS, não no JS minificado.

## Tracing distribuído entre serviços

Header `traceparent` (W3C). Auto-instrumentation propaga em fetch/HTTP. Em filas, propague manualmente nos headers da mensagem.

## Como pedir pra IA

> "Configure observabilidade no nosso Nest API: pino com base context (service, env, traceId), OTel auto-instrumentation (HTTP, Postgres, Redis, fetch), exporter OTLP pro Grafana Cloud (env vars OTEL_EXPORTER_OTLP_*). Sentry com source maps. Métricas custom: histograma de latência por endpoint, contador de erros por tipo de domain error. Ofereça spans manuais nos use cases que importam (cálculo de imposto, geração de relatório)."

## Auditoria

- [ ] Logs em JSON, com `traceId`.
- [ ] Sem `console.log` na codebase (lint regra).
- [ ] OTel rodando em todos os serviços.
- [ ] Exporter configurado (não fica spans só em memória).
- [ ] Métricas RED pra cada serviço HTTP.
- [ ] Alertas em p95 latência, taxa de erro, lag de fila.
- [ ] Sentry com source maps + filtragem de PII.
- [ ] Dashboards básicos no Grafana com filtro por tenant.
- [ ] Logs/traces NÃO contêm e-mails/CPF/senhas.

## Anti-padrões

- "A gente vê os logs no servidor via SSH". Não escala, não dura.
- Tracing só em prod, não em staging. Bug acha em prod pela primeira vez.
- Alertas barulhentos (todo erro pageia oncall) → fatiga, ignoram.
