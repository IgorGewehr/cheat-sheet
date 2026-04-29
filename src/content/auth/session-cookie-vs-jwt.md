---
title: "Session cookie HttpOnly vs JWT no localStorage/cookie acessível"
category: auth
stack: [Next.js, Firebase, Node.js]
tags: [session, cookie, jwt, xss, csrf, seguranca]
excerpt: "JWT no localStorage está exposto a qualquer XSS. document.cookie sem HttpOnly idem. Pra app web séria, session cookie HttpOnly + Secure + SameSite é o default — JWT serve outras coisas."
related: [auth-architecture, account-creation-flow, session-strategy]
updated: 2026-04
---

## A confusão

"JWT é mais moderno que sessão!" — não exatamente. JWT é um **formato de token** (assinado, autocontido, stateless). Cookie é um **mecanismo de transporte/armazenamento**. Você pode ter:

- JWT em `localStorage` → exposto a XSS.
- JWT em cookie sem HttpOnly → exposto a XSS.
- JWT em cookie HttpOnly → protegido, mas você perdeu o "stateless" (browser sempre manda).
- Session ID em cookie HttpOnly → padrão clássico, com servidor lookup.

## Vetores de ataque

### XSS (cross-site scripting)
Atacante injeta `<script>` na sua página. O script tem acesso a:
- ✅ `localStorage`, `sessionStorage`.
- ✅ `document.cookie` (qualquer cookie sem HttpOnly).
- ❌ Cookies HttpOnly — **não consegue ler**.

Se o token tá em cookie HttpOnly: XSS rouba a sessão **só** se conseguir fazer requisições autenticadas (e o servidor checa origin/CSRF). Se tá em localStorage: copia, exfiltra, GG.

### CSRF (cross-site request forgery)
Site malicioso faz `<form action="seubanco.com/transfer">`. Browser anexa cookie automaticamente.
- Cookie sem `SameSite` → ataque funciona.
- `SameSite=Lax` → bloqueia cross-site (default em browsers modernos).
- `SameSite=Strict` → bloqueia até navegação direta.
- JWT em header `Authorization: Bearer` → não anexa automático, imune a CSRF.

## A regra prática

| Caso | Recomendação |
|---|---|
| App web SPA com login de usuário | Session cookie HttpOnly + Secure + SameSite=Lax |
| API pública consumida por mobile/B2B | JWT em header Authorization |
| Server-to-server | JWT (com `aud` apertado) ou mTLS |
| Server-rendered (Next App Router) | Session cookie HttpOnly |

## Firebase Auth — o detalhe importante

Firebase devolve um **ID token JWT** que expira em 1h. Padrão: SDK guarda em `IndexedDB`/localStorage. Em app web séria, você quer:

```ts
// 1. Cliente faz login → recebe ID token
const idToken = await user.getIdToken();

// 2. Cliente troca por session cookie no servidor
await fetch('/api/auth/session', {
  method: 'POST',
  body: JSON.stringify({ idToken }),
});

// 3. Servidor cria session cookie HttpOnly
import { getAuth } from 'firebase-admin/auth';
const sessionCookie = await getAuth().createSessionCookie(idToken, {
  expiresIn: 60 * 60 * 24 * 5 * 1000, // 5 dias
});
res.setHeader('Set-Cookie', `__session=${sessionCookie}; HttpOnly; Secure; SameSite=Lax; Path=/`);

// 4. Daí em diante, server verifica via verifySessionCookie
await getAuth().verifySessionCookie(req.cookies.__session, true);
```

Sem esse passo: ID token vive em localStorage, XSS rouba.

## Logout

- Server: invalida session cookie (`getAuth().revokeRefreshTokens(uid)`).
- Cliente: `Set-Cookie: __session=; Max-Age=0`.
- Em multi-tab: notificar via storage event ou broadcast channel.

## Anti-patterns reais

- `document.cookie = '__session=' + token` — **sem HttpOnly**, é o mesmo que localStorage.
- Renovar token a cada 50min via `setTimeout` no cliente — funciona, mas se a aba dormir, sessão morre.
- "Stateless é melhor" e botar JWT longo (24h) sem revogação — sessão roubada vive 1 dia.

## Checklist

- [ ] Token de sessão em cookie com **HttpOnly**, **Secure** (em prod), **SameSite=Lax** ou **Strict**.
- [ ] Renovação acontece server-side (refresh token também HttpOnly).
- [ ] CSRF token em forms sensíveis (ou SameSite=Strict + verificação de Origin).
- [ ] Logout revoga server-side, não só apaga cookie.
- [ ] CSP (`Content-Security-Policy`) ajustado pra reduzir XSS surface.
- [ ] Nenhum token em `localStorage` em app web acessada via browser.
