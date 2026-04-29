---
title: "CQRS-lite — separar leitura de escrita sem dor"
category: padroes-backend
stack: [NestJS, PostgreSQL]
tags: [cqrs, performance, relatórios]
excerpt: "Use cases (escrita) usam repositórios e respeitam regras. Read models (leitura) consultam direto, otimizado, sem agregado."
related: [use-cases, repository-pattern, n-plus-1, caching-layers]
updated: 2026-04
---

## A versão "leve" do CQRS

CQRS clássico exige eventos, dois bancos, sincronização. Caro. **CQRS-lite** é só:

- **Write side**: use cases + agregados + repositórios. Mantém invariantes.
- **Read side**: query services que fazem SQL direto otimizado pra cada tela. Sem agregado, sem repositório.

```ts
// write
@Injectable()
export class CriarPedidoUseCase { /* ...usa PedidoRepository, Pedido, etc */ }

// read — separado
@Injectable()
export class PedidoQueryService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}
  async listarParaTabela(filtros: Filtros): Promise<PedidoRow[]> {
    return this.db.execute(sql`
      SELECT p.id, p.numero, c.nome AS cliente, p.total, p.status
      FROM pedidos p JOIN clientes c ON c.id = p.cliente_id
      WHERE p.tenant_id = ${tenant} AND ${this.aplicarFiltros(filtros)}
      ORDER BY p.criado_em DESC LIMIT 50;
    `);
  }
}
```

## Quando usar

- Tela de listagem com filtros, sort, paginação. Tentar reusar `findMany` do repositório vira N+1 ou query gigantesca.
- Relatórios. Sempre.
- Telas de detalhe que mostram dados de vários agregados juntos.

## Quando NÃO precisa

- Caso de uso de escrita simples (`buscar por id pra editar`). Use o repositório do agregado.

## Read model = projection?

Não necessariamente. Pode ser só query mais inteligente no mesmo banco. Se virar gargalo, aí vira **read model materializado** (view, tabela mantida por evento).

## View materializada — quando vale

Tela que precisa de dado agregado caro (soma de vendas por mês × filial × vendedor) e usuário consulta muito:

```sql
CREATE MATERIALIZED VIEW vendas_mensais AS
SELECT tenant_id, branch_id, vendedor_id, date_trunc('month', data) mes, SUM(total) total
FROM pedidos GROUP BY 1,2,3,4;

CREATE UNIQUE INDEX ON vendas_mensais (tenant_id, branch_id, vendedor_id, mes);
REFRESH MATERIALIZED VIEW CONCURRENTLY vendas_mensais;  -- agendado
```

## Como pedir pra IA

> "Separe leitura e escrita do módulo `pedidos`. Mantenha `CriarPedidoUseCase` como está. Crie `PedidoQueryService` com `listarParaTabela(filtros, paginação)`, `detalhe(id)` (com cliente, itens, vendedor em uma query com joins), `dashboard()`. Não use `PedidoRepository` aqui — SQL direto. Inclua paginação cursor-based."

## Auditoria

- [ ] Tela de listagem usa query service, não loop de `findById`.
- [ ] Read service não muda dado.
- [ ] Sem N+1 (uma tela = poucas queries fixas).
- [ ] Paginação cursor pra listas grandes (offset não escala).
- [ ] Materialized view tem refresh agendado se usada.
