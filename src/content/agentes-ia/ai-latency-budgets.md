---
title: Latency Budgets — TTFT, Streaming, Parallel, Speculative
category: agentes-ia
stack: [latency, TTFT, streaming, parallel, speculative-decoding]
tags: [latency, ttft, performance, streaming, parallel]
excerpt: "Como construir apps LLM com latência aceitável — TTFT, latency budgets, parallel calls, speculative decoding, predicted outputs, streaming UX."
related: [ai-streaming-sse, ai-cost-optimization, ai-fallback-resilience]
updated: "2026-05-10"
---

## Latency é UX

Em LLM apps, latência destrói UX se mal gerenciada:

| User perception | Latency budget |
|-----------------|----------------|
| Instant | <100ms |
| Responsive | <500ms TTFT |
| Acceptable | <2s TTFT, streaming after |
| Sluggish | 2-5s sem feedback |
| Broken | >10s sem feedback |

LLM API tipicamente 1-30s total. **Sem streaming + buffering UI, app feels broken.** Streaming + smart latency design = aceitável.

## Decompondo latência

```
Total request latency = Network RT
                      + Auth overhead
                      + Model queue
                      + Prefill (process input prompt)
                      + Generation (per output token)
                      + Network RT back
```

- **Network RT**: ~30-100ms (region matters).
- **Auth**: <50ms.
- **Queue**: 0-500ms (high load).
- **Prefill**: linear w/ input size. **Cached input is 5-10x faster prefill.**
- **Generation**: per-token rate. Sonnet ~30-50 tok/s, Haiku ~100-200, o1 varies.

### TTFT (Time To First Token)

```
TTFT ≈ Network + Auth + Queue + Prefill
```

Para 5k token input: ~500ms (cached) vs ~3s (uncached) prefill em Sonnet.

### TTPT (Time Per Token)

```
TTPT = 1 / generation rate
```

Sonnet 4.6: ~25ms/token. 500-token response = 12.5s generation time.

### Total

5k input + 500 output:
- Cached: 500ms + 12.5s = ~13s total. TTFT ~500ms.
- Uncached: 3s + 12.5s = ~15.5s total. TTFT ~3s.

Diferença critical pra UX.

## Latency budgets por app type

### Chat UI (real-time)

```
Target TTFT: <500ms (perceived "instant")
Total: doesn't matter (streaming)
Strategy: prompt caching + streaming aggressivo
```

### Auto-complete (code, search)

```
Target total: <500ms
Strategy: small model (Haiku), short output, cached
```

### Agent tool calls

```
Target per step: <2s
Total agent run: <30s
Strategy: parallel tool calls, fast models, async
```

### Async report generation

```
Target: <5min, OK 30min if user notified
Strategy: batch API (50% cheaper), background queue
```

## Strategies pra reduce latency

### 1. Prompt caching (top impact)

Reduz TTFT 50-80% em workloads with stable prefix. See `ai-prompt-caching`.

### 2. Smaller models

Haiku é 3-5x mais rápido que Sonnet em tokens/s, e 10-30% faster prefill. Use Haiku onde possível.

### 3. Streaming

Não reduz total latency, mas TTFT effectively becomes "felt latency":

```python
async with client.messages.stream(...) as stream:
    async for text in stream.text_stream:
        yield text  # user vê progress
```

### 4. Parallel tool calls

LLM pode chamar múltiplas tools em paralelo:

```python
# Tools in response.content array — execute em paralelo
tool_results = await asyncio.gather(*[
    execute_tool(block.name, block.input)
    for block in response.content
    if block.type == "tool_use"
])
```

5 tools sequenciais (3s each) = 15s. Paralelos = 3s.

### 5. Parallel LLM calls

Para tasks independentes:

```python
async def parallel_analyze(text: str):
    summary, sentiment, entities = await asyncio.gather(
        summarize(text),       # 3s
        analyze_sentiment(text),  # 2s
        extract_entities(text),   # 4s
    )
    # Total: max(3, 2, 4) = 4s vs 9s sequential
    return {"summary": summary, "sentiment": sentiment, "entities": entities}
```

### 6. Speculative decoding (provider-side)

Grandes provedores fazem internamente: pequeno modelo "guess" tokens, grande valida em batch. 2-3x speedup transparente.

### 7. Predicted outputs (OpenAI)

Para edits com base previsível (refactor, translation), passe expected output:

```python
response = await openai.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": f"Refactor this code to add types:\n{code}"
    }],
    prediction={
        "type": "content",
        "content": code  # original code as prediction
    }
)
```

OpenAI compares prediction com generation, accepts matching tokens fast. 2-5x speedup pra edits.

### 8. Short outputs

```python
# Force short via max_tokens + prompt
response = await client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=200,  # explicit limit
    messages=[{"role": "user", "content": "Answer in one sentence: " + query}]
)
```

Output dominates latency. Less tokens = less time.

### 9. Region/edge

Anthropic/OpenAI APIs available em multiple regions. Use closest:
- US: us-east, us-west.
- EU: eu-west.
- Asia: ap-southeast.

Network RT shaved 100-200ms.

Bedrock/Vertex/Azure OpenAI: deploy region of choice.

### 10. Skip LLM entirely (semantic cache)

```python
# 95% similarity = return cached
cached = await semantic_cache.find_similar(query, threshold=0.95)
if cached:
    return cached  # 50ms instead of 5s
```

## TTFT optimization deep

Specifically pra reduce TTFT (perceived "instant"):

```python
# Order of best to worst TTFT:

# 1. Fully cached input (50ms)
system=[{"text": large_ctx, "cache_control": {"type": "ephemeral"}}]

# 2. Partial cache hit (500ms-1s)
# 3. No cache, small input (1-2s)
# 4. No cache, large input (3-10s)
```

TTFT is what UX feels. Optimize aggressively.

## Streaming UX patterns

### 1. Progressive display

```typescript
const [partial, setPartial] = useState("");

for await (const chunk of stream) {
  setPartial(prev => prev + chunk.text);
}
```

User sees text "typing".

### 2. Skeleton then stream

```typescript
{status === "thinking" && <SkeletonLoader />}
{status === "streaming" && <p>{partial}<TypingCursor /></p>}
{status === "done" && <p>{final}</p>}
```

### 3. Thinking indicator (extended thinking)

```typescript
if (event.type === "thinking_start") setStatus("thinking");
if (event.type === "text_start") setStatus("responding");
```

User sees "Pensando..." então "Respondendo...".

### 4. Optimistic update

```typescript
// User envia → show user message instantly
const userMsg = { role: "user", content: input };
setMessages([...messages, userMsg]);

// Then start stream
const stream = await sendMessage(input);
```

UI feels instant.

### 5. Cancellation

```typescript
const controller = new AbortController();

fetch("/chat", { signal: controller.signal })

// On stop button
controller.abort();
```

User percebe controle. Reduces frustration.

### 6. Estimated time remaining

```typescript
const tokensPerSecond = 30;
const expectedTokens = 500;
const remainingMs = ((expectedTokens - tokensReceived) / tokensPerSecond) * 1000;

<ProgressBar value={tokensReceived / expectedTokens} />
<span>{Math.round(remainingMs / 1000)}s remaining...</span>
```

User has expectation.

## Latency measurement

Instrument every call:

```python
import time
import structlog
log = structlog.get_logger()

async def call_with_metrics(messages, model):
    start = time.time()
    first_token_time = None
    total_tokens = 0
    
    async with client.messages.stream(
        model=model,
        max_tokens=2048,
        messages=messages,
    ) as stream:
        async for event in stream:
            if first_token_time is None and event.type == "content_block_delta":
                first_token_time = time.time()
                ttft_ms = (first_token_time - start) * 1000
            
            if event.type == "content_block_delta" and event.delta.type == "text_delta":
                total_tokens += 1
        
        final = await stream.get_final_message()
    
    total_ms = (time.time() - start) * 1000
    
    log.info("llm_latency",
        model=model,
        ttft_ms=ttft_ms,
        total_ms=total_ms,
        tokens=total_tokens,
        tps=total_tokens / (total_ms - ttft_ms) * 1000,
        cache_hit=final.usage.cache_read_input_tokens > 0,
    )
```

Dashboard:
- p50 TTFT, p99 TTFT.
- p50 total, p99 total.
- TPS (tokens per second) avg.
- Por model, por feature.

## SLO targets

| App layer | TTFT P95 | Total P95 |
|-----------|----------|-----------|
| Auto-complete | 200ms | 500ms |
| Chat (Haiku) | 800ms | 5s |
| Chat (Sonnet) | 1.5s | 10s |
| RAG | 2s | 12s |
| Agent tool call | 3s/step | 30s total |
| Reasoning (extended thinking) | 5s | 60s |

Set SLO, alert when violated, track over time.

## Parallel patterns deep

### Map-reduce pattern

```python
async def summarize_documents(docs: list):
    # Map: summarize each doc in parallel
    summaries = await asyncio.gather(*[
        summarize_one(d) for d in docs
    ])
    
    # Reduce: synthesize overall
    overall = await synthesize(summaries)
    return overall
```

20 docs sequential: 20 × 5s = 100s. Parallel: max(5s) + 5s = 10s.

### Race condition (return first that finishes)

```python
async def race_models(query: str):
    """Use whichever responds fastest."""
    tasks = [
        asyncio.create_task(call_anthropic(query)),
        asyncio.create_task(call_openai(query)),
    ]
    
    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    
    # Cancel slower
    for t in pending:
        t.cancel()
    
    return list(done)[0].result()
```

Lowest latency (não best quality). Use carefully — combine with eval para validate.

### Branch + early termination

```python
async def smart_routing_parallel(query: str):
    """Try fast model. If quality bad, kick off slow model in parallel."""
    
    # Try fast first
    fast_task = asyncio.create_task(call_haiku(query))
    
    fast_result = await asyncio.wait_for(fast_task, timeout=2.0)
    
    quality_ok = await quick_quality_check(query, fast_result)
    if quality_ok:
        return fast_result
    
    # Fall through to better model (no parallel — already lost time)
    return await call_sonnet(query)
```

## Memory caching common results

```python
@functools.lru_cache(maxsize=1000)
def memoize_completion(prompt_hash: str):
    pass  # placeholder for cache key

async def cached_call(prompt: str):
    h = hashlib.sha256(prompt.encode()).hexdigest()[:16]
    
    cached = await redis.get(f"llm:{h}")
    if cached:
        return json.loads(cached)
    
    response = await llm_call(prompt)
    await redis.set(f"llm:{h}", json.dumps(response), ex=3600)
    return response
```

Latency: 50ms cached vs 5s LLM. Game-changing onde aplicável.

## Trade-offs

### Speed vs quality

Faster model = often lower quality. A/B test:

```python
async def compare_speed_quality():
    queries = load_test_set()
    
    haiku_results = await batch_call(model="claude-haiku-4-5", queries)
    sonnet_results = await batch_call(model="claude-sonnet-4-6", queries)
    
    # Eval quality
    haiku_quality = await eval_quality(haiku_results)
    sonnet_quality = await eval_quality(sonnet_results)
    
    # Measure latency
    haiku_p50 = percentile(haiku_results.latencies, 50)
    sonnet_p50 = percentile(sonnet_results.latencies, 50)
    
    print(f"Haiku: {haiku_quality:.2%} quality, {haiku_p50:.0f}ms p50")
    print(f"Sonnet: {sonnet_quality:.2%} quality, {sonnet_p50:.0f}ms p50")
```

Decision: choose based on **quality threshold met** + cheapest latency option.

### Latency vs cost

Sometimes faster = more expensive (better hardware). Provider abstracts but selectable em vLLM:
- Use cheaper instance, accept higher latency.
- Use better GPU, lower latency, higher cost.

## Provider latency comparison (2026 indicativo)

| Provider | Avg TTFT | Avg TPS |
|----------|---------|---------|
| Anthropic API | 800ms (no cache), 200ms (cached) | 25-50 tok/s |
| OpenAI API | 700ms | 30-60 tok/s |
| Groq (open models, LPU) | 200ms | 200-500 tok/s |
| Together AI | 500ms | 40-80 tok/s |
| AWS Bedrock | varies by region | similar to native |
| Azure OpenAI | similar | similar |
| Self-hosted vLLM (H100) | depends | 50-150 tok/s |

Groq é destacado em speed. Trade-off: open models only (Llama, etc.), não Claude/GPT.

## Edge inference

Para ultra-low latency, run small model em edge (browser, mobile, CDN):

- **WebLLM** — browser-side Llama/Mistral.
- **Ollama** — local desktop server.
- **MLX** — Apple Silicon optimized.
- **Cloudflare Workers AI** — edge inference.

Use cases:
- Auto-complete em editor.
- Quick classification.
- Pre-processing antes de cloud LLM.

## Anti-patterns

### 1. Não streaming
User espera 10s, nada na tela. UX broken.

### 2. Sequential quando podia paralelo
```python
# ❌
summary = await summarize(doc)
sentiment = await analyze_sentiment(doc)
# 5s + 5s = 10s

# ✅
summary, sentiment = await asyncio.gather(
    summarize(doc),
    analyze_sentiment(doc),
)
# max(5, 5) = 5s
```

### 3. Sem TTFT measurement
Você optimiza total latency mas não TTFT. UX continua broken.

### 4. Reasoning model pra tudo
"Quality is better". Latency 30s vs 3s. Use only when needed.

### 5. Cache não habilitado
"Stable system prompt mas sem cache_control". Pagando $$$ extras + 2-3s extras TTFT.

## Checklist — latency optimized

- [ ] Prompt caching enabled (cache_control marks)?
- [ ] TTFT measured per endpoint?
- [ ] SLO defined and alerted?
- [ ] Streaming everywhere user-facing?
- [ ] Parallel calls onde possível (asyncio.gather)?
- [ ] Routing classifier per task complexity?
- [ ] Cancel button funcional?
- [ ] Skeleton/loading UX states?
- [ ] Semantic cache pra repeated queries?
- [ ] Region-optimal API endpoints?

## Leituras

- "Latency Numbers Every Programmer Should Know" — base
- "Streaming vs polling" — engineering articles
- "Token Speed Benchmarks" — Artificial Analysis (artificialanalysis.ai)
- Anthropic latency optimization tips
- OpenAI predicted outputs docs
- Groq architecture (LPUs)
- "Speculative Decoding" — research papers
