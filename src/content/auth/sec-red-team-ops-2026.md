---
title: Red Team Operations — Scoping, RoE, MITRE ATT&CK, OPSEC
category: auth
stack: [MITRE ATT&CK, Atomic Red Team, OPSEC]
tags: [red-team, scoping, mitre, opsec, adversary-emulation]
excerpt: A diferença entre pentester e red teamer — adversary emulation, threat-informed scoping, MITRE ATT&CK mapping, OPSEC, atomic testing.
related: [sec-c2-frameworks-modern, sec-initial-access-modern, sec-post-exploitation]
updated: "2026-05-10"
---

## Pentest vs Red Team — diferença prática

| Pentest | Red Team |
|---------|----------|
| Encontrar e listar vulnerabilidades | Simular adversário real, testar defesa end-to-end |
| Cobertura ampla (todos os IPs em escopo) | Foco em "crown jewels" (dados sensíveis, sistemas críticos) |
| 1-2 semanas | 4-12 semanas, às vezes mais |
| Defensores podem saber (white box ou cooperative) | Defensores não sabem (blue team treina detecção) |
| Output: relatório de findings priorizado | Output: cadeia de attack + gap analysis em detecção |
| Cliente quer: "patch tudo" | Cliente quer: "MTTR do SOC, gap de visibilidade, drill da equipe" |

Consultoria empresarial moderna mistura — vendor de "Adversary Simulation" oferece ambos. Cliente maduro pede red team purple (cooperação parcial blue team) ou tabletop antes de full red.

## Scoping de um engagement

Antes de qualquer comando:

### Rules of Engagement (RoE)

Documento legal — **assinado em papel**:

- **Escopo técnico**: CIDR in-scope, hosts in-scope, hosts out-of-scope, third-party (AWS metadata in client account ≠ AWS infra service em si).
- **Métodos permitidos**: DoS? Phishing real users? Social engineering? Wireless? Physical?
- **Métodos proibidos**: ransomware simulation? destruir data? modificar prod data?
- **Crown jewels**: objetivos específicos pra "win condition" — "comprometer credentials de Domain Admin", "exfiltrar 1MB de dados sensíveis do bucket X", "obter acesso ao app Y como administrador".
- **Janela temporal**: working hours? 24/7? blackouts?
- **POC do cliente**: 1 técnico + 1 executivo, 24h reachable.
- **Emergency stop**: condição que pausa o engagement (production outage causada).
- **Reporting cadence**: weekly check-in vs end-of-engagement only?

Sem RoE = não rodar. Vc tá cometendo crime.

### Get Out of Jail Free letter

Documento autorizado por POC executivo do cliente que você carrega impresso/PDF durante o engagement. Se for pego (físico, polícia, IT do cliente), apresenta:

- Empresa contratante
- Data início/fim
- POCs do cliente
- Telefones para verificação
- Assinatura legal

## Threat-informed approach

### Adversary emulation vs adversary simulation

- **Emulation**: replicar TTPs específicas de grupo real (APT29, FIN7, LockBit). MITRE Engenuity Center for Threat-Informed Defense publica plans.
- **Simulation**: comportamento adversário plausível, não específico.

Engagement maduro escolhe adversário relevante à indústria do cliente:
- Banco → FIN7, Carbanak, FIN12.
- Healthcare → ransomware grupos (Conti-derived, LockBit).
- Tech → APT41, North Korea Lazarus.
- Gov → state-sponsored (APT28/29, APT41).

## MITRE ATT&CK — como usar

ATT&CK é framework de tactics/techniques. 14 tactics:

1. **Reconnaissance** — antes do compromise.
2. **Resource Development** — infra do atacante.
3. **Initial Access** — entrar.
4. **Execution** — rodar código.
5. **Persistence** — manter acesso.
6. **Privilege Escalation** — escalar.
7. **Defense Evasion** — evitar detecção.
8. **Credential Access** — coletar credenciais.
9. **Discovery** — enumerar ambiente.
10. **Lateral Movement** — mover entre hosts.
11. **Collection** — coletar dados.
12. **Command and Control** — C2 channel.
13. **Exfiltration** — roubar dados.
14. **Impact** — destruir/encriptar.

### Em engagement

- **Pre-engagement**: mapeia TTPs que vai usar. "T1566.001 Spearphishing Attachment → T1059.001 PowerShell → T1547.001 Run Keys → T1003.001 LSASS Memory".
- **Durante**: log cada técnica usada com timestamp.
- **Pós**: report mapeia cada step a ATT&CK ID. Cliente roda gap analysis vs detection coverage que ele já tem.

### ATT&CK Navigator

```
https://mitre-attack.github.io/attack-navigator/
```

Cria layer visual de coverage. Cliente compara "minha detecção" vs "TTPs usadas". Cor codes gap.

## OPSEC do red teamer

OPSEC = não ser detectado.

### Camadas de OPSEC

**Infrastructure**:
- Domain attacker registrado meses antes (aged domain).
- SSL certificate válido (Let's Encrypt).
- Reverse proxy → C2 backend (defender vê só o proxy).
- CDN front-end (Cloudfront, Cloudflare) — domínio queimado, troca rapido.

**Payload**:
- Custom build, não baixado de internet (signature em VT).
- Strings ofuscadas.
- Sleep + jitter no implant pra evadir behavioral.

**Behavioral**:
- Operate só em horário típico do user comprometido (não exec de comandos às 3am no host de funcionário 9-5).
- Não usar tools "exotic" (mimikatz.exe, raw cobalt strike) — usa native LOLBins primeiro.
- Espalhar atividade — não tudo de 1 host comprometido.

**Network**:
- HTTPS legit-looking C2 (jitter, sleep, plausible URI).
- DNS C2 se network strict (Cobalt Strike DNS profile, Sliver DNS).
- Domain fronting (cada vez mais bloqueado pelos cloud providers).
- IP rotation se permitido.

### LOLBins (Living Off the Land Binaries)

Binários legítimos do OS reutilizados pra atacante:

| OS | Binary | Uso |
|----|--------|-----|
| Windows | `certutil.exe` | Decode base64, download HTTP. |
| Windows | `bitsadmin.exe` | Download via Background Intelligent Transfer. |
| Windows | `wmic.exe` | Execução remota. |
| Windows | `regsvr32.exe` | Squiblydoo — exec sct from URL. |
| Windows | `rundll32.exe` | Exec DLL exports. |
| Linux | `curl/wget` | Download. |
| Linux | `python -c` | One-liner exec. |
| Linux | `socat` | Reverse tunnel. |
| macOS | `osascript` | AppleScript exec. |

LOLBAS Project (lolbas-project.github.io) e GTFOBins (gtfobins.github.io) catalogam.

## Atomic Red Team — atomic testing

Red Canary publica **Atomic Red Team** (atomicredteam.io): biblioteca de testes individuais por técnica ATT&CK. Cada teste = comando ou pequeno script que dispara comportamento específico.

```bash
# Instala invoke-atomicredteam (PowerShell)
Install-Module -Name invoke-atomicredteam

# Roda teste específico
Invoke-AtomicTest T1003.001-1   # LSASS Memory dump
```

Uso:
- **Red team**: testar atomicamente pra validar detecção parcial antes de full engagement.
- **Purple team**: gerar telemetria pra blue team validar rules.
- **Defenders**: medir cobertura de SIEM rules vs ATT&CK.

## Reporting de red team — diferenças

Pentest report = lista de findings + remediation.

Red team report = narrative + gap analysis:

```markdown
# Executive Summary
[Resultado em 1 página: comprometemos X em Y dias usando Z, blue team detectou A não detectou B]

# Engagement narrative
- Day 1: phishing pra developer X → callback C2.
- Day 3: privesc local via Z → roubo de hash service account.
- Day 5: kerberoast → AD User com permissão Tier 1.
- Day 8: lateral movement → DB server.
- Day 10: exfil 1MB simulated PII pra crown jewel objective achieved.

# Detection gaps
| Day | Activity | Blue team saw? | What logged | What missed |
|-----|----------|----------------|-------------|-------------|
| 1 | Phishing | ✗ | Email gateway logged URL clicks | Email gateway flagged sender as spam — alert suppressed |
| 3 | LSASS dump | ✓ | EDR alerted | Procdump renamed binary bypassed signature, EDR caught process behavior |
| 5 | Kerberoast | ✗ | DC logged TGS request | No detection on anomalous TGS pattern |

# Recommendations (priorizadas)
1. Tune EDR rules for renamed-process detection (P0).
2. Add SIEM rule for kerberoast pattern (P0).
3. Enable email gateway URL detonation (P1).
...
```

## Purple Team

Modalidade colaborativa. Red team executa step, blue team em sala observa, ambos discutem após. Geralmente:

- 1 técnica de cada vez.
- Blue team consulta detecção em tempo real.
- Gap identificado, blue team escreve rule, red team executa de novo pra validar.

Útil pra empresas treinando SOC. Não substitui full red engagement.

## Tabletop exercises

Conversação estruturada de "and then what?" — não executa, só planeja.

- Scenario: "ransomware em segunda-feira manhã encripta 100 hosts".
- Equipe responde por papel: SOC, IR, legal, comms, exec.
- Identifica gaps em processo, não em tecnologia.

Tabletops são vendáveis em consultoria — barato, alto valor estratégico.

## Pricing modelo (preview Tier 5)

Red team engagement empresarial:

| Tipo | Duração | Preço (Brasil 2026) |
|------|---------|---------------------|
| Pentest web ampla | 2 sem | R$60-120k |
| Pentest interno AD | 2-3 sem | R$80-150k |
| Red team scoped | 4-6 sem | R$200-400k |
| Full adversary emulation | 8-12 sem | R$500k-1M+ |
| Purple team week | 1 sem | R$50-80k |
| Tabletop exec | 1 dia | R$15-30k |

EUA / Europa multiplicar por 2-3x. Consultoria pra Fortune 500 multiplicar por 5x.

## Checklist pre-engagement

- [ ] RoE assinado por POC executivo?
- [ ] Get-out-of-jail letter impresso?
- [ ] Crown jewels documentados?
- [ ] Adversário emulado escolhido + TTPs mapped?
- [ ] Infrastructure (C2, domains, certificates) preparada com 2+ semanas antecedência?
- [ ] POC do cliente reachable 24/7?
- [ ] Stop condition definida?
- [ ] Pre-engagement comms enviadas pro POC sobre intensidade?
- [ ] Insurance verificada (E&O)?
- [ ] Storage criptografado para artifacts + retention period combinado?

## Leituras

- "Red Team Development and Operations" — Joe Vest & James Tubberville
- MITRE ATT&CK: attack.mitre.org
- "The MITRE ATT&CK Defender Series" — MITRE
- Red Canary Threat Detection Report (anual)
- "Adversary Emulation Plans" — Center for Threat-Informed Defense (github.com/center-for-threat-informed-defense)
- SpecterOps blog: Red Team Resources
- "Operator's Handbook" — Joshua Picolet
