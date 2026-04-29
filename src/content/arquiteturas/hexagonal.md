---
title: "Hexagonal / Ports & Adapters"
category: arquiteturas
stack: [NestJS, Go]
tags: [camadas, isolamento]
excerpt: "Versão \"menor\" da Clean Architecture. Núcleo de domínio, portas (interfaces) e adaptadores. Bom default pra microsserviços."
related: [clean-architecture, microservices-quando-usar]
updated: 2026-04
---

## O que é

O núcleo (domínio + casos de uso) fica no centro. Tudo que entra (HTTP, fila, CLI) entra por uma **porta de entrada**. Tudo que sai (banco, API externa, envio de e-mail) sai por uma **porta de saída**. Adaptadores implementam as portas.

Diferença pra Clean Architecture: hexagonal não obriga 4 camadas. Bastam 2 conceitos — **portas** (interfaces) e **adaptadores** (implementações). É o suficiente pra maioria dos serviços.

## Quando usar

- Microsserviço com escopo bem definido (ex: serviço fiscal, serviço de notificações).
- Você quer trocar facilmente: HTTP por gRPC, banco A por banco B, fila A por fila B.
- Quer testar o núcleo sem subir nada externo.

## Quando NÃO usar

- Apps quase 100% CRUD (vira boilerplate).
- Scripts / jobs simples.

## Estrutura típica

```
service-fiscal/
├── core/
│   ├── domain/
│   ├── usecases/
│   └── ports/
│       ├── in/   (driving ports — invocam o núcleo)
│       └── out/  (driven ports — núcleo invoca pra fora)
└── adapters/
    ├── in/
    │   ├── http/
    │   └── queue/
    └── out/
        ├── postgres/
        ├── sefaz-client/
        └── email-sendgrid/
```

## Como pedir pra IA

> "Estruture o microsserviço `fiscal` em ports & adapters. Núcleo conhece só TS puro. Porta de entrada `EmitirNFe` é invocada por adaptador HTTP e por adaptador de fila (consumer Kafka). Porta de saída `SefazClient` é interface; adaptador real bate na SOAP da SEFAZ, adaptador fake pra testes retorna XMLs canônicos. Inclua wiring com NestJS sem vazar Nest pro core."

## Como auditar

- [ ] `core/` não importa nada de Nest, Express, drivers de banco, SDKs externos.
- [ ] Cada adaptador implementa exatamente uma porta.
- [ ] Trocar adaptador = mudar uma linha no módulo de wiring.
- [ ] Existe um adaptador `in-memory` ou `fake` pra cada porta de saída, usado em testes.

## Anti-padrões

- Adaptador chamando outro adaptador (deveria passar pelo núcleo).
- Porta com tipos de framework (`Request` do Express vazando pra dentro).
- "Hexagonal" mas tudo numa pasta só sem fronteira real — vira nome bonito sem benefício.
