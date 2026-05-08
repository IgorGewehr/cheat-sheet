---
title: "Go: Integração com LLMs — OpenAI, Anthropic, Streaming, MCP, RAG com pgvector"
category: agentes-ia
stack: [Go, OpenAI SDK, Anthropic SDK, MCP, pgvector, sse]
tags: [ai, llm, golang, openai, anthropic, mcp, streaming, rag, function-calling]
excerpt: "Como adicionar IA num backend Go sem virar wrapper ruim de Python: SDKs oficiais, streaming SSE, function calling, MCP server em Go, RAG com pgvector e controle de custo."
related: [go-chi-http, go-postgres-pgx-sqlc, go-resilience-patterns, ai-agent-architecture, mcp-protocol]
updated: "2026-05-08"
---

## Por que IA em Go faz sentido

A maior parte dos exemplos de LLM está em Python, mas se seu sistema **já é Go**, levar a chamada pra outra runtime adiciona latência, dois deploys e uma camada de tradução. Em produção, Go integra LLMs muito bem:

- I/O concorrente (streaming + chamadas paralelas) é ponto forte da linguagem;
- tipagem ajuda a domar function calling;
- dependências tendem a ser menores que o stack Python típico;
- binário único é mais fácil de operar.

O que você perde: ferramentas de evaluation/treinamento. Para isso, ainda mantenha Python — mas só onde precisa.

## SDK oficial Anthropic

```go
import (
    "github.com/anthropics/anthropic-sdk-go"
    "github.com/anthropics/anthropic-sdk-go/option"
)

client := anthropic.NewClient(option.WithAPIKey(os.Getenv("ANTHROPIC_API_KEY")))

resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
    Model:     anthropic.F(anthropic.ModelClaudeOpus4_7),
    MaxTokens: anthropic.F(int64(1024)),
    Messages: anthropic.F([]anthropic.MessageParam{
        anthropic.NewUserMessage(anthropic.NewTextBlock("Resuma esse PR")),
    }),
})
```

Para OpenAI: `github.com/openai/openai-go` segue padrão similar.

## Prompt caching (essencial pra custo)

Em Anthropic, marque blocos estáveis (system prompt, schema, exemplos) como cacheable — economia tipicamente 90% no cache hit:

```go
anthropic.NewUserMessage(
    anthropic.NewTextBlockWithCacheControl(longSystemPrompt, anthropic.CacheControlEphemeralParam{Type: anthropic.F("ephemeral")}),
    anthropic.NewTextBlock(userQuestion),
)
```

Cache hit/miss vem nos response usage fields — exporte como métrica:

```go
metrics.CacheHits.Add(float64(resp.Usage.CacheReadInputTokens))
metrics.CacheMisses.Add(float64(resp.Usage.CacheCreationInputTokens))
```

## Streaming via SSE para o cliente

Resposta de LLM costuma ser longa — streamar é UX e evita timeout:

```go
func (h *Handler) Stream(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("X-Accel-Buffering", "no") // nginx

    flusher, ok := w.(http.Flusher)
    if !ok { http.Error(w, "stream not supported", 500); return }

    stream := client.Messages.NewStreaming(r.Context(), params)
    defer stream.Close()

    for stream.Next() {
        event := stream.Current()
        switch e := event.AsAny().(type) {
        case anthropic.ContentBlockDeltaEvent:
            if delta, ok := e.Delta.AsAny().(anthropic.TextDelta); ok {
                fmt.Fprintf(w, "data: %s\n\n", jsonEscape(delta.Text))
                flusher.Flush()
            }
        }
    }

    if err := stream.Err(); err != nil {
        fmt.Fprintf(w, "event: error\ndata: %s\n\n", err.Error())
        flusher.Flush()
    }
}
```

Sempre envie `X-Accel-Buffering: no` quando atrás de nginx — sem isso o proxy bufferiza e mata o efeito streaming.

## Function calling tipado

```go
type GetInvoiceArgs struct {
    InvoiceID string `json:"invoice_id" jsonschema:"required"`
}

tools := []anthropic.ToolParam{
    {
        Name:        anthropic.F("get_invoice"),
        Description: anthropic.F("Buscar fatura por ID"),
        InputSchema: anthropic.F(generateSchema[GetInvoiceArgs]()),
    },
}

resp, _ := client.Messages.New(ctx, anthropic.MessageNewParams{
    Model:     anthropic.F(anthropic.ModelClaudeSonnet4_6),
    MaxTokens: anthropic.F(int64(2048)),
    Tools:     anthropic.F(tools),
    Messages:  anthropic.F(messages),
})

for _, block := range resp.Content {
    if block.Type == "tool_use" {
        var args GetInvoiceArgs
        json.Unmarshal(block.Input, &args)
        result := executeTool(ctx, args)
        // append como ToolResultBlock e re-chamar
    }
}
```

Use `invopop/jsonschema` ou similar para gerar schema a partir de struct Go — evita drift entre código e descrição da tool.

## MCP server em Go

Model Context Protocol expõe tools/resources/prompts para qualquer cliente compatível (Claude Code, Claude Desktop). Em Go:

```go
import "github.com/mark3labs/mcp-go/server"

s := server.NewMCPServer("billing-mcp", "1.0.0")

s.AddTool(server.Tool{
    Name:        "find_invoice",
    Description: "Busca fatura por número",
    InputSchema: schema,
}, func(ctx context.Context, req server.CallToolRequest) (*server.CallToolResult, error) {
    number := req.Params.Arguments["number"].(string)
    inv, err := repo.FindByNumber(ctx, number)
    if err != nil { return server.NewToolResultError(err.Error()), nil }
    return server.NewToolResultText(fmt.Sprintf("Fatura %s: R$ %.2f", inv.Number, inv.Total)), nil
})

server.ServeStdio(s) // ou ServeSSE para HTTP
```

MCP em Go vira um binário pequeno que qualquer dev no time pode instalar e usar via Claude Code — multiplica o uso de IA sem mexer em backend principal.

## RAG com pgvector + pgx

Para "RAG sobre nossa base de docs", PostgreSQL+pgvector é suficiente em milhões de chunks:

```sql
CREATE EXTENSION vector;

CREATE TABLE doc_chunks (
    id        bigserial PRIMARY KEY,
    doc_id    uuid NOT NULL,
    content   text NOT NULL,
    embedding vector(1536) NOT NULL
);

CREATE INDEX ON doc_chunks USING hnsw (embedding vector_cosine_ops);
```

```go
import "github.com/pgvector/pgvector-go"

func search(ctx context.Context, query string, k int) ([]Chunk, error) {
    emb := embedQuery(ctx, query) // chamada ao embedding model

    rows, err := pool.Query(ctx, `
        SELECT id, doc_id, content
        FROM doc_chunks
        ORDER BY embedding <=> $1
        LIMIT $2
    `, pgvector.NewVector(emb), k)
    // ...
}
```

`<=>` é o operador de cosine distance. `<->` é L2. Use o que combinar com como o embedding foi normalizado.

## Idempotência e custo

Cada chamada de LLM custa dinheiro real. Em produção sênior:

- **idempotency key** por request lógico — repita não custa duas vezes;
- **cache de output** para prompts determinísticos (temperatura 0, mesmo input);
- **rate limit por tenant**;
- **circuit breaker** apontando pro provider — se cair, degrade graciosamente, não empilhe retries;
- **timeout específico** maior que o default (LLMs podem levar 30-60s legitimamente);
- **observability**: tokens in/out por endpoint, custo estimado, p99 de latência, taxa de erro por modelo.

```go
// observability mínima por chamada
spanCtx, span := tracer.Start(ctx, "llm.message")
defer span.End()
span.SetAttributes(
    attribute.String("model", string(model)),
    attribute.Int("max_tokens", maxTokens),
)
// após resposta:
span.SetAttributes(
    attribute.Int("usage.input_tokens", int(resp.Usage.InputTokens)),
    attribute.Int("usage.output_tokens", int(resp.Usage.OutputTokens)),
)
```

## Multi-provider abstraction (com cuidado)

Tentação comum é abstrair provider atrás de interface "para trocar fácil". Geralmente vira erro: cada provider tem features únicas (cache, citations, thinking, tool format).

Faça abstração só quando:

- você efetivamente faz failover entre providers;
- as features que importam são as comuns (text-in/text-out simples);
- você tem evals que comparam saídas.

Caso contrário, código direto contra o SDK do provider escolhido é mais legível e evita lowest-common-denominator.

## Evals

Evaluation é o equivalente de teste para LLM — sem isso, qualquer mudança de prompt ou modelo é ato de fé.

```go
type EvalCase struct {
    Name     string
    Input    string
    Expected string
    Validate func(output string) bool
}

func RunEvals(ctx context.Context, cases []EvalCase) Report {
    var report Report
    for _, c := range cases {
        out := callLLM(ctx, c.Input)
        if !c.Validate(out) {
            report.Failures = append(report.Failures, c.Name)
        }
    }
    return report
}
```

Crie um pequeno harness Go que rode evals em CI quando tocar prompt — barato e evita regressão silenciosa.

## Critério de domínio

Você dominou este card quando consegue adicionar uma feature LLM num serviço Go produzindo: streaming pro cliente, métricas de custo, fallback diante de erro, cache hit rate visível e evals automáticos — sem cargo cult de tutorial Python.
