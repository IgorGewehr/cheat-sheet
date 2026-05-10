---
title: Contextual Retrieval & GraphRAG — Técnicas Modernas
category: agentes-ia
stack: [RAG, contextual retrieval, GraphRAG, HyDE, query rewriting]
tags: [rag, contextual-retrieval, graphrag, hyde, reranking]
excerpt: "Anthropic contextual retrieval (49% melhora), GraphRAG, HyDE, multi-query, query decomposition, hybrid search avançado — RAG production-grade 2026."
related: [rag-fundamentos, rag-avancado, graph-rag, ai-embeddings-2026]
updated: "2026-05-10"
---

## Por que naive RAG não basta

Pipeline básico (embed → store → retrieve → LLM) funciona em demos. Em produção falha:

- **Embeddings não capturam contexto** — chunks soltos perdem referência.
- **Single-query retrieval** — query ambígua = retrieval ambíguo.
- **Ranking depende só de similarity** — passages relevant podem ranquear baixo.
- **Falha em complex queries** — query "multi-hop" precisa raciocínio sobre múltiplos docs.

Cards `rag-fundamentos` e `rag-avancado` cobrem básicos. Esse aprofunda em técnicas que **fazem RAG funcionar em produção**.

## Anthropic Contextual Retrieval (2024)

Em set/2024, Anthropic publicou técnica que reduz **failed retrievals em 49%** (com reranking: 67%).

### O problema

Chunk típico não tem contexto:
```
[Chunk extraído]
"A receita cresceu 3% em comparação com Q2 anterior."
```

Que receita? Qual empresa? Qual Q2?

### A solução

Prepend chunk com **contexto explicativo** GERADO POR LLM antes de embed:

```python
async def contextualize_chunk(chunk: str, full_doc: str):
    response = await client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=200,
        system="You produce concise context summaries.",
        messages=[{
            "role": "user",
            "content": f"""
<document>
{full_doc}
</document>

Here is the chunk we want to situate within the whole document:
<chunk>
{chunk}
</chunk>

Please give a short succinct context (1-2 sentences) to situate this chunk within the overall document. Answer ONLY with the context, nothing else."""
        }]
    )
    return response.content[0].text

# Antes de embed
async def index_with_context(doc_id: str, content: str):
    chunks = chunk_text(content)
    for chunk in chunks:
        context = await contextualize_chunk(chunk, content)
        # Embed o contexto + chunk
        emb = await embed(f"{context}\n\n{chunk}")
        # Store both pra retrieval
        await db.insert({
            "doc_id": doc_id,
            "chunk_text": chunk,
            "context": context,
            "embedding": emb,
        })
```

### Custo

- Generation de context: usar Haiku (cheap, fast).
- Per chunk: ~$0.0001 em Haiku.
- Para 1M chunks: ~$100. One-shot cost (cache prompt!).

### Caching tip

```python
# System prompt + doc full pode ser cached (mesmo doc, muitos chunks)
response = await client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=200,
    system=[
        {"type": "text", "text": "You produce concise context summaries."},
        {
            "type": "text",
            "text": f"<document>\n{full_doc}\n</document>",
            "cache_control": {"type": "ephemeral"},  # cache doc across chunks
        }
    ],
    messages=[{"role": "user", "content": f"<chunk>{chunk}</chunk>\n\nProvide context."}]
)
```

90% economy nos chunks subsequentes. Em 1M chunks: $10 em vez de $100.

## Reranking

Embedding retrieval é fast mas approximate. Rerank top-K com modelo mais smart melhora precision dramatically.

```python
import cohere

co = cohere.Client(api_key=...)

# 1. Retrieve top 50 com embedding (fast, approximate)
candidate_chunks = await vector_search(query, k=50)

# 2. Rerank top 10 com Rerank model (slower, accurate)
rerank_result = co.rerank(
    model="rerank-3.5",
    query=query,
    documents=[c.text for c in candidate_chunks],
    top_n=10,
)

# Use rerank results
top_chunks = [candidate_chunks[r.index] for r in rerank_result.results]
```

### Reranking metrics

Em benchmark (Anthropic contextual retrieval paper):
- Naive RAG: 35% failed retrievals.
- + Contextual embeddings: 18% failed (49% reduction).
- + Contextual BM25: 12% failed.
- + Reranking: 6% failed (67% total reduction).

Combina tudo.

### Rerank model options (2026)

- **Cohere Rerank 3.5** — gold standard, $2/1k searches.
- **Voyage rerank-2** — competitive.
- **bge-reranker-v2-m3** — open-source, self-host.
- **Jina rerank-v2** — multilingual.

## HyDE — Hypothetical Document Embeddings

Query embed pode não casar com doc embed (queries são curtas/vagas, docs são longos/específicos).

HyDE: LLM gera **resposta hipotética** à query, embed essa resposta, search com ela.

```python
async def hyde_search(query: str, k: int = 10):
    # 1. Generate hypothetical answer
    hyp_answer = await client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": f"Write a hypothetical passage that would answer this query: {query}"
        }]
    )
    hyp_text = hyp_answer.content[0].text
    
    # 2. Embed the hypothetical
    hyp_emb = await embed(hyp_text)
    
    # 3. Search using hypothetical embedding (not query embedding)
    return await vector_search_with_embedding(hyp_emb, k=k)
```

Trade-off: 1 extra LLM call (cost + latency). Vale quando queries são vagas ("What's the company's strategy?" — query é abstract, docs are specific).

## Query Rewriting

LLM reescreve query pra retrieval melhor.

```python
async def rewrite_query(query: str, conversation_history: list = None) -> list[str]:
    """Generate multiple queries from user input."""
    response = await client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": f"""
Given a user query, generate 3 alternative phrasings that would help find relevant information.

Conversation history:
{conversation_history or 'None'}

Current query: {query}

Output as JSON: {{"queries": [str, str, str]}}"""
        }],
    )
    return json.loads(response.content[0].text)["queries"]

async def multi_query_retrieval(query: str, k: int = 10):
    """Retrieve com múltiplas formulações."""
    queries = await rewrite_query(query)
    all_results = []
    
    for q in queries:
        results = await vector_search(q, k=5)
        all_results.extend(results)
    
    # Dedupe by chunk_id
    seen = set()
    unique_results = []
    for r in all_results:
        if r.chunk_id not in seen:
            seen.add(r.chunk_id)
            unique_results.append(r)
    
    return unique_results[:k]
```

## Query Decomposition

Para complex multi-hop questions, decompose em sub-queries:

```python
async def decompose_query(query: str) -> list[str]:
    """Decompose complex query into atomic sub-queries."""
    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""
Decompose this query into atomic sub-questions if needed.
If query is atomic, return as-is.

Query: {query}

Output JSON: {{"sub_queries": [str]}}"""
        }]
    )
    return json.loads(response.content[0].text)["sub_queries"]

# Example
# Query: "Compare Q3 2024 revenue between ACME and Globex"
# Sub-queries: [
#   "ACME Q3 2024 revenue",
#   "Globex Q3 2024 revenue"
# ]

# Retrieve each, then LLM compose
async def multi_hop_retrieval(query: str):
    sub_queries = await decompose_query(query)
    contexts = []
    for sq in sub_queries:
        chunks = await vector_search(sq, k=5)
        contexts.append({"sub_query": sq, "chunks": chunks})
    
    # Compose answer with all contexts
    return await answer_with_contexts(query, contexts)
```

## GraphRAG — knowledge graphs + RAG

Microsoft GraphRAG (2024) usa knowledge graph estruturado em vez de só chunks:

```
1. Extract entities + relationships from docs (LLM)
2. Build graph (nodes: entities, edges: relationships)
3. Detect communities (Leiden algorithm)
4. Summarize each community (LLM)
5. Query: identify relevant communities → use community summary as context
```

Vantagem: lida com "global" questions (sobre todo corpus, não chunk-local).
- "What are the main themes in these 1000 documents?"
- "Who interacts with who across this dataset?"

Cost alto (LLM-heavy indexing). Vale pra corpus com structure relacional implícita (filmes + atores, papers + citações).

Ver card dedicated `graph-rag`.

## Parent-document Retrieval

Chunks pequenos pra retrieval (precisão), parent doc pra LLM (contexto).

```python
# Index: store small chunks + reference to parent
async def index_with_parents(doc_id: str, content: str):
    # Split em parent chunks (grandes)
    parent_chunks = split_text(content, chunk_size=2000)
    
    for p_idx, parent in enumerate(parent_chunks):
        parent_id = f"{doc_id}:p{p_idx}"
        await store_parent(parent_id, parent)
        
        # Split parent em child chunks (small)
        child_chunks = split_text(parent, chunk_size=400)
        
        for c_idx, child in enumerate(child_chunks):
            child_emb = await embed(child)
            await store_child({
                "id": f"{parent_id}:c{c_idx}",
                "embedding": child_emb,
                "text": child,
                "parent_id": parent_id,
            })

# Retrieve: search child, return parent
async def parent_retrieval(query: str, k: int = 5):
    child_results = await vector_search(query, k=k)
    parent_ids = list(set(c.parent_id for c in child_results))
    parents = await get_parents(parent_ids)
    return parents
```

Combina best of both: precision pequena + contexto rich.

## Hybrid search — sparse + dense

Já mencionado em `ai-embeddings-2026`. Detalhamento:

```python
async def hybrid_retrieval(query: str, alpha: float = 0.5, k: int = 10):
    # Sparse (BM25)
    bm25_results = bm25_search(query, k=k*2)
    
    # Dense (vector)
    query_emb = await embed(query)
    vector_results = await vector_search(query_emb, k=k*2)
    
    # Reciprocal Rank Fusion (RRF)
    scores = {}
    for rank, result in enumerate(bm25_results):
        scores[result.id] = scores.get(result.id, 0) + 1 / (60 + rank)
    
    for rank, result in enumerate(vector_results):
        scores[result.id] = scores.get(result.id, 0) + 1 / (60 + rank)
    
    # Top k by combined score
    ranked = sorted(scores.items(), key=lambda x: -x[1])[:k]
    return [get_chunk(id) for id, _ in ranked]
```

Hybrid frequentemente +10-20% Recall@10 vs dense-only.

## Time-aware RAG

Para corpus com timestamps (news, logs):

```python
async def time_weighted_retrieval(query: str, k: int = 10):
    results = await vector_search(query, k=k*3)  # extra
    
    # Weight by recency
    now = datetime.now()
    for r in results:
        age_days = (now - r.created_at).days
        decay = math.exp(-age_days / 30)  # exponential decay, half-life 30 days
        r.adjusted_score = r.score * decay
    
    return sorted(results, key=lambda r: -r.adjusted_score)[:k]
```

Ou explicit time filter:
```python
# "What happened last week?" → filter by date range
date_filter = {"start": now - timedelta(days=7), "end": now}
results = await vector_search(query, k=10, filters={"date": date_filter})
```

## Self-querying retrieval

LLM extrai filtros + semantic query from user input:

```python
# User: "Show me Python tutorials from 2024 about FastAPI"
# Decompose:
# - semantic_query: "Python FastAPI tutorial"
# - filters: {language: "python", topic: "fastapi", year: 2024}

response = await client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=300,
    response_model=SelfQuery,
    messages=[{"role": "user", "content": f"Parse: {user_query}"}]
)

results = await vector_search(
    query=response.semantic_query,
    filters=response.filters,
    k=10,
)
```

Funciona bem se metadata schema for previsível. LangChain SelfQueryRetriever implementa.

## Iterative retrieval (agentic)

Agent decides if more retrieval needed:

```python
async def agentic_retrieval(query: str, max_iters: int = 3):
    contexts = []
    
    for iter in range(max_iters):
        # Agent decide what to search
        decision = await client.messages.create(
            model="claude-sonnet-4-6",
            tools=[{
                "name": "search",
                "description": "Search the knowledge base",
                "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}}
            }, {
                "name": "finish",
                "description": "Stop searching, have enough context",
                "input_schema": {}
            }],
            messages=[
                {"role": "user", "content": query},
                {"role": "user", "content": f"Current contexts: {contexts}"},
            ]
        )
        
        for block in decision.content:
            if block.type == "tool_use":
                if block.name == "finish":
                    return contexts
                elif block.name == "search":
                    results = await vector_search(block.input["query"])
                    contexts.extend(results)
    
    return contexts
```

Custa mais (multiple LLM calls + retrievals), but lida com complex queries melhor.

## Citation tracking

Em production RAG, user precisa ver fontes:

```python
async def answer_with_citations(query: str):
    chunks = await retrieve(query, k=10)
    
    # Number chunks for citation
    context = "\n\n".join([
        f"[{i+1}] {chunk.text}" for i, chunk in enumerate(chunks)
    ])
    
    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system="""You answer questions using ONLY the provided context.
Cite sources inline as [1], [2], etc.""",
        messages=[{
            "role": "user",
            "content": f"<context>\n{context}\n</context>\n\nQuestion: {query}"
        }]
    )
    
    # Parse citations
    answer_text = response.content[0].text
    citations = re.findall(r'\[(\d+)\]', answer_text)
    used_chunks = [chunks[int(c)-1] for c in set(citations)]
    
    return {
        "answer": answer_text,
        "citations": [
            {"id": c.id, "source": c.metadata["source"], "excerpt": c.text[:200]}
            for c in used_chunks
        ]
    }
```

UI mostra "[1]" clicável → tooltip com fonte.

## Eval — necessário para iterar

```python
# Golden dataset
golden = [
    {"query": "What's the refund policy?", "expected_chunks": ["chunk-123", "chunk-456"]},
    # ... 100+ pairs
]

async def eval_retrieval_strategy(strategy_fn, golden):
    recalls = []
    for item in golden:
        retrieved = await strategy_fn(item["query"], k=10)
        retrieved_ids = [r.id for r in retrieved]
        recall = len(set(retrieved_ids) & set(item["expected_chunks"])) / len(item["expected_chunks"])
        recalls.append(recall)
    return sum(recalls) / len(recalls)

# A/B test
naive_recall = await eval_retrieval_strategy(naive_rag, golden)
contextual_recall = await eval_retrieval_strategy(contextual_rag, golden)
hybrid_recall = await eval_retrieval_strategy(hybrid_rag, golden)
```

Card `ai-eval-driven-dev` detalha mais.

## Stack recommendations 2026

Para production RAG, recommended baseline:

1. **Embedding**: text-embedding-3-large ou Voyage 3 (or multilingual Cohere).
2. **Contextual chunks** (Anthropic) — pre-process antes de embed.
3. **Vector DB**: pgvector pra começar, Qdrant em escala.
4. **Hybrid search**: dense + BM25 com RRF.
5. **Reranker**: Cohere Rerank 3.5.
6. **Query rewriting** opcional (vale em queries variáveis).
7. **Citation tracking** obrigatório.
8. **Eval pipeline** sempre.

## Common pitfalls

### 1. Demos com retriever sem reranker

Em demos com 100 docs, naive RAG basta. Production scale (>1M chunks), reranker é mandatory.

### 2. Chunk size sem testar

Pegou default 1000 tokens. Em código (estrutura linear) talvez 200 melhor. Em legal (denso) talvez 2000. Test.

### 3. Embed model "default"

text-embedding-ada-002 ainda em production. Era state-of-art 2022. Em 2026: switch pra v3 large ou Voyage 3.

### 4. Sem context tags em prompt

```python
# ❌ LLM confunde context com instruction
prompt = f"{context}\n\n{question}"

# ✅ XML tags claras (Claude treinado em XML structure)
prompt = f"<context>\n{context}\n</context>\n\n<question>{question}</question>"
```

### 5. Sem citation tracking

User não sabe de onde resposta vem. Trust dropa. Citations are mandatory.

## Checklist — RAG production

- [ ] Contextual retrieval (Anthropic style) implementado?
- [ ] Reranker em pipeline?
- [ ] Hybrid search (dense + sparse)?
- [ ] Chunk size testado pra domínio?
- [ ] Citation tracking em responses?
- [ ] Eval pipeline com golden dataset?
- [ ] Recall@10 medido (>80%)?
- [ ] Multilingual handled?
- [ ] Query rewriting / decomposition pra complex Qs?
- [ ] Time-aware se temporal data?
- [ ] Self-querying se metadata-rich?

## Leituras

- Anthropic "Contextual Retrieval" announcement (anthropic.com/news/contextual-retrieval)
- "GraphRAG" — Microsoft research blog
- "HyDE" — Gao et al. 2022 paper
- "RAG vs Fine-tuning" — research comparison papers
- Ragas docs (docs.ragas.io)
- LangChain RAG patterns docs
- "RAG From Scratch" — series Jerry Liu (LlamaIndex)
