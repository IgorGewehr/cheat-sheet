---
title: "NestJS Guards, Interceptors, Pipes e Filters"
category: padroes-backend
stack: [NestJS, TypeScript]
tags: [nestjs, guards, interceptors, pipes, filters, middleware]
excerpt: "O pipeline do NestJS em ordem. Guards: passa ou bloqueia. Interceptors: transforma antes/depois. Pipes: valida/transforma input. Filters: captura erros."
related: [dto-validation, use-cases, nestjs-integration-testing, nest-module-organization]
updated: "2026-05"
---

## Ordem de execução do pipeline

```
Request →
  Middleware →
  Guards (auth, roles) →
  Interceptors (antes) →
  Pipes (validate/transform input) →
  Route Handler →
  Interceptors (depois) →
  Exception Filters (se jogar erro) →
Response
```

## Guards — autorização

Retornam `boolean | Promise<boolean>`. Se `false`, Nest lança `ForbiddenException`.

```ts
// guards/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

export const Roles = (...roles: string[]) => SetMetadata("roles", roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    return required.some((role) => user?.roles?.includes(role));
  }
}
```

```ts
// uso no controller
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
@Delete(":id")
remove(@Param("id") id: string) { ... }
```

**Registrando globalmente** (aplica a todas as rotas):
```ts
// app.module.ts ou main.ts
app.useGlobalGuards(new RolesGuard(new Reflector()));
// OU via DI:
{ provide: APP_GUARD, useClass: RolesGuard }
```

## JwtAuthGuard — padrão

```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest<T>(err: Error, user: T): T {
    if (err || !user) throw err ?? new UnauthorizedException();
    return user;
  }
}
```

Rota pública sem guard: use decorator `@Public()` e cheque no guard:
```ts
export const Public = () => SetMetadata("isPublic", true);

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(ctx: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>("isPublic", [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(ctx);
  }
}
```

## Interceptors — transformação e cross-cutting

```ts
// interceptors/response-wrap.interceptor.ts
@Injectable()
export class ResponseWrapInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => ({ data, timestamp: new Date().toISOString() })),
    );
  }
}

// interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(`${req.method} ${req.url} ${ms}ms`);
      }),
    );
  }
}
```

**Uso**: `@UseInterceptors(LoggingInterceptor)` no controller ou global via `APP_INTERCEPTOR`.

## Pipes — validação e transformação de input

### ValidationPipe global (padrão em todo projeto)

```ts
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,        // remove campos não declarados no DTO
    forbidNonWhitelisted: true,  // erro se vier campo extra
    transform: true,        // converte tipos automaticamente (string → number)
    transformOptions: { enableImplicitConversion: true },
  }),
);
```

### DTO com class-validator

```ts
import { IsString, IsInt, Min, IsArray, ValidateNested, IsUUID } from "class-validator";
import { Type } from "class-transformer";

export class CriarPedidoDto {
  @IsUUID()
  clienteId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  itens: PedidoItemDto[];
}

class PedidoItemDto {
  @IsUUID()
  produtoId: string;

  @IsInt()
  @Min(1)
  quantidade: number;
}
```

### Pipe customizado

```ts
@Injectable()
export class ParseCnpjPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 14) throw new BadRequestException("CNPJ inválido");
    return digits;
  }
}

// uso: @Param("cnpj", ParseCnpjPipe) cnpj: string
```

## Exception Filters — tratamento centralizado de erros

```ts
// filters/domain-error.filter.ts
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  private readonly statusMap: Record<string, number> = {
    NotFoundError: 404,
    ValidationError: 400,
    ConflictError: 409,
    ForbiddenError: 403,
    UnprocessableError: 422,
  };

  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const status = this.statusMap[exception.constructor.name] ?? 400;

    ctx.getResponse().status(status).json({
      statusCode: status,
      error: exception.constructor.name,
      message: exception.message,
    });
  }
}
```

Registrado global: `app.useGlobalFilters(new DomainErrorFilter())`.

## Testando guards e pipes isoladamente

```ts
// guards/roles.guard.spec.ts
describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it("permite quando não há roles requeridas", () => {
    const ctx = createMockExecutionContext({ user: { roles: [] } });
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("bloqueia usuário sem role necessária", () => {
    const ctx = createMockExecutionContext({ user: { roles: ["user"] } });
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"]);
    expect(guard.canActivate(ctx)).toBe(false);
  });
});
```

## Como pedir pra IA

> "Crie `WorkspaceGuard` para nosso NestJS. Ele lê `workspaceId` do JWT (`req.user.workspaceId`) e compara com `x-workspace-id` do header. Se diferente, retorna 403. Implemente com `CanActivate`, extraia para `guards/workspace.guard.ts` e inclua unit test com `createMockExecutionContext`."

## Auditoria

- [ ] `ValidationPipe` global com `whitelist: true` e `transform: true`.
- [ ] DTOs usam `class-validator` + `class-transformer`, não Zod (compatível com Swagger).
- [ ] `DomainErrorFilter` global mapeia domain errors → HTTP corretos.
- [ ] Guards testados isoladamente (sem subir Nest completo).
- [ ] Nenhum controller com `try/catch` pra erros de domínio — isso é do filter.

## Anti-padrões

- `try/catch` em cada controller pra mapear erro → HTTP. Use Exception Filter.
- Guard que faz query no banco em toda request sem cache.
- `ValidationPipe` sem `whitelist: true` — aceita campos extras que podem vazar pro banco.
- Pipe que transforma dados de negócio (isso é função do use case, não do pipe).
