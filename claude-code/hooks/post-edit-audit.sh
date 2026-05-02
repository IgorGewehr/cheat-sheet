#!/usr/bin/env bash
# PostToolUse hook — após cada Edit/Write, chama Sentinela em modo diff (working tree).
# NÃO bloqueia o agente — apenas anota o veredito em .claude/sentinela.log
#
# Configuração no settings.json (user ou project):
#
#   {
#     "hooks": {
#       "PostToolUse": [
#         {
#           "matcher": "Edit|Write",
#           "hooks": [
#             { "type": "command", "command": "$HOME/path/to/brain/claude-code/hooks/post-edit-audit.sh" }
#           ]
#         }
#       ]
#     }
#   }
#
# Variáveis lidas do contexto Claude Code:
#   CLAUDE_PROJECT_DIR (raiz do projeto)
# Variáveis suas:
#   BRAIN_URL          (default http://localhost:3000)

set -euo pipefail

BRAIN_URL="${BRAIN_URL:-http://localhost:3000}"
PROJ="${CLAUDE_PROJECT_DIR:-$(pwd)}"
LOG="$PROJ/.claude/sentinela.log"

mkdir -p "$(dirname "$LOG")"

cd "$PROJ" 2>/dev/null || exit 0

# Se não está em git ou não tem mudanças, encerra silenciosamente
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
diff="$(git diff)"
[[ -n "$diff" ]] || exit 0

# Limita o diff para não estourar payload (primeiros ~8000 chars)
diff="${diff:0:8000}"

# Roda em background e ignora erros — não atrapalhar o fluxo do agente
(
  ts="$(date -u +%FT%TZ)"
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  payload=$(jq -n --arg t "$branch" --arg d "$diff" '{titulo:$t, diff:$d, format:"text"}' 2>/dev/null) || exit 0
  out=$(curl -sS -X POST "${BRAIN_URL}/api/cli/sentinela" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    --max-time 60 2>/dev/null) || out="ERR"
  printf '\n[%s %s]\n%s\n' "$ts" "$branch" "$out" >> "$LOG"
) >/dev/null 2>&1 &

exit 0
