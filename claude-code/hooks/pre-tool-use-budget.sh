#!/usr/bin/env bash
# PreToolUse hook — conta linhas adicionadas desde a última auditoria
# Se o diff atual (uncommitted) tiver mais de 150 linhas adicionadas, rejeita a ferramenta.

set -euo pipefail

PROJ="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJ" 2>/dev/null || exit 0

# Apenas bloquear ferramentas de modificação
# Tools comuns do Claude Code: Edit, Write, Replace, Bash (opcionalmente)
# Vamos ser amplos e capturar qualquer coisa que lembre escrita, ou podemos bloquear tudo se o budget estourar
TOOL="${CLAUDE_TOOL_NAME:-}"
if [[ "$TOOL" != "Replace" && "$TOOL" != "Edit" && "$TOOL" != "Write" && "$TOOL" != "FileEdit" && "$TOOL" != "FileWrite" && "$TOOL" != "Bash" && "$TOOL" != "Command" ]]; then
  # Se for uma tool de leitura (View, Glob, Grep, etc), permitimos.
  # Mas se o nome da tool não estiver definido ou for modificadora, seguimos para o bloqueio.
  if [[ -n "$TOOL" && "$TOOL" != *"Write"* && "$TOOL" != *"Edit"* && "$TOOL" != *"Replace"* ]]; then
     exit 0
  fi
fi

# Verifica a quantidade de linhas adicionadas no diff atual
# git diff --shortstat HEAD retorna algo como: " 3 files changed, 153 insertions(+), 12 deletions(-)"
stats=$(git diff HEAD --shortstat 2>/dev/null || true)
if [[ -z "$stats" ]]; then
  exit 0
fi

# Extrai o número de inserções usando regex ou awk
# " 3 files changed, 153 insertions(+), 12 deletions(-)"
insertions=$(echo "$stats" | awk '{
  for (i=1; i<=NF; i++) {
    if ($i ~ /insertion/) {
      print $(i-1)
    }
  }
}')

if [[ -z "$insertions" ]]; then
  insertions=0
fi

# Lê o limite de linhas. Default: 150
LIMIT=${EDIT_BUDGET:-150}

if (( insertions > LIMIT )); then
  # Opcional: checar se .brain/last-audit existe e seu timestamp
  # Mas o simples fato de estarmos com >150 linhas no diff HEAD indica falta de commit/auditoria.
  # Quando a auditoria passa, o usuário ou o bot deveria commitar.
  
  echo "{\"decision\":\"block\",\"reason\":\"⚠️ Edit Budget Excedido! Você tem ${insertions} linhas adicionadas não auditadas (limite: ${LIMIT}). Rode /brain-audit ou /brain-self-audit antes de fazer mais edições.\"}"
  exit 0
fi

# Permite
exit 0
