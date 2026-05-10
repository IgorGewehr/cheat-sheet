---
title: Anthropic vs OpenAI SDK — Comparison Prático
category: agentes-ia
stack: [Anthropic, OpenAI, SDK, Messages API]
tags: [anthropic, openai, sdk, providers, comparison]
excerpt: "Stack das duas APIs de LLM mais usadas em prod — diferenças em Messages format, tool use, streaming, prompt caching. Quando escolher cada uma."
related: [anthropic-sdk-patterns, ai-prompt-caching, ai-structured-output, ai-streaming-sse]
updated: "2026-05-10"
---

## Por que comparar diretamente

Em consultoria 2026, cliente quase sempre quer multi-provider:
- Fallback se um cai.
- Cost optimization (qual é mais barato por task).
- Compliance (data residency, BAA).
- Avoid vendor lock-in.

Esse card mostra as duas APIs side-by-side para você escolher caso a caso.

## Setup

```bash
pip install anthropic openai
# ou
uv add anthropic openai
```

```python
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI

claude = AsyncAnthropic()  # ANTHROPIC_API_KEY env
gpt = AsyncOpenAI()        # OPENAI_API_KEY env
```

## Format Messages — diferenças

### Anthropic Messages API

```python
response = await claude.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,             # OBRIGATÓRIO em Anthropic
    system="You are a helpful assistant.",  # system separado
    messages=[
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
        {"role": "user", "content": "How are you?"},
    ],
)
print(response.content[0].text)
print(response.usage)
# Usage(input_tokens=X, output_tokens=Y, cache_creation_input_tokens=0, cache_read_input_tokens=0)
```

### OpenAI Chat Completions

```python
response = await gpt.chat.completions.create(
    model="gpt-4o",
    # max_tokens é opcional em OpenAI
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},  # system inline
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
        {"role": "user", "content": "How are you?"},
    ],
)
print(response.choices[0].message.content)
print(response.usage)
# CompletionUsage(prompt_tokens=X, completion_tokens=Y, total_tokens=Z)
```

### Diferenças chave

| Aspecto | Anthropic | OpenAI |
|---------|-----------|--------|
| System role | Separado (`system` param) | Inline em messages array |
| Max tokens | Obrigatório | Opcional |
| Response shape | `response.content[0].text` | `response.choices[0].message.content` |
| Usage field names | `input_tokens`, `output_tokens` | `prompt_tokens`, `completion_tokens` |
| Content blocks | Array (multimodal nativo) | String ou array (mais recente) |

### Wrapper unificado

```python
async def llm_call(provider: str, system: str, messages: list, max_tokens: int = 1024):
    if provider == "anthropic":
        response = await claude.messages.create(
            model="claude-sonnet-4-6",
            system=system,
            messages=messages,
            max_tokens=max_tokens,
        )
        return {
            "text": response.content[0].text,
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
        }
    elif provider == "openai":
        msgs = [{"role": "system", "content": system}] + messages
        response = await gpt.chat.completions.create(
            model="gpt-4o",
            messages=msgs,
            max_tokens=max_tokens,
        )
        return {
            "text": response.choices[0].message.content,
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens,
        }
```

## Streaming

### Anthropic — async iterator

```python
async with claude.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Tell me a story"}],
) as stream:
    async for text in stream.text_stream:
        print(text, end="", flush=True)
    
    # Final usage available
    final = await stream.get_final_message()
    print(final.usage)
```

### OpenAI — async iteration

```python
stream = await gpt.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Tell me a story"}],
    stream=True,
    stream_options={"include_usage": True},  # usage no último chunk
)
async for chunk in stream:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
    if chunk.usage:
        print(chunk.usage)
```

## Tool Use / Function Calling

### Anthropic

```python
tools = [{
    "name": "get_weather",
    "description": "Get current weather in a city",
    "input_schema": {
        "type": "object",
        "properties": {
            "city": {"type": "string"},
            "unit": {"type": "string", "enum": ["c", "f"]}
        },
        "required": ["city"]
    }
}]

response = await claude.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "Weather in Paris?"}]
)

# Inspect blocks
for block in response.content:
    if block.type == "tool_use":
        result = await get_weather(**block.input)
        # Send result back
        followup = await claude.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            tools=tools,
            messages=[
                {"role": "user", "content": "Weather in Paris?"},
                {"role": "assistant", "content": response.content},
                {"role": "user", "content": [{
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": str(result),
                }]}
            ]
        )
```

### OpenAI

```python
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get current weather in a city",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string"},
                "unit": {"type": "string", "enum": ["c", "f"]}
            },
            "required": ["city"]
        }
    }
}]

response = await gpt.chat.completions.create(
    model="gpt-4o",
    tools=tools,
    messages=[{"role": "user", "content": "Weather in Paris?"}]
)

# Handle tool calls
msg = response.choices[0].message
if msg.tool_calls:
    tc = msg.tool_calls[0]
    args = json.loads(tc.function.arguments)
    result = await get_weather(**args)
    
    # Send result back
    followup = await gpt.chat.completions.create(
        model="gpt-4o",
        tools=tools,
        messages=[
            {"role": "user", "content": "Weather in Paris?"},
            msg.model_dump(),  # assistant message with tool_calls
            {"role": "tool", "tool_call_id": tc.id, "content": str(result)},
        ]
    )
```

### Key differences

| Aspecto | Anthropic | OpenAI |
|---------|-----------|--------|
| Tool definition | flat `{name, description, input_schema}` | nested `{type: "function", function: {...}}` |
| Tool result role | "user" with content blocks | "tool" role |
| Tool call detection | content blocks (filter type) | `message.tool_calls` array |
| Parallel tool calls | Sim, mesmo blocks array | Sim, mesmo `tool_calls` array |

## Prompt Caching

Anthropic e OpenAI implementam diferente (ver `ai-prompt-caching` para deep dive):

### Anthropic — explicit cache_control

```python
response = await claude.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[
        {"type": "text", "text": "Você é assistente jurídico."},
        {
            "type": "text",
            "text": GIANT_LEGAL_CODE,  # 100k tokens
            "cache_control": {"type": "ephemeral"},  # marca cache breakpoint
        },
    ],
    messages=[{"role": "user", "content": question}],
)
# Próxima request com mesmo prefix usa cache (90% desconto + faster)
```

### OpenAI — automático (prefixos)

```python
# OpenAI cacheia automaticamente prompts >=1024 tokens com prefixo idêntico
# Sem marcação explícita.
response = await gpt.chat.completions.create(
    model="gpt-4o",
    messages=[...]  # se mesmo prefixo de outra recente, cache hit
)
# Check em response.usage.prompt_tokens_details.cached_tokens
```

### Trade-off

- **Anthropic**: controle explícito (você decide o cache breakpoint), TTL 5 min default.
- **OpenAI**: zero overhead (transparente), mas menos controle. Cache pode invalidar inesperado.

Em 2026, prompt caching está em ambos. Strategy: design prompt com prefixo estável (system + context grande) + variável no final (user query).

## Quando escolher cada

### Claude (Anthropic)

**Forças:**
- Melhor em **code** (Sonnet 4.6+, Opus 4+).
- **Long context** (até 1M tokens) bem-comportado.
- **Tool use** mais robusto, errors mais previsíveis.
- **Constitutional AI** — refusals mais previsíveis em produção.
- **Extended thinking** — reasoning controlável.
- **Multimodal** vision/audio integrado.

**Quando preferir Claude:**
- Apps com code generation/refactor.
- RAG com contexto grande.
- Agents production-grade.
- App que precisa de tone profissional/cuidadoso.
- Empresas com BAA/compliance (Anthropic tem fortes garantias).

### GPT (OpenAI)

**Forças:**
- **Reasoning models** (o1, o3) sem rival pra problemas multi-step.
- **Realtime API** — audio bidirecional baixa latência.
- **Ecossistema maior** — assistants API, GPTs, plugins.
- **DALL-E** integrado pra image generation.
- **Whisper** state-of-art ASR.
- **Mais barato** em alguns tiers (GPT-4o-mini vs Haiku).

**Quando preferir GPT:**
- Problemas math/logic complex (o1/o3).
- Voice apps (Realtime API).
- Image generation no fluxo.
- Speech-to-text dedicated (Whisper).
- Migração de legacy OpenAI codebase.

### Outros providers (2026)

- **Google Gemini 2.0+**: 2M context, multimodal forte, Google Cloud BAA. Cresceu em 2025-2026.
- **AWS Bedrock**: hospeda Claude, Llama, Mistral — managed Anthropic + extras. Para customers AWS-heavy.
- **Azure OpenAI**: GPT-4 + Azure compliance. Para Microsoft-heavy customers.
- **Mistral**: API + self-host. Boa pra Europa (data residency).
- **Cohere**: rerank API best-in-class. Embedding API competitive. Multilingual strong.
- **Groq**: speed (LPU-based inference). Latência ultra-low.
- **Together AI / Fireworks**: hospeda open models (Llama, Mixtral) com API compatível OpenAI.

## OpenAI-compatible interface

Muitos providers expõem API "OpenAI-compatible" — você usa cliente OpenAI apontando pra outro endpoint:

```python
# Together AI hosting Llama 3
from openai import AsyncOpenAI

together = AsyncOpenAI(
    api_key=os.environ["TOGETHER_API_KEY"],
    base_url="https://api.together.xyz/v1",
)

response = await together.chat.completions.create(
    model="meta-llama/Llama-3.3-70B-Instruct",
    messages=[...],
)
```

Funciona em: Together, Fireworks, Groq, vLLM (self-hosted), Ollama (local).

## Multi-provider abstraction layer

```python
# Simple wrapper para multi-provider
class LLMRouter:
    def __init__(self):
        self.claude = AsyncAnthropic()
        self.gpt = AsyncOpenAI()
    
    async def call(
        self,
        provider: str,
        model: str,
        system: str,
        messages: list,
        max_tokens: int = 1024,
        tools: list | None = None,
    ):
        if provider == "anthropic":
            return await self._call_claude(model, system, messages, max_tokens, tools)
        elif provider == "openai":
            return await self._call_openai(model, system, messages, max_tokens, tools)
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    # ... implementações
```

Frameworks que fazem isso bem:
- **LiteLLM** — proxy unificado, 100+ providers, OpenAI-compatible.
- **LangChain** — LLM abstraction (mas heavy).
- **Vercel AI SDK** (JS/TS) — multi-provider TypeScript.

## Auth e segurança

```python
# Não commitar API keys — env vars
# .env (gitignored)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Rotate keys regularmente
# Use API key per environment (dev, staging, prod)
# Set spending limits no dashboard do provider

# Em produção: secrets manager (AWS Secrets, Vault)
import boto3
secrets = boto3.client("secretsmanager")
api_key = secrets.get_secret_value(SecretId="anthropic-prod")["SecretString"]
```

## Rate limits — handle correctly

Ambos providers têm rate limits por tier de uso:

```python
from anthropic import RateLimitError
import asyncio

async def call_with_retry(messages: list, retries: int = 3):
    for attempt in range(retries):
        try:
            return await claude.messages.create(...)
        except RateLimitError as e:
            if attempt == retries - 1:
                raise
            # Anthropic envia retry-after no header
            delay = 2 ** attempt  # exponential backoff
            await asyncio.sleep(delay)
```

Em produção: usar `tenacity` library.

## Checklist — multi-provider production

- [ ] Wrapper abstrai diferenças de format
- [ ] Fallback configurado (primary → secondary)
- [ ] Rate limit handling com retry exponencial
- [ ] Prompt caching habilitado onde aplicável
- [ ] Token counting antes do request (estimar custo)
- [ ] Streaming preferred para UX
- [ ] Tool use error handling (retry sem loop)
- [ ] Logging estruturado (provider, model, tokens, latência)
- [ ] Cost tracking per request (annotate com user_id)
- [ ] API keys em secrets manager, rotacionadas

## Leituras

- Anthropic API docs (docs.anthropic.com)
- OpenAI API docs (platform.openai.com/docs)
- LiteLLM docs (docs.litellm.ai)
- "AI Engineering" — Chip Huyen (livro 2024)
- Anthropic Cookbook (github.com/anthropics/anthropic-cookbook)
- OpenAI Cookbook (cookbook.openai.com)
- Vercel AI SDK docs (sdk.vercel.ai)
