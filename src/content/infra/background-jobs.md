---
title: "Background jobs — BullMQ, queues, workers"
category: infra
stack: [NestJS, Redis, BullMQ]
tags: [jobs, queues, async]
excerpt: "Trabalho que demora ou pode falhar fora do request HTTP. BullMQ pra Node é o default em 2026. Sempre idempotente, sempre observável."
related: [outbox-pattern, observability]
updated: 2026-04
---

## O que vai pra fila

- E-mails (envio).
- Geração de relatório/PDF.
- Integração externa (sefaz, gateways de pagamento) com retry.
- Processamento de evento do outbox.
- Recálculos pesados (estoque consolidado, fechamento mensal).

Regra: se demora > 1s ou pode falhar e precisar retry, vai pra fila.

## BullMQ — base

```ts
import { Queue, Worker } from "bullmq";

export const emailQueue = new Queue("email", { connection: redis });

new Worker("email", async (job) => {
  await sendEmail(job.data);
}, {
  connection: redis,
  concurrency: 10,
  limiter: { max: 100, duration: 1000 },  // rate limit
});
```

Adiciona job:
```ts
await emailQueue.add("verify-email", { to, link }, {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 7 * 24 * 3600 },
});
```

## Idempotência obrigatória

Jobs podem rodar 2x (retry, restart, fila duplicada). Worker precisa ser seguro:

- Use `jobId` pra dedup (`add(name, data, { jobId })`).
- No worker, antes de fazer side effect, cheque `processed_jobs(job_id PK)` ou state do recurso (já enviado? já gerado?).

## Workers separados ou no mesmo processo?

- **Mesmo processo (API + worker)**: simples, mas worker compete CPU com requests.
- **Workers separados** (`apps/workers`): recomendado em produção. Escala diferente, deploys independentes.

## Retry e dead-letter

- Configure `attempts` + `backoff`.
- Em falha definitiva, job vai pra "failed". Não fica órfão.
- Tenha alerta em failed > N por minuto.

## Visualização

`@bull-board/express` (ou `bull-board/nestjs`) pra dashboard simples. Em produção, restrinja por auth de admin.

## Filas vs Cron

- **Cron / scheduled**: tarefas periódicas (refresh materialized view, limpar tokens expirados). BullMQ tem `repeatable` jobs nativos.
- **Filas reativas**: dispara em resposta a evento.

Combine: cron coloca job na fila quando hora chegar.

## Quando não usar BullMQ

- Workflow longo com muitos passos e estado (use Temporal).
- Stream de eventos massivos com replay (Kafka).

BullMQ é ótimo pro caso comum: jobs curtos a médios, retry, scheduled.

## Como pedir pra IA

> "Crie módulo de jobs em Nest com BullMQ: filas `email`, `report`, `sefaz`. Workers com concurrency e rate limit por fila. Cada job tem `jobId` determinístico (idempotência). Retry exponencial. Dead-letter handler que loga + cria ticket interno. Bull Board exposto em `/admin/jobs` com auth. Job exemplo: `GerarRelatorioFinanceiro(tenantId, mes)` que produz PDF e salva no storage."

## Auditoria

- [ ] Workers são idempotentes (rodar 2x não dobra efeito).
- [ ] `jobId` determinístico onde faz sentido.
- [ ] `attempts` + `backoff` configurados.
- [ ] Métrica de fila (depth, processing rate, fail rate) no dashboard.
- [ ] Alerta em fila travada (depth > X) e em fail rate.
- [ ] Tracing OTel propaga do request que enfileira pro worker que executa.
- [ ] Dashboard de jobs com auth.
- [ ] Workers em deploy separado em produção.

## Anti-padrões

- Worker que faz side effect e depois grava no DB. Falha entre os dois = inconsistência. Inverta: grava (idempotente) + side effect baseado nele.
- Job com payload gigante. Salve só ID, worker busca dado.
- Sem rate limit chamando API externa que tem limite.
