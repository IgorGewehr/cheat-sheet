---
description: Analisa o plano atual (riscos / pre-mortem / alternativa) — útil enquanto outro agente está executando.
allowed-tools: Bash(brain:*), Bash(cat:*)
---

Você vai analisar criticamente o último plano gerado.

Passos:
1. Encontre o plano mais recente do diretório de planos. Tente, em ordem:
   - `.claude/plans/*.md` mais recente
   - `$ARGUMENTS` se foi passado um caminho
2. Rode `brain idle < <caminho>`. Se não tiver plano em arquivo, peça ao usuário pra colar.
3. Mostre o output literal: 3 riscos, 2 perguntas pre-mortem, 1 alternativa.
4. Pergunte se o usuário quer ajustar o plano antes de continuar.
