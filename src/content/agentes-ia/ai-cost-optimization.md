---
title: Cost Optimization — Caching, Batching, Routing, Compression
category: agentes-ia
stack: [cost, prompt-caching, batching, routing, compression]
tags: [cost, optimization, batching, routing, caching, production]
excerpt: "Como reduzir custos LLM em produção 70-90% — prompt caching, Batching API, model routing (Haiku/Sonnet/Opus), context compression, token budgets."
related: [ai-prompt-caching, ai-llm-internals-2026, ai-latency-budgets]
updated: "2026-05-10"
---

## Por que cost optimization é primeira prioridade

Em prod, AI bill cresce não-linear:
- Usuários crescem 10x.
- Cada user descobre features que usam mais LLM.
- Context cresce com conversation length.
- Tool calls multiplicam por execution.

App que custa $1k/mês em 100 users vira $50k/mês em 5000 users. Sem optimization, gross margins atingem zero.

Cost optimization NÃO é nice-to-have. É **production requirement**.

## Mental model — onde dinheiro vai

```
Total cost = Σ (input_tokens × input_rate)
            + Σ (cached_input_tokens × cached_rate)
            + Σ (output_tokens × output_rate)
```

Output é tipicamente 4-5x mais caro que input. Cached input 90% cheaper (Anthropic) ou 50% (OpenAI).

Optimization order (ordered by impact):

1. **Prompt caching** — 70-90% economy onde aplicável.
2. **Batching API** — 50% off para async workloads.
3. **Model routing** — Haiku vs Sonnet vs Opus per task.
4. **Context compression** — RAG instead of dumping all.
5. **Output max_tokens limit** — explicit budget.
6. **Semantic cache** — skip LLM call quando query similar.

## 1. Prompt caching (top priority)

Ver `ai-prompt-caching` card. Resumo:

```python
# Anthropic — explicit cache_control
response = await client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[
        {"type": "text", "text": "You are helpful."},
        {
            "type": "text",
            "text": LARGE_CONTEXT,  # 50k tokens estável
            "cache_control": {"type": "ephemeral", "ttl": "1h"},
        }
    ],
    messages=[{"role": "user", "content": user_query}]
)
# Subsequent requests com mesmo system: 90% discount on cached portion
```

**Hit rate target**: > 70% em workloads steady-state. Monitor `cache_read_input_tokens` vs `cache_creation_input_tokens`.

## 2. Batching API

Para workloads **async** (não real-time), provider oferece 50% discount em batch:

### Anthropic Message Batches

```python
from anthropic import Anthropic
client = Anthropic()

# Create batch (up to 100k requests, 24h deadline)
batch = client.messages.batches.create(
    requests=[
        {
            "custom_id": f"req_{i}",
            "params": {
                "model": "claude-sonnet-4-6",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": prompt}]
            }
        }
        for i, prompt in enumerate(prompts)
    ]
)

# Poll for completion (or wait async)
while batch.processing_status not in ["ended", "canceled"]:
    await asyncio.sleep(60)
    batch = client.messages.batches.retrieve(batch.id)

# Download results
results = client.messages.batches.results(batch.id)
```

**Discount**: 50% off input + output.
**SLA**: results em 24h (usually faster).
**Use case**: bulk indexing, eval suites, data labeling, analytics.

### OpenAI Batch API

```python
# Similar pattern
batch_input = [
    {
        "custom_id": f"req_{i}",
        "method": "POST",
        "url": "/v1/chat/completions",
        "body": {"model": "gpt-4o", "messages": [...]}
    }
    for i, msg in enumerate(messages)
]

# Upload, create batch, poll, download
```

**Quando usar batch**:
- ✅ Indexing 1M docs com contextual retrieval.
- ✅ Re-processing historical data.
- ✅ Periodic reports.
- ❌ User-facing chat (latency demais).

## 3. Model routing

Não use Opus pra tudo. Route per task:

```python
async def route_model(query: str, context: dict):
    task_type = classify_task(query, context)
    
    if task_type == "simple_chat":
        return "claude-haiku-4-5"  # 5x cheaper than Sonnet
    elif task_type == "classification":
        return "claude-haiku-4-5"
    elif task_type == "extraction":
        return "claude-haiku-4-5"
    elif task_type == "code_generation":
        return "claude-sonnet-4-6"
    elif task_type == "complex_reasoning":
        return "claude-opus-4-6"  # only when really needed
    else:
        return "claude-sonnet-4-6"  # default
```

### Classifier patterns

```python
async def classify_complexity(query: str) -> str:
    """Fast classification using Haiku."""
    response = await client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=50,
        messages=[{
            "role": "user",
            "content": f"""Classify the complexity of this query.
Return ONE word: trivial | simple | medium | complex

Query: {query}"""
        }]
    )
    return response.content[0].text.strip().lower()

async def smart_route(query: str):
    complexity = await classify_complexity(query)
    
    if complexity == "trivial":
        model = "claude-haiku-4-5"
    elif complexity in ["simple", "medium"]:
        model = "claude-sonnet-4-6"
    else:  # complex
        model = "claude-opus-4-6"  # ou with extended thinking
    
    return await call_with_model(model, query)
```

Classification adds ~$0.0005 + 500ms. But saves $$$ on routing.

### Cost comparison example (illustrativo)

| Model | Input $/1M | Output $/1M | Use when |
|-------|-----------|-------------|----------|
| Claude Haiku 4.5 | $0.25 | $1.25 | Simple, classify, extract |
| Claude Sonnet 4.6 | $3 | $15 | Default, code, RAG |
| Claude Opus 4.6 | $15 | $75 | Complex reasoning |
| GPT-4o-mini | $0.15 | $0.60 | Cheaper Haiku alternative |
| GPT-4o | $2.50 | $10 | Sonnet alternative |
| o1-mini / o3-mini | $1.10 | $4.40 | Reasoning |
| o1 | $15 | $60 | Complex reasoning premium |

### Cascade pattern

Try cheap first, escalate if not sufficient:

```python
async def cascade(query: str):
    # Try Haiku
    haiku_response = await call(model="claude-haiku-4-5", query=query)
    
    # Validate response quality
    is_good = await self_evaluate(query, haiku_response)
    
    if is_good:
        return haiku_response
    
    # Escalate to Sonnet
    sonnet_response = await call(model="claude-sonnet-4-6", query=query)
    
    is_good = await self_evaluate(query, sonnet_response)
    if is_good:
        return sonnet_response
    
    # Last resort: Opus
    return await call(model="claude-opus-4-6", query=query)
```

Cost reduction: ~60-80% se Haiku resolve 70% das queries.

## 4. Context compression

Don't dump all context. Compress:

### Summary memory

```python
async def get_compressed_context(messages: list, max_tokens: int = 4000):
    """Keep recent in-full, summarize older."""
    if estimate_tokens(messages) < max_tokens:
        return messages
    
    cutoff = len(messages) // 2
    older = messages[:cutoff]
    recent = messages[cutoff:]
    
    summary = await client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": f"Summarize this conversation in 3 sentences:\n{older}"
        }]
    )
    
    return [
        {"role": "user", "content": f"[Earlier summary] {summary.content[0].text}"}
    ] + recent
```

### Selective RAG vs dump-all

```python
# ❌ Dump tudo
prompt = f"{all_company_docs}\n\n{user_query}"  # 500k tokens

# ✅ RAG seletivo
relevant = await rag_retrieve(user_query, k=5)
prompt = f"{relevant}\n\n{user_query}"  # 10k tokens
```

50x cheaper, same or better answer.

### Token estimation antes de send

```python
async def call_with_budget(messages: list, max_input_tokens: int = 50000):
    estimated = estimate_tokens(messages)
    if estimated > max_input_tokens:
        # Compress
        messages = await compress_context(messages, max_input_tokens)
    
    return await client.messages.create(...)
```

## 5. Output budget limits

```python
# ❌ Sem limit
response = await client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=8192,  # potential $0.12/query
    messages=[...]
)

# ✅ Budget per use case
MAX_TOKENS = {
    "chat": 500,
    "summary": 200,
    "classification": 50,
    "code_gen": 2000,
    "long_form": 4000,
}

response = await client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=MAX_TOKENS[task_type],
    messages=[...]
)
```

Save 80% em queries simples que tendem a generate verbose output.

## 6. Semantic cache

Skip LLM call entirely se query semelhante já respondida:

```python
# Tier 1: exact cache (key = hash of prompt)
@cache.memoize(ttl=3600)
async def call_llm_cached(prompt_hash: str, prompt: str):
    return await llm_call(prompt)

# Tier 2: semantic cache (similar query → return cached)
async def semantic_cached_call(query: str):
    query_emb = await embed(query)
    similar = await cache_db.search_similar(query_emb, threshold=0.95)
    
    if similar:
        log.info("semantic_cache_hit", similarity=similar.score)
        return similar.response
    
    response = await llm_call(query)
    await cache_db.store(query, query_emb, response)
    return response
```

**Tools que fazem isto**:
- **Helicone** — semantic cache built-in.
- **GPTCache** (Zilliz) — open-source.
- **Redis + custom logic**.

Trade-off: storage + embed cost vs LLM cost. Compute break-even.

## 7. Streaming reduce perception cost

User percebe lentidão como expensive. Streaming = perception "free":

```python
# UX engineering — não actual cost reduction
async def stream_chat():
    async with client.messages.stream(...) as stream:
        async for text in stream.text_stream:
            yield text  # user sees progress immediately
```

Combined com **fast model first, escalate**: user gets responsive UX even when escalation happens.

## Tools comparison

### Cost monitoring

| Tool | Forte em |
|------|----------|
| **Helicone** | Multi-provider, semantic cache, dashboards |
| **Langfuse** | LangChain-native, traces |
| **Datadog LLM** | Enterprise, observability |
| **OpenAI Usage API** | Native OpenAI only |
| **Custom dashboard** | Full control, ad-hoc |

Recommendation 2026: Helicone OR Langfuse pra start. Custom dashboards depois.

## Real-world cost breakdown

Example app: customer support chatbot, 1000 users, 20 msgs/user/day.

**Sem optimization:**
- 1k × 20 × 30 = 600k requests/mês.
- Avg input: 5k tokens. Avg output: 300 tokens.
- Sonnet: $3/1M input + $15/1M output.
- Total: (600k × 5k × $3/1M) + (600k × 300 × $15/1M)
- = $9000 + $2700 = **$11,700/mês**

**Com optimization completa:**
- Cache hit rate 70% → input effective rate = 0.7 × $0.30 + 0.3 × $3 = $1.11/1M.
- Routing: 60% Haiku ($0.25/1M input, $1.25/1M output).
- Output limit 200 tokens.
- Semantic cache 15% hit (skip LLM entirely).

Net: ~$2,500/mês. **80% reduction**.

## Pricing models para users

If you sell AI features:

```
Free tier: 50 messages/month
Pro: $20/month → 500 messages
Business: $100/user/month → 5000 messages
Enterprise: custom (with rate limits)
```

Calculate: Your cost per message × 3-10x margin. Be transparent about limits.

### Anti-abuse

```python
class UsageGuard:
    async def check(self, user_id: str, tokens: int):
        usage = await get_monthly_usage(user_id)
        plan_limit = get_plan_limit(user_id)
        
        if usage + tokens > plan_limit:
            raise UsageLimitExceeded(
                f"Limit {plan_limit} reached. Upgrade plan."
            )
```

Rate limits per user:
- Free: 10 req/min.
- Pro: 60 req/min.
- Enterprise: custom.

## Common cost pitfalls

### 1. Verbose system prompt repetido em cada call
50k tokens em system × cada query = expensive. Cache it.

### 2. Tools com long descriptions, sem cache
Tools são input tokens. Cache them.

### 3. Conversation history infinita
Each turn adds to context. Compress old messages.

### 4. Re-embed mesmo doc múltiplas vezes
Embeddings determinísticos. Cache once.

### 5. Use Opus pra everything "to be safe"
Vs Sonnet, 5x mais caro com marginal qualidade gain.

### 6. Sem monitoring cost trends
Surpresa $50k bill end of month. Set budget alerts.

## Monitoring dashboard

Track per user / per feature:

```
- requests per minute / hour / day
- avg input tokens, output tokens
- cache hit rate
- model breakdown (% Haiku / % Sonnet / % Opus)
- avg cost per request
- total cost rolling 24h / 7d / 30d
- forecasted monthly cost
```

Alert thresholds:
- Cost spike > 2x baseline.
- Cache hit rate drops below 50%.
- Specific user > 100x average usage.

## Cost-aware fallback

```python
async def call_with_budget(query: str, max_cost_usd: float = 0.10):
    estimated_cost = estimate_query_cost(query)
    
    if estimated_cost > max_cost_usd:
        # Use cheaper model
        return await call(model="claude-haiku-4-5", query=query)
    else:
        return await call(model="claude-sonnet-4-6", query=query)
```

User gets answer (graceful degradation) instead of error or huge bill.

## Optimization workflow

1. **Measure**: instrument all LLM calls com cost tracking.
2. **Identify**: which prompts/features dominate cost?
3. **Optimize** top 3 cost centers:
   - Cache the biggest stable prefix.
   - Route to Haiku where Sonnet overkill.
   - Compress history.
4. **Re-measure**: confirm savings.
5. **Iterate** monthly.

Don't optimize speculatively. Profile first, optimize second.

## Checklist — cost optimized app

- [ ] Prompt caching habilitado (Anthropic cache_control marks)?
- [ ] Cache hit rate monitored, > 70% target?
- [ ] Batching API usado pra async workloads?
- [ ] Model routing (classifier → cheap vs expensive)?
- [ ] Output max_tokens limits configurados per task?
- [ ] Context compression em long conversations?
- [ ] Semantic cache implementado (Helicone ou custom)?
- [ ] Cost monitoring dashboard?
- [ ] Per-user rate limits + usage caps?
- [ ] Budget alerts configurados?

## Leituras

- "Reducing AI Costs" — Anthropic blog
- Helicone blog (costs, caching patterns)
- "The Hidden Costs of LLM Applications" — practitioner posts
- OpenAI pricing docs
- Anthropic batch processing docs
- "AI Engineering" Chip Huyen cost chapter
- LangChain "cost reduction" guides
