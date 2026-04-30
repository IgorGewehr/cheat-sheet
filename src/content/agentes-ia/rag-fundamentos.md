---
title: "RAG — Retrieval Augmented Generation"
category: agentes-ia
stack: [Python, LangChain, LangGraph, pgvector]
tags: [rag, retrieval, embeddings, vector-store]
excerpt: "RAG resolve o problema de LLMs sem acesso a dados privados — mas implementação ingênua falha em produção por razões previsíveis."
related: [vector-databases, rag-avancado, langchain-fundamentos]
updated: 2026-04
---

## O que é

RAG (Retrieval Augmented Generation) é o padrão de enriquecer o contexto de um LLM com documentos relevantes recuperados de uma base de conhecimento antes de gerar a resposta. Em vez de depender apenas do conhecimento de treino do modelo, você injeta informação específica do seu domínio na janela de contexto.

O pipeline básico tem duas fases: **indexação** (offline) e **retrieval** (runtime). Na indexação, você carrega documentos, divide em chunks, gera embeddings para cada chunk, e armazena os vetores em um vector store. No runtime, você pega a query do usuário, gera um embedding dela, busca os chunks mais similares, e os injeta no prompt antes de chamar o LLM.

**Embeddings** são representações numéricas de texto em espaço vetorial de alta dimensão onde textos semanticamente similares ficam próximos. A similaridade cosine entre dois vetores é uma proxy para similaridade semântica — não sintática. "Carro" e "veículo" ficam próximos mesmo sendo palavras diferentes.

**Por que naive RAG falha em produção:** (1) chunking ruim faz contexto ficar dividido entre chunks diferentes, (2) sem threshold de similarity o retriever traz chunks irrelevantes, (3) "lost in the middle" — modelos prestam mais atenção ao início e fim do contexto, chunks no meio são ignorados, (4) query e documento usam vocabulário diferente (query: "como cancelo?", documento: "procedimento de rescisão").

## Quando usar

- Sua aplicação precisa responder perguntas sobre documentos privados ou atualizados frequentemente
- A base de conhecimento é grande demais para caber no context window (> 50 páginas)
- Você precisa citar as fontes das respostas (RAG naturalmente expõe os chunks usados)
- Knowledge base com domínio bem definido (documentação, contratos, FAQs, manuais)

## Quando NÃO usar

- Base de conhecimento pequena (< 20 páginas) — coloca tudo no context window direto (mais simples e mais confiável)
- Perguntas que exigem raciocínio sobre TODA a base (sumarização global, contagem) — RAG traz amostras, não todos os dados
- Dados altamente estruturados (tabelas, números) — SQL direto é mais preciso
- Latência crítica — RAG adiciona 200-500ms por causa do retrieval

## Como pedir pra IA

> "Implementa um pipeline RAG completo em Python para [DOMÍNIO] usando LangChain + pgvector. Preciso de: (1) loader para [TIPO DE DOCUMENTO — PDF, HTML, etc], (2) estratégia de chunking explicando por que escolheu o tamanho, (3) embeddings com OpenAI text-embedding-3-small, (4) vector store com pgvector, (5) retriever com similarity threshold (mínimo 0.7), (6) chain completa com citação das fontes. Explica as escolhas de chunk_size e chunk_overlap."

## Como auditar o que a IA gerou

- [ ] Verificar se chunk_size e chunk_overlap são justificados para o tipo de documento
- [ ] Confirmar que há similarity threshold (não apenas top-k sem filtro de relevância)
- [ ] Checar se o retriever retorna metadados (filename, page, section) para citação de fontes
- [ ] Verificar se o prompt instrui o modelo a dizer "não sei" quando contexto não tem a resposta
- [ ] Confirmar que embeddings de indexação e de query usam o MESMO modelo (erro clássico)
- [ ] Verificar se há tratamento para chunks vazios ou muito curtos após o split
- [ ] Checar se o pipeline de indexação é incremental (não reindexar tudo a cada atualização)

## Armadilhas comuns

- **Chunks muito grandes** (> 1000 tokens) incluem texto irrelevante que dilui o sinal. O modelo recebe contexto demais e perde o foco
- **Chunks muito pequenos** (< 100 tokens) perdem contexto necessário para entender o significado. Um parágrafo fora de contexto pode ser incompreensível
- **Não filtrar por threshold de similarity** faz o retriever retornar chunks irrelevantes que o modelo vai usar para inventar respostas erradas
- **Embedding o texto errado** — em documentos com estrutura (título, seção, corpo), o que você deve embedar afeta o que você recupera. Considerar incluir metadados no texto a ser embedado
- **Não atualizar incrementalmente** — reindexar toda a base quando um documento muda é lento e caro

## Exemplo prático

```python
from langchain_anthropic import ChatAnthropic
from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# 1. Indexação (rode offline / em background)
def indexar_documentos(pdf_path: str, connection_string: str):
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    
    # RecursiveCharacterTextSplitter tenta preservar parágrafos e frases
    # chunk_size=800 é um bom ponto de partida para documentos técnicos
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,  # overlap previne cortar no meio de uma ideia
        separators=["\n\n", "\n", ".", "!", "?", ",", " "],
    )
    chunks = splitter.split_documents(docs)
    
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    
    vectorstore = PGVector.from_documents(
        documents=chunks,
        embedding=embeddings,
        connection=connection_string,
        collection_name="documentos_empresa",
    )
    return vectorstore

# 2. Retrieval + Generation (runtime)
def criar_rag_chain(vectorstore):
    # Retriever com threshold de similarity
    retriever = vectorstore.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={"k": 5, "score_threshold": 0.72},
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Você é um assistente que responde perguntas baseado nos documentos fornecidos.
        
REGRAS:
- Use APENAS as informações dos documentos abaixo
- Se a resposta não estiver nos documentos, diga explicitamente "Não encontrei essa informação nos documentos disponíveis"
- Cite o número da página quando possível
- Nunca invente informações

DOCUMENTOS:
{context}"""),
        ("human", "{question}"),
    ])
    
    llm = ChatAnthropic(model="claude-3-5-sonnet-20241022", temperature=0)
    
    def format_docs(docs):
        return "\n\n---\n\n".join(
            f"[Página {doc.metadata.get('page', '?')}]\n{doc.page_content}"
            for doc in docs
        )
    
    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    
    return chain

# Uso
chain = criar_rag_chain(vectorstore)
resposta = chain.invoke("Qual é a política de reembolso?")
```

**Métricas para avaliar seu RAG:**
- **Context Precision:** dos chunks recuperados, quantos eram realmente relevantes?
- **Context Recall:** dos chunks relevantes que existem, quantos foram recuperados?
- **Faithfulness:** a resposta gerada é fiel ao contexto recuperado (não alucina)?
- **Answer Relevance:** a resposta responde a pergunta feita?
