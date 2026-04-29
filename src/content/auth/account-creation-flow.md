---
title: "Fluxo de criação de conta"
category: auth
stack: [NestJS, Next.js]
tags: [auth, onboarding, signup]
excerpt: "Signup → verificação de e-mail → onboarding → primeira sessão. Cada etapa tem armadilha."
related: [auth-architecture, session-strategy, audit-auth]
updated: 2026-04
---

## Fluxos possíveis

Em ERP B2B, criar conta tem dois caminhos:

1. **Self-signup**: alguém cria conta + cria tenant novo (trial, demo, free tier).
2. **Convite**: alguém de tenant existente convida nova pessoa por e-mail.

Trate como fluxos diferentes. Self-signup precisa de validação anti-bot, captcha, verificação de e-mail antes de qualquer ação. Convite confia no convidador.

## Self-signup — passos

1. Form: e-mail, senha, nome, nome do tenant (empresa).
2. Cria `identity` (não verificada), `tenant`, `membership` como `owner`, `profile`.
3. Marca `email_verified_at = NULL`.
4. Envia e-mail com token (uso único, expira em 24h).
5. Sessão limitada: usuário entra, mas **não pode fazer ações sensíveis** até verificar e-mail.
6. Verificação: clica no link → `email_verified_at = now()` → libera todas as ações.
7. Wizard de onboarding: dados da empresa, primeiro dado real (cliente, produto), tour de 3 telas.

## Convite — passos

1. Owner/admin cria convite (e-mail, role, branch).
2. Sistema envia e-mail com token (uso único, expira em 7 dias).
3. Destinatário clica → ou faz login (se já tem identity) e aceita; ou cria senha (se identity nova).
4. Aceita → `membership.status = active`, `accepted_at = now()`.
5. Cai direto no tenant ativo, com role definido.

## Senha

- **Argon2id** (preferido em 2026) ou bcrypt cost ≥ 12.
- Mínimo 12 caracteres, sem regras malucas. Bloqueie só senhas em listas de vazamento (HaveIBeenPwned API ou lista local).
- Force reset se senha aparecer em vazamento futuro.

## Pós-signup — onboarding

ERP é complexo. Onboarding ruim mata trial. Mínimo:
- Tela 1: confirmar dados da empresa (CNPJ via consulta de API).
- Tela 2: criar primeiro usuário operacional + filial principal.
- Tela 3: tour de 3 features chave (cadastro, primeira venda, primeiro relatório).
- Permita "pular" mas reforce com banner pendente.

## Como pedir pra IA

> "Implemente self-signup pro ERP em Nest + Next: form validado com zod, criação atômica em transação (identity + profile + tenant + membership owner). E-mail de verificação com token (UUID v4 + hash no banco; comparar hash). Sessão pré-verificação tem flag que bloqueia mutações. Endpoint `POST /auth/verify` ativa o e-mail. Onboarding wizard em 3 passos no `/onboarding` que só aparece se `tenant.onboarded_at IS NULL`. Reenviar e-mail com rate limit de 1 por minuto."

## Checklist de auditoria

- [ ] Criação de identity + tenant + membership está em **uma única transação**.
- [ ] Token de verificação é **hashado** no banco (igual senha) — vazar log = vazar token sem hash.
- [ ] Tokens expiram (24h verificação, 7d convite).
- [ ] Endpoint de envio de e-mail tem rate limit por IP **e** por identity.
- [ ] Captcha (hCaptcha/Turnstile) no self-signup pra barrar bot.
- [ ] Pós-signup, eventos `IdentityCreated`, `TenantCreated`, `MembershipCreated` são publicados (auditoria + analytics).
- [ ] Convite expirado retorna mensagem clara, não 500.
- [ ] Não há "magic link" sem 2º fator pra contas com permissões críticas.

## Anti-padrões

- Liberar tudo antes de verificar e-mail (vira fonte de spam, fraude).
- Token em URL sem hash no banco. Logs vão guardar.
- Tenant criado fora da transação do user → zumbi se algo falhar.
- Onboarding obrigatório de 10 passos no primeiro acesso. Mata conversão.
