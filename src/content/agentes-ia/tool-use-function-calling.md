---
title: "Tool Use & Function Calling"
category: agentes-ia
stack: [Claude, OpenAI, LangChain, TypeScript]
tags: [tools, function-calling, structured-output, agents]
excerpt: "Tool use é a fundação de agentes reais — entenda como modelos decidem chamar ferramentas e por que a descrição é o prompt mais importante."
related: [claude-tool-use, langchain-agents, llm-fundamentos]
updated: 2026-04
---

## O que é

Tool use (function calling na terminologia OpenAI) é o mecanismo pelo qual um LLM pode emitir chamadas estruturadas para funções externas em vez de — ou além de — texto livre. Na prática, o modelo recebe uma lista de ferramentas disponíveis (cada uma com nome, descrição e schema de parâmetros), analisa a mensagem do usuário, e decide se deve responder diretamente ou emitir uma chamada de ferramenta com argumentos JSON.

A intuição importante: **o modelo não "usa" a ferramenta, ele apenas gera JSON estruturado**. Quem executa a ferramenta é o seu código. O modelo recebe o resultado de volta e continua gerando. Isso significa que toda a lógica de execução, error handling e validação está do seu lado.

A qualidade da **descrição da ferramenta é o fator mais determinante** de se o modelo vai usá-la corretamente. O modelo usa a descrição para decidir (1) quando chamar esta ferramenta vs outras, (2) quais parâmetros passar. Descrições vagas resultam em chamadas erradas ou ausentes. Pense na descrição como um docstring que o modelo vai ler — cada palavra importa.

**Parallel tool calls** são suportados por Claude e GPT-4+: o modelo pode emitir múltiplas chamadas de ferramentas em um único turno, que você executa em paralelo e retorna os resultados juntos. Isso reduz latência significativamente em fluxos que precisam de múltiplas informações.

## Quando usar

- Quando o agente precisa acessar dados externos (banco de dados, APIs, filesystem)
- Quando você precisa que o modelo execute ações (criar registro, enviar email, fazer cálculo)
- Quando você quer structured output com validação garantida (usar tool com schema em vez de parsear texto)
- Quando você tem múltiplas ações possíveis e quer que o modelo escolha a certa

## Quando NÃO usar

- Para structured output simples onde JSON mode resolve — criar uma tool só para isso é overhead
- Quando a lógica de seleção de ferramenta é simples o suficiente para fazer no código (if/else)
- Quando você tem apenas uma "ferramenta" — provavelmente é só prompt com formato específico
- Para operações síncronas muito rápidas que não precisam de reasoning do modelo para selecionar

## Como pedir pra IA

> "Cria uma implementação de tool use para [CASO DE USO] usando [Claude SDK / OpenAI SDK]. Preciso de: (1) definição de pelo menos 3 tools com descriptions detalhadas que deixem claro quando usar cada uma, (2) loop de execução completo que processa tool calls e injeta resultados, (3) error handling quando a tool falha, (4) suporte a parallel tool calls. O contexto do domínio é [DOMÍNIO]. Usa TypeScript com tipos explícitos para os parâmetros de cada tool."

## Como auditar o que a IA gerou

- [ ] Verificar se cada tool tem description que explica QUANDO usá-la (não apenas o que faz)
- [ ] Confirmar que o loop de execução termina quando finish_reason é "end_turn" (não apenas após N iterações)
- [ ] Verificar se há max_iterations para prevenir loops infinitos (5-10 é razoável)
- [ ] Checar se erros de tool execution são retornados ao modelo (não silenciados)
- [ ] Confirmar que parallel tool calls são executados de fato em paralelo (Promise.all)
- [ ] Verificar se o schema de parâmetros tem descriptions nos campos (não apenas tipos)
- [ ] Checar se há validação dos argumentos gerados pelo modelo antes de executar

## Armadilhas comuns

- **Descriptions vagas fazem o modelo chamar a ferramenta errada ou não chamar quando deveria** — invista tempo nas descriptions como se fossem documentação de API pública
- **Não retornar erros ao modelo** — quando uma tool falha, o modelo precisa saber para tentar diferente ou informar o usuário. Silenciar erros causa o modelo ficar "preso"
- **Loop infinito de tool calls** — sem max_iterations, um modelo pode ficar chamando ferramentas indefinidamente. Sempre implemente um limite
- **Parâmetros opcionais sem defaults claros** — documente no schema o que acontece quando o parâmetro está ausente
- **Executar tools com side effects sem confirmação** — operações destrutivas precisam de HITL

## Exemplo prático

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Tool definitions — descriptions são o prompt mais importante
const tools: Anthropic.Tool[] = [
  {
    name: "buscar_cliente",
    description:
      "Busca dados de um cliente pelo ID ou CPF/CNPJ. Use quando o usuário mencionar um cliente específico e você precisar de seus dados cadastrais, histórico ou saldo. NÃO use para listar múltiplos clientes.",
    input_schema: {
      type: "object" as const,
      properties: {
        identificador: {
          type: "string",
          description: "ID interno (UUID) ou CPF/CNPJ do cliente (apenas dígitos)",
        },
        incluir_historico: {
          type: "boolean",
          description: "Se true, inclui últimas 10 transações. Default: false.",
        },
      },
      required: ["identificador"],
    },
  },
  {
    name: "calcular_frete",
    description:
      "Calcula o frete para um CEP de destino com base no peso e dimensões do pedido. Use apenas quando tiver todos os dados do pedido e um CEP de destino válido.",
    input_schema: {
      type: "object" as const,
      properties: {
        cep_destino: { type: "string", description: "CEP sem hífen, 8 dígitos" },
        peso_kg: { type: "number", description: "Peso total em kilogramas" },
      },
      required: ["cep_destino", "peso_kg"],
    },
  },
];

// Simulação de execução de tools
async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  if (name === "buscar_cliente") {
    return JSON.stringify({ id: input.identificador, nome: "João Silva", saldo: 1500 });
  }
  if (name === "calcular_frete") {
    return JSON.stringify({ valor: 25.9, prazo_dias: 3, transportadora: "Correios PAC" });
  }
  throw new Error(`Tool desconhecida: ${name}`);
}

// Loop de execução com parallel tool calls
async function runAgent(userMessage: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < 10; i++) {
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock?.text ?? "";
    }

    if (response.stop_reason === "tool_use") {
      // Adiciona resposta do assistente (com tool_use blocks)
      messages.push({ role: "assistant", content: response.content });

      // Executa tools em paralelo
      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          if (block.type !== "tool_use") return null;
          try {
            const result = await executeTool(
              block.name,
              block.input as Record<string, unknown>
            );
            return {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: result,
            };
          } catch (err) {
            return {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: `Erro: ${err instanceof Error ? err.message : String(err)}`,
              is_error: true,
            };
          }
        })
      );

      messages.push({
        role: "user",
        content: toolResults.filter(Boolean) as Anthropic.ToolResultBlockParam[],
      });
    }
  }

  throw new Error("Max iterations atingido");
}
```
