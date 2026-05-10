---
title: "Checkpoint Tier 4: Auditoria Real OSS"
category: checklists
stack: [Semgrep, CodeQL, manual review, SARIF]
tags: [checkpoint, code-review, oss, audit, appsec]
excerpt: Validação do Tier 4 — auditar codebase open-source (Node/Go/Python) com Semgrep + CodeQL + revisão manual. Entregar relatório executivo + técnico.
related: [sec-secure-code-review-playbook, sec-threat-modeling-2026, sec-fuzzing-modern]
updated: "2026-05-10"
---

## Objetivo

Demonstrar capacidade de conduzir auditoria de código real, mapear arquitetura, executar tools modernas, triagear findings e entregar relatório nível cliente — habilidades que pagam alto em consultoria AppSec.

## Critério de aprovação

- **1 codebase open-source** escolhida + auditada.
- **Findings list** com mínimo 5 issues (qualquer severidade) achados por ti em manual review (não apenas Semgrep automático).
- **Threat model** rápido do sistema (DFD + STRIDE quick).
- **Custom Semgrep rules** (mínimo 3) que detectam padrões encontrados.
- **Relatório executivo + técnico** estilo consultoria.
- **Submissão via /sentinela**.

## Tempo estimado: 60-100h

## Escolha de target

Critérios pra picking codebase:

- **Tamanho**: 5k-50k LoC sweet spot. Menor = pouco terreno. Maior = inviável em prazo.
- **Linguagem que você conhece**: Go, Node/TS, Python, Ruby.
- **Maturity**: project ativo (commits últimos 3 meses) mas não trivial (Bitcoin Core impossível em 60h).
- **Security relevance**: project que processa input não-confiável, tem auth, manipula dados sensíveis.
- **Não auditado recentemente** — Cure53 reports listados, evite projects com auditoria pública < 6 meses.

### Sugestões de targets (escolha 1)

**Tier "fácil-médio" (8-20k LoC):**
- **Soketi** (Pusher protocol websocket server, Node/TS) — auth tokens, channel auth.
- **Nivasn** (URL shortener Go) — input validation, auth.
- **Casbin examples / sub-projects** — auth library.
- **Plausible Analytics** (Elixir, has Node parts) — privacy-respecting analytics.

**Tier "médio" (20-50k LoC):**
- **NocoDB** (Node) — REST API + DB layer.
- **PocketBase** (Go, embedded BaaS) — auth, admin panel.
- **Outline** (TypeScript, wiki) — collaboration, OAuth.
- **AppFlowy** (Rust + Flutter) — note-taking, encryption.

**Tier "avançado" (50k+ LoC):**
- **Gitea / Forgejo** (Go) — git server.
- **Vault** (Go) — secrets management. WARNING: hardened, hard findings.
- **n8n** (TypeScript) — workflow automation, custom code execution.

**Avoid**: projects with active commercial bug bounty (HackerOne) — they've been picked over.

## Workflow recomendado (8 semanas, 1h/dia média)

### Semana 1: Onboard

- Clone repo. Read README, CONTRIBUTING, ARCHITECTURE.md.
- Run locally with `docker-compose up`. Browse the app.
- Identify entry points (routes, CLI, jobs).
- Map dependencies (`go mod graph`, `npm ls`).
- Read 2-3 most recent CHANGELOGs.

### Semana 2: Threat model

Quick threat model:

- DFD em 1 página.
- STRIDE pra cada componente top-level.
- Top 5 threats com priorização.
- Saída: `threat-model.md` (será anexo do relatório).

### Semana 3: Automated scan

```bash
# Semgrep
semgrep --config=auto --config=p/owasp-top-ten --sarif -o semgrep.sarif src/

# CodeQL
codeql database create db --language=javascript
codeql database analyze db javascript-security-extended.qls --format=sarif-latest --output=codeql.sarif

# Specific tools por linguagem:
# Go: govulncheck, gosec
# Python: bandit, pip-audit
# Node: npm audit, semgrep
# Ruby: brakeman, bundler-audit
```

Triage SARIF — separa true positives de noise.

### Semana 4-5: Manual review

Foque em superfícies que SAST não cobre bem:

- **Auth flows**: register, login, password reset, OAuth callbacks.
- **Authorization checks**: cada endpoint admin / IDOR.
- **Business logic**: workflow steps, state machines.
- **Input handling**: parsers, deserializers, file uploads.
- **Output**: templates, redirects, CORS, headers.
- **Concurrency**: race conditions, locks.
- **Crypto usage**: any custom (red flag), key management.
- **Third-party integrations**: webhooks, API tokens.

Documente findings progressivamente.

### Semana 6: Validation / PoC

Para cada finding, escreva PoC reprodutível:
- Curl command ou script que demonstra.
- Screenshots se UI.
- Minimal repro environment.

### Semana 7: Custom rules

Escreva Semgrep rules pros padrões que encontrou:
```yaml
# Example: detecta uso de eval com input from request
rules:
  - id: eval-of-request-input
    patterns:
      - pattern-either:
          - pattern: eval(req.$X)
          - pattern: eval(request.$X)
    message: eval() with request input — RCE risk
    severity: ERROR
    languages: [javascript, typescript]
```

3+ rules customizadas anexadas ao deliverable.

### Semana 8: Report writing

## Template de relatório

```markdown
# Code Security Audit — [Project Name]

**Auditor:** [Igor / Brain]
**Period:** YYYY-MM-DD to YYYY-MM-DD
**Project Version:** [commit hash or tag]
**Scope:** [files/modules in scope]
**Methodology:** Threat Modeling + Semgrep + CodeQL + Manual Review

---

## Executive Summary

Audited [project] version [v1.2.3] over [8 weeks]. Project handles [X functionality] for [user base]. Audit focused on [auth, input handling, business logic].

**Findings summary:**
- 2 Critical (immediate action)
- 5 High
- 8 Medium
- 12 Low
- 6 Informational

**Top concerns:**
1. Authentication: [issue] permits account takeover.
2. Authorization: IDOR in N endpoints exposes user data.
3. Input handling: SSRF in webhook endpoint enables internal scan.

**Recommendations:**
1. Implement fixes for Critical (P0) within 7 days, file public advisory.
2. Add CI Semgrep rules (provided) to prevent regression.
3. Quarterly external audit cycle.

---

## Threat Model

[Anexo: DFD + STRIDE catalog]

---

## Findings Catalog

### F-001: SQL Injection in /api/search (Critical)

**Severity:** Critical
**CVSS 4.0:** AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H → 10.0
**CWE:** CWE-89
**Affected file:** `src/api/search.ts:42`

**Description:**
The `search` parameter is concatenated directly into SQL query without parameterization.

**Code:**
\`\`\`typescript
const query = \`SELECT * FROM products WHERE name LIKE '%\${req.query.q}%'\`
const result = await db.execute(query)
\`\`\`

**Reproduction:**
\`\`\`bash
curl "http://localhost:3000/api/search?q=' UNION SELECT username,password FROM users--"
\`\`\`

**Impact:**
- Read access to entire database.
- Potential write/delete depending on DB user privileges.
- Authentication bypass via boolean SQLi against users table.

**Remediation:**
\`\`\`typescript
// Use parameterized query
const query = "SELECT * FROM products WHERE name LIKE ?"
const result = await db.execute(query, [\`%\${req.query.q}%\`])
\`\`\`

**References:**
- OWASP: A03:2021 Injection
- CWE-89

---

[More findings...]

---

## Custom Semgrep Rules

Three custom rules added to detect patterns found during audit:

### Rule 1: SQL string concat
[YAML]

### Rule 2: Direct eval of request input
[YAML]

### Rule 3: Missing authorization in route handler
[YAML]

---

## Process Recommendations

1. **CI integration**: Add Semgrep to GitHub Actions, block PRs with severity >= error.
2. **Code review checklist**: Section on security review questions.
3. **Threat modeling sessions**: Quarterly, on major features.
4. **External audit cycle**: Annual third-party audit.
5. **Bug bounty consideration**: After fixing P0/P1, consider opening bug bounty.

---

## Conclusion

[Project] is a well-engineered project but has several significant security issues that need attention. With the provided remediation, the security posture will significantly improve. We recommend addressing P0 findings within a week and incorporating the Semgrep rules into CI.

---

## Appendices

- A. Threat Model (DFD + STRIDE)
- B. Full SARIF output (anonymized)
- C. Custom Semgrep rules (3)
- D. Repro scripts (per finding)
```

## Submissão via /sentinela

Estrutura final:

```
tier4-checkpoint/
├── project-notes/             # research notes during engagement
├── threat-model.md            # DFD + STRIDE
├── findings/                  # one .md per finding F-001 through F-N
├── custom-rules/              # Semgrep .yaml files
├── repro/                     # curl/bash scripts
├── executive-summary.md
├── technical-report.md
└── audit-trail.csv            # day-by-day log
```

Submeter `/sentinela`. Critérios:

- **Quality > quantity**: 5 high-quality findings > 30 noise.
- **Each finding has reproduction** — não "we think this is vulnerable" sem PoC.
- **Remediation is concrete code**, não "validate input properly".
- **Linguagem é profissional** — cliente leigo lê executive summary e entende.
- **Custom rules são re-utilizáveis** pelo cliente em CI.

## O que NÃO conta

- Apenas rodar Semgrep sem manual review (Tier 4 expects depth).
- Findings só de outdated dependencies (use a different tool for that).
- Apenas low-severity / informational findings.
- Sem threat model.
- Sem testar disclosure responsável (não publicar findings em projeto não-comunicado).

## Disclosure responsável (obrigatório)

Se project tem security policy (SECURITY.md), siga.

Workflow padrão:
1. Email maintainer com finding details + PoC + suggested fix.
2. Aguarde acknowledgment (30 dias típico).
3. Coordenate timeline pra patch + disclosure pública.
4. Após patch released, publish writeup.
5. CVE request via MITRE ou GitHub Security Advisory.

**NÃO publicar PoC público antes do patch**. Bad faith disclosure mata reputação consultora.

Se project unresponsive após 90 dias, full disclosure permitido (Google Project Zero policy).

## Antes de avançar pro Tier 5

Após /sentinela retornar **PASS**, abre Tier 5 (AI Security + Consultoria + Capstone) — onde você combina todo o stack com AI security 2026+ e cierra com engagement empresarial completo.

## Recursos

- Cure53 reports (cure53.de/publications) — modelo gold standard de audit reports.
- Trail of Bits audits (github.com/trailofbits/publications) — open source de muitas auditorias.
- "The Tangled Web" — Michal Zalewski.
- Google Project Zero blog — disclosed vulnerability writeups.
- "Bug Bounty Bootcamp" — Vickie Li.
- GitHub Security Lab CodeQL queries (github.com/github/codeql).
