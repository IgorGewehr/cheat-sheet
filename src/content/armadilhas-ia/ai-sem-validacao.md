---
title: "Armadilha IA: Input Sem Validação"
category: armadilhas-ia
tags: [segurança, validação, api, dto]
stack: [NestJS, Next.js, Zod, class-validator]
excerpt: A IA usa os dados do request diretamente sem validar tipo, tamanho ou formato — injeção, crash e dados corrompidos esperando acontecer.
related: [dto-validation, audit-api-endpoint, auth-architecture]
updated: "2026-04"
---

## O que a IA gera (dados do request usados raw)

```typescript
// NestJS — IA usa @Body() tipado como qualquer coisa, sem validação real
@Post('transfer')
async transfer(@Body() body: any) {
  await this.accountService.transfer(
    body.fromAccountId,
    body.toAccountId,
    body.amount,  // pode ser string, negativo, 0, NaN, Infinity...
  );
}

// Next.js — IA lê json sem validar
export async function POST(req: Request) {
  const { email, role } = await req.json();
  await db.user.update({ where: { email }, data: { role } });
  // role pode ser "superadmin", SQL injection via email, etc.
}
```

## Vetores de ataque que a ausência de validação abre

- **Mass assignment**: `{ "isAdmin": true }` no body vira campo no banco
- **Type coercion**: `"9999999999999"` passa como número, quebra cálculo financeiro
- **Overflow**: campos de texto sem maxLength → banco rejeita após processar
- **Prototype pollution**: `{ "__proto__": { "admin": true } }` em parsing descuidado
- **Injeção via campos não esperados**: campos extras que chegam ao ORM

## A versão correta com NestJS + class-validator

```typescript
// DTO com validação explícita
export class TransferDto {
  @IsUUID()
  fromAccountId: string;

  @IsUUID()
  toAccountId: string;

  @IsNumber()
  @IsPositive()
  @Max(50000)               // limite de negócio
  @Type(() => Number)
  amount: number;
}

// ValidationPipe global (main.ts) — rejeita qualquer campo extra
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,          // strip campos não declarados no DTO
  forbidNonWhitelisted: true,
  transform: true,
}));

// Controller tipado — body já é o DTO validado
@Post('transfer')
transfer(@Body() dto: TransferDto) {
  return this.accountService.transfer(dto.fromAccountId, dto.toAccountId, dto.amount);
}
```

## A versão correta com Zod (Next.js / tRPC)

```typescript
const transferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId:   z.string().uuid(),
  amount:        z.number().positive().max(50000),
});

export async function POST(req: Request) {
  const body = await req.json();
  const result = transferSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }
  const { fromAccountId, toAccountId, amount } = result.data;
  await accountService.transfer(fromAccountId, toAccountId, amount);
  return NextResponse.json({ ok: true });
}
```

## Como detectar no code review

- [ ] Todo `@Body()` tem um DTO com decorators de validação (não `any` nem `object`)?
- [ ] O `ValidationPipe` com `whitelist: true` está ativo globalmente?
- [ ] Campos numéricos financeiros têm `@IsPositive()` e `@Max()` definidos?
- [ ] Strings têm `@MaxLength()` para evitar overflow no banco?
- [ ] Enums são validados com `@IsIn()` ou `@IsEnum()` (não confia em string livre)?

## Prompt para evitar esta armadilha

```
Para TODA entrada de dados externos:
1. Crie DTOs com class-validator OU schemas Zod — nunca use 'any'
2. Valide tipos, limites e formatos explicitamente
3. Use whitelist: true para rejeitar campos não declarados
4. Valide enums com lista fechada de valores permitidos
5. Campos financeiros: sempre IsNumber + IsPositive + Max
```
