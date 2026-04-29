---
title: "Next.js App Router — quando usar, gotchas"
category: padroes-frontend
stack: [Next.js]
tags: [nextjs, app-router, rsc]
excerpt: "O default em 2026. Server Components por padrão, \"use client\" só quando precisa. Mental model: render no servidor, hidrata no client."
related: [server-components, server-actions, streaming-suspense]
updated: 2026-04
---

## Quando usar

Hoje (2026): **default pra projeto novo**. Pages Router está em modo manutenção. App Router maduro, com RSC, Server Actions, streaming, parallel routes.

Quando NÃO usar:
- Migração custosa de projeto enorme em Pages Router que não tem ROI.
- Lib que precisa rodar 100% no cliente (mas mesmo assim dá pra empacotar como client component).

## Mental model

- Tudo é **Server Component** (RSC) por padrão.
- `"use client"` no topo do arquivo marca uma "fronteira de client". Tudo importado por esse arquivo (e seus filhos no client) também roda no client.
- Server Component pode importar Client Component. Client Component **não pode** importar Server Component (mas pode receber como `children` ou prop).
- Dados: busque diretamente no Server Component (pode ser `async`).

```tsx
// app/clientes/page.tsx — Server Component
import { listClientes } from '@/lib/db';
import { ClienteList } from './client-list';  // pode ser client

export default async function Page() {
  const clientes = await listClientes();  // query direta no servidor
  return <ClienteList clientes={clientes} />;
}
```

## Estrutura de pastas

```
app/
├── layout.tsx           # root layout
├── page.tsx             # /
├── (marketing)/         # route group, não vira segmento de URL
│   └── about/page.tsx
├── (app)/
│   ├── layout.tsx       # layout só do app autenticado
│   └── clientes/
│       ├── page.tsx
│       ├── loading.tsx
│       ├── error.tsx
│       └── [id]/page.tsx
├── api/
│   └── webhooks/route.ts
```

## Gotchas comuns

1. **`"use client"` infecta a árvore.** Não use por reflexo. Faça componentes pequenos client e mantenha o pai como server.
2. **Sem fetch automático no client.** Se você importa `firebase/firestore` no servidor, vai quebrar (Firestore é client SDK). Mantenha em arquivos client.
3. **Cache agressivo do Router**. Em 2026 o cache padrão é mais conservador, mas confira: `revalidatePath`, `revalidateTag` ou `cache: 'no-store'`.
4. **`params` é Promise** em layouts/pages assíncronos no Next 15+: `const { id } = await params;`.
5. **Cookies/headers só em server components** ou route handlers: `import { cookies } from 'next/headers'`.
6. **Erros 500 no server vão pro `error.tsx` mais próximo**. Sempre tenha um.

## Quando usar Pages Router?

Praticamente nunca pra projeto novo. Se você precisa de feature que App Router não tem, geralmente está usando errado.

## Como pedir pra IA

> "Crie a página `/clientes` em App Router. Server Component que busca lista do backend Nest via fetch (com tag pra revalidação). Renderiza `<ClienteList>` (Client Component) com paginação client-side. Inclua `loading.tsx` (Skeleton) e `error.tsx`. Use `revalidateTag('clientes')` numa Server Action que cria cliente, em vez de refetch manual."

## Auditoria

- [ ] Server Components fazem o data fetching. Client só interage.
- [ ] Nada de `useEffect` pra buscar dado que poderia ser do servidor.
- [ ] `loading.tsx` em rotas que demoram.
- [ ] `error.tsx` perto de operações arriscadas.
- [ ] Cache: você decidiu conscientemente entre `force-cache`, `no-store`, `revalidate`.
- [ ] Sem `"use client"` em arquivo que não precisa (testou removendo?).
- [ ] Imagens via `<Image>` do Next, não `<img>`.
- [ ] Fontes via `next/font`, não `<link>` no head.

## Anti-padrões

- Buscar dado no client com `useEffect` quando RSC daria sem flash.
- Marcar layout inteiro como `"use client"`.
- Misturar Pages Router e App Router sem razão clara.
