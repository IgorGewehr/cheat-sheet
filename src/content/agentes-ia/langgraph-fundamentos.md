---
title: "LangGraph — Fundamentos"
category: agentes-ia
stack: [Python, TypeScript, LangGraph, LangChain]
tags: [langgraph, graph, state, nodes, edges]
excerpt: "LangGraph substitui AgentExecutor com grafos de estado explícitos — você controla cada passo do agente em vez de depender de uma caixa preta."
related: [langgraph-patterns, langchain-agents, human-in-the-loop]
updated: 2026-04
---

## O que é

LangGraph é um framework para construir agentes e fluxos multi-step como grafos de estado dirigidos. Cada **nó** é uma função Python/TypeScript que transforma o estado. **Edges** (arestas) conectam nós — podem ser fixas ou condicionais (o próximo nó depende do estado atual). O **estado** é um TypedDict que persiste ao longo de toda a execução e é passado para cada nó.

**Por que existe:** o AgentExecutor tinha um loop de execução fixo e opaco. Para qualquer necessidade não-padrão (HITL, retry de erro específico, branching complexo, subagentes) você precisava hackear a classe. LangGraph torna o fluxo de controle explícito — você vê o grafo, você controla o grafo.

**Conceitos core:**
- `StateGraph`: o grafo que você define
- `State` (TypedDict): o estado compartilhado entre nós
- `node`: função `(state) -> dict` que retorna updates parciais no estado
- `edge`: conexão entre nós (fixa ou condicional)
- `checkpointer`: persiste o estado para suportar conversas multi-turn e HITL
- `compile()`: compila o grafo em um `CompiledGraph` invocável

**Reducer functions** definem como o estado é atualizado. Por padrão, cada campo é sobrescrito. Para listas (como histórico de mensagens), você usa `Annotated[list, add_messages]` que ADICIONA ao invés de sobrescrever — crítico para não apagar o histórico.

**Persistência:** o `checkpointer` salva o estado após cada nó. `MemorySaver` é para desenvolvimento. Em produção, use `AsyncPostgresSaver` ou `SqliteSaver`. Com persistência, você pode pausar a execução (HITL), retomar depois, e ter conversas multi-turn sem reenviar todo o histórico.

## Quando usar

- Quando o fluxo do agente tem bifurcações baseadas em condições
- Quando você precisa de HITL (pausar e esperar aprovação humana)
- Quando o agente tem múltiplos loops ou fases distintas
- Quando você precisa de estado persistido entre turnos de conversa
- Quando substituindo AgentExecutor em qualquer contexto novo

## Quando NÃO usar

- Para chains simples sem branching — LCEL com invoke é suficiente
- Para um único LLM call — SDK direto é mais legível
- Quando a equipe não tem familiaridade com grafos — a curva inicial é real

## Como pedir pra IA

> "Cria um agente ReAct em LangGraph (Python) para [CASO DE USO] com: (1) StateGraph com TypedDict para estado, usando Annotated com add_messages para o histórico, (2) nó 'agent' que chama o LLM com tools, (3) nó 'tools' que executa as tool calls, (4) edge condicional que vai para 'tools' se há tool calls ou para END se não há, (5) MemorySaver para conversas multi-turn, (6) streaming de eventos. Inclui 3 tools relevantes para o domínio [DOMÍNIO]."

## Como auditar o que a IA gerou

- [ ] Verificar se `messages` no estado usa `Annotated[list, add_messages]` (não lista simples)
- [ ] Confirmar que a edge condicional verifica corretamente se o último message é AIMessage com tool_calls
- [ ] Verificar se `compile()` recebe o `checkpointer` quando persistência é necessária
- [ ] Checar se o `config` com `thread_id` é passado em todo invoke/stream (necessário para persistência)
- [ ] Confirmar que START e END são importados de `langgraph.graph` corretamente
- [ ] Verificar se o nó de tools lida com erros e injeta o erro como ToolMessage (não lança exceção)
- [ ] Checar se há visualização do grafo (`.get_graph().draw_mermaid()`) para validar a estrutura

## Armadilhas comuns

- **Sobrescrever mensagens em vez de adicionar** — usar `list` em vez de `Annotated[list, add_messages]` no estado apaga o histórico a cada nó
- **Esquecer o checkpointer no compile** — sem checkpointer, `thread_id` não tem efeito e cada invoke é uma conversa nova
- **Edge condicional retornando string errada** — o nome do nó deve ser EXATAMENTE igual ao nome registrado com `add_node`
- **Não tratar ToolException no nó de tools** — erros não tratados propagam e matam o grafo

## Exemplo prático

```python
from typing import Annotated
from typing_extensions import TypedDict
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

# 1. Definição do estado
class State(TypedDict):
    messages: Annotated[list, add_messages]  # add_messages = reducer que ADICIONA
    # Adicione outros campos de estado aqui:
    # user_id: str
    # contexto: dict

# 2. Tools
@tool
def buscar_clima(cidade: str) -> str:
    """Busca condições climáticas atuais de uma cidade brasileira."""
    return f"São Paulo: 23°C, parcialmente nublado"

@tool
def calcular_rota(origem: str, destino: str) -> str:
    """Calcula distância e tempo estimado de viagem entre duas cidades."""
    return f"São Paulo → Campinas: 95km, ~1h30 sem tráfego"

tools = [buscar_clima, calcular_rota]
tool_node = ToolNode(tools)  # ToolNode executa tools e trata erros automaticamente

llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")
llm_with_tools = llm.bind_tools(tools)

# 3. Nó do agente
def agente(state: State) -> dict:
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}  # add_messages vai ADICIONAR ao histórico

# 4. Edge condicional
def deve_continuar(state: State) -> str:
    last_message = state["messages"][-1]
    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        return "tools"
    return END

# 5. Construção do grafo
grafo = StateGraph(State)
grafo.add_node("agente", agente)
grafo.add_node("tools", tool_node)

grafo.add_edge(START, "agente")
grafo.add_conditional_edges("agente", deve_continuar, {"tools": "tools", END: END})
grafo.add_edge("tools", "agente")  # Após tools, volta para o agente

checkpointer = MemorySaver()
app = grafo.compile(checkpointer=checkpointer)

# Visualizar o grafo
print(app.get_graph().draw_mermaid())

# 6. Execução com persistência
config = {"configurable": {"thread_id": "conversa-usuario-42"}}

# Turno 1
resposta1 = app.invoke(
    {"messages": [HumanMessage(content="Como está o clima em São Paulo?")]},
    config=config,
)
print(resposta1["messages"][-1].content)

# Turno 2 — retoma a mesma conversa, sem reenviar histórico
resposta2 = app.invoke(
    {"messages": [HumanMessage(content="E quanto tempo leva pra chegar em Campinas?")]},
    config=config,  # mesmo thread_id = mesma conversa
)
print(resposta2["messages"][-1].content)

# Streaming com eventos intermediários
async def stream_com_eventos():
    async for event in app.astream_events(
        {"messages": [HumanMessage(content="Planeje uma viagem SP → Campinas")]},
        config=config,
        version="v2",
    ):
        if event["event"] == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            if chunk.content:
                print(chunk.content, end="", flush=True)
        elif event["event"] == "on_tool_start":
            print(f"\n>>> Tool: {event['name']}")
```
