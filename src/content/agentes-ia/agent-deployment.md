---
title: "Deploy de Agentes em Produção"
category: agentes-ia
stack: [Python, TypeScript, Docker, LangGraph, Railway, Fly.io]
tags: [deployment, agents, stateful, stateless, serverless]
excerpt: "Deploy de agentes tem requisitos diferentes de APIs REST — estado persistido, streaming, e execução longa mudam tudo na escolha de infraestrutura."
related: [langgraph-fundamentos, agent-observabilidade-producao, human-in-the-loop]
updated: 2026-04
---

## O que é

Deploy de agentes tem características que quebram os padrões de infra tradicionais para APIs:

**Execução longa:** uma chamada a um agente pode durar 30 segundos a vários minutos (com HITL, possivelmente horas ou dias). Serverless com timeout de 30s não funciona.

**Estado:** agentes stateful precisam que o estado seja persistido entre requests (checkpoints do LangGraph). Serverless stateless não tem onde armazenar isso entre invocações.

**Streaming:** respostas precisam ser enviadas token a token. Serverless functions em algumas plataformas não suportam streaming de forma nativa.

**Decisão arquitetural central: stateless vs stateful**

- **Stateless agents:** cada invocação é independente, sem memória entre chamadas. Funciona em serverless. Adequado para tarefas single-turn (classifique este email, extraia dados deste documento).
- **Stateful agents:** mantém contexto de conversa e estado de execução entre múltiplos turnos. Precisa de servidor persistente com banco de dados para checkpointer.

**Opções de deploy:**

- **Vercel/Cloudflare Workers (serverless):** apenas para stateless, execução < 30s. Bom para agentes simples que processam uma mensagem e retornam.
- **Railway/Fly.io (serverful):** suporta execução longa, websockets, estado persistido. O padrão para agentes LangGraph com checkpointer Postgres.
- **LangGraph Cloud:** deploy gerenciado de grafos LangGraph. Sem ops, com API padronizada. Bom se você já usa o stack LangGraph pesado.
- **Docker + qualquer VPS:** máximo controle, requer mais ops. Use quando você tem requisitos específicos de compliance ou infraestrutura.

**O "agent as API" pattern:** expor o agente como uma API REST simples — POST para iniciar, GET para status, POST para responder a interrupts. O cliente faz polling ou usa SSE para receber updates.

## Quando usar cada opção

- **Serverless:** agentes simples, single-turn, sem estado, latência < 25s, alto volume com escala automática desejada
- **Railway/Fly.io:** agentes com estado, execução longa, streaming, quando você quer simplicidade operacional sem server próprio
- **LangGraph Cloud:** quando você usa LangGraph pesado e quer zero ops, está OK com vendor lock-in
- **Docker self-hosted:** compliance, dados que não podem sair da sua infra, controle total

## Quando NÃO usar

- Serverless para agentes com HITL (o estado fica em limbo quando o timeout ocorre)
- LangGraph Cloud sem avaliar o lock-in e o custo a escala
- Kubernetes para começar — você não precisa disso nos primeiros 6 meses

## Como pedir pra IA

> "Cria a infraestrutura de deploy para um agente LangGraph stateful em Railway. Preciso de: (1) Dockerfile otimizado para Python com LangGraph, (2) API FastAPI com endpoint POST /chat (iniciar/continuar), GET /chat/{thread_id}/status, POST /chat/{thread_id}/approve (para HITL), (3) streaming via SSE, (4) PostgresSaver como checkpointer, (5) variáveis de ambiente necessárias. O agente usa Claude Sonnet e tem HITL para ações financeiras."

## Como auditar o que a IA gerou

- [ ] Verificar se o checkpointer é PostgresSaver (não MemorySaver) em produção
- [ ] Confirmar que streaming usa SSE ou WebSocket (não polling)
- [ ] Verificar se há graceful shutdown (espera requests em andamento terminarem)
- [ ] Checar se DATABASE_URL e ANTHROPIC_API_KEY são lidos de variáveis de ambiente (não hardcoded)
- [ ] Confirmar que há health check endpoint para o orquestrador de containers
- [ ] Verificar se o Dockerfile usa multi-stage build para imagem menor
- [ ] Checar se há limite de memória configurado (agentes podem consumir muita RAM com histórico longo)

## Armadilhas comuns

- **MemorySaver em produção** — cada restart do servidor perde todo o estado. Nunca use MemorySaver fora de desenvolvimento
- **Serverless para agentes com HITL** — o estado fica suspenso em memória que desaparece quando a função escala para zero
- **Sem timeout no agente** — sem um limite de tempo total, um agente preso em loop consome recursos indefinidamente
- **Streaming sem backpressure** — se o cliente desconectar no meio do streaming, o agente deve parar de executar

## Exemplo prático

```python
# app.py — FastAPI + LangGraph + SSE
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langchain_core.messages import HumanMessage
import asyncio
import json
import os

# Inicialização da aplicação com lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    checkpointer = await AsyncPostgresSaver.from_conn_string(
        os.environ["DATABASE_URL"]
    )
    await checkpointer.setup()
    app.state.checkpointer = checkpointer
    
    # Import do grafo (importar aqui para evitar import circular)
    from grafo import criar_grafo
    app.state.grafo = criar_grafo().compile(checkpointer=checkpointer)
    
    yield
    
    # Shutdown graceful
    # ... cleanup

app = FastAPI(lifespan=lifespan)

@app.post("/chat")
async def iniciar_chat(mensagem: str, user_id: str, thread_id: str):
    """Inicia ou continua uma conversa."""
    config = {"configurable": {"thread_id": thread_id, "user_id": user_id}}
    
    try:
        resultado = await app.state.grafo.ainvoke(
            {"messages": [HumanMessage(content=mensagem)]},
            config=config,
        )
        
        # Verifica se está aguardando aprovação humana
        state = await app.state.grafo.aget_state(config)
        
        if state.next:  # Há nós pendentes
            interrupt_data = None
            if state.tasks:
                for task in state.tasks:
                    if task.interrupts:
                        interrupt_data = task.interrupts[0].value
                        break
            
            return {
                "status": "aguardando_aprovacao",
                "thread_id": thread_id,
                "dados_para_aprovacao": interrupt_data,
            }
        
        return {
            "status": "concluido",
            "thread_id": thread_id,
            "resposta": resultado["messages"][-1].content,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/{thread_id}/aprovar")
async def aprovar_acao(thread_id: str, decisao: str, feedback: str = ""):
    """Retoma execução após aprovação/rejeição humana."""
    from langgraph.types import Command
    
    config = {"configurable": {"thread_id": thread_id}}
    
    resultado = await app.state.grafo.ainvoke(
        Command(resume={"decisao": decisao, "feedback": feedback}),
        config=config,
    )
    
    return {
        "status": "concluido",
        "resposta": resultado["messages"][-1].content,
    }

@app.get("/chat/{thread_id}/stream")
async def stream_chat(thread_id: str, mensagem: str):
    """Streaming via SSE."""
    config = {"configurable": {"thread_id": thread_id}}
    
    async def event_generator():
        async for event in app.state.grafo.astream_events(
            {"messages": [HumanMessage(content=mensagem)]},
            config=config,
            version="v2",
        ):
            if event["event"] == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content:
                    yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"
            elif event["event"] == "on_tool_start":
                yield f"data: {json.dumps({'type': 'tool_start', 'name': event['name']})}\n\n"
            elif event["event"] == "on_tool_end":
                yield f"data: {json.dumps({'type': 'tool_end', 'name': event['name']})}\n\n"
        
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )

@app.get("/health")
async def health():
    return {"status": "ok"}
```

```dockerfile
# Dockerfile otimizado
FROM python:3.12-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH

# Nunca rode como root em produção
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```
