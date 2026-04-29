---
title: "Token encryption at rest — AES-256-GCM"
category: auth
stack: [Node.js, Firestore]
tags: [criptografia, tokens, aes-gcm, secrets, oauth]
excerpt: "Access tokens de WhatsApp, Stripe, OpenAI, OAuth — tudo isso vai pro banco em algum momento. Plaintext é negligência. AES-256-GCM com chave em env é o mínimo. KMS é o ideal."
related: [certificado-digital-a1, auth-architecture, omnichannel-conversations]
updated: 2026-04
---

## Por que se preocupar

Tokens de terceiros (WhatsApp Business, Stripe, OpenAI, Google OAuth refresh, Asaas) têm valor real:
- WhatsApp token roubado = atacante envia spam pelo seu cliente, conta banida.
- Stripe key = movimentar dinheiro.
- OpenAI key = drenar créditos do cliente.

Em SaaS multi-tenant, **todos** os tokens dos seus clientes ficam no seu banco. Vazamento de DB sem encryption = você causou prejuízo a N clientes ao mesmo tempo.

## A regra: encryption at rest

Token nunca chega ao Firestore/Postgres em texto puro. É encriptado **antes do INSERT** e decriptado **apenas em runtime server-side** quando vai ser usado.

```ts
// Modelo
{
  channelType: 'whatsapp',
  accessTokenEncrypted: 'base64...',  // AES-256-GCM
  // accessToken: NUNCA em plaintext
}
```

## AES-256-GCM (não CBC)

GCM = Galois/Counter Mode. Tem **autenticação** integrada (auth tag) — detecta se alguém tentou modificar o ciphertext. CBC sem MAC separado é vulnerável a padding oracle.

Estrutura do payload:
```
[iv: 12 bytes][authTag: 16 bytes][ciphertext: N bytes]
```

```ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 64 hex chars

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

export function decryptToken(encrypted: string): string {
  const buf = Buffer.from(encrypted, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}
```

## Onde mora a chave

- **Mínimo**: env var (`ENCRYPTION_KEY`) — 32 bytes em hex.
- **Bom**: secrets manager (GCP Secret Manager, AWS Secrets Manager, Doppler, 1Password).
- **Ideal**: KMS (chave nunca sai do HSM, decrypt fica delegado pro KMS).

A chave **NÃO** vai pro repo, nem pro `.env.example` com valor real. Em prod, nunca logue.

## Rotação

- Versione a chave: prefixe encrypted com `v1:`, `v2:`. No decrypt, leia o prefix e use a key correspondente.
- Quando rodar a key v2, escreva código que ainda decripta v1 — migra em background.
- Nunca delete a v1 antes de re-encriptar tudo.

## Anti-patterns

- `Buffer.from(token).toString('base64')` ou `atob()` — **NÃO É CRIPTOGRAFIA**, só encoding. Detectado em produção mais vezes do que deveria.
- Mesma chave pra tudo: token + senha de cert + dados pessoais. Se vaza, vaza tudo.
- Encrypt no cliente: chave fica no bundle JS. Inútil.
- Logar `decryptToken(...)` em log de debug. Vai pro Datadog/Sentry. Vaza.

## Checklist

- [ ] AES-256-GCM (`aes-256-gcm`), não CBC.
- [ ] IV aleatório por mensagem (12 bytes).
- [ ] Auth tag (16 bytes) verificado no decrypt.
- [ ] Chave em env/secret manager — nunca no repo.
- [ ] Decrypt só em runtime server-side, no momento do uso.
- [ ] Estratégia de rotação de chave definida.
- [ ] Chaves separadas pra escopos sensíveis (ex: certificado vs canal vs PII).
- [ ] Nenhum log com plaintext.
