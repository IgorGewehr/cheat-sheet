---
title: "Orquestração Multi-Agente"
category: agentes-ia
stack: [Python, TypeScript, LangGraph]
tags: [multi-agent, orchestrator, workers, supervisor, handoff]
excerpt: "Multi-agente multiplica capacidade mas também multiplica custo e complexidade — saiba exatamente quando vale a pena e como implementar certo."
related: [langgraph-patterns, langgraph-fundamentos, agent-deployment]
updated: 2026-04
---

## O que é

Sistemas multi-agente são composições de múltiplos agentes especializados que colaboram para completar uma tarefa que nenhum agente individual conseguiria bem. Cada agente tem seu próprio contexto, ferramentas e modelo (opcionalmente diferente dos outros).

**Quando você GENUINAMENTE precisa de múltiplos agentes:**
1. **Especialização:** a tarefa requer domínios tão diferentes que um único context window é insuficiente ou os system prompts entrariam em conflito (ex: um agente de código + um agente de compliance legal)
2. **Paralelismo:** partes independentes da tarefa podem ser executadas simultaneamente, reduzindo latência total
3. **Modelos diferentes:** você quer Haiku para classificação rápida e Sonnet para raciocínio profundo, na mesma pipeline
4. **Isolamento:** você quer que um agente não veja o raciocínio interno de outro (por razões de segurança ou custo)

**O Supervisor Pattern** é o mais comum: um agente orquestrador recebe a tarefa, decide qual especialista chamar, recebe o resultado, e decide o próximo passo até concluir. O supervisor usa LLM para fazer routing (não if/else).

**Handoffs** são como um agente passa controle para outro. Em LangGraph, isso é implementado com `Command(goto="nome_do_agente")` ou com o `handoff_to` tool pattern — o agente especialista pode decidir repassar para outro especialista.

**O custo real:** cada agente na pipeline é um LLM call (ou múltiplos). Uma tarefa que passa por 4 agentes custa 4x mais que um agente único. Isso pode ser justificado pela qualidade ou paralelismo, mas precisa ser calculado.

## Quando usar

- Tarefas com especialidades claramente distintas e não sobrepostas
- Quando paralelismo reduz latência de forma relevante (> 2x)
- Quando um único agente consistentemente falha em alguma subparte da tarefa
- Quando você precisa de modelos diferentes para subpartes (custo/qualidade)

## Quando NÃO usar

- Quando um único agente com mais tools resolve o problema — comece sempre com agente único
- Quando o custo multiplicado pelos agentes não tem ROI claro
- Para paralelismo que poderia ser feito com Map-Reduce dentro de um único agente
- Quando a equipe ainda não domina agentes simples — multi-agente antes do tempo é complexidade desnecessária

## Como pedir pra IA

> "Implementa um sistema multi-agente em LangGraph para [CASO DE USO]. Preciso de: (1) agente supervisor que usa LLM para routing (não hardcoded), (2) 3 agentes especialistas: [A], [B], [C], cada um com tools específicas, (3) shared state onde o supervisor vê apenas resumos dos especialistas (não detalhes internos), (4) execução paralela de [A] e [B] quando possível, (5) condição de conclusão clara. Mostra como estimar o custo de uma execução típica."

## Como auditar o que a IA gerou

- [ ] Verificar se o supervisor usa LLM para routing (não if/else baseado em keywords no input)
- [ ] Confirmar que agentes especialistas têm acesso apenas ao contexto necessário (não ao estado completo)
- [ ] Verificar se execução paralela usa `Send` do LangGraph ou equivalente (não loop sequencial)
- [ ] Checar se há logging de qual agente tomou cada ação (para debugging e auditoria)
- [ ] Confirmar que há limite de iterações no supervisor (previne loops infinitos entre especialistas)
- [ ] Verificar se o custo estimado por execução foi calculado e é aceitável
- [ ] Checar se erros em especialistas são tratados pelo supervisor (não matam o sistema inteiro)

## Armadilhas comuns

- **Multi-agente por moda, não por necessidade** — a maioria dos problemas que parecem precisar de multi-agente são resolvidos por um agente bem projetado com as ferramentas certas
- **Custo explosivo não monitorado** — 5 agentes × 3 iterações cada = 15 LLM calls por request. Com Sonnet, isso pode custar $0.50+ por request
- **Comunicação via estado gigante** — agentes não precisam ver tudo. Passe apenas o necessário para cada especialista
- **Loop entre especialistas** — Agente A manda para B, B manda de volta para A. Sempre defina critérios claros de quando cada especialista é o destino final

## Exemplo prático

```python
from typing import Annotated, TypedDict, Literal
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.types import Command, Send
import asyncio

# Modelos — você pode usar modelos diferentes por especialista
llm_supervisor = ChatAnthropic(model="claude-3-5-sonnet-20241022")  # Mais capaz
llm_haiku = ChatAnthropic(model="claude-3-haiku-20240307")           # Mais barato

# Estado compartilhado
class MultiAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    tarefa_original: str
    resultados: dict[str, str]  # {agente: resultado}
    proximo: str

# === Agentes Especialistas ===
@tool
def analisar_codigo_python(codigo: str) -> str:
    """Analisa qualidade e bugs em código Python."""
    return f"Análise: código com {len(codigo)} chars, qualidade OK"

@tool  
def verificar_compliance_lgpd(descricao: str) -> str:
    """Verifica conformidade LGPD para um fluxo de dados descrito."""
    return "Conformidade: identificado coleta de CPF — necessário consentimento explícito"

@tool
def estimar_custo_infra(arquitetura: str) -> str:
    """Estima custo mensal de infraestrutura baseado na arquitetura descrita."""
    return "Estimativa: R$ 450/mês para setup descrito (Railway + Supabase)"

def agente_tecnico(state: MultiAgentState) -> Command:
    system = SystemMessage(
        content="Você é um arquiteto de software sênior especializado em TypeScript e Python. "
                "Analise apenas aspectos técnicos. Seja específico e objetivo."
    )
    llm_tools = llm_haiku.bind_tools([analisar_codigo_python])
    response = llm_tools.invoke([system, HumanMessage(content=state["tarefa_original"])])
    
    resultado = response.content if isinstance(response.content, str) else str(response.content)
    
    return Command(
        update={
            "resultados": {**state.get("resultados", {}), "tecnico": resultado},
            "messages": [response],
        },
        goto="supervisor",  # Sempre volta ao supervisor
    )

def agente_compliance(state: MultiAgentState) -> Command:
    system = SystemMessage(
        content="Você é especialista em LGPD e compliance de dados. "
                "Analise apenas riscos legais e requisitos de conformidade."
    )
    llm_tools = llm_haiku.bind_tools([verificar_compliance_lgpd])
    response = llm_tools.invoke([system, HumanMessage(content=state["tarefa_original"])])
    
    resultado = response.content if isinstance(response.content, str) else str(response.content)
    
    return Command(
        update={
            "resultados": {**state.get("resultados", {}), "compliance": resultado},
            "messages": [response],
        },
        goto="supervisor",
    )

# === Supervisor ===
OPCOES_AGENTES = ["agente_tecnico", "agente_compliance", "FINALIZAR"]

def supervisor(state: MultiAgentState) -> Command:
    resultados_atuais = state.get("resultados", {})
    
    contexto = f"""Tarefa: {state['tarefa_original']}

Resultados já obtidos:
{chr(10).join(f"- {k}: {v[:200]}..." for k, v in resultados_atuais.items()) if resultados_atuais else "Nenhum ainda"}

Agentes disponíveis: {OPCOES_AGENTES}

Decisão: qual agente chamar a seguir, ou FINALIZAR se temos informação suficiente?
Responda APENAS com o nome do agente ou FINALIZAR."""

    response = llm_supervisor.invoke([SystemMessage(content=contexto)])
    proximo = response.content.strip()
    
    if proximo not in OPCOES_AGENTES:
        proximo = "FINALIZAR"
    
    if proximo == "FINALIZAR":
        # Gera resposta final sintetizando todos os resultados
        sintese = llm_supervisor.invoke(
            f"Sintetize estes resultados de especialistas em uma resposta coesa:\n"
            + "\n".join(f"{k}: {v}" for k, v in resultados_atuais.items())
        )
        return Command(
            update={"messages": [sintese]},
            goto=END,
        )
    
    return Command(
        update={"proximo": proximo},
        goto=proximo,
    )

# Construção do grafo
grafo = StateGraph(MultiAgentState)
grafo.add_node("supervisor", supervisor)
grafo.add_node("agente_tecnico", agente_tecnico)
grafo.add_node("agente_compliance", agente_compliance)

grafo.add_edge(START, "supervisor")
# Edges são gerenciadas por Command(goto=...) nos nós

app = grafo.compile()

# Uso
result = app.invoke({
    "messages": [],
    "tarefa_original": "Estou construindo um sistema de cadastro de clientes com CPF. Avalie tecnicamente e do ponto de vista de compliance.",
    "resultados": {},
    "proximo": "",
})

print(result["messages"][-1].content)
```

**Estimativa de custo para o exemplo acima:**
- Supervisor: ~2-3 chamadas × ~500 tokens input + 100 output = ~$0.006
- Especialistas: 2 × ~300 tokens input + 200 output = ~$0.003
- Total estimado: ~$0.01 por execução. 1000 execuções/dia = ~$10/dia — aceitável. 100k execuções = $1000/dia — precisa repensar.
