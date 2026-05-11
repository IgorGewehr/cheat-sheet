---
title: "Go BFF — Auth, CORS e Cookies httpOnly com Next.js"
category: padroes-backend
stack: [Go, Chi, Next.js, OAuth2]
tags: [bff, auth, cors, cookies, csrf, session, security]
excerpt: "O lado Go da integração: por que BFF (Backend-for-Frontend) ganha de CORS direto, como configurar cookies httpOnly que sobrevivem a Next 15 Server Actions, e o fluxo de refresh sem JWT no localStorage."
related: [nextjs-go-backend-integration, go-auth-jwt-paseto, session-cookie-vs-jwt, oauth-2-1, auth-architecture]
updated: "2026-05"
---

## TL;DR

Duas opções pra Next.js falar com Go autenticado:

1. **Direct CORS**: Next chama `api.exemplo.com` direto, navegador segura cookie cross-domain. Funciona, mas exige `SameSite=None; Secure`, vira pesadelo em dev, e expõe a API ao mundo.
2. **BFF (recomendado)**: Next expõe `/api/*` em **mesmo domínio**, esses route handlers fazem proxy server-side pro Go. Cookie httpOnly nasce e morre no domínio do Next. Go nunca vê o navegador diretamente.

Em produção sênior, **BFF ganha** quase sempre. Este card é sobre como montar o BFF do lado Go (e o handshake do Next).

## Arquitetura BFF

```
Browser ──cookie httpOnly──> app.exemplo.com (Next.js)
                                  │
                                  │ Bearer token (server-side, nunca volta pro browser)
                                  ▼
                            api.exemplo.com (Go)
```

- Browser nunca vê o `access_token`.
- Cookie é `SameSite=Lax`, `Secure`, `httpOnly`, com path `/`.
- Go pode ficar em rede privada (VPC, Cloud Run interno) — nunca exposto à internet.

## Lado Go: emissão de token + endpoint de sessão

Go expõe `/auth/token` que aceita credenciais e devolve o par `access_token` + `refresh_token`. **Quem armazena cookies é o Next**, não o Go.

```go
// internal/handler/auth.go
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Email    string `json:"email"`
        Password string `json:"password"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid_body", http.StatusBadRequest)
        return
    }

    user, err := h.svc.Authenticate(r.Context(), req.Email, req.Password)
    if err != nil {
        // Mesma resposta pra user-not-found e wrong-password — evita user enumeration
        http.Error(w, "invalid_credentials", http.StatusUnauthorized)
        return
    }

    access, _ := h.tokens.IssueAccess(user.ID, 15*time.Minute)
    refresh, _ := h.tokens.IssueRefresh(user.ID, 30*24*time.Hour)

    json.NewEncoder(w).Encode(map[string]string{
        "access_token":  access,
        "refresh_token": refresh,
    })
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
    var req struct{ RefreshToken string `json:"refresh_token"` }
    json.NewDecoder(r.Body).Decode(&req)

    pair, err := h.svc.RotateRefresh(r.Context(), req.RefreshToken)
    if err != nil {
        http.Error(w, "invalid_refresh", http.StatusUnauthorized)
        return
    }
    json.NewEncoder(w).Encode(pair) // emite novo par; refresh antigo é invalidado
}
```

**Refresh rotation é não-negociável**: cada `/refresh` invalida o token anterior. Se um atacante usar um refresh já rotacionado, o Go detecta reuso e revoga toda a família de tokens daquele usuário (defense in depth).

```go
func (s *AuthService) RotateRefresh(ctx context.Context, token string) (TokenPair, error) {
    claims, err := s.tokens.VerifyRefresh(token)
    if err != nil {
        return TokenPair{}, ErrInvalidRefresh
    }
    used, err := s.refreshStore.MarkUsed(ctx, claims.JTI)
    if err != nil {
        return TokenPair{}, err
    }
    if used {
        // Reuso detectado — revoga TODOS os refresh tokens deste user
        _ = s.refreshStore.RevokeFamily(ctx, claims.UserID, claims.FamilyID)
        return TokenPair{}, ErrRefreshReused
    }
    // Emite novo par com novo JTI mas mesma família
    return s.issuePair(claims.UserID, claims.FamilyID)
}
```

## Lado Next: route handlers como BFF

```ts
// app/api/auth/login/route.ts
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const r = await fetch(`${process.env.GO_API_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!r.ok) return Response.json({ error: "invalid_credentials" }, { status: 401 });

  const { access_token, refresh_token } = await r.json();
  const jar = await cookies();

  jar.set("access_token", access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax", // 'lax' permite navegação top-level; 'strict' quebra OAuth callbacks
    path: "/",
    maxAge: 15 * 60,
  });
  jar.set("refresh_token", refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/auth", // limitado ao endpoint de refresh
    maxAge: 30 * 24 * 60 * 60,
  });

  return Response.json({ ok: true });
}
```

Helper pra usar em RSC e Server Actions:

```ts
// src/lib/auth.ts (server-only)
import "server-only";
import { cookies } from "next/headers";

export async function getAccessToken(): Promise<string> {
  const jar = await cookies();
  const access = jar.get("access_token")?.value;
  if (access && !isExpired(access)) return access;

  // Auto-refresh transparente
  const refresh = jar.get("refresh_token")?.value;
  if (!refresh) throw new Error("UNAUTHENTICATED");

  const r = await fetch(`${process.env.GO_API_URL}/auth/refresh`, {
    method: "POST",
    body: JSON.stringify({ refresh_token: refresh }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error("UNAUTHENTICATED");

  const pair = await r.json();
  jar.set("access_token", pair.access_token, /* ... */);
  jar.set("refresh_token", pair.refresh_token, /* ... */);
  return pair.access_token;
}
```

## CORS quando você *não* tem BFF

Se realmente precisar de CORS direto (ex: dois domínios separados, mobile + web compartilhando API), o middleware Go fica:

```go
// internal/middleware/cors.go
func CORS(allowedOrigins []string) func(http.Handler) http.Handler {
    set := make(map[string]struct{}, len(allowedOrigins))
    for _, o := range allowedOrigins {
        set[o] = struct{}{}
    }
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            origin := r.Header.Get("Origin")
            if _, ok := set[origin]; ok {
                w.Header().Set("Access-Control-Allow-Origin", origin)
                w.Header().Set("Access-Control-Allow-Credentials", "true")
                w.Header().Set("Vary", "Origin")
                w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-ID")
                w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
            }
            if r.Method == http.MethodOptions {
                w.WriteHeader(http.StatusNoContent)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}
```

**Não use `*` com `Allow-Credentials: true`** — o navegador rejeita. Sempre allowlist explícita por env var.

## CSRF: precisa pensar?

- **Server Actions do Next**: já têm proteção CSRF nativa (Next 15 valida Origin/Host).
- **Route Handlers do Next agindo como BFF**: `SameSite=Lax` cobre o caso comum. Pra mutações cross-origin (raras com BFF), adicione token CSRF double-submit:

```go
// Go gera token no /auth/login junto com a sessão e valida via middleware
csrfToken := generateCSRFToken(user.ID)
w.Header().Set("X-CSRF-Token", csrfToken)
```

```ts
// Next armazena em cookie NÃO-httpOnly e ecoa em header X-CSRF-Token nas mutações
```

Pra REST puro com BFF same-origin, o risco prático de CSRF é baixo. Foque em XSS (que mata qualquer mitigação CSRF se o atacante já tem JS executando).

## Checklist de produção

- [ ] BFF mesmo domínio (`app.exemplo.com` proxy pra `api.exemplo.com` em rede privada)
- [ ] Cookies: `httpOnly`, `Secure`, `SameSite=Lax`, `path` restrito quando faz sentido
- [ ] Refresh rotation com detecção de reuso → revoga família
- [ ] Access token curto (15 min), refresh longo (7-30 dias) com sliding window opcional
- [ ] Nenhum `access_token` no `localStorage`, `sessionStorage`, nem em variável JS no browser
- [ ] `Content-Security-Policy` apertado (sem `unsafe-inline`) — XSS continua sendo o vetor #1
- [ ] Log de evento `refresh_reused` com alerta — sinal forte de comprometimento
- [ ] Rate limit em `/auth/login` (algo como 5 tentativas/min/IP + 10/min/email)
- [ ] Resposta uniforme pra credenciais inválidas (sem user enumeration)
- [ ] HTTPS estrito (HSTS preload se domínio puder)

## Anti-patterns

- **JWT no `localStorage`**: comprometido por qualquer XSS. Vira moda em tutoriais; não use em produção séria.
- **`SameSite=None` sem necessidade**: abre porta pra CSRF e exige `Secure` em dev (HTTPS local). Só justifica em iframe cross-domain ou OAuth muito específico.
- **Token sem expiração ou TTL gigante** "pra não atrapalhar o usuário": cada vazamento vira incidente longo.
- **Refresh sem rotation**: refresh tokens longos não-rotacionados são chaves mestras pra quem roubar.
- **Validar JWT no Next sem chave pública**: o Next BFF pode confiar no cookie e passar adiante; quem valida é o Go. Não duplique validação em dois lugares — duplica bug.

## Como pedir pra IA

```
Implemente o fluxo BFF de autenticação entre Next.js 15 e backend Go:

LADO GO (Chi):
- POST /auth/login → access_token (15min) + refresh_token (30d)
- POST /auth/refresh → rotation com detecção de reuso (revoga família)
- Middleware AuthZ que valida access_token via PASETO ou JWT (HS256/EdDSA)
- Rate limit no login (5/min/IP)
- Resposta uniforme pra credenciais inválidas

LADO NEXT (route handlers + helpers):
- /api/auth/login → grava cookies httpOnly Secure SameSite=Lax
- src/lib/auth.ts → getAccessToken() com auto-refresh transparente
- Cookie refresh_token com path /api/auth (escopo mínimo)
- Server Actions e RSC usam getAccessToken() sem expor ao client

NUNCA:
- JWT no localStorage
- Cookies sem httpOnly
- Refresh sem rotation
- access_token em variável global do client
```
