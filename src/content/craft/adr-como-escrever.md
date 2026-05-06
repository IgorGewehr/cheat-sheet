---
title: "ADR — Architecture Decision Record"
category: craft
stack: [NestJS, TypeScript]
tags: [adr, decisão-arquitetural, documentação, rfc, staff]
excerpt: "ADR documenta por que uma decisão foi tomada, não só o que foi decidido. Sem isso, daqui a 6 meses ninguém sabe o motivo — incluindo você."
related: [nest-module-organization, ddd-light-erp, como-escrever-cards-brain, modular-monolith]
updated: "2026-05"
---

## O que é e por que importa

Um ADR registra uma decisão arquitetural significativa: o contexto, as opções consideradas, a escolha feita e as consequências. Não é documentação de código — é documentação de raciocínio.

Sem ADR: daqui a 6 meses alguém pergunta "por que usamos Drizzle e não Prisma?" e ninguém sabe. Com ADR: você lê o documento de 1 página e entende o trade-off completo.

**Quando criar um ADR:**
- Mudança de banco, ORM ou stack
- Escolha de padrão arquitetural (monolito vs microserviços, DDD vs scripts)
- Decisão de segurança (JWT vs cookie de sessão)
- Troca de biblioteca com impacto amplo

**Quando NÃO criar:** decisões reversíveis de baixo impacto (nome de variável, ordem de campos).

---

## Formato MADR (Markdown Architectural Decision Records)

```markdown
# ADR-001: Drizzle como ORM primário

**Data:** 2026-05-01  
**Status:** Aceito  
**Deciders:** Igor, equipe backend

## Contexto

Precisamos de um ORM para o módulo financeiro do Brain. O projeto usa 
PostgreSQL com multi-tenant e precisa de type safety completa com TypeScript.

## Opções consideradas

| Critério              | Drizzle         | Prisma          |
|-----------------------|-----------------|-----------------|
| Runtime overhead      | Nenhum          | Rust engine     |
| Edge compatibility    | ✅ Nativo       | ⚠️ Limitado     |
| Multi-schema          | ✅ Suporte direto | Trabalhoso     |
| Migrations maduras    | Boa (2025+)     | Muito maduras   |
| DX para queries SQL   | Alta (SQL-like) | Alta (API fluente) |
| Curva de aprendizado  | Média           | Baixa           |

## Decisão

**Drizzle ORM** — escolhido por zero runtime overhead, suporte nativo a 
multi-schema (crítico para multi-tenant municipal) e SQL-like API que 
mantém o desenvolvedor próximo do banco.

## Consequências

**Positivas:**
- Queries tipadas sem camada de abstração adicional
- Schema em TypeScript puro — sem DSL separado
- Migrations geradas via drizzle-kit

**Negativas / Riscos:**
- Ecossistema menor que Prisma (menos plugins, menos exemplos)
- Drizzle-kit ainda não tem GUI avançada como Prisma Studio

## Revisão

Reavaliar em 12 meses se o ecossistema não evoluir ou se Prisma lançar 
suporte nativo a multi-schema equivalente.
```

---

## Onde guardar

```
docs/
  adr/
    001-drizzle-orm.md
    002-nestjs-modular-monolith.md
    003-jwt-vs-cookie-sessao.md
  README.md   ← lista com link e status de cada ADR
```

Commitados junto com o código no mesmo repositório. Revisados como código em pull request.

---

## Status válidos

| Status | Significado |
|---|---|
| `Proposto` | Em discussão, ainda não decidido |
| `Aceito` | Decisão tomada, em vigor |
| `Depreciado` | Era válido, foi substituído |
| `Supersedido por ADR-XXX` | Substituído por decisão mais recente |

---

## ADR em entrevista sênior

Sênior que escreve ADRs mostra:
1. Considerou opções — não escolheu por hábito
2. Documentou trade-offs — time pode contestar com informação
3. Tem consciência de consequências — inclusive as negativas

Entrevistador típico: *"Como você documenta decisões arquiteturais?"*  
Resposta fraca: *"A gente coloca no Confluence."*  
Resposta forte: *"Usamos ADRs no repositório, com contexto, opções e trade-offs explícitos. Qualquer decisão significativa tem um documento que sobrevive à saída de pessoas do time."*

---

## Como pedir pra IA

> "Escreva um ADR no formato MADR para a decisão de usar NestJS modular monolith em vez de microsserviços para o sistema Brain. Contexto: time de 1-2 devs, domínios ainda sendo descobertos, deploy em VPS único. Inclua: 3 opções consideradas (monolito simples, modular monolith, microsserviços), critérios de decisão, consequências positivas e negativas, critério de revisão em 18 meses."

## Auditoria

- [ ] Toda decisão de stack tem um ADR em `docs/adr/`.
- [ ] ADRs são PRs — revisados como código.
- [ ] Status atualizado quando decisão muda.
- [ ] Índice em `docs/adr/README.md` com link e status de cada um.

## Anti-padrões

- ADR escrito depois da implementação sem mencionar as opções que foram descartadas.
- "Decisão: usar X porque é melhor" — sem contexto, sem trade-offs, inútil.
- ADR em Confluence/Notion desacoplado do repositório — some quando o time migra de ferramenta.
- Nunca revisar ADRs antigos — decisões de 2023 ficam vigentes em 2026 por inércia.
