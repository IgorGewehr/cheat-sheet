---
title: "OWASP Top 10 2021 — vulnerabilidades críticas com código Node.js/TS"
category: "auth"
stack: ["Node.js", "TypeScript", "Express", "Fastify"]
tags: ["owasp", "segurança", "injeção", "xss", "idor", "autenticação"]
excerpt: "As 10 vulnerabilidades mais críticas da web com exemplos reais de código vulnerável vs seguro em Node.js/TypeScript."
---

## Visão Geral

O OWASP Top 10 2021 é o mapa mínimo obrigatório de segurança para qualquer desenvolvedor web. Não é uma lista acadêmica — é o resultado de dados de centenas de organizações sobre o que realmente está causando breaches em produção.

A cada ~4 anos o OWASP atualiza o ranking. Em 2021 entraram três categorias novas focadas em design e visibilidade: Insecure Design, Software and Data Integrity Failures, e Server-Side Request Forgery.

---

## Quando usar

Consulte este card sempre que:
- Revisar código de outros (ou de IA) antes de ir a produção
- Fazer threat modeling de um novo sistema
- Preparar um checklist de security review
- Investigar um incidente de segurança

---

## Trade-offs

Cobrir todos os 10 itens sistematicamente tem custo de tempo. O ROI muda por contexto:

| Categoria | Risco em SaaS B2B | Risco em API pública |
|---|---|---|
| A01 Broken Access Control | Crítico | Crítico |
| A03 Injection | Alto | Crítico |
| A07 Auth Failures | Crítico | Crítico |
| A05 Security Misconfig | Médio | Alto |
| A02 Crypto Failures | Alto | Alto |

Em sistemas ERP/multi-tenant, A01 (IDOR entre tenants) e A07 (session fixation) matam antes de qualquer outro.

---

## Implementação

### A01 — Broken Access Control (IDOR)

Falha mais comum: confiar em IDs do cliente sem verificar ownership.

**Vulnerável:**
```typescript
// GET /api/invoices/:id
// Qualquer usuário autenticado acessa qualquer nota fiscal
app.get('/api/invoices/:id', authenticate, async (req, res) => {
  const invoice = await db.query(
    'SELECT * FROM invoices WHERE id = $1',
    [req.params.id]
  );
  return res.json(invoice.rows[0]);
});
```

**Seguro:**
```typescript
// Sempre filtre pelo tenant/owner do usuário autenticado
app.get('/api/invoices/:id', authenticate, async (req, res) => {
  const invoice = await db.query(
    'SELECT * FROM invoices WHERE id = $1 AND tenant_id = $2',
    [req.params.id, req.user.tenantId] // nunca confie só no ID
  );

  if (!invoice.rows[0]) {
    // Retorne 404, não 403 — não confirme que o recurso existe
    return res.status(404).json({ error: 'Not found' });
  }

  return res.json(invoice.rows[0]);
});
```

---

### A02 — Cryptographic Failures

Dados sensíveis sem criptografia adequada em trânsito ou em repouso.

**Vulnerável:**
```typescript
// Senha em MD5 (quebrável com rainbow table em segundos)
import crypto from 'crypto';

async function hashPassword(password: string): Promise<string> {
  return crypto.createHash('md5').update(password).digest('hex');
}

// CPF em plaintext no banco
await db.query('INSERT INTO users (cpf, password) VALUES ($1, $2)', [
  cpf,
  hashPassword(password),
]);
```

**Seguro:**
```typescript
import argon2 from 'argon2';
import { createCipheriv, randomBytes } from 'crypto';

// Senha com Argon2id
async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,   // 64MB
    timeCost: 3,
    parallelism: 4,
  });
}

// CPF criptografado com AES-256-GCM
const ENCRYPTION_KEY = Buffer.from(process.env.FIELD_ENCRYPTION_KEY!, 'hex');

function encryptField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // iv:authTag:ciphertext — tudo necessário para decifrar
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}
```

---

### A03 — Injection (SQL, NoSQL, Command)

**SQL Injection vulnerável:**
```typescript
// NUNCA faça interpolação de string em SQL
app.get('/api/users', async (req, res) => {
  const { name } = req.query;
  // Se name = "'; DROP TABLE users; --" ... você sabe o que acontece
  const result = await db.query(
    `SELECT * FROM users WHERE name = '${name}'`
  );
  return res.json(result.rows);
});
```

**Seguro (parameterized queries):**
```typescript
app.get('/api/users', async (req, res) => {
  const { name } = req.query;

  // Validar antes de consultar
  const parsed = z.string().min(1).max(100).safeParse(name);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  // Parâmetro nunca é interpolado no SQL
  const result = await db.query(
    'SELECT id, name, email FROM users WHERE name ILIKE $1',
    [`%${parsed.data}%`]
  );
  return res.json(result.rows);
});
```

**Command Injection vulnerável:**
```typescript
import { exec } from 'child_process';

// Input do usuário direto no shell = desastre
app.post('/api/convert', (req, res) => {
  const { filename } = req.body;
  exec(`convert ${filename} output.pdf`, (err, stdout) => {
    res.json({ result: stdout });
  });
});
```

**Seguro:**
```typescript
import { execFile } from 'child_process';
import path from 'path';

app.post('/api/convert', (req, res) => {
  const { filename } = req.body;

  // Validar que é um nome de arquivo, não um comando
  const safeName = path.basename(filename);
  if (!/^[a-zA-Z0-9._-]+$/.test(safeName)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  // execFile não usa shell — não há interpolação
  execFile('convert', [safeName, 'output.pdf'], (err, stdout) => {
    res.json({ result: stdout });
  });
});
```

---

### A04 — Insecure Design

Falta de controles de segurança no design — não é bug de implementação, é ausência de modelagem.

**Exemplo de design inseguro:** fluxo de reset de senha com link que nunca expira e pode ser reutilizado.

**Design seguro:**
```typescript
// Token de reset: uso único, expira em 15 min, hash no banco
import { randomBytes, createHash } from 'crypto';

async function createResetToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at)
     VALUES ($1, $2, NOW() + INTERVAL '15 minutes', NULL)`,
    [userId, tokenHash]
  );

  return rawToken; // retorne o raw, guarde o hash
}

async function consumeResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  const result = await db.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE token_hash = $1
       AND used_at IS NULL
       AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash]
  );

  return result.rows[0]?.user_id ?? null;
}
```

---

### A05 — Security Misconfiguration

Headers de segurança ausentes, stack trace exposto em produção, CORS aberto.

**Vulnerável:**
```typescript
// Express sem nenhum header de segurança
const app = express();
app.use(express.json());

// CORS wildcard em API que autentica usuários
app.use(cors({ origin: '*' }));

// Stack trace exposto em erro
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});
```

**Seguro:**
```typescript
import helmet from 'helmet';
import cors from 'cors';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

// Erro sem stack trace em produção
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
});
```

---

### A06 — Vulnerable and Outdated Components

```bash
# Auditar dependências com vulnerabilidades conhecidas
npm audit

# Verificar dependências desatualizadas
npm outdated

# Integrar no CI — falhar se houver vulnerabilidades críticas
npm audit --audit-level=critical

# Renovate/Dependabot para PRs automáticos de update
```

---

### A07 — Identification and Authentication Failures

**Vulnerável:**
```typescript
// Sem limite de tentativas de login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = user.id; // session fixation — não regenerou o ID
  return res.json({ ok: true });
});
```

**Seguro:**
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: { error: 'Too many attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);

  // Compare constante — evita timing attack
  const passwordMatch = user
    ? await argon2.verify(user.passwordHash, password)
    : await argon2.verify('$argon2id$v=19$m=65536,t=3,p=4$dummy', 'dummy');

  if (!user || !passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Regenerar session ID após login (session fixation prevention)
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.userId = user.id;
    return res.json({ ok: true });
  });
});
```

---

### A08 — Software and Data Integrity Failures

Sem verificação de integridade de pacotes ou pipelines de deploy.

```typescript
// Webhook de pagamento sem verificação de assinatura
app.post('/webhooks/payment', (req, res) => {
  const event = req.body; // qualquer um pode enviar payload falso
  processPayment(event);
  res.sendStatus(200);
});

// Seguro — verificar assinatura HMAC
import { createHmac, timingSafeEqual } from 'crypto';

app.post('/webhooks/payment',
  express.raw({ type: 'application/json' }), // raw body necessário
  (req, res) => {
    const signature = req.headers['x-webhook-signature'] as string;
    const expectedSig = createHmac('sha256', process.env.WEBHOOK_SECRET!)
      .update(req.body)
      .digest('hex');

    // timingSafeEqual — evita timing attack
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');

    if (sigBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(sigBuffer, expectedBuffer)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString());
    processPayment(event);
    res.sendStatus(200);
  }
);
```

---

### A09 — Security Logging and Monitoring Failures

```typescript
// Logar eventos de segurança críticos de forma estruturada
import { logger } from './logger';

async function loginHandler(req: Request, res: Response) {
  const { email } = req.body;

  try {
    const user = await authenticate(email, req.body.password);

    logger.info({
      event: 'auth.login.success',
      userId: user.id,
      tenantId: user.tenantId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });

    return res.json({ ok: true });
  } catch (err) {
    logger.warn({
      event: 'auth.login.failure',
      email, // logar email é aceitável — não logar senha nunca
      ip: req.ip,
      reason: err instanceof AuthError ? err.code : 'unknown',
      timestamp: new Date().toISOString(),
    });

    return res.status(401).json({ error: 'Invalid credentials' });
  }
}
```

---

### A10 — Server-Side Request Forgery (SSRF)

**Vulnerável:**
```typescript
// URL fornecida pelo usuário é buscada diretamente
app.post('/api/fetch-avatar', async (req, res) => {
  const { url } = req.body;
  const response = await fetch(url); // pode buscar http://169.254.169.254/metadata
  res.send(await response.text());
});
```

**Seguro:**
```typescript
import { URL } from 'url';

const ALLOWED_DOMAINS = ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'];

app.post('/api/fetch-avatar', async (req, res) => {
  const { url } = req.body;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Apenas HTTPS, apenas domínios permitidos
  if (parsed.protocol !== 'https:' || !ALLOWED_DOMAINS.includes(parsed.hostname)) {
    return res.status(400).json({ error: 'URL not allowed' });
  }

  const response = await fetch(parsed.toString());
  res.send(await response.arrayBuffer());
});
```

---

## Armadilhas

- **Confiar no 404 como segurança**: retornar 403 em acesso negado confirma que o recurso existe — prefira 404 para recursos de outros tenants.
- **CORS como segurança**: CORS é proteção para o browser, não para o servidor. APIs que aceitam `*` ainda são vulneráveis a requisições server-to-server.
- **Timing attacks em comparação de strings**: nunca use `===` para comparar tokens ou hashes. Use `timingSafeEqual`.
- **Stack traces em produção**: cada linha de stack trace é um mapa para o atacante.
- **Validação só no frontend**: validação no cliente é UX. Validação no servidor é segurança.

---

## Referências

- [OWASP Top 10 2021 (oficial)](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Snyk Node.js Security Handbook](https://snyk.io/learn/nodejs-security/)
