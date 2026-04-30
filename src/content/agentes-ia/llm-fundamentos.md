---
title: "LLMs — Como funcionam na prática"
category: agentes-ia
stack: [Python, TypeScript, OpenAI, Anthropic]
tags: [llm, tokens, fundamentos, context-window]
excerpt: "Entenda como LLMs realmente funcionam para tomar decisões melhores de arquitetura, custo e debugging."
related: [prompt-engineering-avancado, tool-use-function-calling, anthropic-sdk-patterns]
updated: 2026-04
---

## O que é

LLMs (Large Language Models) são modelos probabilísticos treinados para prever o próximo token em uma sequência. Isso não é filosofia — é a mecânica real que explica todo comportamento observado, incluindo alucinações, inconsistências e capacidades emergentes. Quando você manda uma mensagem pra um LLM, ele não "pensa" nem "raciocina" no sentido humano: ele aplica bilhões de parâmetros para calcular uma distribuição de probabilidade sobre tokens possíveis e amostra dessa distribuição.

**Tokens** são a unidade fundamental. Não são palavras, são fragmentos de palavras baseados em frequência no corpus de treino. "tokenização" vira algo como `["token", "iza", "ção"]`. Em inglês, 1 token ≈ 0.75 palavras; em português, é pior porque palavras longas são mais raras no treino. Isso afeta custo diretamente: você paga por token, não por caractere ou palavra.

**Context window** é o número máximo de tokens que o modelo processa numa única chamada — input + output juntos. GPT-4o tem 128k, Claude 3.5 tem 200k. O que acontece quando você atinge o limite? A maioria das APIs retorna erro ou trunca silenciosamente. Crítico: context window não é memória. Cada chamada é stateless — o modelo não "lembra" da conversa anterior a não ser que você reenvie o histórico explicitamente no prompt.

## Quando usar

- Quando você precisa de geração de texto, sumarização, classificação, extração de informações estruturadas
- Quando o problema tem alta variabilidade de entrada e saída (não dá pra escrever regras)
- Quando precisão absoluta não é obrigatória ou quando você pode verificar o output programaticamente
- Quando o custo por chamada compensa pelo valor gerado (sempre calcule isso antes)

## Quando NÃO usar

- Quando você precisa de resultados 100% determinísticos e auditáveis (use regras explícitas)
- Quando a latência é crítica e você está em hot path (sub-100ms difícil com LLMs)
- Quando o volume é tão alto que o custo inviabiliza (calcule: 1M chamadas × custo médio)
- Para operações matemáticas precisas sem verificação — LLMs são péssimos em aritmética
- Quando o problema cabe num regex ou consulta SQL simples

## Como pedir pra IA

> "Preciso estimar o custo mensal de uma feature que usa [MODEL]. Cada request tem em média [N] tokens de input (system prompt de [X] tokens + histórico de [Y] tokens + mensagem de [Z] tokens) e [M] tokens de output. Volume esperado: [V] requests/dia. Mostra a conta completa e sugere onde posso usar prompt caching pra reduzir custo."

## Como auditar o que a IA gerou

- [ ] Verificar se o cálculo de custo usa o preço correto por 1M tokens (input e output separados)
- [ ] Confirmar que max_tokens está sendo respeitado e não confundido com context window total
- [ ] Verificar se há tratamento para quando a resposta é truncada (finish_reason == "length")
- [ ] Confirmar que temperature está explícito no código (não depender do default da API)
- [ ] Checar se system/user/assistant roles estão sendo usados corretamente (não tudo em user)
- [ ] Verificar se o código lida com tokens de contagem para português (multiplicar por ~1.3x vs inglês)

## Armadilhas comuns

- **Alucinação não é bug, é feature da arquitetura.** Modelos probabilísticos inventam com confiança. Não existe "desligar alucinação", existe verificar outputs programaticamente
- **temperature=0 não é determinístico entre providers.** Mesmo com temperature 0, diferentes versões do mesmo modelo, diferentes datacenters, e diferentes providers produzem resultados diferentes. Não use pra casos que exigem reprodutibilidade exata
- **Context window != memória.** A cada chamada você recomeça do zero. Gerenciamento de histórico é sua responsabilidade
- **Comparar modelos sem contexto de idioma.** Benchmarks em inglês não refletem performance em português — teste com seus dados reais
- **Não contabilizar tokens de saída no custo.** Tokens de output costumam ser 3-5x mais caros que input em vários modelos

## Exemplo prático

```typescript
// Cálculo de custo para Claude 3.5 Sonnet
const PRICING = {
  input: 3.00 / 1_000_000,   // $3/MTok
  output: 15.00 / 1_000_000, // $15/MTok
  cacheWrite: 3.75 / 1_000_000,
  cacheRead: 0.30 / 1_000_000,
};

function estimateCost(
  inputTokens: number,
  outputTokens: number,
  cachedTokens = 0
): number {
  const freshInput = inputTokens - cachedTokens;
  return (
    freshInput * PRICING.input +
    cachedTokens * PRICING.cacheRead +
    outputTokens * PRICING.output
  );
}

// System prompt grande (2000 tokens) cacheado, mensagem nova (200 tokens), output (500 tokens)
console.log(estimateCost(2200, 500, 2000));
// Com cache: ~$0.0078 por call vs ~$0.0141 sem cache — 45% economia

// Parâmetros de sampling e seus efeitos práticos:
const request = {
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,       // máximo de tokens no OUTPUT (não confundir com context)
  temperature: 0.3,       // 0 = mais determinístico, 1 = mais criativo/variado
  // top_p: 0.9,          // alternativa ao temperature, não use os dois juntos
  system: "Você é um assistente especializado em...", // instruções permanentes
  messages: [
    { role: "user", content: "Pergunta do usuário" },
    { role: "assistant", content: "Resposta anterior" }, // histórico manual
    { role: "user", content: "Nova pergunta" },
  ],
};
```

**Intuição sobre temperature:** pense em temperatura como "o quanto o modelo aposta no token mais provável". Temperature 0 sempre escolhe o token mais provável (greedy). Temperature 1 amostra proporcionalmente às probabilidades. Para extração de dados estruturados: 0-0.2. Para geração de texto criativo: 0.7-1.0. Para a maioria dos casos de agentes: 0.3-0.5.
