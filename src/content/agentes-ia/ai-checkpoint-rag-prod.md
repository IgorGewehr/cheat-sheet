---
title: "Checkpoint Tier 2: Production RAG + Eval Suite"
category: checklists
stack: [RAG, pgvector, Cohere Rerank, Ragas]
tags: [checkpoint, rag, production, evals, ragas]
excerpt: "Validação do Tier 2 — Build RAG sobre corpus técnico complexo (legal, scientific, médico) com contextual retrieval + reranking + eval suite com Ragas."
related: [ai-rag-contextual, ai-eval-driven-dev, ai-embeddings-2026]
updated: "2026-05-10"
---

## Objetivo

Construir **production-grade RAG** (não demo). Diferenças vs Tier 1 checkpoint:
- Corpus real complex (não 5 PDFs simples).
- Múltiplas técnicas (contextual retrieval, hybrid, reranking).
- **Eval suite obrigatório** (Ragas + custom golden dataset).
- Monitoring continuous em production-like setting.

## Critério de aprovação

- **App RAG funcional** sobre corpus técnico de ~1000+ docs.
- **Eval suite** com 50+ golden queries.
- **Metrics**: Recall@10 ≥ 80%, Faithfulness ≥ 0.85.
- **A/B test** documentado: naive vs contextual vs hybrid+reranker.
- **Citation tracking** em UI (user clica → vê fonte).
- **Performance dashboard**: latency, cost, eval scores tracked.
- **Submissão via /sentinela**.

## Tempo estimado: 40-80h

## Corpus suggestions

Escolha um corpus desafiador (não wikipedia genérica):

### A. **Legal corpus**
- Brazilian Civil Code (Lei 10.406/2002) — ~2000 pages.
- LGPD (Lei 13.709/2018) + decretos.
- ANPD guidance documents.
- Use case: "legal assistant" para queries jurídicas.

### B. **Scientific papers**
- ArXiv papers em um sub-field (NLP, vision, robotics).
- 500-2000 papers.
- Use case: research assistant for related work.

### C. **Medical knowledge base**
- WHO clinical guidelines.
- Manual MSD.
- Use case: clinical decision support (educational, not medical advice).

### D. **Code documentation**
- Documentação completa de framework (Django, React, Rails).
- Source code repositories.
- Use case: code assistant for that framework.

### E. **Company-internal**
- Sua empresa: handbook + technical docs + tickets.
- 100-500 docs.
- Use case: internal Q&A assistant.

Corpus deve ter:
- **Volume** (>500 chunks após processing).
- **Complexity** (terminologia técnica, structure).
- **Variety** (diff document types).

## Arquitetura obrigatória

```
                          ┌─────────────────┐
   User Query  ──────────►│ Query Rewriter  │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │  Multi-Query    │ (3 reformulations)
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │  Hybrid Search  │
                          │  (Dense + BM25) │
                          └────────┬────────┘
                                   │ Top 50
                          ┌────────▼────────┐
                          │   Reranker      │ Cohere Rerank 3.5
                          └────────┬────────┘
                                   │ Top 10
                          ┌────────▼────────┐
                          │  LLM (Claude)   │ Com citations
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │ Answer + Cites  │
                          └─────────────────┘
```

## Stack obrigatória

**Backend:**
- Python + FastAPI.
- Anthropic SDK pro generation + Claude Haiku pro contextualization.
- Cohere SDK pra Rerank.
- OpenAI ou Voyage SDK pra embeddings.
- pgvector ou Qdrant pra vector store.
- BM25 (rank-bm25 lib) ou Postgres FTS pra sparse.

**Eval:**
- Ragas pra automated metrics.
- pytest pra orchestration.
- LangSmith ou Langfuse pra observability (opcional mas recomendado).

**Frontend:**
- Next.js ou Streamlit (UI focada em backend para checkpoint).
- Citation rendering (clicáveis).

## Pipeline obrigatório

### 1. Document ingestion

```python
async def ingest_doc(doc_path: str):
    # 1. Extract content (PDF, HTML, markdown)
    content = extract_content(doc_path)
    
    # 2. Chunk
    chunks = recursive_chunk(content, chunk_size=1000, overlap=200)
    
    # 3. Contextualize each chunk (Anthropic technique)
    for chunk in chunks:
        context = await contextualize(chunk, full_doc=content)
        chunk["context"] = context
    
    # 4. Embed (with cache)
    embeddings = await embed_batch(
        [f"{c['context']}\n\n{c['text']}" for c in chunks],
        model="text-embedding-3-large",
    )
    
    # 5. Store
    for chunk, emb in zip(chunks, embeddings):
        await db.insert_chunk({
            "doc_id": doc_path,
            "chunk_text": chunk["text"],
            "context": chunk["context"],
            "embedding": emb,
            "metadata": {...}
        })
    
    # 6. Index BM25
    bm25.add_documents([f"{c['context']} {c['text']}" for c in chunks])
```

### 2. Hybrid retrieval

```python
async def hybrid_retrieve(query: str, k: int = 50) -> list:
    # Multi-query
    rewrites = await rewrite_query(query, n=3)
    
    all_results = []
    for q in [query] + rewrites:
        # Dense
        q_emb = await embed(q, input_type="search_query")
        dense_results = await vector_search(q_emb, k=k)
        
        # Sparse
        sparse_results = bm25.get_top_n(q.split(), n=k)
        
        # RRF combine
        combined = reciprocal_rank_fusion(dense_results, sparse_results)
        all_results.extend(combined)
    
    # Dedupe + return top k
    seen = set()
    unique = []
    for r in all_results:
        if r.chunk_id not in seen:
            seen.add(r.chunk_id)
            unique.append(r)
    
    return unique[:k]
```

### 3. Reranking

```python
import cohere
co = cohere.Client()

async def rerank(query: str, candidates: list, k: int = 10):
    response = co.rerank(
        model="rerank-3.5",
        query=query,
        documents=[c.text for c in candidates],
        top_n=k,
    )
    return [candidates[r.index] for r in response.results]
```

### 4. Generation with citations

```python
async def answer_with_citations(query: str, chunks: list):
    context = "\n\n".join([
        f"[{i+1}] (Source: {c.metadata.get('source')}) {c.context}\n{c.text}"
        for i, c in enumerate(chunks)
    ])
    
    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system="""You are a research assistant.
Answer using ONLY the provided context.
Cite sources inline as [1], [2], etc.
If unsure or context is insufficient, say so.""",
        messages=[{
            "role": "user",
            "content": f"<context>\n{context}\n</context>\n\nQuestion: {query}"
        }]
    )
    
    answer = response.content[0].text
    
    # Parse citations
    cited_indices = set(int(c) for c in re.findall(r'\[(\d+)\]', answer))
    citations = [{
        "id": chunks[i-1].id,
        "source": chunks[i-1].metadata.get("source"),
        "excerpt": chunks[i-1].text[:300],
    } for i in cited_indices]
    
    return {"answer": answer, "citations": citations}
```

## Eval suite obrigatório

### Golden dataset

```python
# golden_dataset.json
[
    {
        "id": "gd-001",
        "query": "What's the deadline for filing complaints under LGPD?",
        "expected_chunks": ["lgpd-art52-chunk-1", "lgpd-decreto-chunk-3"],
        "expected_answer_must_mention": ["6 months", "ANPD", "data subject"],
        "expected_answer_must_not_mention": [],
        "difficulty": "medium",
        "category": "deadlines",
    },
    # ... 50+ items
]
```

### Ragas eval pipeline

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from datasets import Dataset

async def run_eval_suite(golden_path: str):
    golden = load_golden(golden_path)
    
    eval_data = {"question": [], "answer": [], "contexts": [], "ground_truth": []}
    
    for item in golden:
        # Run RAG
        result = await rag_pipeline(item["query"])
        
        eval_data["question"].append(item["query"])
        eval_data["answer"].append(result["answer"])
        eval_data["contexts"].append([c.text for c in result["chunks"]])
        eval_data["ground_truth"].append(item["expected_answer"])
    
    dataset = Dataset.from_dict(eval_data)
    result = evaluate(
        dataset,
        metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
    )
    
    return result
```

### Custom metrics

```python
async def recall_at_k(golden_chunks: list, retrieved_chunks: list, k: int) -> float:
    """% of expected chunks retrieved no top K."""
    retrieved_ids = [c.id for c in retrieved_chunks[:k]]
    return len(set(golden_chunks) & set(retrieved_ids)) / len(golden_chunks)

async def mention_check(answer: str, must_mention: list, must_not_mention: list) -> dict:
    answer_lower = answer.lower()
    return {
        "mentioned_all": all(m.lower() in answer_lower for m in must_mention),
        "no_violations": not any(m.lower() in answer_lower for m in must_not_mention),
    }
```

## A/B Test obrigatório

Document comparison entre 3 strategies:

### Strategy 1: Naive RAG (baseline)

```python
async def naive_rag(query: str):
    q_emb = await embed(query)
    chunks = await vector_search(q_emb, k=10)
    return await generate_answer(query, chunks)
```

### Strategy 2: Contextual retrieval

```python
async def contextual_rag(query: str):
    # Contextual chunks (já indexed com context)
    q_emb = await embed(query)
    chunks = await vector_search(q_emb, k=10)
    return await generate_answer(query, chunks)
```

### Strategy 3: Hybrid + Reranker (full)

```python
async def full_rag(query: str):
    candidates = await hybrid_retrieve(query, k=50)
    top_chunks = await rerank(query, candidates, k=10)
    return await generate_answer(query, top_chunks)
```

### Compare results

```python
strategies = {
    "naive": naive_rag,
    "contextual": contextual_rag,
    "full": full_rag,
}

results = {}
for name, fn in strategies.items():
    results[name] = await run_eval_suite_with_strategy(golden, fn)

# Report
print(f"""
| Strategy   | Recall@10 | Faithfulness | Context Precision |
|------------|-----------|--------------|-------------------|
| Naive      | {results['naive']['recall']:.2%} | {results['naive']['faithfulness']:.2%} | {results['naive']['precision']:.2%} |
| Contextual | {results['contextual']['recall']:.2%} | ... |
| Full       | {results['full']['recall']:.2%} | ... |
""")
```

Expected (Anthropic data): contextual ~49% better failed retrievals than naive. Full ~67% better.

## Performance dashboard

```python
# Track per query
@app.middleware("http")
async def track_metrics(request, call_next):
    start = time.time()
    response = await call_next(request)
    latency = time.time() - start
    
    if request.url.path == "/query":
        # Extract usage from response (custom header)
        await metrics.publish({
            "latency_ms": latency * 1000,
            "input_tokens": ...,
            "cache_hit_rate": ...,
            "cost_usd": ...,
        })
    
    return response
```

Dashboard mostra:
- P50/P99 latency per stage (retrieve, rerank, generate).
- Cost per query.
- Cache hit rate.
- Eval scores over time (run nightly).
- Failed queries (low confidence or user feedback negative).

## Hand-in deliverables

```
rag-checkpoint/
├── README.md                    # arquitetura + decisions + cost analysis
├── corpus/                      # documents indexed (ou link external)
├── ingestion/
│   ├── pipeline.py              # ingestion script
│   └── contextualize.py
├── api/
│   ├── main.py                  # FastAPI app
│   ├── retrieve.py              # hybrid + rerank
│   └── generate.py              # answer with citations
├── eval/
│   ├── golden_dataset.json      # 50+ items
│   ├── run_eval.py              # Ragas pipeline
│   ├── ab_compare.py            # naive vs contextual vs full
│   └── eval_results.md          # comparison report
├── ui/
│   └── (Next.js/Streamlit)
├── dashboards/
│   └── metrics.md               # cost, latency, eval trends
└── demo.mp4
```

## README template

```markdown
# [Name] — Production RAG Checkpoint

## Stack
- Embeddings: text-embedding-3-large (multilingual)
- Vector DB: pgvector
- Sparse: rank-bm25
- Reranker: Cohere Rerank 3.5
- Generator: Claude Sonnet 4.6
- Eval: Ragas + custom

## Corpus
- [Brief description, # docs, # chunks]
- Total tokens: [N]
- Indexing time: [X hours]
- Indexing cost: $[Y]

## Architecture
[ASCII diagram of pipeline]

## Eval results (A/B comparison)

|              | Recall@10 | Faithfulness | Answer Relevancy | Latency p50 | Cost/query |
|--------------|-----------|--------------|------------------|-------------|------------|
| Naive RAG    | 62%       | 0.71         | 0.78             | 1.2s        | $0.005     |
| Contextual   | 80%       | 0.84         | 0.86             | 1.4s        | $0.007     |
| **Full**     | **89%**   | **0.91**     | **0.92**         | 2.1s        | $0.012     |

Improvement: +44% Recall, +28% Faithfulness vs naive.

## Cost analysis
- Indexing one-shot: $X (with prompt caching of source doc)
- Per query: $0.012 avg
- Monthly @ 10k queries: $120

## Trade-offs
- Cohere rerank adds 200ms latency but +9% Recall — worth it.
- Multi-query adds 300ms but vague queries become 2x more accurate.
- Contextual retrieval doubles indexing cost but pays for itself in production accuracy.

## Limitations
- ...

## Future improvements
- Adaptive K (more chunks for complex queries)
- Domain-specific embeddings (Voyage finance)
- Active learning loop (user feedback into golden dataset)
```

## Submissão /sentinela

Criteria:

- **All 50+ golden queries** running through eval pipeline?
- **Recall@10 ≥ 80%** demonstrably?
- **Faithfulness ≥ 0.85**?
- **A/B comparison table** clear?
- **Citation rendering** funcional na UI?
- **Performance metrics** tracked?
- **Cost projected accurately**?
- **Trade-offs explícitos** no README?

## Common pitfalls

### 1. Golden dataset todo "fácil"
50 queries all simple lookups. Doesn't stress-test system. Mix difficulty.

### 2. Eval em subset menor não-representativo
20 queries de 1 categoria. Use 50+, all categories.

### 3. Reranker pulado
"Adds latency, skip". -10-20% Recall. Vale.

### 4. Sem citation tracking
User vê resposta mas não a source. Trust = low. Mandatory.

### 5. Recall@10 sem context_precision
80% recall mas chunks são irrelevantes. Both metrics matter.

## Após PASS

Tier 3: Agents & MCP. Você pega o RAG construído aqui e wraps em agents agentic.

## Recursos

- Anthropic "Contextual Retrieval" blog post
- Ragas docs (docs.ragas.io)
- "Building Production RAG" — multiple Talks
- Pinecone "Vector Database Buying Guide"
- Cohere Rerank docs
