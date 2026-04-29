---
title: "PostgreSQL pra ERP — checklist essencial"
category: banco
stack: [PostgreSQL]
tags: [postgres, performance, erp]
excerpt: "Índices certos, EXPLAIN como hábito, ANALYZE, configs mínimas, tipos certos. ERP que não cuida de Postgres morre na escala."
related: [n-plus-1, migrations-zero-downtime, soft-delete-audit, multi-tenant-strategies]
updated: 2026-04
---

## Tipos certos

- **`UUID`** pra PK (idealmente UUID v7 — ordenado por tempo, índices melhores). Não `serial`/`bigserial` se você quer multi-tenant ou import de dados.
- **`CITEXT`** pra e-mail (case-insensitive sem `LOWER()` em todo lugar).
- **`TIMESTAMPTZ`** pra qualquer tempo. NUNCA `TIMESTAMP` sem timezone. NUNCA `DATE` se há hora.
- **`NUMERIC(precision, scale)`** pra dinheiro. NUNCA `float`/`double`.
- **`JSONB`** pra dados dinâmicos. `JSON` (sem B) só pra log onde performance não importa.
- **Enum nativo** apenas pra valores realmente fixos (status com 5 estados que nunca mudam). Senão lookup table.

## Índices

- Toda FK tem índice (Postgres NÃO cria automaticamente).
- Índice composto começa pela coluna mais seletiva ou pela mais usada como filtro.
- Toda tabela multi-tenant indexa `(tenant_id, ...)`. **Tenant_id é o primeiro**.
- Use índice parcial pra queries com filtro fixo: `CREATE INDEX ... WHERE status = 'ativo'`.
- `BRIN` pra colunas que crescem monotonicamente (data de criação em log gigante).
- `GIN` pra `JSONB` quando há queries em campos.

## Hábito EXPLAIN

Toda query nova: `EXPLAIN (ANALYZE, BUFFERS)`. Olhe:
- **Seq Scan** em tabela grande = índice faltando ou seletividade ruim.
- **Nested Loop** em milhões de linhas = falta índice ou query mal escrita.
- **Buffers: shared read=...** alto = cache miss, talvez índice errado.

## Configs mínimas em produção

- `shared_buffers` = 25% da RAM (até ~16GB).
- `effective_cache_size` = ~75% da RAM.
- `work_mem` = 16-64MB (cuidado: por operação, multiplica em joins).
- `maintenance_work_mem` = 512MB-2GB.
- `max_wal_size` = 8-16GB.
- `random_page_cost` = 1.1 em SSD/cloud.
- `autovacuum_vacuum_scale_factor` = 0.05 (mais agressivo que default).

Use `pg_stat_statements` ligado SEMPRE. Sua melhor ferramenta de tuning.

## Vacuum / dead tuples

UPDATE/DELETE deixa tuplas mortas. Autovacuum limpa, mas configurações default são tímidas pra ERP escrita-pesada. Se vê tabela inchando:
- `VACUUM (VERBOSE, ANALYZE) tabela;`
- Configure `autovacuum_vacuum_scale_factor` por tabela quente.

## Connection pooling

Postgres não escala bem em milhares de conexões. Use **PgBouncer** (transaction mode) ou **pgcat**. App fica em ~50-100 conexões na pool, PgBouncer multiplexa.

## Backup e PITR

- `pg_dump` diário pra começar.
- Em produção real: **PITR** com `wal-g` ou serviço gerenciado (RDS, Neon, Supabase). Sem PITR, perde N horas.
- TESTE restore mensalmente. Backup que nunca foi testado é teoria.

## Como pedir pra IA

> "Crie schema Postgres pro nosso ERP multi-tenant: tabelas `tenants`, `branches`, `users`, `memberships`, `clients`, `products`, `orders`. Tipos certos (UUID v7, NUMERIC pra valor, TIMESTAMPTZ pra todo tempo). Índices: FK + (tenant_id, *) + parciais onde fizer sentido. RLS habilitado nas tabelas transacionais. Inclua migrações com Drizzle e seed básico."

## Auditoria

- [ ] Toda FK tem índice.
- [ ] `(tenant_id, *)` em todas as tabelas multi-tenant.
- [ ] Sem `float` pra dinheiro.
- [ ] Sem `TIMESTAMP` (use `TIMESTAMPTZ`).
- [ ] `pg_stat_statements` ligado.
- [ ] Plano de backup testado (você já tentou restaurar?).
- [ ] PgBouncer ou equivalente em produção.
- [ ] Queries críticas têm `EXPLAIN ANALYZE` registrado.
