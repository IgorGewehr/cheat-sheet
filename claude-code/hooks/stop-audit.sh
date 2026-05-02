#!/usr/bin/env bash
# Stop hook — executado quando o Claude Code conclui uma tarefa.
# Faz verificações locais e determinísticas (TypeScript e ESLint).
# Se BRAIN_AUDIT=ai estiver ativo, invoca a verificação LLM legada (Sentinela).

set -euo pipefail

PROJ="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJ" 2>/dev/null || exit 0

diff="$(git diff)"
staged="$(git diff --staged)"
if [[ -z "$diff" && -z "$staged" ]]; then
  exit 0
fi

echo "--- Auditoria Local (Stop Hook) ---"

# Verifica erros do TypeScript
echo "Rodando tsc..."
if ! npx tsc --noEmit; then
  echo "{\"decision\":\"block\",\"reason\":\"⚠️ Falha no TypeScript (tsc --noEmit). Corrija os erros de tipagem antes de prosseguir.\"}"
  exit 0
fi

# Verifica erros do ESLint
echo "Rodando eslint..."
if ! npx eslint . --ext .ts,.tsx --max-warnings=0; then
  echo "{\"decision\":\"block\",\"reason\":\"⚠️ Falha no ESLint. Corrija os problemas apontados pelo linter.\"}"
  exit 0
fi

# Contagem de linhas adicionadas sem testes (Regra simplificada: bloqueia se > 100 linhas totais em diff não-test)
# Para uma métrica mais exata seria necessário checar a relação de arquivos afetados.
stats=$(git diff HEAD --shortstat 2>/dev/null || true)
insertions=$(echo "$stats" | awk '{ for (i=1; i<=NF; i++) { if ($i ~ /insertion/) { print $(i-1) } } }')
if [[ -z "$insertions" ]]; then insertions=0; fi

if (( insertions > 100 )); then
  # Checa se algum arquivo de teste foi alterado (com "test" no nome ou em diretório de test)
  has_tests=$(git diff HEAD --name-only | grep -E "test|\.spec\." || true)
  if [[ -z "$has_tests" ]]; then
     echo "{\"decision\":\"block\",\"reason\":\"⚠️ Mais de 100 linhas inseridas sem cobertura aparente de testes. Adicione testes para prosseguir.\"}"
     exit 0
  fi
fi

echo "✅ Validações locais (TypeScript/ESLint) passaram!"

# Se optar pela Sentinela via IA explicitamente
if [[ "${BRAIN_AUDIT:-}" == "ai" ]]; then
  echo "Iniciando Sentinela AI..."
  BRAIN_URL="${BRAIN_URL:-http://localhost:3000}"
  target_diff="${staged:-$diff}"
  target_diff="${target_diff:0:12000}"
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo HEAD)"
  
  payload=$(jq -n --arg t "$branch" --arg d "$target_diff" '{titulo:$t, diff:$d, format:"json"}') || exit 0
  
  resp=$(curl -sS -X POST "${BRAIN_URL}/api/cli/sentinela" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    --max-time 90 2>/dev/null) || true
    
  veredito=$(echo "$resp" | jq -r '.veredito // empty' 2>/dev/null || true)
  text=$(echo "$resp" | jq -r '.text // empty' 2>/dev/null || true)

  if [[ -n "$text" ]]; then
    printf '\n--- Sentinela (AI) ---\n%s\n' "$text"
  fi

  if [[ "$veredito" == "DENY" ]]; then
    echo '{"decision":"block","reason":"Sentinela retornou DENY no diff atual."}'
    exit 0
  fi
fi

# Ao fim de uma auditoria com sucesso (sem block), atualiza o marcador de Edit Budget.
mkdir -p .brain
touch .brain/last-audit

exit 0
