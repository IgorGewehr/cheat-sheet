---
title: "Armadilha IA: Lista Sem Paginação"
category: armadilhas-ia
tags: [api, performance, banco, scalability]
stack: [NestJS, Next.js, Prisma, PostgreSQL]
excerpt: A IA retorna findMany() sem limit/offset. Funciona com 50 registros, trava o servidor com 50.000.
related: [dto-validation, repository-pattern, audit-api-endpoint]
updated: "2026-04"
---

## O que a IA gera por padrão

```typescript
// Retorna TODOS os registros — sem limite
async getAllProducts() {
  return this.prisma.product.findMany({
    where: { active: true },
    include: { category: true, images: true },
    orderBy: { createdAt: 'desc' },
  });
}

// No controller, sem qualquer parâmetro de página
@Get('products')
getProducts() {
  return this.productsService.getAllProducts();
}
```

Em produção com 100k produtos: a query carrega tudo em memória, serializa, transfere. Timeout garantido.

## O problema composto

- Sem paginação → query lenta → connection pool esgotado
- `include` com relacionamentos multiplica o problema (N imagens por produto)
- Sem `orderBy` determinístico → resultados inconsistentes entre páginas
- Sem total count → frontend não sabe quantas páginas existem

## A versão correta (cursor-based para APIs modernas)

```typescript
// Cursor-based pagination — ideal para feeds e listas infinitas
async getProducts(cursor?: string, take = 20) {
  const items = await this.prisma.product.findMany({
    take: take + 1, // pega 1 a mais para saber se tem próxima página
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { id: 'asc' }, // ordem determinística pelo cursor
    where: { active: true },
    include: { category: true },
  });

  const hasNext = items.length > take;
  return {
    data: hasNext ? items.slice(0, -1) : items,
    nextCursor: hasNext ? items[take - 1].id : null,
  };
}
```

```typescript
// Offset-based — quando o frontend precisa de "página 3 de 10"
async getProducts(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const [data, total] = await this.prisma.$transaction([
    this.prisma.product.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      where: { active: true },
    }),
    this.prisma.product.count({ where: { active: true } }),
  ]);

  return {
    data,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  };
}
```

## DTO de query padronizado

```typescript
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
}
```

## Como detectar no code review

- [ ] Todo endpoint de listagem tem parâmetros de paginação?
- [ ] O `take`/`limit` tem um máximo definido (evita take=99999 no query param)?
- [ ] A resposta inclui metadados de paginação (total, nextCursor, etc.)?
- [ ] O `orderBy` usa campo determinístico (id, ou timestamp + id como desempate)?
- [ ] Queries de count rodam em transaction paralela, não sequencial?

## Prompt para evitar esta armadilha

```
Todo endpoint que retorna coleção DEVE:
1. Aceitar parâmetros de paginação (page/pageSize ou cursor)
2. Ter pageSize máximo de 100 (nunca ilimitado)
3. Retornar metadados: total de registros e informação de próxima página
4. Usar orderBy determinístico para resultados consistentes
```
