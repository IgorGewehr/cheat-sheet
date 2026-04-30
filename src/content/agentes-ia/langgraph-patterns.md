---
title: "LangGraph — Patterns Avançados"
category: agentes-ia
stack: [Python, TypeScript, LangGraph]
tags: [langgraph, multi-agent, supervisor, reflection, hitl]
excerpt: "Supervisor, Reflection, Plan-and-Execute e Map-Reduce — os patterns que resolvem problemas reais em agentes complexos."
related: [langgraph-fundamentos, multi-agent-orchestration, human-in-the-loop]
updated: 2026-04
---

## O que é

LangGraph viabiliza patterns arquiteturais que seriam impossíveis ou muito frágeis com AgentExecutor. Cada pattern resolve uma classe específica de problema:

**Supervisor Pattern:** um agente orquestrador recebe a tarefa e decide qual agente especialista executar a seguir. Cada especialista tem ferramentas e contexto específico do seu domínio. O supervisor vê apenas os resultados de alto nível, não os detalhes internos de cada especialista.

**Reflection Pattern:** um agente "gerador" produz um output, um agente "crítico" avalia e aponta problemas, o gerador revisa. O loop continua até o crítico aprovar ou atingir max_iterations. É simples e surpreendentemente efetivo para melhorar qualidade de código gerado, documentação e análises.

**Plan-and-Execute:** separar o planejamento (LLM decide a lista de passos) da execução (cada passo é executado em ordem). Permite que o plano seja revisado se um passo falhar, e que o usuário aprove o plano antes da execução.

**Map-Reduce:** processar N items em paralelo (map) e depois agregar os resultados (reduce). Útil para: processar N documentos e sintetizar, avaliar N candidatos e ranquear, buscar N fontes e consolidar.

**Subgraphs:** um nó de um grafo é, na verdade, outro grafo compilado. Permite compor sistemas complexos de grafos menores e testáveis.

## Quando usar

- **Supervisor:** quando você tem especializações claras e o roteamento entre elas é complexo (não cabe em if/else)
- **Reflection:** quando a qualidade do output é crítica e vale o custo de múltiplos LLM calls
- **Plan-and-Execute:** quando as tarefas têm muitos passos sequenciais e você quer possibilidade de HITL entre planejamento e execução
- **Map-Reduce:** quando você precisa processar muitos items independentes e sintetizar

## Quando NÃO usar

- Supervisor para roteamento simples entre 2-3 opções — use edge condicional direta
- Reflection para outputs não-iterativos (classificação, extração de dados) — mais custo sem ganho
- Todos esses patterns juntos em um sistema — complexidade se multiplica. Comece com o mínimo

## Como pedir pra IA

> "Implementa o Supervisor Pattern em LangGraph (Python) para [DOMÍNIO]. Preciso de: (1) agente supervisor que usa LLM para decidir qual especialista chamar (não if/else hardcoded), (2) 3 agentes especialistas com ferramentas específicas: [ESPECIALISTA1], [ESPECIALISTA2], [ESPECIALISTA3], (3) shared state que permite especialistas passarem contexto entre si, (4) condição de terminação clara (não apenas max_iterations). Mostra como adicionar HITL para aprovação antes de ações irreversíveis."

## Como auditar o que a IA gerou

- [ ] Verificar se o supervisor usa LLM para routing (não if/else hardcoded baseado em keywords)
- [ ] Confirmar que subagentes têm acesso apenas ao estado que precisam (não ao estado global completo)
- [ ] Verificar se o loop de reflection tem critério claro de saída além de max_iterations
- [ ] Checar se Map-Reduce usa `Send` para enviar cada item para processamento paralelo
- [ ] Confirmar que erros em um agente especialista não matam o supervisor (são capturados e reportados)
- [ ] Verificar se há streaming de eventos de subagentes para debug (não apenas resultado final)

## Armadilhas comuns

- **Supervisor com roteamento por keywords** — frágil e não escala. O supervisor deve usar LLM para entender semanticamente o que fazer
- **Estado global enorme** — especialistas não precisam ver tudo. Passe apenas o contexto necessário
- **Reflection infinita** — sem critério de convergência, o crítico sempre vai achar algo para melhorar
- **Map-Reduce sem limite de concorrência** — 100 items × 1 LLM call = 100 chamadas simultâneas. Implemente semáforo ou batching

## Exemplo prático

```python
from typing import Annotated, Literal
from typing_extensions import TypedDict
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.types import Send
import asyncio

llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")

# === SUPERVISOR PATTERN ===
class SupervisorState(TypedDict):
    messages: Annotated[list, add_messages]
    next_agent: str
    resultados: list[str]

def criar_supervisor():
    opcoes = ["analista_financeiro", "analista_juridico", "analista_tecnico", "FINALIZAR"]
    
    supervisor_prompt = f"""Você é um supervisor que coordena especialistas.
Com base na conversa, decida qual especialista chamar a seguir, ou FINALIZAR se a tarefa está completa.
Opções: {opcoes}
Responda APENAS com o nome do especialista ou FINALIZAR."""
    
    def supervisor(state: SupervisorState) -> dict:
        response = llm.invoke([
            SystemMessage(content=supervisor_prompt),
            *state["messages"],
        ])
        next_agent = response.content.strip()
        if next_agent not in opcoes:
            next_agent = "FINALIZAR"
        return {"next_agent": next_agent}
    
    return supervisor

def analista_financeiro(state: SupervisorState) -> dict:
    result = llm.invoke([
        SystemMessage("Você é um analista financeiro especializado em demonstrações contábeis."),
        *state["messages"],
    ])
    return {
        "messages": [result],
        "resultados": state.get("resultados", []) + [f"FINANCEIRO: {result.content[:100]}..."],
    }

# === REFLECTION PATTERN ===
class ReflectionState(TypedDict):
    task: str
    draft: str
    critique: str
    iteration: int

def gerador(state: ReflectionState) -> dict:
    """Gera ou revisa o draft baseado na crítica anterior."""
    if state.get("critique"):
        prompt = f"Revise baseado nesta crítica:\n{state['critique']}\n\nDraft atual:\n{state['draft']}"
    else:
        prompt = f"Escreva um código Python para: {state['task']}"
    
    response = llm.invoke(prompt)
    return {"draft": response.content, "iteration": state.get("iteration", 0) + 1}

def critico(state: ReflectionState) -> dict:
    """Avalia o draft e retorna crítica ou APROVADO."""
    response = llm.invoke(
        f"""Revise este código Python criticamente.
        
Código:\n{state['draft']}

Se está correto e bem escrito, responda EXATAMENTE: APROVADO
Se tem problemas, liste os problemas específicos a corrigir (sem repetir o código)."""
    )
    return {"critique": response.content}

def deve_revisar(state: ReflectionState) -> str:
    if state.get("iteration", 0) >= 3:  # Máximo de 3 iterações
        return END
    if "APROVADO" in state.get("critique", ""):
        return END
    return "gerador"

reflection_graph = StateGraph(ReflectionState)
reflection_graph.add_node("gerador", gerador)
reflection_graph.add_node("critico", critico)
reflection_graph.add_edge(START, "gerador")
reflection_graph.add_edge("gerador", "critico")
reflection_graph.add_conditional_edges("critico", deve_revisar)
reflection_app = reflection_graph.compile()

# === MAP-REDUCE PATTERN ===
class MapReduceState(TypedDict):
    documentos: list[str]
    analises: Annotated[list, lambda x, y: x + y]  # reducer que acumula
    resumo_final: str

class DocumentoState(TypedDict):
    documento: str
    analises: Annotated[list, lambda x, y: x + y]

def analisar_documento(state: DocumentoState) -> dict:
    """Processa um documento individual."""
    response = llm.invoke(f"Extraia os 3 pontos principais: {state['documento'][:500]}")
    return {"analises": [response.content]}

def continuar_para_map(state: MapReduceState) -> list[Send]:
    """Dispara processamento paralelo para cada documento."""
    return [
        Send("analisar_documento", {"documento": doc, "analises": []})
        for doc in state["documentos"]
    ]

def reducer(state: MapReduceState) -> dict:
    """Agrega todos os resultados."""
    todas_analises = "\n\n".join(f"Doc {i+1}: {a}" for i, a in enumerate(state["analises"]))
    response = llm.invoke(f"Sintetize estas análises em um resumo executivo:\n{todas_analises}")
    return {"resumo_final": response.content}

map_reduce_graph = StateGraph(MapReduceState)
map_reduce_graph.add_node("analisar_documento", analisar_documento)
map_reduce_graph.add_node("reducer", reducer)
map_reduce_graph.add_conditional_edges(START, continuar_para_map, ["analisar_documento"])
map_reduce_graph.add_edge("analisar_documento", "reducer")
map_reduce_graph.add_edge("reducer", END)
map_reduce_app = map_reduce_graph.compile()

# Uso Map-Reduce
result = map_reduce_app.invoke({
    "documentos": ["Contrato 1...", "Contrato 2...", "Contrato 3..."],
    "analises": [],
    "resumo_final": "",
})
print(result["resumo_final"])
```
