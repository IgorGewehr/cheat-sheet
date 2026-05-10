---
title: "Checkpoint Tier 1: PortSwigger Web Security Academy"
category: checklists
stack: [PortSwigger, Burp Suite, Caido]
tags: [checkpoint, labs, portswigger, web-pentest, hands-on]
excerpt: Validação prática do Tier 1 — 30+ labs do Web Security Academy + writeup técnico. Critério de aprovação pra avançar pra Cloud/AD pentest.
related: [sec-owasp-top10-2025, sec-injection-attacks-deep, sec-broken-access-control, sec-server-side-attacks]
updated: "2026-05-10"
---

## Objetivo do checkpoint

Demonstrar competência em **Web AppSec hands-on** antes de avançar pra cloud, AD, red team. O PortSwigger Web Security Academy é o melhor recurso gratuito do mercado pra isso. Não é certificação — é prova de skill.

## Critério de aprovação

- **30 labs completados** distribuídos pelas categorias abaixo (não os 30 mais fáceis).
- **3 writeups técnicos** com:
  - Reprodução curl + screenshot do Burp/Caido.
  - Análise de root cause (qual config/code permitiu?).
  - Remediation com snippet de código corrigido.
  - CVSS 4.0 calculado.
- **1 lab Expert** completado independente (sem solution).
- **Submeter os 3 writeups** via `/sentinela` no brain pra revisão.

## Setup

```bash
# Conta gratuita PortSwigger
# portswigger.net/users/register

# Burp Suite Community Edition (gratuito) — basta pra Apprentice e maioria Practitioner
# Caido (caido.io) — alternativa moderna

# Para labs Expert recomendado Burp Pro (trial 30 dias OK pro checkpoint)
```

## Distribuição obrigatória dos 30 labs

### SQL Injection (5 labs)

- [ ] Login bypass (Apprentice)
- [ ] Blind SQL injection with conditional responses (Practitioner)
- [ ] Blind SQL injection with time delays and information retrieval (Practitioner)
- [ ] SQL injection with filter bypass via XML encoding (Practitioner)
- [ ] Visible error-based SQL injection (Practitioner)

### Cross-Site Scripting (5 labs)

- [ ] Reflected XSS into HTML context with nothing encoded (Apprentice)
- [ ] DOM XSS in document.write sink using source location.search (Apprentice)
- [ ] Stored XSS into onclick event with angle brackets and double quotes HTML-encoded (Practitioner)
- [ ] Reflected XSS into a JavaScript string with single quote and backslash escaped (Practitioner)
- [ ] Reflected XSS with AngularJS sandbox escape and CSP (Expert)

### Access Control / IDOR (5 labs)

- [ ] Unprotected admin functionality (Apprentice)
- [ ] User role can be modified in user profile (Apprentice)
- [ ] URL-based access control can be circumvented (Practitioner)
- [ ] Method-based access control can be circumvented (Practitioner)
- [ ] Insecure direct object references (Apprentice)

### Authentication (4 labs)

- [ ] Username enumeration via different responses (Apprentice)
- [ ] 2FA simple bypass (Apprentice)
- [ ] Brute-forcing a stay-logged-in cookie (Practitioner)
- [ ] Offline password cracking (Practitioner)

### SSRF (3 labs)

- [ ] Basic SSRF against the local server (Apprentice)
- [ ] Basic SSRF against another back-end system (Apprentice)
- [ ] Blind SSRF with out-of-band detection (Practitioner)

### CSRF / CORS (2 labs)

- [ ] CSRF where token validation depends on request method (Practitioner)
- [ ] CORS vulnerability with trusted insecure protocols (Practitioner)

### JWT / OAuth (3 labs)

- [ ] JWT authentication bypass via flawed signature verification (Apprentice)
- [ ] JWT authentication bypass via jwk header injection (Practitioner)
- [ ] Authentication bypass via OAuth implicit flow (Practitioner)

### Server-Side (3 labs)

- [ ] Basic server-side template injection (Apprentice)
- [ ] Exploiting XXE using external entities to retrieve files (Apprentice)
- [ ] HTTP request smuggling, basic CL.TE vulnerability (Practitioner)

## Lab Expert (1 obrigatório, escolher)

Escolha **um** dos seguintes Expert labs e complete sem hint:

- "Bypassing flawed CSRF defenses using a clickjacked cross-site cookie"
- "Web cache poisoning via a fat GET request"
- "Server-side prototype pollution via untouchable properties"
- "Exploiting an API endpoint using documentation"
- "SQL injection with out-of-band interaction" (precisa Burp Pro Collaborator)

## Template de writeup

Salve cada writeup em markdown. Sugestão de estrutura:

```markdown
# [Lab Name]

**Categoria:** Access Control
**Dificuldade:** Practitioner
**Data:** 2026-XX-XX
**Tempo gasto:** XX min

## Resumo
Uma linha sobre a vulnerabilidade.

## Setup
- Browser logado como wiener:peter
- Burp interceptando

## Passos de exploração
1. Acessar /my-account, clicar em "Update email"
2. Em Burp Repeater, alterar request: `email[admin]=true`
3. ... screenshot

## Root cause
Backend usa Express body-parser que aceita estrutura nested.
Update faz: `Object.assign(user, req.body)` sem allowlist.

## Remediation
```javascript
// ❌ Vulnerável
Object.assign(user, req.body)

// ✅ Allowlist DTO
const safe = z.object({ email: z.string().email() }).strict().parse(req.body)
await db.users.update({ id }, safe)
```

## CVSS 4.0
**Vector:** CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:N/SC:N/SI:N/SA:N
**Base Score:** 8.5 (High)

## Impacto de negócio
Qualquer user pode escalar pra admin via single request — comprometimento total da app.

## Referências
- OWASP A01:2021 — Broken Access Control
- CWE-915 — Improperly Controlled Modification of Dynamically-Determined Object Attributes
- PortSwigger lab: <link>
```

## Tempo estimado

| Nível | Tempo médio |
|-------|-------------|
| Apprentice | 15-30 min |
| Practitioner | 30-90 min |
| Expert | 2-6h |

**Total estimado para checkpoint completo: 40-60 horas.** Não é pra fazer em 1 semana — distribuir em 6-8 semanas estudando 1h/dia.

## Como validar com /sentinela

1. Salvar os 3 writeups + lista de labs completados em pasta `tier1-portswigger/`.
2. Acessar `/sentinela` no brain.
3. Subir os writeups e pedir veredito: **PASS** (avança Tier 2), **WARN** (refinar antes de avançar), **DENY** (revisitar fundamentos).

Critérios que sentinela vai avaliar:
- Reprodução técnica está clara?
- Root cause identificada (não só "usar DOMPurify")?
- Remediation tem código?
- CVSS justifica score?
- Linguagem de relatório executivo (cliente entende impacto)?

## Recursos paralelos

Enquanto faz os labs, complementar com:

- **PortSwigger blog** (portswigger.net/research) — research de James Kettle, Gareth Heyes
- **HackTricks** (book.hacktricks.xyz) — comandos por cenário
- **Bug bounty disclosed reports** — HackerOne / Bugcrowd public reports
- **John Hammond YouTube** — walkthroughs estilo CTF
- **InsiderPhD YouTube** — bug bounty para iniciantes (Katie Paxton-Fear)

## Próximo passo

Quando o sentinela retornar **PASS** no Tier 1, abre o Tier 2 (Cloud, Container & Network Pentest) — onde a superfície empresarial real está.

## Observação importante

Os labs do PortSwigger são **isolados, criados pra ensinar**. Em engagement real:
- Vulnerabilidades raramente aparecem isoladas. Você vai encontrar uma vuln que precisa combinar com outra pra exploit útil.
- Documentação é raríssima — você reverse-engineering API.
- Tempo é restrito (1-2 semanas pra engagement típico).
- Cliente quer impacto de negócio, não "got XSS".

PortSwigger ensina mecânica. Os Tiers 2-5 ensinam o resto.
