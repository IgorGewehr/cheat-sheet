---
title: "Monorepo com Turborepo"
category: stack-guides
stack: [Next.js, NestJS, Turborepo]
tags: [monorepo, turborepo]
excerpt: "Apps + packages compartilhados. Cache inteligente. Sem alquimia. Se time é grande, considere Nx; pra Next+Nest, Turbo é certo."
related: [nest-module-organization, app-router]
updated: 2026-04
---

## Estrutura

```
repo/
├── apps/
│   ├── web/            # Next.js (front)
│   ├── api/            # NestJS (back)
│   └── workers/        # Nest standalone (jobs/consumers)
├── packages/
│   ├── shared/         # tipos, schemas zod, utils puros
│   ├── domain/         # opcional: entidades de domínio compartilháveis
│   ├── ui/             # opcional: componentes React reusáveis
│   └── eslint-config/
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## Por que pnpm

- Mais rápido que npm/yarn.
- Workspaces nativos.
- Symlinks rígidos previnem "dependência fantasma" (importar lib não declarada).

## turbo.json mínimo

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "test": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

`^build` significa "buildar dependências antes". Cache local + remote (Vercel) acelera CI.

## Pacote shared — exemplo

```
packages/shared/
├── src/
│   ├── schemas/
│   │   ├── invoice.ts        # zod schemas
│   ├── types/
│   └── utils/
├── package.json
└── tsconfig.json
```

`apps/web` e `apps/api` ambos importam `@erp/shared` — schemas e tipos consistentes.

## TS path aliases

`tsconfig.json` raiz com `paths`:

```json
"paths": { "@erp/shared": ["packages/shared/src"], "@erp/shared/*": ["packages/shared/src/*"] }
```

Em projeto com Next + Nest, configure `transpilePackages` no Next.config se importa pacotes não buildados.

## CI

- Job único por evento, com Turbo cache.
- Affected: `turbo build --filter=...[origin/main]` só roda no que mudou.
- Use Turbo Remote Cache (Vercel free tier) — economia real de tempo de CI.

## Quando NÃO usar monorepo

- Times totalmente separados sem dependência real.
- Repositório que vai virar OSS — costuma ser outro tradeoff.

## Turborepo vs Nx

- **Turbo**: simples, foco em build cache. Default pra Next+Nest.
- **Nx**: mais features (geradores, plug-ins, dep graph rico). Vale em monorepo de muitos apps + libs com fluxo padronizado.

Pra um time de 2-15 devs com Next+Nest+workers: Turbo basta.

## Como pedir pra IA

> "Inicialize monorepo Turbo + pnpm com `apps/web` (Next.js 15), `apps/api` (NestJS 11), `apps/workers` (Nest standalone), `packages/shared` (zod schemas + types compartilhados), `packages/eslint-config`. Configure `transpilePackages: ['@erp/shared']` no Next. tsconfig com paths. turbo.json com build/dev/lint/typecheck. Inclua exemplo: schema `Invoice` em shared, usado no Nest pra validar request e no Next pra validar form."

## Auditoria

- [ ] Sem dependência fantasma (pnpm previne).
- [ ] `package.json` de cada app declara o que usa.
- [ ] Pacotes compartilhados são puros (sem imports de Next/Nest se forem usados pelos dois).
- [ ] Cache de Turbo configurado (e funcionando — `--summarize`).
- [ ] CI roda só em apps afetados.
- [ ] Versões de TS/eslint padronizadas pelo `eslint-config` central.
