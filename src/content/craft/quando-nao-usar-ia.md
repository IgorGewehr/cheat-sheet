---
title: "Quando NÃO Usar IA Generativa"
category: craft
tags: [ia, julgamento, arquitetura, produtividade]
stack: []
excerpt: Saber quando não delegar pra IA é tão importante quanto saber como usá-la. Há contextos onde IA cria mais problemas do que resolve.
related: [como-auditar-codigo-ia, microservices-quando-usar, modular-monolith]
updated: "2026-04"
---

## O erro do júnior: delegar tudo pra IA

IA generativa amplifica o que você já sabe. Se você não entende o domínio, a IA vai gerar algo plausível, não algo correto. O risco não é IA errar — é você não perceber que errou.

## Quando IA prejudica mais do que ajuda

### 1. Arquitetura inicial do sistema
**Não delegue**: a escolha de arquitetura (monolito vs microsserviços, SQL vs NoSQL, sync vs event-driven) depende de contexto que a IA não tem — tamanho do time, prazo, budget de infra, escala esperada, skillset.

**O que acontece**: IA escolhe o que parece mais "moderno" e "completo". Junior segue. Resultado: microsserviços com time de 2 devs, 3 meses de setup de infra, produto nunca lança.

**Use IA para**: comparar trade-offs de opções que você já entende. Não para escolher por você.

### 2. Modelagem de dados em domínio desconhecido
**Não delegue**: o schema do banco reflete as regras de negócio. IA não conhece as regras específicas do seu negócio — ela usa o que parece razoável no geral.

**O que acontece**: schema gerado não captura invariantes do domínio (ex: "um pedido com itens não pode ser deletado, apenas cancelado"), gerando bugs que aparecem meses depois.

**Use IA para**: implementar migrations, boilerplate de queries, após você ter definido o schema.

### 3. Lógica financeira e de compliance
**Não delegue**: arredondamento, moeda, impostos, juros compostos, regras contábeis. IA usa `parseFloat()` onde deveria usar Decimal, inverte débito/crédito, ignora regras fiscais específicas.

**O que acontece**: em produção, R$0,01 de diferença por transação vira R$10.000 de diferença por mês. Ou pior: balanço contábil não fecha.

**Use IA para**: boilerplate, estrutura de módulo, testes. Nunca para a lógica financeira central.

### 4. Código de segurança crítica
**Não delegue**: implementação de auth (JWT, OAuth, sessions), criptografia, permissões de acesso. IA gera código que parece certo mas tem falhas sutis — JWT sem verificação de expiração, bcrypt com salt fraco, RBAC sem verificação de ownership.

**Use IA para**: revisar código que você escreveu, gerar testes de segurança, explicar conceitos.

### 5. Refactoring de código legado que você não conhece
**Não delegue**: sem entender o comportamento existente, IA vai gerar uma versão "limpa" que quebra edge cases que o código antigo tratava silenciosamente.

**O que acontece**: o refactoring passa nos testes, vai em produção, e quebra em produção com casos que os testes não cobriam.

**Use IA para**: explicar o que o código legado faz, identificar possíveis efeitos colaterais, não para fazer o refactoring em si.

## O modelo mental correto

```
IA é um dev júnior extremamente rápido e prolífico.
Você é o sênior que direciona e revisa.

Dev júnior é ótimo para:
✅ Implementar o que foi especificado
✅ Escrever boilerplate e testes
✅ Explorar opções dentro de um escopo definido

Dev júnior não deveria:
❌ Decidir a arquitetura
❌ Modelar o domínio de negócio
❌ Implementar regras financeiras ou de compliance
❌ Refatorar código crítico sem supervisão
```

## Sinais de que você está delegando demais pra IA

- Você aceita código que não consegue explicar linha por linha
- Você não sabe por que a IA escolheu uma abordagem específica
- Você descobriu bugs em produção que teriam sido óbvios numa revisão cuidadosa
- O sistema ficou mais complexo do que precisava ser

## Como usar IA de forma sênior

1. **Você decide o "o quê" e o "por quê"** — IA implementa o "como"
2. **Você revisa com os 6 domínios** (segurança, performance, falha, observabilidade, config, isolamento)
3. **Você consegue explicar cada linha** para um colega sem usar "a IA gerou assim"
4. **Você tem testes** antes de confiar no output

O sênior não é quem usa IA mais — é quem usa IA melhor.
