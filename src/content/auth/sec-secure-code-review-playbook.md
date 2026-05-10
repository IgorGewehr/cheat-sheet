---
title: Secure Code Review Playbook — Semgrep, CodeQL, Manual
category: auth
stack: [Semgrep, CodeQL, SARIF, SAST]
tags: [code-review, sast, semgrep, codeql, appsec]
excerpt: Como conduzir code review de segurança real — Semgrep + CodeQL para automatizar, checklist por linguagem para o manual, SARIF triage para false-positives.
related: [sec-threat-modeling-2026, sec-fuzzing-modern, sast-dast-scanning]
updated: "2026-05-10"
---

## O serviço "code review de segurança"

Cliente paga consultor pra:
1. **Pré-launch**: garantir codebase está hardened antes de prod.
2. **Pós-incidente**: descobrir como X vulnerabilidade aconteceu, ver se há outras similares.
3. **Compliance** (SOC2, ISO 27001, PCI-DSS): evidence de review periódico.
4. **M&A due diligence**: avaliar codebase de empresa a adquirir.

Entregáveis comuns:
- Lista de findings com sev + reprodução + remediation.
- Threat model rápido (se não existe).
- Recommendations de processo (CI rules, training).
- Tooling recommendations (Semgrep rules customizadas).

## Methodology — 5 etapas

### 1. Onboard (1-2 dias)

- Recebe acesso (repo read-only — pode ser .zip se cliente paranoico).
- Lê README, ARCHITECTURE.md, ADRs (se existem).
- Identifica stack: linguagem, framework, DB, cloud, auth provider.
- Roda contagem: `cloc src/` — escala estimate.
- Pergunta: "**Que threat scenarios preocupam vocês?**" — guia priorização.

### 2. Automated scan (1-2 dias)

Tools:

```bash
# Semgrep — fast, OPL rules + custom
semgrep --config=auto src/
# OR specific rule packs:
semgrep --config=p/owasp-top-ten --config=p/javascript --config=p/typescript src/

# Output em SARIF for triage:
semgrep --config=auto --sarif --output=findings.sarif src/

# CodeQL — slow but deep
# Pre-built queries for Java, JS/TS, Python, Go, Ruby, C#, C/C++
codeql database create db --language=javascript --source-root=src/
codeql database analyze db --format=sarif-latest --output=codeql.sarif javascript-security-extended.qls
```

### 3. Manual review (4-6 dias)

Cobertura prioritizada por threat surface (não 100% do código):

- **Authentication/Authorization layer** — login, register, password reset, session, MFA, RBAC.
- **API endpoints expostos** — endpoints listed in routes/router.
- **Input sources** — onde dados de user entram (forms, URL params, file upload, webhooks).
- **Sink locations** — onde dados vão (DB query, shell exec, eval, HTML render).
- **Crypto operations** — qualquer use de hash, encrypt, sign, JWT.
- **External integrations** — calls a APIs de terceiros, OAuth providers.
- **Privilege boundaries** — onde código eleva permissão (sudo, setuid in app).

### 4. Triage findings (1-2 dias)

Tools podem gerar 500-2000 findings. Maior parte é false-positive.

Priorize:
- **Critical**: RCE, auth bypass, data exfil — fix imediato.
- **High**: IDOR/access control, SQLi, XSS persistente, secret leaked.
- **Medium**: XSS reflected, CSRF em endpoint não-crítico, info disclosure.
- **Low**: Headers de segurança ausentes, info verbose em error.
- **Info**: Code quality, deprecated dependency sem CVE.

Cada finding precisa de:
- CWE id.
- Reprodução técnica (snippet exato).
- Remediation com code suggested.
- Owner (qual time/módulo).

### 5. Report + readout (1-2 dias)

Entregáveis (igual relatório de pentest):
- Executive summary (1-2 páginas).
- Technical findings (each: title, severity, file:line, description, repro, remediation, references).
- Processo: recommendations para CI integration.
- Readout call de 1h com tech leads.

## Semgrep — bread and butter

### Por que Semgrep

- Velocidade — escaneia 10k LoC em ~30s.
- Multi-language (Python, JS, TS, Go, Java, Ruby, PHP, C, C#, Kotlin, Swift, Rust).
- Rules em YAML, fácil customizar.
- Open source + free hosted (Semgrep AppSec Platform).
- Output em SARIF (compatível com GitHub Code Scanning, GitLab).

### Custom rules — quando vale

Default ruleset é genérico. Custom rules dão valor real:

```yaml
# Detecta uso de auth bypass legado interno
rules:
  - id: legacy-auth-bypass
    pattern: |
      if ($USER.is_internal()):
          return True
    message: "Internal auth bypass detected — was supposed to be removed in v2.0"
    languages: [python]
    severity: ERROR
```

```yaml
# Detecta SQL string concat em vez de parametrized
rules:
  - id: sql-concat
    patterns:
      - pattern-either:
          - pattern: $DB.execute("..." + $X + "...")
          - pattern: $DB.execute(f"... {$X} ...")
    message: "SQL string concatenation — use parameterized queries"
    languages: [python]
    severity: ERROR
```

### Tipo de rules úteis em consultoria

- **Project-specific**: padrões internos do cliente (legacy patterns).
- **Compliance**: PCI-DSS req X, HIPAA req Y, LGPD art Z.
- **Anti-pattern**: detected during this engagement, add rule pra prevenir repetir.

### Semgrep Pro (paid)

- Cross-file taint analysis (sink em arquivo X traced back to source em arquivo Y).
- Specific frameworks (Spring, Django, Rails) detection.
- Supply chain (dependency vulnerability check).

Tier free é suficiente pra 80% dos casos.

## CodeQL — deep semantic analysis

CodeQL é mais lento (5-30min pra build database) mas profundamente semântico:

- Taint flow tracking através de funções.
- Variantes específicas detected.
- Used by GitHub Security Lab — descobre 0-days regularmente.

### Quando usar CodeQL

- Engagement long-form (8+ dias).
- Linguagem suportada (Java, JS/TS, Python, Go, Ruby, Swift, Kotlin, C#, C/C++).
- Você quer escrever queries custom muito específicas.

### Custom CodeQL query

```ql
// Detecta open redirect — flow de user input pra response.redirect
import javascript

class OpenRedirectConfig extends TaintTracking::Configuration {
  OpenRedirectConfig() { this = "OpenRedirect" }
  
  override predicate isSource(DataFlow::Node source) {
    source.(HTTP::RequestParameterAccess).isUserControlled()
  }
  
  override predicate isSink(DataFlow::Node sink) {
    exists(HTTP::RedirectInvocation r | sink = r.getUrlArgument())
  }
}

from OpenRedirectConfig cfg, DataFlow::Node source, DataFlow::Node sink
where cfg.hasFlow(source, sink)
select sink, source, sink, "Open redirect from $@", source, "user input"
```

## Manual review — checklists por linguagem

### Node.js / TypeScript

**Auth:**
- [ ] Session middleware: secure, HttpOnly, SameSite?
- [ ] JWT lib: rejects `alg=none`? Validates `aud`/`iss`?
- [ ] Password hash: bcrypt/argon2? Salt unique?
- [ ] Login: rate limit per IP + per user?

**Input handling:**
- [ ] Body parser: limit size (`limit: '100kb'`)?
- [ ] JSON schema validation (Zod/Joi)? Strict mode?
- [ ] File upload: type whitelist, size limit, no path traversal?
- [ ] Mass assignment: explicit allowlist, not `Object.assign(user, req.body)`?

**Output:**
- [ ] React: dangerouslySetInnerHTML usado? Sanitized?
- [ ] Templates: auto-escape? `{{!}}` (Handlebars unescaped) usado?
- [ ] Headers: CSP set in middleware?
- [ ] CORS: explicit allowlist?

**Database:**
- [ ] Parameterized queries (Drizzle, Prisma, knex)? Não string concat?
- [ ] ORM `findOne` filtros aplicados (não `where: req.body`)?
- [ ] Migrations seguras (sem `DROP TABLE` em rollback)?

**Common pitfalls:**
- [ ] `eval`, `new Function`, `setTimeout(string)`?
- [ ] `child_process.exec` com string concat?
- [ ] `require(<dynamic>)` ou import dynamic com user input?
- [ ] `process.env` com defaults inseguros?

### Python (Django, Flask, FastAPI)

**Auth:**
- [ ] Django: `LOGIN_REDIRECT_URL` validado contra open redirect?
- [ ] Password hash: PBKDF2 (Django default), bcrypt, argon2?
- [ ] Session: `SESSION_COOKIE_SECURE = True`, `HTTPONLY = True`?

**Input/Output:**
- [ ] `request.GET.get(...)` validated com `clean_*` methods?
- [ ] Templates: `|safe` filter usado em user content?
- [ ] CSRF middleware ativo? `@csrf_exempt` justified?

**Database:**
- [ ] Raw SQL com `params` (não format string)?
- [ ] `.extra()` queryset usado? (Deprecated, often vulnerable).
- [ ] Model `__defaults__` com mass assignment risks?

**Pitfalls:**
- [ ] `pickle.loads(user_input)` — RCE óbvia.
- [ ] `yaml.load` sem `Loader=yaml.SafeLoader` — RCE.
- [ ] `subprocess.run(shell=True)`.
- [ ] `eval`, `exec`, `compile`.
- [ ] `tempfile.mktemp` vs `mkstemp` (race condition).

### Go

**Auth:**
- [ ] Constant-time comparison (`subtle.ConstantTimeCompare`) for tokens/passwords?
- [ ] `crypto/rand`, não `math/rand` for tokens?
- [ ] Context propagation com timeout?

**SQL:**
- [ ] `sql.Query("... ?", args)` ou sqlc-generated?
- [ ] Never `fmt.Sprintf("... %s ...", userInput)` in SQL.

**Templates:**
- [ ] `html/template` (auto-escape) usado, não `text/template`?
- [ ] `template.HTML(input)` usado em qualquer lugar? (Bypass de escape).

**Pitfalls:**
- [ ] `exec.Command(name, args...)` com user-controlled `name`?
- [ ] HTTP client default? (sem timeout = goroutine leak DoS).
- [ ] `httputil.NewSingleHostReverseProxy` com user URL = SSRF.
- [ ] `os.OpenFile` com user-controlled path = traversal.
- [ ] Race conditions em maps (Go's map não thread-safe).

### Java / Kotlin (Spring)

- [ ] `@RestController` endpoints: `@PreAuthorize` ou similar?
- [ ] Jackson: `enableDefaultTyping`/`TypeNameHandling.All` desabilitado?
- [ ] XML parsing: `setFeature("disallow-doctype-decl", true)`?
- [ ] SQL: `JdbcTemplate.query(..., params)` parameterized?
- [ ] Spring Expression Language (SpEL): `@Value("#{...}")` com user input → RCE.
- [ ] Log4j: versão >= 2.17.1 (Log4Shell patched)?

### Ruby (Rails)

- [ ] Strong parameters (`params.require(...).permit(...)`) usado consistentemente?
- [ ] Active Record `where("col = #{x}")` vs `where("col = ?", x)`?
- [ ] CSRF protection enabled?
- [ ] `eval`, `send`, `public_send` com user input?
- [ ] `Marshal.load`, `YAML.load_unsafe`?

### C / C++

- [ ] Buffer overflows: `strcpy`, `sprintf`, `gets` → use `strncpy`, `snprintf`, `fgets`.
- [ ] Integer overflows em arithmetic com user-supplied sizes.
- [ ] Use-after-free: ownership claro?
- [ ] Format string: `printf(user_input)` vs `printf("%s", user_input)`.
- [ ] SUID binaries — checks ambiente, env_keep?

## Sink-source taint analysis manual

Para finding crítico, faça taint tracking:

1. **Find source** — onde user input entra.
2. **Trace** — chamadas que processam input. Sanitização ao longo do caminho?
3. **Find sink** — destino sensível (SQL, exec, eval, HTML, redirect).
4. **Verify exploit** — escreva PoC.

Tools auxiliam (CodeQL, Semgrep com Pro), mas manual catches sutilezas que tool perde.

## SARIF triage workflow

SARIF é formato padrão de output de SAST. Ferramentas pra triage:

- **GitHub Code Scanning**: UI nativa, comment em PR.
- **DefectDojo**: open-source, multi-tool aggregation, dedup.
- **Slither + Solhint** (Solidity): combina em DefectDojo.
- **Manual via VS Code SARIF Viewer extension**.

Dedup é importante — mesmo bug detectado por Semgrep + CodeQL não conta 2x.

## Cliente comum encontros (anti-patterns)

- **"Não temos tempo pra fix tudo, priorize"**: priorize por blast radius + ease of fix. Don't waste sev-medium that takes 1 week sobre 5 sev-high quick fixes.
- **"Esse é pre-existing technical debt, fora de scope"**: respeite, mas documente. Se introduce risk to engagement scope, escalate.
- **"Cliente quer falsos-positivos zerados"**: caro. Quote tempo extra ou seja explícito sobre tradeoffs.
- **"Cliente quer 'OWASP compliance'"**: clarify que OWASP Top 10 não é standard compliance, é guideline. Ofereça SOC2 / ISO 27001 controles mapping em vez.

## Pricing

Code review consultoria (Brasil 2026):
- **Solo consultant**: R$300-600 / hora.
- **Pacote pequeno** (~5k LoC, 1 dev sênior 2 semanas): R$30-80k.
- **Pacote médio** (~50k LoC, 1-2 consultores 4-6 sem): R$100-300k.
- **Pacote large** (Fortune 500 microservice estate): R$500k-2M+.

Fees variam por compliance scope (SOC2/PCI multiplica 1.5-2x).

## Process maturity recommendations

Pós-review, recomende cliente:

1. **Semgrep CI** com custom rules — block PR com critical findings.
2. **Pre-commit hooks** com fast rules (Gitleaks pra secrets).
3. **PR review checklist** com security questions.
4. **Quarterly threat modeling refresh**.
5. **Annual external assessment** (red team or pentest).
6. **AppSec champions program** — 1 dev por team trained as security advocate.
7. **Bug bounty program** (HackerOne, Bugcrowd) se maturity allows.

## Checklist final

- [ ] Findings têm reprodução técnica + remediation com código?
- [ ] CWE + OWASP mapeado?
- [ ] CVSS 4.0 calculado?
- [ ] False-positives marcados em rastreador?
- [ ] Custom Semgrep rules entregues pro CI do cliente?
- [ ] Readout call agendada?
- [ ] Recommendations de processo separadas dos findings técnicos?

## Leituras

- "Secure by Design" — Dan Bergh Johnsson (livro)
- "Software Security: Building Security In" — Gary McGraw
- Semgrep docs (semgrep.dev/docs)
- CodeQL learn (codeql.github.com/docs)
- "GitHub Security Lab" disclosed CVEs (great learning)
- OWASP Code Review Guide
- "The Tangled Web" — Michal Zalewski (browser security)
