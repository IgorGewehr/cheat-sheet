---
title: "Camadas de cache — RSC, Redis, edge"
category: infra
stack: [Next.js, NestJS, Redis]
tags: [cache, performance]
excerpt: "Cache certo no lugar certo. Cache errado é a maior fonte de bug \"estranho\" em ERP. Sempre tenha estratégia explícita de invalidação."
related: [n-plus-1, postgres-erp-checklist, app-router]
updated: 2026-04
---

## As camadas

```
Browser ─ HTTP cache (browser/CDN)
         └─ Edge cache (Vercel/CDN/Cloudflare)
            └─ Next.js Data Cache (RSC fetch cache)
               └─ App-level (Redis/in-memory)
                  └─ DB query cache (Postgres shared_buffers)
```

Cada uma resolve um problema. **Use a mais alta possível** (mais perto do usuário = mais rápida e mais barata).

## Next.js (App Router)

- **`fetch(url, { next: { revalidate: 60 } })`**: cache no servidor por 60s.
- **`{ next: { tags: ["clientes"] } }`**: invalidação por tag via `revalidateTag`.
- **`{ cache: "no-store" }`**: sempre fresh (use em dado por usuário, mutações).
- **`revalidatePath('/clientes')`**: invalida o segmento.

Default em 2026 é mais conservador (vs Next 14). Confira docs e teste comportamento.

## Redis — quando

- Sessões / refresh tokens.
- Rate limit (token bucket).
- Cache de leituras caras compartilhado entre instâncias.
- Locks distribuídos (`SET NX EX`, ou Redlock pra cenários sérios).
- Filas leves (BullMQ).

Para cache de leitura, padrão **cache-aside**:

```ts
const key = `cliente:${tenantId}:${id}`;
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);
const cliente = await db.query.clientes.findFirst({ where: ... });
if (cliente) await redis.set(key, JSON.stringify(cliente), { EX: 60 });
return cliente;
```

Cuidado:
- TTL curto pra dado mutável (60s-5min).
- Invalidar em writes (delete `key` no save).
- Sempre namespace por tenant (`cliente:${tenantId}:${id}`) pra evitar leak.

## Cache em memória (in-process)

`lru-cache` ou similar. Bom pra:
- Dado quase imutável (lista de países, configs).
- Per-request memoization (mesma query várias vezes na mesma request — use `cache()` do React em RSC).

Não use entre instâncias (cada uma tem seu cache, inconsistência).

## Edge / CDN

Pra páginas públicas (landing, blog, docs). ERP autenticado raramente cache na borda — mas headers de cache estática pra imagens/CSS sempre.

## Invalidação — a parte difícil

A regra: **toda escrita invalida o cache associado**.

Estratégias:
- **TTL curto** (acabou-se em x segundos): aceita "stale". Bom pra UX onde alguns segundos defasados não doem.
- **Invalidação explícita**: `await redis.del(key)` no save. Funciona pra cache simples.
- **Tag-based**: cache marcado com tags, write-side dispara `invalidateTag`. Bom em SSR/RSC.
- **Pub/sub**: instância A invalida, publica no Redis pub/sub, instâncias B/C limpam local.

## Quando NÃO cachear

- Operações por usuário/tenant que vêm com filtros complexos (vai cachear errado).
- Dado que pode ficar errado por segundos = problema real (financeiro em tempo real).
- Antes de medir. **Cache sem benefício é só fonte de bug.**

## Como pedir pra IA

> "Implemente cache do endpoint `GET /clientes/:id` em Nest com Redis: cache-aside, TTL 5min, key namespaced por tenant. Invalida em update/delete. Wrapper `Cached(key, ttl, fn)` reusável. Rate limit em endpoints sensíveis (login, signup, reset) com token bucket via Redis. Skip cache se header `X-No-Cache: 1` (debug)."

## Auditoria

- [ ] Cada cache tem estratégia de invalidação explícita (não só TTL "vai ficar bom").
- [ ] Keys têm namespace por tenant.
- [ ] Métrica de hit rate em produção. <50% = cache não vale.
- [ ] Não cacheia dado por usuário sem incluir userId na key.
- [ ] Skip cache em modo debug.
- [ ] TTL razoável pro caso (não 24h em dado mutável).

## Anti-padrões

- Cache eterno sem invalidação ("vou esperar TTL"). 24h depois ainda errado.
- Cache compartilhado entre tenants por bug de key.
- Cache de função pura tipo `formatCurrency` (overhead > benefício).
- Cachear erro junto com sucesso (next request sempre vê erro stale).
