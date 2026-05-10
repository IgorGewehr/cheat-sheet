---
title: Ataques de Autenticação Modernos
category: auth
stack: [JWT, OAuth, SAML, OIDC, WebAuthn]
tags: [auth, jwt, oauth, saml, mfa, attacks]
excerpt: JWT alg confusion, OAuth misconfig, SAML signature wrapping, MFA bypass, ATO (Account Takeover) — onde apps reais ainda caem em 2026.
related: [sec-auth-attacks-modern, oauth-2-1, session-cookie-vs-jwt, sec-web-fundamentos-headers, sec-owasp-top10-2025]
updated: "2026-05-10"
---

## Por que isso importa

Auth é a porta de frente. Em 90% dos engagements empresariais reais, alguma fraqueza em auth aparece — e geralmente é mais grave que XSS isolado. Esse card cobre o que ainda funciona em 2026 e como auditar.

## JWT Attacks

### Algoritmo "none"

```
# JWT antigo aceita alg=none
header: { "alg": "none", "typ": "JWT" }
payload: { "sub": "admin", "exp": 9999999999 }
signature: (vazia)

# Encode em base64url e use sem signature
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiJ9.
```

Bibliotecas modernas rejeitam mas legado existe. Teste sempre.

### Algorithm confusion (HS256 ↔ RS256)

Server espera RS256 (asymmetric). Atacante muda header pra HS256 (symmetric) e usa a **public key** (que é, well, pública) como secret HMAC. Library mal escrita aceita.

```python
import jwt
public_key = open('public.pem').read()
token = jwt.encode({"sub":"admin"}, public_key, algorithm="HS256")
# Server valida com HS256, usa public key como secret → assinatura OK
```

Mitigação: lib que rejeita troca de alg, ou explicitamente checar `header.alg` antes de validar.

### Weak HMAC secret

JWT com HS256 + secret fraco → bruteforce offline.

```bash
hashcat -m 16500 token.jwt rockyou.txt
# ou
jwt_tool token.jwt -C -d rockyou.txt
```

Secrets como `secret`, `your-256-bit-secret`, `change-me-please` aparecem todo dia em pentest.

### kid header injection

```json
{ "alg": "HS256", "kid": "../../../dev/null" }
```

Se servidor usa `kid` pra escolher chave do filesystem sem sanitizar, atacante força chave conhecida (`/dev/null` → secret vazio, ou `/tmp/uploaded-file.txt` se tiver upload).

Variantes: SQL injection no `kid`, JWK injection (`jwk` no header carrega chave inline — alguns servidores aceitam).

### Token Leakage

- JWT em URL/query string → vai pro server log, browser history, Referer header.
- JWT em localStorage → XSS exfiltra. **Use HttpOnly cookie**.
- JWT longo-lived sem refresh rotation → roubo = uso indefinido até expiry.

Veja `sec-pentest-report-pro` pra como reportar achados de JWT.

## OAuth 2.0 / OIDC Attacks

### State / CSRF no flow

```
# Atacante inicia flow OAuth e captura authorization code
# Vítima clica no link do atacante (que tem state=atacante_state, code recebido sai pra atacante endpoint)
# OU
# Servidor não valida state → atacante usa code em URL legítima
```

Mitigação: server **deve** validar `state` que enviou no início do flow. Sem state = CSRF garantido.

### Open redirect → token exfiltration

```
# OAuth response com redirect_uri liberal
GET /oauth/authorize?client_id=x&redirect_uri=https://evil.com&...
# Authorization code vai pra evil.com com user logado
```

Mitigação: allowlist exata de redirect URIs no provider. Wildcard (`*`) ou path-based (`/callback*`) = bypass.

### PKCE bypass (clients públicos)

PKCE (`code_challenge` + `code_verifier`) protege client público (SPA, mobile). Se servidor não força PKCE em public client → atacante pode trocar code interceptado por token sem precisar do `code_verifier`.

### Token confusion

Access token de scope X usado em endpoint que espera scope Y. Server aceita por confiança no token. Mitigação: validar audience (`aud`) e scope em cada request.

### Device code phishing (Entra ID / Microsoft)

User visita `microsoft.com/devicelogin`, digita code do atacante → atacante recebe refresh token com sessão do user. Cresceu muito em 2024-2025. Mitigação: conditional access policy, MFA por device, user awareness.

### Refresh token rotation falha

OAuth 2.1 exige rotation (refresh token usado vira inválido, novo emitido). Se server não rotaciona → token vazado = acesso indefinido. Detectar via `Set-Cookie` ou body comparando antes/depois de `/refresh`.

## SAML Attacks

### XML Signature Wrapping (XSW)

Atacante adiciona conteúdo extra fora do elemento assinado. Parser valida signature em uma parte, processa outra.

```xml
<saml:Response>
  <saml:Assertion>            <!-- esta é assinada -->
    <saml:NameID>victim@corp.com</saml:NameID>
    <ds:Signature>...</ds:Signature>
  </saml:Assertion>
  <saml:Assertion>            <!-- esta NÃO é assinada, mas é processada -->
    <saml:NameID>admin@corp.com</saml:NameID>
  </saml:Assertion>
</saml:Response>
```

Ferramenta: **SAMLRaider** (extension Burp), **WS-Attacker**.

### XXE em SAML response

Response SAML é XML. Se parser permite external entities → file disclosure.

```xml
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<saml:Response>...&xxe;...</saml:Response>
```

### Replay attack

Mesma assertion reutilizada. Mitigação: `NotOnOrAfter`, `InResponseTo` validados, cache de IDs já vistos.

## MFA Bypass

### Race conditions

```bash
# Enviar 100 requests com mesmo OTP em paralelo
# Se backend não trava contador atomically, alguns passam
ffuf -u 'https://target/verify-otp' -X POST -d 'otp=000000' \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     -w numbers.txt:OTP -threads 200
```

Lib `turbo-intruder` (Burp) é ideal pra race conditions.

### OTP enumeration

OTP de 6 dígitos = 1M opções. Sem rate limit / sem lockout → bruteforceable em horas. Common faults:
- Rate limit por IP (não por user) → IP rotation bypass.
- Rate limit conta só "wrong attempts" → reuse de OTP correto não conta.
- Sem lockout após N falhas.

### MFA fatigue / push bombing

Atacante já tem credenciais. Manda 50 push notifications → user aprova pra fazer parar. Defesa: número matching (Microsoft Authenticator 2024+), context (qual app, qual IP).

### Fallback fraco

App tem MFA push, mas tem "use SMS instead" como fallback → atacante SIM-swap ou usa SS7 → recebe SMS.

### Cookie de "trust this device"

Após MFA OK, cookie de longa duração marca device como confiável. Se atacante roubar cookie → bypass MFA indefinidamente. Mitigação: bind cookie a device fingerprint, IP range, geo.

## Account Takeover (ATO) — vetores comuns

| Vetor | Detalhe |
|-------|---------|
| **Credential stuffing** | Reuso de senha vazada (haveibeenpwned). Sem rate limit, sem MFA = ATO. |
| **Password reset poisoning** | Host header injection muda link de reset → atacante recebe. |
| **Email change race** | Race entre confirm email change e token de session = ATO. |
| **OAuth account linking** | Login social com email já registrado, sem confirm → atacante linka conta dele. |
| **Sequential ID + email enum** | `/user/123` + endpoint que vaza email = lista de targets. |
| **Magic link reuse** | Link de login não expira ou não invalida após uso → roubo do link = ATO. |

## WebAuthn / Passkeys — moderno

Em 2026, passkeys são o estado da arte (assimétrico, phishing-resistant). Ataques residuais:

- **Backup phrase fraca** se passkey backed up via cloud (Apple Keychain, Google Password Manager).
- **Downgrade attack**: se app permite fallback pra password, atacante força fallback.
- **Cross-device flow phishing**: QR code do passkey de outro device — UX confusa permite phishing.

Mitigação: passkey-only flows, attestation verification, conditional UI.

## Audit checklist

- [ ] JWT: alg ≠ none? alg ≠ HS256 se RS256 esperado? secret strength?
- [ ] OAuth: state validado? redirect URI exato? PKCE em client público? refresh rotation?
- [ ] SAML: signature em todo elemento processado? XXE protections no parser?
- [ ] MFA: rate limit funciona em race? push number matching? fallback seguro?
- [ ] ATO: credential stuffing protegido? reset link único e expirável? email change confirma?
- [ ] Session: cookie HttpOnly + Secure + SameSite? Regenera ID após login?

## Ferramentas

- **jwt_tool** (ticarpi/jwt_tool) — alg confusion, kid injection, brute force.
- **SAMLRaider** — Burp extension pra SAML.
- **OAuth Testing Tool** — PortSwigger.
- **EvilGinx3** — phishing MFA-bypass (tier 3 — red team).
- **MFASweep** — enumeração de MFA disabled em M365.

## Leituras

- PortSwigger Web Security Academy: JWT, OAuth, SAML tracks
- "Web Authentication" book (Yvo Desmedt)
- RFC 9700 — Best Current Practice for OAuth 2.0 Security
- "Real-World OAuth Attacks" — Daniel Fett (research papers)
