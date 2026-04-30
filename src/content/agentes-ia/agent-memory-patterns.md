---
title: "Memória de Agentes — Padrões"
category: agentes-ia
stack: [Python, TypeScript, LangGraph, PostgreSQL, Redis]
tags: [memory, agents, short-term, long-term, episodic]
excerpt: "Agentes sem memória recomeçam do zero a cada conversa — os 4 tipos de memória e quando usar cada um para criar agentes que realmente aprendem com o contexto."
related: [langgraph-fundamentos, langgraph-patterns, human-in-the-loop]
updated: 2026-04
---

## O que é

Memória em agentes é diferente de memória humana — não existe persistência automática. Cada LLM call é stateless. "Memória" é qualquer mecanismo pelo qual informação de interações passadas influencia interações futuras. Existem quatro categorias:

**1. In-context (short-term):** o histórico de mensagens que você inclui no prompt. É o mais simples e o mais imediato. O limite é o context window — você não pode incluir conversas infinitas. Estratégias de gestão: sliding window (mantém últimas N mensagens), summarization (sumariza mensagens antigas), trimming (corta mensagens mais antigas por token count).

**2. External/long-term:** informações persistidas fora do modelo (banco de dados, Redis, vetores) e recuperadas quando relevante. Permite "memória" além do context window e persiste entre sessões. Implementado em LangGraph via `Memory Store`.

**3. Episodic:** memórias de conversas passadas completas, não apenas fatos isolados. O agente "lembra" que semana passada você pediu um relatório mensal e o formato que você prefere. Tipicamente sumarizações de conversas armazenadas com embeddings para retrieval semântico.

**4. Semantic/Procedural:** fatos sobre o usuário/domínio (semantic) ou instruções/preferências aprendidas (procedural). "João prefere respostas curtas", "este tenant usa CNPJ no formato XX.XXX.XXX/XXXX-XX". São atualizados pelo agente com base em feedback explícito ou observações implícitas.

**LangGraph Memory Store** (a partir de LangGraph 0.2) fornece uma interface unificada para memória externa: `store.put(namespace, key, value)` e `store.search(namespace, query)` com suporte a busca semântica.

## Quando usar

- **Sliding window:** conversas longas onde o contexto recente importa mais que o histórico distante
- **Summarization:** quando você precisa de contexto completo mas o histórico excede o context window
- **External memory:** agentes que precisam lembrar de preferências e fatos entre sessões diferentes
- **Episodic:** assistentes pessoais, suporte ao cliente onde continuidade entre sessões cria valor
- **Semantic:** qualquer agente que personaliza comportamento por usuário/tenant

## Quando NÃO usar

- Memória externa para conversas de sessão única sem continuidade — overhead desnecessário
- Summarization automática sem threshold — você paga por LLM calls extras para sumarizar mensagens que poderiam simplesmente ser descartadas
- Persistent memory sem mecanismo de expiração/limpeza — cresce indefinidamente e envelhecida informação confunde o modelo

## Como pedir pra IA

> "Implementa um sistema de memória de agente em LangGraph com: (1) sliding window de 20 mensagens com summarização automática quando o histórico fica grande demais, (2) memória semântica para guardar fatos sobre o usuário (ex: nome, preferências, contexto de trabalho) usando o Memory Store do LangGraph, (3) recuperação de memórias relevantes no início de cada turno via busca semântica, (4) mecanismo para o agente atualizar a memória explicitamente via tool. Usa PostgreSQL para persistência."

## Como auditar o que a IA gerou

- [ ] Verificar se sliding window tem lógica de contagem por tokens (não por número de mensagens)
- [ ] Confirmar que summarization preserva informações críticas (datas, valores, decisões tomadas)
- [ ] Verificar se memória externa tem namespace por usuário/tenant (não uma memória global)
- [ ] Checar se há mecanismo de expiração para memórias antigas (TTL ou cleanup job)
- [ ] Confirmar que o agente distingue entre "fato confirmado" e "suposição" na memória
- [ ] Verificar se privacy/PII são tratados na memória (não persiste dados sensíveis sem necessidade)

## Armadilhas comuns

- **Acumular tudo na memória** — sem critério de relevância, a memória fica cheia de ruído e o retrieval piora
- **Memória de sessão vs memória persistente confundidas** — defina claramente o que expira com a sessão e o que persiste
- **Não versionar memórias** — se o usuário atualiza uma preferência, você precisa sobrescrever a antiga, não acumular versões conflitantes
- **PII em embeddings** — se você embeda conversas contendo PII para busca semântica, considere as implicações de LGPD

## Exemplo prático

```python
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.store.memory import InMemoryStore  # Em prod: use PostgresStore
from langgraph.checkpoint.memory import MemorySaver
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, trim_messages
from langchain_openai import OpenAIEmbeddings
from typing import Annotated, TypedDict
import json

# Setup
llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Memory Store com busca semântica
store = InMemoryStore(
    index={"embed": embeddings.embed_documents, "dims": 1536}
)

class State(TypedDict):
    messages: Annotated[list, add_messages]
    user_id: str

def recuperar_memorias(state: State, *, store) -> dict:
    """Nó que recupera memórias relevantes antes de processar."""
    user_id = state["user_id"]
    ultima_mensagem = state["messages"][-1].content if state["messages"] else ""
    
    # Busca memórias semanticamente relevantes para a última mensagem
    memorias = store.search(
        namespace=("memories", user_id),
        query=ultima_mensagem,
        limit=5,
    )
    
    # Busca fatos do usuário
    fatos = store.get(namespace=("user_facts", user_id), key="profile")
    
    contexto_memoria = ""
    if memorias:
        contexto_memoria += "\n\nMemórias relevantes de conversas anteriores:\n"
        for m in memorias:
            contexto_memoria += f"- {m.value['content']}\n"
    
    if fatos:
        contexto_memoria += f"\n\nPerfil do usuário: {json.dumps(fatos.value, ensure_ascii=False)}"
    
    # Injeta memórias como SystemMessage temporária
    if contexto_memoria:
        return {"messages": [SystemMessage(content=f"[CONTEXTO DE MEMÓRIA]{contexto_memoria}")]}
    return {}

def agente(state: State, *, store) -> dict:
    """Nó principal do agente com acesso às tools de memória."""
    
    # Trimming: mantém últimas 20 mensagens (por tokens)
    mensagens_trimadas = trim_messages(
        state["messages"],
        max_tokens=4000,
        strategy="last",
        token_counter=llm,
        include_system=True,
    )
    
    system = SystemMessage(content="""Você é um assistente pessoal com memória.
    
Quando o usuário compartilhar informações importantes sobre si mesmo (nome, cargo, preferências, projetos), 
use a tool 'salvar_fato_usuario' para persistir esse conhecimento.

Seja natural — não diga explicitamente que está salvando memórias.""")
    
    response = llm.bind_tools([
        {
            "name": "salvar_fato_usuario",
            "description": "Salva um fato importante sobre o usuário para lembrar em futuras conversas",
            "input_schema": {
                "type": "object",
                "properties": {
                    "chave": {"type": "string", "description": "Identificador do fato (ex: 'cargo', 'projeto_atual', 'preferencia_relatorio')"},
                    "valor": {"type": "string", "description": "O valor do fato"},
                },
                "required": ["chave", "valor"],
            },
        }
    ]).invoke([system] + mensagens_trimadas)
    
    # Processa tool calls de memória
    if response.tool_calls:
        user_id = state["user_id"]
        perfil_atual = (store.get(namespace=("user_facts", user_id), key="profile") or 
                       type('Obj', (), {'value': {}})()).value
        
        for tool_call in response.tool_calls:
            if tool_call["name"] == "salvar_fato_usuario":
                perfil_atual[tool_call["args"]["chave"]] = tool_call["args"]["valor"]
        
        store.put(namespace=("user_facts", user_id), key="profile", value=perfil_atual)
    
    return {"messages": [response]}

def salvar_memoria_episodica(state: State, *, store) -> dict:
    """Após a conversa, salva um resumo como memória episódica."""
    user_id = state["user_id"]
    mensagens = state["messages"]
    
    if len(mensagens) < 4:  # Não salva conversas muito curtas
        return {}
    
    # Sumariza a conversa
    resumo_response = llm.invoke(
        f"Resumo desta conversa em 2 frases, focando em decisões, informações importantes e ações tomadas:\n\n"
        + "\n".join(f"{m.type}: {m.content[:200]}" for m in mensagens[-6:])
    )
    
    store.put(
        namespace=("memories", user_id),
        key=f"episode_{len(mensagens)}",
        value={"content": resumo_response.content, "timestamp": "2026-04-29"},
    )
    return {}

# Grafo
grafo = StateGraph(State)
grafo.add_node("recuperar_memorias", recuperar_memorias)
grafo.add_node("agente", agente)
grafo.add_node("salvar_memoria", salvar_memoria_episodica)

grafo.add_edge(START, "recuperar_memorias")
grafo.add_edge("recuperar_memorias", "agente")
grafo.add_edge("agente", "salvar_memoria")
grafo.add_edge("salvar_memoria", END)

app = grafo.compile(
    checkpointer=MemorySaver(),
    store=store,
)

# Uso
config = {"configurable": {"thread_id": "t1"}}
result = app.invoke(
    {"messages": [HumanMessage("Oi! Sou o Igor, trabalho com ERP em TypeScript")], "user_id": "igor-123"},
    config=config,
)
```
