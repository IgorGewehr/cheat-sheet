---
title: "Multi-tenant em Firestore — alternativa ao Postgres pool/bridge/silo"
category: arquiteturas
stack: [Firebase, Firestore]
tags: [multi-tenant, firestore, firebase, erp, saas]
excerpt: "Firestore não tem schemas nem RLS. Tudo é pool. O isolamento mora no campo (tenantId/businessId), nas Security Rules e na disciplina de query. Não é 'mais simples' — é 'simples por fora e perigoso por dentro'."
related: [multi-tenant-strategies, auth-architecture, firestore-cost-optimization]
updated: 2026-04
---

## TL;DR

Firestore só tem o modelo **pool** (shared). O `tenantId`/`businessId` é um campo, e o isolamento depende de duas coisas: **Security Rules** (camada de defesa) e **disciplina de query** (camada de bug). Esquecer o `where('tenantId','==',X)` no servidor é o equivalente de esquecer o `WHERE` no Postgres — só que sem RLS pra te salvar.

## As decisões obrigatórias

1. **Onde mora o `tenantId`?**
   - Cada documento tem um campo (recomendado: `businessId` ou `tenantId`).
   - Alternativa: subcoleções `tenants/{id}/clientes/{id}`. Vantagem: rules mais limpas. Desvantagem: collection group queries ficam estranhas.

2. **Como o cliente prova quem é?**
   - Firebase Auth + **custom claims** (`tenantId`, `role`).
   - Custom claims só atualizam no refresh do ID token — implementar `/api/auth/sync-claims` que dispara `getIdToken(true)` quando o servidor muda os claims.

3. **Como as Rules verificam?**
   ```
   match /clientes/{id} {
     allow read, write: if request.auth.token.tenantId == resource.data.tenantId;
     allow create: if request.auth.token.tenantId == request.resource.data.tenantId;
   }
   ```

4. **E quando o servidor (Admin SDK) escreve?**
   - Admin SDK ignora as Rules. Você é responsável manualmente. Adicione uma camada de service que **sempre** valida `tenantId` antes de qualquer escrita.

## Anti-pattern frequente: query sem filtro

```ts
// ❌ Errado — vaza dados de todos os tenants
const snap = await db.collection('clientes').get();

// ✅ Certo — sempre passa pelo filtro
const snap = await db.collection('clientes')
  .where('tenantId', '==', tenantId)
  .get();
```

Padrão recomendado: encapsule em um repository que recebe `tenantId` no construtor e o injeta automaticamente em toda query. Sem isso, basta um dev novo esquecer **uma vez** pra vazar dados entre clientes.

## Índices compostos

Toda query multi-campo num ambiente multi-tenant precisa de **índice composto começando por tenantId**:
```
(tenantId, createdAt)
(tenantId, status, createdAt)
(tenantId, clientId, status)
```
Senão você paga em latência **e** custo (Firestore cobra por document read).

## Quando NÃO usar Firestore pra ERP multi-tenant

- Precisa de transações ACID cross-coleção complexas → Postgres é melhor.
- Relatórios analíticos pesados (joins, agregações) → BigQuery (export) ou Postgres.
- LGPD com requisito de "delete completo de um tenant" → custo alto (precisa varrer N coleções).
- Testes locais sem internet → emulador funciona, mas é uma camada de complexidade.

## Quando É bom

- Realtime nativo (`onSnapshot`) sem montar pub/sub.
- Auth + Storage + Hosting integrados.
- Pricing previsível em escala média.
- Time pequeno que ganha tempo não cuidando de DBA.

## Checklist para sobreviver

- [ ] Todo documento tem `tenantId`.
- [ ] Toda Rule verifica `request.auth.token.tenantId == resource.data.tenantId`.
- [ ] Toda query no Admin SDK passa por um repository que injeta o filtro.
- [ ] Todo índice composto começa em `tenantId`.
- [ ] Existe um teste que tenta acessar dado de outro tenant e falha.
- [ ] `sync-claims` é chamado quando role/tenant muda.
- [ ] Backup tem export por tenant (export do Firestore filtrado).
