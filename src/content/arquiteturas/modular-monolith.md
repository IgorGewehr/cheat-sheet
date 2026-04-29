---
title: "Modular Monolith — comece aqui"
category: arquiteturas
stack: [NestJS, Next.js, PostgreSQL]
tags: [erp, ponto-de-partida]
excerpt: "O default certo pra ERP novo. Deploy único, módulos isolados, fácil de fatiar em microsserviços depois quando doer."
related: [microservices-quando-usar, ddd-light-erp, nest-module-organization]
updated: 2026-04
---

## O que é

Um único deploy/processo, mas o código é organizado em **módulos com fronteiras explícitas**: cada módulo tem seus próprios models, services, eventos e expõe só uma API pública pros outros. Por dentro pode ter sub-pastas (controller, application, domain, infra), por fora o resto da app só fala com ele através de uma interface bem definida.

Não é "monólito espaguete". É "microsserviços sem o overhead de microsserviços".

## Quando usar

- Time pequeno (≤ 8 devs).
- Domínio ainda mudando (ERP em evolução, novos módulos sendo descobertos).
- Você não tem orçamento de infra/observabilidade pra rodar 10+ serviços direito.
- Você quer transações ACID entre boa parte das tabelas (financeiro × estoque × fiscal frequentemente compartilham consistência forte).

## Quando NÃO usar

- Times realmente grandes onde múltiplas squads precisam fazer deploy independente.
- Módulos com perfis de carga drasticamente diferentes (ex: integração fiscal que precisa escalar 10x mais que o resto).
- Requisitos legais/regulatórios que forçam isolamento físico (raro em ERP).

## Como pedir pra IA

> "Crie um módulo `financeiro` no nosso monorepo NestJS seguindo Modular Monolith. Estrutura: `src/modules/financeiro/{domain, application, infrastructure, http}`. O módulo só expõe `FinanceiroPublicApi` (interface) pros outros módulos consumirem via DI. Sem importar nada de outro módulo direto, sempre via interface pública. Use Drizzle pro repositório. Inclua um exemplo de evento de domínio publicado quando uma fatura é criada."

## Como auditar o que a IA gerou

- [ ] Outros módulos importam só a `*PublicApi`, nunca arquivos internos do módulo.
- [ ] Entidades de domínio não dependem de Nest, ORM ou framework HTTP.
- [ ] O `*Module` Nest exporta APENAS a `PublicApi`, esconde tudo o resto.
- [ ] Existem testes que falham se outro módulo tentar acessar arquivos privados (regra de import — eslint rule ou madge).
- [ ] Tabelas do banco têm prefixo do módulo (`fin_invoices`, não `invoices`) pra deixar fronteira clara, ou estão em schemas separados.
- [ ] Não há `JOIN` SQL cruzando fronteiras de módulos (financeiro NUNCA faz JOIN com tabelas de RH; busca via PublicApi do RH).

## Caminho de migração pra microsserviços

Quando um módulo doer (deploy/escala/time), você extrai PRIMEIRO o banco (schema separado → DB separado), DEPOIS o serviço HTTP. Como já estava bem fronteirizado, a extração é mecânica.

## Anti-padrões

- "Monólito modular" mas com um único banco onde todo mundo dá `SELECT` em qualquer tabela: **isso não é modular, é só monólito**. A fronteira do banco é tão importante quanto a do código.
- Compartilhar entidades ORM entre módulos. Cada módulo tem suas próprias entidades, mesmo que duas representem o mesmo conceito (`User` no auth ≠ `User` no financeiro — financeiro tem só `id` + `nome`).
