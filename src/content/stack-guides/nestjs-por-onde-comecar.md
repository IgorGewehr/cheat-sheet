---
title: "NestJS — Por Onde Começar"
category: stack-guides
stack: [NestJS, TypeScript, Node.js]
tags: [nestjs, typescript, backend, setup, di, decorators]
excerpt: "O que é NestJS, por que escolhê-lo para ERPs e microsserviços, e como criar seu primeiro projeto com estrutura sólida desde o início."
related: [typescript-por-que-usar, nestjs-di-providers, nest-module-organization, nestjs-guards-interceptors]
updated: "2026-05"
---

## O que é NestJS

NestJS é um framework Node.js **opinativo** construído em TypeScript que força você a organizar código em módulos, controllers e services — a mesma separação que frameworks maduros como Spring Boot ou ASP.NET impõem. Essa opinião é o ponto: elimina discussão sobre estrutura e permite foco no negócio.

Usa Express (ou Fastify) por baixo, mas adiciona:
- **DI Container** — injeção de dependências automática via decorators
- **Módulos** — unidade de encapsulamento que define o que é público e privado
- **Interceptors, Guards, Pipes, Filters** — hooks para cross-cutting concerns (auth, validação, logging, tratamento de erro)

## Por que NestJS para ERPs e microsserviços

ERPs têm domínio complexo: múltiplas empresas, perfis de acesso, integrações fiscais, regras contábeis. NestJS escala nisso porque:

- Módulos permitem isolar `PedidosModule`, `FaturamentoModule`, `EstoqueModule` — cada domínio com seus próprios providers
- DI container facilita trocar implementações para testes (mock de repositório) sem mudar os consumers
- Guards centralizam RBAC — uma anotação `@Roles('admin')` no controller, uma verificação em todo o sistema
- Estrutura previsível: qualquer dev no time encontra qualquer coisa em < 30 segundos

## Criando um projeto

```bash
npm i -g @nestjs/cli
nest new meu-erp --package-manager npm
cd meu-erp
npm run start:dev
```

Estrutura gerada:
```
src/
  app.controller.ts      # controller raiz (pode remover depois)
  app.module.ts          # módulo raiz — importa todos os outros
  app.service.ts         # service raiz (pode remover)
  main.ts                # bootstrap — cria NestFactory e escuta porta
```

## main.ts — o bootstrap

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Pipe global de validação — todo DTO é validado automaticamente
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  await app.listen(3000);
}
bootstrap();
```

## A tríade: Controller → Service → Module

```typescript
// pedidos.controller.ts
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  listar() {
    return this.pedidosService.listarTodos();
  }

  @Post()
  criar(@Body() dto: CriarPedidoDto) {
    return this.pedidosService.criar(dto);
  }
}

// pedidos.service.ts
@Injectable()
export class PedidosService {
  constructor(private readonly pedidosRepo: PedidosRepository) {}

  listarTodos() {
    return this.pedidosRepo.findAll();
  }
}

// pedidos.module.ts
@Module({
  controllers: [PedidosController],
  providers: [PedidosService, PedidosRepository],
  exports: [PedidosService],   // expõe para outros módulos importarem
})
export class PedidosModule {}
```

**Regra**: controller só recebe/valida entrada e delega. Lógica de negócio vive no service. Acesso a dados vive no repository.

## Estrutura recomendada para ERPs

```
src/
  pedidos/
    dto/
      criar-pedido.dto.ts
      atualizar-pedido.dto.ts
    pedidos.controller.ts
    pedidos.service.ts
    pedidos.repository.ts
    pedidos.module.ts
  clientes/
    ...
  app.module.ts
  main.ts
```

Cada domínio é uma pasta auto-contida. `AppModule` importa os módulos de domínio.

## Quando NestJS, quando Express puro

| Cenário | Escolha |
|---------|---------|
| ERP, backoffice, API com múltiplos domínios | NestJS |
| Microsserviço simples com 3-4 endpoints | Express ou Fastify direto |
| Protótipo rápido | Express direto |
| Integração com sistema existente NestJS | NestJS |

Para o stack NestJS + Next.js + Drizzle + Postgres que usamos, NestJS cuida do backend de domínio enquanto Next.js serve as páginas — comunicação via API REST ou Server Actions chamando o NestJS.
