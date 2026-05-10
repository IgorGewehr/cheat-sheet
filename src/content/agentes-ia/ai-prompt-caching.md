---
title: Prompt Caching — Anthropic e OpenAI
category: agentes-ia
stack: [Anthropic, OpenAI, prompt caching]
tags: [prompt-caching, cost-optimization, performance, 2026]
excerpt: "Prompt caching é a otimização #1 em apps LLM modernas — 5-10x economia de custo + 50-80% redução de latency. Como e quando usar."
related: [ai-cost-optimization, ai-llm-internals-2026, ai-openai-vs-anthropic]
updated: "2026-05-10"
---

## Por que prompt caching virou padrão

Em apps com **context grande estável** (system prompt longo, doc reference, RAG fixo), o LLM reprocessa tudo a cada request. Isso é:
- Caro (input tokens × $3-15/1M).
- Lento (10-30s para processar 100k tokens).

Prompt caching armazena o estado do modelo após processar prefix repetido. Próximas requests com mesmo prefix:
- **90% mais barato** (Anthropic).
- **50-80% mais rápido** (TTFT reduzido).
- **Sem mudança de output** (mesmo modelo, mesmas tokens).

Em workloads típicos (chatbot com longo system prompt, RAG com docs fixos, code agent), prompt caching reduz custo total em 70-85% se bem configurado.

## Anthropic — controle explícito

Anthropic implementou primeiro (Aug 2024). Você marca **cache breakpoints** explicitamente.

### Setup básico

```python
from anthropic import Anthropic

client = Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "You are a legal assistant specialized in Brazilian tax law."
        },
        {
            "type": "text",
            "text": LARGE_LEGAL_CODE,  # 100k tokens — content estável
            "cache_control": {"type": "ephemeral"},  # MARCA CACHE BREAKPOINT
        }
    ],
    messages=[
        {"role": "user", "content": "What's the deadline for IRPF this year?"}
    ],
)

# Check cache hits
print(response.usage)
# Usage(
#   input_tokens=20,                    # tokens não-cacheados
#   cache_creation_input_tokens=100000, # primeira vez: criou cache
#   cache_read_input_tokens=0,
#   output_tokens=150,
# )

# Segunda request, mesmo prefix:
# cache_read_input_tokens=100000 (90% cheaper!)
# cache_creation_input_tokens=0
```

### Pricing — exemplo

Claude Sonnet 4.6 (2026, ilustrativo):
- Input regular: $3 / 1M tokens
- Cache write: $3.75 / 1M tokens (25% premium na primeira)
- **Cache read: $0.30 / 1M tokens (90% off!)**
- Output: $15 / 1M tokens

ROI: cache compensa após **2-3 requests** com mesmo prefix.

### TTL e múltiplos breakpoints

```python
# 5min TTL default; "1h cache" disponível em 2025+ (premium pricing)
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[
        {"type": "text", "text": SYSTEM_INSTRUCTIONS},
        {
            "type": "text",
            "text": LARGE_LEGAL_CODE,
            "cache_control": {"type": "ephemeral", "ttl": "1h"},  # 1h cache
        }
    ],
    messages=[
        # Pode ter mais cache breakpoints (até 4 total)
        {"role": "user", "content": [
            {"type": "text", "text": DOC_SPECIFIC},
            {"type": "text", "text": USER_QUERY, "cache_control": {"type": "ephemeral"}},
        ]}
    ],
)
```

Limite: **4 cache breakpoints** por request. Em ordem crescente de variação.

### Estratégia de breakpoints

```
System prompt fixo  ←─ break 1 (ttl 1h, raramente muda)
+ Doc reference     ←─ break 2 (ttl 1h)
+ User session ctx  ←─ break 3 (ttl 5m)
+ Conversation hist ←─ break 4 (ttl 5m)
+ Current message   ←─ não cacheado (varia toda request)
```

Cada nível com cache cobra cheaper se prefix idêntico. Hierarquia bem desenhada → 80%+ hit rate em chat steady-state.

## OpenAI — automático

OpenAI lançou em out 2024. **Cache automático**:

- Prefixes >= 1024 tokens são candidatos.
- Cache hit se prefix idêntico recente (~10 min TTL).
- 50% discount em cached portion (vs 90% Anthropic).
- Zero código extra.

```python
from openai import OpenAI
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": LARGE_SYSTEM_PROMPT},  # estável
        {"role": "user", "content": "Query"},
    ],
)

# Check cache
print(response.usage)
# CompletionUsage(
#   prompt_tokens=20000,
#   prompt_tokens_details=PromptTokensDetails(cached_tokens=18000),  # hit!
#   completion_tokens=150,
# )
```

### Diferenças vs Anthropic

| Aspecto | Anthropic | OpenAI |
|---------|-----------|--------|
| Controle | Explicit (`cache_control`) | Automático |
| Min size | Não há (qualquer breakpoint vale) | 1024 tokens |
| TTL | 5min (ephemeral) ou 1h | ~10 min |
| Discount | 90% read | 50% read |
| Write premium | 25% premium | Zero |
| Breakpoints | Até 4 explicitos | Sequential prefix |

OpenAI: simpler. Anthropic: mais controle + economy maior.

## Patterns de uso

### 1. Chatbot com long system prompt

```python
SYSTEM = """You are an assistant for ACME Corp.
[5000 tokens of company-specific knowledge, policies, brand voice...]
"""

# Estável across users e sessions
# Cache breakpoint no fim do system
system_blocks = [{
    "type": "text",
    "text": SYSTEM,
    "cache_control": {"type": "ephemeral", "ttl": "1h"},
}]

# 90% das requests usam cache do system
```

**Economia**: se 5000 tokens cached read vs criar: $0.0015 vs $0.015 = 10x cheaper.

### 2. RAG com docs fixos durante session

```python
# Docs retornados pelo retrieval (~30k tokens)
relevant_docs = await retrieve(query, k=10)

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system="You are a research assistant.",
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": f"<documents>\n{relevant_docs}\n</documents>",
                "cache_control": {"type": "ephemeral"},  # cache docs
            },
            {"type": "text", "text": f"Question: {query}"},
        ]
    }],
)
# Se user faz follow-up sobre mesmos docs: cache hit (90% cheaper).
```

### 3. Code agent com codebase context

```python
# Agent processa arquivos do projeto
project_files = await read_relevant_files()  # ~50k tokens

system = [
    {"type": "text", "text": "You are a code assistant."},
    {
        "type": "text",
        "text": f"<codebase>\n{project_files}\n</codebase>",
        "cache_control": {"type": "ephemeral", "ttl": "1h"},
    }
]

# Cada turn de conversation reusa cache (assumindo no file edits)
```

### 4. Multi-turn conversation com history crescente

```python
def build_messages_with_cache(history: list, new_msg: str):
    """Cache history except last 2 messages (volatile)."""
    messages = []
    for i, msg in enumerate(history[:-2]):
        messages.append(msg)
    
    # Cache breakpoint nas messages estáveis
    if messages:
        messages[-1] = {
            **messages[-1],
            "content": [
                {"type": "text", "text": messages[-1]["content"],
                 "cache_control": {"type": "ephemeral"}}
            ]
        }
    
    # Últimas messages sem cache
    messages.extend(history[-2:])
    messages.append({"role": "user", "content": new_msg})
    
    return messages
```

## Quando NÃO usa prompt caching

### Prefix varia muito

Se prefix muda em cada request (e.g., user-specific data no início), cache hit rate cai pra zero. Cache cost negative.

### Workload baixo volume

Se mesmo prefix usado <2x em 5 min, cache não compensa (TTL expira).

### Total prompt curto

Se prompt total é <1k tokens, sobrecarga overhead > economia.

## Monitoring cache hit rate

```python
# Track cache metrics
async def call_with_metrics(prompt_id: str, **kwargs):
    response = await client.messages.create(**kwargs)
    
    usage = response.usage
    cache_hit_rate = (
        usage.cache_read_input_tokens 
        / (usage.cache_read_input_tokens + usage.input_tokens)
        if (usage.cache_read_input_tokens + usage.input_tokens) > 0
        else 0
    )
    
    log.info("llm_call",
        prompt_id=prompt_id,
        input_tokens=usage.input_tokens,
        cache_read=usage.cache_read_input_tokens,
        cache_create=usage.cache_creation_input_tokens,
        output_tokens=usage.output_tokens,
        cache_hit_rate=cache_hit_rate,
    )
    
    return response
```

Dashboard: cache hit rate por prompt_id. Target > 70% em workloads steady-state.

## Common pitfalls

### 1. Cache miss por whitespace/encoding

```python
# Differ in even 1 byte = cache miss
prompt_v1 = "You are helpful.\n"
prompt_v2 = "You are helpful.\n\n"  # extra \n = miss

# Solution: normalize prompts antes de enviar
prompt = normalize_whitespace(prompt)
```

### 2. Cache miss por timestamp inserido

```python
# ❌ Cada request muda prefix
prompt = f"Current time: {datetime.now()}\n{static_content}"

# ✅ Timestamp fora do cache breakpoint
messages = [
    {"role": "user", "content": [
        {"type": "text", "text": static_content,
         "cache_control": {"type": "ephemeral"}},
        {"type": "text", "text": f"Current time: {datetime.now()}\n{query}"},
    ]}
]
```

### 3. Cache breakpoints na ordem errada

Cache funciona prefix-style. Breakpoint #2 só hit se #1 hit primeiro.

```python
# ❌ Variável no meio, estável no final = cache breaks
[stable_a, variable_x, stable_b]  # cache fails

# ✅ Estável primeiro, variável depois
[stable_a, stable_b, variable_x]  # cache works
```

### 4. Reset de cache em deploys

Cache vive em pool do Anthropic. Após restart de service do client, primeiras requests recriam cache. Esperado overhead temporário.

## Cost projections — example

App: chatbot com 10k DAU, 10 messages/user/day, 8k token system prompt.

**Sem cache**:
- 10k × 10 = 100k requests/day
- Input: 100k × 8k = 800M input tokens/day = 24B/mês
- Cost: 24B × $3/1M = **$72,000/month**

**Com cache** (90% hit rate):
- Cache reads: 0.9 × 24B = 21.6B × $0.30/1M = $6,480/mês
- Cache writes: 0.1 × 24B = 2.4B × $3.75/1M = $9,000/mês
- Total: **$15,480/mês** (78% economy)

Em escala, prompt caching paga uma engineer mensalmente.

## Caching com tools

Tools são parte do prompt. Cacheable:

```python
TOOLS = [
    {"name": "search", "description": "...", "input_schema": {...}},
    # ... 20 tools
]

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=TOOLS,
    system="...",  # com cache_control
    messages=[...]
)
# Tools incluídos no cached prefix se sem cache_control variável
```

## Cache com streaming

Funciona normalmente. `cache_read_input_tokens` no final do stream:

```python
async with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[...cached system...],
    messages=[...],
) as stream:
    async for text in stream.text_stream:
        yield text
    
    final = await stream.get_final_message()
    print(f"Cache hits: {final.usage.cache_read_input_tokens}")
```

## Comparação com response caching

**Prompt caching** ≠ **response caching**.

- Prompt caching: cacheia estado do modelo após processar prefix. LLM still generates output.
- Response caching: stores entire response. Skip LLM call entirely se mesma query.

Combine ambos:
1. **Semantic cache** (e.g., Helicone, GPTCache): se query similar → return cached response.
2. **Prompt cache**: para queries novas, accelerate generation.

Tier 1 = semantic cache (zero LLM call). Tier 2 = prompt cache (faster generation). Tier 3 = no cache.

## Checklist — prompt caching maturity

- [ ] System prompt estável marcado com cache_control?
- [ ] Cache hit rate monitorado e > 70%?
- [ ] Prompts normalizados (whitespace, encoding)?
- [ ] Variable parts no final do prompt?
- [ ] TTL configurado (5min vs 1h) baseado em pattern?
- [ ] Dashboard mostra economy em $ (cached tokens × discount)?
- [ ] OpenAI cached_tokens reported em logs?
- [ ] Anthropic cache_creation/read separado em metrics?

## Leituras

- Anthropic prompt caching docs (docs.anthropic.com/claude/docs/prompt-caching)
- OpenAI prompt caching (platform.openai.com/docs/guides/prompt-caching)
- "Reducing AI costs with prompt caching" — Anthropic blog
- "Prompt Caching Pricing" — provider pricing pages
- Helicone semantic cache docs
