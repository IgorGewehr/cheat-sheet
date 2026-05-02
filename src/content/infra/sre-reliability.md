---
title: "SRE — Reliability na prática: SLI, SLO, Error Budget"
category: "infra"
stack: ["Prometheus", "Grafana", "AlertManager", "Node.js", "OpenTelemetry"]
tags: ["sre", "slo", "sli", "error-budget", "alerting", "confiabilidade", "postmortem"]
excerpt: "SLI/SLO como linguagem entre eng e negócio, error budget como mecanismo de decisão feature vs reliability, alertas por burn rate — não por threshold. O caminho entre pager hell e app caindo silenciosamente."
related: [opentelemetry-observabilidade, kubernetes-workloads]
updated: 2026-05
---

## Visão Geral

SRE (Site Reliability Engineering) é a disciplina de tratar operações de software como problema de engenharia. As três ferramentas centrais:

- **SLI** (Service Level Indicator): métrica que mede o que importa para o usuário
- **SLO** (Service Level Objective): alvo para o SLI (ex: 99.9% de disponibilidade)
- **Error Budget**: 1 - SLO = quanto de falha é permitido antes de parar features

A diferença de SRE para "ops tradicional": decisões são baseadas em dados (error budget), não em feeling. Se o budget não acabou, o time pode deployar. Se acabou, congelam features e focam em reliability.

---

## Quando usar / Quando não usar

**Use quando:**
- Produto tem usuários reais que sentem o impacto de falhas
- Time de produto e engenharia brigam sobre velocidade vs. estabilidade
- Alertas disparam frequentemente sem ação (alert fatigue)
- Precisa de linguagem comum entre negócio e engenharia para priorização

**Não use quando:**
- MVP/protótipo — overhead de definir SLOs antes de ter usuários é desperdício
- Sistema interno sem SLA com o negócio — um healthcheck simples basta
- Time muito pequeno sem capacidade de responder a incidentes estruturados

---

## Trade-offs

| Vantagem | Desvantagem |
|---|---|
| Linguagem comum entre eng e negócio | Definir SLIs corretos é difícil (o que o usuário realmente sente?) |
| Error budget = decisão objetiva sobre quando parar features | Medir SLIs requer instrumentação prévia |
| Alertas por burn rate reduzem alert fatigue | Burn rate alerting exige mais configuração que threshold simples |
| Postmortem blameless melhora cultura | Cultura de postmortem exige maturidade organizacional |
| Foco no que importa, não no que é fácil de medir | SLOs muito agressivos (99.99%) são caros de manter |

---

## Implementação

### Definindo SLIs bons

Um SLI bom mede a experiência do usuário, não a saúde interna dos servidores.

```
# SLIs RUINS (medem componentes, não experiência):
- CPU usage < 80%
- Memory usage < 70%
- Disk I/O < threshold

# SLIs BONS (medem o que o usuário sente):
- Proporção de requisições bem-sucedidas (success rate)
- Latência no percentil 95 (p95 latency)
- Disponibilidade de funcionalidades críticas (checkout, login)
- Freshness: dados atualizados nas últimas X horas
```

### Exemplo real — API de e-commerce

```yaml
# SLIs e SLOs documentados (pode ser no README da infra ou no ArgoCD)
service: myapp-api
slos:
  # SLO 1: Disponibilidade
  - name: availability
    sli: |
      Proporção de requisições HTTP que retornam 2xx ou 3xx
      Excluindo: /health, /metrics, requisições canceladas pelo cliente (499)
    slo: 99.9%           # = 43.8 minutos de downtime por mês
    window: 30d
    
    error_budget:
      monthly_minutes: 43.8     # 30d × 24h × 60min × 0.001
      alert_burn_rate_1h: 14.4  # se queimar 14.4x em 1h → page imediato
      alert_burn_rate_6h: 6     # se queimar 6x em 6h → ticket urgente

  # SLO 2: Latência
  - name: latency
    sli: |
      Proporção de requisições com latência < 300ms no p95
    slo: 95%             # 95% das requisições devem responder em < 300ms
    window: 30d
```

### Métricas SLI com Prometheus (Node.js + prom-client)

```typescript
// src/metrics/sli.ts
import { Registry, Counter, Histogram } from 'prom-client'

const register = new Registry()

// Counter de requisições — base do SLI de disponibilidade
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code', 'status_class'],
  registers: [register],
})

// Histogram de latência — base do SLI de latência
// Buckets calibrados para o SLO de 300ms
export const httpRequestDurationMs = new Histogram({
  name: 'http_request_duration_milliseconds',
  help: 'Duração das requisições HTTP em ms',
  labelNames: ['method', 'route', 'status_class'],
  buckets: [10, 25, 50, 100, 200, 300, 500, 1000, 2000, 5000],
  registers: [register],
})

// Middleware Fastify/Express que coleta as métricas
export function metricsMiddleware() {
  return async (req: any, reply: any, done: () => void) => {
    const start = Date.now()
    const route = req.routerPath ?? req.url  // usa rota parametrizada, não URL

    reply.addHook('onSend', () => {
      const statusCode = reply.statusCode
      const statusClass = `${Math.floor(statusCode / 100)}xx`
      const durationMs = Date.now() - start

      const labels = {
        method: req.method,
        route,
        status_code: String(statusCode),
        status_class: statusClass,
      }

      httpRequestsTotal.inc(labels)
      httpRequestDurationMs.observe(
        { method: req.method, route, status_class: statusClass },
        durationMs
      )
    })

    done()
  }
}
```

### Queries Prometheus para SLI/SLO

```promql
# ============================================================
# SLI: Taxa de sucesso (disponibilidade) — últimos 5 minutos
# ============================================================

# Requests bem-sucedidos (2xx, 3xx) excluindo health checks
sum(rate(http_requests_total{
  route!~".*/health.*",
  status_class=~"2xx|3xx"
}[5m]))
/
sum(rate(http_requests_total{
  route!~".*/health.*"
}[5m]))


# ============================================================
# SLI: Latência p95 — últimas 5 minutos
# ============================================================

histogram_quantile(
  0.95,
  sum by (le) (
    rate(http_request_duration_milliseconds_bucket[5m])
  )
)


# ============================================================
# Error Budget Burn Rate — conceito
# ============================================================
# Burn rate = taxa de consumo do budget em relação ao normal
# Budget mensal = 0.1% de erro = 43.8min
# Se em 1h temos 1.44% de erro:
#   burn rate = 1.44% / 0.1% = 14.4x
#   Nesse ritmo, esgota o budget mensal em 2.1 dias

# Burn rate em 1 hora (para alertas rápidos):
(
  1 - sum(rate(http_requests_total{status_class=~"2xx|3xx"}[1h]))
    / sum(rate(http_requests_total[1h]))
) / 0.001  # = 1 - SLO = 0.001 para 99.9%

# Burn rate em 6 horas (para alertas de tendência):
(
  1 - sum(rate(http_requests_total{status_class=~"2xx|3xx"}[6h]))
    / sum(rate(http_requests_total[6h]))
) / 0.001
```

### AlertManager — alertas por burn rate

```yaml
# prometheus/alerts/slo.yaml
groups:
  - name: slo.availability
    rules:
      # Alerta crítico: esgota budget em 2 dias (burn rate 14.4x em 1h)
      # Page imediato — acorda o on-call
      - alert: AvailabilitySLOCritical
        expr: |
          (
            (1 - sum(rate(http_requests_total{status_class=~"2xx|3xx"}[1h]))
              / sum(rate(http_requests_total[1h])))
            / 0.001
          ) > 14.4
        for: 2m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "SLO Disponibilidade CRÍTICO — burn rate {{ $value | humanize }}x"
          description: |
            Taxa de erro atual consumirá o error budget mensal em menos de 2 dias.
            Burn rate: {{ $value }}x (threshold: 14.4x)
            Runbook: https://wiki.myorg.com/runbooks/availability-slo
          dashboard: "https://grafana.myorg.com/d/slo-availability"

      # Alerta de atenção: esgota budget em 5 dias (burn rate 6x em 6h)
      # Ticket urgente — não acorda, mas precisa de ação no próximo turno
      - alert: AvailabilitySLOWarning
        expr: |
          (
            (1 - sum(rate(http_requests_total{status_class=~"2xx|3xx"}[6h]))
              / sum(rate(http_requests_total[6h])))
            / 0.001
          ) > 6
        for: 15m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "SLO Disponibilidade ATENÇÃO — burn rate {{ $value | humanize }}x"

      # Alerta de latência — p95 acima de 300ms
      - alert: LatencySLOWarning
        expr: |
          histogram_quantile(
            0.95,
            sum by (le) (rate(http_request_duration_milliseconds_bucket[5m]))
          ) > 300
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Latência p95 acima do SLO: {{ $value | humanize }}ms"
```

### Dashboard Grafana — Error Budget

```json
// Painel "Error Budget Remaining" — JSON para importar no Grafana
{
  "title": "Error Budget Restante (mês corrente)",
  "type": "gauge",
  "targets": [{
    "expr": "1 - (sum(increase(http_requests_total{status_class!~\"2xx|3xx\"}[30d])) / sum(increase(http_requests_total[30d]))) / 0.001",
    "legendFormat": "Budget restante (%)"
  }],
  "fieldConfig": {
    "defaults": {
      "min": 0, "max": 1,
      "thresholds": {
        "steps": [
          {"color": "red",    "value": 0},
          {"color": "yellow", "value": 0.25},
          {"color": "green",  "value": 0.5}
        ]
      },
      "unit": "percentunit"
    }
  }
}
```

### Template de Postmortem Blameless

```markdown
# Postmortem — [TÍTULO DO INCIDENTE]

**Data:** 2026-05-02
**Duração:** 14:23 - 15:47 UTC (1h24min)
**Impacto:** 30% dos usuários receberam erro 502 no checkout
**Severidade:** P1
**Autores:** Igor, Ana

---

## O que aconteceu (timeline objetiva)

| Hora UTC | Evento |
|---|---|
| 14:23 | Alerta AvailabilitySLOCritical disparado (burn rate 22x) |
| 14:31 | Igor assume o incidente, abre bridge no Slack |
| 14:45 | Identificado: deploy 2h anterior introduziu connection pool leak |
| 14:52 | Rollback iniciado via ArgoCD |
| 15:05 | Rollback completo, métricas voltando ao normal |
| 15:47 | Incidente fechado, postmortem agendado |

## Causa raiz

Deploy `v2.3.1` introduziu leak no pool de conexões do PostgreSQL.
Sob carga, conexões esgotavam → timeout → 502.

A causa raiz foi a ausência de teste de carga no staging antes do deploy.

## O que foi bom

- Alerta de burn rate funcionou antes do usuário reclamar
- ArgoCD permitiu rollback em <15min
- Comunicação no Slack foi clara e sem pânico

## O que melhorar (action items)

| Ação | Responsável | Prazo | Issue |
|---|---|---|---|
| Adicionar teste de connection pool ao CI | Igor | 2026-05-09 | #342 |
| Criar runbook para connection pool exhaustion | Ana | 2026-05-09 | #343 |
| Configurar alerta de connection pool no Prometheus | Igor | 2026-05-06 | #344 |

## Lições aprendidas

- Staged rollout (canary 5% → 20% → 100%) teria limitado impacto a 5% dos usuários
- Tests de integração com banco real são necessários no CI

---

*Este postmortem é blameless. Problemas sistêmicos, não pessoas, são o foco.*
```

---

## Armadilhas comuns

**1. SLOs muito altos por status (99.99% sem necessidade)**
Cada nove custa exponencialmente mais. 99.9% = 43min/mês de downtime permitido. 99.99% = 4.3min/mês. Só justifique 99.99% se o negócio pagar por isso.

**2. Alertas por threshold em vez de burn rate**
`alert if error_rate > 1%` dispara falso-positivo em todo spike de 5 minutos. Burn rate em janela de 1h+6h filtra ruído e foca no que realmente ameaça o SLO.

**3. SLI medindo internals, não experiência do usuário**
"CPU > 80%" não significa que o usuário foi impactado. Prefira: "proporção de requests com resposta em < 300ms".

**4. Error budget sem consequência real**
Se esgotou o error budget mas o time continua deployando features, o framework perdeu o sentido. Precisa de comprometimento da liderança.

**5. Postmortem vira sessão de culpa**
A função do postmortem é aprender e melhorar sistemas. Nunca mencione nomes no contexto de "quem fez errado". Foque em: "quais propriedades do sistema permitiram que isso acontecesse?".

---

## Links e referências

- [Google SRE Book — SLOs](https://sre.google/sre-book/service-level-objectives/)
- [Alerting on SLOs (Burn Rate)](https://sre.google/workbook/alerting-on-slos/)
- [Error Budget Policy](https://sre.google/workbook/error-budget-policy/)
- [Blameless Postmortems](https://sre.google/sre-book/postmortem-culture/)
- [OpenSLO — spec para definir SLOs como código](https://openslo.com/)
- [Sloth — gerador de alertas SLO para Prometheus](https://sloth.dev/)
