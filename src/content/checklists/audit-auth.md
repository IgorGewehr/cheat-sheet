---
title: "Checklist: auditar fluxo de auth gerado por IA"
category: checklists
stack: [NestJS, Next.js]
tags: [auth, auditoria, segurança]
excerpt: "Auth bug é um dos piores. Use essa lista antes de aprovar PR de signup, login, sessão, recuperação de senha, convite."
related: [auth-architecture, account-creation-flow, session-strategy, audit-api-endpoint]
updated: 2026-04
---

## Modelo de dados

- [ ] `identities` separadas de `tenants` e `memberships`.
- [ ] `identities.email` é único e CITEXT (case-insensitive).
- [ ] Senha em `password_hash` com Argon2id (ou bcrypt cost ≥ 12).
- [ ] Sem `tenant_id` em `identities` (uma identidade pode estar em múltiplos tenants).
- [ ] `memberships` define o vínculo + role + scope.

## Signup / criação de conta

- [ ] Self-signup tem captcha (hCaptcha/Turnstile).
- [ ] Rate limit por IP **e** por e-mail.
- [ ] Senha checada contra lista de senhas vazadas (min 12 chars, sem regras malucas).
- [ ] E-mail verification obrigatório antes de ações sensíveis.
- [ ] Token de verificação é **hashado** no banco.
- [ ] Token expira (24h).
- [ ] Criação atômica (identity + tenant + membership em uma transação).
- [ ] Eventos `IdentityCreated`, `TenantCreated` publicados.

## Login

- [ ] Comparação de senha em tempo constante.
- [ ] Mensagem de erro genérica em e-mail não encontrado vs senha errada (anti-enumeration).
- [ ] Rate limit por IP + por identity.
- [ ] Lockout temporário após N tentativas falhas.
- [ ] Logs de tentativas (sucesso e falha) com IP, UA, identity.
- [ ] 2FA TOTP suportado e respeitado quando ativado.

## Sessão

- [ ] Cookie `HttpOnly`, `Secure`, `SameSite=Lax` (ou `Strict`).
- [ ] Refresh token com rotation (cada uso gera novo + invalida antigo).
- [ ] Detecta replay de refresh token (refresh já invalidado sendo usado de novo) e revoga toda a árvore.
- [ ] Access token curto (5-15 min).
- [ ] Permissões NÃO ficam cacheadas no JWT por > 5 min sem possibilidade de re-checagem.
- [ ] Endpoint admin pra revogar TODAS as sessões de uma identity.
- [ ] Logout no servidor (não só limpa cookie).

## Reset de senha

- [ ] Token de reset hashado no banco, uso único, expira em < 1h.
- [ ] Endpoint não revela se e-mail existe (sempre 200, sempre "se o e-mail existir, enviamos…").
- [ ] Reset de senha invalida todas as sessões existentes.
- [ ] E-mail enviado em fila, não bloqueando o request.

## Convite

- [ ] Token de convite hashado, uso único, expira em ≤ 7 dias.
- [ ] Convite duplicado para mesma combinação (identity, tenant, branch) substitui o anterior.
- [ ] Aceitar convite cria membership; se identity ainda não existe, cria.
- [ ] Endpoint `cancelar convite` disponível.

## OAuth / SSO (se aplicável)

- [ ] State CSRF validado.
- [ ] PKCE no fluxo de authorization code.
- [ ] Redirect URI whitelistada.
- [ ] Email do provedor verificado pelo provedor (não confiar em e-mail só porque vem do Google).
- [ ] Vincular a identity existente baseado em e-mail verificado, não criar duplicata.

## Autorização (RBAC + ABAC)

- [ ] Toda mutação tem checagem de permissão.
- [ ] Permissões em config/seed, não hardcoded em decorators espalhados.
- [ ] Recursos check ABAC depois de carregar (filial bate, é dono, etc).
- [ ] RLS em Postgres como última linha (defesa em profundidade).
- [ ] Admin / superuser uso é auditado.

## Audit log

- [ ] Login (sucesso e falha) logado.
- [ ] Mudança de senha logada.
- [ ] Mudança de role/membership logada.
- [ ] Troca de tenant ativo logada.
- [ ] Criação/revogação de sessão logada.

## Sinal vermelho — pare

- IA implementou senha com SHA-256 ou MD5.
- IA salvou token plaintext no banco.
- IA usou JWT de 24h+ sem revogação.
- IA cacheou role no JWT sem refresh.
- IA fez "if email === 'admin@...'" pra dar permissão.
- Endpoint de reset retorna informação diferente se e-mail existe (enumeration).
- Sessão renovada sem rotation.
