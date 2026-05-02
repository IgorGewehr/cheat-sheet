---
title: "Kubernetes — Workloads production-grade"
category: "infra"
stack: ["Kubernetes", "Docker", "kubectl", "HPA", "kustomize"]
tags: ["k8s", "kubernetes", "deploy", "hpa", "probes", "rolling-update"]
excerpt: "Deployment, HPA, probes e PodDisruptionBudget configurados para zero-downtime em produção. Use quando precisar de orquestração de containers além do que Docker Compose oferece."
related: [helm-charts, argocd-gitops, container-security]
updated: 2026-05
---

## Visão Geral

Kubernetes resolve orquestração de containers: scheduling, self-healing, scaling e rolling updates. A curva de aprendizado é íngreme, mas o conjunto Deployment + Service + HPA + PDB cobre 90% dos workloads de produção.

---

## Quando usar / Quando não usar

**Use quando:**
- Mais de 3-5 serviços com necessidades de scaling independente
- Alta disponibilidade é requisito (múltiplas réplicas, zero-downtime deploy)
- Time tem capacidade de operar k8s (ou usa managed: GKE, EKS, AKS)
- Precisa de scheduling avançado (affinity, taints, resource quotas)

**Não use quando:**
- App simples com tráfego previsível → ECS Fargate, Cloud Run ou Fly.io são mais simples
- Time não tem experiência com k8s — overhead operacional é real
- Latência de cold start importa muito (k8s scheduling adiciona ~1-5s)

---

## Trade-offs

| Vantagem | Desvantagem |
|---|---|
| Self-healing automático (pod crashou → reinicia) | Complexidade operacional alta |
| Scaling horizontal automático (HPA) | Control plane custa dinheiro mesmo sem workload |
| Rolling updates nativos sem downtime | Debugging exige conhecimento de kubectl + logs + events |
| Isolamento de recursos (requests/limits) | Configuração mínima são ~200 linhas de YAML |
| Ecossistema enorme (Helm, ArgoCD, Istio) | Networking é complexo (CNI, Services, Ingress, Gateway API) |

---

## Implementação

### Namespace e ResourceQuota

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: myapp-production
  labels:
    environment: production
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: myapp-quota
  namespace: myapp-production
spec:
  hard:
    requests.cpu: "8"
    requests.memory: 16Gi
    limits.cpu: "16"
    limits.memory: 32Gi
    pods: "50"
```

### Deployment com todos os campos de produção

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-api
  namespace: myapp-production
  labels:
    app: myapp-api
    version: "1.0.0"
spec:
  replicas: 3
  revisionHistoryLimit: 5  # quantos ReplicaSets manter para rollback

  selector:
    matchLabels:
      app: myapp-api

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # pods extras durante o deploy
      maxUnavailable: 0  # nunca derruba pod antes de novo estar Ready

  template:
    metadata:
      labels:
        app: myapp-api
        version: "1.0.0"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"

    spec:
      # Não agendar dois pods no mesmo nó (HA real)
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: myapp-api

      # Grace period para conexões em andamento
      terminationGracePeriodSeconds: 30

      # Segurança: não rodar como root
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001

      containers:
        - name: api
          image: ghcr.io/myorg/myapp:sha-abc123
          imagePullPolicy: IfNotPresent

          ports:
            - name: http
              containerPort: 3000
              protocol: TCP

          # Recursos: SEMPRE definir requests e limits
          resources:
            requests:
              cpu: "250m"     # 0.25 core garantido
              memory: "256Mi"
            limits:
              cpu: "1000m"    # 1 core máximo (throttle, não kill)
              memory: "512Mi" # OOM kill se ultrapassar

          # Variáveis de ambiente sem secrets em texto claro
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3000"
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name  # útil para logs
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: myapp-secrets
                  key: database-url

          # Startup probe: dá tempo para o app inicializar
          # Kubernetes NÃO checa liveness/readiness enquanto startup falha
          startupProbe:
            httpGet:
              path: /health
              port: http
            failureThreshold: 30   # 30 * 5s = 150s para inicializar
            periodSeconds: 5

          # Readiness: remove do Service se falhar (não recebe tráfego)
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 0
            periodSeconds: 10
            failureThreshold: 3
            successThreshold: 1
            timeoutSeconds: 3

          # Liveness: reinicia o pod se falhar
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 0
            periodSeconds: 30
            failureThreshold: 3
            timeoutSeconds: 5

          # Graceful shutdown: SIGTERM → app drena conexões
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 5"]  # aguarda LB remover

          # Segurança do container
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]

          volumeMounts:
            - name: tmp
              mountPath: /tmp  # necessário com readOnlyRootFilesystem

      volumes:
        - name: tmp
          emptyDir: {}
```

### Service e Ingress

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-api
  namespace: myapp-production
spec:
  selector:
    app: myapp-api
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
  type: ClusterIP  # interno; Ingress faz a exposição externa
---
# ingress.yaml (nginx-ingress ou similar)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-api
  namespace: myapp-production
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts: [api.myapp.com]
      secretName: myapp-tls
  rules:
    - host: api.myapp.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-api
                port:
                  name: http
```

### HPA — Horizontal Pod Autoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-api
  namespace: myapp-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp-api

  minReplicas: 3
  maxReplicas: 20

  metrics:
    # CPU: escala se média > 70%
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

    # Memória: escala se média > 80%
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60   # aguarda 60s antes de escalar para cima
      policies:
        - type: Pods
          value: 4
          periodSeconds: 60  # no máximo +4 pods por minuto
    scaleDown:
      stabilizationWindowSeconds: 300  # aguarda 5min antes de escalar para baixo
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60  # remove no máximo 10% por minuto
```

### PodDisruptionBudget — garante HA durante manutenção

```yaml
# pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp-api
  namespace: myapp-production
spec:
  selector:
    matchLabels:
      app: myapp-api
  minAvailable: 2  # nunca derruba mais de (total - 2) pods de uma vez
  # alternativa: maxUnavailable: 1
```

### Endpoints de health no Node.js/Fastify

```typescript
// src/health.ts
import { FastifyInstance } from 'fastify'

let isReady = false

export async function healthRoutes(app: FastifyInstance) {
  // Startup: app ainda não está pronto
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Readiness: só retorna 200 quando realmente pronto para receber tráfego
  // Kubernetes remove do Service se retornar não-2xx
  app.get('/health/ready', async (req, reply) => {
    if (!isReady) {
      return reply.status(503).send({ status: 'not_ready' })
    }
    // Checa dependências críticas
    try {
      await db.raw('SELECT 1')  // conexão com banco
      return { status: 'ready' }
    } catch {
      return reply.status(503).send({ status: 'db_unavailable' })
    }
  })

  // Liveness: só falha se o processo está travado/corrompido
  // Kubernetes reinicia o pod se retornar não-2xx
  app.get('/health/live', async () => {
    return { status: 'alive', uptime: process.uptime() }
  })
}

// Após inicialização completa:
await app.listen({ port: 3000, host: '0.0.0.0' })
await db.migrate.latest()  // migrations, warm-up de cache, etc
isReady = true  // agora aceita tráfego
```

### Comandos essenciais

```bash
# Verificar status de um rollout
kubectl rollout status deployment/myapp-api -n myapp-production

# Rollback para versão anterior
kubectl rollout undo deployment/myapp-api -n myapp-production
kubectl rollout undo deployment/myapp-api --to-revision=3  # versão específica

# Histórico de revisões
kubectl rollout history deployment/myapp-api -n myapp-production

# Ver eventos (debugging de pods que não sobem)
kubectl describe pod <pod-name> -n myapp-production

# Ver logs de todos os pods de um deploy
kubectl logs -l app=myapp-api -n myapp-production --tail=100 -f

# Escalar manualmente (temporário, HPA vai sobrescrever)
kubectl scale deployment/myapp-api --replicas=5 -n myapp-production

# Forçar restart sem mudar a imagem
kubectl rollout restart deployment/myapp-api -n myapp-production
```

---

## Armadilhas comuns

**1. Sem resource requests → Node sem recursos cai em cascata**
Pods sem `resources.requests` podem consumir o node inteiro, causando OOMKill em outros pods. Sempre defina requests e limits.

**2. Liveness probe muito agressiva**
Se a liveness probe falha durante um pico de CPU legítimo, o pod é reiniciado — piorando o problema. Use timeouts generosos e `failureThreshold: 3` (não 1).

**3. Readiness = Liveness (o erro mais comum)**
Readiness controla tráfego; liveness controla restart. Um banco lento deve tornar o pod não-ready (sem tráfego), mas não reiniciar o pod (liveness).

**4. `maxUnavailable: 0` sem `maxSurge`**
Com `maxUnavailable: 0` e `maxSurge: 0` (padrão), o deploy trava. Sempre defina pelo menos `maxSurge: 1`.

**5. Sem PDB → `kubectl drain` derruba tudo**
Durante manutenção de nó ou upgrade de cluster, sem PDB todos os pods podem ser removidos simultaneamente. PDB bloqueia a drenagem até respeitar `minAvailable`.

**6. Image tag `latest`**
```yaml
# NUNCA em produção
image: myapp:latest  # não é imutável, impossível rastrear

# BOM
image: ghcr.io/myorg/myapp:sha-abc123def456  # SHA do git commit
```

---

## Links e referências

- [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [HPA v2](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [PodDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/)
- [Configure Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Resource Management for Pods](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
