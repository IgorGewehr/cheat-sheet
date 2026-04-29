---
title: "Microsserviços — quando vale e quando NÃO vale"
category: arquiteturas
stack: [NestJS, Go, Docker]
tags: [escala, microservices]
excerpt: "A regra real em 2026 ainda é: comece com modular monolith. Microsserviços só quando dor de deploy, escala ou time forçar."
related: [modular-monolith, go-vs-nest-microservices, outbox-pattern, saga-pattern, observability]
updated: 2026-04
---

## Quando vale

- **Times independentes** (≥ 3 squads que querem deployar sem coordenação).
- **Perfis de carga muito diferentes** (um módulo precisa de 10x mais CPU/IO que o resto).
- **Tecnologias diferentes** justificadas (ex: serviço de processamento fiscal melhor em Go por concorrência, resto em Nest).
- **Isolamento de falha** crítico (queda do módulo de relatórios não pode derrubar venda).
- **Compliance/segurança** que exige isolamento físico.

## Quando NÃO vale (a maioria dos casos)

- Time pequeno. Microsserviço **multiplica problemas operacionais**: tracing, deploy, observabilidade, contratos, versionamento.
- "Pra escalar" sem ter problema real de escala. Postgres + Nest com índices certos aguenta MUITA empresa.
- "Porque é moderno". Não é. Modular Monolith bem feito é mais moderno hoje (DHH escreveu sobre, Shopify roda assim).

## O custo invisível

Cada microsserviço novo = +1 pipeline, +1 dashboard, +1 alerta, +1 contrato, +1 lugar pra autenticar, +1 lugar pra sincronizar deploy, +1 fonte de bug distribuído. Esse custo só compensa quando o benefício de isolamento é real.

## Heurística de extração

Quando você decidir extrair um módulo:

1. **Banco primeiro.** Schema separado ainda no mesmo Postgres. Veja se o módulo continua funcionando sem JOINs cruzados.
2. **API HTTP entre módulos.** Substitua chamadas de método por chamadas HTTP/gRPC ainda no mesmo deploy.
3. **Deploy separado** só quando 1+2 estiverem estáveis.

Pular passos = retrabalho garantido.

## Comunicação síncrona vs assíncrona

- **Síncrona (HTTP/gRPC)**: leitura, fluxo onde o usuário espera. Acoplamento temporal (se A está fora, B falha).
- **Assíncrona (fila/eventos)**: side effects, integração, processos que podem ser eventualmente consistentes. Default pra `module A acontece, module B reage`.

Em ERP, **maior parte das integrações entre módulos deve ser assíncrona** (NF emitida → contas a receber atualiza → estoque baixa). Use Outbox pra garantir consistência.

## Como pedir pra IA

> "Avalie se este módulo `relatórios` justifica virar microsserviço. Critérios: time independente? perfil de carga diferente? cadência de deploy diferente? Se sim, proponha plano em 3 passos: schema separado, API entre módulos, deploy separado. Se não, mantenha como módulo."

## Como auditar uma proposta de microsserviço

- [ ] Tem motivo técnico ou organizacional concreto, não "é mais moderno".
- [ ] Banco será separado também (microsserviço com banco compartilhado é monólito disfarçado).
- [ ] Existe estratégia de consistência (Outbox / Saga) onde precisa.
- [ ] Existe API Gateway / BFF na frente (não acopla cada cliente a cada serviço).
- [ ] Tracing distribuído (OTel) configurado **antes** de subir.
- [ ] Healthchecks, graceful shutdown, retries, circuit breaker pensados.

## Anti-padrões

- "Distributed monolith": N microsserviços que precisam ser deployados juntos pra qualquer mudança funcionar. Pior dos dois mundos.
- Microsserviços compartilhando banco. Em geral, errado.
- Microsserviço por entidade (`user-service`, `order-service`, `product-service`). Microsserviço deve ser por **bounded context**, não por entidade.
