---
title: "Sessão — JWT vs session DB em 2026"
category: auth
stack: [NestJS, Next.js]
tags: [auth, jwt, sessao]
excerpt: "JWT puro tem problema de revogação. Em ERP, prefira session no banco (ou JWT curto + refresh com revogação)."
related: [auth-architecture, account-creation-flow]
updated: 2026-04
---

## A escolha real

| | JWT puro (stateless) | Session no banco | Híbrido (access JWT curto + refresh DB) |
|---|---|---|---|
| Revogação imediata | ❌ (até expirar) | ✅ | ✅ (ao trocar refresh) |
| Performance read | ✅ (sem hit no DB) | ⚠️ (1 query por request) | ✅ |
| Trocar permissão | ❌ | ✅ | ✅ |
| Logout funciona | ⚠️ (só client) | ✅ | ✅ |
| Complexidade | baixa | baixa | média |

**Recomendado pra ERP**: híbrido. Access token JWT curto (5-15 min), refresh token salvo no banco com revogação. Ou session puramente no banco se não tem problema com latência.

## JWT puro — quando rola

- App público sem ações sensíveis.
- Microsserviços internos com tokens curtos (segundos a minutos).
- Você confia em refazer login com frequência.

Não use em ERP onde admin precisa banir usuário NA HORA.

## Session no banco — implementação

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  identity_id UUID NOT NULL REFERENCES identities(id),
  active_tenant_id UUID,
  active_branch_id UUID,
  user_agent TEXT,
  ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);
CREATE INDEX ON sessions (identity_id) WHERE revoked_at IS NULL;
```

Cookie httpOnly + Secure + SameSite=Lax com o `session.id` (random 256-bit). Nada de JWT.

Em Next.js: cookie + middleware lê e valida. Em Nest: guard que carrega session.

## Híbrido — JWT curto + refresh

- **Access JWT**: 5-15 min, contém `identityId`, `activeTenantId`, `role`. Frontend manda em `Authorization: Bearer`.
- **Refresh**: opaco (UUID), salvo no banco, em cookie httpOnly. Endpoint `/auth/refresh` troca por novo access (e roda rotation no refresh — o usado expira, gera novo).
- Banir = invalidar refresh tokens da identity.

Vantagem: a maioria das requisições não bate no DB de auth.

## Trocar de tenant

Sem reemissão, não rola. Em JWT puro, gera token novo. Em session no DB, atualiza `active_tenant_id`. Garanta que a página recarrega (ou invalidar cache do cliente) pra refletir o novo contexto.

## Como pedir pra IA

> "Implemente auth híbrida: access JWT (HS256/EdDSA, 10 min, sem dado sensível, só `identityId`+`activeTenantId`) + refresh opaco no DB (cookie httpOnly secure SameSite=Lax). Endpoint `/auth/refresh` faz rotation. Endpoint `/auth/logout` revoga refresh atual. Endpoint `/admin/users/:id/sessions/revoke-all` invalida todos. Guard Nest valida access token e carrega `Membership` ativa do DB com cache curto (5s)."

## Auditoria

- [ ] Access token não tem `role` cacheado por > 5 minutos sem possibilidade de re-checagem.
- [ ] Refresh token rotation (cada uso gera novo + invalida antigo). Detecta replay.
- [ ] Cookies: `HttpOnly`, `Secure`, `SameSite=Lax` (ou Strict se possível).
- [ ] Logout revoga server-side, não só limpa cookie.
- [ ] Admin consegue listar sessões ativas de um usuário e revogar.
- [ ] Endpoint de refresh tem rate limit.
- [ ] JWT secret/keys carregadas de env, não hardcoded.

## Anti-padrões

- JWT de 24h com role cacheado. Demitiu alguém? Tem 24h de exposição.
- Refresh sem rotation (refresh fixo). Vaza uma vez = vaza pra sempre.
- Salvar JWT em localStorage. XSS rouba.
- Reemitir token só ao expirar (sem rotação) — ataque de roubo passa despercebido.
