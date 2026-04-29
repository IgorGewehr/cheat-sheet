---
title: "Server Actions — quando vale, quando não"
category: padroes-frontend
stack: [Next.js]
tags: [nextjs, mutations]
excerpt: "Mutações sem criar API route. Ótimo pra forms internos. Não é desculpa pra colocar lógica de negócio no Next em ERP com backend Nest."
related: [app-router, server-components]
updated: 2026-04
---

## O que é

Função TS que tem `"use server"` no topo (ou no arquivo). Pode ser invocada do client como se fosse local, mas roda no servidor. Next gera um endpoint POST por baixo dos panos, com proteção CSRF.

```tsx
// app/clientes/actions.ts
"use server";
import { revalidatePath } from "next/cache";

export async function criarCliente(formData: FormData) {
  const nome = String(formData.get("nome"));
  await fetch(`${process.env.API}/clientes`, {
    method: "POST",
    body: JSON.stringify({ nome }),
    headers: { /* auth */ },
  });
  revalidatePath("/clientes");
}

// app/clientes/form.tsx (Client)
"use client";
import { criarCliente } from "./actions";
export function Form() {
  return <form action={criarCliente}>...</form>;
}
```

## Quando usar

- **Forms simples** num app Next que não precisa de API pública.
- **Optimistic UI** com `useOptimistic` + Server Action.
- Quando dá pra evitar criar endpoint só pra mutação interna.

## Quando NÃO usar

- **Você já tem backend Nest com regra de negócio.** Server Action que só "passa adiante" pra Nest é overhead. Use fetch direto do client (com tanstack-query) ou route handler. Não duplique camadas.
- **Precisa do endpoint pra mobile/integração externa.** Server Action não é endpoint público estável.
- **Webhooks ou integrações.** Use route handlers.

## Em ERP com backend Nest — receita

A regra que funciona:
- **Lógica de negócio**: NestJS (use cases, validação de regra).
- **Endpoint público**: NestJS (REST/gRPC).
- **Frontend Next**: server actions opcionais pra ergonomia (form internos, revalidate fácil), mas a Server Action **só chama o endpoint Nest**. Não duplique validação/regra lá.

```ts
// Server action que delega
"use server";
export async function aprovarPedido(pedidoId: string) {
  const session = await getServerSession();
  await fetch(`${API}/pedidos/${pedidoId}/aprovar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.token}` },
  });
  revalidatePath(`/pedidos/${pedidoId}`);
}
```

## Validação

Mesmo que a lógica more no Nest, valide o input no Server Action também (zod) pra dar feedback rápido. Mas backend valida sempre — frontend é UX, backend é segurança.

## Como pedir pra IA

> "Crie Server Action `aprovarPedido(pedidoId)` que chama `POST /pedidos/:id/aprovar` no backend Nest com o JWT da sessão. Em sucesso, `revalidatePath('/pedidos/' + id)`. Em erro, retorne `{ error: string }` pro client. Componente Client chama com `useActionState` e mostra toast."

## Auditoria

- [ ] Server Actions não contêm lógica de negócio que deveria estar no Nest.
- [ ] Toda Server Action valida input com zod (defesa em profundidade).
- [ ] Auth checada via `getServerSession` ou equivalente. Nada de confiar em prop do client.
- [ ] `revalidatePath`/`revalidateTag` chamados quando dado muda (senão UI fica defasada).
- [ ] Server Actions não retornam objetos não-serializáveis.
- [ ] Sem secrets (chaves API) usadas e expostas em response.

## Anti-padrões

- Server Action longa que orquestra 5 chamadas Nest em sequência. Vira RPC torta. Faça endpoint Nest "compor".
- Server Action substituindo backend ("vou só usar Next, sem Nest"). Em ERP B2B, você quer backend separado pra mobile/integração/escala.
- Esquecer auth na Server Action. Endpoint exposto.
