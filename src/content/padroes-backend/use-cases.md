---
title: "Use Cases / Application Services"
category: padroes-backend
stack: [NestJS]
tags: [arquitetura, casos-de-uso]
excerpt: "1 caso de uso = 1 classe com método único `execute`. Orquestra repositórios, dispara eventos, retorna resultado serializável."
related: [clean-architecture, repository-pattern, dto-validation]
updated: 2026-04
---

## Por que use case e não service

`PedidoService` com 12 métodos vira "god class". Cada caso de uso novo aumenta complexidade. **Um caso de uso por classe** isola responsabilidade, fica fácil testar, fácil mover.

```ts
@Injectable()
export class CriarPedidoUseCase {
  constructor(
    private readonly pedidos: PedidoRepository,
    private readonly produtos: ProdutoRepository,
    private readonly events: EventBus,
  ) {}

  async execute(input: CriarPedidoInput): Promise<CriarPedidoOutput> {
    // 1. valida input → entidades
    const itens = await this.resolverItens(input.itens);
    // 2. cria agregado (regras dentro do agregado)
    const pedido = Pedido.criar({ clienteId: input.clienteId, itens });
    // 3. persiste
    await this.pedidos.save(pedido);
    // 4. publica eventos
    await this.events.publish(new PedidoCriado(pedido.id, pedido.total));
    // 5. retorna DTO
    return { pedidoId: pedido.id.value };
  }
}
```

## Estrutura

- Input/Output são tipos POJO com campos primitivos.
- `execute` é o único método público.
- Sem decorators de framework HTTP. Use cases não conhecem HTTP.
- Erros: lance domain errors específicos (`PedidoFechadoError`), não `BadRequestException` (isso é do controller).

## Mapping de erro

Filter Nest mapeia domain errors → HTTP:

```ts
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(err: DomainError, host: ArgumentsHost) {
    const map: Record<string, number> = {
      PedidoFechadoError: 409,
      PedidoNaoEncontradoError: 404,
      ProdutoSemEstoqueError: 422,
    };
    const status = map[err.constructor.name] ?? 400;
    host.switchToHttp().getResponse().status(status).json({
      error: err.constructor.name, message: err.message,
    });
  }
}
```

## Composição

Use case pode chamar outros use cases? Tente evitar. Se precisa, é sintoma de que falta um conceito (ex: criar `ProcessarPedidoUseCase` que internamente chama os outros como `Service` no domínio). Ou compor via eventos.

## Testes

Use case com `InMemoryRepository` + fakes pros adapters externos. Testes rodam em ms.

```ts
it("rejeita item com quantidade <= 0", async () => {
  const useCase = new CriarPedidoUseCase(
    new InMemoryPedidoRepository(),
    new InMemoryProdutoRepository([{ id: "p1", nome: "X", preco: 10 }]),
    new InMemoryEventBus(),
  );
  await expect(useCase.execute({
    clienteId: "c1",
    itens: [{ produtoId: "p1", quantidade: 0 }],
  })).rejects.toBeInstanceOf(QuantidadeInvalidaError);
});
```

## Como pedir pra IA

> "Crie `SettleInvoiceUseCase` no módulo financeiro. Input: `{invoiceId, valorPago, dataPagamento}`. Carrega invoice via `InvoiceRepository`, chama `invoice.settle(...)` (regra no domínio: não pode quitar cancelada, valor não pode exceder), salva, publica `InvoiceSettled`. Lance `InvoiceCanceladaError` se tentativa em invoice cancelada. Inclua testes com `InMemoryInvoiceRepository` cobrindo: sucesso, valor excedente, invoice cancelada, invoice inexistente."

## Auditoria

- [ ] Cada use case = 1 classe + 1 `execute`.
- [ ] Sem `@Controller`, `@Injectable` deps de HTTP, decorators de validação no use case.
- [ ] Use case lança domain errors, não HTTP exceptions.
- [ ] Existe filter mapeando domain errors → HTTP corretos.
- [ ] Input/Output são tipos puros (sem classe de DTO com decorators).
- [ ] Testes do use case rodam sem subir Nest, sem Docker.

## Anti-padrões

- Use case que retorna entidade do banco direto.
- "ServiceFacade" com 20 métodos chamando 20 use cases — sintoma de não decidir onde compor.
- Use case acoplado ao framework HTTP (`Request`, `Response` chegando como param).
- Use case sem teste, com lógica complexa.
