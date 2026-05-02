---
description: Gera um briefing sênior (system prompt + padrões + checklist) ANTES de pedir à IA pra implementar uma feature.
allowed-tools: Bash(brain:*)
---

Você vai gerar um briefing sênior do brain antes de começar a codificar.

Tarefa do usuário: $ARGUMENTS

Passos:
1. Rode `brain brief "$ARGUMENTS"`.
2. Mostre o output completo ao usuário.
3. Espere a confirmação do usuário antes de começar a implementação. Use o `systemPrompt` retornado como guia para o seu próprio comportamento na implementação.
4. Ao final da tarefa, sugira que ele rode `/brain-audit --staged` antes de commitar.
