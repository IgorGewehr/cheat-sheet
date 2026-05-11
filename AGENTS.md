# Brain — AGENTS.md

Ferramenta pessoal de Igor para **reconstruir engenharia real na era da IA generativa**. Dois eixos: evitar slop/código sem governança, e se preparar para o mercado de trabalho sênior/AI-era.

## Stack

- **Next.js 15** (App Router, RSC, Server Actions) + **React 19** + **TypeScript strict**
- **Firebase 11** — Auth (email/password) + Firestore (client-side, workspace-scoped)
- **OpenAI SDK** — `src/lib/openai.ts` — três tiers de modelo (ver abaixo)
- **Tailwind CSS v3** — tokens Solo Leveling em `src/app/globals.css`
- `npm run dev` — servidor local. `npm run build` para checar erros antes de commitar.

## Estrutura

```
src/
  app/              # Next.js App Router — páginas e API routes
    api/ai/         # Endpoints IA (POST, usa MODELS.*)
    api/cli/        # Endpoints CLI/Codex (sem Firebase, retornam texto ou JSON)
    api/idle/       # Idle Companion
    api/decisoes/
    api/projects/
    api/squad/
  components/       # Componentes React reutilizáveis
  content/          # Cards markdown (175+) em 16 categorias
  hooks/            # React hooks
  lib/              # Lógica central (db, types, openai, srs, etc.)
```

## Modelos OpenAI — `src/lib/openai.ts`

| Tier | Modelos | Quando usar |
|------|---------|-------------|
| `MODELS.review` / `.briefing` / `.revisor` / `.warGame` / `.systemDesign` / `.mockInterview` / `.rfc` / `.refatoracao` / `.interrogatorio` | `gpt-5.5` | Raciocínio profundo, avaliação, comparação |
| `MODELS.enhance` / `.explain` / `.adr` / `.card` / `.cardDodia` / `.mentoria` / `.antiPattern` / `.retrospectiva` / `.star` | `gpt-5.4` | Geração de conteúdo, explicação |
| `MODELS.suggest` | `gpt-5.4-mini` | Tarefas rápidas, sugestões |

Sempre usar `MODELS.<chave>` — nunca hardcodar string de modelo.

## Cards de conteúdo — `src/content/`

Cada card é um arquivo `.md` com frontmatter obrigatório:

```markdown
---
title: Título do Card
category: arquiteturas          # ver CardCategory em src/lib/types.ts
stack: [NestJS, PostgreSQL]
tags: [event-sourcing, cqrs]
excerpt: Uma linha descrevendo o card.
related: [outro-card-slug]
updated: "2026-05-03"
---

Conteúdo markdown aqui.
```

**Categorias válidas** (`CardCategory`): `arquiteturas`, `auth`, `padroes-frontend`, `padroes-backend`, `banco`, `stack-guides`, `infra`, `testes`, `prompts`, `checklists`, `armadilhas-ia`, `craft`, `agentes-ia`, `data-science`, `matematica`, `govtech`.

O slug é derivado do nome do arquivo (sem `.md`). O loader em `src/lib/content.ts` faz cache em memória — sem necessidade de registrar novos cards em nenhum arquivo de índice.

## Trilhas de jobs — `src/lib/jobs-tracks.ts`

11 trilhas implementadas (`JOB_TRACKS: JobTrack[]`). Para adicionar uma nova trilha, seguir a interface `JobTrack` em `src/lib/jobs-types.ts`:

```ts
{
  slug: "nova-trilha",
  titulo: "...",
  papel: "...",
  categoria: "engenharia" | "dados" | "ia" | "seguranca" | "pesquisa" | "govtech",
  nivelAlvo: "junior" | "pleno" | "senior" | "staff",
  resumo: "...",
  preRequisitos: string[],
  marcos: JobTrackMilestone[],   // cada marco tem: id, titulo, tipo, descricao, cardSlug?
  projetoPortfolio: { titulo, descricao, entregaveis },
  preparacaoEntrevista: { topicos, rotasMock, perguntasComuns },
}
```

SSG via `generateStaticParams` em `src/app/jobs/[slug]/page.tsx` — build gera página estática por trilha.

## Firestore — padrão de acesso

Toda a persistência client-side fica em `src/lib/db.ts` (workspace-scoped) e `src/lib/squad-db.ts` (squad-scoped).

**Padrão**: todos os documentos ficam em `/workspaces/{workspaceId}/{colecao}/{id}`. O `workspaceId` vem de `getWorkspaceId()` de `src/lib/workspace.ts`.

**Auth**: `ensureSignedIn()` de `src/lib/firebase.ts` — lança `AuthRequiredError` se não houver usuário. A UI captura e abre o modal de login.

**Coleções existentes**: `projetos`, `modulos`, `adocoes`, `decisoes`, `checklistSessions`, `customCards`, `comparacoes`, `cardDoDia`, `dividas`, `retrospectivas`, `sprintsSemIA`, `errosPersonais`, `experienciasSTAR`, `systemDesigns`, `mockInterviews`, `rfcSessions`, `warGames`, `revisoesCodigo`, `trilhaProgresso`, `idleSessions`, `questSessions`, `awakeningSessions`, `entryTrailProgress`, `sentinelaSessions`, `disciplinasMat`, `mathQuestRuns`, `jobTrackProgress`.

Para adicionar uma coleção nova: adicionar o nome em `ColName` em `db.ts`, criar funções CRUD seguindo o padrão existente, e adicionar as regras de segurança em `firestore.rules`.

## API routes

**Routes IA** (`src/app/api/ai/`): recebem POST com JSON, chamam OpenAI com `MODELS.*`, retornam JSON estruturado. Devem usar `response_format: { type: "json_object" }` quando o payload de retorno for tipado.

**Routes CLI** (`src/app/api/cli/`): anônimas (sem Firebase), aceitam `format=text` para retorno legível no terminal. Padrão: `GET` retorna descrição do endpoint, `POST` executa a operação.

## Gamificação Solo Leveling

**Hunter Ranks**: `HUNTER_RANKS` em `src/lib/types.ts` — E (Despertado) → D → C → B → A → S → Monarca. `LEVELS` no dashboard é alias de `HUNTER_RANKS`.

**Radar stats**: 11 eixos (STR/AGI/INT/VIT/PER/SEN/TEN/WIL/ARC/LOG/MAT). `computeRadarAxes()` em `src/components/radar-chart.tsx` — calcula score por categoria de cards + decay tiered (>30 dias: -10%, >60 dias: -20%).

**Mana Points**: 100 MP/dia, reset à meia-noite. `consumeMana(n)` retorna `boolean`. Usado em `/math-quest` (-10 MP por dica socrática).

**Tokens CSS** (em `globals.css`): `.hunter-window`, `.hunter-glow-cyan`, `.hunter-text-system`, `.hunter-divider`. Componente `<SystemWindow>` em `src/components/system-window.tsx` para painéis com aesthetic SL.

## Regras de desenvolvimento

- **Sentinela antes de aceitar código IA**: `/sentinela` ou `POST /api/cli/sentinela` — veredito `PASS|WARN|DENY` em 8 categorias.
- **Não usar `any` sem justificativa** — TypeScript strict está ativo.
- **Não fazer `db.ts` "use server"** — é client-side por design (usa Firebase client SDK).
- **Routes em `api/ai/` nunca persistem no Firestore** — persistência fica nas páginas client-side.
- **`src/lib/content.ts` é server-only** (usa `node:fs`) — nunca importar em componentes client.
- **Novos tipos vão em `src/lib/types.ts`** — não criar arquivos `*-types.ts` extras a menos que o domínio seja completamente isolado (ex: `matematica-types.ts`, `sentinela-types.ts`).

## Missão central

O objetivo não é produtividade — é **reconstruir habilidade real**. Ao sugerir features, priorizar o que força Igor a entender antes de usar. Features que só geram output sem exigir compreensão vão contra o propósito do sistema.
