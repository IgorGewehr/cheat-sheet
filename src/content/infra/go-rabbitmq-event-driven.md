---
title: "Go + RabbitMQ: Eventos, Consumers e Backpressure"
category: infra
stack: [Go, RabbitMQ]
tags: [rabbitmq, event-driven, messaging, consumers, dlq, golang]
excerpt: "RabbitMQ em serviços Go: exchanges, queues, routing keys, acknowledgements, retries, DLQ, prefetch e consumers idempotentes."
related: [event-driven, background-jobs, go-outbox-idempotency]
updated: "2026-05-07"
---

## RabbitMQ não é só fila

RabbitMQ é broker de mensagens. O modelo mental correto envolve:

- exchange recebe mensagens;
- routing key ajuda a rotear;
- queue armazena mensagens;
- binding liga exchange e queue;
- consumer processa;
- ack confirma processamento.

Tipos comuns de exchange:

- `direct`: routing key exata;
- `topic`: padrões como `invoice.*`;
- `fanout`: broadcast para filas ligadas.

## Ack, nack e responsabilidade

Consumer só deve dar `ack` depois de concluir o efeito esperado. Se der `ack` antes e falhar no meio, a mensagem foi perdida.

Se falhou de forma temporária, use retry. Se falhou por payload inválido ou regra impossível, mande para DLQ.

DLQ, dead-letter queue, é uma fila para mensagens que não podem seguir o fluxo normal. Ela não é lixeira; é instrumento de operação.

## Prefetch é backpressure

Prefetch limita quantas mensagens não confirmadas o broker entrega ao consumer.

Se seu consumer usa Postgres e cada mensagem abre transação, prefetch precisa respeitar:

- pool de conexões;
- latência média;
- custo do handler;
- número de réplicas.

Sem prefetch, você cria concorrência sem governança.

## Consumer idempotente

RabbitMQ entrega pelo menos uma vez. "At least once" significa que duplicatas são possíveis. Então o handler precisa ser idempotente.

Estratégias:

- chave de idempotência no payload;
- tabela `processed_messages`;
- operação de domínio naturalmente idempotente;
- unique constraint no banco;
- Redis com TTL para deduplicação curta, quando perda depois do TTL é aceitável.

## Evento não é comando

Evento descreve algo que aconteceu: `InvoicePaid`.

Comando pede uma ação: `PayInvoice`.

Misturar os dois produz acoplamento ruim. Consumers de evento devem reagir a fatos, não depender de ordem mental escondida.

## Critério de domínio

Você dominou este card quando consegue desenhar exchange/queue/binding, configurar prefetch com intenção e provar que reprocessar a mesma mensagem não duplica efeito financeiro.
