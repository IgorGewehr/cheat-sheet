---
description: Audita as mudanças atuais com Sentinela (brain). Aceita --staged, --pr <url> ou --file <path>.
allowed-tools: Bash(brain:*), Bash(git diff:*), Bash(git status:*)
---

Você vai auditar código gerado por IA usando o Sentinela do brain.

Argumentos do usuário: $ARGUMENTS

Passos:
1. Se o usuário passou `--pr <url>`, rode `brain audit --pr <url>`.
2. Se passou `--file <path>`, rode `brain audit --file <path>`.
3. Se passou `--staged`, rode `brain audit --staged`.
4. Caso contrário, rode `brain audit` (working tree diff).

Mostre o output literal ao usuário. Se o veredito for `DENY`, **pare** antes de fazer commit/push e liste os achados críticos. Se `WARN`, prossiga apenas após o usuário confirmar.
