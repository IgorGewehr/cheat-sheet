---
title: "Go: Logs com Zap/Zerolog e Observabilidade"
category: infra
stack: [Go, Zap, Zerolog, OpenTelemetry]
tags: [observability, logging, tracing, metrics, slog, golang]
excerpt: "Observabilidade em Go para produção: logs estruturados, correlation id, Zap ou Zerolog, métricas, traces e diagnóstico sob pressão."
related: [observability, opentelemetry-observabilidade, go-benchmarks-profiling]
updated: "2026-05-07"
---

## Observabilidade é capacidade de resposta

Observabilidade não é instalar dashboard. É conseguir responder durante incidente:

- o que falhou?
- quando começou?
- quantos usuários afetou?
- qual dependência degradou?
- houve retry, timeout ou saturação?
- qual request causou o erro?

## Logs estruturados

Zap e Zerolog produzem logs em campos, não frases soltas.

```go
logger.Info("invoice paid",
	zap.String("invoice_id", inv.ID),
	zap.String("customer_id", inv.CustomerID),
	zap.Int64("amount_cents", inv.Total.Cents),
	zap.String("request_id", requestID),
)
```

Logs estruturados permitem busca, agregação e alerta.

## Níveis de log

- `debug`: detalhes de desenvolvimento.
- `info`: eventos normais importantes.
- `warn`: algo estranho, mas recuperável.
- `error`: falha que precisa investigação.
- `fatal`: processo vai encerrar.

Não logue secrets, tokens, senhas, documentos sensíveis ou payload financeiro inteiro sem política clara.

## Correlation ID

Cada request deve ter identificador propagado:

- log;
- trace;
- evento publicado;
- chamada HTTP interna.

Isso permite reconstruir caminho entre serviços.

## Métricas e traces

Use métricas para tendência e alerta:

- taxa de requests;
- taxa de erro;
- duração;
- tamanho de fila;
- retries;
- conexões do pool.

Use traces para caminho de uma operação:

- HTTP handler;
- use case;
- query PostgreSQL;
- publish RabbitMQ;
- chamada externa.

## Critério de domínio

Você dominou este card quando consegue debugar uma falha sem abrir o código primeiro, usando request id, logs, métricas e trace para formar hipótese.
