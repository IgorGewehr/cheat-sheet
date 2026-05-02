#!/usr/bin/env bash
# brain — small CLI bridge between Claude Code and the brain webapp.
#
# Usage:
#   brain audit                  # audit `git diff` (working tree)
#   brain audit --staged         # audit `git diff --staged`
#   brain audit --pr <url>       # audit a GitHub PR
#   brain audit --file <path>    # audit a single file (full code, not diff)
#   brain brief "<task desc>"    # generate sênior briefing
#   brain idle                   # paste a plan via stdin → 3 riscos + 2 perguntas + 1 alt
#
# Configure with:
#   export BRAIN_URL=http://localhost:3000   # default
#
# Designed to be called from .claude/commands/*.md or hooks.

set -euo pipefail

BRAIN_URL="${BRAIN_URL:-http://localhost:3000}"

die() { echo "brain: $*" >&2; exit 1; }

require_curl() { command -v curl >/dev/null 2>&1 || die "curl não encontrado"; }
require_jq()   { command -v jq   >/dev/null 2>&1 || die "jq não encontrado (brew install jq)"; }

post_json() {
  local path="$1"; shift
  local body="$1"; shift
  local accept="${1:-text}"
  curl -sS -X POST "${BRAIN_URL}${path}" \
    -H "Content-Type: application/json" \
    -d "$body" \
    --max-time 90 \
    --fail-with-body \
    | { if [[ "$accept" == "text" ]]; then jq -r '.text // .error // .'; else cat; fi; }
}

cmd_audit() {
  local mode="diff"
  local source=""
  local titulo=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --staged)   source="staged"; shift ;;
      --pr)       mode="pr"; source="$2"; shift 2 ;;
      --file)     mode="file"; source="$2"; shift 2 ;;
      --title|-t) titulo="$2"; shift 2 ;;
      *)          die "flag desconhecida: $1" ;;
    esac
  done

  case "$mode" in
    diff)
      local diff
      if [[ "$source" == "staged" ]]; then
        diff="$(git diff --staged)"
      else
        diff="$(git diff)"
      fi
      [[ -n "$diff" ]] || die "Nenhum diff. (Tente --staged)"
      [[ -n "$titulo" ]] || titulo="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'diff local')"
      local body
      body=$(jq -n --arg t "$titulo" --arg d "$diff" '{titulo:$t, diff:$d, format:"text"}')
      post_json /api/cli/sentinela "$body"
      ;;
    pr)
      [[ -n "$source" ]] || die "URL do PR ausente."
      local body
      body=$(jq -n --arg url "$source" '{prUrl:$url, format:"text"}')
      post_json /api/cli/sentinela "$body"
      ;;
    file)
      [[ -f "$source" ]] || die "arquivo não encontrado: $source"
      local code
      code="$(cat "$source")"
      [[ -n "$titulo" ]] || titulo="$(basename "$source")"
      local lang
      case "$source" in
        *.ts|*.tsx) lang="typescript" ;;
        *.js|*.jsx) lang="javascript" ;;
        *.py)       lang="python" ;;
        *.go)       lang="go" ;;
        *.rs)       lang="rust" ;;
        *.sql)      lang="sql" ;;
        *)          lang="outro" ;;
      esac
      local body
      body=$(jq -n \
        --arg t "$titulo" \
        --arg c "$code" \
        --arg l "$lang" \
        '{titulo:$t, codigo:$c, linguagem:$l, modo:"codigo", format:"text"}')
      post_json /api/cli/sentinela "$body"
      ;;
  esac
}

cmd_brief() {
  local task="${1:-}"
  [[ -n "$task" ]] || die "uso: brain brief \"<descrição da tarefa>\""
  local stack="${BRAIN_STACK:-}"
  local body
  body=$(jq -n --arg t "$task" --arg s "$stack" '{task:$t, stack:$s, format:"text"}')
  post_json /api/cli/brief "$body"
}

cmd_idle() {
  local plan
  plan="$(cat)"
  [[ -n "$plan" ]] || die "passe um plano via stdin: brain idle < plan.md"
  local body
  body=$(jq -n --arg p "$plan" '{plano:$p, format:"text"}')
  post_json /api/cli/idle "$body"
}

main() {
  require_curl
  require_jq
  local cmd="${1:-}"
  shift || true
  case "$cmd" in
    audit) cmd_audit "$@" ;;
    brief) cmd_brief "$@" ;;
    idle)  cmd_idle  "$@" ;;
    "")    cat <<EOF
brain — bridge para o webapp.

Comandos:
  brain audit [--staged|--pr <url>|--file <path>] [--title <t>]
  brain brief "<task>"
  brain idle  < plan.md

Variáveis:
  BRAIN_URL    (default: http://localhost:3000)
  BRAIN_STACK  (opcional, passado pra brief)
EOF
      ;;
    *) die "comando desconhecido: $cmd" ;;
  esac
}

main "$@"
