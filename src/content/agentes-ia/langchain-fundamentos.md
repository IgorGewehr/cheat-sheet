---
title: "LangChain — LCEL e Fundamentos"
category: agentes-ia
stack: [Python, TypeScript, LangChain]
tags: [langchain, lcel, chains, runnables]
excerpt: "LCEL é a abstração central do LangChain moderno — entenda quando ela ajuda e quando te atrasa."
related: [langchain-agents, langsmith-observabilidade, rag-fundamentos]
updated: 2026-04
---

## O que é

LangChain Expression Language (LCEL) é a API declarativa do LangChain para compor chains. O operador `|` (pipe) conecta Runnables em sequência: o output de um vira input do próximo. Na prática, `prompt | llm | parser` é uma chain completa que você pode invocar, fazer stream, ou compor em chains maiores.

A proposta de valor do LCEL é composabilidade e uniformidade de interface: qualquer Runnable expõe `invoke`, `stream`, `batch`, e `ainvoke`/`astream`/`abatch`. Isso significa que você pode trocar a implementação interna sem mudar o código que usa a chain.

**O custo real** é a camada de abstração. LangChain abstrai bem demais para uso simples, e mal demais para uso complexo. Quando você vai depurar por que sua chain está se comportando de forma estranha, você vai navegar por várias camadas de abstração antes de chegar no que o modelo realmente recebeu. LangSmith foi criado em parte por causa desse problema.

**Quando LCEL vale a pena:** composição de chains reutilizáveis, output parsers com retry automático, RunnableParallel para chamadas simultâneas, streaming integrado sem boilerplate. Para um script simples ou uma feature isolada, o SDK da Anthropic/OpenAI direto é mais limpo e mais debugável.

## Quando usar

- Você tem chains que serão compostas e reutilizadas em contextos diferentes
- Precisa de streaming com baixo boilerplate
- Usa output parsers com retry automático (PydanticOutputParser com `with_retry`)
- Integra com LangSmith para observabilidade (LCEL tem tracing automático)
- Construindo RAG pipelines onde as peças (retriever, prompt, llm, parser) são intercambiáveis

## Quando NÃO usar

- Scripts one-off onde SDK direto é mais simples e mais debugável
- Quando você precisa de controle fino sobre o que está sendo enviado para o modelo
- Quando a equipe não conhece LangChain (curva de aprendizado alta para depurar erros)
- Chains muito simples: um prompt + um modelo não precisa de LCEL
- Quando você quer migrar de modelo frequentemente — abstrações ajudam mas também escondem diferenças importantes entre modelos

## Como pedir pra IA

> "Cria uma chain LCEL em Python para [CASO DE USO]. A chain deve: receber [INPUT], usar o modelo [MODEL], retornar [OUTPUT FORMAT]. Preciso de: (1) PromptTemplate ou ChatPromptTemplate correto, (2) output parser adequado para o formato, (3) exemplo de uso com invoke e astream, (4) RunnablePassthrough para preservar o input original junto com o output. Não use AgentExecutor — use LCEL puro."

## Como auditar o que a IA gerou

- [ ] Verificar se o PromptTemplate usa variáveis corretas com `{variavel}` (não f-strings)
- [ ] Confirmar que output parsers têm `get_format_instructions()` incluído no prompt quando necessário
- [ ] Verificar se `RunnablePassthrough` está sendo usado corretamente quando se precisa manter contexto
- [ ] Checar se streaming usa `astream` (async) e não `stream` síncrono em contexto web
- [ ] Confirmar que erros de parsing têm fallback (OutputFixingParser ou retry)
- [ ] Verificar se há `with_config({"run_name": "..."})` para identificar a chain no LangSmith

## Armadilhas comuns

- **LCEL é bom para composição, péssimo para debugging** — quando algo dá errado, o stack trace é confuso. Use LangSmith ou adicione callbacks manualmente
- **RunnableLambda para lógica complexa vira um anti-pattern** — se você tem lambda com lógica real, escreva uma função e documente, ou use uma classe
- **Não confundir `chain.invoke({"key": value})` com `chain.invoke(value)`** — chains LCEL exigem dict como input se o prompt tem múltiplas variáveis
- **Versões do LangChain quebram APIs frequentemente** — sempre pin a versão no requirements.txt e leia o CHANGELOG antes de atualizar

## Exemplo prático

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from pydantic import BaseModel, Field

# Output schema
class AnaliseContrato(BaseModel):
    tipo: str = Field(description="Tipo do contrato")
    valor_total: float = Field(description="Valor total em reais")
    data_vencimento: str = Field(description="Data de vencimento no formato YYYY-MM-DD")
    riscos: list[str] = Field(description="Lista de riscos identificados")

llm = ChatAnthropic(model="claude-3-5-sonnet-20241022", temperature=0)
parser = JsonOutputParser(pydantic_object=AnaliseContrato)

prompt = ChatPromptTemplate.from_messages([
    ("system", "Você é um analista de contratos. {format_instructions}"),
    ("human", "Analise este contrato:\n\n{contrato}"),
]).partial(format_instructions=parser.get_format_instructions())

# Chain simples
chain = prompt | llm | parser

# Chain com contexto preservado
chain_com_contexto = RunnableParallel(
    analise=chain,
    contrato_original=RunnablePassthrough(),
)

# Uso
resultado = chain.invoke({"contrato": "CONTRATO DE PRESTAÇÃO DE SERVIÇOS..."})
print(resultado)  # AnaliseContrato(tipo='serviços', valor_total=5000.0, ...)

# Streaming
async def stream_analise(contrato: str):
    async for chunk in chain.astream({"contrato": contrato}):
        print(chunk, end="", flush=True)

# Batch (múltiplos contratos em paralelo)
contratos = [{"contrato": c} for c in lista_de_contratos]
resultados = chain.batch(contratos, config={"max_concurrency": 5})
```

**LCEL vs SDK direto — quando escolher:**

```python
# SDK direto — mais simples, mais debugável, use aqui
from anthropic import Anthropic
client = Anthropic()
response = client.messages.create(model="claude-3-5-sonnet-20241022", ...)

# LCEL — use quando tiver composição real
retriever = vectorstore.as_retriever()
rag_chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
```
