---
title: "TDD — Red Green Refactor na Era da IA"
category: testes
stack: [NestJS, Jest, TypeScript]
tags: [tdd, test-driven, jest, ia-era, spec-driven]
excerpt: "Escreva o teste que falha primeiro. Depois peça pra IA implementar. Nunca o contrário."
related: [jest-unit-nestjs, nestjs-integration-testing, use-cases, sdd-openapi-nestjs]
updated: "2026-05"
---

## O ciclo

```
RED   → escreva o teste que descreve o comportamento (falha porque não existe)
GREEN → escreva o mínimo de código pra passar
REFACTOR → limpe sem quebrar o teste
```

Cada iteração dura minutos, não horas.

## Por que isso importa na era da IA

Sem TDD, você pede pra IA "implemente X" e recebe código que parece funcionar. Com TDD:

1. **Você escreve o teste** — especifica o comportamento exato, edge cases, erros esperados.
2. **Você dá o teste pra IA** — "implemente para passar nesses testes".
3. **O teste valida** — a IA não pode inventar comportamento diferente do especificado.

O teste é o spec. Não o contrário.

## Exemplo prático — Use Case no NestJS

```ts
// ❌ ERRADO: pede implementação sem spec
// "Implemente CriarPedidoUseCase"

// ✅ CERTO: escreve o spec primeiro
describe("CriarPedidoUseCase", () => {
  let useCase: CriarPedidoUseCase;
  let pedidoRepo: InMemoryPedidoRepository;
  let produtoRepo: InMemoryProdutoRepository;

  beforeEach(() => {
    pedidoRepo = new InMemoryPedidoRepository();
    produtoRepo = new InMemoryProdutoRepository([
      { id: "p1", nome: "Notebook", preco: 5000, estoque: 10 },
    ]);
    useCase = new CriarPedidoUseCase(pedidoRepo, produtoRepo, new InMemoryEventBus());
  });

  it("cria pedido com itens válidos", async () => {
    const result = await useCase.execute({
      clienteId: "c1",
      itens: [{ produtoId: "p1", quantidade: 2 }],
    });
    expect(result.pedidoId).toBeDefined();
    expect(pedidoRepo.getAll()).toHaveLength(1);
  });

  it("rejeita quantidade zero", async () => {
    await expect(
      useCase.execute({ clienteId: "c1", itens: [{ produtoId: "p1", quantidade: 0 }] }),
    ).rejects.toBeInstanceOf(QuantidadeInvalidaError);
  });

  it("rejeita produto sem estoque suficiente", async () => {
    await expect(
      useCase.execute({ clienteId: "c1", itens: [{ produtoId: "p1", quantidade: 100 }] }),
    ).rejects.toBeInstanceOf(EstoqueInsuficienteError);
  });

  it("publica evento PedidoCriado após criar", async () => {
    const bus = new InMemoryEventBus();
    useCase = new CriarPedidoUseCase(pedidoRepo, produtoRepo, bus);
    await useCase.execute({ clienteId: "c1", itens: [{ produtoId: "p1", quantidade: 1 }] });
    expect(bus.events).toContainEqual(expect.objectContaining({ type: "PedidoCriado" }));
  });
});
```

Agora você tem um spec executável. **Dê esses testes pra IA e peça a implementação.**

## Princípios

**Triangulação**: escreva pelo menos 2-3 casos antes de implementar. Evita "implementação específica pro teste".

**Um comportamento por teste**: o nome do `it()` é documentação. "rejeita quantidade zero" é melhor que "deve validar input".

**In-Memory fakes, não mocks**: fakes são implementações reais em memória — mais confiáveis que `jest.fn()` pra regras de negócio.

**Sem banco em unit test**: use case tests rodam em < 5ms sem Docker, sem DB. Se você precisa subir Nest pra testar um use case, algo está errado na arquitetura.

## Quando NÃO fazer TDD puro

- Exploração inicial de design de API (escreva o spec OpenAPI primeiro, depois os testes)
- UI components com lógica mínima
- Scripts one-shot sem manutenção futura

## Workflow com IA

```
1. Escreva os testes (RED) — você entende o domínio, a IA não
2. git commit "test: spec for CriarPedidoUseCase"
3. Peça: "implemente CriarPedidoUseCase para passar nesses testes: [cola os testes]"
4. Rode: npm test — deve passar (GREEN)
5. Review: olhe a implementação, refatore se necessário
6. git commit "feat: CriarPedidoUseCase"
```

## Auditoria

- [ ] Todo use case tem testes que cobrem: caminho feliz, validação de entrada, erros de domínio, eventos publicados.
- [ ] Testes rodam sem subir NestJS completo, sem Docker, sem network.
- [ ] Fakes (InMemory*) existem para os repositórios principais.
- [ ] Nome do `it()` descreve comportamento, não implementação.
- [ ] Código novo foi escrito **depois** do teste falhar.

## Anti-padrões

- "Escrevo os testes depois de implementar" — os testes serão enviesados pela implementação.
- Mockar tudo com `jest.fn()` sem nenhuma lógica — testa a mock, não o sistema.
- Um `describe` com 40 `it()` todos testando a mesma coisa de ângulos ligeiramente diferentes.
- Test que só verifica que não joujou exception sem verificar o efeito.
