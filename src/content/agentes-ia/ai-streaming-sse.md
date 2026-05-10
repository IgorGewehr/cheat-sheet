---
title: Streaming & SSE — Async Iteration, Partial JSON, Cancelamento
category: agentes-ia
stack: [SSE, async, streaming, FastAPI, Next.js]
tags: [streaming, sse, async, partial-json, cancellation]
excerpt: "Server-Sent Events para apps LLM — async iteration, partial JSON parsing, cancelamento, server + client patterns para streaming production-grade."
related: [ai-py-async, ai-openai-vs-anthropic, ai-latency-budgets]
updated: "2026-05-10"
---

## Por que streaming é mandatório em LLM

Sem streaming, user vê "thinking..." por 5-30s antes da resposta. UX horrível.

Com streaming, **TTFT** (Time To First Token) tipicamente <1s, e tokens chegam em ~50-100ms cada. User percebe app como "responsivo" mesmo se total demora 30s.

Em 2026, streaming não é nice-to-have — é tabela mínima pra LLM apps.

## SSE — Server-Sent Events

Protocolo HTTP padrão pra server push. Diferente de WebSocket:
- **SSE**: unidirecional server → client. Auto-reconnect. HTTP/1.1+.
- **WebSocket**: bidirecional. Mais complexo. Para chat real-time multi-user.

Para LLM streaming, SSE é melhor — exatamente o use case.

### SSE format

```
data: {"text": "Hello"}

data: {"text": " world"}

data: {"text": "!"}

data: [DONE]

```

(Cada message: `data: <content>\n\n`. Blank line termina event.)

## Streaming com Anthropic SDK

### Python — async iteration

```python
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

async def stream_response(query: str):
    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": query}],
    ) as stream:
        # Text-only stream
        async for text in stream.text_stream:
            print(text, end="", flush=True)
        
        # Get final message after stream completes
        final = await stream.get_final_message()
        print(f"\nUsage: {final.usage}")
```

### Event-level streaming (para tool use, thinking, etc.)

```python
async with client.messages.stream(...) as stream:
    async for event in stream:
        if event.type == "message_start":
            # message metadata
            pass
        elif event.type == "content_block_start":
            block = event.content_block
            if block.type == "text":
                # Text response começou
                pass
            elif block.type == "tool_use":
                # Tool call detectado
                tool_name = block.name
                tool_id = block.id
            elif block.type == "thinking":
                # Extended thinking (Claude reasoning)
                pass
        elif event.type == "content_block_delta":
            delta = event.delta
            if delta.type == "text_delta":
                # New text chunk
                yield delta.text
            elif delta.type == "input_json_delta":
                # Tool input being built incrementally
                yield {"tool_partial": delta.partial_json}
            elif delta.type == "thinking_delta":
                yield {"thinking": delta.thinking}
        elif event.type == "content_block_stop":
            # Block completed
            pass
        elif event.type == "message_delta":
            # Top-level message updates (stop_reason, usage)
            pass
        elif event.type == "message_stop":
            # Stream ended
            pass
```

## Streaming com OpenAI SDK

```python
from openai import AsyncOpenAI

client = AsyncOpenAI()

async def stream_response(query: str):
    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": query}],
        stream=True,
        stream_options={"include_usage": True},
    )
    
    async for chunk in stream:
        # Empty chunk pode ser keepalive
        if not chunk.choices:
            # Último chunk com usage
            if chunk.usage:
                print(f"\nUsage: {chunk.usage}")
            continue
        
        delta = chunk.choices[0].delta
        
        if delta.content:
            yield delta.content
        
        if delta.tool_calls:
            # Tool call sendo construído incrementalmente
            for tc in delta.tool_calls:
                if tc.function:
                    yield {"tool_partial": tc.function.arguments}
```

## Server: FastAPI + SSE

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

app = FastAPI()
client = AsyncAnthropic()

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(req: ChatRequest):
    async def generate():
        try:
            async with client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                messages=[{"role": "user", "content": req.message}],
            ) as stream:
                async for text in stream.text_stream:
                    # SSE format: data: <content>\n\n
                    yield f"data: {json.dumps({'text': text})}\n\n"
                
                final = await stream.get_final_message()
                yield f"data: {json.dumps({'usage': final.usage.model_dump()})}\n\n"
        
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
```

## Client: Next.js + Vercel AI SDK

```typescript
// app/chat/page.tsx
"use client";

import { useChat } from "ai/react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    api: "/api/chat",
  });
  
  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}
      
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>Send</button>
        {isLoading && <button type="button" onClick={stop}>Stop</button>}
      </form>
    </div>
  );
}
```

```typescript
// app/api/chat/route.ts
import { Anthropic } from "@anthropic-ai/sdk";
import { AnthropicStream, StreamingTextResponse } from "ai";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    stream: true,
    messages,
  });
  
  const stream = AnthropicStream(response);
  return new StreamingTextResponse(stream);
}
```

## Client: vanilla EventSource (sem framework)

```typescript
async function streamChat(message: string, onChunk: (text: string) => void) {
  const response = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    // Parse SSE events (delimited by \n\n)
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";  // last partial event stays in buffer
    
    for (const event of events) {
      const lines = event.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) onChunk(parsed.text);
          } catch {
            // Malformed JSON — log e continua
          }
        }
      }
    }
  }
}
```

## Partial JSON parsing

Quando LLM retorna structured output via streaming, JSON está incomplete em chunks intermediários. Você precisa **parse incremental**:

```python
# Bibliotecas que ajudam:
# - partial-json (npm, Vercel AI SDK)
# - json-stream (Python)
# - Anthropic SDK já trata em input_json_delta

# Pattern manual:
def try_parse_partial(buffer: str) -> dict | None:
    """Tenta parser JSON incompleto."""
    # Fechar brackets/quotes não-fechados
    fixed = buffer
    # Heurística simples: contar { vs }, [ vs ], etc
    open_braces = fixed.count("{") - fixed.count("}")
    fixed += "}" * open_braces
    
    try:
        return json.loads(fixed)
    except:
        return None
```

### Real pattern — Anthropic streaming tool input

```python
async def stream_tool_call(query: str):
    accumulated_input = ""
    
    async with client.messages.stream(...) as stream:
        async for event in stream:
            if event.type == "content_block_delta":
                if event.delta.type == "input_json_delta":
                    accumulated_input += event.delta.partial_json
                    
                    # Try parse para preview UI
                    from json_repair import repair_json
                    try:
                        partial = json.loads(repair_json(accumulated_input))
                        yield {"partial_args": partial}
                    except:
                        pass
            
            elif event.type == "content_block_stop":
                # Tool input completo
                final_args = json.loads(accumulated_input)
                result = await call_tool(final_args)
                yield {"tool_result": result}
```

UX: user vê "calling get_weather(city='Paris'..." sendo construído, não 2s de silêncio.

## Cancelamento

User clica "Stop". Você precisa abortar request + cleanup.

### Server-side cancellation (Anthropic Python)

```python
import asyncio

@app.post("/chat")
async def chat(req: ChatRequest):
    cancel_event = asyncio.Event()
    
    async def generate():
        try:
            async with client.messages.stream(...) as stream:
                async for text in stream.text_stream:
                    if cancel_event.is_set():
                        break
                    yield f"data: {json.dumps({'text': text})}\n\n"
        except asyncio.CancelledError:
            # Cliente desconectou
            pass
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

FastAPI cancela `generate()` automaticamente se client desconecta. Anthropic SDK aborta request HTTP underlying.

### Client-side cancellation

```typescript
const controller = new AbortController();

const response = await fetch("/chat", {
  method: "POST",
  signal: controller.signal,
  // ...
});

// Em algum lugar (stop button):
controller.abort();
```

Server vê client disconnect, cancela streaming.

## Backpressure

Cliente lento (mobile, slow network) pode atrasar consumir chunks. Server precisa pausar generation até client catch up.

Em FastAPI/asyncio, isso é automático — `yield` bloqueia se downstream não consumiu. Mas com nginx ou load balancer no meio, buffer interno pode mascarar isso.

```python
# Garante backpressure
headers = {
    "X-Accel-Buffering": "no",  # nginx
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
}
```

## Error handling em streaming

Erros podem ocorrer **durante** stream (não só no início).

```python
async def generate():
    try:
        async with client.messages.stream(...) as stream:
            async for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
    except anthropic.APIError as e:
        # Erro durante streaming
        yield f"data: {json.dumps({'error': str(e), 'recoverable': True})}\n\n"
    except Exception as e:
        log.exception("stream_error")
        yield f"data: {json.dumps({'error': 'Internal error', 'recoverable': False})}\n\n"
    finally:
        yield "data: [DONE]\n\n"
```

Client:
```typescript
for await (const event of stream) {
  if (event.error) {
    showError(event.error);
    if (!event.recoverable) break;
  } else if (event.text) {
    appendToUI(event.text);
  }
}
```

## Tokens em streaming — counting

Total tokens só conhecido no final do stream. Para usage tracking:

```python
final = await stream.get_final_message()
log_usage(final.usage)
```

OpenAI: usage no último chunk se `stream_options.include_usage=True`.

## UX patterns avançados

### 1. "Typing indicator" antes do primeiro token

```typescript
const [status, setStatus] = useState<"idle" | "thinking" | "responding">("idle");

onSubmit = async () => {
  setStatus("thinking");
  const stream = await fetch("/chat", {...});
  
  // Loop chunks
  for await (const chunk of stream) {
    if (status === "thinking") setStatus("responding");
    appendText(chunk.text);
  }
  
  setStatus("idle");
};

return (
  <div>
    {status === "thinking" && <Spinner />}
    <div className={status === "responding" ? "typing" : ""}>
      {responseText}
    </div>
  </div>
);
```

### 2. Estimated cost during stream

```typescript
let accumulatedTokens = 0;
const TOKEN_COST = 0.000015;  // $15/1M output

for await (const chunk of stream) {
  accumulatedTokens += chunk.text.split(/\s+/).length * 1.3;  // approx
  showEstimatedCost(accumulatedTokens * TOKEN_COST);
}
```

### 3. Auto-scroll smart

```typescript
// Scroll to bottom só se usuário não scrollou up manualmente
const [autoScroll, setAutoScroll] = useState(true);

onScroll = (e) => {
  const atBottom = e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 50;
  setAutoScroll(atBottom);
};

useEffect(() => {
  if (autoScroll) scrollToBottom();
}, [responseText, autoScroll]);
```

## Resilience — auto-retry com SSE

```typescript
async function streamWithRetry(message: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await streamChat(message, onChunk);
      return;
    } catch (e) {
      if (e.name === "AbortError") throw e;  // user cancelou
      if (attempt < maxRetries - 1) {
        await sleep(2 ** attempt * 1000);  // exponential backoff
        continue;
      }
      throw e;
    }
  }
}
```

## Vercel AI SDK — helpers

```typescript
// streamUI — render React components durante stream
import { streamUI } from "ai/rsc";

const result = await streamUI({
  model: anthropic("claude-sonnet-4-6"),
  messages: [...],
  tools: {
    getWeather: {
      description: "...",
      parameters: z.object({ city: z.string() }),
      generate: async function* ({ city }) {
        yield <LoadingWeatherCard />;
        const weather = await fetchWeather(city);
        return <WeatherCard data={weather} />;
      },
    },
  },
});
```

Permite UI components streamados during tool calls. Próximo nível de UX.

## Checklist — streaming production

- [ ] Streaming habilitado em todos os endpoints chat?
- [ ] TTFT medido e otimizado (<1s target)?
- [ ] Buffer disable (`X-Accel-Buffering: no`)?
- [ ] Cancel button funcional (server cancela request)?
- [ ] Error handling durante stream (recovery vs abort)?
- [ ] Usage tracking no final do stream?
- [ ] Auto-scroll smart (respeita user scroll)?
- [ ] Typing indicator antes do primeiro token?
- [ ] Partial JSON parsing pra tool calls progressivos?
- [ ] Tests com slow client (backpressure)?

## Leituras

- Anthropic streaming docs (docs.anthropic.com)
- OpenAI streaming guide (platform.openai.com/docs/api-reference/streaming)
- Vercel AI SDK docs (sdk.vercel.ai)
- MDN: Server-Sent Events
- FastAPI streaming responses (fastapi.tiangolo.com/advanced/custom-response)
- "Building chat with streaming" — Vercel guide
- json-repair / partial-json libs
