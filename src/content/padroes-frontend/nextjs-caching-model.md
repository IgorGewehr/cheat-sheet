---
title: "Next.js 15 — Os 4 Caches e Como Controlá-los"
category: padroes-frontend
stack: [Next.js, React]
tags: [nextjs, cache, performance, revalidation, rsc, ppr]
excerpt: "Next.js 15 tem 4 caches empilhados. Entender cada um — e como limpar — é o que separa app lento de app rápido e correto."
related: [server-components, server-actions, streaming-suspense, app-router]
updated: "2026-05"
---

## Os 4 caches do Next.js 15

```
Request  →  [1] Request Memoization  →  [2] Data Cache  →  [3] Full Route Cache  →  [4] Router Cache  →  User
```

Cada cache tem escopo, duração e mecanismo de invalidação diferente.

---

## 1. Request Memoization (React `cache()`)

**Escopo**: única renderização de um request.  
**Duração**: desaparece no final do request.  
**Propósito**: deduplicar chamadas idênticas na mesma árvore de RSC.

```tsx
// lib/data.ts
import { cache } from "react";

export const getUser = cache(async (id: string) => {
  return db.users.findById(id);
});

// Layout busca o usuário
// Page também busca o usuário
// → Apenas 1 query no banco (memoização de request)
```

**Automático para `fetch()`**: Next.js aplica memoização automaticamente em chamadas `fetch()` idênticas na mesma renderização.

**Para chamadas de DB diretas**: você precisa envolver com `cache()` manualmente.

---

## 2. Data Cache (cache persistente de servidor)

**Escopo**: servidor, persiste entre requests e deploys.  
**Duração**: até invalidação explícita ou revalidação por tempo.  
**Propósito**: não bater na fonte de dados em toda request.

```ts
// Next.js 15: fetch() NÃO é cacheado por padrão (mudança v15)
// Antes (v13/14): fetch era cacheado por padrão

// Explicitamente em cache por 1 hora:
const data = await fetch("https://api.external.com/data", {
  next: { revalidate: 3600 },
});

// Cache permanente (estático):
const data = await fetch("https://api.external.com/data", {
  cache: "force-cache",
});

// Sem cache (dinâmico, sempre busca novo):
const data = await fetch("https://api.external.com/data", {
  cache: "no-store",
});
```

**Para dados do seu próprio banco (sem fetch)**: use `unstable_cache`:

```ts
import { unstable_cache } from "next/cache";

const getCachedProdutos = unstable_cache(
  async (tenantId: string) => {
    return db.produtos.findByTenant(tenantId);
  },
  ["produtos"],           // cache key base
  {
    revalidate: 300,      // 5 minutos
    tags: ["produtos"],   // tag pra invalidação manual
  },
);
```

---

## 3. Full Route Cache (cache de rota estática)

**Escopo**: servidor, por rota.  
**Duração**: até próximo deploy ou `revalidatePath()`.  
**Propósito**: servir HTML pré-renderizado sem rodar RSC a cada request.

```
Build time:           /produtos → renderiza RSC → salva HTML+RSC payload
Request time (cache hit):  /produtos → serve o cache → ~instant
```

**Next.js 15**: uma rota é estática se **não usar** `cookies()`, `headers()`, `searchParams`, ou `cache: "no-store"`.

```tsx
// Rota estática — renderizada em build, cacheada indefinidamente
export default async function Page() {
  const produtos = await getCachedProdutos(); // usa Data Cache com revalidate
  return <ProdutoList items={produtos} />;
}

// Rota dinâmica — renderizada a cada request
export const dynamic = "force-dynamic"; // ou usa cookies()/headers()
export default async function Page() {
  const user = await getUser(); // lê cookie de sessão
  return <Dashboard user={user} />;
}
```

---

## 4. Router Cache (cache do cliente)

**Escopo**: browser, por sessão de navegação.  
**Duração**: sessão do usuário (páginas estáticas: 5min, dinâmicas: 30s).  
**Propósito**: navegação instantânea entre rotas visitadas.

O Router Cache guarda o RSC payload de rotas já visitadas. Ao voltar pra uma rota, Next.js usa o cache sem request ao servidor.

**Isso pode causar dados stale no client**. Para invalidar:

```ts
// Server Action após mutação:
"use server"
import { revalidatePath } from "next/cache";

export async function criarPedido(data: FormData) {
  await db.pedidos.create(data);
  revalidatePath("/pedidos");          // invalida rota específica
  revalidatePath("/dashboard");        // invalida outra rota
  revalidateTag("pedidos");            // invalida todas as rotas com esta tag
}
```

---

## Tabela resumo

| Cache | Onde vive | Escopo | Invalidar |
|---|---|---|---|
| Request Memoization | Memória do processo | 1 request | Automático |
| Data Cache | Servidor (HDD/SSD) | Entre requests | `revalidateTag`, `revalidatePath`, `revalidate: N` |
| Full Route Cache | Servidor (CDN/edge) | Entre deploys | `revalidatePath`, deploy |
| Router Cache | Browser | Sessão | `router.refresh()`, Server Action, navegação |

---

## Receita para dados mutáveis (CRUD)

```tsx
// 1. Tag os dados ao buscar
const pedidos = await unstable_cache(
  () => db.pedidos.findAll(),
  ["pedidos-list"],
  { tags: ["pedidos"] }
)();

// 2. Invalide a tag ao mutar (Server Action)
"use server"
export async function deletarPedido(id: string) {
  await db.pedidos.delete(id);
  revalidateTag("pedidos");    // invalida Data Cache + Full Route Cache
}
```

## PPR — Partial Prerendering (Next.js 15)

PPR permite partes estáticas e dinâmicas **na mesma rota**:

```tsx
// next.config.ts
export default { experimental: { ppr: "incremental" } };

// page.tsx
export const experimental_ppr = true;

export default function Page() {
  return (
    <>
      <StaticHeader />          {/* renderizado em build */}
      <Suspense fallback={<Skeleton />}>
        <DynamicUserData />     {/* renderizado a cada request */}
      </Suspense>
    </>
  );
}
```

O shell estático chega imediatamente do CDN. Os dados dinâmicos chegam via streaming.

---

## Como pedir pra IA

> "Crie a página `/dashboard` em Next.js 15 App Router. Dados estáticos (métricas do mês) são cacheados 5 minutos com `unstable_cache` + tag `"dashboard-metrics"`. Dados dinâmicos (usuário logado) são lidos via `cookies()`. Use PPR: `experimental_ppr = true`, wrapeie a parte dinâmica em Suspense. Após Server Action que cria pedido, chame `revalidateTag('dashboard-metrics')`."

## Auditoria

- [ ] Rotas que exibem dados do usuário logado usam `dynamic = "force-dynamic"` ou `cookies()`.
- [ ] Dados mutáveis têm `tags` definidas em `unstable_cache`.
- [ ] Server Actions chamam `revalidateTag` ou `revalidatePath` após mutação.
- [ ] Dados de terceiros raramente alterados usam `revalidate: N` (não `no-store`).
- [ ] `router.refresh()` ou `revalidatePath` cobre o Router Cache do browser.

## Anti-padrões

- `cache: "no-store"` em tudo — nenhum benefício de cache, toda request bate no banco.
- Assumir que dados do banco são frescos sem verificar se há Full Route Cache.
- Mutar dados sem `revalidatePath`/`revalidateTag` — usuário vê dados velhos.
- `force-dynamic` em rotas que poderiam ser estáticas — perde CDN edge caching.
