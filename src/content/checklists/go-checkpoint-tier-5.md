---
title: "Go Checkpoint Tier 5 — Produção, Segurança, AI-Era e Entrevista Sênior"
category: checklists
stack: [Go, Docker, OpenTelemetry, Anthropic SDK]
tags: [checkpoint, exercicios, golang, security, observability, ai, interview, senior, exam-prep]
excerpt: "8 challenges para checkpoint sênior: supply chain, JWT pitfalls, observabilidade, IA em Go e system design — passe e você está pronto pra qualquer entrevista Go sênior."
related: [go-security-pratico, go-auth-jwt-paseto, go-ai-integration, go-entrevista-senior, go-microservice-production-checklist, go-observabilidade-zap-otel]
updated: "2026-05-08"
---

## Como usar

Tier 5 simula entrevista sênior: questões abertas, trade-offs, arquitetura. Resolva como se estivesse no whiteboard. Acerte 6+ e o exame de tier 5 vai parecer fácil.

---

## 1. 🧠 JWT alg confusion

Seu colega escreve:

```go
token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
    return secret, nil
})
```

Por que isso é catastrófico em produção?

<details>
<summary>Resposta</summary>

Aceita qualquer `alg`, incluindo `none` (token sem assinatura). E se você usa RS256 em outro contexto, o atacante pode emitir um token assinado com HS256 usando a **chave pública RSA** como secret — passa.

Correção:

```go
token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
    if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
        return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
    }
    return secret, nil
}, jwt.WithValidMethods([]string{"HS256"}), jwt.WithExpirationRequired())
```

Sempre afirme o método esperado e exija expiração.
</details>

---

## 2. 🛠️ Supply chain check

Você herdou um projeto Go sem nenhuma checagem. Liste, em ordem, os 5 comandos/configurações que você adiciona ao CI **hoje** para travar supply chain.

<details>
<summary>Resposta</summary>

1. `govulncheck ./...` — falha build em CVE que toca código ativo.
2. `go mod verify` + `GOFLAGS=-mod=readonly` — checksums batem, CI não muta `go.mod`.
3. `golangci-lint run` com gosec, staticcheck, errcheck, bodyclose habilitados.
4. SBOM do build (`syft` ou `cyclonedx-gomod`) salvo como artifact.
5. Scan da imagem final (`trivy image` ou `grype`) e, se política exige, assinatura com `cosign`.

Bonus: Renovate/Dependabot pra atualizar deps com PR auto.
</details>

---

## 3. 🧠 GOMAXPROCS em container

Você está rodando um serviço Go num node K8s com 96 cores, em pod com `limits.cpu: 2`. Sem ajuste, qual o problema e qual a correção?

<details>
<summary>Resposta</summary>

Sem ajuste, `runtime.GOMAXPROCS(0)` retorna 96 (o número de cores do nó), porque cgroups v1/v2 antigos não eram detectados automaticamente. O scheduler tenta usar 96 P's mas o cgroup só dá 2 CPUs efetivos → **contention enorme**, throughput cai e p99 explode.

Correção:

- Go 1.25+ detecta cgroups automaticamente.
- Versões anteriores: `import _ "go.uber.org/automaxprocs"` ou setar `GOMAXPROCS=2` via env var.
- Em paralelo: `GOMEMLIMIT=1900MiB` (95% do `limits.memory`) — sem isso, GC pode não acompanhar pressão e o pod morre OOM antes do HPA reagir.
</details>

---

## 4. 🛠️ Observability sob pressão

Reclamação: "endpoint `/checkout` está lento, p99 passa de 2s só em horário de pico". Você tem slog estruturado, OTel traces, métricas Prometheus. Descreva sua sequência de diagnóstico em 4 passos.

<details>
<summary>Resposta</summary>

1. **Métrica RED**: gráfico de p50/p95/p99 do endpoint, sobreposto com taxa e taxa de erro. Confirma quando começou e correlaciona com pico de tráfego.
2. **USE do recurso**: pool de DB (`pgxpool.Stat`), goroutines (`go_goroutines` no Prometheus), CPU/mem do container. Identifica onde satura.
3. **Tail-sample do trace**: pega trace de uma request lenta no horário do incidente, vê qual span é o longo (DB query? Redis? gateway externo?).
4. **Log correlacionado**: usa o `trace_id` da request lenta para buscar logs estruturados — confirma a query/conexão em problema.

Se a hipótese for pool exausto: aumentar pool não resolve, é remediação. Causa raiz costuma ser query lenta nova ou transação longa. Profile com `pprof`.
</details>

---

## 5. 🧠 Refresh token reuse detection

Sua API tem refresh token de 30 dias. Cliente reporta: "alguém parece estar logado na minha conta". Você detecta token reuse — qual a ação correta?

<details>
<summary>Resposta</summary>

Refresh token reuse = um refresh token já consumido voltou a ser apresentado. Isso significa que **dois clientes têm o token** — provavelmente vazou.

Ação: **revogue toda a árvore daquela sessão** (família). O usuário precisa fazer login novamente. Não basta revogar o refresh atual — todos os tokens emitidos a partir dessa cadeia precisam ser invalidados.

Implementação típica: cada refresh token tem `family_id`. Quando rotaciona, marca o anterior como "used" com timestamp. Se um "used" aparecer de novo, busca todos os tokens com mesmo `family_id` e revoga.

Sem detecção de reuse, refresh token vazado dá acesso vitalício até expiração.
</details>

---

## 6. 🛠️ AI streaming + custo

Você precisa expor `POST /ai/summarize` em Go que chama Claude com streaming. Preocupações sênior: timeout, cancelamento, observability de tokens, fallback. Liste 5 cuidados de produção.

<details>
<summary>Resposta</summary>

1. **Timeout específico**: LLMs podem levar 30-60s legitimamente. Não use o timeout default do servidor — defina `WriteTimeout: 90s` para esse endpoint.
2. **Cancelamento propagado**: passe `r.Context()` para o stream. Se o cliente fecha conexão, o request ao provider é cancelado e você não paga pela continuação.
3. **Métricas de token e custo**: emita span attributes `usage.input_tokens`, `usage.output_tokens`, `usage.cache_read_tokens` em cada chamada. Custo estimado vai pra dashboard.
4. **Prompt caching ativo**: marque system prompt como `cache_control: ephemeral`. Cache hit pode reduzir custo em 90%.
5. **Circuit breaker + fallback**: se o provider cair, retorne 503 imediatamente em vez de empilhar timeouts. Fallback opcional: sumário extractivo simples local.

Bonus: rate limit por tenant e idempotency key — repetir não custa duas vezes.
</details>

---

## 7. 🧠 System design ao vivo

"Desenhe um sistema em Go que processa 50k pagamentos/segundo. Multi-tenant, PCI-adjacent, latência p99 < 300ms." Liste os 6 componentes principais e a justificativa rápida de cada.

<details>
<summary>Resposta</summary>

1. **API Gateway** (Go + Chi/Connect-Go): rate limit por tenant, AuthN, request ID, tracing. p99 baixo aqui exige minimal middleware.
2. **Charge service** (Go): apenas valida e enfileira. Resposta sincrona é "accepted, ID=..." em < 50ms. Processamento real é async.
3. **Outbox + RabbitMQ**: charge salva no DB + outbox numa transação. Worker dedicado publica no broker. At-least-once.
4. **Processor workers** (Go): consomem fila, chamam gateways externos com circuit breaker + retry idempotente. Idempotency key obrigatória.
5. **PostgreSQL particionado**: por tenant_id ou hash. Replica de leitura para queries de extrato. Monitor longo-running tx.
6. **Reconciliation job** (Go cron): noturno, compara nosso registro com extrato dos gateways. Detecta divergências.

Pontos extras esperados: KMS para token de cartão, audit log imutável (event sourcing), DR runbook, error budget definido.
</details>

---

## 8. 🛠️ Refactor sênior

Você abre o handler:

```go
func ProcessOrder(w http.ResponseWriter, r *http.Request) {
    body, _ := io.ReadAll(r.Body)
    var req Order
    json.Unmarshal(body, &req)

    db.Exec("INSERT INTO orders VALUES (?, ?, ?)", req.ID, req.Total, req.UserID)

    log.Printf("order created: %s", req.ID)

    json.NewEncoder(w).Encode(req)
}
```

Liste 8 problemas. (Sim, é fácil chegar em 8.)

<details>
<summary>Resposta</summary>

1. Erros de `io.ReadAll`, `json.Unmarshal`, `db.Exec`, `Encode` ignorados.
2. Sem `MaxBytesReader` — body grande derruba o serviço.
3. SQL injection potencial dependendo de quem é `db` (provavelmente OK com `?` mas chame com pgx para tipagem).
4. Sem `context` — usa `context.Background` implícito, não honra cancelamento do client.
5. Sem AuthN/AuthZ — qualquer um cria order para qualquer `UserID`.
6. Sem validação — campos obrigatórios podem estar vazios, total negativo passa.
7. Log com `log.Printf` plain — não estruturado, sem correlation ID, sem trace.
8. Status code padrão 200, mas é criação — deveria ser 201 + `Location`.
9. Bonus: sem `r.Body.Close()` (handler ok porque o servidor fecha, mas em outros contextos vaza).

Versão sênior usaria DTO validado, transação, retorno tipado, slog com trace_id, AuthZ via middleware e métricas RED.
</details>

---

## Critério para fazer o exame Tier 5

- 6+ dos 8 corretos sem consultar.
- Apontou alg confusion + sequência completa de hardening JWT (questão 1).
- Listou pelo menos 4 dos 5 itens de supply chain (questão 2).
- Diagnosticou GOMAXPROCS+GOMEMLIMIT em container (questão 3).
- Esboçou system design com outbox + idempotency + reconciliation (questão 7).

Pronto: `/skills/go-enterprise/exam/5`. Passa nesse exame e você está pronto pra qualquer entrevista Go sênior — base, pleno e sênior.
