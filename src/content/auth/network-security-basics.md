---
title: "Segurança de rede para desenvolvedores"
category: "auth"
stack: ["Node.js", "TypeScript", "Nginx", "AWS", "Kubernetes"]
tags: ["tls", "mtls", "cors", "csp", "hsts", "rate-limiting", "vpc", "firewall"]
excerpt: "TLS/mTLS, CORS correto (não *), CSP headers, HSTS, firewall rules, VPC/security groups e rate limiting por IP — o que todo dev precisa saber sobre a camada de rede."
---

## Visão Geral

Segurança de rede para desenvolvedores não é sobre ser especialista em networking — é sobre não deixar buracos óbvios que invalidam toda a segurança da aplicação. Um JWT perfeito não adianta se o endpoint aceita requisições de qualquer origem com `Access-Control-Allow-Origin: *`.

Os principais pontos de atenção para devs:
- **TLS/mTLS**: criptografia em trânsito
- **Headers de segurança**: CORS, CSP, HSTS, X-Frame-Options
- **Rate limiting**: proteção contra brute force e DDoS na camada de app
- **Segmentação**: VPC, Security Groups, firewall rules

---

## Quando usar

- **TLS**: sempre, sem exceção. HTTP puro não vai a produção.
- **mTLS**: comunicação entre microsserviços internos — serviços que precisam autenticar um ao outro, não apenas o usuário.
- **CORS restrito**: qualquer API que autentica usuários via cookie ou Authorization header.
- **CSP**: toda aplicação web que renderiza HTML — protege contra XSS mesmo se código injeção acontecer.
- **Rate limiting por IP**: qualquer endpoint público — auth, search, APIs sem autenticação.

---

## Trade-offs

**CORS permissivo vs restrito:**
- `*` é aceitável apenas para APIs públicas de leitura sem autenticação (ex: API de timezone pública).
- Com credentials (cookies, auth headers) o browser rejeita `*` — você precisa especificar a origem exata.
- CORS é proteção do browser — não substitui autenticação no servidor.

**CSP strict vs relaxado:**
- CSP estrita (`default-src 'self'`) quebra qualquer inline script/style. Requer refatoração de código legado.
- Use `Content-Security-Policy-Report-Only` primeiro para mapear violações sem quebrar a app.

**mTLS vs JWT entre serviços:**
- mTLS: autenticação no nível de rede, sem necessidade de código. Mais robusto mas requer infraestrutura (service mesh ou PKI própria).
- JWT de serviço: mais simples de implementar, requer gestão de tokens e rotação.

---

## Implementação

### TLS — configuração correta no Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/ssl/certs/example.com.pem;
    ssl_certificate_key /etc/ssl/private/example.com.key;

    # TLS 1.2 mínimo — desabilitar 1.0 e 1.1
    ssl_protocols TLSv1.2 TLSv1.3;

    # Cipher suites modernos (forward secrecy)
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS — 1 ano, incluindo subdomínios
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # OCSP stapling — performance e privacidade
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/ssl/certs/ca-chain.pem;

    # Redirecionar HTTP para HTTPS
    location / {
        proxy_pass http://app:3000;
    }
}

server {
    listen 80;
    server_name api.example.com;
    return 301 https://$host$request_uri;
}
```

### Headers de segurança no Node.js/Express

```typescript
import helmet from 'helmet';
import cors from 'cors';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean);

// Helmet configura a maioria dos headers de segurança
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],           // sem 'unsafe-inline'
      styleSrc: ["'self'", "'unsafe-inline'"], // inline styles comuns em frameworks
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],            // previne clickjacking
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  // X-Frame-Options (redundante com CSP frame-src 'none' mas defense in depth)
  frameguard: { action: 'deny' },

  // Impede sniffing de Content-Type
  noSniff: true,

  // HSTS — 1 ano
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  // Remover X-Powered-By: Express
  hidePoweredBy: true,

  // Referrer policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // Permissions Policy (câmera, microfone, localização)
  permittedCrossDomainPolicies: false,
}));

// CORS — origens explícitas, nunca *
app.use(cors({
  origin: (origin, callback) => {
    // Requisições server-to-server não têm origin
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,        // necessário para cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400,            // pre-flight cache por 24h
}));
```

### CSP Report-Only — mapear violações antes de enforcar

```typescript
// Usar primeiro para descobrir o que vai quebrar
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy-Report-Only',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "report-uri /api/csp-report", // endpoint para receber violações
    ].join('; ')
  );
  next();
});

// Endpoint para receber e logar violações de CSP
app.post('/api/csp-report',
  express.json({ type: 'application/csp-report' }),
  (req, res) => {
    logger.warn({ event: 'csp.violation', report: req.body, ip: req.ip });
    res.sendStatus(204);
  }
);
```

### Rate limiting por IP com Redis

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });

// Rate limit global — todas as rotas
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minuto
  max: 100,             // 100 req/min por IP
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args),
  }),
});

// Rate limit rigoroso para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                   // 10 tentativas
  message: {
    error: 'Too many login attempts',
    retryAfter: '15 minutes',
  },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args),
    prefix: 'auth_rl:',
  }),
  // Rate limit por IP + email (mais preciso)
  keyGenerator: (req) => {
    const email = req.body?.email ?? '';
    return `${req.ip}_${email.toLowerCase()}`;
  },
});

// Rate limit para APIs públicas
const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args),
    prefix: 'pub_rl:',
  }),
});

app.use(globalLimiter);
app.post('/auth/login', authLimiter, loginHandler);
app.get('/api/public/*', publicApiLimiter, publicHandler);
```

### mTLS entre microsserviços

```typescript
import https from 'https';
import fs from 'fs';

// Servidor que requer certificado do cliente
const serverOptions: https.ServerOptions = {
  key: fs.readFileSync('/certs/server.key'),
  cert: fs.readFileSync('/certs/server.crt'),
  ca: fs.readFileSync('/certs/ca.crt'),  // CA interna
  requestCert: true,                      // exigir cert do cliente
  rejectUnauthorized: true,              // rejeitar se inválido
};

const server = https.createServer(serverOptions, app);

// Middleware para verificar que o cert veio do nosso CA
app.use((req: Request & { socket: tls.TLSSocket }, res, next) => {
  const cert = req.socket.getPeerCertificate();
  if (!req.socket.authorized) {
    return res.status(401).json({ error: 'Valid client certificate required' });
  }
  // Verificar subject — qual serviço está chamando
  const cn = cert.subject?.CN;
  if (!['payment-service', 'notification-service'].includes(cn)) {
    return res.status(403).json({ error: 'Service not authorized' });
  }
  next();
});

// Cliente que se autentica com seu próprio certificado
const clientOptions: https.RequestOptions = {
  key: fs.readFileSync('/certs/client.key'),
  cert: fs.readFileSync('/certs/client.crt'),
  ca: fs.readFileSync('/certs/ca.crt'),
};

const httpsAgent = new https.Agent(clientOptions);
const response = await fetch('https://internal-api:8443/endpoint', {
  agent: httpsAgent,
});
```

### AWS Security Groups — firewall declarativo

```hcl
# Terraform — Security Group para API
resource "aws_security_group" "api" {
  name   = "api-sg"
  vpc_id = var.vpc_id

  # Entrada: apenas HTTPS do load balancer
  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTPS from ALB only"
  }

  # Saída: banco na subnet privada
  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds.id]
    description     = "PostgreSQL to RDS"
  }

  # Saída: Redis na subnet privada
  egress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.redis.id]
    description     = "Redis"
  }

  # SEM regra de saída 0.0.0.0/0 — explicitamente bloqueado
}

# RDS só aceita do API security group
resource "aws_security_group" "rds" {
  name   = "rds-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.api.id]
    description     = "PostgreSQL from API only"
  }
}
```

### Certificate Pinning (mobile / APIs críticas)

```typescript
import tls from 'tls';
import crypto from 'crypto';
import https from 'https';

// Hash SHA-256 do public key do servidor (não do certificado inteiro)
const PINNED_KEY_HASH = 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

function createPinnedAgent(): https.Agent {
  return new https.Agent({
    checkServerIdentity: (host, cert) => {
      // Verificação padrão de hostname primeiro
      const err = tls.checkServerIdentity(host, cert);
      if (err) return err;

      // Calcular hash do public key
      const publicKey = cert.pubkey;
      const hash = `sha256/${crypto
        .createHash('sha256')
        .update(publicKey)
        .digest('base64')}`;

      if (hash !== PINNED_KEY_HASH) {
        return new Error(`Certificate pinning failed: got ${hash}`);
      }
    },
  });
}

// Usar apenas em contextos onde você controla o certificado do servidor
const response = await fetch('https://internal-payment-api/charge', {
  agent: createPinnedAgent(),
  method: 'POST',
  body: JSON.stringify(payload),
});
```

---

## Armadilhas

- **CORS `*` com credentials**: o browser rejeita, mas o dev adiciona `*` e fica confuso. A solução correta é especificar a origem.
- **HSTS sem `preload`**: sem preload, usuários que nunca visitaram o site podem ser atacados na primeira visita. Submita ao HSTS preload list.
- **Rate limit só por IP**: IPs compartilhados (NAT corporativo, Cloudflare) fazem rate limit por IP bloquear usuários legítimos. Combine com user ID quando autenticado.
- **Security Group com `0.0.0.0/0` saída**: regra de saída irrestrita significa que um container comprometido pode exfiltrar dados para qualquer lugar. Restrinja saída.
- **mTLS com CA pública**: mTLS interno deve usar CA interna gerenciada por você — não Let's Encrypt. CA pública pode emitir certificados para qualquer um.
- **CSP nonce sem rotação**: nonce estático no CSP é equivalente a não ter CSP. Gere um nonce novo por requisição.

---

## Referências

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Google HSTS Preload List](https://hstspreload.org/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [AWS VPC Security Best Practices](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-best-practices.html)
