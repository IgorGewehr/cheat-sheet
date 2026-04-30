---
title: "RAG Avançado — Técnicas que Funcionam"
category: agentes-ia
stack: [Python, LangChain, LangGraph]
tags: [rag, hyde, reranking, multi-query, self-query]
excerpt: "HyDE, Multi-Query, reranking com cross-encoders e Corrective RAG — as técnicas que realmente resolvem falhas do naive RAG em produção."
related: [rag-fundamentos, vector-databases, langgraph-patterns]
updated: 2026-04
---

## O que é

Naive RAG falha por razões previsíveis: a query do usuário e os documentos usam vocabulários diferentes, chunks relevantes não ficam entre os top-k, o modelo alucina mesmo com contexto bom. As técnicas de RAG avançado atacam cada um desses problemas especificamente.

**HyDE (Hypothetical Document Embeddings):** em vez de embedar a query diretamente, você pede ao LLM para gerar uma resposta hipotética para a query e embeda ESSA resposta. O raciocínio: o espaço de embedding é melhor explorado por texto no estilo de um documento do que por texto no estilo de uma pergunta. Funciona especialmente bem quando a query é muito curta ou usa vocabulário diferente dos documentos.

**Multi-Query Retrieval:** gera N reformulações diferentes da query original e faz retrieval com cada uma. Agrega os resultados (com deduplicação). Resolve o problema de vocabulário: se a query original não recupera os chunks certos, uma reformulação diferente pode.

**Reranking com cross-encoders:** bi-encoders (como text-embedding-3-small) processam query e documento separadamente e comparam os vetores — rápido mas impreciso. Cross-encoders processam a query E o documento juntos — lento mas muito mais preciso. O padrão é: retrieval rápido com bi-encoder (top-20), reranking preciso com cross-encoder (top-5). Cohere Rerank e BGE-reranker são as opções mais comuns.

**Corrective RAG (CRAG):** após o retrieval, um step de avaliação verifica se os documentos recuperados são realmente relevantes. Se não são, faz uma web search para complementar. Se são ambíguos, refina a query. Implementado naturalmente como um grafo LangGraph.

**Self-RAG:** o modelo decide, em tempo de geração, se precisa de mais retrieval, e avalia a qualidade do que está gerando. Mais sofisticado mas também mais caro e complexo de implementar.

## Quando usar

- **HyDE:** quando a query é muito curta (1-5 palavras) ou domínio técnico com vocabulário específico
- **Multi-Query:** quando retrieval simples tem recall baixo (você sabe que a informação existe mas não aparece)
- **Reranking:** sempre que você pode gastar +100ms por query e qualidade importa mais que velocidade
- **CRAG:** quando a base de conhecimento pode estar desatualizada ou incompleta
- **Parent-Document Retrieval:** quando chunks pequenos perdem contexto mas chunks grandes são muito ruidosos

## Quando NÃO usar

- HyDE quando a latência é crítica (adiciona 1 LLM call extra antes do retrieval)
- Multi-Query quando a base de conhecimento é pequena e retrieval simples já funciona bem
- Todos os techniques juntos num pipeline só — o ganho marginal de cada técnica adicional diminui e o custo/latência aumentam

## Como pedir pra IA

> "Implementa um pipeline RAG avançado em Python com: (1) Multi-Query para gerar 3 reformulações da query e fazer retrieval com cada uma, deduplicando resultados, (2) reranking com Cohere Rerank nos top-15 para retornar top-5, (3) evaluation pós-retrieval que retorna 'relevante'/'irrelevante'/'ambíguo' para cada chunk, (4) CRAG: se nenhum chunk for relevante, faz web search como fallback. Use LangGraph para o fluxo de controle. Inclui métricas de latência por etapa."

## Como auditar o que a IA gerou

- [ ] Verificar se Multi-Query deduplica documentos por content hash (não apenas por ID)
- [ ] Confirmar que reranking usa cross-encoder real (Cohere Rerank ou BGE), não bi-encoder novamente
- [ ] Verificar se CRAG tem fallback funcional (web search ou mensagem clara de "informação não disponível")
- [ ] Checar se HyDE usa temperature > 0 para gerar a resposta hipotética (hipótese criativa, não determinística)
- [ ] Confirmar que Parent-Document retrieval salva o documento pai e o chunk filho separadamente
- [ ] Verificar se há logging de qual técnica contribuiu para a resposta final (para debugging)

## Armadilhas comuns

- **Multi-Query sem deduplicação** — você passa documentos duplicados para o LLM, desperdiça tokens e confunde o modelo
- **Reranking em cima de retrieval com threshold muito alto** — se o retrieval já filtrou demais, não há o que reranquear. Balance threshold e k
- **HyDE com temperatura 0** — a resposta hipotética deve ter alguma variação. Temperatura muito baixa gera hipóteses muito próximas da query original, perdendo o benefício
- **CRAG que sempre vai para web search** — se o avaliador é muito pessimista, você paga pela web search desnecessariamente

## Exemplo prático

```python
from langchain_anthropic import ChatAnthropic
from langchain_openai import OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain.retrievers.contextual_compression import ContextualCompressionRetriever
from langchain_cohere import CohereRerank
from langgraph.graph import StateGraph, START, END
from typing import Literal, TypedDict, Annotated
from langgraph.graph.message import add_messages

llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# === HyDE ===
def hyde_retriever(vectorstore, query: str, k: int = 10) -> list:
    """Gera documento hipotético e usa para retrieval."""
    hyde_prompt = ChatPromptTemplate.from_template(
        "Escreva um parágrafo que responderia esta pergunta, baseado em conhecimento técnico:\n\n{query}"
    )
    hyde_chain = hyde_prompt | llm | StrOutputParser()
    
    hypothetical_doc = hyde_chain.invoke({"query": query})
    hypothetical_embedding = embeddings.embed_query(hypothetical_doc)
    
    return vectorstore.similarity_search_by_vector(hypothetical_embedding, k=k)

# === Multi-Query + Reranking ===
def criar_pipeline_avancado(vectorstore):
    base_retriever = vectorstore.as_retriever(search_kwargs={"k": 15})
    
    # Multi-Query: gera 3 reformulações da query
    multi_query_retriever = MultiQueryRetriever.from_llm(
        retriever=base_retriever,
        llm=llm,
    )
    
    # Reranking com Cohere — reordena os resultados por relevância real
    compressor = CohereRerank(
        model="rerank-multilingual-v3.0",
        top_n=5,
    )
    compression_retriever = ContextualCompressionRetriever(
        base_compressor=compressor,
        base_retriever=multi_query_retriever,
    )
    
    return compression_retriever

# === Corrective RAG (CRAG) com LangGraph ===
class CRAGState(TypedDict):
    query: str
    documentos: list
    avaliacao: str  # "relevante", "irrelevante", "ambiguo"
    resposta: str

def retrieval(state: CRAGState) -> dict:
    retriever = criar_pipeline_avancado(vectorstore)
    docs = retriever.invoke(state["query"])
    return {"documentos": docs}

def avaliar_documentos(state: CRAGState) -> dict:
    """Avalia se os documentos recuperados são relevantes para a query."""
    if not state["documentos"]:
        return {"avaliacao": "irrelevante"}
    
    docs_text = "\n\n".join(d.page_content[:500] for d in state["documentos"][:3])
    
    avaliacao_prompt = f"""Avalie se estes documentos contêm informação relevante para responder a pergunta.

PERGUNTA: {state['query']}

DOCUMENTOS:
{docs_text}

Responda com UMA palavra: "relevante", "irrelevante", ou "ambiguo" """
    
    response = llm.invoke(avaliacao_prompt)
    avaliacao = response.content.strip().lower()
    if avaliacao not in ["relevante", "irrelevante", "ambiguo"]:
        avaliacao = "ambiguo"
    return {"avaliacao": avaliacao}

def web_search_fallback(state: CRAGState) -> dict:
    """Fallback para web search quando documentos não são relevantes."""
    # Integrar com Tavily, SerpAPI, ou similar
    # from langchain_community.tools import TavilySearchResults
    # search = TavilySearchResults()
    # results = search.invoke(state["query"])
    mock_results = [type('Doc', (), {'page_content': f'Resultado web para: {state["query"]}'})()]
    return {"documentos": mock_results}

def gerar_resposta(state: CRAGState) -> dict:
    context = "\n\n".join(d.page_content for d in state["documentos"])
    response = llm.invoke(
        f"Responda baseado nos documentos:\n\nDOCUMENTOS:\n{context}\n\nPERGUNTA: {state['query']}"
    )
    return {"resposta": response.content}

def routing(state: CRAGState) -> Literal["web_search_fallback", "gerar_resposta", "retrieval"]:
    if state["avaliacao"] == "irrelevante":
        return "web_search_fallback"
    elif state["avaliacao"] == "ambiguo":
        return "retrieval"  # Poderia refinar a query aqui
    return "gerar_resposta"

crag_graph = StateGraph(CRAGState)
crag_graph.add_node("retrieval", retrieval)
crag_graph.add_node("avaliar_documentos", avaliar_documentos)
crag_graph.add_node("web_search_fallback", web_search_fallback)
crag_graph.add_node("gerar_resposta", gerar_resposta)

crag_graph.add_edge(START, "retrieval")
crag_graph.add_edge("retrieval", "avaliar_documentos")
crag_graph.add_conditional_edges("avaliar_documentos", routing)
crag_graph.add_edge("web_search_fallback", "gerar_resposta")
crag_graph.add_edge("gerar_resposta", END)

crag_app = crag_graph.compile()
```
