---
title: Python para AI — asyncio, Pydantic, FastAPI, uv
category: agentes-ia
stack: [Python, asyncio, Pydantic, FastAPI, uv]
tags: [python, async, pydantic, fastapi, base, 2026]
excerpt: "Stack Python moderna que apps AI rodam em 2026 — async é mandatório, Pydantic v2 para schemas, FastAPI para serving, uv para deps."
related: [ai-llm-internals-2026, ai-structured-output, ai-openai-vs-anthropic]
updated: "2026-05-10"
---

## Por que async é mandatório em AI

Apps AI são **I/O-bound**: 90% do tempo é esperando resposta de API LLM (200ms–10s) ou query a vector DB. Síncrono = uma request consome 1 thread por 10s = 10 requests/min por worker.

Async libera o thread enquanto espera I/O. Mesma máquina serve 100-1000x mais requests concorrentes. Não é otimização opcional — é prerequisito.

```python
# ❌ Síncrono — bloqueia tudo
def handle_request(query: str) -> str:
    response = anthropic_client.messages.create(...)  # bloqueia 5s
    return response.content[0].text

# ✅ Async — libera worker durante I/O
async def handle_request(query: str) -> str:
    response = await anthropic_client.messages.create(...)
    return response.content[0].text
```

## asyncio essentials

### Conceitos

- **Coroutine** (`async def`) — função suspendível. Não roda até `await`.
- **Task** — coroutine agendada no event loop.
- **Event loop** — scheduler que roda coroutines.
- **Awaitable** — coroutine, task, future. Tudo que pode ser `await`-ed.

### Patterns essenciais

```python
import asyncio
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

# 1. Sequencial — usa quando segundo precisa do primeiro
async def sequential(query: str) -> str:
    intent = await classify_intent(query)
    answer = await answer_with_intent(query, intent)
    return answer

# 2. Paralelo — usa quando independentes (3-5x speedup comum)
async def parallel(query: str) -> tuple[str, str, str]:
    summary, sentiment, entities = await asyncio.gather(
        summarize(query),
        analyze_sentiment(query),
        extract_entities(query),
    )
    return summary, sentiment, entities

# 3. Paralelo com timeout
async def parallel_with_timeout(query: str) -> dict:
    try:
        async with asyncio.timeout(10):  # Python 3.11+
            results = await asyncio.gather(*tasks)
    except TimeoutError:
        return {"error": "timeout"}
    return {"results": results}

# 4. Batching com limit (semaphore evita rate limit)
async def batch_with_limit(items: list, concurrency: int = 5):
    sem = asyncio.Semaphore(concurrency)
    async def with_sem(item):
        async with sem:
            return await process(item)
    return await asyncio.gather(*[with_sem(i) for i in items])

# 5. Streaming
async def stream_response(query: str):
    async with client.messages.stream(...) as stream:
        async for text in stream.text_stream:
            yield text
```

### Erros comuns

```python
# ❌ Misturar sync e async — bloqueia event loop
async def bad():
    response = requests.get("https://api.example.com")  # bloqueia tudo
    return response.json()

# ✅ Use httpx (async HTTP client)
import httpx
async def good():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com")
        return response.json()

# ❌ asyncio.run() dentro de event loop existente — RuntimeError
async def handler():
    result = asyncio.run(other_coro())  # erro

# ✅ Use await direto
async def handler():
    result = await other_coro()

# ❌ Esquecer await — coroutine vira warning, não roda
async def handler():
    other_coro()  # não rodou!

# ✅
async def handler():
    await other_coro()
```

## Pydantic v2 — schemas e validação

Pydantic v2 (Rust-backed, 5-50x mais rápido que v1) é padrão de facto pra:
- Validação de input/output.
- Schemas pra tool use / structured output.
- API serialization (FastAPI usa Pydantic).
- Settings management.

```python
from pydantic import BaseModel, Field, EmailStr
from typing import Literal

# Schema básico
class UserQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    user_id: str
    intent: Literal["question", "command", "chat"] | None = None
    context: dict = Field(default_factory=dict)

# Uso
try:
    data = UserQuery(**raw_json)
except ValidationError as e:
    return {"error": e.errors()}

# Schema aninhado
class Citation(BaseModel):
    source: str
    page: int = Field(ge=1)
    excerpt: str

class Answer(BaseModel):
    text: str
    citations: list[Citation]
    confidence: float = Field(ge=0, le=1)

# JSON schema para LLM (Anthropic tool use)
schema = Answer.model_json_schema()
```

### Pydantic + Anthropic Tool Use

```python
from anthropic import Anthropic

client = Anthropic()

class WeatherQuery(BaseModel):
    location: str
    unit: Literal["celsius", "fahrenheit"] = "celsius"

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=[{
        "name": "get_weather",
        "description": "Get current weather",
        "input_schema": WeatherQuery.model_json_schema(),
    }],
    messages=[{"role": "user", "content": "Weather in Paris?"}]
)

# Parse tool input back to Pydantic
for block in response.content:
    if block.type == "tool_use":
        args = WeatherQuery.model_validate(block.input)
        result = await get_weather(args.location, args.unit)
```

## FastAPI — serving AI apps

FastAPI é o backend padrão pra app AI Python:
- Async-native.
- Pydantic integration nativa.
- OpenAPI docs auto-gerados.
- Production-ready (Uvicorn/Gunicorn).

```python
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from anthropic import AsyncAnthropic

app = FastAPI()
client = AsyncAnthropic()

class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None

class ChatResponse(BaseModel):
    response: str
    usage: dict

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        msg = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": req.message}],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    
    return ChatResponse(
        response=msg.content[0].text,
        usage={"input_tokens": msg.usage.input_tokens, "output_tokens": msg.usage.output_tokens},
    )

# Streaming endpoint
@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    async def generate():
        async with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": req.message}],
        ) as stream:
            async for text in stream.text_stream:
                yield f"data: {text}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### Production setup

```bash
# Dev
uvicorn main:app --reload

# Prod (4 workers async, behind nginx/cloudflare)
uvicorn main:app --workers 4 --host 0.0.0.0 --port 8000

# Mais robusto: gunicorn com uvicorn workers
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## uv — dependency management 2026

`uv` (Astral, criadores do Ruff) substitui pip + venv + poetry. 10-100x mais rápido, dois comandos cobrem 95% do uso:

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Inicia projeto
uv init my-ai-app
cd my-ai-app

# Adiciona deps
uv add anthropic openai fastapi uvicorn pydantic

# Adiciona dev deps
uv add --dev pytest ruff mypy

# Run com env do projeto
uv run python main.py
uv run pytest

# Install Python específico
uv python install 3.12

# Lockfile mantido automaticamente (uv.lock)
```

`pyproject.toml` resultante é padrão moderno — funciona com pip, poetry, hatch também.

## Type hints sérios

```python
# Use type hints sempre. Mypy/pyright catch bugs antes de prod.
from typing import Literal, TypedDict

# TypedDict pra dicts conhecidos
class Message(TypedDict):
    role: Literal["user", "assistant", "system"]
    content: str

# Generic functions
from typing import TypeVar
T = TypeVar("T", bound=BaseModel)

async def parse_llm_output(text: str, schema: type[T]) -> T:
    """Parse JSON string into Pydantic model."""
    import json
    data = json.loads(text)
    return schema.model_validate(data)

# Uso com type inference
result: UserQuery = await parse_llm_output(llm_text, UserQuery)
```

Configurar pyright em `pyproject.toml`:
```toml
[tool.pyright]
typeCheckingMode = "strict"
pythonVersion = "3.12"
```

## Settings management

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str
    openai_api_key: str
    database_url: str
    redis_url: str = "redis://localhost:6379"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    
    model_config = {"env_file": ".env"}

settings = Settings()  # carrega de .env + env vars
```

## Testing async code

```python
import pytest
from httpx import AsyncClient, ASGITransport
from main import app

@pytest.mark.asyncio
async def test_chat_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/chat", json={"message": "hello"})
    
    assert response.status_code == 200
    assert "response" in response.json()

# Mock LLM client (não chame APIs reais em tests)
from unittest.mock import AsyncMock, patch

@patch("main.client.messages.create", new_callable=AsyncMock)
async def test_chat_mock_llm(mock_create):
    mock_create.return_value.content = [type("Block", (), {"text": "Hi"})()]
    # ... rest
```

## Logging estruturado

```python
import structlog

log = structlog.get_logger()

async def chat(req: ChatRequest):
    log.info("chat_request", user_id=req.user_id, msg_length=len(req.message))
    try:
        response = await call_llm(req)
        log.info("chat_response", tokens=response.usage.total_tokens, latency_ms=...)
    except Exception as e:
        log.error("chat_failed", error=str(e), user_id=req.user_id)
        raise
```

JSON logs são parseable por Datadog, Honeycomb, Grafana Loki.

## Checklist — Python AI app production-ready

- [ ] async/await everywhere (no `requests`, use `httpx`)
- [ ] Pydantic v2 para todos os schemas de input/output
- [ ] Type hints com mypy/pyright strict
- [ ] Settings em `BaseSettings`, não constantes hardcoded
- [ ] uv como package manager (não pip/poetry)
- [ ] FastAPI com OpenAPI docs
- [ ] Structured logging (structlog)
- [ ] Tests async com pytest-asyncio
- [ ] Dockerfile multi-stage com Python slim
- [ ] Healthcheck endpoint (`/health`)
- [ ] Graceful shutdown (handlers SIGTERM)

## Leituras

- "Async Python" — Real Python guides
- Pydantic v2 docs (docs.pydantic.dev)
- FastAPI docs (fastapi.tiangolo.com)
- uv docs (docs.astral.sh/uv)
- "Fluent Python" 2ª ed. — Luciano Ramalho (cap async)
- httpx docs (python-httpx.org)
