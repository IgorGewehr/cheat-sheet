---
title: Embeddings Modernos — Voyage, OpenAI, Cohere, BGE
category: agentes-ia
stack: [embeddings, Voyage, OpenAI, Cohere, BGE, MTEB]
tags: [embeddings, voyage, openai, cohere, bge, matryoshka]
excerpt: "Comparison de embedding models 2026 — Voyage 3, OpenAI text-embedding-3, Cohere v3, BGE M3. MTEB benchmark, dimensão, Matryoshka, multilingual."
related: [vector-databases, ai-rag-contextual, ai-cost-optimization]
updated: "2026-05-10"
---

## Embedding model = qualidade RAG

Em RAG, **embeddings** mapeiam texto → vector. Qualidade do embedding determina qualidade do retrieval. Se você embeda mal, retrieval falha — e LLM responde com fontes erradas, no matter how good o modelo.

Embedding errado = "GIGO" (Garbage In, Garbage Out) em produção.

## MTEB — benchmark canônico

[MTEB](https://huggingface.co/spaces/mteb/leaderboard) (Massive Text Embedding Benchmark) tem 56 tasks. Lidera 2026:

Para inglês:
- **Voyage 3 / 3-large** — top tier consistently, especializado por domínio (code, law, finance).
- **OpenAI text-embedding-3-large** — strong default, $0.13/1M tokens.
- **Cohere embed-multilingual-v3** — multilingual top.
- **BGE M3** (BAAI) — open-source, top open.
- **NV-Embed-v2** (NVIDIA) — strong open-source.
- **e5-mistral-7b-instruct** — open, ranked top in some categories.

Para português especificamente, multilingual models (Cohere v3, BGE M3) frequently outperform pure English models.

**MTEB tem viés** — benchmark é principalmente search e classification. Seu domínio pode diferir. **Test on your data** sempre.

## Provider comparison 2026

| Model | Dim | Max input | Multilingual | $/1M | Open? |
|-------|-----|-----------|--------------|------|-------|
| **OpenAI text-embedding-3-small** | 1536 (configurable) | 8191 | Sim | $0.02 | ✗ |
| **OpenAI text-embedding-3-large** | 3072 (configurable) | 8191 | Sim | $0.13 | ✗ |
| **Voyage 3** | 1024 | 32k | Limited | $0.06 | ✗ |
| **Voyage 3-large** | 1024 | 32k | Limited | $0.18 | ✗ |
| **Voyage code-3** | 1024 | 32k | Code | $0.18 | ✗ |
| **Cohere embed-english-v3** | 1024 | 512 | English | $0.10 | ✗ |
| **Cohere embed-multilingual-v3** | 1024 | 512 | 100+ langs | $0.10 | ✗ |
| **BGE M3** | 1024 | 8192 | 100+ langs | Self-host | ✓ Apache 2.0 |
| **bge-large-en-v1.5** | 1024 | 512 | English | Self-host | ✓ |
| **nomic-embed-text-v1.5** | 768 (Matryoshka) | 8192 | English | Self-host | ✓ |

## Matryoshka Representation Learning

Modelos modernos suportam **Matryoshka embeddings** — embed once, truncate para dimensão menor sem perder muita qualidade.

```python
# OpenAI text-embedding-3 permite dimension truncation
from openai import OpenAI
client = OpenAI()

response = client.embeddings.create(
    model="text-embedding-3-large",
    input="Hello world",
    dimensions=512,  # Default 3072, truncate para 512
)
# Embedding agora 512 dim em vez de 3072
# ~85% da qualidade com ~17% do storage
```

Trade-off: storage/cost vs qualidade. 512-dim suficiente pra muitas tasks; 3072 é overkill.

**Quando reduzir dimensão**:
- Storage caro (Pinecone, Qdrant cobram por dimensão × vectors).
- Latency crítica (busca em vectors menores é mais rápida).
- Acceptable accuracy loss em domínio.

Test: embed dataset com full dim + dims menores, compare retrieval metrics.

## Specialized models

### Code embedding

```python
# Voyage code-3 — especializado em code search
response = voyage.embed(
    texts=["def hello(): print('hi')"],
    model="voyage-code-3",
)

# Use case: semantic code search, code RAG.
# Outperforms general models em programming tasks.
```

### Legal/Finance/Healthcare

Voyage e Cohere oferecem domain-specific:
- `voyage-law-2` — legal domain.
- `voyage-finance-2` — finance.
- `cohere-embed-multilingual-v3` com domain tags.

Test: compare specialized vs general em seu domínio. Não sempre vale custo extra.

## Multilingual considerations

Para apps com português (ou multi-idioma):

```python
# ❌ text-embedding-3 funciona mas qualidade dropa em PT
# ✅ Cohere multilingual ou BGE M3 são melhores

import cohere
co = cohere.Client(api_key=...)

response = co.embed(
    texts=["Olá mundo", "Como você está?"],
    model="embed-multilingual-v3.0",
    input_type="search_document",  # ou "search_query"
)
```

Cross-language search: BGE M3 e Cohere v3 entendem que "dog" e "cachorro" são semelhantes. Útil em apps internacionais.

## Open-source self-host

```python
# BGE M3 self-hosted
from FlagEmbedding import BGEM3FlagModel

model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)

embeddings = model.encode(
    sentences=["Hello", "World"],
    batch_size=32,
    max_length=8192,
)
# embeddings['dense_vecs'] — main embeddings (1024 dim)
# embeddings['lexical_weights'] — sparse vectors (BM25-style)
# embeddings['colbert_vecs'] — multi-vector (token-level)
```

BGE M3 é único — gera **dense + sparse + multi-vector** num só call. Útil pra hybrid search.

**Self-host trade-offs**:
- ✓ Free per token.
- ✓ Privacy (no data leaves).
- ✗ Infra cost (GPU recommended pra throughput).
- ✗ Maintenance burden.
- ✗ Slower per request (vs cloud GPU at scale).

ROI break-even: ~50-100M tokens/month embedding traffic.

### Self-host setup

```bash
# Modal (serverless GPU)
pip install modal
# Define endpoint embedding com Modal

# Ou Replicate
# Ou Together AI (compatible com OpenAI API):
from openai import OpenAI
together = OpenAI(api_key=..., base_url="https://api.together.xyz/v1")
emb = together.embeddings.create(model="BAAI/bge-large-en-v1.5", input=text)
```

## Embedding workflow

### 1. Input type matters

Modelos modernos diferenciam **document** vs **query**:

```python
# Cohere e Voyage
co.embed(texts=docs, input_type="search_document")    # indexing
co.embed(texts=[query], input_type="search_query")    # retrieval

# Voyage
voyage.embed(texts=docs, model="voyage-3", input_type="document")
voyage.embed(texts=[query], model="voyage-3", input_type="query")
```

Tradicional: usar mesmo embedding pra query e doc. Moderno: assimétrico (docs descritivos, queries terse) melhora retrieval 5-10%.

### 2. Chunking antes de embed

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,        # tokens
    chunk_overlap=200,      # overlap entre chunks
    separators=["\n\n", "\n", ". ", " ", ""],  # try em ordem
)

chunks = splitter.split_text(long_document)
embeddings = embed_batch(chunks)
```

Chunk size matters:
- **Pequeno** (200-500 tokens): retrieval mais preciso, contexto local.
- **Grande** (1000-2000): retrieval menos preciso, mais contexto pra LLM.
- **Default**: 1000 com 200 overlap. Adjust per domain.

Estratégias avançadas:
- **Recursive splitting** — preserva boundaries naturais (parágrafos).
- **Sentence splitting** — boundaries em sentenças.
- **Semantic splitting** — chunks based em embedding similarity (BAAI/llmlingua).
- **Parent-document** — embed pequeno chunk pra retrieval, devolve doc inteiro pra LLM.
- **Contextual chunks** (Anthropic) — anexa contexto explicativo antes de chunking (ver ai-rag-contextual).

### 3. Batching

```python
async def embed_batch(texts: list[str], batch_size: int = 100):
    """Embed em batches pra eficiência."""
    embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=batch,
        )
        embeddings.extend([e.embedding for e in response.data])
    return embeddings
```

OpenAI permite ~2k inputs por call. Outros varia. Batching reduz latência total 10x+.

### 4. Storage strategy

Store no DB:
- ID único.
- Original text (pra preview).
- Embedding vector.
- Metadata (source, date, author, page).
- Optional: hash do texto pra detect duplicates.

```python
# pgvector example
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1024),  # match model dim
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);
```

## Distance/similarity metrics

| Metric | Para |
|--------|------|
| **Cosine similarity** | Default. Embeddings normalizados. |
| **Dot product** | Mesmo que cosine se vectors normalizados. Faster. |
| **Euclidean (L2)** | Raramente em LLM embeddings. |
| **BM25** | Sparse retrieval. Não embedding. |

```python
import numpy as np

def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Em escala: numpy/cuPy para batch
def cosine_batch(query: np.ndarray, docs: np.ndarray):
    """query: [d], docs: [N, d]. Return [N] similarities."""
    return docs @ query / (np.linalg.norm(docs, axis=1) * np.linalg.norm(query))
```

## Evaluation de embeddings

Como saber se seu embedding model é bom para SEU corpus?

### Metric: Recall@K

Dado golden dataset (query, relevant_doc) pairs:

```python
def recall_at_k(retrieved_ids: list[str], relevant_id: str, k: int) -> int:
    return 1 if relevant_id in retrieved_ids[:k] else 0

# Run em dataset
recalls = []
for query, relevant in golden_pairs:
    retrieved = await retrieve(query, k=10)
    recalls.append(recall_at_k(retrieved, relevant, k=10))

print(f"Recall@10: {sum(recalls) / len(recalls):.2%}")
```

Target: Recall@10 > 80% para production RAG.

### Metric: NDCG (Normalized Discounted Cumulative Gain)

```python
import sklearn.metrics
# Mais sofisticado — considera ranking dentro dos top K
ndcg = sklearn.metrics.ndcg_score(true_relevance, predicted_scores, k=10)
```

### Side-by-side eval

```python
async def compare_models(queries: list, expected: list):
    """Compare embedding models em seu corpus."""
    models = ["text-embedding-3-large", "voyage-3", "cohere-multilingual-v3"]
    
    results = {}
    for model in models:
        recalls = []
        for q, exp in zip(queries, expected):
            retrieved = await retrieve_with_model(q, model)
            recalls.append(recall_at_k(retrieved, exp, k=10))
        results[model] = sum(recalls) / len(recalls)
    
    return results
```

## Custo em escala

Exemplo: indexar 1M docs (avg 500 tokens cada) = 500M tokens.

| Model | Cost |
|-------|------|
| OpenAI text-embedding-3-small | $10 |
| OpenAI text-embedding-3-large | $65 |
| Voyage 3 | $30 |
| Cohere v3 | $50 |
| BGE M3 (self-host, ~1h on A100) | ~$2 GPU cost |

Indexing é one-shot. Query embedding é ongoing — typical app: 1k queries/day = 1M tokens/month = <$1 mensal.

**Storage** custo:
- pgvector self-host: ~$30/mês pra 1M vectors 1024-dim.
- Pinecone: $70-100/mês pra similar scale.
- Qdrant Cloud: $50-100/mês.

## Migration entre models

Migrate embedding model = re-embed tudo. Strategy:

```python
# Strategy 1: dual-write durante transition
async def embed_new_doc(text: str):
    old_emb = await embed_old_model(text)
    new_emb = await embed_new_model(text)
    db.save({"old": old_emb, "new": new_emb, "text": text})

# Strategy 2: lazy migration on access
async def get_embedding(doc_id: str):
    doc = db.get(doc_id)
    if "new_emb" not in doc:
        doc["new_emb"] = await embed_new_model(doc["text"])
        db.update(doc_id, doc)
    return doc["new_emb"]
```

Após migration, A/B test old vs new em queries reais.

## Common pitfalls

### 1. Trocar de model sem re-embed

Embeddings de model A ≠ embeddings de model B. Buscar query embedded com A em base embedded com B = noise.

### 2. Dim mismatch

```python
# ❌ Index criado com 1536-dim mas embedded com 3072
# Error em insert ou queries silently sem resultado
```

### 3. Truncar texto demais

```python
# Default tokenizer pode truncar em 512 tokens
# Voce embedda só primeiros 512 do doc
# Solution: chunk antes de embed
```

### 4. Cache de embeddings

Embedding é determinístico — cache!

```python
@lru_cache(maxsize=10000)
def cached_embed(text: str):
    return embed(text)

# Ou Redis para persistência
async def embed_with_cache(text: str):
    key = f"emb:{hashlib.sha256(text.encode()).hexdigest()}"
    cached = await redis.get(key)
    if cached:
        return json.loads(cached)
    
    emb = await embed(text)
    await redis.set(key, json.dumps(emb), ex=86400 * 7)  # 1 semana
    return emb
```

## Hybrid: sparse + dense

Sparse (BM25) + dense (embedding) frequently > only dense:

```python
# BM25 — exact match, keyword
# Dense — semantic, conceitual

# Combine: weighted sum ou reciprocal rank fusion
def hybrid_search(query, docs, alpha=0.5):
    bm25_scores = bm25_index.search(query)
    dense_scores = vector_index.search(query_emb)
    
    # Min-max normalize both scores
    bm25_norm = (bm25_scores - bm25_scores.min()) / bm25_scores.range
    dense_norm = (dense_scores - dense_scores.min()) / dense_scores.range
    
    return alpha * bm25_norm + (1 - alpha) * dense_norm
```

Cohere oferece Rerank-3 que faz essencialmente isto. BGE M3 produz sparse + dense num só call.

## Checklist — embedding pipeline production

- [ ] Model selecionado baseado em MTEB + test no seu corpus?
- [ ] Multilingual model se app não é só English?
- [ ] Input type differentiation (query vs document)?
- [ ] Chunking strategy testada (size, overlap, separators)?
- [ ] Batching configurado para indexing?
- [ ] Dim do index batendo dim do modelo?
- [ ] Distance metric correto (cosine pra normalized)?
- [ ] Recall@10 medido em golden dataset (>80%)?
- [ ] Embeddings cached (queries repeated)?
- [ ] Migration plan se trocar de model?

## Leituras

- MTEB leaderboard (huggingface.co/spaces/mteb/leaderboard)
- Voyage AI blog (blog.voyageai.com)
- "Matryoshka Representation Learning" — paper
- Anthropic "Contextual Retrieval" (anthropic.com/news/contextual-retrieval)
- "Embeddings Best Practices" — Cohere blog
- BGE paper series (BAAI)
- "BERT Rediscovers..." — pre-trained embedding analysis papers
