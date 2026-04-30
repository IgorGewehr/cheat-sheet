---
title: "Vector Databases — Escolhendo o Certo"
category: agentes-ia
stack: [PostgreSQL, Pinecone, Qdrant, Chroma, pgvector]
tags: [vector-db, pgvector, pinecone, qdrant, embeddings]
excerpt: "Começa com pgvector, migra para Qdrant quando precisar de filtragem avançada ou escala — o resto é marketing."
related: [rag-fundamentos, rag-avancado, agent-deployment]
updated: 2026-04
---

## O que é

Vector databases armazenam embeddings e permitem busca por similaridade (Approximate Nearest Neighbor — ANN) de forma eficiente. A diferença entre um vector database e uma tabela com coluna de vetor é que vector databases têm índices especializados para busca ANN que escalam para milhões de vetores com latência aceitável.

**HNSW (Hierarchical Navigable Small World)** é o algoritmo dominante: constrói um grafo hierárquico onde cada vetor aponta para vizinhos próximos em múltiplas camadas. É rápido (busca em O(log n)), tem alta precisão, e suporta inserção incremental. **IVF (Inverted File Index)** divide o espaço em clusters e busca apenas nos clusters mais próximos — mais rápido para bases enormes mas requer treinamento com os dados e não suporta inserção incremental bem.

**Metadata filtering** é o recurso que mais diferencia os produtos. Filtrar por metadata ANTES da busca vetorial (pre-filtering) é muito mais eficiente que filtrar DEPOIS (post-filtering). Se você vai filtrar por `tenant_id`, `categoria`, ou `data` frequentemente, o suporte a pre-filtering do seu vector store é crítico.

**A decisão prática:**
- Já tem Postgres? Use pgvector. É suficiente para até ~1M vetores com HNSW.
- Precisa de filtragem complexa com escala? Use Qdrant (self-hosted ou cloud).
- Quer zero ops, pode pagar mais, e tem volume previsível? Pinecone.
- Desenvolvimento local apenas? Chroma.

## Quando usar cada um

**pgvector:** você já tem Postgres, o volume é gerenciável (< 1M vetores), e você quer manter sua stack simples. A vantagem de fazer joins com seus dados relacionais é enorme.

**Qdrant:** você precisa de filtragem complexa (múltiplos campos, operadores booleanos), quer self-host com boa performance, ou seu volume passa de alguns milhões de vetores.

**Pinecone:** você quer zero ops e não se importa com vendor lock-in e custo mais alto. Bom para PoCs que precisam chegar em produção rápido.

**Chroma:** apenas desenvolvimento local. Não use em produção — não tem garantias de durabilidade nem performance em escala.

## Quando NÃO usar vector databases

- Volume < 10k documentos — busca linear com threshold é suficiente e mais simples
- Você não tem embeddings ou o domínio é muito específico — considere BM25 (keyword search) antes ou como híbrido
- Substituir um banco relacional — vector store complementa SQL, não substitui

## Como pedir pra IA

> "Implementa integração com [pgvector/Qdrant] para RAG em [LINGUAGEM]. Preciso: (1) schema/collection com campos de metadata [lista de campos], (2) função de upsert que atualiza vetor se documento já existe (por hash do conteúdo), (3) busca com pre-filtering por [CAMPO] e threshold de similarity, (4) deleção por metadata (ex: deletar todos os vetores de um tenant). Foca em produção — não quero Chroma nem setup que não escala."

## Como auditar o que a IA gerou

- [ ] Verificar se o índice HNSW está criado (sem índice, a busca é linear e lenta)
- [ ] Confirmar que upsert usa alguma forma de deduplicação (hash do conteúdo ou ID estável)
- [ ] Verificar se pre-filtering está sendo usado para campos de metadata frequentemente filtrados
- [ ] Checar se a dimensão do vetor no schema bate com o modelo de embedding usado
- [ ] Confirmar que há connection pooling (não criar nova conexão por busca)
- [ ] Verificar se a busca retorna metadados suficientes para rastreabilidade (source, page, etc.)

## Armadilhas comuns

- **Sem índice HNSW no pgvector** — o padrão é busca linear (O(n)), não ANN. Sempre `CREATE INDEX USING hnsw`
- **Dimensão errada de vetor** — `text-embedding-3-small` tem 1536 dims, `text-embedding-3-large` tem 3072. Se criar a coluna com 1536 e mudar o modelo, quebra
- **Não indexar campos de metadata usados para filtrar** — Qdrant e pgvector precisam de índice nos campos de payload/metadata para pre-filtering eficiente
- **Usar Chroma em produção** — sem persistência confiável, sem suporte real, sem escala
- **Não normalizar vetores para similaridade cosine no pgvector** — pgvector tem `cosine_distance` mas garanta que seus embeddings estão normalizados ou use `vector_cosine_ops`

## Exemplo prático

```sql
-- pgvector setup (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documento_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    documento_id UUID NOT NULL,
    conteudo TEXT NOT NULL,
    conteudo_hash TEXT NOT NULL,  -- SHA256 para deduplicação
    embedding vector(1536),        -- text-embedding-3-small
    metadata JSONB DEFAULT '{}',
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índice HNSW para busca eficiente
CREATE INDEX ON documento_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Índice para pre-filtering por tenant
CREATE INDEX ON documento_chunks (tenant_id);
CREATE INDEX ON documento_chunks (documento_id);

-- Busca com pre-filtering por tenant + threshold de similarity
SELECT 
    conteudo,
    metadata,
    1 - (embedding <=> $1::vector) AS similarity
FROM documento_chunks
WHERE 
    tenant_id = $2
    AND 1 - (embedding <=> $1::vector) > 0.72  -- threshold
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

```python
# Qdrant — quando você precisa de filtragem mais complexa
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue, Range
)

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="documentos",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
)

# Busca com filtro complexo
resultados = client.search(
    collection_name="documentos",
    query_vector=embedding_da_query,
    query_filter=Filter(
        must=[
            FieldCondition(key="tenant_id", match=MatchValue(value=tenant_id)),
            FieldCondition(key="categoria", match=MatchValue(value="contratos")),
        ]
    ),
    score_threshold=0.72,
    limit=5,
    with_payload=True,
)
```

| Feature | pgvector | Qdrant | Pinecone | Chroma |
|---|---|---|---|---|
| Self-host | Sim (Postgres) | Sim | Não | Sim |
| Pre-filtering | Limitado | Excelente | Sim | Não |
| Escala | ~1M vecs | 10M+ vecs | 100M+ | < 100k |
| Custo | Postgres ≈ grátis | Grátis self-host | Alto | Grátis |
| Produção | Sim | Sim | Sim | NÃO |
