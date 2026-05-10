---
title: Broken Access Control — IDOR, BOLA, Mass Assignment, Business Logic
category: auth
stack: [REST, API, GraphQL, auth]
tags: [access-control, idor, bola, mass-assignment, business-logic, owasp-a01]
excerpt: A categoria #1 do OWASP Top 10 e onde 90% dos bugs reais de bug bounty estão. IDOR, BOLA, mass assignment, business logic — onde apps modernas caem.
related: [sec-owasp-top10-2025, sec-auth-attacks-modern, audit-api-endpoint, rbac-vs-abac]
updated: "2026-05-10"
---

## Por que esse é o tema mais importante

OWASP Top 10 A01:2021 = Broken Access Control. Top 10 API Security A01:2023 = BOLA. **94% das apps web tem alguma falha de access control** segundo OWASP. Em bug bounty real, IDOR + business logic dominam o leaderboard de Sev-High/Critical. É menos sexy que XSS, mas paga mais.

## IDOR — Insecure Direct Object Reference

App expõe ID de objeto na URL/body e não valida ownership.

```
# Vulnerável
GET /api/orders/12345 → retorna order independente de quem é o owner
GET /api/users/100/email → retorna email de qualquer user

# Variantes
GET /api/orders/12345         # ID sequencial
GET /api/orders/AB23F         # ID "alfanumérico" mas previsível
GET /api/orders/uuid-..       # UUID — mas se vazado em outro endpoint, exploitável
```

### Como achar IDOR no engagement

1. Logar com 2 contas (A e B).
2. Conta A faz request normal: `GET /api/orders/100` (próprio pedido).
3. Conta B repete request: `GET /api/orders/100`. Pega? IDOR.
4. Variantes:
   - Trocar método (`GET` vs `PUT` vs `DELETE`).
   - Trocar verbo HTTP (`GET /admin` falha, `POST /admin` passa).
   - URL canonicalization (`/orders/100` vs `/orders/100/` vs `/orders/100%00`).
   - JSON vs query (`?id=100` vs body `{"id": 100}`).

### IDOR em GraphQL

```graphql
# Lista ID de objeto de outro user
query { orders { id customerId } }

# Pega detalhe do ID descoberto
query { order(id: "100") { items billing } }
```

Server precisa autorizar **cada resolver**, não só na borda.

### Object Reference indireto (token)

Em vez de ID direto, usa token de sessão:
```
GET /api/cart/<session-token>
```

Mais resistente, mas: tokens vazam em logs/referer/screenshot, brute force em token curto.

### IDOR em parâmetros não óbvios

```http
POST /api/transfer HTTP/1.1
X-Account-Id: 999       # header customizado — testar trocar
Cookie: account=123     # cookie usado como source of truth (ruim, atacante muda)
```

## BOLA — Broken Object Level Authorization (OWASP API #1)

BOLA é IDOR no contexto de API. Mesma raiz, mas em APIs REST com /resource/:id é o problema dominante.

```python
# ❌ Comum em FastAPI/Express
@app.get("/api/projects/{id}")
def get_project(id: int, user = Depends(get_current_user)):
    return db.projects.get(id)   # sem filter por owner

# ✅
@app.get("/api/projects/{id}")
def get_project(id: int, user = Depends(get_current_user)):
    project = db.projects.get(id)
    if project.owner_id != user.id and user not in project.collaborators:
        raise HTTPException(404)   # 404 não 403 — não vazar existência
    return project
```

## BFLA — Broken Function Level Authorization (API #5)

User comum acessa endpoint admin:

```
GET /api/users         → 200 (lista todos os users — só admin deveria)
DELETE /api/users/1    → 204 (deletou outro user — só admin deveria)
POST /api/admin/promote → 200 (auto-promovido a admin)
```

Causa: middleware de auth checa JWT mas não checa role. Rota não tem decorator `@require_admin`.

## Mass Assignment

Body do request seta campos que user não deveria controlar:

```typescript
// User envia:
PATCH /api/users/me
{ "name": "Bob", "role": "admin", "credit_balance": 999999 }

// ❌ Backend faz:
await db.users.update({ id: user.id }, req.body)
// Atualizou role e credit_balance também
```

Mitigação:
```typescript
// Allowlist explícita
const allowed = { name: req.body.name }
await db.users.update({ id: user.id }, allowed)

// Ou DTO validado (Zod, Joi, class-validator)
const schema = z.object({ name: z.string() })
const safe = schema.parse(req.body)  // rejeita campos extras com .strict()
await db.users.update({ id: user.id }, safe)
```

Frameworks com "fillable / guarded" (Laravel, Rails) ainda tem mass assignment se mal configurado.

## Privilege Escalation Vertical

User vira admin sem ser admin.

```
# 1. Endpoint admin sem check
POST /api/admin/users/promote { "userId": <self> }

# 2. JWT manipulation
# Pega JWT, decode, muda { role: "admin" }, encode. Se HS256 fraco ou alg=none, válido.

# 3. Self-registration de admin
POST /api/users { "email":"x", "password":"y", "role":"admin" }
# (mass assignment + endpoint público)

# 4. Race condition em onboarding
POST /api/users + POST /api/users/<new>/promote em paralelo
# Promote roda antes do enforcement kick in
```

## Privilege Escalation Horizontal

User A acessa dados de user B (não admin, mesmo nível).

Já coberto em IDOR — é a face mais comum.

## Path Traversal — access control via path

```
GET /api/files/<filename>

# Tentativas:
filename=../../etc/passwd
filename=..%2f..%2fetc%2fpasswd
filename=....//etc/passwd       # sanitizer remove "../" uma vez
filename=%2e%2e%2fetc%2fpasswd
filename=/etc/passwd            # absolute path se backend permite
filename=file:///etc/passwd     # scheme abuse
```

Mitigação: canonicalize path, restringe diretório base, regex `^[a-zA-Z0-9_.-]+$`.

## CORS misconfig como access control

CORS com `Access-Control-Allow-Origin: <reflete>` + `Access-Control-Allow-Credentials: true` = atacante pode fazer browser da vítima ler resposta autenticada de qualquer endpoint.

Já coberto em `sec-web-fundamentos-headers` — mas listado aqui porque é access control no transporte.

## Business Logic Flaws

Falhas que não são bugs de implementação — são modelo errado.

### Exemplos reais

```
# 1. Desconto aplicado duas vezes via race
POST /api/cart/discount   # aplica 20% off
POST /api/cart/discount   # outro 20%
POST /api/checkout        # paga 40% off

# 2. Quantidade negativa
POST /api/transfer { "from":"A", "to":"B", "amount":-100 }
# Resultado: A ganha 100, B perde 100

# 3. Workflow skip
# Fluxo legítimo: pedido → aprovação → cobrança
# Atacante: chama /checkout direto, pulando aprovação
POST /api/checkout/complete { "orderId": 100 }

# 4. Refund duplicado
POST /api/refund/100
POST /api/refund/100   # sem idempotency, paga refund dobrado

# 5. Coupon enumerate + try-all
POST /api/coupon { code: "AAA" } → 404
POST /api/coupon { code: "AAB" } → 200 (válido!)
# Bruteforce de 26^4 codes sem rate limit

# 6. 2FA bypass via /reset-password
# /login pede MFA. /reset-password seta nova senha sem MFA.
```

### Como achar business logic flaws

- **Pensar em "o que o app NUNCA deveria deixar acontecer"** e tentar fazer acontecer.
- **Manipular ordem de operações** — pular passos, repetir passos, fazer em paralelo.
- **Valores extremos**: 0, negativos, decimais (1.5 items), strings em campos numéricos, timestamps no passado/futuro.
- **Race conditions** (Turbo Intruder): enviar mesma operação em paralelo (refund, discount, coupon).

## Padrões defensivos

### Authorize na borda E no resolver

```typescript
// Borda (middleware)
app.use('/api', authenticate)         // valida JWT
app.use('/api/admin', requireRole('admin'))

// Resolver — autorize cada recurso
app.get('/api/orders/:id', async (req, res) => {
  const order = await db.orders.findOne({ id: req.params.id })
  if (!order) return res.status(404).end()
  if (order.userId !== req.user.id && !req.user.roles.includes('admin')) {
    return res.status(404).end()      // 404 não 403
  }
  return res.json(order)
})
```

### Policy as code

OPA (Open Policy Agent), Cedar (AWS), Casbin — políticas declarativas centralizadas:

```rego
# OPA
package authz
default allow = false

allow {
  input.user.id == input.resource.owner_id
}
allow {
  input.user.roles[_] == "admin"
}
```

### ReBAC / RBAC / ABAC

- **RBAC**: roles → permissions. Simples, escala bem.
- **ABAC**: attributes (department, region, classification). Granular, complexo.
- **ReBAC**: relacionamentos (Google Zanzibar). `user X is editor of doc Y`. Para apps colaborativas (Notion, Figma).

Veja card `rbac-vs-abac`.

## Audit checklist

- [ ] Cada endpoint protegido testa ownership? (Pega 2 contas, faz request)
- [ ] Endpoints admin protegidos por role check no resolver?
- [ ] Mass assignment: DTO estrito ou allowlist?
- [ ] Path traversal: canonicalize + base directory?
- [ ] Workflow: ordem de operações forçada? Idempotência?
- [ ] Race conditions testadas com Turbo Intruder?
- [ ] CORS allowlist estrita, sem reflexão?

## Ferramentas

- **Burp Autorize** — replay com sessão de outra conta automaticamente.
- **Burp Repeater** — manual.
- **Turbo Intruder** — race conditions.
- **JWT_Tool** — manipulação de role/sub em JWT.

## Leituras

- OWASP API Security Top 10 (2023): owasp.org/API-Security
- PortSwigger Academy: "Access control vulnerabilities", "Business logic vulnerabilities"
- "The Web Application Hacker's Handbook" cap 8 (Access Control)
- HackTricks: "API Pentesting" section
- "How to find more IDORs" — Vickie Li
