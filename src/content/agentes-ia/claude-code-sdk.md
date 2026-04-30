---
title: "Claude Code SDK — Construindo Agentes CLI"
category: agentes-ia
stack: [TypeScript, Claude Code, MCP]
tags: [claude-code, sdk, agents, cli, hooks, mcp]
excerpt: "Claude Code é uma plataforma de agentes, não apenas um CLI — o SDK permite construir agentes especializados para automação de engenharia."
related: [mcp-protocol, tool-use-function-calling, agent-deployment]
updated: 2026-04
---

## O que é

Claude Code é construído sobre uma plataforma de agentes que é extensível via SDK. Além de usar Claude Code interativamente, você pode programaticamente orquestrar sessões do Claude Code como subagentes, injetar contexto, e interceptar ações via hooks.

**O SDK do Claude Code** (`@anthropic-ai/claude-code`) permite: iniciar sessões programaticamente, passar contexto inicial, processar tool calls (incluindo implementar tools customizadas), e receber o output da sessão. Isso transforma Claude Code em um componente que você pode orquestrar em pipelines maiores.

**Hooks** são scripts que rodam em pontos específicos do ciclo de vida de Claude Code:
- `PreToolUse`: antes de executar uma tool (pode bloquear)
- `PostToolUse`: após executar uma tool (pode transformar o resultado)
- `Stop`: quando a sessão termina
- `Notification`: quando Claude tem algo para notificar

Hooks são configurados em `.claude/settings.json` e rodam como processos externos (script shell, Python, Node.js). Eles recebem o estado atual via stdin como JSON e podem modificar o comportamento via stdout.

**Patterns úteis com Claude Code SDK:**
- **Code reviewer:** roda automaticamente em cada PR, analisa changes e comenta
- **Test writer:** dado um diff, gera testes para o código novo
- **Migration assistant:** dado um padrão antigo e novo, migra todo o codebase
- **Documentation generator:** gera/atualiza docstrings e README baseado no código
- **Worktree isolation:** cria git worktrees isoladas para cada tarefa do agente (sem conflitos entre tarefas paralelas)

**Multi-turn conversations no SDK:** cada `query()` adiciona ao histórico da sessão. Você pode ter conversas de múltiplos turnos com contexto acumulado — útil para tarefas que precisam de iteração (escreve código → roda testes → corrige falhas → roda novamente).

## Quando usar

- Automação de tarefas de engenharia repetitivas (code review, geração de testes, migração de padrões)
- Quando você quer as capacidades de Claude Code (leitura de arquivos, escrita, execução de comandos) em um pipeline automatizado
- Para construir ferramentas internas que combinam Claude Code com lógica de negócio específica
- Quando você quer criar agentes especializados que seus colegas podem usar sem saber de LLMs

## Quando NÃO usar

- Para tasks simples de geração de texto sem necessidade de acesso ao filesystem
- Quando você precisa de controle fino sobre cada token gerado (use SDK da Anthropic direto)
- Para substituir testes unitários — agentes de código são não-determinísticos por natureza

## Como pedir pra IA

> "Cria um script TypeScript usando o Claude Code SDK que automatiza [TAREFA DE ENGENHARIA — ex: code review de PRs, geração de testes, migração de padrão]. O script deve: (1) usar worktrees git isolados para não interferir no working tree atual, (2) passar contexto específico do projeto no início da sessão, (3) processar o output e retornar apenas as mudanças necessárias (não texto explicativo), (4) ter timeout de segurança, (5) logar o custo de tokens. Inclui exemplo de como rodar via CLI."

## Como auditar o que a IA gerou

- [ ] Verificar se worktrees são criados e deletados corretamente (sem worktrees órfãos)
- [ ] Confirmar que o script tem timeout (sessões de Claude Code podem durar muito)
- [ ] Verificar se o output do SDK é processado corretamente (é um stream de eventos, não texto direto)
- [ ] Checar se há tratamento para quando Claude Code pede permissão interativamente (scripts não-interativos precisam de `--yes` ou configuração de permissões)
- [ ] Confirmar que o script não commita automaticamente sem revisão humana
- [ ] Verificar se hooks têm `set -e` e tratamento de erro (um hook que falha silenciosamente é perigoso)

## Armadilhas comuns

- **Sessões sem timeout** — Claude Code pode ficar executando indefinidamente em loops. Sempre defina um timeout máximo
- **Working directory errado** — Claude Code opera no cwd do processo. Sempre defina explicitamente o diretório do projeto
- **Hooks que falham silenciosamente** — se um hook `PreToolUse` retorna código não-zero sem output claro, Claude Code se comporta de forma imprevisível
- **Permissões muito liberais** — `"allow": ["Bash(*)"]` permite qualquer comando. Seja específico nas permissões

## Exemplo prático

```typescript
// code-reviewer.ts — Code reviewer automático usando Claude Code SDK
import { query, type Message } from "@anthropic-ai/claude-code";
import { execSync } from "child_process";
import { mkdirSync, rmSync } from "fs";
import { join } from "path";

interface ReviewResult {
  issues: string[];
  suggestions: string[];
  approved: boolean;
}

async function reviewPR(
  repoPath: string,
  baseBranch: string,
  featureBranch: string
): Promise<ReviewResult> {
  // Criar worktree isolado para não interferir no working tree
  const worktreePath = `/tmp/claude-review-${Date.now()}`;
  
  try {
    // Criar worktree limpo no branch da feature
    execSync(
      `git worktree add ${worktreePath} ${featureBranch}`,
      { cwd: repoPath }
    );
    
    // Obter o diff
    const diff = execSync(
      `git diff ${baseBranch}...${featureBranch} --stat`,
      { cwd: repoPath, encoding: "utf-8" }
    );
    
    const diffCompleto = execSync(
      `git diff ${baseBranch}...${featureBranch}`,
      { cwd: repoPath, encoding: "utf-8" }
    );
    
    // Contexto inicial para o agente
    const prompt = `Você é um code reviewer sênior especializado em TypeScript e Node.js.
    
Revise o seguinte Pull Request e identifique:
1. Bugs reais (não potenciais, apenas confirmados)
2. Violações de segurança
3. Performance issues significativos
4. Problemas de manutenibilidade críticos

NÃO comente sobre style issues ou preferências pessoais.

ARQUIVOS MODIFICADOS:
${diff}

DIFF COMPLETO:
${diffCompleto.slice(0, 50000)} ${diffCompleto.length > 50000 ? "... [truncado]" : ""}

Responda em JSON com este schema exato:
{
  "issues": ["lista de problemas encontrados"],
  "suggestions": ["sugestões de melhoria não-críticas"],
  "approved": true/false
}`;

    let fullResponse = "";
    const messages: Message[] = [];
    
    // Timeout de 5 minutos
    const timeout = 5 * 60 * 1000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Review timeout")), timeout)
    );
    
    const reviewPromise = (async () => {
      for await (const sdkMessage of query({
        prompt,
        options: {
          cwd: worktreePath,
          maxTurns: 3, // Limita iterações
        },
        messages,
      })) {
        if (sdkMessage.type === "assistant") {
          for (const block of sdkMessage.message.content) {
            if (block.type === "text") {
              fullResponse += block.text;
            }
          }
        }
      }
    })();
    
    await Promise.race([reviewPromise, timeoutPromise]);
    
    // Parse do JSON de resultado
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Output não contém JSON válido");
    }
    
    return JSON.parse(jsonMatch[0]) as ReviewResult;
    
  } finally {
    // Sempre limpa o worktree, mesmo em caso de erro
    try {
      execSync(`git worktree remove ${worktreePath} --force`, { cwd: repoPath });
    } catch {
      rmSync(worktreePath, { recursive: true, force: true });
    }
  }
}

// Uso
const resultado = await reviewPR(
  "/Users/igor/projects/saas-erp",
  "main",
  "feature/novo-modulo-fiscal"
);

console.log(`Aprovado: ${resultado.approved}`);
console.log(`Issues: ${resultado.issues.length}`);
resultado.issues.forEach(issue => console.log(`- ${issue}`));
```

**Hook de PreToolUse (`.claude/hooks/pre-tool-use.py`):**
```python
#!/usr/bin/env python3
"""Hook que bloqueia comandos destrutivos sem confirmação."""
import json
import sys

# Lê o evento do stdin
event = json.load(sys.stdin)

if event.get("tool_name") == "Bash":
    command = event.get("tool_input", {}).get("command", "")
    
    # Bloqueia comandos destrutivos em branches principais
    comandos_bloqueados = ["git push --force", "DROP TABLE", "rm -rf /"]
    
    for bloqueado in comandos_bloqueados:
        if bloqueado in command:
            print(json.dumps({
                "decision": "block",
                "reason": f"Comando contém padrão bloqueado: '{bloqueado}'. Use HITL para confirmar."
            }))
            sys.exit(0)

# Permite por padrão
print(json.dumps({"decision": "allow"}))
```

**Configuração em `.claude/settings.json`:**
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "python3 .claude/hooks/pre-tool-use.py"
      }]
    }]
  },
  "permissions": {
    "allow": [
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git status*)",
      "Read(**)",
      "Write(src/**)"
    ],
    "deny": [
      "Bash(git push --force*)",
      "Bash(rm -rf*)"
    ]
  }
}
```
