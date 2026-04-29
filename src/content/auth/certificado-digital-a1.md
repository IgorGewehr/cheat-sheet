---
title: "Certificado digital A1 — armazenar, criptografar e assinar"
category: auth
stack: [Node.js, OpenSSL, SEFAZ]
tags: [certificado, a1, sefaz, fiscal, criptografia, brasil]
excerpt: "Certificado A1 é arquivo .pfx + senha. Em SaaS multi-tenant, é o segredo mais valioso do banco — perda compromete CNPJ inteiro. AES-256-GCM, chave fora do banco, decrypt server-only."
related: [token-encryption-at-rest, sefaz-integration-br, auth-architecture]
updated: 2026-04
---

## Contexto BR

Para emitir NFe/NFCe/NFSe, a empresa precisa assinar XML com certificado digital. Modelos:
- **A1**: arquivo `.pfx` (PKCS#12) com chave privada + senha. Vence em 1 ano. Cabe em arquivo.
- **A3**: token físico/cartão. Não cabe em servidor multi-tenant SaaS — cliente tem que assinar local.

**Pra SaaS, A1 é o caminho.**

## O modelo de armazenamento

```
fiscal/{businessId}/certificate {
  pfxBase64: string,           // arquivo encriptado
  passwordEncrypted: string,    // senha encriptada com chave SEPARADA
  cnpj: string,
  validFrom: timestamp,
  validUntil: timestamp,
  uploadedAt: timestamp,
  uploadedByUid: string,
}
```

## As 4 regras inegociáveis

### 1. Chave de criptografia FORA do banco
A chave que decripta o PFX **nunca** mora junto com os dados. Mora em:
- Variável de ambiente (`CERT_ENCRYPTION_KEY` 64 hex chars = 32 bytes).
- Idealmente: KMS (Google Cloud KMS, AWS KMS).

Se a chave estiver no mesmo Firestore que os PFXs, vazamento de DB = vazamento de tudo.

### 2. Senha do PFX é segredo separado
Use **outra** chave (`CERT_PASSWORD_ENCRYPTION_KEY`) pra criptografar a senha. Mesmo que um vetor de ataque comprometa a chave do arquivo, a senha continua protegida.

### 3. Decrypt só server-side
Nunca devolva PFX/senha pra cliente. Toda assinatura acontece em rota server-only (`/api/fiscal/sign`). Cliente envia XML não assinado, servidor devolve XML assinado. PFX não sai do servidor.

### 4. AES-256-GCM (não CBC)
GCM tem autenticação integrada — detecta tampering. Estrutura do payload encriptado:
```
[iv:12 bytes][authTag:16 bytes][ciphertext:variable]
```

```ts
import { createCipheriv, randomBytes } from 'crypto';

function encrypt(plaintext: Buffer, keyHex: string): Buffer {
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]);
}
```

## Assinatura XML — armadilhas SEFAZ

- **SHA-1, não SHA-256**: SVRS (RS, SC, BA…) rejeita SHA-256 em produção (erro 225). NT 2016.002. Verifique SEFAZ do estado, mas SHA-1 é o seguro default.
- **Canonicalization C14N**: `xml-crypto` faz, mas configure explicitamente — mismatches quebram a assinatura silenciosamente.
- **Algoritmo de digest no Reference**: SHA-1 também.
- **InclusiveNamespacePrefixList**: vazio. Não preencha.

## Renovação e vencimento

- Cron diário verifica `validUntil`. Avisa cliente 30/15/7/3 dias antes.
- Bloqueia emissão automaticamente após vencimento (não deixa "tentar e dar erro feio do SEFAZ").
- Permite re-upload sem perder histórico (auditoria de quem subiu, quando).

## Logs com PII

Nunca logue:
- A senha decriptada.
- O PFX em base64 ("só pra debug").
- O XML assinado completo (tem CNPJ, valores).

Logue:
- Operação (`sign_nfe`), `businessId`, `tipoDoc`, status, `errorCode SEFAZ`. Sem payload.

## Checklist

- [ ] PFX e senha criptografados com **chaves diferentes**.
- [ ] Chaves fora do banco (env ou KMS).
- [ ] Decrypt **só** em rota server-side.
- [ ] AES-256-GCM (não CBC).
- [ ] SHA-1 na assinatura (a menos que estado específico aceite SHA-256 — verifique).
- [ ] Cron de aviso de vencimento.
- [ ] Bloqueio automático após `validUntil`.
- [ ] Logs sem CNPJ/senha/PFX em plaintext.
