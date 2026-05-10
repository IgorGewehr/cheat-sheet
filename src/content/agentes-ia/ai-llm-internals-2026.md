---
title: LLM Internals 2026 — Tokens, Sampling, Context Window
category: agentes-ia
stack: [LLM, tokens, sampling, context engineering]
tags: [llm, tokens, sampling, context, internals, 2026]
excerpt: "O que AI Engineer precisa saber de LLM internals — tokenização, sampling moderno (top_p, min_p, repetition penalty), context windows reais (não marketing), latência por token, custo de input vs output."
related: [llm-fundamentos, ai-prompt-eng-2026, ai-prompt-caching, ai-extended-thinking]
updated: "2026-05-10"
---

## Não é "como transformers funcionam"

Esse card NÃO é teoria de attention/positional encoding. É o que **AI Engineer prático** precisa pra construir apps que funcionam:

- Por que sua app gasta 5x mais que esperado.
- Por que latência cresce não-linear com input.
- Por que prompts longos degradam qualidade.
- Por que cache hits mudam economics.

Pra teoria, ver `llm-fundamentos`.

## Tokens — o que realmente são

LLMs não veem letras. Veem **tokens** — pedaços comuns de texto (~4 chars em inglês, ~3 em português, mais em código).

```python
# Estimar tokens — tiktoken (OpenAI BPE) ou anthropic-tokenizers
import tiktoken
enc = tiktoken.encoding_for_model("gpt-4")
tokens = enc.encode("Hello, world!")
# [9906, 11, 1917, 0] — 4 tokens

# Português é menos eficiente
enc.encode("Olá, mundo!")
# [78, 14559, 11, 7299, 78, 0] — 6 tokens

# Anthropic
from anthropic import Anthropic
client = Anthropic()
client.messages.count_tokens(
    model="claude-sonnet-4-6",
    messages=[{"role": "user", "content": "Hello"}],
)
```

### Implicações práticas

| Idioma | Chars/token médio |
|--------|-------------------|
| Inglês | ~4 |
| Espanhol/Português | ~3 |
| Chinês | ~1.5 |
| Código (Python/JS) | ~3 |
| JSON/XML | ~3 |

- **Português custa 33% mais** que inglês em tokens.
- **Idiomas asiáticos custam 2-3x mais**.
- **Whitespace conta** — JSON com indent gasta tokens à toa em prompts longos.

### Pricing model

```
Custo total = (input_tokens × input_rate) + (output_tokens × output_rate)
```

**Output é tipicamente 4-5x mais caro que input** (porque generation é mais cara que ingestion). Strategy:

- **Sumarize input** se possível (RAG, chunking) — reduz input cost.
- **Limite max_tokens** explicitamente — evita generation longa não-pedida.
- **Use cache** para input estável (prompt caching, Tier 1 card).

Exemplo Claude Sonnet 4.6 (2026, prices ilustrativos):
- Input: $3 / 1M tokens
- Output: $15 / 1M tokens
- Cached input: $0.30 / 1M tokens (10x cheaper!)

## Context Window — o que dizem vs realidade

| Provider/Model | Context anunciado | "Effective" context (qualidade boa) |
|----------------|-------------------|-------------------------------------|
| Claude Sonnet 4.6 | 200k–1M | ~150k high quality, degrade após |
| GPT-4o | 128k | ~90k high quality |
| Gemini 2.0 | 1M-2M | Variable, melhor que GPT em long |
| Llama 3.3 | 128k | Sliding attention helps até ~64k |
| o1/o3 reasoning | 200k | Reasoning tokens consomem budget |

**"Lost in the middle" effect** (research Anthropic, Stanford): LLMs lembram melhor o **início** e **fim** do contexto, esquecem o meio. Test seu app — não confie 100% que context "está lá".

### Otimizações de context

```python
# ❌ Anti-pattern: dump tudo no contexto
prompt = f"""
{all_company_docs}  # 500k tokens
{conversation_history}  # 50k tokens
User: {user_query}
"""

# ✅ RAG seletivo + summarization
relevant_docs = await retrieve(user_query, k=5)  # ~10k tokens
recent_history = conversation_history[-10:]  # ~3k tokens
prompt = f"""
{relevant_docs}
{recent_history}
User: {user_query}
"""
```

### Posicionamento importa

Coloque informação crítica no **início** (system prompt) e **fim** (logo antes do user query). Evite ferrar no meio.

```python
# ✅ Estrutura recomendada (Claude)
system = """
[Instruções importantes aqui — Claude lê system prompt com mais peso]
"""

messages = [
    {"role": "user", "content": [
        # Documentos primeiro
        {"type": "text", "text": f"<docs>{relevant_docs}</docs>"},
        # Query no final
        {"type": "text", "text": f"<query>{user_query}</query>"},
    ]}
]
```

## Sampling — controlar a geração

LLM produz **probability distribution** sobre todos os tokens possíveis. Sampling escolhe qual token usar.

### Parâmetros

| Param | O que faz | Quando usar |
|-------|-----------|-------------|
| `temperature` (0-1) | Suaviza distribution. 0 = determinístico, 1 = criativo. | 0 pra structured/factual, 0.7 pra criativo. |
| `top_p` (0-1) | Nucleus sampling: pega tokens cumulativamente até prob ≥ p. | 0.9 default. Quase sempre usar. |
| `top_k` | Pega top K mais prováveis. | Raramente — top_p domina. |
| `min_p` | Probability mínima relativa ao mais provável. | Emergente — melhor calibrated para criativo. |
| `repetition_penalty` | Penaliza tokens recém-vistos. | Em geração longa para evitar loops. |
| `frequency_penalty` (OpenAI) | Penaliza por freq histórica. | Idem. |
| `presence_penalty` (OpenAI) | Penaliza qualquer token já visto. | Idem. |

### Combinations práticas

```python
# Structured output (function calling, JSON, classificação)
{"temperature": 0, "top_p": 1}  # Determinístico

# RAG / QA factual
{"temperature": 0.2, "top_p": 0.9}  # Pouco variação

# Criativo (story, brainstorming)
{"temperature": 0.7, "top_p": 0.95}

# Code generation
{"temperature": 0.2, "top_p": 0.95}  # Pouco criativo

# Diversa exploration (geração de variations)
{"temperature": 1.0, "top_p": 1.0}
```

**Importante**: temperature=0 NÃO é 100% determinístico em LLMs modernos. Pequenas diferenças em GPU computation, batch composition, model sharding causam variações ocasionais. Pra reprodutibilidade total, **seed** (Anthropic e OpenAI suportam) reduz mas não elimina variação.

## Latência — como decompor

Time to complete generation = TTFT + TTPT × tokens_generated

- **TTFT** (Time To First Token): latência do request até primeiro token. Frontend perceives this as "responsiveness".
- **TTPT** (Time Per Token): inverso da geração rate. Modelos grandes ~30-50 tokens/s. Modelos pequenos 100-300/s.

```python
# Medir TTFT
import time
async with client.messages.stream(...) as stream:
    request_start = time.time()
    async for event in stream:
        if event.type == "content_block_start":
            ttft = time.time() - request_start
            print(f"TTFT: {ttft*1000:.0f}ms")
            break
```

### Latency budgets típicos

| App type | TTFT target | Total target |
|----------|-------------|--------------|
| Chat UI | <500ms | streaming, total irrelevant |
| Auto-complete | <100ms | <500ms total |
| Agent tool call | <1s | <30s total |
| RAG with sources | <2s | <10s total |
| Reasoning (o1, extended thinking) | varies | 5s-2min |

### Acelerar geração

1. **Prompt caching** — reduz TTFT 50-80% em workloads com contexto repetitivo.
2. **Streaming** — UX percebe rápido mesmo com total longo.
3. **Speculative decoding** — pequeno modelo "guess" tokens, grande valida em batch. 2-3x speedup.
4. **Predicted outputs** (OpenAI) — passe rascunho esperado, modelo edita. Útil em refactor.
5. **Smaller model** — Haiku é 5x mais rápido que Opus pra muitas tasks.
6. **Parallel calls** — não chain serially se podem ser paralelos.

## Custo — mental model

Total cost por request:

```
cost_request = (input_uncached × $3) + (input_cached × $0.30) + (output × $15)
              / 1M
```

Otimizações em ordem de impacto:

1. **Prompt caching** (5-10x economy) — primeira coisa a aplicar se prompt é estável.
2. **Batching API** (50% off em Anthropic/OpenAI) — async workloads não-real-time.
3. **Model routing** — Haiku 80% das tasks, Sonnet 15%, Opus 5%.
4. **Context pruning** — RAG selective + summarization de historia.
5. **Output max_tokens** — limit explícito.
6. **Avoid redundant calls** — cache responses (semantic cache, e.g., Helicone).

## Reasoning models (o1, o3, Claude extended thinking)

Modelos que "pensam" antes de responder. Geram tokens internos de raciocínio, não visíveis ao user.

**Trade-offs**:
- ✓ Melhor em problemas multi-step (math, code, planning).
- ✗ Caro (output tokens incluem reasoning).
- ✗ Lento (5s-2min vs <2s).
- ✗ Não é melhor pra QA factual, sumarização, chat.

```python
# Claude extended thinking (2026)
response = await client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=8192,
    thinking={"type": "enabled", "budget_tokens": 4096},  # budget de raciocínio
    messages=[{"role": "user", "content": "Prove that..."}],
)
# response.content tem blocks de tipo "thinking" + "text"
```

Quando usar (ver card dedicated `ai-extended-thinking`):
- ✓ Math/logic complex.
- ✓ Code com debug.
- ✓ Decisions com trade-offs.
- ✗ Chat casual.
- ✗ Classification.

## Trade-offs entre providers (2026 snapshot)

| Forte | Claude (Anthropic) | GPT (OpenAI) | Gemini (Google) | Llama 3 (Meta) |
|-------|---|---|---|---|
| **Code** | ★★★★★ | ★★★★ | ★★★ | ★★★ |
| **Reasoning** | ★★★★ (com extended thinking) | ★★★★★ (o1/o3) | ★★★ | ★★★ |
| **Long context** | ★★★★★ (1M) | ★★★★ | ★★★★★ (2M) | ★★ |
| **Vision** | ★★★★ | ★★★★★ | ★★★★ | ★★★ |
| **Audio** | ★★★★ (Sonnet audio) | ★★★★★ (Realtime) | ★★★ | ★ |
| **Tool use** | ★★★★★ | ★★★★ | ★★★★ | ★★★ |
| **Cost** | $$$ | $$$$ | $$ | $ (self-hosted) |
| **Privacy/local** | API only | API only | API only | ★★★★★ |

Estratégia 2026: multi-provider. Default Claude/GPT, fallback opposite, opcional Llama local.

## Checklist — entender LLM antes de usar

- [ ] Sei quantos tokens meu prompt típico tem?
- [ ] Sei o custo médio por request (input + output)?
- [ ] Medi TTFT e total latency em prod?
- [ ] Sampling parameters configurados pelo use case (não default)?
- [ ] Output max_tokens explícito?
- [ ] Position critical info em start/end de contexto?
- [ ] Multi-provider fallback configurado?
- [ ] Reasoning model usado SÓ quando vale (não default)?

## Leituras

- "Tokenization" — Karpathy YouTube series
- "The Bitter Lesson" — Rich Sutton
- "Lost in the Middle" paper — Liu et al. 2023
- Anthropic engineering blog (latency, prompt caching)
- OpenAI Cookbook (cookbook.openai.com)
- "GPT in 60 Lines of NumPy" — jaykmody.com
- Simon Willison's blog (simonwillison.net) — practitioner perspective
