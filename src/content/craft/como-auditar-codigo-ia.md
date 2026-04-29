---
title: "Como Auditar Código Gerado por IA como Sênior"
category: craft
tags: [code-review, ia, qualidade, julgamento]
stack: []
excerpt: IA gera código que compila e testa localmente. Sênior sabe o que verificar antes do merge — os 6 domínios que a IA sistematicamente ignora.
related: [audit-api-endpoint, ai-esquece-auth, ai-n-plus-1, ai-sem-paginacao]
updated: "2026-04"
---

## O modelo mental do sênior ao revisar código de IA

IA otimiza para "funcionar no happy path". Sênior otimiza para "sobreviver em produção". São objetivos diferentes.

A checagem não é "o código faz o que eu pedi?" — é "esse código **escala**, **é seguro**, **pode ser debugado** e **vai em produção sem surpresas**?"

## Os 6 domínios que a IA sistematicamente ignora

### 1. Fronteiras de segurança
- Quem pode chamar esse endpoint? (autenticação existe?)
- Quem pode ver esses dados? (autorização verifica ownership?)
- O que entra pelo request é validado? (tipo, tamanho, formato)
- O que sai no response pode vazar informação?

**Teste rápido**: remova seu JWT e chame o endpoint. Deve retornar 401, não dados.

### 2. Performance em escala
- Existe query em loop? (N+1)
- Listas têm limite? (pagination)
- Índices do banco cobrem o WHERE clause da query principal?
- Há cache onde seria óbvio?

**Teste rápido**: mentalmente rode o endpoint com 100k registros. Quanto tempo leva?

### 3. Falha controlada
- O que acontece se a API externa cair?
- O que acontece se o banco está lento?
- O stack trace do erro interno vaza no response?
- Retry está configurado onde faz sentido?

**Teste rápido**: desconecte o banco. O servidor crasha ou retorna 503 graciosamente?

### 4. Observabilidade
- Você consegue debugar um bug de produção com os logs gerados?
- Erros incluem requestId, userId e contexto suficiente?
- A operação pode ser monitorada (latência, taxa de erro)?

**Teste rápido**: simule um erro de produção. Você consegue identificar a causa só pelos logs?

### 5. Configuração e deploy
- Existem URLs, secrets ou timeouts hardcoded?
- O código funciona diferente em dev vs prod por alguma razão não documentada?
- Há seed data ou migration faltando?

**Teste rápido**: clone o projeto numa máquina limpa. O que é necessário para rodar?

### 6. Isolamento de dados (se multi-tenant)
- Toda query inclui filtro de tenant?
- `findUnique(id)` foi substituído por `findFirst(id AND tenantId)`?
- O tenantId vem do token, não do request body?

**Teste rápido**: logue como tenant A e tente acessar um ID que pertence ao tenant B. Deve retornar 404.

## Framework de revisão em 5 minutos

```
1. Leia as interfaces primeiro (assinatura de função, types, DTOs)
   → O contrato faz sentido? Os tipos são específicos (não `any`)?

2. Procure por await em loops
   → É N+1? Mude para eager loading ou batch

3. Verifique a fronteira de autenticação
   → Existe guard/middleware? Verifica ownership?

4. Trace o caminho do dado do request até o banco
   → Foi validado? Foi sanitizado? Chegou ao tipo certo?

5. Imagine o cenário de falha
   → Se a operação falhar no meio, fica em estado inconsistente?
```

## O que falar na review em vez de só aprovar

Em vez de: "LGTM"
Use: "Essa query vai gerar N+1 com relacionamentos. Muda para `include: { items: true }` e eu aprovo."

Em vez de: "código ok"
Use: "Faltou verificar se o pedido pertence ao usuário autenticado. `findUnique({ where: { id } })` permite que qualquer user autenticado veja pedidos de outros."

A review de código é onde o júnior se torna sênior — cada comentário técnico preciso é uma aula.

## Como pedir pra IA fazer a própria revisão

Após gerar código, coloque a IA para revisar seu próprio output:

```
Revise o código acima como um engenheiro sênior paranóico.
Verifique especificamente:
1. Segurança: autenticação, autorização, validação de input
2. Performance: N+1 queries, queries sem paginação, falta de índices óbvios
3. Resiliência: o que acontece se a API externa falhar? E o banco?
4. Multi-tenant: toda query inclui filtro de tenant?
5. Observabilidade: os erros são logados com contexto suficiente?
Aponte problemas específicos com linha e sugestão de correção.
```
