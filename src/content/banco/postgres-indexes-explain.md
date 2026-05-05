---
title: "PostgreSQL — Índices, EXPLAIN ANALYZE e Query Tuning"
category: banco
stack: [PostgreSQL, Drizzle, TypeScript]
tags: [postgresql, indexes, explain, performance, query-optimization, b-tree, gin]
excerpt: "EXPLAIN ANALYZE mostra o que o Postgres realmente faz. Índice certo transforma seq scan de 10s em index scan de 1ms."
related: [drizzle-schema-queries, n-plus-1, postgres-erp-checklist, migrations-zero-downtime]
updated: "2026-05"
---

## Tipos de índice no PostgreSQL

| Tipo | Usa quando | Exemplo |
|---|---|---|
| **B-Tree** (padrão) | `=`, `<`, `>`, `BETWEEN`, `LIKE 'abc%'` | 99% dos índices |
| **GIN** | Arrays, JSONB, full-text search | `tags @> '{postgres}'`, `dados->>'campo'` |
| **GiST** | Geoespacial (PostGIS), ranges | `ST_Contains(area, ponto)` |
| **Hash** | Somente `=`, memória | Raramente, B-Tree geralmente melhor |
| **BRIN** | Tabelas muito grandes com dados ordenados por inserção | Logs, séries temporais |

## Criando índices no Drizzle

```ts
// Índice simples
index("pedidos_tenant_idx").on(t.tenantId)

// Índice composto — ordem importa! (tenantId sempre primeiro)
index("pedidos_tenant_status_idx").on(t.tenantId, t.status)

// Índice único
uniqueIndex("clientes_email_unique").on(t.tenantId, t.email)

// Índice parcial — só indexa rows que atendem condição
index("pedidos_pendentes_idx").on(t.tenantId, t.criadoEm)
  .where(sql`${t.status} = 'pendente'`)
  // 10% das rows → índice menor e mais rápido

// Índice em expressão
index("clientes_email_lower_idx")
  .using("btree", sql`lower(${t.email})`)

// GIN para JSONB
index("pedidos_metadata_gin").using("gin", t.metadata)
```

## EXPLAIN ANALYZE — lendo o plano de execução

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT p.*, c.nome
FROM pedidos p
JOIN clientes c ON c.id = p.cliente_id
WHERE p.tenant_id = 'abc123'
  AND p.status = 'pendente'
ORDER BY p.criado_em DESC
LIMIT 50;
```

### O que olhar no output

```
Limit  (cost=0.43..234.56 rows=50 width=128)
        (actual time=0.123..1.456 rows=50 loops=1)
  ->  Index Scan Backward using pedidos_tenant_status_idx on pedidos p
        (cost=0.43..2340.56 rows=500 width=128)
        (actual time=0.121..1.234 rows=50 loops=1)
        Index Cond: ((tenant_id = 'abc123') AND (status = 'pendente'))
      ->  Index Scan using clientes_pkey on clientes c
            (actual time=0.015..0.016 rows=1 loops=50)
Buffers: shared hit=153 read=2
Planning Time: 0.456 ms
Execution Time: 1.567 ms
```

### Glossário dos nós

| Nó | Significado | Sinal |
|---|---|---|
| `Seq Scan` | Leu a tabela inteira linha a linha | ⚠️ ruim em tabela grande |
| `Index Scan` | Usou índice para achar as rows | ✅ bom |
| `Index Only Scan` | Resposta veio do índice sem tocar a tabela | ✅✅ ótimo |
| `Bitmap Heap Scan` | Índice + filtro adicional na tabela | OK em ranges grandes |
| `Hash Join` | JOIN construiu hash table | Normal |
| `Nested Loop` | JOIN por loop aninhado | ✅ bom quando inner é pequeno |
| `Merge Sort` | JOIN com ordenação | Caro, evite |

### Métricas-chave

```
(cost=0.43..234.56 rows=50 width=128)
        ↑ startup  ↑ total    ↑ rows estimadas  ↑ bytes/row

(actual time=0.123..1.456 rows=50 loops=1)
         ↑ startup   ↑ total    ↑ rows reais   ↑ quantas vezes rodou
```

**`rows` estimado vs real muito diferente**: estatísticas desatualizadas — rode `ANALYZE tabela`.

**`loops > 1`**: o nó rodou N vezes — `actual time` é por loop, multiplique pelo loops para o custo real.

**`Buffers: read=N`**: leu N blocos do disco (cada = 8KB). Alto = falta de cache ou índice.

## Estratégia de índice composto

A ordem das colunas em um índice composto importa. Regra:

```
Colunas de igualdade (=) primeiro → colunas de range (<, >, BETWEEN) depois
```

```sql
-- Query:
WHERE tenant_id = ? AND status = ? AND criado_em > ?

-- Índice ideal: (tenant_id, status, criado_em)
--   tenant_id = ? → reduz para o tenant
--   status = ?    → reduz para o status
--   criado_em > ? → range no final

-- NÃO funciona bem: (criado_em, tenant_id, status)
--   range primeiro bloqueia o uso das colunas seguintes
```

## Covering index — eliminar heap fetch

Um `Index Only Scan` é o mais rápido: o Postgres não precisa ir à tabela.

```sql
-- Query só precisa dessas colunas:
SELECT id, status, total FROM pedidos WHERE tenant_id = ? ORDER BY criado_em DESC;

-- Covering index inclui todas as colunas necessárias:
CREATE INDEX pedidos_covering ON pedidos(tenant_id, criado_em DESC)
  INCLUDE (id, status, total);
```

No Drizzle:
```ts
index("pedidos_covering").on(t.tenantId, t.criadoEm)  // colunas do predicado
  // Drizzle ainda não suporta INCLUDE direto — use sql raw:
// execute(sql`CREATE INDEX ... INCLUDE (id, status, total)`)
```

## Checklist antes de adicionar índice

1. **EXPLAIN ANALYZE** mostra Seq Scan em tabela > 10k rows?
2. A query é executada frequentemente em produção? (cheque `pg_stat_statements`)
3. A coluna tem alta cardinalidade? (índice em boolean com 2 valores = inútil)
4. Qual o custo em writes? Cada INSERT/UPDATE em tabela com N índices é N+1 writes.

## Identificando queries lentas

```sql
-- Habilitar pg_stat_statements (uma vez):
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 10 queries mais lentas:
SELECT
  substring(query, 1, 100) AS query_trunc,
  calls,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  round(total_exec_time::numeric / 1000, 2) AS total_s,
  rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Resetar estatísticas após tuning:
SELECT pg_stat_statements_reset();
```

## EXPLAIN via Drizzle em desenvolvimento

```ts
// Para debugar queries em dev:
const query = db.select().from(pedidos).where(eq(pedidos.tenantId, id));

// Veja o SQL gerado:
console.log(query.toSQL());
// { sql: "select * from pedidos where tenant_id = $1", params: ["abc123"] }

// Execute EXPLAIN manualmente no psql ou TablePlus com o SQL acima
```

## Vacuum e estatísticas

```sql
-- Atualiza estatísticas de uma tabela (Postgres faz automaticamente, mas pode forçar)
ANALYZE pedidos;

-- VACUUM libera espaço de rows deletadas, previne transaction ID wraparound
VACUUM (VERBOSE, ANALYZE) pedidos;

-- Verificar tabelas com estatísticas antigas:
SELECT relname, last_analyze, last_autoanalyze, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
WHERE last_analyze < now() - interval '7 days'
ORDER BY n_live_tup DESC;
```

## Como pedir pra IA

> "Analise este EXPLAIN ANALYZE [cole o output] da query `SELECT * FROM pedidos WHERE tenant_id = ? AND status = 'pendente' ORDER BY criado_em DESC LIMIT 50`. Explique cada nó, identifique o gargalo, e sugira os índices necessários no esquema Drizzle que já temos. Inclua por que a ordem das colunas no índice importa para essa query específica."

## Auditoria

- [ ] Queries de listagem com filtro por `tenantId` têm índice em `(tenantId, ...)`.
- [ ] EXPLAIN ANALYZE executado nas top 5 queries mais frequentes antes de ir pra produção.
- [ ] Sem índice em colunas booleanas isoladas (baixa cardinalidade).
- [ ] `pg_stat_statements` habilitado em produção.
- [ ] Colunas monetárias são `numeric`, não `float` (índice funciona, mas cálculo pode dar erro).

## Anti-padrões

- Índice em toda coluna "por precaução" — every index slows writes.
- `SELECT *` em tabela wide quando só precisa de 3 campos — aumenta buffers lidos.
- `WHERE lower(email) = ?` sem índice de expressão em `lower(email)`.
- EXPLAIN sem ANALYZE — mostra estimativa, não execução real.
- Confiar no ORM pra criar índices certos automaticamente — revise sempre.
