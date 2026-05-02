---
title: "WCAG 2.1 AA/AAA na prática para portais GovTech Next.js"
category: "govtech"
stack: ["Next.js", "React", "TypeScript", "jest-axe", "React Aria", "Radix UI"]
tags: ["acessibilidade", "wcag", "emag", "lbi", "govbr", "a11y", "aria"]
excerpt: "WCAG 2.1 AA é obrigação legal para portais públicos brasileiros (LBI 13.146/2015 + eMAG). Este card cobre os critérios críticos, componentes acessíveis com React Aria/Radix UI e testes automatizados com jest-axe."
---

## Visão Geral

Acessibilidade em portais governamentais não é diferencial — é **obrigação legal**. A Lei Brasileira de Inclusão (LBI 13.146/2015) e o eMAG (Modelo de Acessibilidade em Governo Eletrônico) definem que todos os sistemas públicos devem atender **WCAG 2.1 nível AA no mínimo**. Falhas de acessibilidade expõem o órgão a ações do Ministério Público e auditoria da CGU.

Os 4 princípios POUR da WCAG:

| Princípio | O que significa | Critério crítico para gov |
|-----------|----------------|--------------------------|
| **Perceivable** | Conteúdo perceptível por qualquer sentido | Contraste 4.5:1 (AA) / 7:1 (AAA), alt text, captions |
| **Operable** | Interface operável sem mouse | Navegação por teclado, skip links, sem timeout sem aviso |
| **Understandable** | Conteúdo compreensível | Labels associados, mensagens de erro descritivas, idioma declarado |
| **Robust** | Compatível com tecnologias assistivas | ARIA roles corretos, HTML semântico válido |

## Contexto B2G

Portais públicos são acessados por pessoas com deficiências visuais, motoras e cognitivas — e pelos próprios servidores públicos usando leitores de tela no trabalho. O eMAG (versão 3.1, publicada pelo governo federal) é uma especialização do WCAG para o contexto brasileiro e referência obrigatória para sistemas `gov.br`.

Implicações práticas:
- PDFs precisam de tags de acessibilidade (PDF/UA)
- CAPTCHAs visuais sem alternativa de áudio são ilegais
- Formulários de CPF/CNPJ precisam de labels explícitos e mensagens de erro acessíveis
- Timeout de sessão deve avisar o usuário com antecedência (pelo menos 20 segundos)
- A página `<html>` deve ter `lang="pt-BR"`

## Quando usar

- Qualquer portal público: IPTU, alvarás, consulta de débitos, portal da transparência
- Sistemas usados por servidores (RH, finanças) — mesmo sem acesso público
- Antes de entrar em produção: auditoria com axe-core no CI é obrigatória
- Sempre que um componente interativo for criado (dropdown, modal, tab, accordion)

## Trade-offs

| Abordagem | Vantagem | Desvantagem |
|-----------|----------|-------------|
| Radix UI / React Aria | WAI-ARIA embutido, testado, keyboard navigation automático | Bundle maior, curva de aprendizado |
| Componentes custom | Controle total | Você re-implementa ARIA — e provavelmente erra |
| HTML semântico puro | Leve, nativo | Sem interações ricas (drag, autocomplete complexo) |

**Recomendação para GovTech**: use Radix UI (headless) para componentes interativos e HTML semântico para o resto. Não re-invente WAI-ARIA.

## Implementação

### Skip link (obrigatório por eMAG)

```tsx
// src/components/a11y/SkipLink.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-700 focus:text-white focus:rounded"
    >
      Pular para o conteúdo principal
    </a>
  );
}
```

```tsx
// src/app/layout.tsx
import { SkipLink } from "@/components/a11y/SkipLink";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <SkipLink />
        <header role="banner">...</header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
```

### Formulário de IPTU totalmente acessível

```tsx
// src/components/forms/IPTUForm.tsx
"use client";

import { useId, useState } from "react";
import { useFormState } from "react-dom";
import { consultarIPTU } from "@/app/actions/iptu";

type FormState = {
  error?: string;
  success?: boolean;
  data?: { inscricaoImobiliaria: string; valorTotal: number };
};

const initialState: FormState = {};

export function IPTUForm() {
  const inscricaoId = useId();
  const inscricaoErrorId = useId();
  const cpfId = useId();
  const cpfErrorId = useId();
  const statusId = useId();

  const [state, formAction] = useFormState(consultarIPTU, initialState);

  return (
    <form
      action={formAction}
      noValidate
      aria-label="Consulta de IPTU"
    >
      {/* aria-live para anunciar resultado ao leitor de tela */}
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {state.success && "Consulta realizada com sucesso."}
        {state.error && `Erro: ${state.error}`}
      </div>

      <fieldset>
        <legend className="text-lg font-semibold text-gray-900">
          Dados do Imóvel
        </legend>

        {/* Campo: Inscrição Imobiliária */}
        <div className="mt-4">
          <label
            htmlFor={inscricaoId}
            className="block text-sm font-medium text-gray-700"
          >
            Inscrição Imobiliária
            <span aria-hidden="true" className="text-red-600 ml-1">*</span>
            <span className="sr-only">(obrigatório)</span>
          </label>
          <input
            id={inscricaoId}
            name="inscricaoImobiliaria"
            type="text"
            required
            autoComplete="off"
            inputMode="numeric"
            pattern="[0-9]{14}"
            maxLength={14}
            aria-required="true"
            aria-describedby={`${inscricaoErrorId} inscricao-hint`}
            aria-invalid={state.error ? "true" : undefined}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p id="inscricao-hint" className="mt-1 text-sm text-gray-500">
            14 dígitos sem pontos ou traços
          </p>
          {state.error && (
            <p
              id={inscricaoErrorId}
              role="alert"
              aria-live="assertive"
              className="mt-1 text-sm text-red-600"
            >
              {state.error}
            </p>
          )}
        </div>

        {/* Campo: CPF do proprietário */}
        <div className="mt-4">
          <label
            htmlFor={cpfId}
            className="block text-sm font-medium text-gray-700"
          >
            CPF do Proprietário
            <span aria-hidden="true" className="text-red-600 ml-1">*</span>
            <span className="sr-only">(obrigatório)</span>
          </label>
          <input
            id={cpfId}
            name="cpf"
            type="text"
            required
            autoComplete="off"
            inputMode="numeric"
            aria-required="true"
            aria-describedby={cpfErrorId}
            aria-invalid={state.error ? "true" : undefined}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {state.error && (
            <p id={cpfErrorId} role="alert" className="mt-1 text-sm text-red-600">
              {state.error}
            </p>
          )}
        </div>
      </fieldset>

      <button
        type="submit"
        className="mt-6 w-full rounded-md bg-blue-700 px-4 py-3 text-white font-medium hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Consultar IPTU
      </button>

      {/* Resultado acessível */}
      {state.success && state.data && (
        <section
          aria-labelledby="resultado-heading"
          className="mt-6 rounded-md border border-green-300 bg-green-50 p-4"
        >
          <h2 id="resultado-heading" className="text-base font-semibold text-green-800">
            Resultado da Consulta
          </h2>
          <dl className="mt-2 space-y-1">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Inscrição:</dt>
              <dd className="text-sm font-medium">{state.data.inscricaoImobiliaria}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Valor Total:</dt>
              <dd className="text-sm font-medium">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(state.data.valorTotal)}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </form>
  );
}
```

### Modal acessível com Radix UI Dialog

```tsx
// src/components/ui/AccessibleModal.tsx
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface AccessibleModalProps {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AccessibleModal({
  trigger,
  title,
  description,
  children,
}: AccessibleModalProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        {/* Overlay com aria-hidden para leitores de tela não lerem o fundo */}
        <Dialog.Overlay
          aria-hidden="true"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl w-full max-w-md focus:outline-none"
          // Radix gerencia: focus trap, aria-modal, aria-labelledby, aria-describedby, Escape key
        >
          <Dialog.Title className="text-lg font-semibold text-gray-900">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="mt-2 text-sm text-gray-500">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-4">{children}</div>
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Fechar modal"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Teste com jest-axe

```tsx
// src/components/forms/__tests__/IPTUForm.test.tsx
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { IPTUForm } from "../IPTUForm";

expect.extend(toHaveNoViolations);

// Mock do useFormState do react-dom
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  useFormState: jest.fn(() => [{ error: undefined, success: false }, jest.fn()]),
}));

describe("IPTUForm - Acessibilidade", () => {
  it("não deve ter violações de acessibilidade (axe)", async () => {
    const { container } = render(<IPTUForm />);
    const results = await axe(container, {
      rules: {
        // WCAG 2.1 AA completo
        "color-contrast": { enabled: true },
        label: { enabled: true },
        "aria-required-attr": { enabled: true },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it("deve ter labels associados a todos os inputs", async () => {
    const { container } = render(<IPTUForm />);
    const results = await axe(container);
    const labelViolations = results.violations.filter(
      (v) => v.id === "label" || v.id === "label-content-name-mismatch"
    );
    expect(labelViolations).toHaveLength(0);
  });
});
```

```bash
# Instalação
npm install --save-dev jest-axe @testing-library/react @testing-library/jest-dom
npm install @radix-ui/react-dialog react-aria-components
```

### Auditoria automatizada com pa11y no CI

```yaml
# .github/workflows/a11y.yml
name: Accessibility Audit
on: [pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run build
      - run: npm start &
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      - name: pa11y audit
        run: |
          npx pa11y http://localhost:3000 \
            --standard WCAG2AA \
            --reporter cli \
            --threshold 0
```

## Armadilhas

**1. `lang` ausente no `<html>`**
O maior erro em portais gov. Sem `lang="pt-BR"`, o leitor de tela pode pronunciar o conteúdo em inglês. Verificar em todo template.

**2. PDFs sem tags de acessibilidade**
A maioria dos portais serve PDFs gerados por LibreOffice/Word sem tags PDF/UA. Use `puppeteer` ou `pdfkit` com estrutura semântica, ou exija das gráficas que os PDFs tenham tags.

**3. CAPTCHAs inacessíveis**
reCAPTCHA v2 visual sem alternativa de áudio viola WCAG 1.1.1. Use reCAPTCHA v3 (score invisível) + honeypot fields em portais gov.

**4. Timeout de sessão sem aviso**
WCAG 2.2.1 exige aviso de pelo menos 20 segundos antes de encerrar a sessão. Implemente um modal de aviso com `aria-live="assertive"` e opção de extensão.

**5. Focus visible removido com `outline: none`**
CSS global que remove outline quebrará a navegação por teclado. Use `:focus-visible` em vez de remover outline completamente.

**6. Ícones sem texto alternativo**
`<img src="icone-alerta.png" />` sem alt. Ícones decorativos: `alt=""`. Ícones funcionais: `alt="Descrição da ação"` ou `aria-label`.

**7. Formulários de múltiplos passos sem anúncio de step**
Use `aria-live="polite"` para anunciar quando o usuário avança de etapa.

## Referências

- [eMAG 3.1 — gov.br](https://emag.governoeletronico.gov.br/)
- [WCAG 2.1 — W3C](https://www.w3.org/TR/WCAG21/)
- [LBI 13.146/2015](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm)
- [Radix UI — Primitives acessíveis](https://www.radix-ui.com/)
- [React Aria — Adobe](https://react-spectrum.adobe.com/react-aria/)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [pa11y](https://pa11y.org/)
