---
title: "Playwright — E2E Testing para Next.js"
category: testes
stack: [Next.js, Playwright, TypeScript]
tags: [playwright, e2e, nextjs, browser-testing, page-object]
excerpt: "E2E com Playwright cobre o que unit e integration não cobrem: o browser, o DOM, a navegação real."
related: [testing-pyramid-nestjs, nestjs-integration-testing, server-actions, app-router]
updated: "2026-05"
---

## Setup

```bash
npx playwright install --with-deps chromium
```

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

## Page Object Model

Encapsula seletores e ações. Testes ficam legíveis e resilientes a mudança de DOM:

```ts
// e2e/pages/login.page.ts
import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(private page: Page) {
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Senha");
    this.submitButton = page.getByRole("button", { name: "Entrar" });
    this.errorMessage = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

```ts
// e2e/pages/pedidos.page.ts
export class PedidosPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto("/pedidos"); }

  async criarPedido(input: { produto: string; quantidade: number }) {
    await this.page.getByRole("button", { name: "Novo Pedido" }).click();
    await this.page.getByLabel("Produto").selectOption(input.produto);
    await this.page.getByLabel("Quantidade").fill(String(input.quantidade));
    await this.page.getByRole("button", { name: "Confirmar" }).click();
  }

  getPedidoByTexto(texto: string) {
    return this.page.getByRole("row").filter({ hasText: texto });
  }
}
```

## Teste de fluxo completo

```ts
// e2e/fluxo-pedido.spec.ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { PedidosPage } from "./pages/pedidos.page";

test.describe("Fluxo de criação de pedido", () => {
  test("cria pedido e aparece na listagem", async ({ page }) => {
    const login = new LoginPage(page);
    const pedidos = new PedidosPage(page);

    await login.goto();
    await login.login("igor@test.com", "senha123");

    // espera redirect para dashboard
    await expect(page).toHaveURL("/dashboard");

    await pedidos.goto();
    await pedidos.criarPedido({ produto: "Notebook", quantidade: 2 });

    // aguarda toast de sucesso
    await expect(page.getByRole("status")).toContainText("Pedido criado");

    // pedido aparece na listagem
    await expect(pedidos.getPedidoByTexto("Notebook")).toBeVisible();
  });

  test("exibe erro ao tentar quantidade 0", async ({ page }) => {
    await page.goto("/pedidos/novo");
    await page.getByLabel("Quantidade").fill("0");
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByRole("alert")).toContainText("Quantidade inválida");
  });
});
```

## Autenticação em E2E

Autenticar via API (não via UI) pra economizar tempo de teste:

```ts
// e2e/fixtures/auth.ts
import { test as base, Page } from "@playwright/test";

async function loginViaApi(page: Page, role: "admin" | "user" = "user") {
  const res = await page.request.post("/api/auth/login", {
    data: {
      email: role === "admin" ? "admin@test.com" : "user@test.com",
      password: "test-password",
    },
  });
  const { token } = await res.json();
  await page.addInitScript((t) => {
    window.localStorage.setItem("auth_token", t);
  }, token);
}

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await loginViaApi(page);
    await use(page);
  },
});
```

```ts
// uso em testes
import { test, expect } from "../fixtures/auth";

test("admin acessa painel de configurações", async ({ authenticatedPage }) => {
  await authenticatedPage.goto("/admin/settings");
  await expect(authenticatedPage.getByRole("heading", { name: "Configurações" })).toBeVisible();
});
```

## Interceptar chamadas de API (MSW)

Para testes que não devem bater no backend real:

```ts
await page.route("/api/pedidos", async (route) => {
  await route.fulfill({
    json: { pedidos: [{ id: "p1", produto: "Notebook", total: 10000 }] },
  });
});
```

## Seletores — ordem de preferência

1. `getByRole` — semântico, resistente a CSS
2. `getByLabel` — formulários com `<label>`
3. `getByText` — conteúdo visível
4. `getByTestId` — último recurso (`data-testid`)

**Nunca**: seletor CSS por classe (`.btn-primary`) ou por XPath complexo.

## Debug em desenvolvimento

```bash
# abre browser visível com pausa
npx playwright test --headed --debug

# gera script a partir de cliques (útil para bootstrap)
npx playwright codegen http://localhost:3000
```

## Auditoria

- [ ] Fluxos críticos de negócio têm E2E: login, criação do recurso principal, listagem.
- [ ] Page Objects usados para encapsular seletores (sem `.locator(".btn")` nos tests).
- [ ] Autenticação via API (não via formulário) nos testes que não testam auth.
- [ ] CI roda E2E em staging, não em produção.
- [ ] Screenshots e traces salvos como artifacts no CI.

## Anti-padrões

- E2E para lógica que pode ser testada em unit test — lento, frágil.
- `page.waitForTimeout(2000)` como workaround para timing — use `expect(...).toBeVisible()`.
- Testes E2E que dependem de dados específicos de produção.
- Seletor por CSS dinâmico gerado por Tailwind (`.css-[a1b2c3]`).
