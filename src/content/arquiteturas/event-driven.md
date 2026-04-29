---
title: "Event-Driven Architecture"
category: arquiteturas
stack: [NestJS, PostgreSQL]
tags: [eventos, integração]
excerpt: "Módulos reagem a fatos do passado em vez de chamarem uns aos outros. Reduz acoplamento, mas exige outbox e eventos versionados."
related: [outbox-pattern, saga-pattern, modular-monolith, cqrs-lite]
updated: 2026-04
---

## O que é

Em vez de `FaturamentoService.criarFatura(...)` chamar diretamente `EstoqueService.baixarItens(...)`, o módulo de faturamento publica um **evento** `FaturaCriada` e quem se interessa (estoque, contas-a-receber, fiscal) consome.

Tipos:
- **Eventos de domínio** (in-process): publicados/consumidos no mesmo processo. Ótimos pra modular monolith.
- **Eventos de integração** (cross-process): vão pra um broker (Kafka, RabbitMQ, NATS) e outros serviços consomem.

## Quando usar

- Múltiplos módulos reagem ao mesmo fato.
- Side effects que podem ser eventualmente consistentes (envio de e-mail, integração externa, cache invalidation).
- Quer permitir que módulos novos "ouçam" eventos existentes sem editar o produtor.

## Quando NÃO usar

- Quando você precisa do resultado da operação ANTES de responder ao usuário (use chamada síncrona).
- Quando consistência forte é obrigatória entre passos (use transação, não evento).
- Quando o receptor é o único interessado (chamada direta é mais simples — não vire tudo evento por dogma).

## Eventos como contrato

Eventos publicados são **contrato público**. Mudar significa quebrar consumidores. Versione (`FaturaCriadaV1`, `FaturaCriadaV2`) e suporte ambos por um tempo, ou use schemas evolutivos (Avro, Protobuf, JSON Schema).

Boas propriedades de evento:
- Nome no passado: `FaturaCriada`, `PagamentoConfirmado`. Não `CriarFatura` (isso é comando).
- Imutável.
- Carrega o suficiente pro consumidor agir sem ter que ligar de volta no produtor (mas evite carregar TUDO — só o necessário).
- Tem `id` único, `occurredAt`, `aggregateId`, `version`.

## Garantias

- **At-least-once** é o padrão (consumidores precisam ser idempotentes).
- Use **Outbox Pattern** pra publicar evento e gravar no banco atomicamente.
- Use **inbox/dedup** no consumidor pra ignorar reentregas.

## Como pedir pra IA

> "Implemente eventos de domínio in-process no nosso modular monolith Nest. Crie um `EventBus` simples (não use `@nestjs/cqrs` ainda). Quando uma fatura é criada, publique `FaturaCriada {id, clienteId, total, dataEmissao}`. Crie handler em `contas-receber` que cria um lançamento. Garanta que o handler roda na MESMA transação do banco (ou via Outbox se for cross-module com transações separadas)."

## Como auditar

- [ ] Eventos têm nome no passado e payload mínimo necessário.
- [ ] Cada evento tem `id`, `occurredAt`, `aggregateId`, `version`.
- [ ] Consumidores são idempotentes (rodar 2x não dobra o efeito).
- [ ] Há outbox onde produção de evento + escrita no banco precisam ser atômicos.
- [ ] Nenhum consumidor depende de ordem de chegada entre tipos de eventos diferentes (ou se depende, está documentado e há mecanismo).
- [ ] Eventos não vazam detalhes internos do produtor (ex: nome de coluna do banco).

## Anti-padrões

- Evento como "request-response disfarçado" (publica e fica esperando outro evento de volta — vira RPC torto).
- Acoplar handler do consumidor à estrutura interna do produtor.
- Esquecer idempotência. Vai dobrar lançamento financeiro um dia.
