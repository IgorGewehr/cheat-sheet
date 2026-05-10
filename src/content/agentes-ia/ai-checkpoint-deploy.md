---
title: "Checkpoint Tier 4: Production Deploy"
category: checklists
stack: [deployment, monitoring, fallback, eval-driven CI]
tags: [checkpoint, deploy, production, monitoring]
excerpt: "Validação do Tier 4 — Deploy production LLM app com monitoring real, multi-provider fallback, cost dashboard, eval-driven CI pipeline."
related: [ai-deployment-2026, ai-fallback-resilience, ai-cost-optimization, ai-eval-driven-dev]
updated: "2026-05-10"
---

## Objetivo

Levar o agent ou RAG construído nos checkpoints anteriores para **production-grade infra**. Você valida que pode operar app LLM em escala real:

- Funciona quando providers caem.
- Custos bounded e observable.
- Performance medida e alertada.
- CI/CD com eval-driven gates.

## Critério de aprovação

- **App deployed** em provider de produção (Vercel/Modal/AWS/etc.).
- **Multi-provider fallback** funcional (test: kill primary, app continues).
- **Monitoring stack** ativo (logs, traces, metrics, errors).
- **Cost dashboard** mostrando per-request cost + monthly projection.
- **Eval-driven CI** rodando em cada PR.
- **Load test** demonstrando handles 100+ concurrent requests.
- **Incident runbook** documented.
- **Submissão via /sentinela**.

## Tempo estimado: 40-80h

## Pre-requisites

- Tier 1 ou Tier 2 ou Tier 3 checkpoint app (vai usar como base).
- Cloud account (AWS / GCP / Vercel etc.).
- Monitoring tool (Langfuse Cloud free tier, ou Helicone, ou Datadog).

## Tasks obrigatórias

### 1. Multi-provider fallback

Implement provider router com circuit breaker:

```python
class LLMRouter:
    def __init__(self):
        self.providers = ["anthropic", "openai", "self_hosted"]
        self.breakers = {p: CircuitBreaker() for p in self.providers}
    
    async def call(self, messages, system):
        for provider in self.providers:
            try:
                return await self.breakers[provider].call(
                    self._call_provider, provider, messages, system
                )
            except (CircuitBreakerOpen, APIError) as e:
                log.warning(f"{provider}_failed", error=str(e))
                continue
        
        raise AllProvidersDownError()
```

Test: 
```bash
# Manualmente kill primary (set ANTHROPIC_API_KEY=invalid)
# App continues using OpenAI
# Restart with valid key — circuit breaker recovers
```

### 2. Cost tracking infrastructure

Per-request cost logging:

```python
async def track_call(user_id, model, usage):
    cost = (
        usage.input_tokens * MODEL_PRICES[model]["input"]
        + usage.cache_read_input_tokens * MODEL_PRICES[model]["cached"]
        + usage.cache_creation_input_tokens * MODEL_PRICES[model]["cache_write"]
        + usage.output_tokens * MODEL_PRICES[model]["output"]
    ) / 1_000_000
    
    await metrics.publish({
        "user_id": user_id,
        "model": model,
        "input_tokens": usage.input_tokens,
        "cache_hit_rate": usage.cache_read_input_tokens / max(usage.input_tokens, 1),
        "output_tokens": usage.output_tokens,
        "cost_usd": cost,
        "timestamp": datetime.utcnow(),
    })
```

Dashboard:
- Daily cost trend.
- Cost per user (top 10).
- Cost per endpoint.
- Forecasted monthly cost.
- Alert: cost spike > 2x baseline.

### 3. Observability — traces

LangSmith ou Langfuse (ambos têm free tier):

```python
# Langfuse
from langfuse.decorators import observe, langfuse_context

@observe()
async def chat_endpoint(req: ChatRequest):
    langfuse_context.update_current_observation(
        user_id=req.user_id,
        session_id=req.session_id,
    )
    
    # RAG
    chunks = await retrieve(req.message)
    langfuse_context.update_current_observation(metadata={"chunks": len(chunks)})
    
    # LLM
    response = await call_llm(req.message, chunks)
    
    return response
```

Trace mostra:
- Each step latency.
- Each LLM call (tokens, cost).
- Errors com stack trace.
- User ↔ session correlation.

### 4. Eval-driven CI

Setup pipeline que bloqueia PRs com regression:

```yaml
# .github/workflows/eval.yml
on: [pull_request]

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -e .[eval]
      
      - name: Baseline (main branch)
        run: |
          git checkout main
          pytest tests/evals --output=baseline.json
          git checkout -
      
      - name: Current
        run: pytest tests/evals --output=current.json
      
      - name: Compare
        run: python scripts/compare_evals.py baseline.json current.json
      
      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require("fs");
            const report = fs.readFileSync("eval-report.md", "utf8");
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
      
      - name: Fail if regression > 5%
        run: python scripts/check_regression.py
```

### 5. Load test

Demonstrate app handles concurrent load:

```python
# loadtest.py — locust
from locust import HttpUser, task, between

class ChatUser(HttpUser):
    wait_time = between(1, 5)
    
    @task
    def chat(self):
        self.client.post("/chat", json={
            "message": random.choice(SAMPLE_QUERIES),
            "user_id": f"user_{self.environment.runner.user_count}",
        })
```

```bash
locust -f loadtest.py --users=100 --spawn-rate=10 --run-time=10m
```

Output: p50/p99 latency, errors, throughput. Document results.

### 6. Incident runbook

Document como handle outages:

```markdown
# Incident Runbook

## Anthropic API down
1. Check status.anthropic.com.
2. Verify circuit breaker on Anthropic in dashboard.
3. Confirm fallback to OpenAI active.
4. Monitor user errors via Sentry.
5. If OpenAI also down: switch to self-hosted Llama (manual override).
6. Notify users via status page.

## Cost spike > 2x
1. Check dashboard: which user/endpoint?
2. If abuse: rate-limit or block user temporarily.
3. If legit: scale rate limits up if expected, or improve caching.
4. Post-mortem: doc cause.

## Latency spike > 2x p99
1. Check provider status (status pages).
2. Check region health (geo-routing might be issue).
3. Check prompt cache hit rate (drop = prompt invalidated).
4. Roll back recent deploy if temporal correlation.

## Eval scores drop
1. Identify which scenario degraded.
2. Check recent prompt changes (rollback if culprit).
3. Check model version (provider rolled new minor).
4. Add to golden dataset if novel failure.
```

## Architecture diagram

Document:

```
┌──────────────┐
│   User       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Frontend   │  Vercel
│   (Next.js)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   API        │  Modal/Cloud Run
│   (FastAPI)  │
└──────┬───────┘
       │
       ├─► LLM Router ─┬─► Anthropic
       │               ├─► OpenAI (fallback)
       │               └─► Self-hosted Llama (last)
       │
       ├─► pgvector (Postgres)
       ├─► Redis (cache, sessions)
       │
       └─► Telemetry ─┬─► Langfuse (traces)
                     ├─► Sentry (errors)
                     └─► Datadog (logs/metrics)
```

## Deploy on cloud provider

Escolha um (qualquer válido):

### Option A: Vercel + Modal

```bash
# Frontend
cd frontend && vercel deploy

# Backend (FastAPI on Modal)
cd backend && modal deploy app.py
```

Pros: serverless, autoscale, easy.
Cons: cold starts em Modal, multiple vendors.

### Option B: AWS

```bash
# Frontend
cd frontend && npm run build && aws s3 sync ./dist s3://bucket
# CloudFront in front

# Backend
# Lambda + API Gateway, or ECS Fargate, or App Runner
sam deploy
```

Pros: AWS native.
Cons: more YAML.

### Option C: Render / Railway / Fly.io

```bash
# All-in-one
fly deploy
# or
railway up
```

Simple deploy, good for solo devs.

### Option D: Self-host VPS

```bash
# Hetzner / DigitalOcean / Linode
docker-compose up -d
```

Cheapest at scale, more ops burden.

## Database deployment

```bash
# Postgres pgvector on managed (recommended):
# - Supabase
# - Neon
# - AWS RDS
# - GCP Cloud SQL

# Connection
export DATABASE_URL="postgresql://..."
```

Backup strategy obrigatório.

## Secrets management

```python
# Never:
ANTHROPIC_API_KEY = "sk-ant-..."  # ❌ committed

# Always:
import os
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]  # from env

# Better em prod:
from aws_secrets_manager import get_secret
ANTHROPIC_API_KEY = get_secret("prod/anthropic")
```

Rotate keys quarterly.

## Hand-in deliverables

```
deploy-checkpoint/
├── README.md                    # arquitetura + lessons learned
├── infrastructure/
│   ├── terraform/ ou Dockerfile # IaC
│   ├── docker-compose.yml
│   └── deploy.yml
├── monitoring/
│   ├── dashboards/              # screenshots dos painéis Langfuse/Datadog
│   └── alerts.md                # alerts configured
├── ci/
│   ├── .github/workflows/
│   ├── eval_scripts/
│   └── load_tests/
├── runbook.md                   # incident response
├── architecture.png
├── cost-projection.md           # monthly cost por user
└── demo.mp4                     # walk through deployment
```

## README template

```markdown
# [App name] — Production Deploy

## Live URL
https://yourapp.com

## Stack
- Frontend: Next.js on Vercel
- API: FastAPI on Modal
- DB: Supabase pgvector
- Cache: Upstash Redis
- LLM: Claude Sonnet 4.6 (primary) + GPT-4o (fallback) + Llama 3.3 (self-hosted last)
- Observability: Langfuse + Sentry
- CI: GitHub Actions

## Multi-provider fallback
Demonstrated working: kill primary, app continues.
See `tests/test_fallback.py`.

## Cost dashboard
Live: [Langfuse link]
Sample (last 7 days):
- Total cost: $87
- Avg cost per request: $0.012
- Cache hit rate: 72%
- Projected monthly: $370

## Eval CI
- 50 golden scenarios.
- Pass rate: 92%.
- Last 10 PRs: 1 blocked due to regression.

## Load test results
100 concurrent users, 10 min run:
- p50 latency: 1.8s
- p99 latency: 6.5s
- Errors: 0.2%
- Throughput: 50 req/s

## Incident runbook
See `runbook.md`.

## Recent incidents
- 2026-04-15: Anthropic API degraded for 12min. Fallback to OpenAI worked. Users saw 2x latency briefly.

## Lessons learned
- Cold start on Modal added 5s p99 — switched to keep_warm=2.
- Prompt cache invalidation when system prompt edit — added cache_breakpoint markers.
- ...
```

## Submissão /sentinela

Criteria:

- **App acessível** (URL live)?
- **Multi-provider fallback** demonstrated test?
- **Monitoring dashboards** show traces, costs, metrics?
- **Eval CI** running and blocking regressions?
- **Load test** evidence of >100 concurrent capability?
- **Runbook** documented for incidents?
- **Cost projection** based on real data?

## Common pitfalls

### 1. Skipping fallback because "Anthropic never down"
99.9% uptime = 8.76h/year down. App will be down.

### 2. Monitoring is "logs only"
Logs aren't enough. Need traces + metrics + errors aggregated.

### 3. No cost alerts
Surprise $50k bill em mid-month. Alert at 50% of monthly budget.

### 4. CI evals on subset only
PRs pass locally but production drift. Run full eval at least nightly.

### 5. Load test em weak environment
Loadtest hits real prod API but cheap dev DB. Production differs.

### 6. Sem runbook documented
Incident hits, you scramble. Runbook saves 90% of stress.

## Bonus features

- **Cost-aware routing** — dynamically pick model based on user's budget tier.
- **Multi-region** — deploy backend em 2+ regions.
- **Canary deployments** — 10% traffic to new prompt before 100%.
- **A/B test framework** — different prompt versions to different users.
- **Auto-scale** based on queue depth.

## Após PASS

Tier 5 (Sênior 2026+) — onde você adiciona UX patterns, safety/guardrails, compliance, team process, e capstone integrado.

## Recursos

- "Building Reliable Systems" — multiple posts
- Modal docs (modal.com)
- Langfuse docs (langfuse.com)
- "Production Pipelines" — Eugene Yan
- Datadog / Honeycomb / Grafana docs
- "Twelve-Factor App" methodology
