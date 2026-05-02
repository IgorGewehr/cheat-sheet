---
title: "SAST e DAST no pipeline de CI/CD"
category: "auth"
stack: ["Node.js", "TypeScript", "Docker", "GitHub Actions", "Semgrep", "OWASP ZAP", "Trivy"]
tags: ["sast", "dast", "semgrep", "trivy", "zap", "container-scanning", "pipeline", "devsecops"]
excerpt: "Semgrep para análise estática, OWASP ZAP para testes dinâmicos, Trivy para container scanning — como integrar no CI sem travar o deploy."
---

## Visão Geral

SAST (Static Application Security Testing) analisa o código sem executar. DAST (Dynamic Application Security Testing) ataca a aplicação em execução. São complementares — cada um encontra classes diferentes de vulnerabilidades.

**SAST** encontra: SQL injection em código, secrets hardcoded, uso de funções inseguras, configurações erradas, dependency vulnerabilities.

**DAST** encontra: problemas de configuração em runtime, vulnerabilidades de auth em fluxo real, XSS refletido, headers ausentes, issues que só aparecem com a app rodando.

Container scanning (Trivy) é uma terceira camada: encontra CVEs em pacotes do SO e dependências da imagem.

---

## Quando usar

| Ferramenta | Quando roda | O que encontra |
|---|---|---|
| Semgrep | Em todo PR (rápido, < 2 min) | Patterns de código inseguro, secrets, OWASP |
| npm audit / Dependabot | Em todo PR + schedule | CVEs em dependências npm |
| Trivy | No build da imagem Docker | CVEs no SO e pacotes da imagem |
| OWASP ZAP | Em deploy de staging | Vulnerabilidades em runtime |
| Semgrep Pro / CodeQL | Schedule semanal | Análise mais profunda, dataflow |

---

## Trade-offs

**SAST tem falsos positivos** — código que parece inseguro mas tem contexto que o torna seguro. Configurar regras custom e baseline de exceções é investimento necessário.

**DAST precisa de ambiente** — ZAP precisa da aplicação rodando. Rodar em produção sem cuidado pode criar dados sujos ou acionar alertas reais. Use ambiente de staging dedicado.

**Bloquear vs alertar:** bloquear o merge em CRITICAL findings protege mas pode gerar resistência. A estratégia madura: bloquear apenas em findings novos que não existiam na branch main (delta security).

---

## Implementação

### Semgrep — SAST no GitHub Actions

```yaml
# .github/workflows/security.yml
name: Security

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  semgrep:
    name: SAST — Semgrep
    runs-on: ubuntu-latest
    container:
      image: semgrep/semgrep
    if: github.actor != 'dependabot[bot]'

    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep
        run: |
          semgrep \
            --config=auto \
            --config=p/typescript \
            --config=p/nodejs \
            --config=p/owasp-top-ten \
            --config=p/secrets \
            --config=./semgrep-rules/ \
            --output=semgrep-results.json \
            --json \
            --error \
            --severity=ERROR
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}

      - name: Upload results
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: semgrep-results.json

  npm-audit:
    name: Dependency audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit --audit-level=high
```

### Semgrep — regras custom para seu stack

```yaml
# semgrep-rules/custom-nodejs.yml
rules:
  # Detectar SQL concatenado com variável
  - id: sql-injection-string-concat
    patterns:
      - pattern: |
          $QUERY = "..." + $VAR
      - pattern-either:
          - pattern-inside: db.query(...)
          - pattern-inside: pool.query(...)
    message: >
      Possível SQL Injection: variável concatenada em query.
      Use parâmetros ($1, $2) em vez de concatenação.
    languages: [typescript, javascript]
    severity: ERROR
    metadata:
      cwe: "CWE-89"
      owasp: "A03:2021"

  # Detectar Math.random() para tokens
  - id: insecure-random-token
    patterns:
      - pattern: Math.random()
      - pattern-inside: |
          ... token ... = ...
    message: >
      Math.random() não é criptograficamente seguro.
      Use crypto.randomBytes() para tokens de segurança.
    languages: [typescript, javascript]
    severity: WARNING
    metadata:
      cwe: "CWE-338"

  # Detectar console.log com variáveis potencialmente sensíveis
  - id: sensitive-log
    pattern-either:
      - pattern: console.log(..., $VAR, ...) where $VAR =~ "(?i)(password|secret|token|key|credential)"
      - pattern: logger.info({..., password: ..., ...})
    message: >
      Possível log de dado sensível. Verifique se não está logando senha, token ou chave.
    languages: [typescript, javascript]
    severity: WARNING

  # Detectar uso de eval
  - id: no-eval
    pattern: eval($X)
    message: "eval() é perigoso — permite execução de código arbitrário."
    languages: [typescript, javascript]
    severity: ERROR
    metadata:
      cwe: "CWE-95"
```

### Trivy — Container scanning no CI

```yaml
# Adicionado ao workflow de security.yml
  trivy-scan:
    name: Container — Trivy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'          # falha o CI em CRITICAL/HIGH
          ignore-unfixed: true    # ignora vulns sem patch disponível

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
```

```bash
# Rodar Trivy localmente para debug
trivy image --severity CRITICAL,HIGH --ignore-unfixed myapp:latest

# Scan do filesystem (dependências, configs)
trivy fs --severity HIGH,CRITICAL .

# Scan de repositório Git (secrets, misconfigs)
trivy repo --secret-config trivy-secret.yaml .
```

### Trivy — configuração de ignore para falsos positivos

```yaml
# .trivyignore.yaml — exceções documentadas
ignoredVulnerabilities:
  - id: CVE-2023-XXXXX
    paths:
      - "usr/local/bin/node"
    reason: >
      Vulnerabilidade em contexto de filesystem local apenas.
      Nossa aplicação não expõe esse vetor. Aguardando patch da upstream.
    expires: 2026-09-01  # forçar revisão periódica
```

### OWASP ZAP — DAST em staging

```yaml
# .github/workflows/dast.yml
name: DAST — OWASP ZAP

on:
  # Rodar após deploy em staging
  workflow_run:
    workflows: ["Deploy Staging"]
    types: [completed]

jobs:
  zap-scan:
    name: DAST
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}

    steps:
      - uses: actions/checkout@v4

      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: ${{ vars.STAGING_URL }}
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'   # incluir ajax spider
          fail_action: true   # falhar em alerts HIGH

      - name: Upload ZAP results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: zap-report
          path: report_html.html
```

```tsv
# .zap/rules.tsv — configurar quais regras ignorar (falsos positivos)
# WARN	ruleId	ruleDescription
IGNORE	10015	Incomplete or No Cache-control and Pragma HTTP Header Set  # CDN cuida disso
IGNORE	10020	Anti-clickjacking Header                                  # CSP frame-src 'none' cobre
WARN	10021	X-Content-Type-Options Header Missing
```

### ZAP Authenticated Scan — varredura com usuário autenticado

```yaml
- name: ZAP Authenticated Scan
  uses: zaproxy/action-full-scan@v0.10.0
  with:
    target: ${{ vars.STAGING_URL }}
    cmd_options: >
      -z "auth.loginurl=${{ vars.STAGING_URL }}/auth/login
          auth.username=zap-test@example.com
          auth.password=${{ secrets.ZAP_TEST_PASSWORD }}
          auth.username_field=email
          auth.password_field=password
          auth.loggedin_regex=\Qwelcome\E"
```

### Priorizar findings sem travar o deploy

```typescript
// scripts/evaluate-security-findings.ts
// Script para CI — determina se findings bloqueiam o merge

interface Finding {
  ruleId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  path: string;
  line?: number;
  isNew: boolean; // comparado com main
}

async function evaluateFindings(findings: Finding[]): Promise<void> {
  const criticalNew = findings.filter(f => f.severity === 'CRITICAL' && f.isNew);
  const highNew = findings.filter(f => f.severity === 'HIGH' && f.isNew);

  // Log completo para visibilidade
  console.table(findings.map(f => ({
    severity: f.severity,
    rule: f.ruleId,
    path: f.path.replace(process.cwd(), '.'),
    status: f.isNew ? '🆕 NEW' : '📋 existing',
  })));

  // Bloquear apenas findings NOVOS de alta severidade
  if (criticalNew.length > 0) {
    console.error(`❌ ${criticalNew.length} CRITICAL finding(s) introduzidos neste PR. Não pode fazer merge.`);
    process.exit(1);
  }

  if (highNew.length > 0) {
    console.warn(`⚠️  ${highNew.length} HIGH finding(s) novos. Criar issue de segurança antes do merge.`);
    // Não bloqueia — cria issue automaticamente via GitHub API
    await createSecurityIssue(highNew);
  }

  console.log('✅ Security check passed');
}
```

---

## Armadilhas

- **Rodar ZAP em produção**: ZAP pode gerar alertas reais, criar dados sujos e disparar rate limits. Use staging com dados sintéticos.
- **Ignorar falsos positivos sem documentar**: cada `IGNORE` no Trivy ou Semgrep precisa de reason e data de revisão — falso positivo hoje pode ser vuln real amanhã.
- **SAST sem contexto de dados**: Semgrep analisa padrões de código. Ele não sabe que aquela variável foi sanitizada 3 linhas antes — espere falsos positivos em código bem escrito.
- **Não comparar com baseline da main**: bloquear todo finding antigo cria resistência. O fluxo correto é bloquear findings novos e tratar os existentes como dívida técnica com SLA.
- **Imagem base desatualizada**: `FROM node:20` pega a versão mais recente no momento do build, mas não atualiza automaticamente depois. Use `FROM node:20-bookworm-slim` e configure update mensal do Dockerfile.

---

## Referências

- [Semgrep Registry](https://semgrep.dev/r)
- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [OWASP DevSecOps Guideline](https://owasp.org/www-project-devsecops-guideline/)
- [GitHub Advanced Security](https://docs.github.com/en/code-security)
