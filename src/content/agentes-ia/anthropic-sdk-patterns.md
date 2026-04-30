---
title: "Anthropic SDK — Patterns de Produção"
category: agentes-ia
stack: [TypeScript, Python, Claude]
tags: [anthropic, claude, sdk, caching, streaming, batching]
excerpt: "Prompt caching, streaming, batch API e error handling corretos podem reduzir seu custo em 70% e eliminar downtime por rate limits."
related: [claude-tool-use, llm-fundamentos, agent-observabilidade-producao]
updated: 2026-04
---

## O que é

O Anthropic SDK é a interface primária para usar Claude em produção. Além da chamada básica de mensagem, o SDK expõe funcionalidades que podem reduzir custos dramaticamente, melhorar latência percebida e tornar seu sistema mais resiliente. A maioria dos projetos usa 20% das funcionalidades disponíveis e deixa 50-70% de economia de custo na mesa.

**Prompt caching** é a funcionalidade de maior impacto. Você marca partes do prompt com `cache_control: {"type": "ephemeral"}` e o Anthropic armazena o KV cache computado para aquele prefixo. Calls subsequentes que usam o mesmo prefixo pagam 10x menos por esses tokens (cache read: $0.30/MTok vs input: $3.00/MTok para Sonnet). O cache dura 5 minutos após o último hit. **O que vale cachear:** system prompt longo, documentos de contexto, exemplos few-shot.

**Streaming** é essencial para UX em qualquer caso de uso interativo. Sem streaming, o usuário espera todos os tokens serem gerados antes de ver qualquer coisa. Com streaming, o texto aparece token por token — a latência percebida cai drasticamente mesmo que o tempo total seja igual.

**Batch API** processa requests assíncronos com 50% de desconto e prazo de 24 horas. Perfeito para: processar N documentos, gerar N embeddings textuais, avaliar N outputs em batch, tarefas de analytics.

## Quando usar

- Prompt caching: sempre que você tem system prompts > 1024 tokens ou documentos de contexto fixo
- Streaming: qualquer interface interativa onde o usuário está esperando
- Batch API: processamento em lote sem necessidade de resposta imediata (analysis, ETL, eval)
- Haiku: classificação, extração simples, tarefas que não precisam de raciocínio complexo (~10x mais barato)
- Sonnet: a maioria dos casos de produção — equilíbrio ideal custo/qualidade
- Opus: raciocínio complexo, análise profunda, casos onde qualidade > custo

## Quando NÃO usar

- Caching em prompts que mudam a cada call (perde o benefício)
- Streaming em batch jobs ou APIs server-to-server sem interface humana
- Opus para tarefas de classificação simples — custo injustificável

## Como pedir pra IA

> "Implementa um cliente TypeScript para Claude com: (1) prompt caching no system prompt e nos exemplos few-shot, (2) streaming com handler para tokens parciais, (3) retry com exponential backoff para rate limits e overloaded errors, (4) contagem de tokens antes do envio para validar que não excede o context window, (5) logging de custo por chamada (input tokens × preço + output tokens × preço, considerando cache). Usa o SDK oficial @anthropic-ai/sdk."

## Como auditar o que a IA gerou

- [ ] Verificar se `cache_control` está no lugar certo — deve ser no último bloco do prefixo a ser cacheado, não em blocos dinâmicos
- [ ] Confirmar que retry trata especificamente `status 529` (overloaded) e `status 429` (rate limit) com backoff diferente
- [ ] Verificar se streaming usa `stream.on("text")` ou iteração async, não acumula e processa no final
- [ ] Checar se há validação de `finish_reason === "max_tokens"` para detectar respostas truncadas
- [ ] Confirmar que o cálculo de custo usa preços de cache read/write separados do input normal
- [ ] Verificar se `max_tokens` está explícito (não depender do default)
- [ ] Checar se o cliente reutiliza a instância do Anthropic (não cria nova por request)

## Armadilhas comuns

- **Cache invalidado por mudança mínima** — qualquer mudança no prefixo antes do `cache_control` invalida o cache. Coloque conteúdo dinâmico DEPOIS do prefixo cacheado
- **Não tratar `overloaded_error` diferente de rate limit** — overloaded precisa de backoff mais longo (60s+), rate limit segue o `retry-after` header
- **Batch API com timeout muito curto** — a Anthropic pode levar até 24h para processar. Não use Batch para nada que precisa de resposta em menos de 1 hora
- **Streaming sem tratamento de erros no meio** — a stream pode quebrar. Sempre envolva em try-catch e trate o estado parcial

## Exemplo prático

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  // defaultHeaders: { "anthropic-beta": "..." } se precisar de features beta
});

// Sistema de prompt caching
const SYSTEM_PROMPT = `Você é um assistente especializado em análise de contratos jurídicos brasileiros.
[...2000+ tokens de contexto, regras, exemplos...]`; // Este é o candidato principal para cache

async function analisarContrato(contrato: string): Promise<string> {
  const stream = await client.messages.stream({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" }, // Cache este prefixo
      },
    ],
    messages: [
      {
        role: "user",
        content: `Analise o seguinte contrato:\n\n${contrato}`, // Dinâmico, não cacheado
      },
    ],
  });

  // Streaming para UI
  let fullText = "";
  for await (const chunk of stream.textStream) {
    process.stdout.write(chunk); // ou enviar para WebSocket/SSE
    fullText += chunk;
  }

  const finalMessage = await stream.finalMessage();
  
  // Log de custo
  const usage = finalMessage.usage as Anthropic.Usage & {
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  
  const cost = calcularCusto(usage);
  console.log(`\nCusto: $${cost.toFixed(6)} | Cache hit: ${usage.cache_read_input_tokens ?? 0} tokens`);
  
  return fullText;
}

function calcularCusto(usage: {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}): number {
  const SONNET_PRICING = {
    input: 3.0 / 1_000_000,
    output: 15.0 / 1_000_000,
    cacheWrite: 3.75 / 1_000_000,
    cacheRead: 0.30 / 1_000_000,
  };

  return (
    (usage.input_tokens * SONNET_PRICING.input) +
    (usage.output_tokens * SONNET_PRICING.output) +
    ((usage.cache_creation_input_tokens ?? 0) * SONNET_PRICING.cacheWrite) +
    ((usage.cache_read_input_tokens ?? 0) * SONNET_PRICING.cacheRead)
  );
}

// Retry com backoff exponencial
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      if (err instanceof Anthropic.APIStatusError && err.status === 529) {
        // Overloaded — backoff mais longo
        await new Promise(r => setTimeout(r, 60_000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

// Batch API para processamento em lote
async function processarLote(contratos: string[]): Promise<string> {
  const batch = await client.messages.batches.create({
    requests: contratos.map((contrato, i) => ({
      custom_id: `contrato-${i}`,
      params: {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: `Analise: ${contrato}` }],
      },
    })),
  });
  
  return batch.id; // Salva o ID e polling depois — pode levar horas
}
```
