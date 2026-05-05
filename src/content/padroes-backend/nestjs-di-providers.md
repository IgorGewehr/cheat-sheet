---
title: "NestJS DI — Providers, Escopos e Tokens"
category: padroes-backend
stack: [NestJS, TypeScript]
tags: [nestjs, dependency-injection, providers, ioc, tokens, escopos]
excerpt: "O container de DI é o coração do Nest. Entenda providers, tokens, escopos e forRoot — sem isso, você usa Nest sem entender Nest."
related: [nest-module-organization, nestjs-guards-interceptors, use-cases, nestjs-config-env]
updated: "2026-05"
---

## O container de DI

NestJS usa **Inversão de Controle (IoC)**: você declara o que precisa, o container instancia e injeta. Você nunca faz `new MinhaClasse()` manualmente (exceto em testes).

O container é **por módulo** e hierárquico. Um provider registrado em `AuthModule` é invisível para `PedidosModule` a não ser que seja exportado.

## Tipos de provider

### 1. Class provider (padrão)

```ts
@Module({
  providers: [CriarPedidoUseCase],  // shorthand para:
  // providers: [{ provide: CriarPedidoUseCase, useClass: CriarPedidoUseCase }]
})
```

Nest instancia a classe e resolve suas dependências recursivamente.

### 2. Value provider — constantes e objetos prontos

```ts
@Module({
  providers: [
    { provide: "APP_CONFIG", useValue: { maxRetries: 3, timeout: 5000 } },
    { provide: "ENV", useValue: process.env.NODE_ENV },
  ],
})

// injeção:
constructor(@Inject("APP_CONFIG") private config: AppConfig) {}
```

### 3. Factory provider — construção condicional ou assíncrona

```ts
@Module({
  providers: [
    {
      provide: DrizzleClient,
      useFactory: (config: ConfigService) => {
        const pool = new Pool({ connectionString: config.get("DATABASE_URL") });
        return drizzle(pool, { schema });
      },
      inject: [ConfigService],
    },
  ],
})
```

`inject` lista as dependências que serão passadas para a factory na ordem.

### 4. Existing provider — alias

```ts
// PedidoRepository é o token; DrizzlePedidoRepository é a implementação
{ provide: PedidoRepository, useExisting: DrizzlePedidoRepository }
```

Permite injetar pela interface (`PedidoRepository`) mas usar a implementação concreta.

### 5. Async factory — quando precisa de I/O no bootstrap

```ts
{
  provide: DrizzleClient,
  useFactory: async (config: ConfigService) => {
    const pool = new Pool({ connectionString: config.get("DATABASE_URL") });
    await pool.connect(); // verifica conexão no startup
    return drizzle(pool, { schema });
  },
  inject: [ConfigService],
}
```

## Tokens de injeção

O token é a "chave" no container. Pode ser:

```ts
// Classe como token (mais comum)
@Injectable() class MeuService {}
constructor(private s: MeuService) {}

// String como token (para primitivos ou terceiros)
@Inject("DATABASE_URL") private url: string

// Symbol como token (evita colisão em libs)
export const PEDIDO_REPO = Symbol("PEDIDO_REPO");
{ provide: PEDIDO_REPO, useClass: DrizzlePedidoRepository }
constructor(@Inject(PEDIDO_REPO) private repo: PedidoRepository) {}

// Classe abstrata como token (melhor prática para clean arch)
export abstract class PedidoRepository {
  abstract save(p: Pedido): Promise<void>;
}
{ provide: PedidoRepository, useClass: DrizzlePedidoRepository }
constructor(private repo: PedidoRepository) {} // sem @Inject
```

**Classe abstrata como token** é o padrão mais limpo: DI resolve por tipo, sem magic string, mas a implementação é intercambiável.

## Escopos de provider

```ts
import { Injectable, Scope } from "@nestjs/common";

@Injectable({ scope: Scope.DEFAULT })    // singleton (padrão)
@Injectable({ scope: Scope.REQUEST })    // nova instância por request HTTP
@Injectable({ scope: Scope.TRANSIENT })  // nova instância a cada injeção
```

| Escopo | Instâncias | Quando usar |
|---|---|---|
| `DEFAULT` | 1 por app | Services, repositories, use cases — **99% dos casos** |
| `REQUEST` | 1 por HTTP request | Quando precisa do request context (user, tenant ID) |
| `TRANSIENT` | 1 por injeção | Quase nunca — evite |

**REQUEST scope tem custo**: cada request cria um grafo de objetos. Cuidado com services pesados em REQUEST scope.

Alternativa a REQUEST scope para tenant ID: use um `AsyncLocalStorage` ou passe o tenant como parâmetro explícito.

## forRoot e forRootAsync — módulos dinâmicos

Padrão para módulos que precisam de configuração:

```ts
// database.module.ts
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      providers: [
        { provide: "DB_OPTIONS", useValue: options },
        {
          provide: DrizzleClient,
          useFactory: (opts: DatabaseOptions) => drizzle(new Pool(opts)),
          inject: ["DB_OPTIONS"],
        },
      ],
      exports: [DrizzleClient],
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: unknown[]) => DatabaseOptions;
    inject?: unknown[];
  }): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      providers: [
        {
          provide: DrizzleClient,
          useFactory: async (...args) => {
            const opts = await options.useFactory(...args);
            return drizzle(new Pool(opts));
          },
          inject: options.inject ?? [],
        },
      ],
      exports: [DrizzleClient],
    };
  }
}

// app.module.ts
DatabaseModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    connectionString: config.getOrThrow("DATABASE_URL"),
  }),
  inject: [ConfigService],
})
```

## Módulos globais

```ts
@Global()  // providers exportados ficam disponíveis em todos os módulos sem importar
@Module({ providers: [LoggingService], exports: [LoggingService] })
export class CoreModule {}
```

Use `@Global()` com moderação — dificulta entender as dependências. Bom para: Logger, Config, DB client.

## Circular dependency

Sintoma: `Nest can't resolve dependencies of X. Please make sure that Y at index [0] is available`.

Causa: `ModuloA` importa `ModuloB` e vice-versa.

Solução correta: criar um terceiro módulo com a funcionalidade compartilhada.

Workaround (temporário): `forwardRef(() => ModuloB)` — indica que o módulo será resolvido depois.

```ts
// use só se não conseguir quebrar a dependência circular
@Module({ imports: [forwardRef(() => PedidosModule)] })
export class EstoqueModule {}
```

## Como pedir pra IA

> "Crie `DatabaseModule.forRootAsync()` para nosso NestJS. Usa `ConfigService` para ler `DATABASE_URL`. Provider `DrizzleClient` é criado com `drizzle(new Pool({ connectionString }), { schema })`. Exporta `DrizzleClient` com `@Global()`. Inclua o tipo `DatabaseOptions` e registre em `AppModule` usando `forRootAsync` + `ConfigModule`."

## Auditoria

- [ ] Providers com lógica de negócio estão em `Scope.DEFAULT` (singleton).
- [ ] Nenhum `new MinhaClasse()` em produção fora de testes.
- [ ] Interfaces de repositório são tokens de injeção (classe abstrata).
- [ ] `@Global()` usado apenas para infraestrutura core (DB, Config, Logger).
- [ ] Sem `forwardRef` entre módulos de domínio.

## Anti-padrões

- `@Inject("MAGIC_STRING")` para todos os tokens — prefira classe abstrata.
- REQUEST scope em services que fazem queries — cria instâncias desnecessárias.
- Módulo gigante importando tudo globalmente — perde os benefícios do encapsulamento.
- Factory provider com lógica de negócio — factory só constrói, não processa.
