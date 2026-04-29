---
title: "Clean Architecture aplicada com NestJS"
category: arquiteturas
stack: [NestJS]
tags: [camadas, ddd]
excerpt: "Quatro camadas com regra de dependência apontando pra dentro. No Nest, vira pasta domain/application/infrastructure/http."
related: [hexagonal, repository-pattern, use-cases, ddd-light-erp]
updated: 2026-04
---

## O que é

Quatro camadas concêntricas onde **as dependências só apontam pra dentro**:

1. **Domain** — entidades, value objects, regras puras. Sem `import` de framework, ORM, HTTP, nada.
2. **Application** — use cases (1 caso de uso = 1 classe). Orquestra entidades e fala com interfaces de infra.
3. **Infrastructure** — implementa as interfaces (Drizzle/Prisma repositórios, HTTP clients pra serviços externos, fila).
4. **Interface/HTTP** — controllers Nest, DTOs, pipes de validação. Conhece application, não conhece infra direto.

A regra de ouro: domain não importa nada de fora. Application importa só domain. Infra implementa interfaces que vivem em domain/application.

## Quando usar

- Lógica de negócio NÃO trivial (fórmulas fiscais, cálculo de comissão, regras complexas de aprovação).
- Você quer testar regras de negócio sem subir banco/Nest.
- Time vai crescer e precisa de fronteiras claras.

## Quando NÃO usar

- CRUD puro sem regra de negócio. Pra um módulo de "configurações" você não precisa de 4 camadas — basta um service que chama o repositório. Fingir Clean Arch em CRUD vira teatro.
- MVPs descartáveis.

## Estrutura no Nest

```
src/modules/financeiro/
├── domain/
│   ├── invoice.entity.ts        # entidade pura (TS class, sem decorators de ORM)
│   ├── money.vo.ts              # value object
│   └── ports/
│       └── invoice.repository.ts  # interface
├── application/
│   ├── create-invoice.usecase.ts
│   └── settle-invoice.usecase.ts
├── infrastructure/
│   ├── drizzle-invoice.repository.ts  # implementa InvoiceRepository
│   └── financeiro.module.ts            # bind interface → implementação
└── http/
    ├── invoice.controller.ts
    └── dtos/
```

## Como pedir pra IA

> "Crie o módulo `financeiro` em Clean Architecture com NestJS. A entidade `Invoice` deve ter regras: não pode quitar fatura cancelada, valor pago não pode exceder o total, etc — todas no domínio. Crie o use case `SettleInvoiceUseCase`. O repositório Drizzle implementa `InvoiceRepository` definido em `domain/ports`. O controller só faz parse do DTO e chama o use case. Inclua testes do domínio sem mocks (pure TS) e teste do use case com repositório fake em memória."

## Como auditar o que a IA gerou

- [ ] `domain/` não tem nenhum import de `@nestjs/*`, `drizzle-orm`, `prisma`, `pg`, ou qualquer infra.
- [ ] Use cases recebem repositórios via construtor (DI), não instanciam direto.
- [ ] A interface do repositório vive em `domain/ports`, **não** em `infrastructure`.
- [ ] Controllers não contêm lógica de negócio — só DTO → use case → resposta.
- [ ] Testes do domínio rodam em milissegundos sem subir nada.
- [ ] Sem entidades ORM "anêmicas" servindo como entidade de domínio. São coisas diferentes.

## Anti-padrões

- Misturar entidade ORM com entidade de domínio. Nunca dá certo a longo prazo — entidade ORM é coisa de infra.
- Use case que faz parsing de HTTP. Use case não sabe que existe HTTP.
- Repositório que retorna entidades ORM. Repositório retorna entidades de domínio.
