---
title: "Checklist: auditar migration gerada por IA"
category: checklists
stack: [PostgreSQL]
tags: [migration, auditoria]
excerpt: "Migration ruim quebra produção. Antes de aplicar, passe por essa lista. Sempre."
related: [migrations-zero-downtime, postgres-erp-checklist, audit-api-endpoint]
updated: 2026-04
---

## Antes de aceitar

- [ ] Você LEU o SQL gerado, não só o nome do arquivo.
- [ ] A migration foi rodada em staging com volume realista.
- [ ] Existe migration de rollback ou plano de revert documentado.

## Compatibilidade com versão anterior do código

- [ ] App rodando na versão anterior continuaria funcionando após esta migration?
- [ ] Se renomeou coluna: existe coluna velha e nova convivendo (expand)?
- [ ] Se mudou tipo: dual-column ou view de compatibilidade?
- [ ] Se removeu coluna: NENHUM código antigo (deploy gradual ainda existente) usa?

## Locks e performance

- [ ] `CREATE INDEX` é `CONCURRENTLY` em tabela grande.
- [ ] `ADD CONSTRAINT FK` é `NOT VALID` + `VALIDATE` separado.
- [ ] `ALTER TABLE ... ADD COLUMN` com default não-volátil (Postgres recente faz rápido; se tem default que muda, é nullable + backfill).
- [ ] `ALTER COLUMN SET NOT NULL` só DEPOIS de garantir que não há null.
- [ ] `lock_timeout` configurado pra falhar rápido em vez de travar.

## Backfill de dados

- [ ] Backfill de tabelas grandes está em **batches** (1k-10k linhas), não UPDATE total.
- [ ] Pausa entre batches pra não saturar IO.
- [ ] Backfill usa transação por batch (não uma transação gigante).
- [ ] Existe forma de retomar de onde parou.

## Schema

- [ ] Tipos certos (UUID, NUMERIC, TIMESTAMPTZ, CITEXT onde adequado).
- [ ] Colunas de tenant/branch onde aplicável.
- [ ] Soft delete (`deleted_at`) se a tabela é transacional.
- [ ] `created_at`/`updated_at` com default `now()`.
- [ ] Constraints: NOT NULL onde não pode ser nulo, único onde precisa.
- [ ] Índices: FK + (tenant_id, *) + parciais nos casos com filtro fixo.

## Multi-tenant

- [ ] Tabela transacional tem `tenant_id`.
- [ ] Índice composto começa por `tenant_id`.
- [ ] Constraints únicas incluem `tenant_id` no escopo (exceto identidades globais como e-mail).
- [ ] RLS habilitado e policy definida (se sua estratégia é pool).

## Reversão

- [ ] Existe script de rollback (`down`) — mesmo que seja "não vamos reverter, vamos contract reverso depois".
- [ ] Migration testada em staging fazendo up + down + up.

## Geração via ORM

- [ ] SQL gerado por Drizzle/Prisma foi REVISADO. Eles geram coisas perigosas (drop de coluna, recreate de tabela em alguns casos).
- [ ] Sem `DROP TABLE` ou `DROP COLUMN` que perde dado sem ser intencional.

## Operacional

- [ ] Janela de aplicação documentada (mesmo que seja "qualquer hora útil").
- [ ] Equipe alertada pra rodar.
- [ ] Estimativa de duração baseada em staging.
- [ ] Plano se demorar mais que estimado (cancelar e revisar, não esperar).

## Sinal vermelho — pare

- Migration que `DROP COLUMN` no mesmo deploy que a coluna foi removida do código.
- "Vou aplicar e ver."
- Backfill em UPDATE único de milhões de linhas.
- ALTER em tabela quente sem CONCURRENTLY/NOT VALID.
- Nenhum teste em staging.
