---
title: "React Testing Library — Testando Componentes Next.js"
category: testes
stack: [Next.js, React, Jest, TypeScript]
tags: [react-testing-library, rtl, component-testing, nextjs, hooks, msw]
excerpt: "RTL testa comportamento do ponto de vista do usuário, não implementação. getBy vs queryBy vs findBy. O que testar e o que ignorar."
related: [testing-pyramid-nestjs, jest-unit-nestjs, playwright-nextjs, server-actions, server-components]
updated: "2026-05"
---

## Filosofia: testa o que o usuário vê, não como funciona

```ts
// ❌ Testa implementação — quebra em qualquer refactor
expect(component.state.isLoading).toBe(false);
expect(wrapper.find("Button").props().onClick).toBeDefined();

// ✅ Testa comportamento — sobrevive a refactor
expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
```

---

## Setup no Next.js

```bash
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

```ts
// jest.setup.ts
import "@testing-library/jest-dom";

// jest.config.ts
export default {
  setupFilesAfterFramework: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Mock next/navigation para components que usam useRouter, usePathname
    "^next/navigation$": "<rootDir>/__mocks__/next-navigation.ts",
  },
};
```

```ts
// __mocks__/next-navigation.ts
export const useRouter = jest.fn(() => ({
  push: jest.fn(), replace: jest.fn(), back: jest.fn(),
}));
export const usePathname = jest.fn(() => "/");
export const useSearchParams = jest.fn(() => new URLSearchParams());
```

---

## Queries — hierarquia de preferência

```ts
// 1. Por papel semântico (MELHOR — como screen reader enxerga)
screen.getByRole("button", { name: "Confirmar pedido" })
screen.getByRole("textbox", { name: "Email" })
screen.getByRole("heading", { name: /bem.vindo/i })
screen.getByRole("alert")
screen.getByRole("status")

// 2. Por label (formulários)
screen.getByLabelText("Senha")
screen.getByPlaceholderText("Digite seu email")

// 3. Por texto visível
screen.getByText("Pedido criado com sucesso")
screen.getByText(/total:/i)  // regex: case-insensitive

// 4. Por test ID (último recurso)
screen.getByTestId("pedido-row-123")
```

### getBy vs queryBy vs findBy

```ts
// getBy → lança se não encontra (use quando DEVE estar lá)
screen.getByRole("button", { name: "Salvar" });

// queryBy → retorna null se não encontra (use para verificar AUSÊNCIA)
expect(screen.queryByText("Erro")).not.toBeInTheDocument();

// findBy → aguarda aparecer, retorna Promise (use para elementos ASSÍNCRONOS)
const toast = await screen.findByRole("status");
expect(toast).toHaveTextContent("Salvo com sucesso");
```

---

## Testando componente client básico

```ts
// components/pedido-status-badge.test.tsx
import { render, screen } from "@testing-library/react";
import { PedidoStatusBadge } from "./pedido-status-badge";

describe("PedidoStatusBadge", () => {
  it("exibe badge verde para pedido confirmado", () => {
    render(<PedidoStatusBadge status="confirmado" />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveTextContent("Confirmado");
    expect(badge).toHaveClass("bg-green-500");
  });

  it("exibe badge vermelho para pedido cancelado", () => {
    render(<PedidoStatusBadge status="cancelado" />);
    expect(screen.getByRole("status")).toHaveClass("bg-red-500");
  });
});
```

---

## Testando interações com userEvent (melhor que fireEvent)

`userEvent` simula o usuário real — dispara todos os eventos intermediários (mousedown, focus, input, change, click). `fireEvent` dispara só um evento. Use `userEvent` por padrão.

```ts
import userEvent from "@testing-library/user-event";

describe("FormularioPedido", () => {
  it("submete com dados válidos", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<FormularioPedido onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Cliente"), "João Silva");
    await user.selectOptions(screen.getByLabelText("Produto"), "notebook");
    await user.clear(screen.getByLabelText("Quantidade"));
    await user.type(screen.getByLabelText("Quantidade"), "2");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(onSubmit).toHaveBeenCalledWith({
      cliente: "João Silva",
      produto: "notebook",
      quantidade: 2,
    });
  });

  it("exibe erro de validação ao submeter vazio", async () => {
    const user = userEvent.setup();
    render(<FormularioPedido onSubmit={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Cliente é obrigatório");
  });
});
```

---

## Testando componentes com estado assíncrono

```ts
describe("ListaPedidos", () => {
  it("exibe skeleton enquanto carrega", () => {
    render(<ListaPedidos clienteId="c1" />);
    // Imediatamente após render, antes do fetch resolver
    expect(screen.getByRole("status", { name: /carregando/i })).toBeInTheDocument();
  });

  it("exibe pedidos após carregamento", async () => {
    render(<ListaPedidos clienteId="c1" />);

    // Aguarda os pedidos aparecerem (fetch assíncrono)
    const pedidos = await screen.findAllByRole("row");
    expect(pedidos).toHaveLength(3); // 2 pedidos + 1 header

    expect(screen.queryByRole("status", { name: /carregando/i }))
      .not.toBeInTheDocument();
  });

  it("exibe mensagem de erro quando fetch falha", async () => {
    server.use(
      http.get("/api/pedidos", () => HttpResponse.error()),
    );

    render(<ListaPedidos clienteId="c1" />);
    await screen.findByRole("alert");
    expect(screen.getByRole("alert")).toHaveTextContent("Erro ao carregar pedidos");
  });
});
```

---

## MSW — mock de API sem mudar o código do componente

```ts
// test/msw/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/pedidos", () =>
    HttpResponse.json({
      items: [
        { id: "p1", status: "pendente", total: 1500 },
        { id: "p2", status: "confirmado", total: 3200 },
      ],
      total: 2,
    }),
  ),

  http.post("/api/pedidos", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ pedidoId: "p3" }, { status: 201 });
  }),
];

// test/msw/server.ts
import { setupServer } from "msw/node";
export const server = setupServer(...handlers);

// jest.setup.ts
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## Testando Server Actions (Next.js)

Server Actions são funções assíncronas — podem ser testadas diretamente:

```ts
// app/pedidos/actions.ts
"use server";
export async function criarPedido(formData: FormData) {
  const clienteId = formData.get("clienteId") as string;
  if (!clienteId) return { error: "clienteId obrigatório" };
  const pedido = await db.pedidos.insert({ clienteId });
  revalidatePath("/pedidos");
  return { pedidoId: pedido.id };
}

// app/pedidos/actions.test.ts (sem "use server" no teste)
import { criarPedido } from "./actions";
// Mock do db e revalidatePath
jest.mock("@/db", () => ({ pedidos: { insert: jest.fn() } }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

describe("criarPedido action", () => {
  it("retorna erro se clienteId vazio", async () => {
    const formData = new FormData();
    const result = await criarPedido(formData);
    expect(result).toEqual({ error: "clienteId obrigatório" });
  });

  it("insere pedido e retorna id", async () => {
    (db.pedidos.insert as jest.Mock).mockResolvedValue({ id: "p1" });
    const formData = new FormData();
    formData.set("clienteId", "c1");
    const result = await criarPedido(formData);
    expect(result).toEqual({ pedidoId: "p1" });
  });
});
```

---

## Testando hooks customizados

```ts
import { renderHook, act } from "@testing-library/react";

describe("usePedidoForm", () => {
  it("começa com campos vazios", () => {
    const { result } = renderHook(() => usePedidoForm());
    expect(result.current.values).toEqual({ clienteId: "", quantidade: 1 });
  });

  it("atualiza campo ao chamar setField", () => {
    const { result } = renderHook(() => usePedidoForm());
    act(() => {
      result.current.setField("clienteId", "c1");
    });
    expect(result.current.values.clienteId).toBe("c1");
  });
});
```

---

## O que NÃO testar com RTL

- Componentes sem lógica (só HTML/CSS) — teste visual fica com Playwright screenshots
- Componentes Server (RSC) sem estado ou interação — não têm comportamento de usuário
- Implementação de estado interno (não acesse `.state` ou props internas)
- Animações e transições CSS

---

## Como pedir pra IA

> "Crie testes RTL para `FormularioCriarFatura` com campos `clienteId` (select), `valor` (number input), `vencimento` (date input). Testes necessários: 1) submit com dados válidos chama Server Action com os valores corretos, 2) erro de validação aparece se valor <= 0, 3) botão Confirmar fica desabilitado durante submit. Use `userEvent.setup()`, mock da Server Action, `screen.getByRole` para todas as queries."

## Auditoria

- [ ] Queries usam `getByRole` / `getByLabelText` — sem `getByClassName` ou `querySelector`.
- [ ] `findBy` para elementos assíncronos — sem `waitFor(() => expect(...))` aninhado.
- [ ] MSW configurado para mockar API em vez de mockar `fetch` diretamente.
- [ ] `userEvent` em vez de `fireEvent` para interações do usuário.
- [ ] Sem acesso a `component.state` ou props internas nos asserts.

## Anti-padrões

- `screen.getByTestId` pra tudo — indicativo de HTML sem semântica.
- `waitFor(() => expect(x).toBe(y))` com múltiplos asserts — use `findBy` ou um assert por `waitFor`.
- Testar que `useState` mudou de valor — teste o efeito visível para o usuário.
- Mock de módulo inteiro (`jest.mock("react")`) — raramente necessário, sempre problemático.
- `act()` em todo lugar manualmente — `userEvent` já envolve com `act`.
