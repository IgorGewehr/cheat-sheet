---
title: "RBAC vs ABAC pra ERP"
category: auth
stack: [NestJS, PostgreSQL]
tags: [auth, autorização, rbac, abac]
excerpt: "RBAC resolve 80% dos casos. ABAC entra quando regra envolve atributos do recurso (filial dona, valor da transação, etc)."
related: [auth-architecture, multi-filial]
updated: 2026-04
---

## RBAC — Role-Based Access Control

Usuário tem **roles** (`gerente`, `vendedor`, `financeiro`). Roles têm **permissions** (`vendas.criar`, `clientes.editar`, `relatorios.financeiro.ver`).

```sql
CREATE TABLE roles (id UUID PK, tenant_id UUID, name TEXT);
CREATE TABLE permissions (id UUID PK, key TEXT UNIQUE);  -- 'vendas.criar'
CREATE TABLE role_permissions (role_id UUID, permission_id UUID, PRIMARY KEY (role_id, permission_id));
```

Membership aponta pra uma role (via `membership.role` ou tabela `membership_roles` se for many-to-many).

Bom pra: papéis bem definidos, equipes que se assemelham entre tenants, decisões de "pode ou não pode" que dependem só do papel.

## ABAC — Attribute-Based Access Control

Decisão depende de **atributos** do usuário, do recurso e do contexto:
- Vendedor pode editar pedido só se ele criou.
- Gerente pode aprovar gastos até R$ 10.000; acima exige diretor.
- Usuário só vê clientes da sua filial.

Você expressa isso como regras (policies). Em código:

```ts
function canEdit(pedido: Pedido, user: SessionUser): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'gerente' && pedido.branchId === user.branchId) return true;
  if (user.role === 'vendedor' && pedido.criadoPor === user.identityId) return true;
  return false;
}
```

Bom pra: regras que envolvem dado do recurso, hierarquia, valores. Quase todo ERP precisa em algum lugar.

## A combinação que funciona

**RBAC pra grosso (telas, módulos, ações genéricas) + ABAC pra fino (este registro especificamente)**.

```ts
// Guard genérico (RBAC): pode acessar a tela de pedidos?
@RequirePermission('pedidos.editar')

// Dentro do handler (ABAC): pode editar ESTE pedido?
if (!canEdit(pedido, session)) throw new ForbiddenException();
```

Não tente expressar regras de filial em RBAC ("role gerente_filial_123") — explode.

## Onde colocar a checagem

- **Guard / middleware** pra RBAC.
- **No use case ou service**, depois de carregar o recurso, pra ABAC.
- **No banco** (RLS) pra invariantes que NUNCA podem ser violadas (isolamento entre tenants/filiais).

Defesa em profundidade: três camadas, não uma.

## Como pedir pra IA

> "Implemente autorização híbrida em Nest: (1) decorator `@RequirePermission('vendas.criar')` que checa a role da membership ativa; (2) função `policy.canEditPedido(pedido, session)` que aplica regra de filial + criador; (3) RLS em Postgres garantindo isolamento por tenant_id. Permissions são strings em config (não hardcoded em decorator), então adicionar nova permission = entrada em arquivo + role_permissions no seed."

## Auditoria

- [ ] Não há `if (user.email === 'admin@...')` em lugar nenhum.
- [ ] Permissions vivem em config/seed, não espalhadas por decorators.
- [ ] Toda mutação tem checagem (RBAC e/ou ABAC). Defaults seguros (negar).
- [ ] Tem teste pra cada combinação crítica role × ação × dono do recurso.
- [ ] RLS no banco como última linha de defesa.
- [ ] Mudança de role/permissão é auditada (`who changed what when`).
- [ ] Frontend NÃO confia nas suas próprias checagens — backend valida sempre.

## Anti-padrões

- Codar regra ABAC em SQL gigante com `CASE WHEN role = 'x' THEN ...`.
- Roles infladas (`gerente_filial_zona_sul_v2`). Sintoma de tentar resolver ABAC com RBAC.
- Permissão "*" / superuser sem auditoria. Sempre logue uso.
- Esconder botão no frontend mas não checar no backend. Botão é dica, backend é lei.
