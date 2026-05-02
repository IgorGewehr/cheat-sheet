---
title: "Criptografia prática para desenvolvedores"
category: "auth"
stack: ["Node.js", "TypeScript", "Web Crypto API"]
tags: ["criptografia", "hashing", "bcrypt", "argon2", "aes", "rsa", "ecdsa"]
excerpt: "Hashing de senhas, encryption simétrica e assimétrica, quando usar cada algoritmo — com código Node.js real e os erros que os devs cometem."
---

## Visão Geral

Criptografia aplicada para desenvolvedores se resume a três problemas diferentes com soluções diferentes:

1. **Hashing** — guardar algo que você nunca precisa recuperar (senhas, fingerprints)
2. **Encryption simétrica** — guardar/transmitir dados que você precisa recuperar com a mesma chave
3. **Encryption assimétrica** — transmitir dados entre partes sem compartilhar segredo, ou assinar digitalmente

Usar a ferramenta errada para o problema certo é a origem de 90% dos bugs de criptografia em aplicações reais.

---

## Quando usar

| Problema | Solução |
|---|---|
| Guardar senha do usuário | Argon2id ou bcrypt |
| Criptografar CPF/campo sensível no banco | AES-256-GCM (simétrico) |
| Transmitir dados entre serviços | TLS (já faz isso por você) |
| Assinar tokens/documentos | ECDSA P-256 ou RSA-PSS |
| Gerar token seguro (reset, session ID) | `crypto.randomBytes(32)` |
| Verificar integridade de payload (webhook) | HMAC-SHA256 |

---

## Trade-offs

**Argon2id vs bcrypt:**
- Argon2id é mais seguro: resistente a GPU cracking e side-channel attacks — use se sua stack suporta sem problemas de build.
- bcrypt funciona bem com cost factor >= 12 e é mais portável (disponível em todas as linguagens sem dependências nativas).
- Nunca use SHA-1, MD5 ou SHA-256 puro para senhas — são rápidos demais e sem salt integrado.

**AES-128 vs AES-256:**
- AES-256 é o padrão atual para dados novos. A diferença de performance é insignificante em CPUs modernas.
- O modo importa mais que o tamanho da chave: use GCM (autenticado) — nunca CBC ou ECB sem MAC separado.

**RSA vs ECDSA:**
- RSA-2048 ainda é aceito, mas chaves são maiores e operações são mais lentas.
- ECDSA P-256 ou Ed25519 são preferidos para novos sistemas: chaves menores, mesma ou melhor segurança.

---

## Implementação

### Hashing de senhas com Argon2id

```typescript
import argon2 from 'argon2';

// Gerar hash — use ao criar/atualizar senha
export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,     // id = resistente a GPU + side-channel
    memoryCost: 2 ** 16,       // 64 MB de RAM por hash
    timeCost: 3,               // 3 iterações
    parallelism: 1,            // 1 thread (ajuste conforme hardware)
    // Salt é gerado automaticamente e embutido no hash
  });
}

// Verificar — use no login
export async function verifyPassword(
  hash: string,
  plaintext: string
): Promise<boolean> {
  return argon2.verify(hash, plaintext);
}

// Verificar se o hash precisa de upgrade de parâmetros
export async function needsRehash(hash: string): Promise<boolean> {
  return argon2.needsRehash(hash, {
    memoryCost: 2 ** 16,
    timeCost: 3,
  });
}
```

### Hashing de senhas com bcrypt (alternativa portável)

```typescript
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12; // nunca abaixo de 10, nunca acima de 14 (UX)

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  hash: string,
  plaintext: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
```

### Timing-safe comparison (para tokens, não senhas)

```typescript
import { timingSafeEqual, randomBytes } from 'crypto';

// Comparar tokens — NUNCA use === para tokens de segurança
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  // Buffers devem ter o mesmo tamanho para timingSafeEqual
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Gerar token seguro para reset de senha, session ID, etc.
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex'); // 64 chars hex
}
```

---

### Encryption simétrica com AES-256-GCM

GCM é um modo autenticado: além de cifrar, gera um `authTag` que detecta qualquer adulteração do ciphertext. Use sempre GCM — nunca CBC sem MAC separado.

```typescript
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

// Derivar chave a partir de uma variável de ambiente (hex de 64 chars = 32 bytes)
const ENCRYPTION_KEY = Buffer.from(process.env.FIELD_ENCRYPTION_KEY!, 'hex');

type EncryptedValue = {
  iv: string;       // hex, 12 bytes
  authTag: string;  // hex, 16 bytes
  ciphertext: string; // hex
};

export function encrypt(plaintext: string): EncryptedValue {
  const iv = randomBytes(12); // GCM requer IV de 96 bits

  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 128 bits de autenticação

  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    ciphertext: encrypted.toString('hex'),
  };
}

export function decrypt(data: EncryptedValue): string {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    ENCRYPTION_KEY,
    Buffer.from(data.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data.ciphertext, 'hex')),
    decipher.final(), // lança erro se authTag não bater — adulteração detectada
  ]);

  return decrypted.toString('utf8');
}

// Formato compacto para guardar no banco (uma coluna TEXT)
export function encryptToString(plaintext: string): string {
  const { iv, authTag, ciphertext } = encrypt(plaintext);
  return `${iv}:${authTag}:${ciphertext}`;
}

export function decryptFromString(encoded: string): string {
  const [iv, authTag, ciphertext] = encoded.split(':');
  return decrypt({ iv, authTag, ciphertext });
}
```

### Rotação de chave de criptografia

```typescript
// Suporte a múltiplas chaves para rotação sem downtime
const KEYS: Record<string, Buffer> = {
  v2: Buffer.from(process.env.ENCRYPTION_KEY_V2!, 'hex'),
  v1: Buffer.from(process.env.ENCRYPTION_KEY_V1!, 'hex'), // chave antiga
};

const CURRENT_VERSION = 'v2';

export function encryptWithVersion(plaintext: string): string {
  const key = KEYS[CURRENT_VERSION];
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${CURRENT_VERSION}:${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`;
}

export function decryptWithVersion(encoded: string): string {
  const [version, iv, authTag, ciphertext] = encoded.split(':');
  const key = KEYS[version];
  if (!key) throw new Error(`Unknown key version: ${version}`);

  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}
```

---

### Encryption assimétrica — ECDSA para assinatura

```typescript
import {
  generateKeyPairSync,
  createSign,
  createVerify,
} from 'crypto';

// Gerar par de chaves (faça isso uma vez, guarde em secrets manager)
const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Assinar payload (ex: documento, token customizado)
export function signPayload(payload: string, privKey: string): string {
  const sign = createSign('SHA256');
  sign.update(payload);
  return sign.sign(privKey, 'base64');
}

// Verificar assinatura
export function verifySignature(
  payload: string,
  signature: string,
  pubKey: string
): boolean {
  const verify = createVerify('SHA256');
  verify.update(payload);
  return verify.verify(pubKey, signature, 'base64');
}
```

### HMAC-SHA256 para integridade de webhooks

```typescript
import { createHmac, timingSafeEqual } from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

export function signWebhook(body: Buffer): string {
  return `sha256=${createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex')}`;
}

export function verifyWebhook(body: Buffer, signature: string): boolean {
  const expected = signWebhook(body);
  const expBuf = Buffer.from(expected, 'utf8');
  const sigBuf = Buffer.from(signature, 'utf8');
  if (expBuf.length !== sigBuf.length) return false;
  return timingSafeEqual(expBuf, sigBuf);
}
```

---

## Armadilhas

- **MD5/SHA-1 para senhas**: SHA-256 sem salt também é inseguro para senhas. Use funções de derivação de chave (Argon2, bcrypt, scrypt) que são propositalmente lentas.
- **IV/nonce reutilizado com AES-GCM**: reutilizar o mesmo IV com a mesma chave em GCM quebra completamente a confidencialidade. Sempre gere IVs com `randomBytes`.
- **ECB mode**: nunca use ECB — blocos iguais produzem ciphertext igual, revelando padrões nos dados.
- **Guardar chave no código**: chave hardcoded é equivalente a não criptografar. Use variáveis de ambiente e um secrets manager em produção.
- **`Math.random()` para tokens**: `Math.random()` não é criptograficamente seguro. Use sempre `crypto.randomBytes()`.
- **Truncar hashes para comparar**: `hash.slice(0, 10) === expected.slice(0, 10)` reduz a entropia drasticamente.

---

## Referências

- [Node.js Crypto documentation](https://nodejs.org/api/crypto.html)
- [Argon2 specification](https://github.com/P-H-C/phc-winner-argon2)
- [NIST Guidelines for Password-Based Key Derivation](https://csrc.nist.gov/publications/detail/sp/800-132/final)
- [Cryptographic Right Answers (Latacora)](https://latacora.micro.blog/2018/04/03/cryptographic-right-answers.html)
- [Web Crypto API (browsers)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
