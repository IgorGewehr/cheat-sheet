---
title: "Human-in-the-Loop para Agentes"
category: agentes-ia
stack: [Python, TypeScript, LangGraph]
tags: [hitl, human-in-the-loop, interrupts, approval, feedback]
excerpt: "Agentes que executam ações irreversíveis precisam de HITL — LangGraph interrupt() é o mecanismo correto e mais simples do que parece."
related: [langgraph-fundamentos, langgraph-patterns, agent-deployment]
updated: 2026-04
---

## O que é

Human-in-the-Loop (HITL) é o padrão pelo qual um agente pausa sua execução, apresenta o estado atual para um humano, e aguarda aprovação ou correção antes de continuar. É crítico para qualquer operação irreversível: enviar emails, criar pedidos, debitar contas, deletar dados, chamar APIs externas que custam dinheiro.

**LangGraph `interrupt()`** é a primitiva. Quando um nó do grafo chama `interrupt(value)`, a execução pausa e o `value` é retornado ao chamador. A execução fica "suspensa" no checkpointer até que você a retome com `Command(resume=...)`. O estado completo do grafo é preservado — você retoma exatamente de onde parou.

**O modelo mental correto:** pense em `interrupt()` como um `await` — a execução do agente bloqueia, mas o servidor não bloqueia (você salva o estado e libera o thread). Quando o humano aprova, você carrega o estado e continua. Isso é naturalmente adequado para workflows assíncronos onde o humano pode demorar minutos ou horas para responder.

**`interrupt_before` vs `interrupt_after`:** alternativa ao `interrupt()` inline, você pode configurar nós que pausam automaticamente antes ou depois de executar. Útil quando o nó é uma caixa preta e você quer inspeção de estado sem modificar o código do nó.

**O padrão "propose then execute":** o agente primeiro descreve o que vai fazer (sem executar), o humano aprova, então o agente executa. Isso é mais seguro que "execute e pergunte se estava certo depois".

## Quando usar

- Operações financeiras: criar pedidos, processar pagamentos, emitir notas fiscais
- Ações com efeitos externos irreversíveis: enviar emails em massa, publicar conteúdo, chamar APIs de terceiros
- Operações em dados de produção que poderiam causar perda de dados
- Quando a confiança no agente ainda está sendo calibrada (novo agente em produção)
- Fluxos de aprovação de negócio que existem independentemente de AI (ex: pedido acima de R$X precisa de aprovação gerencial)

## Quando NÃO usar

- Ações de leitura (consultas, relatórios) — não precisam de aprovação
- Quando o volume é muito alto para humanos aprovarem (precisa de automação total ou limites automáticos)
- Quando a latência de espera humana é inaceitável para o caso de uso

## Como pedir pra IA

> "Implementa HITL em LangGraph para um agente de [DOMÍNIO] que executa [AÇÃO IRREVERSÍVEL]. Preciso de: (1) nó que usa interrupt() para apresentar um resumo claro do que vai ser feito, (2) API endpoint que recebe a decisão humana (aprovar/rejeitar/editar), (3) retomada da execução com Command(resume=...), (4) tratamento do caso de rejeição (agente recebe feedback e tenta de novo ou encerra), (5) timeout: se não houver resposta em [X horas], cancela automaticamente. Usa FastAPI + LangGraph."

## Como auditar o que a IA gerou

- [ ] Verificar se o interrupt() é chamado ANTES da ação irreversível (não depois)
- [ ] Confirmar que o `value` passado para interrupt() contém informação suficiente para o humano decidir
- [ ] Verificar se o estado do interrupt é persistido no banco (não apenas em memória)
- [ ] Checar se há tratamento para o caso de rejeição (não apenas aprovar/cancelar)
- [ ] Confirmar que há timeout ou mecanismo de expiração (interrupts não podem ficar pendentes para sempre)
- [ ] Verificar se o thread_id é estável e recuperável (não gerado aleatoriamente a cada request)
- [ ] Checar se a UI mostra estado atual claro: "aguardando aprovação de [AÇÃO] por [AGENTE]"

## Armadilhas comuns

- **Interrupt sem contexto claro** — o humano recebe "approve? yes/no" sem entender o que vai acontecer. Inclua: o que vai ser feito, por que, e as consequências
- **Estado de interrupt em memória apenas** — se o servidor reinicia, todos os interrupts pendentes se perdem. Use PostgresSaver ou similar
- **Threads de interrupt sem timeout** — um interrupt pendente por semanas ocupa recursos e pode confundir o sistema. Implemente expiração
- **Permitir edição sem revalidação** — se o humano edita os parâmetros da ação, o agente deve revalidar antes de executar

## Exemplo prático

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.types import Command, interrupt
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage
from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages
import asyncio

llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")

class EstadoPedido(TypedDict):
    messages: Annotated[list, add_messages]
    pedido_proposto: dict | None
    aprovado: bool | None
    feedback_humano: str | None

def analisar_solicitacao(state: EstadoPedido) -> dict:
    """Entende o que o usuário quer e cria uma proposta de pedido."""
    response = llm.invoke([
        *state["messages"],
    ])
    
    # Simula extração de dados estruturados do pedido
    pedido = {
        "cliente_id": "CLI-001",
        "itens": [{"sku": "PROD-A", "quantidade": 5, "valor_unitario": 199.90}],
        "valor_total": 999.50,
        "forma_pagamento": "boleto",
    }
    
    return {
        "messages": [response],
        "pedido_proposto": pedido,
    }

def solicitar_aprovacao(state: EstadoPedido) -> dict:
    """Pausa a execução e aguarda aprovação humana."""
    pedido = state["pedido_proposto"]
    
    # interrupt() pausa a execução aqui
    # O value é apresentado ao humano
    decisao = interrupt({
        "tipo": "aprovacao_pedido",
        "mensagem": "Por favor, revise e aprove o pedido:",
        "pedido": pedido,
        "resumo": f"Criar pedido de {len(pedido['itens'])} item(ns) no valor de R$ {pedido['valor_total']:.2f} "
                  f"para cliente {pedido['cliente_id']} via {pedido['forma_pagamento']}",
        "opcoes": ["aprovar", "rejeitar", "editar"],
    })
    
    # Execução retoma aqui com o valor passado pelo humano
    aprovado = decisao.get("decisao") == "aprovar"
    feedback = decisao.get("feedback", "")
    
    return {
        "aprovado": aprovado,
        "feedback_humano": feedback,
    }

def criar_pedido(state: EstadoPedido) -> dict:
    """Executa a criação do pedido após aprovação."""
    pedido = state["pedido_proposto"]
    
    # Aqui conecta à API real do ERP
    # response = erp_client.criar_pedido(pedido)
    
    resultado = AIMessage(content=f"Pedido criado com sucesso! Número: PED-{hash(str(pedido)) % 10000:04d}")
    return {"messages": [resultado]}

def lidar_com_rejeicao(state: EstadoPedido) -> dict:
    """Processa feedback de rejeição."""
    feedback = state.get("feedback_humano", "Sem motivo informado")
    response = llm.invoke([
        *state["messages"],
        HumanMessage(content=f"O pedido foi rejeitado com o seguinte feedback: {feedback}. Como posso ajustar?"),
    ])
    return {"messages": [response]}

def routing_aprovacao(state: EstadoPedido) -> str:
    if state.get("aprovado"):
        return "criar_pedido"
    return "lidar_com_rejeicao"

# Grafo
grafo = StateGraph(EstadoPedido)
grafo.add_node("analisar", analisar_solicitacao)
grafo.add_node("solicitar_aprovacao", solicitar_aprovacao)
grafo.add_node("criar_pedido", criar_pedido)
grafo.add_node("rejeicao", lidar_com_rejeicao)

grafo.add_edge(START, "analisar")
grafo.add_edge("analisar", "solicitar_aprovacao")
grafo.add_conditional_edges("solicitar_aprovacao", routing_aprovacao)
grafo.add_edge("criar_pedido", END)
grafo.add_edge("rejeicao", END)

# Em produção, use AsyncPostgresSaver:
# async with AsyncPostgresSaver.from_conn_string(DATABASE_URL) as checkpointer:
#     await checkpointer.setup()
#     app = grafo.compile(checkpointer=checkpointer)

from langgraph.checkpoint.memory import MemorySaver
app = grafo.compile(checkpointer=MemorySaver())

# === Uso via API (FastAPI) ===
from fastapi import FastAPI
api = FastAPI()

@api.post("/agente/processar")
async def processar(mensagem: str, thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    
    result = await app.ainvoke(
        {"messages": [HumanMessage(content=mensagem)], "pedido_proposto": None, "aprovado": None, "feedback_humano": None},
        config=config,
    )
    
    # Verifica se está aguardando aprovação
    state = await app.aget_state(config)
    if state.next:  # Há nós pendentes = está em interrupt
        return {"status": "aguardando_aprovacao", "dados": state.tasks[0].interrupts[0].value if state.tasks else {}}
    
    return {"status": "concluido", "resposta": result["messages"][-1].content}

@api.post("/agente/responder/{thread_id}")
async def responder_aprovacao(thread_id: str, decisao: str, feedback: str = ""):
    config = {"configurable": {"thread_id": thread_id}}
    
    # Retoma a execução com a decisão do humano
    result = await app.ainvoke(
        Command(resume={"decisao": decisao, "feedback": feedback}),
        config=config,
    )
    
    return {"status": "concluido", "resposta": result["messages"][-1].content}
```
