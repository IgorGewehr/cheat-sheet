---
title: "ArgoCD — GitOps para Kubernetes"
category: "infra"
stack: ["ArgoCD", "Kubernetes", "Helm", "Kustomize", "Sealed Secrets", "External Secrets"]
tags: ["gitops", "argocd", "kubernetes", "deploy", "continuous-delivery", "sync"]
excerpt: "GitOps com ArgoCD: o cluster k8s como reflexo do repositório Git. Tudo que está no git é aplicado no cluster; tudo que não está é drift. Use para auditoria completa de deploys sem `kubectl apply` manual."
related: [helm-charts, kubernetes-workloads, container-security]
updated: 2026-05
---

## Visão Geral

GitOps inverte o fluxo do CI/CD clássico: em vez de o pipeline *empurrar* para o cluster, o ArgoCD *puxa* do repositório Git e aplica o que está lá. O git vira a fonte de verdade para o estado do cluster.

Benefícios práticos:
- Rollback = `git revert` + aguardar sync
- Auditoria = `git log` do repositório de infra
- Disaster recovery = clonar o repo, apontar para novo cluster
- Drift detection automática

---

## Quando usar / Quando não usar

**Use quando:**
- Kubernetes em produção com múltiplos times
- Precisa de auditoria de quem fez qual deploy e quando
- Quer deploys 100% declarativos (sem `kubectl apply` manual em prod)
- Multi-cluster (staging + prod + DR) com configs diferentes

**Não use quando:**
- App não usa Kubernetes (use GitHub Actions diretamente)
- Time ainda aprendendo k8s — ArgoCD adiciona uma camada de abstração que pode confundir
- Repositório de infra não tem review de PR — GitOps sem review é kubectl apply com extra steps

---

## Trade-offs

| Vantagem | Desvantagem |
|---|---|
| Git como fonte de verdade auditável | Setup inicial: instalar ArgoCD, configurar repos, RBAC |
| Drift detection automática (auto-heal) | Secrets precisam de solução extra (Sealed Secrets, ESO) |
| UI visual do estado do cluster | ArgoCD tem seu próprio RBAC além do k8s RBAC |
| Rollback = `git revert` | Auto-sync agressivo pode aplicar config quebrada imediatamente |
| ApplicationSets para multi-cluster/multi-env | Curva de aprendizado da CRD Application |

---

## Implementação

### Instalação

```bash
kubectl create namespace argocd

kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Acesso inicial à UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Senha inicial (user: admin)
kubectl get secret argocd-initial-admin-secret -n argocd \
  -o jsonpath="{.data.password}" | base64 -d
```

### Application CRD — a unidade básica do ArgoCD

```yaml
# apps/myapp-production.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-api-production
  namespace: argocd
  # Cascade delete: ao deletar Application, deleta recursos no cluster
  finalizers:
    - resources-finalizer.argocd.argoproj.io
  labels:
    app: myapp-api
    environment: production
spec:
  project: myapp  # ArgoCD project (RBAC e permissões)

  source:
    repoURL: https://github.com/myorg/myapp-infra
    targetRevision: main  # branch, tag ou SHA
    path: charts/myapp   # caminho do chart/kustomize no repo

    # Se usar Helm:
    helm:
      releaseName: myapp-api
      valueFiles:
        - values.yaml
        - values.production.yaml
      parameters:
        - name: image.tag
          value: sha-abc123def456  # atualizado pelo CI

  destination:
    server: https://kubernetes.default.svc  # cluster local
    namespace: myapp-production

  syncPolicy:
    # Auto-sync: ArgoCD aplica mudanças sem intervenção humana
    automated:
      prune: true      # remove recursos que saíram do git
      selfHeal: true   # reverte mudanças manuais no cluster (drift)

    syncOptions:
      - CreateNamespace=true           # cria namespace se não existir
      - PrunePropagationPolicy=foreground  # aguarda delete dos filhos
      - ApplyOutOfSyncOnly=true        # só aplica recursos que mudaram
      - ServerSideApply=true           # evita "too long annotation" com CRDs grandes

    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m

  # Health checks: ArgoCD sabe quando o deploy realmente funcionou
  # (padrão já inclui Deployment, Service, Ingress, etc)
```

### App of Apps — gerencie Applications com Applications

```yaml
# apps/root-app.yaml — a Application que gerencia todas as outras
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/myapp-infra
    targetRevision: main
    path: apps  # diretório com todos os outros Application YAMLs
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### ApplicationSet — deploy para múltiplos clusters/ambientes

```yaml
# applicationsets/myapp.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: myapp-api
  namespace: argocd
spec:
  generators:
    # List generator: lista de ambientes
    - list:
        elements:
          - environment: staging
            cluster: https://staging-cluster.myorg.com
            namespace: myapp-staging
            valueFile: values.staging.yaml
            replicaCount: "2"

          - environment: production
            cluster: https://prod-cluster.myorg.com
            namespace: myapp-production
            valueFile: values.production.yaml
            replicaCount: "4"

  template:
    metadata:
      name: "myapp-api-{{environment}}"
      namespace: argocd
      labels:
        environment: "{{environment}}"
    spec:
      project: myapp
      source:
        repoURL: https://github.com/myorg/myapp-infra
        targetRevision: main
        path: charts/myapp
        helm:
          valueFiles:
            - values.yaml
            - "{{valueFile}}"
      destination:
        server: "{{cluster}}"
        namespace: "{{namespace}}"
      syncPolicy:
        automated:
          prune: true
          # Em staging: auto-sync; em prod: manual para segurança
          selfHeal: "{{environment}}" == "staging"
```

### Health checks customizados

```yaml
# argocd-cm ConfigMap — customizar health de recursos não-padrão
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  # Health check para CronJob customizado
  resource.customizations.health.batch_CronJob: |
    hs = {}
    hs.status = "Progressing"
    hs.message = ""
    if obj.status ~= nil then
      if obj.status.active ~= nil and #obj.status.active > 0 then
        hs.status = "Progressing"
        hs.message = "Job em execução"
      else
        hs.status = "Healthy"
      end
    end
    return hs

  # Ignora campos que mudam frequentemente (evita falso drift)
  resource.customizations.ignoreDifferences: |
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas  # HPA muda replicas — ignorar drift disso
```

### Image Updater — atualização automática de imagens

```bash
# Instala o ArgoCD Image Updater
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj-labs/argocd-image-updater/stable/manifests/install.yaml
```

```yaml
# Annotation na Application para atualizar imagem automaticamente
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-api-staging
  namespace: argocd
  annotations:
    # Monitora o registry e atualiza quando nova imagem for publicada
    argocd-image-updater.argoproj.io/image-list: myapp=ghcr.io/myorg/myapp
    argocd-image-updater.argoproj.io/myapp.update-strategy: newest-build
    argocd-image-updater.argoproj.io/myapp.helm.image-name: image.repository
    argocd-image-updater.argoproj.io/myapp.helm.image-tag: image.tag
    # Commita de volta no git (muda o values.yaml)
    argocd-image-updater.argoproj.io/write-back-method: git
    argocd-image-updater.argoproj.io/git-branch: main
```

### Secrets com External Secrets Operator

```bash
# Instala ESO
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system --create-namespace
```

```yaml
# ClusterSecretStore — aponta para AWS Secrets Manager
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secretsmanager
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets-system
---
# ExternalSecret — sincroniza do AWS Secrets Manager para k8s Secret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-secrets
  namespace: myapp-production
spec:
  refreshInterval: 1h   # verifica mudanças no AWS a cada hora
  secretStoreRef:
    name: aws-secretsmanager
    kind: ClusterSecretStore
  target:
    name: myapp-secrets  # nome do k8s Secret criado
    creationPolicy: Owner
  data:
    - secretKey: database-url      # chave no k8s Secret
      remoteRef:
        key: myapp/production      # path no AWS Secrets Manager
        property: database_url     # campo dentro do JSON
    - secretKey: jwt-secret
      remoteRef:
        key: myapp/production
        property: jwt_secret
```

### CLI — operações comuns

```bash
# Login
argocd login localhost:8080 --username admin

# Listar applications
argocd app list

# Status detalhado de uma app
argocd app get myapp-api-production

# Sync manual (quando auto-sync está desabilitado em prod)
argocd app sync myapp-api-production

# Sync com prune (remove recursos deletados do git)
argocd app sync myapp-api-production --prune

# Rollback para revisão anterior
argocd app rollback myapp-api-production 42

# Histórico de deploys
argocd app history myapp-api-production

# Diff entre git e cluster
argocd app diff myapp-api-production
```

---

## Armadilhas comuns

**1. Auto-sync em produção com selfHeal agressivo**
`selfHeal: true` reverte qualquer mudança manual no cluster imediatamente. Se um engenheiro fizer `kubectl patch` de emergência, o ArgoCD reverte. Use auto-sync em staging, sync manual aprovado em produção.

**2. Secrets em texto claro no git**
GitOps exige que TUDO esteja no git — incluindo secrets. Nunca commite secrets reais. Use External Secrets Operator (AWS/GCP) ou Sealed Secrets (encrypted no git).

**3. `prune: true` deletando recursos por engano**
Se um recurso for movido de namespace ou renomeado no chart, `prune: true` vai deletar o antigo. Teste o sync com `--dry-run` antes de aplicar mudanças destrutivas.

**4. Application em namespace errado**
`Application` deve estar no namespace `argocd`. Resources da app vão para o namespace configurado em `spec.destination.namespace`.

**5. Drift de replicas com HPA**
HPA modifica `spec.replicas` no Deployment. Sem `ignoreDifferences` para `/spec/replicas`, o ArgoCD vai reportar drift constante e querer reverter para o valor do git. Configure no `argocd-cm`.

---

## Links e referências

- [ArgoCD Docs](https://argo-cd.readthedocs.io/)
- [ApplicationSets](https://argo-cd.readthedocs.io/en/stable/user-guide/application-set/)
- [ArgoCD Image Updater](https://argocd-image-updater.readthedocs.io/)
- [External Secrets Operator](https://external-secrets.io/)
- [App of Apps pattern](https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/)
- [GitOps principles](https://opengitops.dev/)
