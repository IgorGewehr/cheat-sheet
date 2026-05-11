---
title: "Next.js 15 + Go Backend — Integração Sênior Moderna"
category: padroes-frontend
stack: [Next.js, Go, TypeScript, OpenAPI]
tags: [integration, rsc, server-actions, openapi, fetch, codegen, bff]
excerpt: "O guia que falta: como Next.js 15 (App Router, RSC, Server Actions) conversa com um backend Go de forma type-safe, com cache decente, auth correta e sem reinventar fetch."
related: [server-components, server-actions, app-router, nextjs-caching-model, go-sdd-openapi, go-bff-cors-cookies, connect-rpc-go-nextjs]
updated: "2026-05"
---

## Cenário

Backend Go (Chi/Gin) exposto em `api.exemplo.com`. Frontend Next.js 15 em `app.exemplo.com`. Você quer:

1. Contrato tipado fim-a-fim (mudança no Go quebra o TS no build).
2. Auth com cookie httpOnly funcionando em RSC e Server Actions.
3. Cache do Next colaborando com ETags/`Cache-Control` do Go.
4. Streaming Go → React Suspense sem WebSocket onde SSE basta.
5. Erros do Go aparecendo como erros úteis no React.

Cada item abaixo resolve um.

## 1. Contrato tipado: OpenAPI → TS sem mágica

A trilha já cobre `go-sdd-openapi` no lado Go. Do lado Next:

```bash
npm i -D openapi-typescript
npm i openapi-fetch
```

```jsonc
// package.json
"scripts": {
  "gen:api": "openapi-typescript https://api.exemplo.com/openapi.yaml -o src/lib/api/schema.ts"
}
```

```ts
// src/lib/api/client.ts
import createClient from "openapi-fetch";
import type { paths } from "./schema";

export const api = createClient<paths>({
  baseUrl: process.env.GO_API_URL!, // server-only — não vaza pro client
});
```

Uso em RSC (zero runtime overhead vs `fetch` cru):

```tsx
// app/projetos/[id]/page.tsx
import { api } from "@/lib/api/client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await api.GET("/projetos/{id}", {
    params: { path: { id } },
    next: { revalidate: 60, tags: [`projeto:${id}`] }, // integra com Next cache
  });
  if (error) throw error;
  return <ProjetoView projeto={data} />;
}
```

**Alternativas (escolha consciente)**:
- `orval` — gera hooks React Query também. Bom pra SPA pesada, exagero pra RSC-first.
- `kubb` — modular, suporta zod e tanstack-query. Boa escolha pra times grandes.
- **Connect-RPC** (sem REST) — veja `connect-rpc-go-nextjs`.

**Anti-pattern**: manter tipos TS duplicados à mão. Toda vez que o Go mudar, o build TS vai mentir até alguém perceber em produção.

## 2. Cache do Next colaborando com o Go

Next 15 tem três caches: Request Memoization, Data Cache, Full Route Cache. Pra um backend Go bem-comportado:

```go
// Lado Go — ETag + Cache-Control
func getProjeto(w http.ResponseWriter, r *http.Request) {
    proj, _ := repo.Find(r.Context(), chi.URLParam(r, "id"))
    etag := fmt.Sprintf(`"%x"`, sha1.Sum([]byte(proj.UpdatedAt.String())))
    if match := r.Header.Get("If-None-Match"); match == etag {
        w.WriteHeader(http.StatusNotModified)
        return
    }
    w.Header().Set("ETag", etag)
    w.Header().Set("Cache-Control", "private, max-age=0, must-revalidate")
    json.NewEncoder(w).Encode(proj)
}
```

```ts
// Lado Next — tags por entidade
await api.GET("/projetos/{id}", {
  params: { path: { id } },
  next: { tags: [`projeto:${id}`] }, // revalidação cirúrgica
});

// Server Action invalidando após mutação
"use server";
import { revalidateTag } from "next/cache";

export async function renomearProjeto(id: string, nome: string) {
  await api.PATCH("/projetos/{id}", {
    params: { path: { id } },
    body: { nome },
  });
  revalidateTag(`projeto:${id}`); // RSC re-fetcha na próxima request
}
```

**Pegadinha sênior**: `fetch` em RSC com `Authorization` header desativa o Data Cache (a partir do Next 15). Solução: passe `cache: "force-cache"` explícito quando o dado é compartilhável, ou aceite que dados autenticados não cacheiam — não é bug, é defesa.

## 3. Server Actions chamando Go (não esqueça correlation-id)

```ts
// app/projetos/actions.ts
"use server";

import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { api } from "@/lib/api/client";
import { getSessionCookie } from "@/lib/auth";

export async function criarProjeto(formData: FormData) {
  const token = await getSessionCookie();
  const reqId = (await headers()).get("x-request-id") ?? crypto.randomUUID();

  const { data, error } = await api.POST("/projetos", {
    headers: {
      authorization: `Bearer ${token}`,
      "x-request-id": reqId, // propaga pra observability do Go
    },
    body: { nome: formData.get("nome") as string },
  });

  if (error) {
    // Erro do Go vira erro do React — Error Boundary captura
    throw new Error(error.message ?? "Falha ao criar projeto");
  }

  revalidateTag("projetos");
  return data;
}
```

**Por que isso importa**: o `x-request-id` aparece no `slog` do Go via middleware. Quando algo quebra, você correlaciona React → Go em um único trace.

## 4. Streaming Go → RSC com Suspense

SSE > WebSocket pra casos comuns (one-way, retry nativo, atravessa proxy). No Go:

```go
func streamRelatorio(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    flusher := w.(http.Flusher)

    for evt := range gerarRelatorio(r.Context()) {
        fmt.Fprintf(w, "event: chunk\ndata: %s\n\n", evt.JSON())
        flusher.Flush()
    }
}
```

No Next 15, consumir em RSC com Suspense:

```tsx
// app/relatorios/[id]/page.tsx
import { Suspense } from "react";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<Skeleton />}>
      <Relatorio id={id} />
    </Suspense>
  );
}

async function Relatorio({ id }: { id: string }) {
  const stream = await fetch(`${process.env.GO_API_URL}/relatorios/${id}/stream`, {
    cache: "no-store",
  });
  // Renderiza chunk-by-chunk; para UI interativa, mova pra client component com EventSource
  return <pre>{await stream.text()}</pre>;
}
```

Pra UX real-time (cursor de progresso, etc), use **client component com `EventSource`** — RSC streaming não atualiza incrementalmente o DOM, só permite que partes do server tree resolvam fora de ordem.

## 5. Erros do Go aparecendo úteis no React

Padronize erro no Go (RFC 7807 / Problem Details):

```go
type ProblemDetails struct {
    Type     string `json:"type"`
    Title    string `json:"title"`
    Status   int    `json:"status"`
    Detail   string `json:"detail,omitempty"`
    Instance string `json:"instance,omitempty"`
    Code     string `json:"code,omitempty"` // domain-specific
}
```

E no `openapi-fetch` adicione um middleware:

```ts
api.use({
  async onResponse({ response }) {
    if (!response.ok) {
      const body = await response.clone().json().catch(() => ({}));
      const err = new Error(body.title ?? response.statusText);
      (err as any).code = body.code;
      (err as any).status = response.status;
      throw err;
    }
  },
});
```

Agora `error.code === "PROJETO_DUPLICADO"` funciona como tag no React — sem `if (err.message.includes(...))`.

## Tabela de decisão rápida

| Caso | Padrão recomendado |
|---|---|
| RSC fetchando dados | `openapi-fetch` server-side + tags |
| Form mutation | Server Action chamando Go + `revalidateTag` |
| Dado realtime (progresso, chat) | Client component + `EventSource` |
| RPC entre Go interno | gRPC ou Connect-Go puro (sem Next no meio) |
| Browser → Go com RPC tipado | **Connect-Web** (ver `connect-rpc-go-nextjs`) |
| Cross-domain auth | Cookie httpOnly + BFF (ver `go-bff-cors-cookies`) |
| Upload pesado | Presigned URL do Go pro S3/R2, frontend faz PUT direto |

## Armadilhas comuns

- **Vazar `GO_API_URL` no client**: sempre `process.env.GO_API_URL` em código server-only; se precisar no client, use `NEXT_PUBLIC_GO_API_URL` (e exponha só o que é público mesmo).
- **`cache: "no-store"` em tudo**: mata performance. Default do Next 15 já é dinâmico — confie e marque o que é cacheável explicitamente.
- **Server Action vazando token**: nunca passe o cookie de sessão como argumento de action. Leia via `cookies()` dentro da action.
- **CORS direto pro `api.exemplo.com`**: prefira same-origin via BFF (route handler em `/api/*` proxy pro Go). Veja `go-bff-cors-cookies`.
- **Confundir Server Action com endpoint público**: actions são endpoints POST com proteção CSRF, mas não são REST. Não use Server Action quando precisar de integração externa.

## Como pedir pra IA

```
Conecte minha app Next.js 15 (App Router) a um backend Go já existente
em api.exemplo.com com OpenAPI 3.1. Quero:

- Codegen TS com openapi-typescript + openapi-fetch
- Cache do Next por entidade via next.tags + revalidateTag
- Auth via cookie httpOnly (sessão server-side, sem JWT no localStorage)
- Erros tratados via RFC 7807 / ProblemDetails com .code mapeável
- Streaming SSE para o endpoint /relatorios/:id/stream
- Server Actions propagando x-request-id pra correlação com slog do Go

Stack frontend: Next 15.5, React 19, TypeScript strict.
NÃO use: SWR/React Query em páginas RSC, JWT no client, fetch sem tipos.
```
