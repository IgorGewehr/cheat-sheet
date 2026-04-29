---
title: "Dinheiro em ponto flutuante — a armadilha clássica"
category: banco
stack: [TypeScript, JavaScript]
tags: [money, decimal, float, financeiro, precisao]
excerpt: "0.1 + 0.2 !== 0.3. Em PDV, fiscal, comissão, repartição — basta um parseFloat e o totalizador fecha em R$ 0,01 errado. Custa cliente, custa auditoria, custa sono."
related: [postgres-erp-checklist, soft-delete-audit]
updated: 2026-04
---

## O bug que todo dev encontra (e ignora)

```js
0.1 + 0.2  // 0.30000000000000004
0.7 * 100  // 70.00000000000001
```

JS usa IEEE-754 double. Não tem representação binária exata de 0.1. Em **valores monetários**, isso vira:
- Soma de itens não bate com total visual.
- Split de pagamento (dividir conta) deixa R$ 0,01 sobrando.
- Cálculo de comissão acumulada diverge do extrato fiscal.
- ICMS calculado bate diferente do esperado pela SEFAZ.

## As 3 estratégias

### 1. Inteiros em centavos (mais simples)
Guarde tudo em `number` representando centavos. `R$ 12,34 → 1234`. Todas as operações são inteiras. Formate só na UI.

```ts
const subtotal = items.reduce((sum, i) => sum + i.priceInCents * i.qty, 0);
const total = subtotal + tax;
const display = (total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
```

**Bom para**: PDV, e-commerce simples, ticket único.
**Limite**: divisão (1234 / 3 = 411.33...) volta a ter o problema. Use round().

### 2. `Decimal.js` ou `big.js`
Biblioteca de aritmética arbitrária. Custa um pouco em performance e sintaxe.

```ts
import Decimal from 'decimal.js';
const sum = new Decimal('0.1').plus('0.2');  // exato 0.3
const total = sum.times(qty).toFixed(2);
```

**Bom para**: cálculo fiscal (ICMS com 4 casas), repartição complexa, juros compostos.
**Cuidado**: serialize como string ao gravar/transmitir. JSON.stringify(Decimal) vira coisa estranha.

### 3. Postgres `numeric` / Firestore string
Persistir como `numeric(12,2)` (Postgres) ou string em Firestore. Faz arithmetic no banco quando possível (`SUM(amount)` é exato em `numeric`). No app: ler como string, processar com Decimal.

## Repartição (split)

Conta de R$ 100 dividida por 3 pessoas. R$ 33,33 × 3 = R$ 99,99. Sobra centavo. Decisão de produto:

- **Acumular no último**: A=33,33; B=33,33; C=33,34.
- **Acumular no maior**: pessoa que tem maior consumo paga o resto.
- **Distribuir aleatoriamente**: nunca faça isso, dá ruído em auditoria.

Documente a regra na ADR — auditor vai perguntar.

## Round half to even (banker's rounding)

Para evitar viés sistemático em arredondamento, finanças usam "banker's rounding": .5 vai pro par mais próximo.
- `0.5 → 0`
- `1.5 → 2`
- `2.5 → 2`

`Decimal.ROUND_HALF_EVEN` faz isso. `toFixed()` do JS faz half-away-from-zero — diferente. Pra fiscal, **siga o padrão SEFAZ** (banker's na maioria).

## Anti-patterns reais

- `parseFloat(input.value)` em campo de moeda + `+` direto.
- Calcular `total = subtotal * 1.18` e guardar `total` como `number`.
- Usar `toFixed(2)` no início e perder precisão em operações intermediárias.
- Comparar `if (total === expected)` em valores calculados.

## Checklist

- [ ] Define onde mora a regra: centavos OU Decimal — não mistura.
- [ ] Persiste sem perda (`numeric`, string, ou inteiro).
- [ ] Arredonda **só na borda** (UI ou nota fiscal), não no meio do cálculo.
- [ ] Repartição/split com regra documentada.
- [ ] Teste unitário com 0.1+0.2, divisão por 3, soma de 100 itens de centavos.
- [ ] Sem `===` direto em comparação de calculados — use tolerância ou Decimal.equals.
