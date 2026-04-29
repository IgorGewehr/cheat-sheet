---
title: "Repository Pattern com Drizzle ou Prisma"
category: padroes-backend
stack: [NestJS, PostgreSQL, Drizzle, Prisma]
tags: [repositório, persistência]
excerpt: "Interface no domínio, implementação na infra. Permite trocar ORM, testar sem DB, e blindar regras contra a tentação de SQL espalhado."
related: [clean-architecture, n-plus-1, drizzle-vs-prisma-2026]
updated: 2026-04
---

## A regra

Domínio define **o que** ele precisa do banco (`InvoiceRepository`, com `findById`, `save`, etc). Infra implementa **como** (DrizzleInvoiceRepository).

```ts
// domain/ports/invoice.repository.ts
export abstract class InvoiceRepository {
  abstract findById(id: InvoiceId): Promise<Invoice | null>;
  abstract listByCliente(clienteId: ClienteId, pag: Pagination): Promise<Invoice[]>;
  abstract save(invoice: Invoice): Promise<void>;
}

// infrastructure/drizzle-invoice.repository.ts
@Injectable()
export class DrizzleInvoiceRepository implements InvoiceRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}
  async findById(id: InvoiceId) {
    const row = await this.db.query.invoices.findFirst({ where: eq(invoices.id, id.value) });
    return row ? toDomain(row) : null;
  }
  ...
}
```

## Mapeamento

`toDomain` / `toRow` convertem entre row do banco e entidade do domínio. Não exponha a entidade do ORM pra fora da infra.

## Repository por agregado, não por entidade

Um repository para `Pedido` (agregado), não um para `Pedido` + outro para `ItemPedido`. Itens são salvos junto com o pedido — o repositório do pedido cuida de tudo.

## Métodos que fazem sentido

- `findById`, `findBy*`, `list*` — leitura.
- `save(agregado)` — upsert do agregado inteiro.
- `delete(id)` — só se aplicável.

❌ Não vá criando `update`, `updateField`, `bumpStatus`. Mude o agregado, salve.

## Quando NÃO usar repositório

- Read models para relatórios. **Não passe relatório pelo repository**. Crie um `ReportQueryService` que faz SQL otimizado direto. Repository é pra escrita e leitura transacional do agregado.
- CRUD super simples sem regra. Aí Drizzle direto no service tá bom — mas seja consistente: ou todo módulo tem repo, ou nenhum.

## Transações

Repositório aceita uma transação opcional, ou existe um `UnitOfWork`/`TransactionContext`:

```ts
await db.transaction(async (tx) => {
  await invoiceRepo.save(invoice, tx);
  await ledgerRepo.save(entry, tx);
});
```

Em Nest, expor isso elegante exige helper. Veja `nestjs-cls` para passar `tx` por contexto sem poluir cada método.

## Como pedir pra IA

> "Crie `PedidoRepository` (interface no domain) e `DrizzlePedidoRepository` (implementação). Pedido é agregado: itens são salvos junto. Implemente `save` que faz upsert do pedido + delete + insert dos itens em uma transação. Inclua mapeamento explícito row ↔ entidade (não exponha o tipo do Drizzle pra fora). Inclua `InMemoryPedidoRepository` pra testes."

## Auditoria

- [ ] Interface vive em `domain/ports`, NÃO em `infrastructure`.
- [ ] Domínio não importa Drizzle/Prisma em lugar nenhum.
- [ ] Métodos do repo trabalham com agregado, não fragmentos.
- [ ] Transações são suportadas (passe tx ou use contexto).
- [ ] Existe `InMemory*Repository` usado em testes do use case.
- [ ] Rows do ORM nunca cruzam pra `application/` ou `domain/`.

## Anti-padrões

- Repository "genérico" (`Repository<T>` com `save`/`find`). Vira abstração vazia.
- Vazar tipo do Prisma/Drizzle pra fora.
- `ItemRepository` separado do `PedidoRepository` quando item é parte do agregado pedido.
- Service que mistura Drizzle + Repository (use um padrão só por módulo).
