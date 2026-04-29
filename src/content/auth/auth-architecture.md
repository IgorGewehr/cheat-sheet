---
title: "Arquitetura de auth — identity / profile / membership"
category: auth
stack: [NestJS, Next.js, PostgreSQL]
tags: [auth, multi-tenant]
excerpt: "Separe identidade (quem é), perfil (dados) e membership (em quais tenants/filiais com qual papel). Junto vira inferno."
related: [account-creation-flow, session-strategy, rbac-vs-abac, multi-filial, audit-auth]
updated: 2026-04
---

## A separação que salva sua vida

Todo ERP que junta tudo numa tabela `users` (email, senha, tenant_id, role) sofre depois. O modelo correto:

```sql
-- identidade global (uma pessoa, um login, vários tenants)
CREATE TABLE identities (
  id UUID PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL,
  email_verified_at TIMESTAMPTZ,
  password_hash TEXT,           -- nullable se só OAuth
  totp_secret TEXT,             -- 2FA
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  disabled_at TIMESTAMPTZ
);

-- perfil (dados de exibição da pessoa)
CREATE TABLE profiles (
  identity_id UUID PRIMARY KEY REFERENCES identities(id),
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  ...
);

-- membership (essa pessoa pertence a quais tenants com qual papel)
CREATE TABLE memberships (
  id UUID PRIMARY KEY,
  identity_id UUID NOT NULL REFERENCES identities(id),
  tenant_id UUID NOT NULL,
  branch_id UUID,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',  -- active, invited, suspended
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  UNIQUE (identity_id, tenant_id, branch_id)
);

-- providers OAuth/SSO (opcional)
CREATE TABLE identity_providers (
  identity_id UUID NOT NULL REFERENCES identities(id),
  provider TEXT NOT NULL,         -- google, microsoft, ...
  subject TEXT NOT NULL,
  PRIMARY KEY (provider, subject)
);
```

Por que separar:
- Mesma pessoa pode trabalhar em mais de uma empresa cliente sua.
- Profile muda sem mexer em segurança.
- Memberships expiram, suspendem, revogam — sem deletar a identity.
- Auditoria fica no nível certo (login = identity, ação no tenant = membership).

## Sessão = identity + tenant ativo

Após login, o usuário escolhe (ou tem default) o **tenant ativo**. A sessão guarda:

```ts
type Session = {
  identityId: string;
  activeTenantId: string;
  activeBranchId: string | null;
  membershipId: string;
  role: string;
  scope: 'branch' | 'company' | 'tenant';
};
```

Trocar de tenant = nova sessão (ou refresh do JWT com novo `activeTenantId`).

## Onde vive a auth

Decisões:
- **Mesmo serviço (auth como módulo do monolito)**: simples, bom default no início.
- **Serviço separado de Identity**: faz sentido quando há múltiplos produtos da empresa que compartilham conta.
- **Provedor terceiro** (Auth0, Clerk, Better-Auth, WorkOS): rápido pra começar; preço escala feio em ERP B2B com muitos usuários por cliente.

## Onboarding e convites

- Convite via e-mail com token de uso único e expiração curta.
- Aceitar convite cria a `membership` (não cria identity nova se a pessoa já tinha login).
- Primeiro usuário do tenant vira `owner` automaticamente.

## Como pedir pra IA

> "Modele a arquitetura de auth do nosso ERP em NestJS + Postgres. Separe `identities`, `profiles`, `memberships`. Sessão JWT com `identityId` + `activeTenantId`. Endpoint `POST /auth/switch-tenant` reemite token com novo tenant. Implemente convite por e-mail com token de uso único, e fluxo de criação de senha pelo convidado. Não codifique role no JWT — busque membership ativa no DB com cache curto."

## Como auditar

- [ ] Não existe coluna `tenant_id` em `identities`.
- [ ] Trocar de tenant não exige logout/login.
- [ ] Senha hash com Argon2id (ou bcrypt cost ≥ 12 se Argon não rolar).
- [ ] 2FA disponível pelo menos via TOTP.
- [ ] Tokens de convite/reset são de uso único, expiram em ≤ 24h.
- [ ] Reset de senha invalida sessões anteriores.
- [ ] Endpoint de troca de tenant valida que a membership existe e está ativa.
- [ ] Logs de login/falha/troca de tenant são gravados.

## Anti-padrões

- `users.tenant_id` (impede multi-tenancy do usuário).
- Role no JWT que dura 24h sem revogação possível.
- Confiar no e-mail vindo do JWT pra autenticar (sempre olhe `sub` = identityId).
- Misturar autenticação e autorização no mesmo módulo gigante.
