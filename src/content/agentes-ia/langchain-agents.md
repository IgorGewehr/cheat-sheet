---
title: "LangChain Agents e Tools"
category: agentes-ia
stack: [Python, TypeScript, LangChain]
tags: [langchain, agents, tools, agentexecutor]
excerpt: "AgentExecutor está deprecado — use create_react_agent com LangGraph ou ferramentas custom com StructuredTool para agentes modernos."
related: [langchain-fundamentos, langgraph-fundamentos, tool-use-function-calling]
updated: 2026-04
---

## O que é

LangChain agents são o mecanismo pelo qual um LLM usa ferramentas iterativamente até completar uma tarefa. O modelo escolhe uma ferramenta, executa, recebe o resultado, decide o próximo passo — e repete até ter uma resposta final (padrão ReAct: Reason + Act).

**AgentExecutor** foi o executor padrão por anos e ainda aparece em tutoriais e código legado. Está **essencialmente deprecado** — a LangChain não está mais investindo nele e recomenda explicitamente migrar para LangGraph. O problema do AgentExecutor é rigidez: o loop de execução é uma caixa preta que você não pode customizar sem hackear.

**create_react_agent + LangGraph** é o caminho moderno. O agente é um grafo de estados onde você controla explicitamente o que acontece em cada nó. Isso dá suporte nativo a: streaming de passos intermediários, persistência de estado entre turnos, human-in-the-loop, retry de erros específicos.

**Custom tools** é onde você passa mais tempo. A definição de uma tool em LangChain pode usar: `@tool` decorator (simples), `StructuredTool.from_function()` (com schema Pydantic), ou subclasse de `BaseTool` (máximo controle). A regra: use o mais simples que resolve seu caso.

## Quando usar

- Você já está em um stack LangChain e quer adicionar tools sem mudar para SDK direto
- Precisa do ecossistema de tools prontas do LangChain (há centenas para APIs comuns)
- Quer integração automática com LangSmith para tracing do agente
- Construindo sobre LangGraph onde tools são um componente do grafo

## Quando NÃO usar

- Você não usa LangChain — SDK direto com tool use é mais simples
- Agentes simples de 1-2 ferramentas — overhead da abstração não compensa
- AgentExecutor para qualquer coisa nova — migre para LangGraph antes de começar

## Como pedir pra IA

> "Cria um agente LangChain moderno (usando create_react_agent + LangGraph, NÃO AgentExecutor) para [CASO DE USO]. Preciso de: (1) 3-4 custom tools usando StructuredTool ou @tool decorator com schemas Pydantic, (2) agente com memória de conversação usando checkpointer, (3) streaming dos passos intermediários, (4) limite de iterações com mensagem clara de erro. Domínio: [DOMÍNIO]. Modelo: [MODEL]."

## Como auditar o que a IA gerou

- [ ] Confirmar que não usa AgentExecutor (legado) — deve usar LangGraph + create_react_agent ou similar
- [ ] Verificar se cada tool tem `description` detalhada explicando quando usar (não apenas o que faz)
- [ ] Confirmar que o schema Pydantic das tools tem descriptions nos campos
- [ ] Verificar se há tratamento para ToolException e não apenas Exception genérica
- [ ] Checar se max_iterations está configurado e há mensagem de erro clara quando atingido
- [ ] Confirmar que tools com side effects têm validação de input antes de executar
- [ ] Verificar se o checkpointer está configurado para persistência entre turnos (não apenas MemorySaver)

## Armadilhas comuns

- **AgentExecutor ainda aparece em 80% dos tutoriais do Google** — é legado, ignore
- **Tool description é um prompt** — trate com o mesmo cuidado que trataria um system prompt de produção
- **@tool decorator não suporta async nativamente em versões antigas** — verifique a versão do LangChain
- **args_schema sem descriptions** — o modelo não sabe o que colocar em cada campo se não tiver description

## Exemplo prático

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool, StructuredTool
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel, Field
import asyncio

# Tool simples com decorator
@tool
def buscar_cotacao(ticker: str) -> str:
    """
    Busca a cotação atual de uma ação na bolsa brasileira.
    Use quando o usuário perguntar sobre o preço de uma ação específica.
    O ticker deve ser no formato PETR4, VALE3, etc.
    """
    # Simulação — conectaria a uma API real
    cotacoes = {"PETR4": 38.50, "VALE3": 67.20, "ITUB4": 32.80}
    valor = cotacoes.get(ticker.upper())
    if not valor:
        return f"Ticker {ticker} não encontrado"
    return f"{ticker.upper()}: R$ {valor:.2f}"

# Tool com schema Pydantic (recomendado para parâmetros complexos)
class FiltroRelatorio(BaseModel):
    data_inicio: str = Field(description="Data início no formato YYYY-MM-DD")
    data_fim: str = Field(description="Data fim no formato YYYY-MM-DD")
    tipo: str = Field(
        description="Tipo do relatório: 'receitas', 'despesas', ou 'resumo'",
        default="resumo"
    )

def gerar_relatorio(data_inicio: str, data_fim: str, tipo: str = "resumo") -> str:
    """Gera relatório financeiro para o período especificado."""
    return f"Relatório {tipo} de {data_inicio} a {data_fim}: R$ 125.430,00"

relatorio_tool = StructuredTool.from_function(
    func=gerar_relatorio,
    name="gerar_relatorio_financeiro",
    description=(
        "Gera um relatório financeiro para um período específico. "
        "Use quando o usuário pedir análise financeira, balanço, ou resumo de período. "
        "Requer datas de início e fim."
    ),
    args_schema=FiltroRelatorio,
)

# Agente moderno com LangGraph
llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")
tools = [buscar_cotacao, relatorio_tool]
checkpointer = MemorySaver()  # Em prod: SqliteSaver ou PostgresSaver

agent = create_react_agent(
    model=llm,
    tools=tools,
    checkpointer=checkpointer,
    # state_modifier para system prompt
    state_modifier="Você é um assistente financeiro. Use as ferramentas disponíveis para responder perguntas sobre cotações e relatórios.",
)

# Execução com streaming
async def run():
    config = {"configurable": {"thread_id": "user-123"}}
    
    async for event in agent.astream_events(
        {"messages": [("user", "Qual a cotação de PETR4 hoje?")]},
        config=config,
        version="v2",
    ):
        if event["event"] == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            if chunk.content:
                print(chunk.content, end="", flush=True)
        elif event["event"] == "on_tool_start":
            print(f"\n[Tool: {event['name']}] Input: {event['data']['input']}")
        elif event["event"] == "on_tool_end":
            print(f"[Tool resultado]: {event['data']['output']}")

asyncio.run(run())
```
