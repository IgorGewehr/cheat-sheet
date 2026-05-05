---
title: "NestJS — Configuração e Variáveis de Ambiente com Zod"
category: padroes-backend
stack: [NestJS, TypeScript, Zod]
tags: [nestjs, config, env, zod, validação, environment]
excerpt: "Valide o .env no startup com Zod. ConfigService tipado. A app falha rápido se faltou variável — não em runtime às 3h da manhã."
related: [nestjs-di-providers, nest-module-organization, nestjs-guards-interceptors]
updated: "2026-05"
---

## Por que validar env no startup

Sem validação, `process.env.DATABASE_URL` é `string | undefined`. Você descobre que está `undefined` quando a primeira query falha em produção.

Com validação no startup: a app não sobe se o `.env` está incompleto. Falha rápida, erro claro.

## Setup com Zod (sem @nestjs/config)

```ts
// src/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  // Banco
  DATABASE_URL: z.string().url(),
  
  // Auth
  JWT_SECRET: z.string().min(32, "JWT_SECRET precisa de ao menos 32 chars"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  
  // App
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  
  // Serviços externos
  OPENAI_API_KEY: z.string().startsWith("sk-").optional(),
  REDIS_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Valida no módulo, uma vez só
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const msg = Object.entries(errors)
      .map(([k, v]) => `${k}: ${v?.join(", ")}`)
      .join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${msg}`);
  }
  return result.data;
}
```

## Registrando no AppModule

```ts
// app.module.ts
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./config/env";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,              // lê process.env uma vez e guarda em memória
      expandVariables: true,    // suporte a ${VAR} em .env
    }),
    DatabaseModule.forRootAsync({
      useFactory: (config: ConfigService<Env>) => ({
        connectionString: config.getOrThrow("DATABASE_URL"),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## ConfigService tipado

Com `ConfigService<Env>`, `get()` e `getOrThrow()` têm autocomplete e verificação de tipo:

```ts
@Injectable()
export class AuthService {
  constructor(private config: ConfigService<Env, true>) {}
  // o segundo generic `true` = apenas getOrThrow (sem undefined)

  getJwtSecret(): string {
    return this.config.getOrThrow("JWT_SECRET");
    // retorno: string (não string | undefined)
  }
}
```

## Padrão: service de config próprio

Para evitar `ConfigService<Env>` espalhado, crie um wrapper:

```ts
// src/config/app-config.service.ts
@Injectable()
export class AppConfigService {
  constructor(private env: ConfigService<Env, true>) {}

  get databaseUrl() { return this.env.getOrThrow("DATABASE_URL"); }
  get jwtSecret() { return this.env.getOrThrow("JWT_SECRET"); }
  get jwtExpiresIn() { return this.env.getOrThrow("JWT_EXPIRES_IN"); }
  get port() { return this.env.getOrThrow("PORT"); }
  get isProduction() { return this.env.getOrThrow("NODE_ENV") === "production"; }
}

// config.module.ts
@Global()
@Module({
  imports: [ConfigModule],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
```

Agora outros módulos injetam `AppConfigService` — sem string magic, com autocomplete.

## Arquivos .env por ambiente

```
.env                   ← defaults (commitar sem secrets)
.env.local             ← override local (gitignore)
.env.development       ← dev defaults
.env.test              ← testes (commitar, sem secrets reais)
.env.production        ← nunca commitado — injetado pelo CI/infra
```

### .env.local (gitignore)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/brain_dev
JWT_SECRET=dev-secret-key-change-in-production-must-be-32-chars
```

### .env.test
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/brain_test
JWT_SECRET=test-secret-key-change-in-production-must-be-32-chars
NODE_ENV=test
```

## Segredos em produção

**Nunca**: variável com secret em arquivo commitado.

**Sempre**: secrets injetados pelo ambiente de execução:

```yaml
# GitHub Actions
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}

# Kubernetes
envFrom:
  - secretRef:
      name: app-secrets
```

Para desenvolvimento local com secrets compartilhados no time: use `1Password CLI`, `Vault`, ou `SOPS` — nunca um `.env` no repositório.

## Múltiplos ambientes por feature

```ts
// Para habilitar/desabilitar features por env:
const featureSchema = z.object({
  FEATURE_AI_REVIEW: z.coerce.boolean().default(false),
  FEATURE_SQUAD: z.coerce.boolean().default(false),
});

// uso:
if (this.config.get("FEATURE_AI_REVIEW")) { ... }
```

## Como pedir pra IA

> "Crie `AppConfigService` para nosso NestJS com schema Zod. Variáveis: `DATABASE_URL` (url), `JWT_SECRET` (min 32 chars), `JWT_EXPIRES_IN` (default '7d'), `PORT` (number, default 3001), `NODE_ENV` (enum dev/test/production, default development), `OPENAI_API_KEY` (opcional). Crie `AppConfigModule` global com `ConfigModule.forRoot({ validate })`. Inclua tipos `Env` e `AppConfigService` com getters tipados."

## Auditoria

- [ ] App não sobe sem variáveis obrigatórias — testado localmente.
- [ ] Sem `process.env.ALGO` direto no código (tudo via `AppConfigService`).
- [ ] `.env.local` no `.gitignore`, `.env.test` commitado sem secrets reais.
- [ ] JWT_SECRET tem mínimo de 32 caracteres validado no schema.
- [ ] Secrets de produção injetados pelo CI/infra, não armazenados no repo.

## Anti-padrões

- `process.env.DATABASE_URL ?? "postgresql://localhost"` — fallback silencioso que roda em produção sem banco.
- `ConfigService` sem tipo genérico — `get()` retorna `unknown`.
- Validação de env no runtime da primeira request em vez de no startup.
- Secret no `.env` commitado "só por enquanto".
