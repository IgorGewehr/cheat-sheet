---
title: "TypeScript — Por Que É Inegociável nessa Stack"
category: stack-guides
stack: [TypeScript, NestJS, Node.js]
tags: [typescript, tipos, strict, tsconfig, utility-types]
excerpt: "TypeScript não é 'JavaScript com tipos'. É a diferença entre um bug descoberto no deploy e um bug sublinhado no editor antes de rodar. Com strict: true, o compilador vira co-revisor."
related: [nestjs-por-onde-comecar, typescript-avancado, dto-validation]
updated: "2026-05"
---

## Por que TypeScript não é opcional

JavaScript puro em projetos sérios é tech debt antecipado. Os problemas aparecem em escala:
- Refatorar o campo `valor` para `valorCentavos` em 40 arquivos — sem tipos, você descobre o que quebrou em produção
- Receber `null` onde esperava `string` — `Cannot read properties of null` é o erro mais comum em produção
- Novo dev chama `pedidosService.criar(dto)` sem saber os campos obrigatórios — TypeScript mostra inline

Com TypeScript `strict: true`:
- Você refatora com confiança (o compilador aponta cada uso do campo renomeado)
- `null` e `undefined` precisam ser tratados explicitamente
- DTOs tipados documentam a API melhor que qualquer comentário

## tsconfig.json para produção

```json
{
  "compilerOptions": {
    "strict": true,           // habilita todas as flags abaixo
    "strictNullChecks": true, // null/undefined são tipos separados
    "noImplicitAny": true,    // proíbe `any` implícito
    "strictFunctionTypes": true,
    "target": "ES2022",
    "module": "CommonJS",     // NestJS usa CommonJS
    "moduleResolution": "node",
    "experimentalDecorators": true,  // necessário para NestJS
    "emitDecoratorMetadata": true,   // necessário para DI do NestJS
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

`experimentalDecorators` e `emitDecoratorMetadata` são **obrigatórios** para NestJS — os decorators `@Injectable()`, `@Controller()`, etc. dependem dessas features.

## Types vs Interfaces — quando usar cada

```typescript
// Interface: para objetos que podem ser implementados ou estendidos
interface PedidoRepository {
  findById(id: string): Promise<Pedido | null>;
  save(pedido: Pedido): Promise<Pedido>;
}

// Type: para unions, intersections, tipos computados
type Status = 'rascunho' | 'aprovado' | 'cancelado';
type PedidoComCliente = Pedido & { cliente: Cliente };
type PedidoParcial = Pick<Pedido, 'id' | 'status'>;
```

**Regra prática**: interface para contratos (o que uma classe/objeto deve implementar), type para tudo que seria estranho como interface (unions, computados, aliases).

## Utility Types essenciais

```typescript
type Pedido = {
  id: string;
  valor: number;
  status: Status;
  clienteId: string;
  createdAt: Date;
};

// Partial — todos campos opcionais (útil para updates)
type AtualizarPedidoDto = Partial<Pick<Pedido, 'valor' | 'status'>>;

// Required — força todos obrigatórios
type PedidoCompleto = Required<Pedido>;

// Pick — seleciona campos
type PedidoResumo = Pick<Pedido, 'id' | 'status' | 'valor'>;

// Omit — remove campos (útil para DTOs de criação sem id/createdAt)
type CriarPedidoDto = Omit<Pedido, 'id' | 'createdAt'>;

// Record — objeto tipado por chave
type StatusLabels = Record<Status, string>;

// ReturnType — infere o tipo de retorno de uma função
type ResultadoBusca = ReturnType<typeof pedidosService.buscar>;
```

## O problema com `any`

```typescript
// ❌ Proibido — destrói todas as garantias de tipo
function processar(dados: any) {
  return dados.valor * 1.1; // e se dados.valor não existir?
}

// ✅ Correto — força tratamento explícito
function processar(dados: { valor: number }): number {
  return dados.valor * 1.1;
}

// ✅ Quando realmente não sabe o tipo — use unknown + type guard
function processarDesconhecido(dados: unknown): number {
  if (typeof dados === 'object' && dados !== null && 'valor' in dados) {
    return (dados as { valor: number }).valor * 1.1;
  }
  throw new Error('Estrutura inválida');
}
```

`any` é `strict: false` pontual. Cada `any` que você adiciona é um buraco onde bugs se escondem.

## Enums vs Union Types

```typescript
// Enum — gera código JavaScript, mais verboso
enum StatusPedido {
  RASCUNHO = 'rascunho',
  APROVADO = 'aprovado',
}

// Union type — apenas TypeScript, sem overhead de runtime
type StatusPedido = 'rascunho' | 'aprovado' | 'cancelado';

// const enum — sem geração de código, apenas substituição inline
const enum Permissao {
  LEITURA = 'leitura',
  ESCRITA = 'escrita',
}
```

**Preferência no stack**: union types para simplicidade. Enums normais quando precisar fazer `Object.values()` em runtime.

## Decorators em NestJS — o que o TypeScript habilita

```typescript
// @Injectable() marca a classe como gerenciável pelo DI container
@Injectable()
export class PedidosService {
  // TypeScript + emitDecoratorMetadata = NestJS sabe que precisa injetar PedidosRepository
  constructor(private readonly repo: PedidosRepository) {}
}
```

Sem `emitDecoratorMetadata: true`, o NestJS não consegue ler o tipo do parâmetro `repo` em runtime e não consegue injetar. Isso é TypeScript passando metadata de tipos para JavaScript.
