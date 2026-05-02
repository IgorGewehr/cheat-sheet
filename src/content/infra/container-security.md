---
title: "Segurança de Containers — Produção hardened"
category: "infra"
stack: ["Docker", "Kubernetes", "Trivy", "OPA", "Gatekeeper", "Distroless"]
tags: ["segurança", "containers", "docker", "kubernetes", "trivy", "opa", "sbom", "distroless"]
excerpt: "Imagens distroless e non-root, scanning de vulnerabilidades, SBOM, Network Policies e admission control com OPA/Gatekeeper. A checklist mínima para containers em produção que passam em auditoria de segurança."
related: [docker-multistage, kubernetes-workloads, argocd-gitops]
updated: 2026-05
---

## Visão Geral

Containers são a superfície de ataque mais comum em workloads modernos. Cada camada da pilha tem vetores próprios:

- **Imagem**: vulnerabilidades em OS packages e libs
- **Runtime**: processo rodando como root, capabilities excessivas
- **Orquestração**: pods acessando recursos de outros namespaces
- **Supply chain**: secrets na imagem, imagens de fontes não confiáveis

Segurança de container não é uma ferramenta — é um conjunto de decisões em cada camada.

---

## Quando usar / Quando não usar

**Use quando:**
- Workload em produção com dados sensíveis (financeiro, saúde, PII)
- Requisitos de compliance (SOC2, PCI-DSS, LGPD)
- Múltiplos times compartilhando o mesmo cluster k8s
- Pipeline de CI/CD precisa de gates de segurança

**Não use quando:**
- Ambiente de desenvolvimento local — overhead desnecessário
- Protótipo interno sem dados reais

---

## Trade-offs

| Vantagem | Desvantagem |
|---|---|
| Distroless elimina ~80% das CVEs de OS | Debug é difícil sem shell (use `:debug` variant) |
| Non-root previne privilege escalation | Apps legadas que precisam de root exigem refactor |
| Scanning automático no CI previne regressões | Falsos positivos em CVEs requerem triagem manual |
| Network Policies isolam blast radius | Network Policies são stateless e têm curva de aprendizado |
| OPA/Gatekeeper bloqueia configs inseguras antes do deploy | Gatekeeper adiciona latência ao admission webhook |

---

## Implementação

### Imagem distroless com usuário non-root

```dockerfile
# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22

# Stage de build (tem shell para executar comandos)
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY . .
RUN pnpm build

# Stage final: distroless — sem shell, sem package manager, sem utilitários
# Dramatically menor superfície de ataque
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runner
# :nonroot = roda como uid 65532 (nonroot) por padrão

WORKDIR /app

# Copia apenas os artefatos necessários
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /app/package.json ./

# USER já é nonroot no :nonroot variant
# Não exponha porta privilegiada (< 1024) — use 3000+
EXPOSE 3000

# CMD sem shell (exec form) — processo não tem shell pai
CMD ["dist/server.js"]
```

```dockerfile
# Alternativa: alpine com usuário non-root explícito
FROM node:22-alpine AS runner
WORKDIR /app

# Cria usuário dedicado (não use o usuário 'node' genérico em produção)
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules

USER 10001:10001  # use UID numérico — funciona mesmo sem /etc/passwd

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### SecurityContext no Kubernetes

```yaml
# security-context.yaml — aplica em todo Deployment de produção
spec:
  # Contexto do Pod inteiro
  securityContext:
    runAsNonRoot: true        # k8s rejeita se container tenta rodar como root
    runAsUser: 10001
    runAsGroup: 10001
    fsGroup: 10001            # permissão nos volumes
    seccompProfile:
      type: RuntimeDefault    # perfil seccomp do container runtime (restringe syscalls)

  containers:
    - name: api
      # Contexto do container
      securityContext:
        allowPrivilegeEscalation: false   # bloqueia setuid/setgid
        readOnlyRootFilesystem: true      # filesystem somente leitura
        capabilities:
          drop: ["ALL"]                   # remove todas as Linux capabilities
          # Adicione de volta APENAS as necessárias:
          # add: ["NET_BIND_SERVICE"]     # apenas se precisar porta < 1024

      volumeMounts:
        - name: tmp
          mountPath: /tmp               # necessário com readOnlyRootFilesystem

  volumes:
    - name: tmp
      emptyDir:
        sizeLimit: 100Mi               # limita uso de disco do /tmp
```

### Scanning com Trivy no CI

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  pull_request:
  push:
    branches: [main]
  schedule:
    - cron: "0 6 * * *"  # scan diário para detectar novas CVEs em imagens existentes

jobs:
  trivy-scan:
    name: Trivy — Image + Filesystem Scan
    runs-on: ubuntu-latest
    permissions:
      security-events: write  # para upload ao GitHub Security tab

    steps:
      - uses: actions/checkout@v4

      - name: Build image para scan
        run: docker build -t myapp:${{ github.sha }} .

      # Scan da imagem construída
      - name: Trivy — scan da imagem
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: "myapp:${{ github.sha }}"
          format: "sarif"
          output: "trivy-image-results.sarif"
          severity: "CRITICAL,HIGH"
          exit-code: "1"          # falha o CI se encontrar CRITICAL/HIGH
          ignore-unfixed: true    # ignora CVEs sem patch disponível
          vuln-type: "os,library"

      # Scan do código-fonte (secrets, configs inseguras)
      - name: Trivy — scan do filesystem
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: "fs"
          scan-ref: "."
          format: "sarif"
          output: "trivy-fs-results.sarif"
          scanners: "vuln,secret,misconfig"
          exit-code: "1"

      # Upload para GitHub Security tab (aparece na aba Security > Code scanning)
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: "trivy-image-results.sarif"
          category: "trivy-image"

      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: "trivy-fs-results.sarif"
          category: "trivy-fs"
```

### SBOM — Software Bill of Materials

```yaml
# Geração de SBOM junto com o build Docker
- name: Build + SBOM + Push
  uses: docker/build-push-action@v6
  with:
    context: .
    push: true
    tags: ghcr.io/myorg/myapp:${{ github.sha }}
    sbom: true       # gera SBOM em formato SPDX
    provenance: true # SLSA provenance (quem, quando, como foi buildado)
    cache-from: type=gha
    cache-to: type=gha,mode=max

# O SBOM permite:
# 1. Saber exatamente quais libs e versões estão na imagem
# 2. Quando uma nova CVE é publicada, identificar imediatamente quais
#    containers são afetados (sem re-scan manual)
# 3. Compliance: NIST SSDF, EO 14028 (EUA) exigem SBOM
```

```bash
# Extrair SBOM de uma imagem com Docker Scout ou syft
docker scout sbom ghcr.io/myorg/myapp:sha-abc123 --format spdx-json > sbom.json

# Ou com syft (standalone):
syft ghcr.io/myorg/myapp:sha-abc123 -o spdx-json > sbom.json

# Verificar CVEs a partir do SBOM com grype
grype sbom:./sbom.json --fail-on high
```

### Secrets fora da imagem

```typescript
// ❌ NUNCA — secret em ENV no Dockerfile ou docker-compose
// ENV DATABASE_URL=postgres://user:SENHA_REAL@host/db

// ❌ NUNCA — ARG passada no build se torna layer da imagem
// docker build --build-arg SECRET=abc123 .

// ✅ CORRETO — secret como runtime secret do Docker
// O arquivo não fica na imagem, só disponível durante o RUN
```

```dockerfile
# Docker BuildKit secret mount — não persiste na imagem
# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS builder
# ...

# Secret disponível APENAS durante esse RUN, não vira layer
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    pnpm install --frozen-lockfile
```

```bash
# Build com secret
DOCKER_BUILDKIT=1 docker build \
  --secret id=npmrc,src=$HOME/.npmrc \
  -t myapp .
```

### Network Policies — isolamento de rede no k8s

```yaml
# Política padrão: bloqueia todo tráfego de entrada e saída (deny-all)
# Depois, abra apenas o necessário
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: myapp-production
spec:
  podSelector: {}  # aplica a todos os pods do namespace
  policyTypes:
    - Ingress
    - Egress
---
# Permite entrada apenas do Ingress Controller
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-controller
  namespace: myapp-production
spec:
  podSelector:
    matchLabels:
      app: myapp-api
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
---
# Permite saída para o banco de dados (apenas)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-egress-database
  namespace: myapp-production
spec:
  podSelector:
    matchLabels:
      app: myapp-api
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: databases
        - podSelector:
            matchLabels:
              app: postgresql
      ports:
        - protocol: TCP
          port: 5432
    # DNS: necessário para resolver nomes de serviço
    - to: []
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
```

### OPA/Gatekeeper — Admission Control

```bash
# Instala Gatekeeper
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts
helm install gatekeeper gatekeeper/gatekeeper \
  -n gatekeeper-system --create-namespace
```

```yaml
# ConstraintTemplate: define a política em Rego
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequirenonroot
spec:
  crd:
    spec:
      names:
        kind: K8sRequireNonRoot
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequirenonroot

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.runAsNonRoot == true
          msg := sprintf(
            "Container '%v' deve ter runAsNonRoot=true",
            [container.name]
          )
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          container.securityContext.runAsUser == 0
          msg := sprintf(
            "Container '%v' não pode rodar como root (uid 0)",
            [container.name]
          )
        }
---
# Constraint: aplica a política em namespaces de produção
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequireNonRoot
metadata:
  name: require-non-root
spec:
  enforcementAction: deny  # deny = bloqueia; warn = permite mas avisa
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment", "StatefulSet", "DaemonSet"]
    namespaceSelector:
      matchLabels:
        environment: production  # aplica apenas em namespaces de prod
```

```yaml
# Outra política: proíbe image tag 'latest'
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8snolatesttag
spec:
  crd:
    spec:
      names:
        kind: K8sNoLatestTag
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8snolatesttag

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          endswith(container.image, ":latest")
          msg := sprintf(
            "Container '%v' usa tag ':latest' — use SHA ou versão semântica",
            [container.name]
          )
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not contains(container.image, ":")
          msg := sprintf(
            "Container '%v' não tem tag — especifique uma versão",
            [container.name]
          )
        }
```

### Checklist de auditoria — script rápido

```bash
#!/usr/bin/env bash
# check-container-security.sh — auditoria rápida de um namespace

NS=${1:-myapp-production}
echo "=== Auditoria de segurança: namespace $NS ==="

echo ""
echo "--- Pods rodando como root ---"
kubectl get pods -n $NS -o json | \
  jq -r '.items[] | select(.spec.containers[].securityContext.runAsUser == 0 or
    .spec.containers[].securityContext.runAsNonRoot == false) |
    .metadata.name'

echo ""
echo "--- Containers sem resource limits ---"
kubectl get pods -n $NS -o json | \
  jq -r '.items[].spec.containers[] |
    select(.resources.limits == null) |
    .name + ": SEM LIMITS"'

echo ""
echo "--- Containers com allowPrivilegeEscalation não explicitamente false ---"
kubectl get pods -n $NS -o json | \
  jq -r '.items[].spec.containers[] |
    select(.securityContext.allowPrivilegeEscalation != false) |
    .name + ": allowPrivilegeEscalation não restrita"'

echo ""
echo "--- Imagens com tag :latest ---"
kubectl get pods -n $NS -o json | \
  jq -r '.items[].spec.containers[] |
    select(.image | endswith(":latest")) |
    .name + ": " + .image'

echo ""
echo "=== Fim da auditoria ==="
```

---

## Armadilhas comuns

**1. Distroless dificulta debug em produção**
Sem shell, `kubectl exec -it pod -- /bin/sh` falha. Use a variante `:debug` temporariamente, ou prefira `kubectl debug` com container efêmero:
```bash
kubectl debug -it myapp-pod --image=busybox:latest --target=api -n myapp-production
```

**2. `readOnlyRootFilesystem: true` quebra apps que escrevem em /tmp**
Node.js e muitas libs escrevem em `/tmp`. Sempre monte um `emptyDir` em `/tmp` quando usar `readOnlyRootFilesystem`.

**3. Trivy ignorando CVEs sem patch**
`--ignore-unfixed` é necessário para não bloquear o CI com vulnerabilidades sem solução disponível. Mas monitore `--ignore-unfixed` para quando o patch sair.

**4. Network Policy sem regra de DNS**
Deny-all sem permitir saída UDP/TCP porta 53 quebra a resolução de nomes de serviço dentro do cluster. Sempre inclua a regra de DNS no egress.

**5. Secrets em variáveis de ambiente do Dockerfile**
```dockerfile
# NUNCA commite isso
ENV DATABASE_URL=postgres://user:senha@host/db
ENV AWS_SECRET_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
```
Layers do Docker são auditáveis com `docker history --no-trunc`. Use Docker secrets, ESO ou Sealed Secrets.

---

## Links e referências

- [Distroless images](https://github.com/GoogleContainerTools/distroless)
- [Trivy](https://trivy.dev/)
- [Grype (Anchore)](https://github.com/anchore/grype)
- [OPA/Gatekeeper](https://open-policy-agent.github.io/gatekeeper/)
- [Kubernetes Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Docker BuildKit Secrets](https://docs.docker.com/build/building/secrets/)
- [NSA/CISA Kubernetes Hardening Guide](https://www.nsa.gov/Press-Room/News-Highlights/Article/Article/2716980/nsa-cisa-release-kubernetes-hardening-guidance/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
