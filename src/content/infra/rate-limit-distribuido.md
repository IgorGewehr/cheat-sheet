---
title: "Rate limit distribuído — in-memory não escala"
category: infra
stack: [Redis, Firestore, Node.js]
tags: [rate-limit, redis, escala, serverless, multi-instance]
excerpt: "Rate limiter em-memory funciona em 1 processo. Em serverless ou Kubernetes com 5 réplicas, vira 5 baldes independentes — limit de 100/min vira 500/min real. Problema clássico que só aparece em produção."
related: [caching-layers, observability, omnichannel-conversations]
updated: 2026-04
---

## O bug que aparece em produção

```ts
// rate-limiter.ts comum
const requests = new Map<string, number[]>();

export function check(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const arr = requests.get(ip) ?? [];
  const recent = arr.filter(t => now - t < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  requests.set(ip, recent);
  return true;
}
```

Funciona em dev. Em produção:
- **Vercel/Netlify**: cada cold start = nova memória. Map zera. Limit 100/min vira ilimitado.
- **Kubernetes 5 réplicas**: 5 Maps independentes. Limit 100/min vira 500/min.
- **Docker single-container**: ok, mas restart zera o Map.

## As 3 estratégias distribuídas

### 1. Redis com sliding window (padrão de fato)

```ts
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL!);

async function check(key: string, limit: number, windowSec: number) {
  const now = Date.now();
  const windowStart = now - windowSec * 1000;
  const member = `${now}-${randomUUID()}`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);  // limpa expirados
  pipeline.zadd(key, now, member);                  // adiciona atual
  pipeline.zcard(key);                              // conta
  pipeline.expire(key, windowSec);                  // TTL
  const results = await pipeline.exec();
  const count = results![2][1] as number;

  return count <= limit;
}
```

**Vantagens**: precisa, atômico (pipeline), sliding window real.
**Custo**: Redis ($/mês ou self-hosted).

### 2. Firestore counters (sem infra extra)

Pra apps já em Firebase, não vale a pena rodar Redis só pra rate limit. Use o próprio Firestore com transação:

```ts
async function check(key: string, limit: number, windowSec: number) {
  const ref = db.collection('rateLimits').doc(key);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const windowStart = now - windowSec * 1000;
    const data = snap.exists ? snap.data()! : { hits: [] };
    const recent = (data.hits as number[]).filter(t => t >= windowStart);
    if (recent.length >= limit) return false;
    recent.push(now);
    tx.set(ref, { hits: recent });
    return true;
  });
}
```

**Vantagens**: 0 infra extra; consistente em multi-instance.
**Custo**: Firestore reads/writes — não use pra > 100 req/s. Cada check = 1 read + 1 write.

### 3. Token bucket com Cloudflare/Vercel KV

Edge KV (Cloudflare KV, Vercel KV, Upstash) tem latência baixa e API HTTP. Bom pra rate limit em edge function.

## Padrões de chave

- **Por IP**: `rl:ip:1.2.3.4` — proteção contra abuso anônimo.
- **Por usuário**: `rl:user:{uid}` — billing, fair-use.
- **Por tenant**: `rl:tenant:{tid}` — proteção de fair-share em multi-tenant.
- **Por endpoint**: `rl:user:{uid}:{endpoint}` — limit diferente por rota.
- **Por canal**: `rl:business:{bid}:whatsapp` — Meta tem limit por número, espelhe.

## Headers padrão

Devolva sempre, ajuda cliente a se comportar:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1714342800
Retry-After: 30   (em 429)
```

## Anti-patterns reais

- **In-memory em serverless**: visto em código real, "funcionou em dev". Multi-instance vaza.
- **Limpar o Map a cada request**: dor de cabeça do GC, race condition.
- **Limit por IP atrás de proxy**: lê IP do load balancer, não do cliente. Use `X-Forwarded-For` corretamente (validar trusted proxies).
- **Sem fail-open vs fail-closed deliberado**: Redis caiu — você libera todos (fail-open) ou bloqueia todos (fail-closed)? Decida explicitamente. Default seguro: fail-open com alerta agressivo.
- **Limit muito apertado em endpoint legítimo**: cliente válido toma 429. Combine com captcha/auth ao invés de bloquear.

## Quando você precisa disso

- API pública (qualquer endpoint sem auth).
- Endpoint caro: OCR, IA generativa, upload, OAuth callback.
- Webhook receiver: limite por origem.
- Login: 5 tentativas/15min por email + 50/IP/hora.
- Envio de notificação (WhatsApp, email): limit por business + canal.

## Checklist

- [ ] Não tem Map global como "rate limit" em produção multi-instance.
- [ ] Storage escolhido com base em tráfego (Redis pra alto, Firestore pra baixo).
- [ ] Chave inclui escopo certo (user/tenant/canal).
- [ ] Headers `X-RateLimit-*` retornados.
- [ ] Decidiu fail-open vs fail-closed em caso de storage down.
- [ ] Alerta quando rate limit dispara em massa (= ataque ou bug do cliente).
- [ ] Endpoints diferentes têm limits diferentes (login vs feed vs upload).
