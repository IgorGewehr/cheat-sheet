---
title: "DDD-light pra ERP"
category: arquiteturas
stack: [NestJS]
tags: [ddd, bounded-context, erp]
excerpt: "Pegue só o que importa de DDD — bounded contexts, agregados e linguagem ubíqua. Esqueça repository, factory etc se não fizer sentido."
related: [modular-monolith, clean-architecture, multi-tenant-strategies]
updated: 2026-04
---

## O que pegar de DDD (e o que descartar)

**Pegue:**
- **Bounded Context.** Cada módulo (financeiro, estoque, vendas) é um contexto. `Cliente` no financeiro ≠ `Cliente` no CRM ≠ `Cliente` no fiscal. Não force um modelo único.
- **Linguagem ubíqua.** O nome que o usuário usa = nome no código. Se o time fiscal fala "NF-e", não chame de `Invoice` no banco.
- **Agregado.** Conjunto de entidades que muda junto e é salvo junto. Ex: `Pedido` é agregado, contém `ItemPedido`. Operações no item passam pelo pedido (que valida regras).
- **Eventos de domínio.** Fatos importantes ("PagamentoConfirmado") que outros contextos podem ouvir.

**Descarte (a menos que precise):**
- Hierarquia rígida de pastas (entity/factory/repository/specification…) por dogma.
- Event Sourcing — só se o domínio realmente exige histórico imutável de cada mudança.
- CQRS completo. Use **CQRS-lite** quando read e write divergem demais (relatórios), nunca por padrão.

## Bounded contexts típicos em ERP

- **Auth & Tenancy** — usuários, organização, filial, permissões.
- **Cadastros** — clientes, fornecedores, produtos. Costuma ser CRUD com integrações.
- **Vendas / Pedidos**.
- **Estoque**.
- **Compras**.
- **Financeiro** — contas a pagar/receber, conciliação.
- **Fiscal** — emissão de NF, apuração.
- **RH** — folha, ponto.
- **Relatórios / BI** — read model separado.

Cada um vira módulo (modular monolith) ou serviço (microsserviços), com seu próprio modelo de dados.

## Agregados — exemplo prático

`Pedido` é agregado. Você nunca salva um `ItemPedido` sozinho — você muda o pedido (que valida total, estoque, desconto máximo) e salva o pedido inteiro. Isso evita estados inválidos.

```ts
class Pedido {
  private itens: ItemPedido[] = [];

  adicionarItem(produto: ProdutoRef, qtd: number, precoUnit: Money) {
    if (this.status !== "rascunho") throw new Error("Pedido fechado.");
    if (qtd <= 0) throw new Error("Quantidade inválida.");
    this.itens.push(new ItemPedido(produto, qtd, precoUnit));
    this.recalcularTotal();
  }
}
```

## Quando NÃO usar DDD

- CRUD puro sem regra (formulário → banco → formulário). Não invente agregado pra `ConfiguracaoEmail`.
- Time muito pequeno, prazo apertado, domínio simples.

## Como pedir pra IA

> "Modele o módulo de Vendas em DDD-light. Identifique o agregado raiz, value objects, e quais operações precisam manter invariantes (ex: pedido fechado não aceita item, total bate com soma dos itens). Use linguagem do nosso negócio: 'Pedido', 'Item', 'Desconto'. Sem padrões DDD desnecessários — só o que protege regra."

## Como auditar

- [ ] Operações que envolvem múltiplas entidades passam pelo agregado raiz.
- [ ] Não dá pra criar entidade em estado inválido (construtor valida).
- [ ] Linguagem do código = linguagem do usuário do ERP.
- [ ] Cada bounded context tem sua versão de "Cliente" — nada de model compartilhado entre todos.
