---
title: Extended Thinking & Reasoning Models — o1, o3, Claude
category: agentes-ia
stack: [Claude, OpenAI o1, o3, reasoning]
tags: [reasoning, extended-thinking, o1, o3, claude]
excerpt: "Reasoning models (Claude extended thinking, OpenAI o1/o3) — quando vale o custo de raciocínio, controle de budget, qualidade vs latência."
related: [ai-llm-internals-2026, ai-prompt-caching, ai-cost-optimization]
updated: "2026-05-10"
---

## A nova categoria de modelos

Em set/2024, OpenAI lançou **o1** — modelo que "pensa" antes de responder. Em mar/2025, Anthropic lançou **Claude extended thinking**. Em 2026, multiple providers oferecem reasoning modes.

Diferença vs LLM tradicional:
- **Tradicional**: input → output direto. Quick.
- **Reasoning**: input → internal "thinking" tokens → output. Slow but smarter para complex tasks.

Internal thinking tokens são gerados pelo modelo mas:
- Não visíveis ao user (em alguns providers).
- **Contam no output budget** (você paga por eles).
- Aumentam latency 10-100x.

## Quando reasoning model **ganha**

| Task | Tradicional | Reasoning model |
|------|-------------|-----------------|
| Math problem (multi-step) | Falha 30-50% | 5-10% error rate |
| Code com debug complex | OK em fácil, falha em medium+ | Strong em medium-hard |
| Logic puzzles | Falha em multi-step | Resolve consistently |
| Planning multi-step | Stable em simple, falha em complex | Better in complex |
| Scientific reasoning | Frequente erro | Más rigoroso |

Em benchmarks (AIME, MATH, Codeforces), reasoning models 2-5x melhor accuracy.

## Quando reasoning model **NÃO ajuda**

| Task | Recomendação |
|------|--------------|
| Chat casual | Tradicional (faster, cheaper) |
| Classification | Tradicional |
| Sumarização | Tradicional |
| RAG QA factual | Tradicional |
| Format conversion | Tradicional |
| Translation | Tradicional |
| Simple code completion | Tradicional |

Reasoning é overkill para tasks que tradicional resolve bem. Custo + latência são desperdício.

## Claude Extended Thinking

```python
from anthropic import Anthropic

client = Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=8192,
    thinking={
        "type": "enabled",
        "budget_tokens": 4096,  # max tokens de raciocínio
    },
    messages=[
        {"role": "user", "content": "Prove that the sum of an infinite geometric series with |r|<1 is a/(1-r)."}
    ],
)

# Response tem content blocks de diferentes tipos
for block in response.content:
    if block.type == "thinking":
        # Reasoning tokens (geralmente não exibir ao user)
        print("INTERNAL THINKING:", block.thinking[:200])
    elif block.type == "text":
        # Resposta final
        print("ANSWER:", block.text)

print(f"Reasoning tokens: {response.usage.thinking_tokens}")
print(f"Output tokens: {response.usage.output_tokens}")
```

### Budget control

`budget_tokens` é **soft limit**:
- Claude pensa até ~ esse limite, depois finaliza resposta.
- Pequenos problemas usam menos.
- Problemas complexos podem hit limit (resposta pode ser incompleta).

Recomendações de budget:

| Task complexity | Budget |
|-----------------|--------|
| Math problem | 2-4k |
| Code review | 4-8k |
| System design | 8-16k |
| Research analysis | 16-32k |

Budget muito baixo = Claude "para de pensar" prematuramente, output ruim.

### Streaming com thinking

```python
async with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=8192,
    thinking={"type": "enabled", "budget_tokens": 4096},
    messages=[{"role": "user", "content": query}],
) as stream:
    async for event in stream:
        if event.type == "content_block_start":
            if event.content_block.type == "thinking":
                # User vê "Pensando..." indicator
                yield "<thinking_indicator/>"
        elif event.type == "content_block_delta":
            if hasattr(event.delta, "text"):
                yield event.delta.text
```

UX pattern: mostrar "Claude está pensando..." enquanto thinking blocks emitem. Quando text block começa, mostre resposta.

## OpenAI o1 / o3

```python
from openai import OpenAI
client = OpenAI()

response = client.chat.completions.create(
    model="o3-mini",  # ou "o1", "o3"
    messages=[
        {"role": "user", "content": "Prove..."}
    ],
    reasoning_effort="medium",  # low / medium / high
)

# o1/o3 não retorna thinking visível (apenas em alguns enterprise tiers)
print(response.choices[0].message.content)
print(f"Reasoning tokens: {response.usage.completion_tokens_details.reasoning_tokens}")
```

### Diferenças vs Claude

| Aspecto | Claude Extended Thinking | OpenAI o1/o3 |
|---------|-------------------------|--------------|
| Thinking visível | Sim (blocks) | Não (oculto) |
| Budget control | Explícito (`budget_tokens`) | `reasoning_effort` (low/med/high) |
| System prompt | Suportado | NÃO em o1 (suportado em o3) |
| Streaming | Suportado | Limitado |
| Cost | Charged como output | Charged como output (varia por modelo) |
| Tool use | Suportado | Limitado em o1, melhor em o3 |
| Multimodal | Sim | Limitado em o1, melhor em o3 |

## Cost reality check

Reasoning é caro. Comparison ilustrativo (preços 2026, ilustrativos):

| Model | Input $/1M | Output $/1M | Tempo típico | Use case |
|-------|-----------|-------------|--------------|----------|
| Claude Haiku | $0.25 | $1.25 | 1-2s | Simple tasks |
| Claude Sonnet | $3 | $15 | 2-5s | Default |
| Claude Sonnet + thinking | $3 | $15 + thinking tokens | 5-30s | Math, code |
| Claude Opus | $15 | $75 | 5-10s | Premium quality |
| GPT-4o-mini | $0.15 | $0.60 | 1-3s | Cheap |
| GPT-4o | $2.50 | $10 | 2-5s | Default |
| o3-mini | $1.10 | $4.40 | 10-30s | Reasoning cheap |
| o1 | $15 | $60 | 30-120s | Premium reasoning |

Reasoning model gera **5-50x mais tokens** que tradicional pra mesma resposta visível (thinking + output). Custo total pode ser 50-500x mais.

Recomendação: **routing**. Use reasoning model SÓ quando vale.

## Routing pattern

```python
async def smart_route(query: str) -> str:
    # Classifier rápido (Haiku) decide se precisa reasoning
    classification = await client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=100,
        messages=[{"role": "user", "content": f"""
Is this query best answered with reasoning (math, logic, complex code) or fast (simple chat, lookup, classification)?

Query: {query}

Respond with one word: "reasoning" or "fast".
"""}],
    )
    
    if "reasoning" in classification.content[0].text.lower():
        # Use reasoning model
        return await call_with_thinking(query)
    else:
        # Use fast model
        return await call_fast(query)
```

Classification adds ~$0.001 e 500ms, but saves multiple dollars + tens of seconds em queries fast-eligible.

## Hybrid pattern: reasoning + tradicional

Combine: use reasoning para planning, tradicional para execution.

```python
# Step 1: Reasoning model decompõe problema
plan = await call_reasoning(f"""
Decompose this task into clear steps:
{task}

Output JSON with array of steps.
""")

# Step 2: Tradicional model executa cada step
for step in plan.steps:
    result = await call_traditional(step)
    # ...
```

Reasoning gasta tokens em planning. Execution barata.

## Tool use com reasoning

Claude extended thinking + tools funciona naturalmente:

```python
tools = [{"name": "calculator", "description": "...", "input_schema": {...}}]

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    thinking={"type": "enabled", "budget_tokens": 4096},
    tools=tools,
    messages=[{"role": "user", "content": "What's 17 * 23 + 9?"}]
)

# Claude pode reasoning antes de chamar calculator
# Tool call result entra como context para reasoning subsequente
```

o3 também suporta tool use durante reasoning.

## Streaming UX para reasoning

```typescript
// Frontend (React)
function ReasoningChat() {
  const [thinking, setThinking] = useState("");
  const [response, setResponse] = useState("");
  const [stage, setStage] = useState<"idle" | "thinking" | "responding">("idle");
  
  // Stream handler
  function onChunk(chunk) {
    if (chunk.type === "thinking_start") setStage("thinking");
    if (chunk.type === "thinking_delta") setThinking(prev => prev + chunk.text);
    if (chunk.type === "text_start") setStage("responding");
    if (chunk.type === "text_delta") setResponse(prev => prev + chunk.text);
  }
  
  return (
    <>
      {stage === "thinking" && (
        <details>
          <summary>🧠 Pensando ({thinking.length} chars)</summary>
          <pre>{thinking}</pre>
        </details>
      )}
      <div>{response}</div>
    </>
  );
}
```

User vê "pensando" indicator, opcionalmente expand pra ver raciocínio.

## Caveats — thinking não é sempre correto

Reasoning tokens podem ser:
- **Verbose mas errados** — modelo enrola sem chegar a conclusão correta.
- **Hallucinated steps** — invent fatos durante reasoning.
- **Loops** — repete mesmo raciocínio.

Mitigation:
- Test golden dataset (eval-driven dev).
- Monitor thinking_tokens distribution (anomalias = sign de loop).
- Compare reasoning vs non-reasoning para mesma task — se accuracy igual, não use reasoning.

## Privacy: thinking tokens em logs

Thinking tokens podem revelar processo de raciocínio sensible:
- Vendor sees thinking (Anthropic, OpenAI).
- Não armazenado em logs end-user.
- Para healthcare/legal, considere on-prem models.

Anthropic permite disabilitar thinking visible em production logs por compliance.

## Performance impact

Reasoning aumenta:
- **TTFT**: 5-30s vs <1s.
- **Total latency**: 10-120s vs 2-10s.
- **Token usage**: 5-50x output tokens.

Tradeoffs:
- Agent workflows: latency aceitável (background task).
- User-facing chat: streaming UX crucial (mostrar progress).
- API products: rate limit aware (1 query/30s).

## Quando avaliar mudar pra reasoning

Sinais que você precisa de reasoning:
- Accuracy < 80% em task com tradicional model.
- Complex tasks com 5+ steps de raciocínio.
- Math/logic problems com Wong answer rate alto.
- Code que precisa entender flow complex.

Sinais que NÃO precisa:
- Task simples bem-resolvida por Haiku.
- Latency budget < 5s.
- Cost-sensitive.
- High throughput (>1k req/min).

## A/B test pra decidir

```python
async def ab_test_reasoning():
    test_queries = load_golden_dataset()  # 100 queries with expected answers
    
    results = {"traditional": [], "reasoning": []}
    
    for query in test_queries:
        # Tradicional
        trad = await call_traditional(query["input"])
        results["traditional"].append({
            "correct": eval_answer(trad, query["expected"]),
            "cost": compute_cost(trad.usage),
            "latency": trad.latency,
        })
        
        # Reasoning
        reason = await call_reasoning(query["input"])
        results["reasoning"].append({
            "correct": eval_answer(reason, query["expected"]),
            "cost": compute_cost(reason.usage),
            "latency": reason.latency,
        })
    
    # Compare
    print(f"Tradicional accuracy: {sum(r['correct'] for r in results['traditional']) / 100:.1%}")
    print(f"Reasoning accuracy: {sum(r['correct'] for r in results['reasoning']) / 100:.1%}")
    print(f"Cost ratio: {avg_cost_reasoning / avg_cost_traditional:.1f}x")
    print(f"Latency ratio: {avg_lat_reasoning / avg_lat_traditional:.1f}x")
```

Decision: usar reasoning if accuracy improvement >> cost/latency penalty.

## Future direction (2026+)

- Mais providers add reasoning modes.
- "Thinking compression" — model raciocina mais eficiente, fewer tokens.
- Reasoning + agentic — agents que reasoning per step.
- Multi-modal reasoning — vision + reasoning combined.

Para AI Engineer 2026+: entenda reasoning como tool no toolbox, não default.

## Checklist — reasoning model production

- [ ] A/B test contra tradicional model — accuracy improvement > 10%?
- [ ] Budget control configurado adequadamente?
- [ ] Cost monitoring per query (thinking tokens incluídos)?
- [ ] Streaming UX mostra "pensando" indicator?
- [ ] Routing classifier pra evitar reasoning quando desnecessário?
- [ ] Latency expectations comunicadas ao user?
- [ ] Eval pipeline testa golden dataset regularmente?
- [ ] Fallback se reasoning timeout?

## Leituras

- Anthropic extended thinking docs (docs.anthropic.com/claude/docs/extended-thinking)
- OpenAI o1 system card (openai.com/o1)
- "Let's Verify Step by Step" — OpenAI paper (process supervision)
- "Chain-of-Thought" — original Wei et al. 2022 paper
- "Self-consistency" — Wang et al. 2022 (multi-sample reasoning)
- Anthropic blog: "Introducing extended thinking"
