---
title: "Gestão de secrets em produção"
category: "auth"
stack: ["Node.js", "TypeScript", "AWS", "GCP", "HashiCorp Vault", "Docker"]
tags: ["secrets", "env-vars", "vault", "aws-secrets-manager", "segurança", "leak"]
excerpt: "Secrets nunca no código. Como estruturar .env local vs produção, AWS Secrets Manager, Vault, rotação automática e como detectar leaks antes que virem incidente."
---

## Visão Geral

Secret management é o gap mais frequente entre apps que funcionam e apps que são seguras. A maioria das brechas de secrets não é sofisticada: é uma API key num repositório público, um `.env` commitado, ou credenciais em variáveis de ambiente sem rotação há dois anos.

O modelo mental correto: **um secret deve existir no menor número possível de lugares, pelo menor tempo possível, com acesso rastreável.**

---

## Quando usar

| Contexto | Abordagem |
|---|---|
| Desenvolvimento local | `.env.local` no gitignore, compartilhado via 1Password/Bitwarden Teams |
| CI/CD | Secrets do repositório (GitHub Actions Secrets, GitLab CI Variables) |
| Produção (cloud) | AWS Secrets Manager, GCP Secret Manager, ou HashiCorp Vault |
| Edge/serverless | Variáveis de ambiente da plataforma (Vercel, Cloudflare) com integração ao secrets manager |
| Multi-tenant com secrets por tenant | Vault com namespaces ou AWS SM com tags de recurso |

---

## Trade-offs

**Variáveis de ambiente diretamente vs Secrets Manager:**
- Env vars: simples, zero latência, disponível em qualquer linguagem. Problema: ficam em logs de processo, `ps aux`, dumps de memória e erros de configuração de CI/CD.
- Secrets Manager: auditável, rotacionável, acessível por referência — não por valor. Adiciona latência na inicialização e dependência de rede.
- Em produção real: use Secrets Manager como fonte de verdade, injete em env vars no start da aplicação ou acesse via SDK.

**Rotação automática vs manual:**
- Manual: simples mas depende de disciplina humana — não funciona em escala.
- Automática: requer que sua aplicação suporte múltiplas versões do secret simultaneamente (período de overlap durante rotação).

---

## Implementação

### .env.local — estrutura correta para desenvolvimento

```bash
# .env.local (nunca commitado)
DATABASE_URL=postgresql://user:pass@localhost:5432/myapp_dev
REDIS_URL=redis://localhost:6379

# Prefixo indica o serviço — facilita auditoria
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Secrets de terceiros com descrição do escopo
STRIPE_SECRET_KEY=sk_test_...   # Chave de teste — NUNCA a de produção aqui
OPENAI_API_KEY=sk-...

# Expiração documentada — lembra de rotacionar
# EXPIRES: 2026-08-01
INTERNAL_API_KEY=xyz123
```

```bash
# .gitignore — o mínimo que não pode faltar
.env
.env.local
.env.*.local
.env.production
*.pem
*.key
secrets/
```

### Validação de variáveis de ambiente na inicialização

```typescript
// src/config/env.ts — falhe rápido, não em runtime
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  FIELD_ENCRYPTION_KEY: z
    .string()
    .length(64, 'FIELD_ENCRYPTION_KEY deve ser 64 chars hex (32 bytes)'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
});

// Exportar env tipado — nunca use process.env diretamente no código
export const env = envSchema.parse(process.env);
```

### AWS Secrets Manager — acesso via SDK

```typescript
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });

// Cache em memória para evitar latência em toda requisição
const secretCache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export async function getSecret(secretName: string): Promise<string> {
  const cached = secretCache.get(secretName);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);

  const value = response.SecretString ?? '';
  secretCache.set(secretName, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

// Para secrets JSON (ex: credenciais de banco)
export async function getSecretJson<T>(secretName: string): Promise<T> {
  const raw = await getSecret(secretName);
  return JSON.parse(raw) as T;
}

// Uso na inicialização da app
async function initApp() {
  const dbCreds = await getSecretJson<{
    username: string;
    password: string;
    host: string;
    port: number;
  }>('myapp/production/database');

  const pool = new Pool({
    user: dbCreds.username,
    password: dbCreds.password,
    host: dbCreds.host,
    port: dbCreds.port,
    database: 'myapp',
    ssl: { rejectUnauthorized: true },
  });

  return pool;
}
```

### HashiCorp Vault — acesso dinâmico e rotação

```typescript
import axios from 'axios';

const VAULT_ADDR = process.env.VAULT_ADDR!;
const VAULT_TOKEN = process.env.VAULT_TOKEN!; // token de curta duração via AppRole

interface VaultResponse<T> {
  data: T;
  lease_duration: number;
  renewable: boolean;
}

export async function getVaultSecret<T>(path: string): Promise<T> {
  const response = await axios.get<VaultResponse<T>>(
    `${VAULT_ADDR}/v1/${path}`,
    { headers: { 'X-Vault-Token': VAULT_TOKEN } }
  );
  return response.data.data;
}

// Credenciais dinâmicas de banco — Vault gera usuário/senha temporários
async function getDynamicDbCredentials() {
  const creds = await getVaultSecret<{ username: string; password: string }>(
    'database/creds/myapp-role'
  );
  // Vault rotaciona automaticamente — TTL configurado no role
  return creds;
}
```

### Rotação automática — suporte a versões simultâneas

```typescript
// Suporte a secret atual e anterior durante período de rotação
interface SecretVersion {
  current: string;
  previous?: string;
}

async function getSecretWithRotationSupport(name: string): Promise<SecretVersion> {
  const [current, previous] = await Promise.allSettled([
    getSecret(`${name}/AWSCURRENT`),
    getSecret(`${name}/AWSPREVIOUS`),
  ]);

  return {
    current: current.status === 'fulfilled' ? current.value : '',
    previous: previous.status === 'fulfilled' ? previous.value : undefined,
  };
}

// Verificação de assinatura com suporte a rotação
async function verifyApiKey(providedKey: string): Promise<boolean> {
  const { current, previous } = await getSecretWithRotationSupport('myapp/api-key');

  // Aceitar chave atual OU anterior (janela de rotação)
  return safeCompare(providedKey, current) ||
    (previous != null && safeCompare(providedKey, previous));
}
```

### Detecção de leak — pre-commit e CI

```bash
# Instalar gitleaks para detecção de secrets no git
brew install gitleaks

# Verificar repositório inteiro
gitleaks detect --source . --verbose

# Hook pre-commit — adicionar ao .git/hooks/pre-commit
#!/bin/sh
gitleaks protect --staged --redact
if [ $? -ne 0 ]; then
  echo "ERROR: Secret detectado no staged diff. Remova antes de commitar."
  exit 1
fi
```

```yaml
# GitHub Actions — verificação em todo PR
name: Security
on: [pull_request]

jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Rotação de secrets em produção — checklist

```typescript
// Script de rotação — executar em pipeline
async function rotateSecret(secretName: string, newValue: string) {
  const sm = new SecretsManagerClient({ region: env.AWS_REGION });

  // 1. Colocar novo valor como AWSPENDING
  await sm.send(new PutSecretValueCommand({
    SecretId: secretName,
    SecretString: newValue,
    VersionStages: ['AWSPENDING'],
  }));

  // 2. Testar o novo valor antes de promover
  await testNewSecret(secretName, newValue);

  // 3. Promover PENDING para CURRENT
  await sm.send(new UpdateSecretVersionStageCommand({
    SecretId: secretName,
    VersionStage: 'AWSCURRENT',
    MoveToVersionId: await getPendingVersionId(secretName),
    RemoveFromVersionId: await getCurrentVersionId(secretName),
  }));

  // 4. Log de auditoria
  logger.info({
    event: 'secret.rotated',
    secretName,
    timestamp: new Date().toISOString(),
    rotatedBy: 'automated-rotation-lambda',
  });
}
```

---

## Armadilhas

- **`.env` no `.gitignore` mas não no `.git/info/exclude`**: se o `.env` foi commitado antes de ser adicionado ao `.gitignore`, ele ainda está no histórico. Use `git filter-repo` para limpar.
- **Logar secrets acidentalmente**: frameworks que logam toda configuração na inicialização (NestJS por padrão) vão logar seus secrets. Configure quais campos omitir.
- **Secrets em variáveis de ambiente do Docker sem secrets**: `docker inspect` expõe todas as env vars. Use Docker Secrets ou injete via entrypoint.
- **Cache de secret sem TTL**: cachear indefinidamente em memória impede que a rotação funcione. Use TTL de 5-15 minutos.
- **Scope excessivo**: uma API key com acesso admin quando precisa apenas de leitura. Aplique least privilege.
- **Secrets em URLs de conexão**: `postgresql://user:password@host/db` em logs de erro expõe credencial. Use parâmetros separados.

---

## Referências

- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [HashiCorp Vault Getting Started](https://developer.hashicorp.com/vault/tutorials/getting-started)
- [Gitleaks — detecção de secrets](https://github.com/gitleaks/gitleaks)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12factor.net — Config](https://12factor.net/config)
