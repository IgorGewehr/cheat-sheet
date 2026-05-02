# brain × Claude Code

Integração do **brain** com o Claude Code (CLI). Te dá:

- `/brain-brief` — gera briefing sênior **antes** da implementação
- `/brain-audit` — passa a IA pelo Sentinela **depois** da implementação
- `/brain-idle` — analisa o plano atual em segundos
- Hooks opcionais: PostToolUse e Stop pra rodar o Sentinela automaticamente

## Setup (5 min)

### 1. Suba o brain localmente

```bash
cd ~/air/brain
pnpm dev
# brain rodando em http://localhost:3000
```

Garanta `OPENAI_API_KEY` em `.env.local`. Pra auditar PRs privados, adicione `GITHUB_TOKEN`.

### 2. Instale a CLI no PATH

```bash
# Symlink em ~/.local/bin (ou outro dir do seu PATH)
mkdir -p ~/.local/bin
ln -sf "$PWD/claude-code/brain.sh" ~/.local/bin/brain
chmod +x claude-code/brain.sh
```

Teste:
```bash
brain audit --staged   # audita git diff --staged
brain brief "endpoint REST de pagamentos com Stripe webhook"
```

Dependências: `curl`, `jq` (`brew install jq`).

### 3. Slash commands no Claude Code

Copie pro seu projeto:

```bash
# Por projeto:
mkdir -p .claude/commands
cp ~/air/brain/claude-code/commands/*.md .claude/commands/

# Ou globalmente em ~/.claude/commands/
cp ~/air/brain/claude-code/commands/*.md ~/.claude/commands/
```

Disponíveis:
- `/brain-brief <task>` — antes de pedir feature
- `/brain-audit` ou `/brain-audit --staged` ou `/brain-audit --pr <url>`
- `/brain-idle` — analisa último plano

### 4. Hooks automáticos (opcional)

Edite `~/.claude/settings.json` (user) ou `.claude/settings.json` (projeto):

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$HOME/air/brain/claude-code/hooks/stop-audit.sh"
          }
        ]
      }
    ]
  }
}
```

Cada vez que o Claude Code termina, o Sentinela audita o diff e anexa o veredito ao transcript. Pra **bloquear** PRs com DENY, descomente o bloco final em `hooks/stop-audit.sh`.

Pra audit-em-cada-edit (ruidoso, vai pro `.claude/sentinela.log`):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$HOME/air/brain/claude-code/hooks/post-edit-audit.sh"
          }
        ]
      }
    ]
  }
}
```

## Fluxo recomendado

1. **Antes**: `/brain-brief "vou implementar X"` — copia o systemPrompt pra IA, marca a tarefa atual no brain.
2. **Durante**: clica IDLE (ícone flutuante no brain) ou `/brain-idle` — revisa riscos enquanto Claude Code edita.
3. **Depois**: `/brain-audit --staged` antes do commit. Se DENY e você tiver projeto ativo no brain, um ADR draft é criado em `/decisoes`.

Tudo aparece em `/analytics → Slop tracking` no brain (taxa PASS/WARN/DENY por linguagem e categoria, tendência 4 semanas).

## Variáveis

- `BRAIN_URL` — onde o brain está rodando (default `http://localhost:3000`)
- `BRAIN_STACK` — stack do projeto, passado pro `brain brief`
- `GITHUB_TOKEN` — pra auditar PRs privados no Sentinela
