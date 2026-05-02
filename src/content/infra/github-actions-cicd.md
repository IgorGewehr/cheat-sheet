---
title: "GitHub Actions — CI/CD production-grade"
category: "infra"
stack: ["GitHub Actions", "Node.js", "Docker", "Vercel", "AWS"]
tags: ["ci-cd", "github-actions", "deploy", "automação", "pipeline"]
excerpt: "Pipeline completo com cache de deps, matrix strategy, deploy por ambiente e reusable workflows. Use quando precisar de CI/CD sem gerenciar infra de runners própria."
related: [docker-multistage, terraform-iac]
updated: 2026-05
---

## Visão Geral

GitHub Actions é o ponto de entrada para automação no repositório. Um pipeline production-grade vai além do `npm test && npm build`: inclui cache inteligente, paralelismo, promoção staging→prod com aprovação humana, rollback e prevenção de corridas concorrentes.

---

## Quando usar / Quando não usar

**Use quando:**
- Repositório já está no GitHub (zero custo de infra de CI para repos públicos)
- Time pequeno/médio sem necessidade de runners auto-hospedados complexos
- Quer unificar CI + CD + automações (dependabot, labels, releases) em um lugar
- Precisa de marketplace rico (5 000+ actions prontas)

**Não use quando:**
- Build exige hardware especializado (GPU, licenças de software corporativo)
- Compliance proíbe código sair para runners externos (use self-hosted ou GitLab CI on-prem)
- Monorepo gigante onde Nx Cloud ou Turborepo Remote Cache fazem mais sentido isolados

---

## Trade-offs

| Vantagem | Desvantagem |
|---|---|
| Zero infra para começar | Minutos gratuitos limitados (2 000/mês no free) |
| YAML co-localizado ao código | YAML verboso; reusable workflows ajudam mas têm limitações |
| Marketplace enorme | Actions de terceiros são vetores de supply-chain attack |
| Secrets nativos + OIDC com AWS/GCP/Azure | Debugging de runner é trabalhoso (sem SSH por padrão) |
| Concurrency groups evitam deploys simultâneos | Cold start de runner ubuntu-latest ~20-40s |

---

## Implementação

### Estrutura de arquivos

```
.github/
  workflows/
    ci.yml          # roda em todo PR
    deploy.yml      # roda em push para main/release
    reusable-deploy.yml  # workflow reutilizável
  actions/
    setup-node/
      action.yml    # composite action local
```

### `.github/workflows/ci.yml` — lint, test, build em matrix

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

# Cancela runs anteriores do mesmo PR/branch
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: "22"
  PNPM_VERSION: "9"

jobs:
  lint-and-type-check:
    name: Lint & Types
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: ./.github/actions/setup-node  # composite action local

      - run: pnpm lint
      - run: pnpm type-check

  test:
    name: Test (Node ${{ matrix.node }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false  # não cancela outros se um falhar
      matrix:
        node: ["20", "22"]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: "pnpm"  # cache automático por lockfile hash

      - run: pnpm install --frozen-lockfile

      - run: pnpm test --coverage
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-node-${{ matrix.node }}
          path: coverage/
          retention-days: 7

  build:
    name: Build Docker
    runs-on: ubuntu-latest
    needs: [lint-and-type-check, test]
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}  # automático, sem configuração

      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=sha,prefix=sha-
            type=ref,event=branch
            type=semver,pattern={{version}}

      - id: build
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha          # cache no GitHub Actions Cache
          cache-to: type=gha,mode=max
          provenance: true              # SLSA provenance
          sbom: true                    # Software Bill of Materials
```

### `.github/workflows/deploy.yml` — staging + prod com aprovação

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: "Target environment"
        required: true
        default: "staging"
        type: choice
        options: [staging, production]

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false  # NUNCA cancela deploy em andamento

jobs:
  deploy-staging:
    name: Deploy → Staging
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: staging
      image-tag: sha-${{ github.sha }}
    secrets: inherit  # passa todos os secrets do repo

  integration-tests:
    name: Integration Tests (staging)
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: staging  # usa environment do GitHub para URLs e secrets
    steps:
      - uses: actions/checkout@v4
      - run: pnpm test:e2e
        env:
          BASE_URL: ${{ vars.STAGING_URL }}
          API_KEY: ${{ secrets.STAGING_API_KEY }}

  deploy-production:
    name: Deploy → Production
    needs: [integration-tests]
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: production
      image-tag: sha-${{ github.sha }}
    secrets: inherit
    # Aprovação humana configurada no GitHub > Settings > Environments > production > Required reviewers
```

### `.github/workflows/reusable-deploy.yml` — workflow reutilizável

```yaml
name: Reusable Deploy

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      image-tag:
        required: true
        type: string
    secrets:
      AWS_ROLE_ARN:
        required: true

jobs:
  deploy:
    name: Deploy to ${{ inputs.environment }}
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    permissions:
      id-token: write  # OIDC para AWS sem chave estática
      contents: read

    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
          # OIDC: sem ACCESS_KEY/SECRET_KEY no repo!

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster ${{ vars.ECS_CLUSTER }} \
            --service ${{ vars.ECS_SERVICE }} \
            --force-new-deployment

      - name: Wait for stability
        run: |
          aws ecs wait services-stable \
            --cluster ${{ vars.ECS_CLUSTER }} \
            --services ${{ vars.ECS_SERVICE }}

      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "Deploy FALHOU em ${{ inputs.environment }} — ${{ github.sha }}"
            }
```

### `.github/actions/setup-node/action.yml` — composite action local

```yaml
name: Setup Node + pnpm
description: Configura Node e pnpm com cache

runs:
  using: composite
  steps:
    - uses: pnpm/action-setup@v4
      with:
        version: "9"

    - uses: actions/setup-node@v4
      with:
        node-version: "22"
        cache: "pnpm"

    - run: pnpm install --frozen-lockfile
      shell: bash
```

### OIDC com AWS — sem secrets estáticos

```hcl
# terraform: cria o IAM role para GitHub Actions
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions" {
  name = "github-actions-deploy"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:myorg/myrepo:*"
        }
      }
    }]
  })
}
```

---

## Armadilhas comuns

**1. Pinning de actions por tag, não por SHA**
```yaml
# RUIM — tag pode ser movida (supply-chain attack)
uses: actions/checkout@v4

# BOM — SHA imutável
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
```

**2. `cancel-in-progress: true` em deploy**
Nunca cancele um deploy em andamento. Use `false` para deploys e `true` só para CI de PRs.

**3. Secrets em logs**
Actions mascara automaticamente secrets registrados, mas `echo $SECRET` ainda pode vazar em shells. Use `::add-mask::` para valores dinâmicos:
```yaml
- run: |
    TOKEN=$(./get-token.sh)
    echo "::add-mask::$TOKEN"
    echo "TOKEN=$TOKEN" >> $GITHUB_ENV
```

**4. Cache de pnpm sem hash correto**
O `cache: "pnpm"` do `setup-node` usa o `pnpm-lock.yaml` automaticamente. Mas se usar múltiplas apps em monorepo, o cache pode colidir — adicione a chave explicitamente:
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.local/share/pnpm/store
    key: pnpm-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: pnpm-${{ runner.os }}-
```

**5. Workflow dispatch sem proteção de ambiente**
`workflow_dispatch` para produção sem `environment: production` pula as aprovações configuradas. Sempre declare o environment explicitamente.

---

## Links e referências

- [GitHub Actions — Reusable Workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
- [Hardening GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [OIDC com AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [docker/build-push-action](https://github.com/docker/build-push-action)
- [Concurrency groups](https://docs.github.com/en/actions/using-jobs/using-concurrency)
