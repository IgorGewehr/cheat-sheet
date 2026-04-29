---
title: "Armadilha IA: Isolamento Multi-Tenant Ignorado"
category: armadilhas-ia
tags: [multi-tenant, segurança, banco, dados]
stack: [NestJS, Prisma, PostgreSQL, Next.js]
excerpt: A IA esquece de filtrar por tenantId em queries. Um usuário acessa dados de outro cliente sem nenhum erro aparente.
related: [multi-tenant-strategies, multi-filial, rbac-vs-abac, auth-architecture]
updated: "2026-04"
---

## O que a IA gera (vazamento de dados entre tenants)

```typescript
// IA gera busca "normal" — sem filtro de tenant
async getInvoices(userId: string) {
  return this.prisma.invoice.findMany({
    where: { createdBy: userId },
    // 🚨 Faltou: AND tenantId = user.tenantId
  });
}

// Pior ainda — busca por ID sem verificar tenant
async getInvoice(id: string) {
  return this.prisma.invoice.findUnique({ where: { id } });
  // Qualquer usuário de qualquer tenant acessa qualquer invoice
}
```

A IA não tem visibilidade de que o sistema é multi-tenant. Ela implementa a lógica de negócio correta, mas sem o filtro de isolamento.

## Por que isso é crítico

- Tenants diferentes podem ver/editar dados uns dos outros
- O bug não aparece em testes (todos são do mesmo tenant)
- Em produção: vazamento de dados, violação de LGPD/GDPR, perda de clientes

## A versão correta — tenant no decorator/contexto

```typescript
// 1. Extraia tenantId do JWT em todo request
@Injectable()
export class TenantContext {
  private readonly store = new AsyncLocalStorage<{ tenantId: string }>();

  run<T>(tenantId: string, fn: () => T): T {
    return this.store.run({ tenantId }, fn);
  }

  get tenantId(): string {
    const ctx = this.store.getStore();
    if (!ctx) throw new Error('Fora de contexto de tenant');
    return ctx.tenantId;
  }
}

// 2. Middleware que injeta o tenantId no contexto
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private ctx: TenantContext) {}

  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.user?.tenantId; // extraído do JWT
    if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
    this.ctx.run(tenantId, next);
  }
}

// 3. Base repository que SEMPRE filtra por tenant
abstract class TenantRepository<T> {
  constructor(protected prisma: PrismaService, protected ctx: TenantContext) {}

  protected get tenantFilter() {
    return { tenantId: this.ctx.tenantId };
  }

  findMany(where: object = {}) {
    return this.prisma.invoice.findMany({
      where: { ...where, ...this.tenantFilter }, // tenant sempre incluído
    });
  }

  findById(id: string) {
    return this.prisma.invoice.findFirst({
      where: { id, ...this.tenantFilter }, // nunca findUnique sem tenantId
    });
  }
}
```

## Checklist de Row-Level Security (alternativa no PostgreSQL)

```sql
-- Políticas RLS no PostgreSQL como última linha de defesa
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

## Como detectar no code review

- [ ] Toda query ao banco inclui `tenantId` no `where`?
- [ ] O `findUnique` por ID foi substituído por `findFirst` com tenant filter?
- [ ] O tenantId vem do contexto de autenticação (não do body/query da request)?
- [ ] Existe um BaseRepository ou mixin que garante o filtro automaticamente?
- [ ] Testes cobrem o caso de tenantId diferente tentando acessar recursos?

## Prompt para evitar esta armadilha

```
Este é um sistema multi-tenant. TODA query ao banco deve incluir
tenantId no filtro where, extraído do contexto de autenticação
(nunca do body ou query params do request).
Use findFirst ao invés de findUnique quando buscar por ID,
incluindo sempre o tenantId como critério adicional.
```
