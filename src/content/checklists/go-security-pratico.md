---
title: "Go: Segurança Prática (gosec, govulncheck, Supply Chain, OWASP)"
category: checklists
stack: [Go, gosec, govulncheck, staticcheck, golangci-lint]
tags: [security, golang, owasp, supply-chain, secrets, vulnerabilities]
excerpt: "Segurança em Go sem teatro: SQL injection, command injection, crypto correto, supply chain (govulncheck), gosec, secrets e os erros que aparecem em pentest real."
related: [go-microservice-production-checklist, go-config-envconfig-viper, owasp-top10, secrets-management]
updated: "2026-05-08"
---

## A pergunta que separa júnior de sênior

"Esse código é seguro?" não tem resposta sem três contextos: que dado processa, quem é o atacante, qual é a superfície. Use este card como inventário, não como checklist mecânico.

## SQL injection no mundo real

`database/sql` e `pgx` parametrizam queries por padrão — o problema aparece quando alguém constrói SQL com `fmt.Sprintf`:

```go
// ❌ Vulnerável — usuário controla nome da coluna
query := fmt.Sprintf("SELECT * FROM users ORDER BY %s", req.SortBy)
db.Query(ctx, query)
```

Para DDL dinâmico (sort, search), use lista branca:

```go
allowedSort := map[string]string{
    "name":  "name",
    "email": "email",
    "created": "created_at",
}
column, ok := allowedSort[req.SortBy]
if !ok {
    return ErrInvalidSort
}
query := "SELECT * FROM users ORDER BY " + column
```

`sqlc` resolve o caso comum: queries em arquivo `.sql`, geração de funções tipadas, sem string concat no Go. Mas search dinâmico ainda exige whitelist.

## Command injection

`os/exec.Command` recebe argumentos separados — não passe shell:

```go
// ❌ Shell expansion — atacante controla payload
exec.Command("sh", "-c", fmt.Sprintf("convert %s out.png", input))

// ✅ Argumentos isolados
exec.Command("convert", input, "out.png")
```

Path traversal: nunca confie em path vindo do usuário sem `filepath.Clean` + verificação contra prefixo permitido.

## Crypto: o que importa

- **Sempre** `crypto/rand` para tokens, IDs, salt, JWT secret. `math/rand` é previsível.
- **Senhas** usam `bcrypt` (`golang.org/x/crypto/bcrypt`) ou `argon2` — nunca SHA, nunca MD5.
- **HMAC** para assinatura de webhook, sempre `crypto/subtle.ConstantTimeCompare` para evitar timing attack.
- **TLS**: `tls.Config{MinVersion: tls.VersionTLS13}` quando possível. Nunca `InsecureSkipVerify: true` em produção.

```go
import (
    "crypto/subtle"
    "crypto/hmac"
    "crypto/sha256"
)

func verifyWebhook(payload, signature, secret []byte) bool {
    mac := hmac.New(sha256.New, secret)
    mac.Write(payload)
    expected := mac.Sum(nil)
    return subtle.ConstantTimeCompare(expected, signature) == 1
}
```

## Supply chain: govulncheck

Go modules tem checksums (`go.sum`) e a Go vulnerability database. Rode em CI:

```bash
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...
```

Diferente de scanners genéricos, `govulncheck` analisa **call graph**: só reporta CVE em código que você efetivamente chama. Reduz ruído e falsos positivos.

Outras camadas:

```bash
go mod verify           # checksums batem com go.sum
go mod download         # baixa para cache verificado
GOFLAGS=-mod=readonly   # CI não pode mexer em go.mod sem PR
```

Para serviços que vão pra produção: gere SBOM com `syft` ou `cyclonedx-gomod` e armazene como artefato do build.

## gosec e static analysis

`gosec` cobre padrões inseguros (G101: hardcoded credentials, G201: SQL string format, G304: file inclusion, G404: weak random, etc.):

```bash
go install github.com/securego/gosec/v2/cmd/gosec@latest
gosec ./...
```

Em projeto sério, integre via `golangci-lint` (que já roda gosec, staticcheck, errcheck, govet, ineffassign):

```yaml
# .golangci.yml
linters:
  enable:
    - gosec
    - staticcheck
    - errcheck
    - govet
    - ineffassign
    - bodyclose
    - sqlclosecheck
    - rowserrcheck
```

## Secrets handling

- **Nunca** logue senha, token, JWT bruto ou cookie de sessão.
- Em log estruturado, use redaction: `slog` com `LogValuer` que retorna `[REDACTED]`.
- Variáveis de ambiente não são secretos seguros em logs de boot — não imprima `os.Environ()`.
- Para rotação, secret manager (Vault, AWS Secrets Manager, GCP Secret Manager) > `.env`.
- Em runtime, mantenha o secret só pelo tempo necessário e zere com `crypto/subtle.ConstantTimeCompare` para checagem.

```go
type Token string
func (t Token) LogValue() slog.Value { return slog.StringValue("[REDACTED]") }
func (t Token) String() string       { return "[REDACTED]" }
```

## defer pitfall em endpoints

`defer` empilha — se você abre arquivo dentro de loop sem fechar:

```go
// ❌ Cada iteração acumula um defer, fechamento só no fim da função
for _, name := range files {
    f, _ := os.Open(name)
    defer f.Close()
    process(f)
}

// ✅ Fecha por iteração
for _, name := range files {
    func() {
        f, _ := os.Open(name)
        defer f.Close()
        process(f)
    }()
}
```

`bodyclose` detecta `http.Response.Body` não fechado — leak comum em handlers que chamam downstream.

## HTTP-specific

- `http.MaxBytesReader` em endpoints que recebem body — sem isso, atacante pode mandar GB.
- `Content-Type` precisa ser validado; `application/json` não é só convenção.
- CORS: `AllowedOrigins` com lista explícita, nunca `*` em endpoint autenticado.
- Headers de segurança: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`, `Referrer-Policy`.
- Cookies de sessão: `Secure`, `HttpOnly`, `SameSite=Lax` ou `Strict`.

## Validação de input

Use `go-playground/validator` ou validação manual com mensagens claras. Princípios:

- valide no contrato (DTO de entrada), não no domínio;
- nunca confie em `json.Unmarshal` para "filtrar" — campos extras passam por padrão;
- use `Decoder.DisallowUnknownFields()` se quiser strict;
- limite tamanho de strings/arrays para evitar DoS.

## OWASP Top 10 traduzido para Go

| OWASP | Em Go aparece como |
|---|---|
| A01 Broken Access Control | Middleware AuthZ ausente, IDOR em handler |
| A02 Cryptographic Failures | `math/rand`, MD5, comparação não-constant-time |
| A03 Injection | `fmt.Sprintf` em SQL, `os/exec` com shell |
| A04 Insecure Design | Sem rate limit, sem idempotency em pagamento |
| A05 Security Misconfiguration | CORS aberto, debug endpoint exposto |
| A06 Vulnerable Components | Falta govulncheck, deps desatualizadas |
| A07 Identification & Auth Failures | JWT alg=none, senha sem bcrypt |
| A08 Data Integrity Failures | Sem assinatura em webhook, sem HMAC |
| A09 Logging Failures | Token em log, sem correlation, sem audit |
| A10 SSRF | `http.Get(userURL)` sem validar host |

## Checklist mínimo de PR sênior

- `golangci-lint run` passa sem disable injustificado;
- `govulncheck ./...` passa;
- Nenhum `fmt.Sprintf` em SQL;
- `crypto/rand` para tudo que precisa de aleatoriedade segura;
- Nenhum secret em log, env dump ou erro stringificado;
- Timeout em todo client HTTP/DB/Redis;
- AuthN e AuthZ explícitas no handler ou middleware aplicado;
- `MaxBytesReader` em endpoints que aceitam body;
- Headers de segurança presentes na resposta.

## Critério de domínio

Você dominou este card quando consegue olhar um diff Go e listar três vetores de ataque possíveis sem ler o resto do PR — porque os anti-padrões viraram instinto.
