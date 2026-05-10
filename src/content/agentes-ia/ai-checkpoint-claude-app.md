---
title: "Checkpoint Tier 1: Claude App from Scratch"
category: checklists
stack: [Anthropic SDK, FastAPI, Next.js, streaming]
tags: [checkpoint, claude, hands-on, prompt-caching, tool-use]
excerpt: "Validação prática do Tier 1 — Build app Claude-powered SEM framework (sem LangChain) com prompt caching, tools, streaming, structured output, multimodal."
related: [ai-prompt-caching, ai-streaming-sse, ai-multimodal-2026, ai-structured-output]
updated: "2026-05-10"
---

## Objetivo

Antes de adicionar abstractions (LangChain, LangGraph), você precisa **dominar a stack core**. Esse checkpoint valida: você pode construir uma app Claude-powered usando apenas Anthropic SDK + sua stack web favorita.

Conhecer "como funciona por baixo" diferencia AI Engineer de "user de LangChain".

## Critério de aprovação

- **App rodando end-to-end** (frontend + backend + Claude integration).
- **6 features obrigatórias** implementadas (lista abaixo).
- **Code repository** público ou compartilhado.
- **README** com decisões técnicas + custos esperados.
- **Demo video** (3-5 min) mostrando features funcionando.
- **Submissão via /sentinela** pra revisão.

## Tempo estimado: 20-40h

## Use case sugerido (escolha 1)

Escolha um, pra evitar paralisia analítica. Não importa qual:

### A. **Document Q&A** (mais comum)
- Upload PDF/imagem de documento (contrato, paper, manual).
- Chat conversational sobre ele.
- Citation tracking ("isso está na pág 3, par 2").

### B. **Code Reviewer Assistant**
- Cola código.
- LLM analisa: bugs, sugestões, security issues.
- Output structured (issues list + severity).

### C. **Multilingual Personal Tutor**
- User pratica idioma.
- LLM corrige, sugere, conversa.
- Audio input (Whisper) + audio output (TTS).

### D. **Receipt/Invoice Tracker**
- Upload foto de receipt.
- Vision extracts dados structured.
- Persist em DB local.
- Mostra summary mensal.

## 6 features obrigatórias

### 1. Streaming response (SSE)

```python
@app.post("/chat")
async def chat(req: ChatRequest):
    async def generate():
        async with client.messages.stream(...) as stream:
            async for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

User vê texto chegando token por token, não 5s de espera.

### 2. Prompt caching

```python
# System prompt + reference docs marcados pra cache
system = [
    {"type": "text", "text": "You are a helpful assistant."},
    {
        "type": "text",
        "text": REFERENCE_CONTENT,  # ou doc do user, ou system long
        "cache_control": {"type": "ephemeral"},
    }
]
```

Log `cache_read_input_tokens` e mostre cache hit rate em dashboard.

### 3. Tool use

Pelo menos 2 tools registradas:

```python
tools = [
    {
        "name": "search_documents",
        "description": "Search uploaded documents",
        "input_schema": {...}
    },
    {
        "name": "calculator",
        "description": "Perform math operations",
        "input_schema": {...}
    }
]

# Tool call loop
response = await client.messages.create(..., tools=tools)
while response.stop_reason == "tool_use":
    tool_results = []
    for block in response.content:
        if block.type == "tool_use":
            result = await call_tool(block.name, block.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": str(result)
            })
    
    response = await client.messages.create(
        ...,
        messages=messages + [{"role": "assistant", "content": response.content},
                              {"role": "user", "content": tool_results}],
        tools=tools,
    )
```

### 4. Structured output

Use **Instructor** ou tool_choice forçado pra garantir schema:

```python
import instructor

class Analysis(BaseModel):
    summary: str
    issues: list[Issue]
    confidence: float

result = instructor_client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=2048,
    response_model=Analysis,
    messages=[...]
)
```

Pelo menos um endpoint retorna schema-validated.

### 5. Multimodal input

Vision ou audio:

```python
# Vision
{"role": "user", "content": [
    {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": img_b64}},
    {"type": "text", "text": "What's in this image?"}
]}

# Ou audio (Whisper antes)
transcript = await openai_whisper.transcribe(audio_file)
messages = [{"role": "user", "content": transcript.text}]
```

### 6. Cost tracking

Dashboard simples mostra:
- Total requests today.
- Total tokens (input cached, input uncached, output).
- Estimated cost ($).
- Cache hit rate (%).

```python
log.info("llm_call",
    user_id=user.id,
    input_tokens=response.usage.input_tokens,
    cache_read=response.usage.cache_read_input_tokens,
    cache_create=response.usage.cache_creation_input_tokens,
    output_tokens=response.usage.output_tokens,
    cost_usd=calculate_cost(response.usage),
)
```

## Restrições — o que NÃO usar

Para forçar entendimento da stack core:

- ❌ **LangChain** — vai contra o objetivo de aprender SDK direto.
- ❌ **LlamaIndex** — idem.
- ❌ **Vercel AI SDK** — opcional (pode usar pra streaming UI, mas backend deve ser Anthropic SDK direto).
- ❌ **Boilerplates pré-built** — você escreve o app.

Permitidos e encorajados:

- ✅ **Anthropic SDK** (anthropic Python ou TypeScript).
- ✅ **OpenAI SDK** (pra Whisper, image gen, etc.).
- ✅ **Instructor** (Pydantic + structured output).
- ✅ **FastAPI/Next.js/Bun** ou seu stack favorito.
- ✅ **Drizzle/Postgres/Redis** pra persistence.

## Stack sugerida

**Backend** (Python):
```
fastapi
uvicorn
anthropic
openai           # pra Whisper se audio
instructor       # structured output
pydantic
python-multipart # file upload
sqlmodel         # ou SQLAlchemy
```

**Frontend** (React/Next.js):
```
next
react
ai (Vercel AI SDK pra streaming UI)
tailwindcss
shadcn/ui
```

**Infra**:
- Postgres (ou SQLite pra simplicity).
- Redis pra session/cache opcional.
- Docker compose pra dev.

## Template básico — backend

```python
# main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from anthropic import AsyncAnthropic
import structlog

app = FastAPI()
client = AsyncAnthropic()
log = structlog.get_logger()

# ── Models ──
class ChatRequest(BaseModel):
    message: str
    document_id: str | None = None

# ── Endpoints ──
@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    """Upload document para cache."""
    content = await file.read()
    doc_id = save_document(content, file.content_type)
    return {"doc_id": doc_id}

@app.post("/chat")
async def chat(req: ChatRequest):
    """Chat com optional document context."""
    system_blocks = [{"type": "text", "text": "You are a helpful assistant."}]
    
    if req.document_id:
        doc = get_document(req.document_id)
        system_blocks.append({
            "type": "text",
            "text": f"<document>\n{doc.content}\n</document>",
            "cache_control": {"type": "ephemeral"},
        })
    
    async def generate():
        async with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=system_blocks,
            messages=[{"role": "user", "content": req.message}],
            tools=TOOLS,
        ) as stream:
            async for event in stream:
                # ... handle events
                pass
            
            final = await stream.get_final_message()
            log.info("chat_complete",
                input_tokens=final.usage.input_tokens,
                cache_read=final.usage.cache_read_input_tokens,
                output_tokens=final.usage.output_tokens,
                cost=calculate_cost(final.usage),
            )
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/analyze")
async def analyze(text: str) -> Analysis:
    """Structured output endpoint."""
    return await instructor_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        response_model=Analysis,
        messages=[{"role": "user", "content": text}],
    )
```

## Template básico — frontend (Next.js)

```typescript
// app/page.tsx
"use client";
import { useChat } from "ai/react";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "http://localhost:8000/chat",
  });
  
  return (
    <div className="container mx-auto p-4">
      <h1>My Claude App</h1>
      <div className="messages">
        {messages.map(m => (
          <div key={m.id} className={m.role === "user" ? "user-msg" : "ai-msg"}>
            {m.content}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask anything..."
        />
        <button disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

## Hand-in deliverables

```
my-claude-app/
├── README.md              # ver template abaixo
├── docker-compose.yml
├── backend/
│   ├── main.py
│   ├── pyproject.toml
│   └── ...
├── frontend/
│   ├── app/
│   ├── package.json
│   └── ...
├── docs/
│   ├── architecture.md    # diagrama + decisões
│   ├── cost-analysis.md   # estimativa cost/user/mês
│   └── tradeoffs.md       # o que você escolheu e por quê
└── demo.mp4               # 3-5min walking through
```

## README template

```markdown
# [App name]

[1-2 frases sobre o que faz]

## Stack
- Backend: FastAPI + Anthropic SDK + Instructor
- Frontend: Next.js + Vercel AI SDK
- DB: Postgres
- LLM: Claude Sonnet 4.6

## Features
- ✅ Streaming chat (SSE)
- ✅ Prompt caching (system + docs)
- ✅ Tool use (2+ tools)
- ✅ Structured output (Instructor)
- ✅ Multimodal input (vision OR audio)
- ✅ Cost tracking dashboard

## Setup
\`\`\`bash
docker compose up
\`\`\`

## Architecture
[ASCII or mermaid diagram]

## Cost estimate (per user/month)
- 50 messages/user/month
- Cache hit rate: ~70%
- Avg input: 5k tokens (4k cached)
- Avg output: 500 tokens
- Cost: $0.50/user/month

## Trade-offs and decisions
- Why I chose [X] over [Y]
- ...

## Limitations
- ...

## Next steps
- ...
```

## Submissão via /sentinela

Submit pasta + demo video. Critérios:

- **All 6 features functioning?** Não só implementados, mas e2e working.
- **Code legível?** Sem ginga, sem hardcoded.
- **Logs estruturados?** Cost tracking funcional?
- **Cache hit rate evidenciado?** Mostre antes/depois.
- **Tool use real?** Não placeholder.
- **README profissional?** Trade-offs explícitos.

## Common pitfalls

### 1. Streaming sem cache
Implementou streaming mas esqueceu `cache_control`. Performance OK mas custo alto.

### 2. Tool use sem error handling
Tool falha, agent crash. Adicione try/except em cada tool call.

### 3. Structured output sem retries
LLM ocasionalmente erra schema. Instructor com `max_retries=3` resolve.

### 4. Cost tracking depois (não during)
Implementou usage tracking só pós-streaming. Better: log per request.

### 5. Frontend não cancela
User clica "stop" → backend continua streaming → custo. Implementar AbortController.

## Bonus features (não obrigatórias)

Se sobrar tempo:

- **Conversation persistence** — DB + retrieve.
- **Multi-doc RAG** — vector DB embedding.
- **Eval suite** — golden dataset + score on each release.
- **Multi-provider fallback** — Anthropic → OpenAI se um cai.
- **Extended thinking toggle** — UI switch para reasoning model.
- **Voice mode** — Whisper + TTS pipeline.

## Após /sentinela PASS

Abre Tier 2 (RAG & Embeddings em Produção) — onde você adiciona retrieval + reranking + evals em cima do que construiu aqui.

## Recursos

- Anthropic Cookbook: github.com/anthropics/anthropic-cookbook
- Anthropic docs: docs.anthropic.com
- Vercel AI SDK examples: github.com/vercel/ai/tree/main/examples
- Instructor docs: python.useinstructor.com
- "Building LLM Apps" by Anthropic: docs.anthropic.com/courses
