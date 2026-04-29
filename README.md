# brain — cheat sheet de engenharia pra dev que usa muita IA

Webapp pessoal (sem login) que serve como "segundo cérebro" pra lembrar padrões, arquiteturas, prompts e checklists antes de pedir/auditar código gerado por IA. Foco em ERP B2B, stack Next.js + NestJS + Postgres + microsserviços.

## Stack

- **Next.js 15** (App Router, RSC).
- **Tailwind v3** + componentes minimais inline.
- **Firebase** (anonymous auth + Firestore) — sem login na UI, mas dado protegido por auth anônima.
- **Markdown + frontmatter** (`gray-matter` + `react-markdown` + `remark-gfm`) pros cards.

## Conceitos

- **Cards**: arquivos `.md` em `src/content/<categoria>/<slug>.md`. São a fonte da verdade do conhecimento. Editáveis via PR (revisão mensal).
- **Workspace**: cada navegador gera um UUID guardado no `localStorage`. Tudo que você grava (projetos, módulos, padrões adotados) fica em `workspaces/{workspaceId}/...` no Firestore.
- **Compartilhar com colega**: copia o ID do workspace na tela `/workspace`, ele cola lá no navegador dele, e vocês passam a ver os mesmos dados.

## Setup local

```bash
pnpm install   # ou npm install
pnpm dev
```

Abre `http://localhost:3000`.

### Pré-requisito: habilitar auth anônima no Firebase

No console do Firebase do projeto `facilito-9f70c`:
1. **Authentication → Sign-in method → Anonymous → Enable**.
2. **Firestore → Rules**: cole o conteúdo de `firestore.rules` deste repo.

Sem isso, a app vai falhar ao tentar gravar.

## Estrutura

```
src/
├── app/                      # rotas (App Router)
├── components/               # UI base + nav
├── content/                  # cards .md (a parte que importa)
│   ├── arquiteturas/
│   ├── auth/
│   ├── padroes-frontend/
│   ├── padroes-backend/
│   ├── banco/
│   ├── stack-guides/
│   ├── infra/
│   ├── prompts/
│   └── checklists/
└── lib/                      # firebase, db, content loader, types
```

## Adicionar um card novo

Crie `src/content/<categoria>/<slug>.md`:

```md
---
title: Título do card
category: arquiteturas
stack: [NestJS, PostgreSQL]
tags: [erp, multi-tenant]
excerpt: Resumo de 1 linha.
related: [slug-de-outro-card]
updated: 2026-04
---

## O que é
...
## Quando usar
...
## Como pedir pra IA
...
## Como auditar
- [ ] item 1
- [ ] item 2
```

`pnpm dev` recarrega.

## Backup

Em `/workspace`, botão **Exportar JSON** baixa tudo do seu workspace (projetos, módulos, adoções, decisões). **Importar JSON** restaura.

## Deploy

Vercel free tier funciona perfeitamente. Conecte o repo, sem variáveis de ambiente necessárias (Firebase config é público).

## Limitações conscientes (por design)

- Sem login = qualquer um com seu workspace ID consegue ler/escrever. UUID v4 não é enumerável na prática, mas trate o ID como "senha leve".
- Sem RAG/auto-update — conteúdo é versionado em git, revisão é manual.
- Sem detecção automática de stack lendo seus repos — você marca à mão.

## Roadmap (sugestões pra evoluir depois)

- Tela de "Decisões" (ADRs) por projeto.
- Filtro full-text na biblioteca.
- Score de "saúde" do projeto baseado em padrões adotados / não adotados.
- Markdown rendering com syntax highlighting (Shiki).
- "Linhar" cards (gráfico de relacionamentos).
