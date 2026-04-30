---
title: "MCP — Model Context Protocol"
category: agentes-ia
stack: [TypeScript, Python, Claude, Claude Code]
tags: [mcp, model-context-protocol, tools, resources, servers]
excerpt: "MCP padroniza como agentes de IA se conectam a ferramentas e dados — entenda como construir e consumir servidores MCP em TypeScript."
related: [tool-use-function-calling, claude-tool-use, claude-code-sdk]
updated: 2026-04
---

## O que é

MCP (Model Context Protocol) é um protocolo aberto da Anthropic que padroniza a comunicação entre aplicações de IA e fontes de dados/ferramentas externas. Em vez de cada aplicação de IA implementar suas próprias integrações de forma ad-hoc, o MCP define um contrato: um **MCP Server** expõe capacidades (tools, resources, prompts), e um **MCP Client** (Claude Desktop, Claude Code, ou sua aplicação) descobre e usa essas capacidades.

**Por que importa:** sem MCP, você reimplementa a mesma integração com Postgres, GitHub, Slack, etc. em cada projeto. Com MCP, você escreve o servidor uma vez e qualquer cliente MCP pode usar. É a mesma motivação do LSP (Language Server Protocol) — padronizar a interface entre editores e servidores de linguagem.

**Três primitivos do MCP:**
- **Tools:** funções que o modelo pode chamar (equivalente ao function calling)
- **Resources:** dados que o modelo pode ler (arquivos, banco de dados, APIs) — o modelo solicita e o client inclui no contexto
- **Prompts:** templates de prompt reutilizáveis que o servidor expõe

**MCP vs raw tool use:** para uso dentro de uma aplicação única, tool use direto é mais simples. MCP faz sentido quando você quer que as mesmas ferramentas estejam disponíveis em múltiplos clients (Claude Desktop + seu app + Claude Code) ou quando você quer compartilhar integrações com a equipe.

**Claude Code** tem suporte nativo a MCP — você adiciona um servidor MCP ao `.claude/settings.json` e as ferramentas ficam disponíveis nas suas sessões. Isso é poderoso para criar ferramentas específicas do seu projeto que aparecem automaticamente no Claude Code.

## Quando usar

- Quando você quer que as mesmas ferramentas fiquem disponíveis em Claude Desktop + Claude Code + sua aplicação
- Para integrações que a equipe inteira vai usar (servidor compartilhado com ferramentas internas)
- Para expor dados do seu app para Claude Code sem criar scripts separados
- Quando você quer desacoplar a lógica de integração da lógica da aplicação

## Quando NÃO usar

- Para integrações específicas de uma única aplicação — tool use direto é mais simples
- Quando você precisa de controle fino sobre o processo de tool selection
- Para prototipação rápida — a infraestrutura do MCP tem overhead de setup

## Como pedir pra IA

> "Cria um servidor MCP em TypeScript para [DOMÍNIO] usando o SDK @modelcontextprotocol/sdk. Preciso de: (1) 3-4 tools relevantes com schemas Zod e error handling, (2) 1-2 resources que expõem dados como URI (ex: banco de dados, arquivos de config), (3) configuração para usar via stdio (para Claude Code) e via HTTP (para aplicação web), (4) instrução de como adicionar ao .claude/settings.json. Domínio: [DESCREVA O SISTEMA — ex: sistema de ERP com clientes, pedidos, estoque]."

## Como auditar o que a IA gerou

- [ ] Verificar se tools têm validation de input com Zod (não apenas tipos TypeScript)
- [ ] Confirmar que erros são retornados como `isError: true` com mensagem útil (não exceção não tratada)
- [ ] Verificar se o servidor suporta o transport correto para o caso de uso (stdio para local, HTTP para remote)
- [ ] Checar se resources têm URIs estáveis e bem definidos (não mudam entre runs)
- [ ] Confirmar que o servidor tem graceful shutdown (lida com SIGINT/SIGTERM)
- [ ] Verificar se há autenticação para servidores HTTP (MCP via HTTP sem auth é inseguro)

## Armadilhas comuns

- **Tool descriptions genéricas** — mesma regra que function calling: a description é o principal fator de qualidade de uso
- **MCP via HTTP sem autenticação** — qualquer um na rede pode usar suas ferramentas
- **Resources mutáveis sem versionamento** — se um resource muda, o modelo não sabe automaticamente. Use ETags ou timestamps
- **Confundir tools e resources** — tools são ações (escrever, calcular, buscar), resources são dados para leitura

## Exemplo prático

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "brain-erp-tools",
  version: "1.0.0",
});

// Tool: ação com efeito externo
server.tool(
  "buscar_cliente",
  "Busca dados de um cliente no ERP por ID ou CNPJ. Use quando precisar de informações cadastrais, saldo devedor ou histórico de um cliente específico.",
  {
    identificador: z.string().describe("ID interno (UUID) ou CNPJ (apenas dígitos)"),
    incluir_financeiro: z.boolean().optional().describe("Se true, inclui saldo e últimas faturas. Default: false"),
  },
  async ({ identificador, incluir_financeiro = false }) => {
    try {
      // Conectar ao banco real aqui
      const cliente = await buscarClienteNoBanco(identificador);
      if (!cliente) {
        return {
          content: [{ type: "text", text: `Cliente não encontrado: ${identificador}` }],
          isError: true,
        };
      }
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            id: cliente.id,
            razao_social: cliente.razao_social,
            cnpj: cliente.cnpj,
            ...(incluir_financeiro && { saldo_devedor: cliente.saldo_devedor }),
          }),
        }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Erro ao buscar cliente: ${err}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "criar_pedido",
  "Cria um novo pedido de venda no ERP. Requer cliente existente e pelo menos um item. NÃO use para consultar pedidos existentes.",
  {
    cliente_id: z.string().uuid().describe("UUID do cliente (obrigatório, deve existir no sistema)"),
    itens: z.array(z.object({
      sku: z.string(),
      quantidade: z.number().positive(),
    })).min(1),
    observacao: z.string().optional(),
  },
  async ({ cliente_id, itens, observacao }) => {
    // Implementação real aqui
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ pedido_id: "PED-001", status: "criado" }),
      }],
    };
  }
);

// Resource: dados para leitura
server.resource(
  "config://erp/tabela-precos",
  "Tabela de preços atual dos produtos",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify({ PROD-001: 199.90, "PROD-002": 349.90 }),
    }],
  })
);

// Resource template: URI dinâmico
server.resource(
  new ResourceTemplate("pedido://{pedido_id}", { list: undefined }),
  "Dados completos de um pedido específico",
  async (uri, { pedido_id }) => ({
    contents: [{
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify({ id: pedido_id, status: "entregue" }),
    }],
  })
);

// Iniciar servidor (stdio para Claude Code)
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Configuração no Claude Code** (`.claude/settings.json`):
```json
{
  "mcpServers": {
    "brain-erp": {
      "command": "npx",
      "args": ["tsx", "/caminho/para/mcp-server.ts"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

Depois de configurar, as tools do servidor aparecem automaticamente no Claude Code como `/mcp brain-erp buscar_cliente`.

**Função simulada para completar o exemplo:**
```typescript
async function buscarClienteNoBanco(id: string) {
  // Substituir com query real ao banco
  return { id, razao_social: "Empresa Exemplo LTDA", cnpj: "12345678000190", saldo_devedor: 1500 };
}
```
