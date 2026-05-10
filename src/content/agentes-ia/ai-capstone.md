---
title: "Capstone: AI Product End-to-End"
category: checklists
stack: [capstone, agentic, RAG, evals, deployment, monitoring]
tags: [capstone, end-to-end, ai-product, production]
excerpt: "Capstone do Tier 5 — Build, deploy e monitor AI product completo: agentic + RAG + evals + multi-provider fallback + cost dashboard + post-mortem."
related: [ai-checkpoint-claude-app, ai-checkpoint-rag-prod, ai-checkpoint-agent-mcp, ai-checkpoint-deploy]
updated: "2026-05-10"
---

## Objetivo

Validar todo o stack consolidado em um único produto real. Não é demo. É AI product que **funciona em produção com users reais** (ou simulação rigorosa de tal).

Capstone integra:
- Tier 0-1: Claude SDK + streaming + structured + multimodal.
- Tier 2: RAG production-grade + evals.
- Tier 3: Agentic + MCP + HITL.
- Tier 4: Deploy + fallback + monitoring.
- Tier 5: UX + safety + compliance + team process.

## Critério de aprovação

- **AI product** live em production URL.
- **Use case real** (ou em condições realistas).
- **Todos os tiers integrados** (não opcional — every tier represented).
- **Monitoring dashboard** público (ou shared via demo).
- **Eval suite** funcional em CI bloqueando regressões.
- **Cost projection** baseado em real data + sensitivity analysis.
- **Compliance assessment** documented (LGPD/GDPR mínimo).
- **Post-mortem ou learnings doc** após 2+ semanas de operation.
- **Submissão via /sentinela** com all deliverables.

## Tempo estimado: 100-200h (12-20 semanas)

Esse capstone é serious. Esperado paralelizar com outras atividades.

## Use case requirements

Escolha um, com critérios:

### Requisitos do use case
- **Real users** (mínimo 5 testers, ideal 50+).
- **Real value** (resolve problema real, mensurável).
- **Multimodal** (pelo menos 2 modalidades: text + image OU text + audio OU text + structured data).
- **Tools / agentic** (não puro chat).
- **RAG** (sobre algum corpus relevante).
- **Decisions com impact** (algo que importe se errado).

### Sugestões (escolha 1)

**A. Personal AI for Igor's brain itself**
- Tools: search brain projects/decisions/modules, summarize retrospectivas, suggest cards.
- RAG over 175+ cards.
- Multimodal: ingest screenshots, voice notes.
- Real value: Igor's daily AI assistant for his work.

**B. Customer Support Co-pilot**
- Tools: ticket DB, KB, customer history, escalation.
- RAG over support docs.
- Multimodal: handle screenshots, audio voicemails.
- Real value: support team uses daily.

**C. Domain-specific research assistant**
- Tools: arxiv search, citation graph, your notes, math execution.
- RAG over your domain papers.
- Multimodal: parse PDFs with charts.
- Real value: researchers/analysts use.

**D. Legal/medical/financial advisor (regulated)**
- BIG compliance lift. Choose only if you have domain expertise + risk tolerance.
- Real value: solve specialized need.
- Real challenge: EU AI Act + sector regs.

## Architecture obrigatória

```
┌─────────────────────────────────────────────┐
│                    User                     │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   Frontend          │  ai-product-ux patterns
        │   - Streaming UX    │
        │   - Citations       │
        │   - HITL approvals  │
        │   - Cost indicator  │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │    Auth + Rate      │  user mgmt, rate limit
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │   Safety Layer      │  ai-safety-guardrails
        │   - Input filter    │
        │   - PII detection   │
        │   - Jailbreak       │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │   Agent Loop        │  ai-agent-patterns
        │   - State machine   │
        │   - Tool calling    │
        │   - HITL gates      │
        └─┬────────┬────────┬─┘
          │        │        │
     ┌────▼───┐ ┌─▼───┐ ┌──▼─────┐
     │  RAG   │ │ MCP │ │ Tools  │
     │ + Eval │ │Server│ │        │
     └────┬───┘ └─────┘ └────────┘
          │
   ┌──────▼────────┐
   │  LLM Router   │  ai-fallback-resilience
   │  Anthropic    │
   │   ↓ fallback  │
   │  OpenAI       │
   │   ↓ fallback  │
   │  Self-hosted  │
   └───────────────┘
          │
   ┌──────▼────────┐
   │  Observability │  Langfuse + Sentry + Datadog
   │  - Traces      │
   │  - Costs       │
   │  - Errors      │
   └────────────────┘
```

Every component mandatory.

## Phases — 12-week plan

### Weeks 1-2: Foundation

- Define use case + scope.
- Stakeholder buy-in (real users committed).
- Architecture diagram.
- Compliance assessment (use case → risk level → requirements).
- Initial threat model.
- Project scaffolding.

### Weeks 3-4: Core engine

- Claude integration.
- Prompt caching enabled.
- Tool use (3+ tools).
- Streaming UX.
- Structured output where needed.

### Weeks 5-6: RAG

- Ingestion pipeline.
- Contextual retrieval.
- Hybrid search + reranking.
- Citation tracking.

### Weeks 7-8: Agent + MCP

- State machine ou LangGraph.
- MCP server customizado.
- HITL for destructive actions.
- Multi-agent if needed.

### Weeks 9-10: Production-grade

- Multi-provider fallback.
- Cost monitoring + dashboard.
- Observability (Langfuse + Sentry).
- Eval suite (3 layers: unit, integration, eval-driven).
- CI/CD with eval gates.
- Deployment (staging → canary → prod).
- Safety layer (Llama Guard, PII, etc.).

### Weeks 11-12: Polish + launch

- UX polish (citations, HITL, retry, etc.).
- Compliance docs (model card, privacy policy AI section).
- Onboarding flow.
- Beta launch para 5+ real users.

### Weeks 13-20: Operations + post-mortem

- Production operation (2+ weeks minimum).
- Real user feedback collected.
- Incident response (real or simulated).
- Cost optimization based on real data.
- Post-mortem written.
- Roadmap for v2.

## Stack obrigatória (suggestive)

**Frontend**:
- Next.js 15 / React 19.
- Vercel AI SDK pra streaming.
- shadcn/ui ou similar.
- Deployed on Vercel.

**Backend**:
- FastAPI (Python) ou Hono (TypeScript) ou Go.
- Anthropic SDK + OpenAI SDK.
- Instructor for structured output.
- LangGraph ou state machine custom.
- MCP SDK custom server.

**Data**:
- Postgres com pgvector (Supabase / Neon / RDS).
- Redis (Upstash / managed).
- Object storage (S3 / Cloudflare R2) for files.

**Observability**:
- Langfuse (traces + cost).
- Sentry (errors).
- Datadog / Grafana (logs + metrics).

**Deployment**:
- Vercel (frontend).
- Modal / Render / Fly.io (backend) ou Cloud Run.
- GitHub Actions (CI/CD).

**Safety**:
- Llama Guard 3 (Together AI host).
- Presidio (PII).
- Custom blocklist.

## Eval requirements

### Suite minimum

```
evals/
├── unit/                  # 50+ unit tests
├── integration/           # 30+ integration tests
├── retrieval/             # 30+ RAG golden queries
├── agent/                 # 20+ agent scenarios
├── safety/                # 30+ adversarial
├── multimodal/            # 10+ if applicable
└── e2e/                   # 5+ user journey tests
```

### Metrics tracked

- Recall@10 (retrieval).
- Faithfulness (LLM generation).
- Task completion rate (agent).
- Tool use accuracy (agent).
- Adversarial pass rate (safety).
- p50/p99 latency (perf).
- Cost per request (cost).
- User satisfaction (production).

### CI integration

Every PR runs:
- Unit + integration (fast, deterministic).
- Quick eval subset (50 items).

Nightly:
- Full eval suite (200+ items).
- Adversarial.
- Performance benchmark.

Block merge if:
- Unit/integration test fails.
- Quick eval drops >5% on any metric.
- Cost projection increases >20%.

## Cost analysis obrigatória

```markdown
## Cost projection

Per user/month (50 messages avg):
- Input tokens: 5k avg per request × 50 = 250k tokens
- Cache hit: 70% → 175k cached × $0.30/1M + 75k uncached × $3/1M = $0.28
- Output tokens: 300 avg × 50 = 15k × $15/1M = $0.23
- Embeddings: 50 × ~$0.0002 = $0.01
- Storage: ~$0.05 (DB + vector)
- Total per user: ~$0.57/month

Per business cost:
- 100 users: $57/month
- 1000 users: $570/month
- 10000 users: $5,700/month

Scaling assumptions:
- Cache hit rate stable at 70%.
- Avg message count stable.
- Provider prices stable.

Sensitivity analysis:
- If cache hit drops to 50%: cost +35%
- If output token usage doubles: cost +40%
- If provider prices increase 20%: cost +20%

Pricing strategy:
- Free tier: 20 messages/month (~$0.23 cost/user).
- Pro: $10/month → 200 messages (cost $2.28, margin 77%).
- Business: $50/user/month → unlimited reasonable (cost ~$5.70, margin 89%).

Break-even: ~25 paid users assuming $1k infra fixed.
```

## Compliance docs

Required regardless of use case:

```
docs/
├── privacy-policy.md          # com AI subprocessors
├── terms-of-service.md
├── ai-transparency.md         # what AI does, doesn't do
├── data-deletion-policy.md
├── model-card.md
├── risk-assessment.md
└── incident-response.md
```

If high-risk use case (Tier 5 ai-compliance):
- EU AI Act conformity assessment.
- DPIA (Data Protection Impact Assessment).
- Human oversight documentation.

## Deliverables

```
ai-capstone/
├── README.md                # arquitetura + decisions + user feedback
├── docs/                    # compliance + technical docs
│   ├── architecture.md
│   ├── model-card.md
│   ├── privacy-policy.md
│   ├── compliance-assessment.md
│   └── incident-runbook.md
├── frontend/                # Next.js
├── backend/                 # FastAPI + MCP server
├── mcp_server/              # Custom MCP integration
├── evals/                   # all eval suites
├── infrastructure/          # IaC / docker-compose / fly.toml
├── monitoring/              # dashboards / alerts config
├── analytics/               # cost analysis / user metrics
├── post-mortem.md           # after 2+ weeks operation
├── roadmap.md               # v2 plans
└── demo.mp4                 # 10-15min walkthrough
```

## Demo video — 10-15 min

Cover:

1. **Use case introduction** (1 min) — who, what, why.
2. **End-to-end user journey** (3-5 min) — actually use the app.
3. **Architecture walkthrough** (3-5 min) — diagram + code highlights.
4. **Eval suite demo** (2 min) — show CI catching regression.
5. **Cost dashboard** (1 min) — Langfuse com real data.
6. **Failures + recovery** (2 min) — show fallback working, incident response.

Quality bar: would you show this to a CEO / investor?

## Post-mortem (após 2+ weeks operation)

```markdown
# AI Capstone Post-Mortem

## Goals vs results
- Goal: 5 active users by week 4. Actual: 12 by week 6.
- Goal: <2s p50 latency. Actual: 1.8s.
- Goal: <0.30 cost/user/month. Actual: $0.43.

## What worked
- Prompt caching: 70% hit rate as projected.
- Multi-provider fallback: triggered once (Anthropic outage), worked silently.
- HITL: caught 3 issues that would've been embarrassing.
- ...

## What didn't work
- Underestimated cost. Need to optimize.
- Some users confused by HITL flow.
- 1 incident (system prompt leak) — fixed.
- ...

## Incidents (real)
1. Date X: Anthropic API rate limit hit during launch. Fallback worked. User impact minimal.
2. Date Y: Eval CI didn't catch prompt change that worsened tone. Caught in production via thumbs-down feedback.

## Surprises
- Users wanted [feature not planned].
- Some prompts behaved differently across providers.
- ...

## Lessons learned
1. Eval coverage was below 80% for [category]. Add more.
2. Streaming UX needed more polish than expected.
3. Compliance docs took 2x longer than estimated.
4. ...

## v2 roadmap priorities
1. [Top priority feature based on user feedback]
2. Cost optimization (target $0.30/user/month).
3. Better mobile UX.
4. ...
```

## Submissão /sentinela — final criteria

- **Live URL** acessível?
- **Real users** (5+ different people com feedback)?
- **All tiers integrated** evidenced no code + docs?
- **Eval suite** funcional em CI?
- **Multi-provider fallback** tested?
- **Cost dashboard** com real data?
- **Compliance docs** complete?
- **Post-mortem** thoughtful (not generic)?
- **Demo video** professional quality?

## Após PASS

Você completou a trilha. Senior AI Engineer.

Next steps:
- **Solo founder / consultant**: build comme business.
- **Senior IC role**: leverage portfolio for AI Engineer Senior positions.
- **Tech lead em team**: lead AI team.
- **AI specialist em product company**: own AI features.

Career growth from here:
- Staff AI Engineer (cross-org technical impact).
- Principal AI Engineer (industry-level influence).
- Founder (your own AI product company).
- AI Architect (architecture across teams).

## Continuous learning

You finished trilha. AI keeps moving. Maintain:
- 4h/week learning (research papers, blogs).
- Quarterly experimentation (new technique).
- Annual reassessment of stack.
- Conference annually.
- Write/speak yearly.

## Reflexão final

Trilha começou em "what is a token?". Termina em "production AI product live com paying customers".

Você passou de:
- Não sabia prompt caching → optimize sistematicamente.
- Não conhecia RAG → ship production RAG com evals.
- Achava "agent" era hype → ship agents production-grade.
- Pensava AI era expensive → mantém apps lucrativos.
- Compliance era preocupação futura → built-in from start.

Senior AI Engineer não é título. É forma de pensar + skills consolidadas.

Boa caça em production. Construa coisas que importam.

## Recursos finais

- Connect com practitioners network.
- Continue contribuir back to community.
- Mentor junior AI engineers.
- Stay curious, stay shipping.
