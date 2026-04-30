---
title: "Graph RAG — RAG com Grafos de Conhecimento"
category: agentes-ia
stack: [Python, Neo4j, LangChain, LangGraph]
tags: [graph-rag, knowledge-graph, entity-extraction, neo4j]
excerpt: "Graph RAG resolve queries sobre relacionamentos que vector RAG não consegue responder — mas com complexidade significativamente maior. Use só quando relacionamentos são o núcleo do problema."
related: [rag-fundamentos, rag-avancado, vector-databases]
updated: 2026-04
---

## O que é

Vector RAG recupera chunks de texto por similaridade semântica. Isso funciona bem para perguntas do tipo "o que esse documento diz sobre X?", mas falha para perguntas do tipo "quais empresas estão relacionadas a João Silva via contratos firmados em 2024?" — perguntas sobre relacionamentos entre entidades.

**Graph RAG** representa o conhecimento como um grafo onde entidades são nós (Pessoa, Empresa, Contrato, Produto) e relacionamentos são arestas (TRABALHA_EM, ASSINOU, FORNECE_PARA). Queries sobre relacionamentos são respondidas por traversal de grafo — muito mais eficiente e preciso que busca semântica para esse tipo de pergunta.

**Microsoft GraphRAG** é uma implementação específica que usa algoritmos de detecção de comunidade (como Leiden) para identificar grupos de entidades relacionadas, e gera "relatórios de comunidade" que capturam conhecimento global. Suporta dois modos: **Local Search** (informações sobre entidades específicas) e **Global Search** (perguntas que exigem síntese de toda a base).

**O pipeline de construção** tem três fases custosas: (1) extração de entidades e relacionamentos de documentos (um LLM call por chunk), (2) deduplicação (mesmo entidade mencionada de formas diferentes — "Petrobras", "Petróleo Brasileiro S.A.", "PETR4"), (3) construção do grafo. Isso custa caro e demora — é uma operação offline, não realtime.

**Combinando vector + graph:** o pattern mais poderoso é usar vector search para encontrar entidades relevantes, e depois graph traversal para expandir o contexto com relacionamentos. LangChain tem integração nativa com Neo4j para isso.

## Quando usar

- Queries sobre relacionamentos entre entidades (quem conhece quem, qual empresa fornece para qual)
- Base de conhecimento com estrutura de rede densa (supply chain, organogramas, grafos de dependências)
- Quando você precisa de "busca global" — perguntas que só podem ser respondidas sintetizando toda a base
- Análise de compliance onde rastrear cadeia de relacionamentos é obrigatório

## Quando NÃO usar

- Quando a maioria das queries é sobre conteúdo de documentos, não sobre relacionamentos entre entidades
- Quando você não tem recurso para construir e manter o grafo de conhecimento (é significativamente mais complexo que vector RAG)
- Para dados que mudam frequentemente (atualizar o grafo é custoso)
- Como primeira abordagem — experimente vector RAG avançado primeiro, vá para Graph RAG apenas se realmente precisar

## Como pedir pra IA

> "Implementa um pipeline Graph RAG em Python usando Neo4j + LangChain para [DOMÍNIO]. Preciso de: (1) extração de entidades e relacionamentos de documentos com Claude (define o schema de entidades para o domínio), (2) deduplicação básica de entidades por nome canônico, (3) queries em linguagem natural convertidas para Cypher com LLM, (4) combinação de resultados do grafo com vector search para contexto textual. Domínio: [DOMÍNIO COM ENTIDADES — ex: contratos de fornecimento com Fornecedor, Produto, Contrato, CNPJ]."

## Como auditar o que a IA gerou

- [ ] Verificar se extração de entidades tem schema bem definido (não extrai entidades genéricas)
- [ ] Confirmar que deduplicação de entidades existe (sem ela, o grafo fica fragmentado)
- [ ] Verificar se queries Cypher geradas por LLM são validadas antes de executar (risco de injection)
- [ ] Checar se há tratamento para queries Cypher malformadas (o LLM às vezes gera Cypher inválido)
- [ ] Confirmar que os IDs de entidades no grafo são estáveis (não mudam entre indexações)
- [ ] Verificar se há índices no Neo4j para os campos usados em filtros (performance)

## Armadilhas comuns

- **Extrair entidades sem schema** — sem um schema definido, você vai ter "João", "João Silva", "Sr. João" como entidades separadas para a mesma pessoa
- **Cypher injection** — nunca execute Cypher diretamente do output do LLM sem validação. O modelo pode ser induzido a gerar queries destrutivas (`MATCH (n) DETACH DELETE n`)
- **Grafo desatualizado** — o grafo reflete os documentos indexados no momento da construção. Se os documentos mudam, o grafo fica stale
- **Microsoft GraphRAG como primeira opção** — é complexo, caro para construir e não é o certo para todos os casos. Avalie se o problema realmente exige busca global

## Exemplo prático

```python
from langchain_neo4j import Neo4jGraph, GraphCypherQAChain
from langchain_anthropic import ChatAnthropic
from langchain_openai import OpenAIEmbeddings
from langchain.graphs.graph_document import GraphDocument, Node, Relationship
from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_core.documents import Document
from pydantic import BaseModel
from typing import Optional

# Schema de entidades para o domínio (exemplo: fornecedores)
SCHEMA_INSTRUCOES = """
Extraia APENAS estas entidades e relacionamentos:

ENTIDADES:
- Empresa: {nome, cnpj, segmento}
- Produto: {nome, codigo_ncm, categoria}
- Contrato: {numero, valor_total, data_inicio, data_fim}
- Pessoa: {nome, cpf, cargo}

RELACIONAMENTOS:
- (Empresa)-[:FORNECE]->(Produto)
- (Empresa)-[:ASSINOU]->(Contrato)
- (Pessoa)-[:REPRESENTA]->(Empresa)
- (Contrato)-[:INCLUI]->(Produto)

Regras de deduplicação:
- Nomes de empresa: use a razão social exata (normalizada para maiúsculas)
- CNPJ: sempre sem pontuação (apenas dígitos)
- Se uma entidade não tem dados suficientes para identificação única, NÃO extraia
"""

llm = ChatAnthropic(model="claude-3-5-sonnet-20241022", temperature=0)
graph = Neo4jGraph(
    url="bolt://localhost:7687",
    username="neo4j",
    password="senha",
)

# Extração de entidades e relacionamentos
transformer = LLMGraphTransformer(
    llm=llm,
    node_properties=["nome", "cnpj", "valor_total"],
    relationship_properties=["data_assinatura"],
    prompt=SCHEMA_INSTRUCOES,
)

def indexar_documento(texto: str, documento_id: str):
    doc = Document(page_content=texto, metadata={"documento_id": documento_id})
    graph_docs = transformer.convert_to_graph_documents([doc])
    graph.add_graph_documents(graph_docs, include_source=True)

# Query em linguagem natural → Cypher
cypher_chain = GraphCypherQAChain.from_llm(
    llm=llm,
    graph=graph,
    verbose=True,
    validate_cypher=True,  # Valida antes de executar
    top_k=10,
)

# Exemplo de query
resultado = cypher_chain.invoke(
    "Quais empresas forneceram produtos da categoria 'eletrônicos' em contratos acima de R$ 100.000?"
)
print(resultado["result"])

# Hybrid search: vector + graph
from langchain_neo4j import Neo4jVector
from langchain_openai import OpenAIEmbeddings

# Indexa chunks de texto com embedding E metadados de entidades
vector_index = Neo4jVector.from_existing_graph(
    embedding=OpenAIEmbeddings(model="text-embedding-3-small"),
    graph=graph,
    node_label="Contrato",
    text_node_properties=["nome", "descricao"],
    embedding_node_property="embedding",
)

def hybrid_search(query: str, empresa_cnpj: Optional[str] = None):
    """Combina vector search com graph traversal."""
    # 1. Vector search para encontrar contratos relevantes
    contratos = vector_index.similarity_search(query, k=10)
    
    # 2. Graph traversal para encontrar entidades relacionadas
    cypher = """
    MATCH (c:Contrato)-[:INCLUI]->(p:Produto)
    MATCH (e:Empresa)-[:ASSINOU]->(c)
    WHERE c.numero IN $numeros
    RETURN c, collect(p.nome) as produtos, e.nome as empresa
    """
    numeros = [c.metadata.get("numero") for c in contratos if c.metadata.get("numero")]
    graph_data = graph.query(cypher, {"numeros": numeros})
    
    return {"documentos": contratos, "grafo": graph_data}
```

**Quando Graph RAG realmente vale:**
Em um sistema de análise de supply chain com 50k documentos de contratos, Graph RAG permite responder "qual é o fornecedor de terceiro nível que tem mais contratos com fornecedores que tiveram não-conformidade nos últimos 6 meses?" — uma query impossível com vector search. Para perguntas simples sobre conteúdo de contratos individuais, vector RAG continua sendo mais rápido e mais barato.
