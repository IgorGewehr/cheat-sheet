---
title: "Helm — Packaging de apps Kubernetes"
category: "infra"
stack: ["Helm", "Kubernetes", "YAML", "Sprig", "helmfile"]
tags: ["helm", "kubernetes", "packaging", "chart", "gitops", "k8s"]
excerpt: "Helm empacota apps k8s em charts versionados com values parametrizáveis. Use para promover o mesmo chart entre ambientes (dev/staging/prod) com values diferentes, sem duplicar YAML."
related: [kubernetes-workloads, argocd-gitops]
updated: 2026-05
---

## Visão Geral

Helm é o gerenciador de pacotes do Kubernetes. Um **chart** é um conjunto de templates YAML parametrizados com **values**. O resultado do `helm install` é uma **release** — versionada, com rollback nativo. Helm resolve o problema de duplicar YAML por ambiente.

Versão atual: Helm 3 (sem Tiller, sem RBAC headache do Helm 2).

---

## Quando usar / Quando não usar

**Use quando:**
- Mesmos recursos k8s precisam ser deployados em múltiplos ambientes com configs diferentes
- Quer versionamento e rollback de releases de infra
- Distribui software para outros times ou clientes (chart como pacote)
- Usa Helmfile para orquestrar múltiplos charts juntos

**Não use quando:**
- App simples em um único ambiente — Kustomize é mais simples
- Templates ficam mais complexos que o código da app (sinal de over-engineering)
- Time não conhece Go templating — erros de template são difíceis de debugar

---

## Trade-offs

| Vantagem | Desvantagem |
|---|---|
| Rollback nativo (`helm rollback`) | Go templates + Sprig tem sintaxe estranha |
| Parametrização por values.yaml | `helm template` pode ser difícil de debugar |
| Chart dependencies (sub-charts) | Release state fica no cluster (Secrets) — não no git |
| Integra com ArgoCD, Flux nativamante | Values aninhados profundamente ficam verbosos |
| Versionamento semântico de charts | Chart mal estruturado é pior que YAML duplicado |

---

## Implementação

### Estrutura de um chart

```
charts/myapp/
  Chart.yaml           # metadados e dependências
  values.yaml          # valores padrão
  values.staging.yaml  # override para staging
  values.production.yaml
  templates/
    _helpers.tpl       # funções reutilizáveis
    deployment.yaml
    service.yaml
    ingress.yaml
    hpa.yaml
    configmap.yaml
    secrets.yaml       # NÃO commita secrets reais aqui
    NOTES.txt          # exibido após helm install
  charts/              # sub-charts (dependências)
```

### `Chart.yaml`

```yaml
apiVersion: v2
name: myapp
description: API principal do myapp
type: application
version: 1.4.2       # versão do chart (semver)
appVersion: "2.3.0"  # versão da aplicação

keywords:
  - node
  - api

maintainers:
  - name: Igor
    email: igor@myapp.com

# Dependências — sub-charts como bibliotecas
dependencies:
  - name: postgresql
    version: "15.5.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled  # ativa/desativa via values

  - name: redis
    version: "19.x.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled
```

### `values.yaml` — valores padrão completos

```yaml
# Valores padrão — todos os campos devem ter defaults sensatos
replicaCount: 2

image:
  repository: ghcr.io/myorg/myapp
  pullPolicy: IfNotPresent
  tag: ""  # sobrescrito no deploy com o SHA do commit

imagePullSecrets: []
nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

ingress:
  enabled: false
  className: nginx
  annotations: {}
  hosts:
    - host: myapp.local
      paths:
        - path: /
          pathType: Prefix
  tls: []

resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 512Mi

autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

# Probes
livenessProbe:
  httpGet:
    path: /health/live
    port: http
  periodSeconds: 30
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: http
  periodSeconds: 10
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /health
    port: http
  failureThreshold: 30
  periodSeconds: 5

# Configuração da aplicação
config:
  nodeEnv: production
  logLevel: info
  port: "3000"

# Secrets — valores são injetados via Sealed Secrets ou External Secrets
secrets:
  databaseUrl: ""   # referência ao secret, não o valor

# Dependências opcionais
postgresql:
  enabled: false

redis:
  enabled: false

nodeSelector: {}
tolerations: []
affinity: {}

podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3000"
  prometheus.io/path: "/metrics"
```

### `values.production.yaml`

```yaml
replicaCount: 4

image:
  tag: sha-abc123def456  # fixado no deploy

ingress:
  enabled: true
  hosts:
    - host: api.myapp.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: myapp-tls
      hosts: [api.myapp.com]

autoscaling:
  enabled: true
  minReplicas: 4
  maxReplicas: 20

resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 1Gi

config:
  logLevel: warn
```

### `templates/_helpers.tpl` — funções Sprig reutilizáveis

```yaml
{{/*
Nome completo do chart, truncado em 63 chars (limite do k8s)
*/}}
{{- define "myapp.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Labels comuns em todos os recursos
*/}}
{{- define "myapp.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 }}
app.kubernetes.io/name: {{ include "myapp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Values.image.tag | default .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels (subconjunto dos labels, não muda após deploy)
*/}}
{{- define "myapp.selectorLabels" -}}
app.kubernetes.io/name: {{ include "myapp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Nome da imagem com tag
*/}}
{{- define "myapp.image" -}}
{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}
{{- end }}
```

### `templates/deployment.yaml` — uso dos helpers

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        {{- with .Values.podAnnotations }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: {{ include "myapp.image" . | quote }}
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.config.port | int }}
              protocol: TCP
          env:
            - name: NODE_ENV
              value: {{ .Values.config.nodeEnv | quote }}
            - name: LOG_LEVEL
              value: {{ .Values.config.logLevel | quote }}
            {{- if .Values.secrets.databaseUrl }}
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ include "myapp.fullname" . }}-secrets
                  key: database-url
            {{- end }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          livenessProbe:
            {{- toYaml .Values.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.readinessProbe | nindent 12 }}
          startupProbe:
            {{- toYaml .Values.startupProbe | nindent 12 }}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

### Comandos essenciais

```bash
# Instalar dependências declaradas no Chart.yaml
helm dependency update charts/myapp

# Renderizar templates sem instalar (debugging)
helm template myapp-release charts/myapp \
  -f charts/myapp/values.yaml \
  -f charts/myapp/values.production.yaml \
  --set image.tag=sha-abc123

# Instalar/upgrade em um comando (idempotente)
helm upgrade --install myapp-api charts/myapp \
  --namespace myapp-production \
  --create-namespace \
  -f charts/myapp/values.production.yaml \
  --set image.tag=sha-abc123 \
  --wait \           # aguarda pods ficarem Ready
  --timeout 5m \
  --atomic           # reverte automaticamente se o deploy falhar

# Listar releases
helm list -n myapp-production

# Ver histórico de uma release
helm history myapp-api -n myapp-production

# Rollback para revisão anterior
helm rollback myapp-api 3 -n myapp-production

# Ver values de uma release instalada
helm get values myapp-api -n myapp-production
```

### `helmfile.yaml` — múltiplos charts em um arquivo

```yaml
# helmfile.yaml — orquestra todos os charts do ambiente
repositories:
  - name: bitnami
    url: https://charts.bitnami.com/bitnami
  - name: ingress-nginx
    url: https://kubernetes.github.io/ingress-nginx

environments:
  staging:
    values:
      - environments/staging.yaml
  production:
    values:
      - environments/production.yaml

releases:
  - name: ingress-nginx
    chart: ingress-nginx/ingress-nginx
    version: 4.10.x
    namespace: ingress-nginx

  - name: cert-manager
    chart: jetstack/cert-manager
    version: 1.14.x
    namespace: cert-manager
    set:
      - name: installCRDs
        value: true

  - name: myapp-api
    chart: ./charts/myapp
    namespace: myapp-{{ .Environment.Name }}
    values:
      - charts/myapp/values.yaml
      - charts/myapp/values.{{ .Environment.Name }}.yaml
    set:
      - name: image.tag
        value: {{ requiredEnv "IMAGE_TAG" }}  # falha se não definida

  - name: myapp-worker
    chart: ./charts/myapp-worker
    namespace: myapp-{{ .Environment.Name }}
    needs:
      - myapp-api  # aguarda myapp-api estar instalado
```

```bash
# Deploy de todos os charts para staging
IMAGE_TAG=sha-abc123 helmfile -e staging sync

# Deploy de apenas um chart
IMAGE_TAG=sha-abc123 helmfile -e production -l name=myapp-api apply

# Ver diff antes de aplicar
helmfile -e production diff
```

---

## Armadilhas comuns

**1. `checksum/config` faltando no Deployment**
Sem a annotation `checksum/config`, mudar um ConfigMap não reinicia os pods. O template já inclui — não remova.

**2. `--set` com valores que contêm vírgulas ou pontos**
```bash
# ERRADO — helm interpreta vírgulas como separadores de múltiplos valores
helm upgrade ... --set "hosts=api.myapp.com,admin.myapp.com"

# CORRETO — use values file ou escape com \,
helm upgrade ... --set "hosts={api.myapp.com\,admin.myapp.com}"
# ou melhor: use -f values.yaml
```

**3. Selector labels imutáveis**
`matchLabels` em Deployment são imutáveis após criação. Se precisar mudar, delete a release e reinstale. Isso causa downtime — pense bem antes de mudar.

**4. `helm upgrade --force` apaga e recria**
`--force` não é um "force upgrade seguro" — ele deleta o recurso e cria novamente, causando downtime. Evite em produção.

**5. Charts com defaults inseguros**
Charts de terceiros (bitnami, etc) às vezes têm defaults de desenvolvimento (password `admin123`, `auth.enabled: false`). Sempre revise os values antes de instalar em produção.

---

## Links e referências

- [Helm Docs](https://helm.sh/docs/)
- [Sprig functions](https://masterminds.github.io/sprig/)
- [helmfile](https://helmfile.readthedocs.io/)
- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)
- [ArtifactHub — repositório de charts](https://artifacthub.io/)
