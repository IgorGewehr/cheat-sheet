---
title: "IA tende a gerar monolito de arquivo único"
category: armadilhas-ia
stack: []
tags: [armadilha-ia, refatoracao, arquitetura, monolito]
excerpt: "Pede 'um servidor de notificações' e a IA cospe um server.js com 1.300 linhas: rotas, business logic, persistência, agendamento, criptografia, dashboard HTML embutido. Funciona. Manter dói."
related: [como-auditar-codigo-ia, modular-monolith, repository-pattern]
updated: 2026-04
---

## O padrão observado

LLMs aprendem com exemplos curtos: tutoriais, gists, "express in 50 lines". Quando você pede um serviço completo, a IA replica esse padrão **mesmo quando** o resultado tem 1k+ linhas — porque ela otimiza para "código que roda", não para "código manutenível".

Sintomas:
- Um arquivo `server.js`/`main.py`/`app.ts` com tudo dentro: routes, services, db, cron, validation.
- Funções de 80+ linhas misturando IO, validação, business logic e formatação de resposta.
- Estado global em variáveis no topo do arquivo (`const sessions = new Map()`).
- Sem teste — porque a função grande é difícil de testar.

## Por que é problemático

1. **Onboarding lento**: novo dev abre o arquivo, scrolla 600 linhas pra entender uma rota.
2. **Conflito de merge constante**: 3 PRs editam o mesmo arquivo → conflito sempre.
3. **Refatoração trava**: mudar uma estrutura de dados afeta 40 lugares no mesmo arquivo.
4. **Teste vira integração só**: pra testar `sendNotification` precisa subir o servidor inteiro.
5. **Performance opaca**: sem boundaries não dá pra colocar trace/log estruturado por camada.

## Quando aceitar (sim, às vezes ok)

- **Script único de < 200 linhas**: cron job, migration ad-hoc, prototype throwaway.
- **MVP da primeira semana**: ainda não sabe os domínios. Ok ter `server.js` por uma semana, **se** já está agendada a refatoração.
- **Function as a Service simples**: uma cloud function que faz uma coisa.

## Como cortar (refatoração progressiva)

Não tente refatorar tudo de uma vez. Caminho de 4 passos:

### Passo 1 — extrair `routes/`
Cada grupo de rotas vira um arquivo:
```
src/
  server.js               # só monta express + middleware globais
  routes/
    notifications.routes.js
    auth.routes.js
    health.routes.js
```

### Passo 2 — extrair `services/`
Lógica que não é HTTP sai pra services:
```
services/
  notification.service.js  # sendWhatsApp, sendEmail
  scheduler.service.js     # cron schedule/cancel
```

### Passo 3 — extrair `repositories/`
Acesso a Firestore/banco vira repository:
```
repositories/
  session.repo.js          # getSession, saveSession
  appConfig.repo.js
```

### Passo 4 — testar
Agora cada camada é testável isoladamente. Mock o repository, testa o service.

## Como pedir certo pra IA

Anti-prompt comum:
> "Cria um servidor Node de notificações com WhatsApp e email."

Resultado: arquivo único de 800 linhas.

Prompt sênior:
> "Cria a estrutura de um servidor Node de notificações em **camadas**: `routes/` (Express handlers), `services/` (lógica), `repositories/` (acesso a Firestore), `gateways/` (clientes WhatsApp e SMTP). Cada arquivo tem propósito único. Inclui tipos. Não coloque lógica em `routes/`."

A IA segue se você der o esqueleto. Sem esqueleto, ela default-a pro monolito.

## Checklist ao auditar código gerado por IA

- [ ] Nenhum arquivo > 300 linhas.
- [ ] Arquivos têm propósito único (routes não tocam DB direto).
- [ ] Existe pasta `services/` separada de `routes/`.
- [ ] Acesso a banco/API externa está isolado em repository/gateway.
- [ ] Estado global (`Map`, `let counter = 0`) escondido em service ou removido.
- [ ] Existe `__tests__/` paralelo a `services/` testando lógica isolada.
- [ ] Se há cron, está em `jobs/` e não no servidor de HTTP.
