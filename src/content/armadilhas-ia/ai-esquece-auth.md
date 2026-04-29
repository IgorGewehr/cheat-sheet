---
title: "Armadilha IA: Auth Middleware Faltando"
category: armadilhas-ia
tags: [auth, segurança, api, middleware]
stack: [NestJS, Express, Fastify, Next.js]
excerpt: A IA cria endpoints sem guard/middleware de autenticação por padrão — especialmente em rotas de update e delete que "parecem internas".
related: [auth-architecture, rbac-vs-abac, audit-api-endpoint]
updated: "2026-04"
---

## O que a IA costuma gerar (sem proteção)

```typescript
// NestJS — IA cria o controller, "esquece" o @UseGuards
@Controller('users')
export class UserController {
  @Get(':id')
  getUser(@Param('id') id: string) { ... }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) { ... }

  @Delete(':id')  // qualquer pessoa pode deletar qualquer usuário
  deleteUser(@Param('id') id: string) { ... }
}
```

```typescript
// Next.js App Router — IA cria a route sem verificar sessão
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await db.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
  // Nenhum check de autenticação ou autorização
}
```

## Por que acontece

A IA prioriza fazer o código funcionar. Autenticação é uma preocupação transversal — sem instrução explícita, ela omite.

Casos mais frequentes:
- Rotas de admin que "parecem internas"
- Webhooks sem validação de assinatura
- Endpoints de health/status que expõem dados sensíveis
- Rotas de leitura sem checar se o recurso pertence ao usuário autenticado

## A versão correta

```typescript
// NestJS — guard no controller inteiro + checar ownership
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {

  @Patch(':id')
  @Roles('admin')
  async updateUser(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    if (user.id !== id && !user.roles.includes('admin')) {
      throw new ForbiddenException();
    }
    return this.usersService.update(id, dto);
  }
}
```

```typescript
// Next.js — sempre verifica sessão antes de qualquer operação
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth(); // next-auth ou similar
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin" && session.user.id !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
```

## Como detectar no code review

- [ ] Todo controller/route tem guard/middleware de auth declarado?
- [ ] Endpoints de write (POST, PUT, PATCH, DELETE) têm auth obrigatória?
- [ ] Endpoints de leitura checam se o recurso pertence ao usuário?
- [ ] Webhooks validam assinatura HMAC antes de processar?
- [ ] Nenhum endpoint retorna dados sensíveis sem autenticação?

## Prompt para evitar esta armadilha

```
Para TODOS os endpoints gerados:
1. Adicione guard/middleware de autenticação por padrão (JWT/Session)
2. Para operações de escrita (create/update/delete): exija role específico
3. Para leitura de recurso por ID: verifique se pertence ao usuário autenticado
4. Documente explicitamente se o endpoint é público e por quê
```
