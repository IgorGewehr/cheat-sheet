---
title: "DTOs e validação — zod no boundary"
category: padroes-backend
stack: [NestJS, Next.js]
tags: [validação, zod, dto]
excerpt: "Valide na entrada (HTTP, fila, action). Use schema (zod) que gera tipo e regra. Não valide no meio do código."
related: [use-cases, audit-api-endpoint]
updated: 2026-04
---

## Onde validar

Apenas nas **fronteiras**:
- Controller HTTP (entrada do request).
- Consumer de fila (entrada do evento).
- Server Action (entrada do form).
- Webhook handler.

Use case e domínio assumem que dados já chegam corretos (com tipos garantidos pelo schema). Validações de **regra de negócio** (não de formato) ficam no domínio.

## zod (preferível em 2026)

```ts
import { z } from "zod";

export const CriarPedidoSchema = z.object({
  clienteId: z.string().uuid(),
  itens: z.array(z.object({
    produtoId: z.string().uuid(),
    quantidade: z.number().int().positive(),
    desconto: z.number().min(0).max(100).optional(),
  })).min(1),
  observacao: z.string().max(500).optional(),
});

export type CriarPedidoInput = z.infer<typeof CriarPedidoSchema>;
```

No controller Nest, use um `ZodValidationPipe`:

```ts
@Post()
async criar(@Body(new ZodValidationPipe(CriarPedidoSchema)) input: CriarPedidoInput) {
  return this.criarPedido.execute(input);
}
```

## class-validator

Aceitável se você já tem ecosistema Nest todo nele. Não é mais o estado da arte; zod é mais flexível, gera tipo automático, funciona igual em frontend.

## Schema único frontend + backend

Em monorepo, exporte o schema de um `packages/shared` e use no Next (form validation) E no Nest (request validation). Uma fonte da verdade.

## Erros de validação

Retorne 400 estruturado com lista de erros por campo. Não 500. Não string genérica.

```json
{
  "error": "ValidationError",
  "issues": [
    { "path": "itens.0.quantidade", "message": "deve ser positivo" }
  ]
}
```

## Como pedir pra IA

> "Defina schemas zod pros endpoints do módulo financeiro em `packages/shared/financeiro-schemas.ts`. Use no controller Nest via `ZodValidationPipe` e no form Next via `useForm` + `zodResolver`. Implemente `ZodValidationPipe` que retorna 400 com array de issues estruturadas. Não duplique tipos: `type CriarFaturaInput = z.infer<typeof CriarFaturaSchema>`."

## Auditoria

- [ ] Toda entrada de fora (HTTP, fila, action) passa por schema.
- [ ] Schema é a fonte do tipo TS (não tipo separado).
- [ ] Erro de validação retorna 400 com detalhes por campo.
- [ ] Use case recebe tipo já validado (não revalida campo).
- [ ] Validação compartilhada entre front e back (mesmo schema).
- [ ] Mensagens de erro são úteis pro usuário, não stacktraces.
