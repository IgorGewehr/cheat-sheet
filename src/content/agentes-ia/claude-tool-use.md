---
title: "Claude Tool Use — Guia Completo"
category: agentes-ia
stack: [TypeScript, Python, Claude, Anthropic]
tags: [claude, tool-use, structured-output, agents]
excerpt: "Guia completo de tool use com Claude: parallel tools, forced tool use, o padrão 'think', e o loop agêntico completo em TypeScript."
related: [tool-use-function-calling, anthropic-sdk-patterns, human-in-the-loop]
updated: 2026-04
---

## O que é

Claude tem suporte nativo a tool use desde Claude 3. A implementação é mais expressiva que a do OpenAI: suporta parallel tool calls no mesmo turno, `tool_choice` para forçar uso de ferramenta específica, e o padrão de "think tool" para raciocínio estruturado.

**Como Claude decide usar uma tool:** o modelo analisa a descrição da tool e a mensagem atual. Se a descrição diz "use quando o usuário pedir X" e o usuário pediu X, Claude chama a tool. A qualidade da description é diretamente proporcional à taxa de acerto. Não existe magia — é o modelo fazendo matching probabilístico entre a situação e a descrição.

**Parallel tool use:** Claude pode emitir múltiplas `tool_use` blocks em um único response. Isso acontece quando ele identifica que precisa de múltiplas informações independentes. Do seu lado, você executa todas em paralelo com `Promise.all` e retorna os resultados juntos. Isso reduz a latência de N tool calls de N×latência para max(latências).

**Forced tool use (tool_choice):** você pode forçar Claude a usar uma tool específica com `tool_choice: {type: "tool", name: "nome_da_tool"}`. Útil para garantir structured output via tool em vez de texto livre. Também tem `tool_choice: {type: "any"}` para forçar o uso de alguma tool sem especificar qual.

**O "think" tool:** um padrão poderoso onde você define uma tool chamada "think" que aceita um campo de raciocínio e não tem side effects. Claude chama a tool para organizar seu pensamento antes de tomar ações. Isso melhora qualidade em tarefas complexas e cria um log explícito do raciocínio.

## Quando usar

- Qualquer agente que precise acessar dados externos ou executar ações
- Structured output onde você quer garantia de schema (usar tool com JSON schema em vez de JSON mode)
- Forced tool use quando você precisa de output estruturado específico sempre
- "Think" tool quando a qualidade de raciocínio importa e você quer auditabilidade

## Quando NÃO usar

- Structured output muito simples — prompt com "retorne JSON" + temperature 0 pode ser suficiente
- Quando o overhead de 2-3 turnos de tool calling é inaceitável para latência
- Para classificação de uma lista fechada de opções — enumere as opções no prompt

## Como pedir pra IA

> "Implementa um loop agêntico completo em TypeScript usando o Anthropic SDK. O agente deve: (1) ter 4-5 tools relevantes para [DOMÍNIO], (2) suportar parallel tool calls com Promise.all, (3) incluir a 'think' tool para raciocínio estruturado, (4) ter max_iterations de segurança, (5) retornar o histórico completo de actions tomadas além da resposta final. Inclui tipos TypeScript explícitos para cada tool input/output."

## Como auditar o que a IA gerou

- [ ] Verificar se parallel tool calls são detectados (múltiplos `tool_use` blocks) e executados com Promise.all
- [ ] Confirmar que o loop termina em `stop_reason === "end_turn"` (não apenas quando não há tool_use)
- [ ] Verificar se o histórico de mensagens é construído corretamente (assistant content + user tool_result)
- [ ] Checar se `tool_use_id` do resultado corresponde ao `id` da tool call (não pode ser diferente)
- [ ] Confirmar que erros de tool são passados de volta com `is_error: true` (não silenciados)
- [ ] Verificar se a "think" tool não tem side effects no código de execução
- [ ] Checar se `tool_choice` com forced tool evita loop infinito (use `tool_choice: {type: "auto"}` no turno seguinte)

## Armadilhas comuns

- **`tool_use_id` errado nos resultados** — Claude rejeita silenciosamente resultados com ID que não bate. Sempre use o `id` exato do tool_use block
- **Não incluir o response do assistant antes dos tool_results** — a sequência correta é: user → assistant (com tool_use) → user (com tool_result). Pular o assistant quebra o contexto
- **Forçar tool_choice em loop** — se você usa `tool_choice: {type: "tool"}` em todos os turnos, Claude nunca consegue dar a resposta final
- **Think tool com efeito colateral** — se a think tool logar ou persistir algo, cuidado: Claude vai chamá-la muitas vezes

## Exemplo prático

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
  // "Think" tool — padrão para raciocínio estruturado
  {
    name: "think",
    description:
      "Use this tool to reason through complex problems before taking action. " +
      "Write your step-by-step thinking here. This has no external effects.",
    input_schema: {
      type: "object" as const,
      properties: {
        raciocinio: {
          type: "string",
          description: "Seu raciocínio detalhado passo a passo",
        },
      },
      required: ["raciocinio"],
    },
  },
  {
    name: "buscar_pedido",
    description:
      "Busca detalhes de um pedido pelo número. Use para consultar status, itens e valores de pedidos existentes.",
    input_schema: {
      type: "object" as const,
      properties: {
        numero_pedido: { type: "string", description: "Número do pedido (ex: PED-001234)" },
      },
      required: ["numero_pedido"],
    },
  },
  {
    name: "buscar_estoque",
    description:
      "Verifica estoque disponível de um produto. Use quando precisar saber se um produto está disponível para venda.",
    input_schema: {
      type: "object" as const,
      properties: {
        sku: { type: "string", description: "SKU do produto" },
      },
      required: ["sku"],
    },
  },
];

async function executarTool(name: string, input: Record<string, string>): Promise<string> {
  // Simulação — conectaria a APIs reais
  const handlers: Record<string, (i: Record<string, string>) => string> = {
    think: (i) => `Pensamento registrado: ${i.raciocinio}`,
    buscar_pedido: (i) =>
      JSON.stringify({ numero: i.numero_pedido, status: "entregue", total: 250.0 }),
    buscar_estoque: (i) =>
      JSON.stringify({ sku: i.sku, disponivel: 15, reservado: 3 }),
  };
  const handler = handlers[name];
  if (!handler) throw new Error(`Tool desconhecida: ${name}`);
  return handler(input);
}

async function runAgente(mensagem: string): Promise<{
  resposta: string;
  toolsUsadas: string[];
}> {
  const mensagens: Anthropic.MessageParam[] = [
    { role: "user", content: mensagem },
  ];
  const toolsUsadas: string[] = [];
  const MAX_ITER = 10;

  for (let i = 0; i < MAX_ITER; i++) {
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      tools,
      messages: mensagens,
    });

    if (response.stop_reason === "end_turn") {
      const texto = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      return { resposta: texto, toolsUsadas };
    }

    if (response.stop_reason === "tool_use") {
      // Adiciona resposta do assistente ao histórico
      mensagens.push({ role: "assistant", content: response.content });

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      // Executa TODAS as tools em paralelo
      const resultados = await Promise.all(
        toolUseBlocks.map(async (block) => {
          toolsUsadas.push(block.name);
          try {
            const output = await executarTool(
              block.name,
              block.input as Record<string, string>
            );
            return {
              type: "tool_result" as const,
              tool_use_id: block.id, // ID exato do block
              content: output,
            };
          } catch (err) {
            return {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: `Erro ao executar ${block.name}: ${err}`,
              is_error: true,
            };
          }
        })
      );

      mensagens.push({ role: "user", content: resultados });
    }
  }

  throw new Error("Agente atingiu máximo de iterações");
}

// Uso com forced tool_choice para structured output
async function extrairEstruturado(texto: string) {
  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    tools: [{
      name: "salvar_extracao",
      description: "Salva os dados extraídos do texto",
      input_schema: {
        type: "object" as const,
        properties: {
          nome: { type: "string" },
          valor: { type: "number" },
          data: { type: "string" },
        },
        required: ["nome", "valor", "data"],
      },
    }],
    tool_choice: { type: "tool", name: "salvar_extracao" }, // Força uso desta tool
    messages: [{ role: "user", content: `Extraia os dados: ${texto}` }],
  });

  const toolUse = response.content.find(b => b.type === "tool_use") as Anthropic.ToolUseBlock;
  return toolUse?.input; // Sempre terá o schema correto
}
```
