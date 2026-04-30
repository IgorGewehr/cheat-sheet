---
title: "Prompt Engineering Avançado"
category: agentes-ia
stack: [Claude, GPT, Gemini]
tags: [prompt, cot, few-shot, structured-output]
excerpt: "Técnicas que realmente movem o ponteiro em qualidade de resposta: CoT, few-shot, XML tags e structured output."
related: [llm-fundamentos, tool-use-function-calling, claude-tool-use]
updated: 2026-04
---

## O que é

Prompt engineering não é "escrever instruções mais claras" — é entender o modelo suficientemente bem para guiar seu processo de geração. Os modelos modernos são sensíveis a estrutura, exemplos, ordem e framing de formas que parecem arbitrárias mas têm explicações nas probabilidades de treino. A diferença entre um prompt fraco e um forte pode ser a diferença entre 40% e 90% de taxa de sucesso em produção.

**Chain of Thought (CoT)** funciona porque força o modelo a gerar tokens intermediários que servem como "rascunho" computacional. Quando o modelo escreve os passos do raciocínio, ele se ancora nesses tokens ao gerar os próximos — efetivamente aumentando sua "memória de trabalho". Isso ajuda em problemas de raciocínio multi-step mas prejudica em tarefas de recuperação direta onde o modelo já sabe a resposta (CoT pode introduzir erros onde não havia).

**Few-shot examples** são mais poderosos que instruções detalhadas para a maioria dos modelos. Um bom exemplo demonstra o formato esperado, o tom, o nível de detalhe e o raciocínio — tudo de uma vez. Qualidade importa muito mais que quantidade: 3 exemplos excelentes superam 10 exemplos mediocres.

**XML tags para Claude** são um padrão canônico da Anthropic. Claude foi treinado com dados estruturados com XML, então usar tags como `<context>`, `<examples>`, `<instructions>` genuinamente melhora performance e reduz confusão entre seções.

## Quando usar

- CoT: problemas de raciocínio multi-step, classificação com lógica complexa, qualquer situação onde o processo importa
- Few-shot: quando o formato de output é não-trivial, quando você tem exemplos reais de boa qualidade
- Structured output (JSON mode): sempre que você vai parsear o output programaticamente
- XML tags (Claude): sempre que o prompt tem múltiplas seções distintas

## Quando NÃO usar

- CoT em tasks de lookup simples — aumenta latência e pode introduzir erros onde a resposta é direta
- Few-shot com exemplos de baixa qualidade — piora o output (garbage in, garbage out)
- Muitos exemplos few-shot quando você pode descrever a regra explicitamente
- "Pense passo a passo" como frase mágica sem estrutura — o efeito é muito menor que CoT estruturado

## Como pedir pra IA

> "Quero melhorar este prompt para extração de dados de [DOMÍNIO]. O prompt atual tem problemas com [SINTOMA ESPECÍFICO — ex: retorna JSON malformado, mistura idiomas, inclui informações desnecessárias]. Analisa o prompt atual, identifica os problemas específicos, e reescreve aplicando: (1) XML tags para separar seções, (2) 2-3 exemplos few-shot com edge cases reais, (3) instruções de output estruturado com schema explícito. Prompt atual: [PROMPT]"

## Como auditar o que a IA gerou

- [ ] Verificar se os exemplos few-shot cobrem edge cases e não apenas o caso feliz
- [ ] Confirmar que o schema JSON/estrutura de output está explícito no prompt (não apenas descrito)
- [ ] Testar o prompt com inputs adversariais (usuário malicioso, dados sujos, idioma errado)
- [ ] Verificar se há instrução explícita de o que fazer quando informação não está disponível
- [ ] Confirmar que CoT está estruturado (com tags ou seções) e não é apenas "pense passo a passo"
- [ ] Checar se o system prompt e user prompt não têm instruções conflitantes

## Armadilhas comuns

- **"Seja um especialista em X"** raramente ajuda tanto quanto exemplos concretos do que você quer
- **Negativos difusos** ("não seja vago") funcionam pior que positivos específicos ("responda em exatamente 3 bullet points de 1 frase cada")
- **Prompt injection via few-shot** — se seus exemplos vêm de user input, um atacante pode envenenar os exemplos
- **CoT vai no sistema, resposta final vai separada** — se você quer raciocínio visível mas resposta limpa, instrua o modelo a separar explicitamente
- **Temperature alta com structured output** — resulta em JSON malformado. Para extração estruturada, use temperature ≤ 0.2

## Exemplo prático

**Prompt fraco:**
```
Extraia os dados principais desta nota fiscal e retorne em JSON.
```

**Prompt forte (Claude):**
```xml
<system>
Você é um extrator de dados fiscais. Sempre retorne JSON válido conforme o schema.
Se um campo não estiver presente, retorne null. Nunca invente dados.
</system>

<schema>
{
  "numero_nf": "string | null",
  "data_emissao": "YYYY-MM-DD | null",
  "cnpj_emitente": "string (apenas dígitos) | null",
  "valor_total": "number | null",
  "itens": [{"descricao": "string", "quantidade": "number", "valor_unitario": "number"}]
}
</schema>

<examples>
<example>
<input>NF-e 000.123 emitida em 15/03/2025 pela empresa 12.345.678/0001-90, total R$ 1.250,00</input>
<output>{"numero_nf": "000123", "data_emissao": "2025-03-15", "cnpj_emitente": "12345678000190", "valor_total": 1250.00, "itens": []}</output>
</example>
<example>
<input>Recibo de serviço prestado, valor quinhentos reais</input>
<output>{"numero_nf": null, "data_emissao": null, "cnpj_emitente": null, "valor_total": 500.00, "itens": []}</output>
</example>
</examples>

<nota_fiscal>
{{NOTA_FISCAL_CONTENT}}
</nota_fiscal>

Extraia os dados e retorne apenas o JSON, sem explicação.
```

**Por que funciona:** schema explícito elimina ambiguidade de formato, exemplos mostram tratamento de casos parciais, instrução explícita para null evita invenção, XML tags separam seções claramente para Claude, instrução final "apenas JSON" previne texto extra que quebraria o parse.
