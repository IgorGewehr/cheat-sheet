---
title: "Dockerfile multi-stage pra Node"
category: infra
stack: [Docker, Next.js, NestJS]
tags: [docker, deploy]
excerpt: "Build em estágio gordo, copia pro estágio slim. Imagem final pequena, sem dev deps, sem código fonte."
related: [docker-compose-dev, observability]
updated: 2026-04
---

## Estrutura

```dockerfile
# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22

# 1) deps — instala dependências (cacheável)
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile

# 2) build — compila TS, Next build
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

# 3) runner — imagem final, slim
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./package.json
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
```

## Truques importantes

- **Layer order**: copia `package.json` antes do código. Mudança de código não invalida cache de `pnpm install`.
- **`--frozen-lockfile`** (ou `--immutable`): falha se lockfile mudou.
- **Usuário não-root**: `USER app`.
- **Healthcheck**: orquestrador (k8s, ECS, swarm) usa.
- **Sinais**: Node 22+ trata SIGTERM melhor; pra graceful shutdown, capture e finalize conexões antes do `process.exit`.

## Next.js standalone

Next 15 com `output: 'standalone'` produz pasta `.next/standalone` com tudo o necessário. Imagem final fica MUITO menor:

```dockerfile
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
CMD ["node", "server.js"]
```

## Imagens slim — distroless

Pra ainda menor + menos vulnerabilidades, use **distroless** (`gcr.io/distroless/nodejs22-debian12`). Sem shell, sem package manager. Debug exige `:debug` variant.

## Cache de build em CI

- BuildKit cache mount: `RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install ...`.
- Em CI, `docker buildx` com cache em registry remoto.

## Tamanhos típicos

- Node alpine + pnpm install + Next build naïve: ~1.2 GB.
- Multi-stage com standalone: ~200 MB.
- Distroless: ~120 MB.

Vale o trabalho.

## Como pedir pra IA

> "Crie Dockerfile multi-stage pra `apps/api` (NestJS 11). 3 stages: deps (instala), build (compila), runner (slim, alpine, user não-root, healthcheck). Use BuildKit cache mount pro pnpm store. Final < 300MB. Inclua docker-compose.yml para subir API + Postgres + Redis pra testar local. Mostre comando docker buildx pra build com cache remoto."

## Auditoria

- [ ] Multi-stage real (não copia node_modules de dev pra prod).
- [ ] Usuário não-root.
- [ ] Healthcheck definido.
- [ ] `package.json` copiado antes do código fonte (cache layer).
- [ ] `--frozen-lockfile`.
- [ ] Imagem final < 300MB pra Node app típica.
- [ ] Sem secrets em ARG/ENV (usar Docker secrets ou env do orquestrador).
- [ ] Logs em stdout/stderr (não escrevendo em arquivo dentro do container).
