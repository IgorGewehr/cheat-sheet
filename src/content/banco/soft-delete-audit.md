---
title: "Soft delete e auditoria em ERP"
category: banco
stack: [PostgreSQL]
tags: [audit, soft-delete, erp]
excerpt: "Em ERP, raramente apague de verdade. Marque deletado, audite quem mudou o quê, e prepare-se pra requerimento legal/contábil."
related: [postgres-erp-checklist, multi-filial]
updated: 2026-04
---

## Por que soft delete em ERP

- Estorno fiscal/contábil exige histórico íntegro (NF cancelada não some, fica cancelada).
- Auditoria interna: "quem apagou esse cliente?"
- Compliance: LGPD permite manter por anos com base legal.
- "Recuperar deletado" é pedido frequente.

## Padrão básico

```sql
ALTER TABLE clients ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN deleted_by UUID;

-- índice parcial (queries normais ignoram deletados)
CREATE INDEX clients_active_idx ON clients (tenant_id, name) WHERE deleted_at IS NULL;
```

Toda query padrão filtra `WHERE deleted_at IS NULL`. Cuidado pra não esquecer — encapsule.

### Encapsular soft-delete no repositório

Não deixe `WHERE deleted_at IS NULL` espalhado. Toda query do repositório aplica por default. Métodos como `findIncludingDeleted` quando precisa.

### Único parcial

Constraints únicas devem ignorar deletados:

```sql
CREATE UNIQUE INDEX clients_cnpj_uq ON clients (tenant_id, cnpj) WHERE deleted_at IS NULL;
```

Senão você não consegue recadastrar cliente apagado.

## Auditoria — tabelas

Duas estratégias:

### Tabela de eventos de auditoria

```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  actor_id UUID,
  actor_kind TEXT NOT NULL,    -- user, system, integration
  entity_type TEXT NOT NULL,    -- 'invoice', 'client', etc
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,         -- created, updated, deleted, ...
  diff JSONB,                   -- campos alterados (antes/depois)
  ip INET,
  user_agent TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON audit_log (tenant_id, entity_type, entity_id);
CREATE INDEX ON audit_log (tenant_id, actor_id, occurred_at DESC);
```

Bom pra: pesquisa "tudo que esse usuário fez", "histórico desse pedido", compliance.

### Versionamento (snapshots)

Tabela `entity_history` guarda snapshot completo a cada mudança. Pesado, mas permite "voltar pra estado de ontem". Use em entidades críticas (pedido, NF, contrato).

### Triggers ou camada de aplicação?

- **Triggers**: garantem auditoria de QUALQUER mudança (até via SQL direto). Performance custa.
- **App layer**: mais flexível, dado mais rico (intent do user, contexto). Não pega mudanças via SQL ad-hoc.

Em ERP B2B regulado, prefira **triggers** + camada de app que enriquece com contexto. Belt and suspenders.

## Hard delete — quando

- LGPD / direito ao esquecimento (anonimizar campos pessoais; manter linha pra integridade).
- Dados de teste obviamente lixo.
- Após retenção legal expirar (ex: > 7 anos pra fiscal no BR).

## Como pedir pra IA

> "Adicione soft delete + auditoria nas tabelas `clients`, `invoices`, `orders`. Padrão: coluna `deleted_at`, `deleted_by`. Índice único ignora deletados. Crie tabela `audit_log` (schema acima) e trigger genérico `audit_changes()` aplicado em todas elas (captura `OLD`/`NEW` em JSONB diff). Use case `DeleteClient` setando `deleted_at = now()` e `deleted_by = session.identityId`. Endpoint admin `POST /admin/audit/restore/:type/:id` que limpa `deleted_at` (com validação de role)."

## Auditoria

- [ ] Toda entidade transacional tem soft delete (ou justificativa pra hard).
- [ ] Queries do dia-a-dia ignoram deletados automaticamente (no repositório, não em cada query).
- [ ] Únicos são parciais (`WHERE deleted_at IS NULL`).
- [ ] `audit_log` registra criação, update, delete com diff.
- [ ] Existe endpoint de restore com permissão restrita.
- [ ] Política de retenção definida e implementada (purge real após N anos).
- [ ] Auditoria não pode ser desabilitada por usuário comum.
