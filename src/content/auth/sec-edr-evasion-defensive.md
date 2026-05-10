---
title: EDR/AMSI/AV — Entendimento Defensivo
category: auth
stack: [EDR, AMSI, ETW, AV, kernel callbacks]
tags: [edr, amsi, evasion, defensive-understanding, opsec]
excerpt: Como EDRs detectam (kernel callbacks, ETW, ELAM, AMSI), por que e como — entendimento técnico para trabalhar EM equipes contra red team, não pra atacar sem autorização.
related: [sec-c2-frameworks-modern, sec-post-exploitation, sec-red-team-ops-2026]
updated: "2026-05-10"
---

## Disclaimer importante

Esse card existe pra você **entender o lado defensivo do red team** — necessário pra trabalhar como consultor red team **com autorização** ou como blue team em equipes "detection engineering". As técnicas aqui:

- **NÃO devem ser usadas** contra empresas sem RoE assinado.
- **SÃO úteis** pra detection engineering (saber o que vc precisa detectar).
- **SÃO úteis** pra red team que precisa testar EDR como crown jewel.

Atacar sem autorização viola CFAA (US), Computer Misuse Act (UK), Lei Carolina Dieckmann (BR), e equivalentes. Isso é coisa séria.

## Como EDR detecta — anatomia

EDR moderno (CrowdStrike, SentinelOne, Microsoft Defender for Endpoint, Cortex XDR, Carbon Black) usa **múltiplas camadas**:

### 1. Kernel callbacks

Windows expõe APIs pra kernel drivers registrarem callbacks:

- `PsSetCreateProcessNotifyRoutineEx` — chamado em todo CreateProcess.
- `PsSetCreateThreadNotifyRoutine` — chamado em CreateThread.
- `PsSetLoadImageNotifyRoutine` — chamado quando DLL/EXE carregado.
- `ObRegisterCallbacks` — pre/post operations em handles a objects (lsass.exe access).
- `CmRegisterCallback` — registry operations.
- Mini-filter file system callbacks — file create/read/write.

EDR driver fica em kernel mode, vê tudo que processo user-mode faz. Bypass não é viável sem kernel exploit (raros, queimam quando usados).

### 2. ETW (Event Tracing for Windows)

ETW é framework de telemetry no Windows. ETW providers:

- **Microsoft-Windows-Threat-Intelligence** — eventos de behavior em LSASS, Mimikatz patterns.
- **Microsoft-Antimalware-Scan-Interface** — AMSI events.
- **Microsoft-Windows-Kernel-Process** — process creation.
- **Microsoft-Windows-DotNETRuntime** — .NET assembly loads.

EDR consume ETW + correlate. Importante: **ETW pode ser patched user-mode** (`EtwEventWrite` NOP) — comum técnica de "ETW patching". Mas EDR kernel callbacks not affected.

### 3. AMSI (Antimalware Scan Interface)

Microsoft API que apps chamam pra escanear scripts antes de eval. Office VBA, PowerShell, WSH, .NET 4.8+, JavaScript em HTA — todos integrados.

```powershell
# PowerShell calls AmsiScanString/AmsiScanBuffer pre-execution
[Reflection.Assembly]::Load([Convert]::FromBase64String($payload))
# → AMSI scan called → match → blocked
```

AMSI bypass técnicas:
- **AMSI patching** — overwrite `AmsiScanBuffer` first bytes to return ALLOWED.
- **AMSI string obfuscation** — split strings, base64, unicode escape so AMSI doesn't match signature.
- **AMSI provider unregister** — registry mod (admin).
- **AMSI bypass via .NET reflection** in PowerShell.

Cada bypass leva semanas/meses até EDR/Defender publish signature. Cat-and-mouse.

### 4. User-mode hooks

Some EDR (Sophos, older Symantec) hook user-mode APIs in DLLs (kernel32, ntdll). Detection of exec patterns.

Bypass: **direct syscalls** (skip ntdll → kernel direct), **unhooking** (restore original bytes), **hell's gate / halos gate** (dynamic syscall number lookup).

Moderna EDR moveu pra kernel — user-mode hooks menos comuns hoje.

### 5. Behavioral analytics

ML/heuristic em event stream:

- **Process tree anomaly**: Excel.exe → cmd.exe → powershell.exe (`Encoded`) com curtos delays. Behavior pattern, não signature.
- **Beacon detection**: connections regulares com mesmo size, jittered slightly → probable beacon.
- **Credential access pattern**: process opening lsass.exe handle (não comum em apps user-installed).
- **Lateral movement**: same user logging at multiple hosts in short window.

Behavioral é o que mata atacante "modern" — mesmo sem signature, padrão suspeito alerta.

### 6. Threat intel feeds

Hashes conhecidos, IPs C2, domains TTPs sinkholed:
- VirusTotal hash matches.
- Censys / Shodan flag de IP atacante.
- Domain reputation DBs.

## EDR vendors — capacidades (2026 snapshot)

| Vendor | Forças | Fraquezas | Mercado |
|--------|--------|-----------|---------|
| **CrowdStrike Falcon** | Sensor pequeno, behavioral state-of-art, threat hunting | Caro, false positives em apps dev | Enterprise, SaaS-only |
| **SentinelOne Singularity** | Auto-remediation, rollback | Heavier que CrowdStrike | Enterprise mid-market |
| **Microsoft Defender for Endpoint** | Free with E5 license, deep Windows integration, MS Graph integration | Inferior em macOS/Linux | M365-heavy enterprise |
| **Carbon Black** | Threat hunting workflows | UI dated, VMware ownership uncertain | Legacy enterprise |
| **Palo Alto Cortex XDR** | Multi-source correlation (firewall + endpoint) | Complexo, caro | Network-first orgs |
| **Elastic Security** | Open-source backbone | Operational overhead | DIY shops |
| **Wazuh** | Open-source | Less behavioral than commercial | SMB / labs |

Em testing, **MITRE ATT&CK Evaluations** (anual) é benchmark referência. Cada vendor publica resultado próprio do evaluation.

## ETW patching — exemplo

Anyone with code execution can disable ETW:

```c
// Find EtwEventWrite in ntdll.dll → patch first byte to 0xC3 (RET)
// Effectively: function returns immediately, no ETW event emitted
```

This skips ETW providers — but EDR sensor watching for the patch itself triggers alert. Cat-and-mouse.

## AMSI patching — example

```powershell
# AMSI patching one-liner (historical, signature now)
$a = [Ref].Assembly.GetTypes() | where {$_.Name -like "Amsi*"}
$b = $a.GetField("amsiInitFailed","NonPublic,Static")
$b.SetValue($null, $true)
```

Modern AMSI bypass requires changing technique frequently. Tools: **AMSI.fail** ((tracks bypass status), **D/Invoke** (managed → unmanaged calls).

## Process injection — clássico

```c
// Allocate memory in target process, write shellcode, create remote thread
HANDLE p = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid);
LPVOID mem = VirtualAllocEx(p, NULL, size, MEM_COMMIT, PAGE_EXECUTE_READWRITE);
WriteProcessMemory(p, mem, shellcode, size, NULL);
CreateRemoteThread(p, NULL, 0, mem, NULL, 0, NULL);
```

EDR detect: `OpenProcess(PROCESS_ALL_ACCESS)` from non-trusted process, especially for lsass.exe or system processes.

Variantes (cada uma tem signature different):
- Reflective DLL injection.
- Process Hollowing.
- Process Doppelgänging.
- Atom Bombing.
- Thread Hijacking.

Detection: behavioral (proceso → memorialcation+write+execute pattern), kernel callbacks de Process Access.

## Sleep obfuscation

Beacon dorme entre callbacks. Sleeping memory pode ser scanned por EDR / memory forensics.

Modern obfuscation:
- **Ekko** — encrypt beacon memory enquanto dormindo, decrypt to call.
- **FOLIAGE** — alternate scheme.
- **Cobalt Strike Sleep Mask Kit** — official feature, encrypt on sleep.

Goal: at any given moment, beacon memory looks like random data, not shellcode.

## Direct syscalls + sysenter

Skip user-mode hooks by going kernel direct:

```asm
mov eax, 0x18    ; syscall number (NtOpenProcess)
syscall
```

Tools / techniques:
- **Hell's Gate** — read syscall numbers dynamically.
- **Halos Gate** — bypass when ntdll hooked.
- **TartarusGate** — recent iteration.
- **SysWhispers3** — code generator for direct syscalls.

Effective vs user-mode hooks. Useless vs kernel callbacks.

## What works in 2026 (cat-and-mouse)

These rotate. As of early 2026:

- **Indirect syscalls** + **callstack spoofing**.
- **Reflective loading com return address rewriting** (jump via legit lib).
- **APC injection** in alertable threads.
- **Process spawning with parent PID spoof + command line spoofing**.
- **Module stomping** (overwrite existing DLL section).

Within months, EDR adds detection.

## Defensive perspective — detection engineering

Quando você está do lado defensivo:

1. **Deploy sensor + collect data**: Sysmon + Windows Event Forwarder + Wazuh/Elastic.
2. **Atomic Red Team**: run TTPs in lab, verify your detection catches.
3. **Telemetry gaps**: what doesn't generate any event? Add custom rules.
4. **Detection-as-code**: rules em Sigma / Yara-L / KQL. Version control, test in CI.
5. **Continuous validation**: re-run Atomic tests monthly to catch regressions.

Reads:
- **Sigma rules** repository (github.com/SigmaHQ/sigma).
- **Detection Engineering — Florian Roth** (Neo23x0) blog.
- **MITRE D3FEND** (defense framework counterpart to ATT&CK).
- **Splunk Boss of the SOC** (BOTS) — practice scenarios.

## Como vender entendimento defensivo em consultoria

Cliente em 2026 tem EDR. Quer:

1. **Adversary simulation que testa o EDR** — não bypass EDR, mas validar se EDR catches.
2. **Detection engineering services** — escrever rules custom pra TTPs.
3. **Purple team weeks** — operator + analyst trabalhando juntos.
4. **Tabletop com SOC** — não-técnico, decisão e processo.

Pentester que só ataca = commodity. Consultor que ataca + entende detection + treina time = premium.

## Ferramentas (lab e research)

**Para entender:**
- **Atomic Red Team** — biblioteca de TTPs atomicamente testáveis.
- **MITRE Caldera** — simulador automated red team.
- **Velociraptor** — DFIR + endpoint hunting.
- **Sysmon + SwiftOnSecurity config** — produção telemetry baseline.

**Para research (lab):**
- **AMSI.fail** — current AMSI bypass status.
- **D/Invoke** — managed↔native API research.
- **MalDev Academy** — Maldev curriculum (pago, sério).
- **SektorCERT EDR research** — Sektor7 institut.
- **Outflank Research / Maldev Academy / Tradecraft Garden** — pubicações community.

## Por que NÃO ensinar evasion específico aqui

- Técnica específica vira "signature" — vc paga pra aprender algo já queimado.
- Ler research atualizado (Twitter, BleepingComputer, vendor blogs) é melhor.
- Como red team consultant você precisa **saber que pode ser feito**, não necessariamente faze-lo.
- Detection engineering pays bem — entender ataque, defender melhor é o angulo high-value.

## Checklist — engagement com EDR

- [ ] EDR vendor identificado durante recon (registry / service name)?
- [ ] Cliente avisado de teste — vai inflar SOC tickets?
- [ ] Tools selecionadas com awareness de signatures (não Mimikatz raw)?
- [ ] Sleep + jitter no beacon configurados?
- [ ] Behavioral patterns considerados (executar em horário "normal", processos parent plausible)?
- [ ] Detection findings documentados — quais TTPs SOC viu vs missou?
- [ ] Remediation recomendada inclui detection rule updates, não só prevention?

## Leituras

- **Outflank Research** — outflank.nl/blog
- **MalDev Academy** — maldevacademy.com (pago, vale)
- **Sektor7 Institute** — sektor7.net
- **Maldev Discord communities** (Maldev Academy, Hack The Box)
- **"Antivirus Bypass Techniques"** — Nir Yehoshua, Uriel Kosayev
- **"Attacking and Defending Active Directory"** — Sean Metcalf
- **MITRE D3FEND** — d3fend.mitre.org
