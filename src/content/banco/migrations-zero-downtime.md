---
title: "Migrations sem downtime"
category: banco
stack: [PostgreSQL]
tags: [migrations, deploy]
excerpt: "Em ERP, downtime de banco é impensável. Migrations seguem padrão expand/migrate/contract — nunca quebrar a versão antiga em prod."
related: [postgres-erp-checklist, drizzle-vs-prisma-2026]
updated: 2026-04
---

## A regra de ouro

Migration **nunca pode quebrar a versão anterior do código** que ainda está rodando. Deploy é gradual: V1 e V2 do código convivem por minutos a horas. Banco precisa servir os dois.

## Padrão Expand → Migrate → Contract

Para qualquer mudança não trivial, divida em **3 deploys**:

1. **Expand**: adiciona o novo (coluna, tabela, índice) sem remover o antigo. Código continua usando o antigo.
2. **Migrate**: deploy do código que escreve nos dois (ou só no novo) e lê preferencialmente do novo. Backfill de dados antigos.
3. **Contract**: depois que NADA mais usa o antigo, remove.

## Casos comuns

### Renomear coluna

❌ Errado: `ALTER COLUMN ... RENAME` em deploy. App antiga quebra.
✅ Certo:
1. Adiciona `nova_coluna`. Backfill (`UPDATE SET nova = antiga`).
2. Trigger ou app v2 escreve nas duas colunas. App v2 lê da nova.
3. App v1 sai. Drop `antiga`.

### Adicionar coluna NOT NULL

❌ Errado: `ALTER TABLE ADD COLUMN x NOT NULL` em tabela grande. Lock + falha em rows existentes.
✅ Certo:
1. Adiciona nullable, com default se faz sentido.
2. Backfill em batches.
3. `ALTER COLUMN SET NOT NULL` (rápido, só checa).

### Mudar tipo de coluna

Quase sempre = expand + dual-write + contract. Nunca um `ALTER TYPE` direto em tabela grande.

### Adicionar índice

❌ `CREATE INDEX` (lock).
✅ `CREATE INDEX CONCURRENTLY` (sem lock, mais lento). Verificar `pg_stat_progress_create_index`.

### Adicionar FK

❌ `ADD CONSTRAINT FK ...` valida tabela inteira (lock).
✅ `ADD CONSTRAINT FK ... NOT VALID` + `VALIDATE CONSTRAINT` em segundo passo (sem lock pesado).

## Backfill em tabelas grandes

Em batches de 1k-10k linhas com pausa entre eles:

```ts
let lastId = "";
while (true) {
  const ids = await db.execute(sql`
    SELECT id FROM big_table WHERE nova IS NULL AND id > ${lastId} ORDER BY id LIMIT 1000;
  `);
  if (!ids.length) break;
  await db.execute(sql`UPDATE big_table SET nova = ... WHERE id = ANY(${ids.map(r => r.id)})`);
  lastId = ids[ids.length - 1].id;
  await sleep(100); // alivia carga
}
```

## Locks

Sempre considere o lock que sua migration vai pegar. Em produção, **rodar com timeout**:

```sql
SET lock_timeout = '5s';
SET statement_timeout = '60s';
ALTER TABLE ...;
```

Falhar é melhor que travar a app.

## Como pedir pra IA

> "Preciso renomear `customer_name` para `client_name` na tabela `invoices` (50M linhas, em produção). Gere as 3 migrations (expand/migrate/contract) com SQL seguro: CREATE INDEX CONCURRENTLY se preciso, backfill em batches de 5k, sem lock prolongado, com lock_timeout. Documente quais deploys de código precisam acompanhar cada migration."

## Auditoria

- [ ] Toda migration foi pensada em "v1 e v2 da app convivendo".
- [ ] Sem `ALTER` que pega lock pesado em tabela quente sem `CONCURRENTLY`/`NOT VALID`.
- [ ] Backfill em batches, não `UPDATE` em milhões de linhas de uma vez.
- [ ] `SET lock_timeout` em migrations de produção.
- [ ] Plan de rollback documentado (mesmo que seja "aplicar contract reverso").
- [ ] Ambiente de staging com volume realista pra testar latência da migration.

## Anti-padrões

- "Vou colocar manutenção 5 min e roda". Em ERP isso é prejuízo direto.
- Migration que escreve dados (não-DDL) sem batches.
- Esquecer índice CONCURRENTLY.
- Aplicar migration sem revisar SQL gerado pelo ORM.
