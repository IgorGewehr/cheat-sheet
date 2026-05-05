---
title: "Spec-Driven Development — OpenAPI First com NestJS"
category: padroes-backend
stack: [NestJS, TypeScript, OpenAPI, Swagger]
tags: [sdd, openapi, swagger, spec-first, api-design, contrato]
excerpt: "Escreva o contrato OpenAPI antes de implementar. A spec é a fonte da verdade — DTOs, validação e cliente frontend derivam dela."
related: [dto-validation, tdd-red-green-refactor, nestjs-guards-interceptors, nest-module-organization]
updated: "2026-05"
---

## O que é Spec-Driven Development

SDD = você define **o quê** antes de implementar **o como**:

```
1. Escreve a spec OpenAPI da rota (ou usa @nestjs/swagger como spec)
2. Gera os tipos/cliente a partir da spec
3. Escreve os testes que validam o contrato
4. Implementa pra passar nos testes
```

A spec vira o contrato entre backend e frontend. Mudança de comportamento = mudança na spec primeiro.

## Setup @nestjs/swagger

```bash
npm install @nestjs/swagger
```

```ts
// main.ts
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

const config = new DocumentBuilder()
  .setTitle("Brain API")
  .setVersion("1.0")
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup("api-docs", app, document);

// Exporta spec como JSON pra geração de cliente
// GET /api-docs-json → OpenAPI JSON
```

## Anotando DTOs — a spec vem dos decorators

```ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsUUID, IsInt, Min, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CriarPedidoDto {
  @ApiProperty({ description: "ID do cliente", format: "uuid" })
  @IsUUID()
  clienteId: string;

  @ApiProperty({ type: [PedidoItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  itens: PedidoItemDto[];
}

export class PedidoItemDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  produtoId: string;

  @ApiProperty({ minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  quantidade: number;
}

export class PedidoCriadoResponseDto {
  @ApiProperty({ format: "uuid" })
  pedidoId: string;

  @ApiProperty({ example: "2026-05-01T10:00:00Z" })
  criadoEm: string;
}
```

## Anotando controllers

```ts
@ApiTags("pedidos")
@ApiBearerAuth()
@Controller("pedidos")
export class PedidosController {
  @Post()
  @ApiOperation({ summary: "Criar novo pedido" })
  @ApiCreatedResponse({ type: PedidoCriadoResponseDto })
  @ApiBadRequestResponse({ description: "Dados inválidos" })
  @ApiUnauthorizedResponse({ description: "Não autenticado" })
  @ApiUnprocessableEntityResponse({ description: "Estoque insuficiente" })
  async criar(@Body() dto: CriarPedidoDto): Promise<PedidoCriadoResponseDto> {
    return this.criarPedidoUseCase.execute(dto);
  }
}
```

## Gerando cliente TypeScript pra Next.js

```bash
# instala gerador
npm install -D openapi-typescript-codegen

# adiciona script que puxa a spec e gera o cliente
# package.json
"scripts": {
  "gen:api-client": "openapi-ts --input http://localhost:3001/api-docs-json --output src/lib/api-client --client fetch"
}
```

```ts
// Next.js agora usa tipos gerados:
import { PedidosService } from "@/lib/api-client";

const { pedidoId } = await PedidosService.criarPedido({
  requestBody: { clienteId, itens },
});
```

Mudança no backend? Gera novamente → TypeScript acusa no frontend os campos quebrados.

## Contract testing com Dredd ou Zod

Valida que a implementação responde exatamente como a spec diz:

```ts
// test/contract/pedidos.contract.spec.ts
import { createTestApp } from "../helpers/create-test-app";
import * as request from "supertest";
import { validate } from "openapi-response-validator";
import spec from "../../api-spec.json";

describe("Contract: POST /pedidos", () => {
  let app: INestApplication;

  beforeAll(async () => { app = await createTestApp(); });
  afterAll(async () => { await app.close(); });

  it("response body matches OpenAPI spec", async () => {
    const res = await request(app.getHttpServer())
      .post("/pedidos")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ clienteId: "c1", itens: [{ produtoId: "p1", quantidade: 1 }] });

    const errors = validate({ statusCode: res.status, body: res.body }, spec.paths["/pedidos"].post);
    expect(errors).toBeNull();
  });
});
```

## Workflow SDD completo

```
1. Designer ou tech lead escreve a spec no Notion / OpenAPI YAML
2. Dev adiciona decorators @Api* nos DTOs e controllers
3. Gera cliente pra Next.js: npm run gen:api-client
4. Escreve testes contract pra garantir aderência
5. Implementa use case pra passar nos testes
6. CI: genera spec + valida contract em cada PR
```

## Versionamento de API

```ts
// Prefixo de versão global
app.setGlobalPrefix("v1");

// OU por controller
@Controller({ path: "pedidos", version: "1" })

// main.ts
app.enableVersioning({ type: VersioningType.URI });
```

Spec OpenAPI vira `v1.json`. Quando quebrar contrato: cria `v2.json`, mantém `v1` depreciada por tempo definido.

## Como pedir pra IA

> "Adicione OpenAPI completo pra rota `POST /faturas` do `FinanceiroModule`. Input: `CriarFaturaDto` com `clienteId: UUID`, `valor: number` (>0), `vencimento: string (ISO date)`. Response 201: `FaturaCriadaDto` com `faturaId`, `vencimento`, `valor`. Erros: 400 valor<=0, 401 sem auth, 409 cliente já tem fatura em aberto. Use `@ApiTags`, `@ApiOperation`, `@ApiCreatedResponse`, `@ApiBadRequestResponse`."

## Auditoria

- [ ] Todo controller tem `@ApiTags` e cada rota tem `@ApiOperation`.
- [ ] Todos os response codes possíveis têm `@ApiXxxResponse` com tipo.
- [ ] DTOs de request têm `@ApiProperty` em todos os campos.
- [ ] Spec JSON exportada no CI e versionada no repositório.
- [ ] Frontend usa cliente gerado da spec (não strings hardcoded de URL).

## Anti-padrões

- Spec desatualizada em relação à implementação — spec que mente é pior que sem spec.
- Anotar depois de implementar (mesma armadilha do TDD retroativo).
- DTOs sem `@ApiProperty` — swagger fica em branco, geração de cliente falha.
- Breaking changes na spec sem incrementar versão.
