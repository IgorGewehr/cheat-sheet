---
title: "Checklist: auditar endpoint gerado por IA"
category: checklists
stack: [NestJS]
tags: [auditoria, api, segurança]
excerpt: "30 itens pra rodar antes de aceitar PR de endpoint feito com IA. Cobre auth, validação, performance, observabilidade, segurança."
related: [audit-migration, audit-auth, dto-validation, n-plus-1]
updated: 2026-04
---

## 0. Antes de tudo

- [ ] Você LEU o código? Não rode lint sem ler.
- [ ] Você entende o que esse endpoint faz, quem usa, e qual o impacto?

## 1. Validação de entrada

- [ ] Schema zod (ou class-validator) cobre **todos** os campos.
- [ ] Tipos numéricos limitados (min/max) onde faz sentido (não aceita -1 em quantidade).
- [ ] Strings têm `max` length (anti-DoS).
- [ ] Enums fechados (não aceita string aleatória).
- [ ] Datas validadas como ISO + timezone-aware.
- [ ] Erros de validação retornam 400 com lista de issues por campo, não 500.

## 2. Autenticação e autorização

- [ ] Guard de auth aplicado (não esquecido).
- [ ] Permissão específica checada (`@RequirePermission(...)` ou equivalente).
- [ ] Filtros de tenant/filial aplicados (não dá pra ver dado de outro tenant nem que tente).
- [ ] Permissão de ABAC quando depende do recurso (ex: editar pedido só se filial bate).
- [ ] Request anônimo retorna 401 explicitamente.
- [ ] Request sem permissão retorna 403, não 404.

## 3. Lógica de negócio

- [ ] Regras de domínio estão em entidade/use case, não no controller.
- [ ] Erros de domínio (`PedidoFechadoError`) viram HTTP corretos via filter.
- [ ] Não há `if (user.email === '...')` ou bypass disfarçado.
- [ ] Idempotência onde precisa (POST com side effect financeiro / externo).

## 4. Persistência

- [ ] Sem N+1 (`for ... await db.find...`).
- [ ] Transação `db.transaction` em writes que tocam múltiplas tabelas.
- [ ] Queries usam parâmetros (sem SQL string concat com input do user).
- [ ] Soft delete respeitado (não retorna deletados no list).
- [ ] Filtros de tenant aplicados em TODA query relacionada.

## 5. Resposta

- [ ] DTO de saída não vaza campos internos (`password_hash`, tokens, etc).
- [ ] Paginação cursor-based em listas grandes.
- [ ] HTTP status codes corretos (201 em criação, 204 em delete).
- [ ] Erros têm formato consistente.
- [ ] Sem campos `Date` puros — sempre ISO string serializável.

## 6. Performance

- [ ] Endpoint testado sob carga (mesmo que ad-hoc).
- [ ] Plano da query principal foi olhado (`EXPLAIN ANALYZE`).
- [ ] Índices necessários existem (sem seq scan em tabela grande).
- [ ] Cache aplicado se faz sentido + invalidação clara.

## 7. Observabilidade

- [ ] `traceId`/`requestId` chega no log.
- [ ] Métricas RED capturadas (auto via OTel HTTP).
- [ ] Erros vão pro Sentry (com contexto, não só stack).
- [ ] Não loga PII bruto (CPF, e-mail completo, senha).
- [ ] Span manual em operação custosa (cálculo, integração externa).

## 8. Segurança

- [ ] Rate limit (token bucket) em endpoints sensíveis (login, signup, busca).
- [ ] CORS configurado pra origens conhecidas.
- [ ] Headers de segurança (CSP, X-Frame-Options, etc — Nest helmet).
- [ ] Sem segredos hardcoded no código.
- [ ] Upload de arquivo: tamanho limitado, tipo validado, scan se possível.
- [ ] Webhook assinado se aplicável (HMAC).

## 9. Testes

- [ ] Caminho feliz testado.
- [ ] Caminho de erro (401, 403, 400, 404, 409) testado.
- [ ] Borda: input vazio, máximo, valores estranhos.
- [ ] Idempotência testada (chamar 2x não duplica).

## 10. Docs

- [ ] OpenAPI gerado e atualizado.
- [ ] Endpoint adicionado em coleção HTTP (Postman/Insomnia/Bruno).

## Sinal vermelho — pare e revise

- IA gerou função gigante de 200 linhas no controller.
- IA criou tabela nova sem migration.
- IA usou `any` em vários lugares.
- IA copiou padrão de outro módulo cegamente sem entender.
- Você não consegue explicar pra outro dev o que esse endpoint faz.
