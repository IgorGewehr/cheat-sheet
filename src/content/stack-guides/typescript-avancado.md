---
title: "TypeScript Avançado — Generics, Conditional Types e Patterns de Produção"
category: stack-guides
stack: [TypeScript, NestJS, Next.js]
tags: [typescript, generics, conditional-types, mapped-types, branded-types, decorators, utility-types]
excerpt: "O TypeScript que a IA não escreve por padrão e que aparece em toda entrevista sênior: infer, mapped types, branded types, satisfies, patterns de DI."
related: [nestjs-di-providers, nestjs-guards-interceptors, use-cases, repository-pattern]
updated: "2026-05"
---

## Por que TypeScript avançado importa para sênior

Sênior não usa TypeScript só pra ter autocomplete. Usa pra **tornar estados inválidos irrepresentáveis** — o compilador rejeita o bug antes de rodar.

---

## 1. Generics com constraints e inferência

```ts
// Básico — o que todo mundo sabe
function identity<T>(x: T): T { return x; }

// Com constraint — T deve ter a propriedade 'id'
function findById<T extends { id: string }>(list: T[], id: string): T | undefined {
  return list.find(item => item.id === id);
}

// Inferência automática de campos — keyof
function pluck<T, K extends keyof T>(arr: T[], key: K): T[K][] {
  return arr.map(item => item[key]);
}
const nomes = pluck(pedidos, "clienteNome"); // type: string[]

// Generic com default
type ApiResponse<T = unknown> = {
  data: T;
  meta: { total: number; page: number };
};
```

---

## 2. Conditional Types — o `if/else` do sistema de tipos

```ts
// Forma básica: T extends U ? X : Y
type IsString<T> = T extends string ? true : false;
type A = IsString<"abc">;  // true
type B = IsString<number>; // false

// infer — extrai o tipo de dentro de outro
type Unpack<T> = T extends Array<infer U> ? U : T;
type C = Unpack<string[]>; // string
type D = Unpack<number>;   // number (não era array, retorna ele mesmo)

// Desembrulhar Promise
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;
type E = Awaited<Promise<Promise<string>>>; // string

// Extrair parâmetros de função
type FirstParam<T extends (...args: any[]) => any> =
  T extends (first: infer P, ...rest: any[]) => any ? P : never;

type F = FirstParam<(id: string, nome: string) => void>; // string

// Distribuição sobre union (comportamento default)
type ToArray<T> = T extends any ? T[] : never;
type G = ToArray<string | number>; // string[] | number[]

// Evitar distribuição com []
type ToArrayNoDistrib<T> = [T] extends [any] ? T[] : never;
type H = ToArrayNoDistrib<string | number>; // (string | number)[]
```

---

## 3. Mapped Types — transformar formatos de tipo

```ts
// Tornar todos os campos opcionais (o que Partial<T> faz por baixo)
type Opcional<T> = { [K in keyof T]?: T[K] };

// Tornar readonly
type Imutavel<T> = { readonly [K in keyof T]: T[K] };

// Remapping de chaves com 'as' (TS 4.1+)
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
type PedidoGetters = Getters<{ id: string; total: number }>;
// { getId: () => string; getTotal: () => number }

// Filtrar campos por tipo
type SoStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};
type I = SoStrings<{ id: string; total: number; nome: string }>;
// { id: string; nome: string }

// Deep Partial — recursivo
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

---

## 4. Template Literal Types — strings como tipos

```ts
type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<"click">; // "onClick"

// Combinações automáticas
type Side = "top" | "right" | "bottom" | "left";
type CSSMargin = `margin-${Side}`;
// "margin-top" | "margin-right" | "margin-bottom" | "margin-left"

// Extraindo partes de strings
type ExtractParam<T extends string> =
  T extends `${infer _Start}:${infer Param}/${infer _Rest}`
    ? Param
    : T extends `${infer _Start}:${infer Param}`
    ? Param
    : never;

type J = ExtractParam<"/pedidos/:id/itens">; // "id"

// Padrão real: tipo de eventos de domínio
type DomainEventType = "Pedido" | "Fatura" | "Cliente";
type DomainAction = "Criado" | "Cancelado" | "Atualizado";
type EventSlug = `${DomainEventType}${DomainAction}`;
// "PedidoCriado" | "PedidoCancelado" | "FaturaCriada" | ...
```

---

## 5. Branded Types — identidade nominal

TypeScript é estrutural: dois tipos com mesma forma são intercambiáveis. Branded types adicionam identidade para evitar confusão entre IDs diferentes:

```ts
// Sem branded: ClienteId e ProdutoId são ambos 'string' — fácil misturar
declare function buscarPedidos(clienteId: string): Pedido[];
buscarPedidos(produtoId); // compila! bug silencioso

// Com branded: tipos distintos em runtime = string, em compile-time = únicos
type Branded<T, Brand extends string> = T & { readonly __brand: Brand };

type ClienteId = Branded<string, "ClienteId">;
type ProdutoId = Branded<string, "ProdutoId">;
type TenantId  = Branded<string, "TenantId">;

// Funções construtoras com validação
function clienteId(raw: string): ClienteId {
  if (!raw.trim()) throw new Error("ClienteId não pode ser vazio");
  return raw as ClienteId;
}

declare function buscarPedidos(clienteId: ClienteId): Pedido[];
const cId = clienteId("abc");
const pId = "xyz" as ProdutoId;

buscarPedidos(cId);  // ✅ compila
buscarPedidos(pId);  // ❌ erro: ProdutoId não é ClienteId
buscarPedidos("raw"); // ❌ erro: string não é ClienteId
```

---

## 6. Discriminated Unions — sem `if (x === null)` em todo lugar

```ts
// Padrão Result — elimina callbacks de erro implícitos
type Result<T, E = Error> =
  | { ok: true;  data: T }
  | { ok: false; error: E };

async function criarPedido(input: CriarPedidoInput): Promise<Result<PedidoCriado>> {
  if (!input.clienteId) return { ok: false, error: new Error("clienteId obrigatório") };
  const pedido = await db.pedidos.insert(input);
  return { ok: true, data: pedido };
}

const result = await criarPedido(input);
if (!result.ok) {
  console.error(result.error.message); // TypeScript sabe que .error existe aqui
  return;
}
console.log(result.data.pedidoId); // TypeScript sabe que .data existe aqui
```

---

## 7. `satisfies` — melhor que `: Type` em muitos casos

```ts
// Problema com anotação direta: perde inferência específica
const config: Record<string, string | number> = {
  port: 3001,
  url: "postgresql://...",
};
config.port.toFixed(2); // ❌ erro: TypeScript não sabe que é number

// satisfies: valida a forma E mantém inferência específica
const config = {
  port: 3001,
  url: "postgresql://...",
} satisfies Record<string, string | number>;

config.port.toFixed(2);     // ✅ TypeScript sabe que port é number
config.url.toUpperCase();   // ✅ TypeScript sabe que url é string
```

---

## 8. Utility Types que sênior usa (além dos básicos)

```ts
// Já conhecidos: Partial, Required, Readonly, Record, Pick, Omit

// ReturnType — inferir retorno de função
type Handler = (req: Request) => Promise<Response>;
type HandlerReturn = Awaited<ReturnType<Handler>>; // Response

// Parameters — inferir parâmetros
type CreateFn = (nome: string, preco: number) => void;
type CreateArgs = Parameters<CreateFn>; // [string, number]

// ConstructorParameters — parâmetros do construtor de classe
type PedidoArgs = ConstructorParameters<typeof Pedido>; // [...params do new Pedido()]

// InstanceType — tipo da instância de uma classe
type PedidoInstance = InstanceType<typeof Pedido>; // Pedido

// Extract / Exclude — filtrar unions
type Status = "pendente" | "confirmado" | "cancelado" | "entregue";
type Ativo = Extract<Status, "pendente" | "confirmado">;    // "pendente" | "confirmado"
type Inativo = Exclude<Status, "pendente" | "confirmado">;  // "cancelado" | "entregue"

// NonNullable — remove null e undefined
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // string

// NoInfer — (TS 5.4+) evita que um argumento influencie a inferência de T
function createState<T>(initial: T, fallback: NoInfer<T>): T {
  return initial ?? fallback;
}
```

---

## 9. TypeScript + NestJS — patterns reais

```ts
// Generic repository — implementação tipada por entidade
abstract class BaseRepository<T extends { id: string }> {
  abstract findById(id: string): Promise<T | null>;
  abstract save(entity: T): Promise<T>;
  abstract delete(id: string): Promise<void>;
}

// Token genérico com tipo embutido
type InjectionToken<T> = symbol & { __type: T };

function createToken<T>(description: string): InjectionToken<T> {
  return Symbol(description) as InjectionToken<T>;
}

export const PEDIDO_REPO = createToken<PedidoRepository>("PedidoRepository");

// Decorator factory tipado
function Validate<T>(schema: ZodSchema<T>) {
  return function (target: object, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value as (...args: unknown[]) => unknown;
    descriptor.value = function (...args: unknown[]) {
      schema.parse(args[0]);
      return original.apply(this, args);
    };
    return descriptor;
  };
}

// Tipo condicional pra mapear domain errors em HTTP status
type DomainToHttp<T extends DomainError> =
  T extends NotFoundError ? 404 :
  T extends ConflictError ? 409 :
  T extends ValidationError ? 400 :
  400;
```

---

## 10. Perguntas de entrevista sênior sobre TypeScript

**"Qual a diferença entre `type` e `interface`?"**
`interface` é extensível (declaration merging), usada pra objetos e classes. `type` suporta unions, intersections, mapped/conditional types. Prefira `type` exceto quando precisar de extensão/implementação ou módulo augmentation.

**"O que são tipos estruturais vs nominais?"**
TypeScript usa tipagem estrutural — dois tipos com a mesma forma são intercambiáveis. Branded types simulam tipagem nominal quando você precisa distinguir strings semanticamente diferentes (ClienteId vs ProdutoId).

**"Quando usar `unknown` em vez de `any`?"**
`any` desliga o type checker. `unknown` exige que você verifique o tipo antes de usar — é `any` seguro. Use `unknown` em error handlers e inputs externos.

**"O que `infer` faz?"**
Permite extrair e nomear um tipo de dentro de outro durante a verificação condicional. É o que torna possível `Awaited<T>`, `ReturnType<T>`, `Parameters<T>`.

---

## Como pedir pra IA

> "Implemente `Result<T, E>` como tipo discriminado no nosso projeto NestJS. Use `ok: true` com `data: T` e `ok: false` com `error: E extends DomainError`. Crie helper `ok<T>(data: T): Result<T>` e `fail<E>(err: E): Result<never, E>`. Atualize `CriarPedidoUseCase.execute()` para retornar `Promise<Result<PedidoCriadoOutput, PedidoError>>` em vez de lançar exception. Inclua unit tests cobrindo ambos os caminhos."

## Auditoria

- [ ] Sem `any` explícito fora de tipos de terceiros ou JSON genérico.
- [ ] IDs de domínio diferentes usam Branded Types (ClienteId ≠ ProdutoId).
- [ ] Funções que podem falhar retornam `Result<T, E>` em vez de lançar exceção implícita.
- [ ] Utility types (`ReturnType`, `Parameters`, `Awaited`) usados em vez de duplicar tipos.
- [ ] `satisfies` usado onde `:Type` perderia a inferência específica.

## Anti-padrões

- `as any` como "solução" pra erro de tipo — o erro existe por uma razão.
- `// @ts-ignore` sem comentário explicando por quê.
- Tipos duplicados manualmente que poderiam ser inferidos com `ReturnType<typeof fn>`.
- `Record<string, any>` onde um tipo específico resolveria o problema.
- `interface Foo extends Bar` quando `type Foo = Bar & { ... }` é mais expressivo.
