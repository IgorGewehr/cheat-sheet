---
title: "Armadilha IA: Configurações Hardcoded"
category: armadilhas-ia
tags: [config, segurança, deploy, env]
stack: [NestJS, Next.js, Docker]
excerpt: A IA coloca URLs, timeouts, limites e credenciais diretamente no código. Impossível mudar sem redeploy, impossível auditar, fácil de vazar.
related: [docker-compose-dev, observability]
updated: "2026-04"
---

## O que a IA faz por padrão

```typescript
// Credenciais e URLs hardcoded
const stripe = new Stripe("sk_live_XXXXXXXXXXXXXXXX");

// Timeouts e limites mágicos
const TIMEOUT = 5000;
const MAX_RETRIES = 3;
const API_URL = "https://api.pagamento.com.br/v2";

// Regras de negócio hardcoded que mudam com o tempo
const FREE_PLAN_LIMIT = 100;
const PREMIUM_PLAN_LIMIT = 10000;
const TRIAL_DAYS = 14;
```

A IA não sabe que você tem ambientes dev/staging/prod com configurações diferentes, ou que o limite do plano vai mudar sem necessidade de redeploy.

## Por que é um problema

- **Segurança**: credenciais no código vazam via git history, logs de CI, npm pack
- **Operação**: mudar timeout exige build + deploy (não pode ser ajustado em runtime)
- **Multi-ambiente**: dev e prod com configurações diferentes → erro humano garantido
- **Auditoria**: impossível saber qual valor está ativo em qual ambiente

## A versão correta — ConfigService + validação no startup

```typescript
// config/config.ts — validado no startup da aplicação
import { z } from 'zod';

const configSchema = z.object({
  // Credentials
  STRIPE_SECRET_KEY:       z.string().min(1),
  DATABASE_URL:            z.string().url(),
  JWT_SECRET:              z.string().min(32),

  // Service URLs
  PAYMENT_API_URL:         z.string().url(),
  PAYMENT_API_TIMEOUT_MS:  z.coerce.number().int().positive().default(5000),
  PAYMENT_API_MAX_RETRIES: z.coerce.number().int().min(1).max(10).default(3),

  // Business rules (podem mudar por env sem redeploy)
  FREE_PLAN_LIMIT:         z.coerce.number().int().positive().default(100),
  PREMIUM_PLAN_LIMIT:      z.coerce.number().int().positive().default(10000),
  TRIAL_DAYS:              z.coerce.number().int().positive().default(14),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type AppConfig = z.infer<typeof configSchema>;

// Valida no startup — se faltar variável obrigatória, a aplicação não sobe
export const config = configSchema.parse(process.env);
```

```typescript
// NestJS — ConfigModule com validação
ConfigModule.forRoot({
  isGlobal: true,
  validate: (env) => configSchema.parse(env),
}),
```

```bash
# .env.local (nunca commitado)
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
JWT_SECRET=dev-secret-32-chars-minimum

# .env.example (commitado — template sem valores reais)
STRIPE_SECRET_KEY=
DATABASE_URL=
JWT_SECRET=
FREE_PLAN_LIMIT=100
TRIAL_DAYS=14
```

## Como detectar no code review

- [ ] Existem strings literais de URLs, tokens ou segredos no código?
- [ ] Timeouts, limites e regras de negócio estão em variáveis de ambiente?
- [ ] Existe um `.env.example` com todas as variáveis documentadas?
- [ ] A aplicação falha no startup se variáveis obrigatórias estiverem ausentes?
- [ ] O `.env.local` / `.env` está no `.gitignore`?

## Prompt para evitar esta armadilha

```
Toda configuração que pode variar entre ambientes (dev/staging/prod)
ou mudar sem redeploy DEVE vir de variável de ambiente:
- Credenciais: sempre env var
- URLs de serviços externos: env var
- Timeouts, limites, feature flags: env var com default sensato
- Regras de negócio numéricas: env var
Valide todas as variáveis no startup com Zod/Joi — falhe rápido se faltar.
```
