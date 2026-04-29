---
title: "React Server Components — o que renderizar onde"
category: padroes-frontend
stack: [Next.js, React]
tags: [rsc, performance]
excerpt: "RSC roda só no servidor, zero JS pro cliente. Use pra busca de dado, layout, conteúdo estático. Client component só pra interação."
related: [app-router, server-actions, streaming-suspense]
updated: 2026-04
---

## Mental model em 1 frase

**Server Component**: roda no servidor, retorna HTML+RSC payload, zero JS no client.
**Client Component**: vira JS no bundle, hidrata, lida com state/eventos.

Cada `"use client"` é um custo de bundle. Minimize.

## O que vai onde

| Tipo de UI | Onde |
|---|---|
| Lista buscada do banco | Server |
| Layout, header, footer | Server |
| Formulário com state | Client (mas containers ao redor podem ser server) |
| Botão com `onClick` | Client |
| Markdown render | Server (faça no build/render) |
| Charts interativos | Client |
| Tabela com filtros server-side (URL params) | Server |
| Tabela com filtros client-side instantâneos | Client |
| Modal | Client |

## Receita "ilha de interatividade"

Mantenha o máximo possível como Server Component. Crie pequenos Client Components ("ilhas") só onde a interação acontece.

```tsx
// page.tsx — Server
export default async function Page() {
  const pedidos = await db.pedidos.list();
  return (
    <section>
      <h1>Pedidos</h1>
      <PedidoFilters />            {/* Client (URL params) */}
      <PedidoTable rows={pedidos} /> {/* Server */}
      <PedidoActionsBar />         {/* Client (botões) */}
    </section>
  );
}
```

## Passar dado server → client

Props serializáveis (JSON-friendly). Funções, classes, Date como string ISO. Se precisa de Date, passe ISO e parse no client (ou use número).

## Children pattern

Client Component pode receber server como `children`:

```tsx
"use client";
export function Drawer({ children }) {
  const [open, setOpen] = useState(false);
  return open ? <div>{children}</div> : null;
}

// uso (server component):
<Drawer>
  <ServerData />  {/* renderiza no servidor, passa pelo client */}
</Drawer>
```

## Data fetching

- Direto no Server Component: `const x = await fetch(...)` ou `await db.users.list()`.
- Várias queries: `Promise.all`.
- Queries dependentes: aceite o waterfall ou use Suspense pra paralelizar visualmente.
- Mesmo dado em vários componentes: `cache()` do React (request-scoped dedup).

## Como pedir pra IA

> "Crie a página `/dashboard` em App Router. RSC busca métricas do backend (3 queries em Promise.all). Renderiza cards estáticos. Os gráficos são Client Components (Recharts) que recebem dados como props. Inclua skeleton no `loading.tsx`. Sem `useEffect` pra busca."

## Auditoria

- [ ] Você precisaria mesmo do "use client" naquele componente? Tente tirar.
- [ ] Componentes "use client" são pequenos e folha (não importam server-things).
- [ ] Dado vem de RSC quando possível, não de useEffect.
- [ ] `cache()` do React em funções de busca chamadas por múltiplos RSCs no mesmo request.
- [ ] Tipos passados de server pra client são serializáveis (sem `Date` puro, sem funções).
- [ ] Nenhum SDK só-client (firebase/firestore, etc) é importado em RSC.

## Anti-padrões

- Marcar `app/layout.tsx` como `"use client"` (isso vira a árvore inteira em client).
- Buscar dado no Client Component que poderia vir do server, com `useEffect` + spinner.
- Bibliotecas pesadas no client component que poderiam rodar no server.
