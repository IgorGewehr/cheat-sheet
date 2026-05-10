---
title: Supply Chain Attacks — Dependency Confusion, Typosquatting, CI/CD
category: auth
stack: [npm, PyPI, GitHub Actions, Terraform, Helm]
tags: [supply-chain, dependency-confusion, typosquatting, ci-cd, slsa]
excerpt: "O vetor que dominou 2023-2025: dependency confusion, typosquatting, GitHub Actions malicioso, Terraform module abuse, Helm chart backdoors."
related: [secrets-management, sec-aws-pentest, sec-k8s-container-pentest]
updated: "2026-05-10"
---

## Por que supply chain é o vetor "preferido" 2026

- **Volume**: app empresarial moderna tem 1000-5000 dependências transitivas. Auditar manual é inviável.
- **Trust chain**: você confia em mantenedor que confia em mantenedor → atacante compromete 1 conta de mantenedor downstream popular.
- **High blast radius**: Log4Shell, SolarWinds, MOVEit, XZ Utils (CVE-2024-3094) — cada um afetou milhares de empresas.
- **Persistence**: dependência maliciosa fica até alguém auditar `package.json` (geralmente nunca).

Casos reais 2023-2025:
- **XZ Utils backdoor (CVE-2024-3094)**: backdoor em ssh via comprometimento social do mantenedor após 2 anos.
- **PyPI "ctx" e "phpass"**: takeover de packages abandonados pra inject creds-stealing code.
- **GitHub Actions tj-actions/changed-files (2024)**: action popular tinha workflow malicioso por horas até detecção.
- **Codecov bash uploader (2021)**: malicioso por 2 meses, comprometeu CI de milhares.
- **3CX (2023)**: SolarWinds-style chain attack via build infrastructure.

## Categorias de ataque

### Dependency Confusion (Alex Birsan, 2021)

Empresa usa package privado `@acme/auth-helper`. Atacante registra mesmo nome no registry público. Build:

```bash
npm install @acme/auth-helper
# npm verifica npm.com primeiro (latest version 9.9.9 — do atacante)
# Em vez do registry privado (latest 1.0.5)
# Pode rodar postinstall malicioso
```

Funciona quando `.npmrc` ou Yarn config não força scoped registry.

**Defesa**:
```
# .npmrc
@acme:registry=https://npm.internal.acme.com/
//npm.internal.acme.com/:_authToken=${NPM_TOKEN}
```

Versionar tudo `>=1.0.0` ajuda (atacante registra `0.0.1`).

### Typosquatting

`react` vs `reactt`, `requests` vs `request`, `colors` vs `colorss`. Develloper digita errado → instala malicioso.

```bash
# Common typo packages reported
npm-package: lodahs, momenttt, expresss
pip: requesta, urlib3 (sem L), tensorfllow
```

Mitigação: `npm audit signatures`, lockfile review pra novos packages, SonaType / Snyk no CI.

### Compromise de mantenedor

Mantenedor de package popular tem creds vazadas / sociado / hackeado. Atacante publica versão maliciosa. Quem usa `^` ou `~` em version → pega automaticamente.

```javascript
// package.json
"dependencies": {
  "ua-parser-js": "^1.0.32"   // atualiza automaticamente
}
```

Caso famoso: `ua-parser-js` 0.7.29 (2021) e `coa` / `rc` (2021).

**Defesa**: pin versão exata (`"1.0.32"`), use lockfile, `npm install --frozen-lockfile` no CI, audit signatures.

### Postinstall scripts

```json
{
  "scripts": {
    "postinstall": "node setup.js"
  }
}
```

`npm install` roda. Pode exfiltrar `.env`, ssh keys, AWS creds.

**Defesa**: `npm install --ignore-scripts` (não funciona pra packages que precisam build nativo); revisar `postinstall` no lockfile.

### Malicious GitHub Actions

```yaml
- uses: badactor/popular-action@v1
```

Action é repo GitHub. Atacante:
- Cria typo (`tj-action/cache` vs `tj-actions/cache`).
- Compromete repo legítimo (caso `tj-actions/changed-files` 2024).
- Reescreve tag `v1` pra commit malicioso (tags são móveis).

Action roda em CI runner com **secrets do repo expostos via env**. Exfil de secrets cloud, GitHub PAT, deploy tokens.

**Defesa**:
- **Pin SHA**, não tag: `uses: tj-actions/changed-files@a1b2c3d4...`
- Forka actions críticas pro seu org e use forks.
- `permissions:` mínimo no workflow (read-only por default).
- Renovate ou Dependabot pra atualizações monitoradas.

### Terraform module abuse

```hcl
module "vpc" {
  source = "git::https://github.com/random/terraform-aws-vpc"
  ...
}
```

Module externo pode:
- Conter resources que criam IAM users pro atacante.
- Provisioners (`local-exec`, `remote-exec`) rodando comandos no apply.
- Data sources que exfiltram (`data "external" "leak" { command = ["curl", "..."] }`).

Module Registry da HashiCorp tem signing — use registry oficial.

### Helm chart backdoors

```bash
helm install bitnami/postgresql
# Chart privado pode:
# - Adicionar initContainer que exfiltra secrets
# - Expor service em ClusterIP + NetworkPolicy missing
# - Deployar imagem do attacker
```

**Defesa**: `helm template` antes do install, audit chart, OCI registry com signing (cosign).

### Container image attacks

- **Pulled tag mutável**: `image: app:latest` → atacante substitui imagem no registry.
- **Public ECR/GCR squatting**.
- **Sidecar via mutation webhook** (Admission Controller comprometido injeta sidecar em cada pod).

**Defesa**: `image: registry/app@sha256:abc123` (digest pin), Notary/Cosign signing, registry interno espelho.

## SLSA — Supply chain Levels for Software Artifacts

Framework da Google/CNCF pra graduação de garantia:

| Level | Garantias |
|-------|-----------|
| **SLSA 1** | Build process documentado. Provenance gerada. |
| **SLSA 2** | Build em CI hosted (não local). Tamper-evident provenance. |
| **SLSA 3** | Build isolado (ephemeral runner). Source/build platform verificáveis. |
| **SLSA 4** | Two-party review, hermetic build, reprodutível. |

Maioria das orgs estão em L1-L2. L3 exige ferramentas como `slsa-github-generator`.

## SBOM (Software Bill of Materials)

CycloneDX e SPDX são formatos. Gerar com:

```bash
syft <image-or-dir> -o cyclonedx-json > sbom.json
# Listar todas dependências + versões + licenses

# Compliance + vuln check
grype sbom:sbom.json
```

Order Executive 14028 (US, 2021) tornou SBOM requisito para vendors federal. Vai virar requisito empresarial em geral 2026+.

## Sigstore / Cosign — signing moderno

Sigstore = PKI gratuita pra signing de artifacts. Cosign = ferramenta.

```bash
# Sign imagem
cosign sign --key cosign.key registry/app:v1.0.0

# Verify
cosign verify --key cosign.pub registry/app:v1.0.0

# Keyless signing (OIDC)
cosign sign --identity-token=$(gh auth token) registry/app:v1.0.0
```

Verificação no admission controller (Sigstore Policy Controller) bloqueia imagens não-assinadas no cluster.

## Auditing — playbook prático

### NPM project

```bash
# 1. Audit signatures
npm audit signatures

# 2. Lista deps com postinstall scripts
npm ls --all --json | jq '.. | objects | select(.scripts?.postinstall) | .name'

# 3. Vulns conhecidas
npm audit --audit-level=high

# 4. Análise estática (Snyk, Socket.dev)
npx @snyk/cli test
npx socket-security-cli scan

# 5. Verifica typos comuns
# Compara contra lista de packages legítimos populares.
```

### Python

```bash
# pip-audit (PyPI advisory DB)
pip install pip-audit
pip-audit

# Safety (Snyk-owned)
safety check

# Bandit pra código próprio
bandit -r src/
```

### Go

```bash
# govulncheck (Go team oficial)
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...

# Deps direta
go mod graph | grep -v "^github.com/myorg"
```

### CI/CD pipeline

- Revisar `.github/workflows/*` por:
  - Actions pinadas em SHA?
  - `permissions:` definido minimal?
  - Secrets vazando em logs (`echo $SECRET`)?
  - Untrusted PR running em runner com secrets (`pull_request_target` é perigoso)?
- Revisar GitLab `.gitlab-ci.yml` similar.
- Jenkinsfiles: stage com `sh()` aceitando params do user.

## Cidades de ferramentas — table de comparação

| Categoria | Tool | Notas |
|-----------|------|-------|
| **Vuln scan** | Snyk, Dependabot, Renovate, govulncheck, pip-audit, npm audit | Snyk paga premium; Dependabot+Renovate são free + reasonable. |
| **SBOM** | Syft, CycloneDX CLI, Anchore | Syft padrão de facto. |
| **Signing** | Cosign, Notary v2, GPG | Cosign vence — keyless + transparent log. |
| **SAST** | Semgrep, CodeQL, Snyk Code, SonarQube | Semgrep é o sweet spot pra dev. CodeQL pra projeto open-source. |
| **DAST** | OWASP ZAP, Burp Enterprise | DAST cara em CI. |
| **Container scan** | Trivy, Grype, Snyk Container, Aqua | Trivy é open-source padrão. |
| **IaC scan** | Checkov, tfsec, KICS, Snyk IaC | Checkov gratuito + cobertura ampla. |
| **Supply chain risk** | Socket.dev, Phylum, Endor Labs | Socket.dev tem GitHub App útil. |

## Detecting compromise

Se você suspeita de compromise:

1. **Diff lockfile**: `git log -p package-lock.json` — versões alteradas inesperadamente?
2. **Network traffic**: dependências que fazem outbound HTTP (DNS exfil) em runtime devops env.
3. **File creates**: filesystem watcher em CI mostra packages criando arquivos fora de seus diretórios.
4. **Strings em binários**: Go binaries assinados em SBOM. Strings inesperadas em build artifact.
5. **VirusTotal hash de artifact** — após build, hash o output, comparar com VT.

## Resposta a incidente de supply chain

1. **Pin versão** vulnerável fora — bloqueie no lockfile, abra issue.
2. **Audit blast radius**: quem rodou o build? quem usou o artifact? Logs de CI.
3. **Rotate secrets** que esse runner/pipeline teve acesso.
4. **Force rebuild** com versão limpa.
5. **Report ao CNCF/GitHub Security Lab** se for CVE potencial.

## Checklist defensivo

- [ ] Lockfile commitado e usado em CI (`--frozen-lockfile`, `npm ci`)?
- [ ] Scoped registry pra packages privados (anti-confusion)?
- [ ] GitHub Actions pinadas em SHA (não tag)?
- [ ] `permissions:` minimal em workflows?
- [ ] Secrets scanning no CI (TruffleHog, Gitleaks)?
- [ ] Dependabot/Renovate habilitado com auto-merge cuidadoso?
- [ ] SBOM gerado em build (Syft)?
- [ ] Container images assinadas (Cosign)?
- [ ] Admission controller verifica signature (Sigstore Policy Controller)?
- [ ] Trivy/Grype scan em CI block on high?

## Leituras

- "Securing the Supply Chain" — Anchore + CNCF
- SLSA spec: slsa.dev
- "Software Supply Chain Security" — Cassie Crossley (livro)
- xz backdoor postmortem — Andres Freund (Microsoft) 2024
- "Supply Chain Risk" — Endor Labs research
- CISA Supply Chain Risk Management resources
