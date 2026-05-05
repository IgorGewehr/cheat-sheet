---
title: "Node.js Profiling — Memory Leaks, CPU e Diagnóstico em Produção"
category: padroes-backend
stack: [NestJS, Node.js, TypeScript]
tags: [profiling, memory-leak, performance, nodejs, nestjs, debug, v8]
excerpt: "Como diagnosticar memory leak e CPU spike em Node.js/NestJS. O que medir, como interpretar heap snapshot, e os padrões de leak mais comuns em NestJS."
related: [nestjs-di-providers, observability, opentelemetry-observabilidade, testing-pyramid-nestjs]
updated: "2026-05"
---

## O básico antes de procurar leak

```ts
// process.memoryUsage() — leitura instantânea
const mem = process.memoryUsage();
console.log({
  rss:        (mem.rss / 1024 / 1024).toFixed(1) + " MB",  // total alocado pelo processo
  heapTotal:  (mem.heapTotal / 1024 / 1024).toFixed(1) + " MB", // heap reservado pelo V8
  heapUsed:   (mem.heapUsed / 1024 / 1024).toFixed(1) + " MB",  // heap efetivamente usado
  external:   (mem.external / 1024 / 1024).toFixed(1) + " MB",  // buffers, C++ addons
});
```

**heapUsed crescendo sem parar = memory leak.** RSS crescendo mas heapUsed estável = leak em buffers ou addons C++.

---

## Diagnóstico com Chrome DevTools (--inspect)

```bash
# Modo inspect — app pausa e aguarda debugger conectar
node --inspect-brk dist/main.js

# Sem pausa — debugger pode conectar a qualquer momento
node --inspect dist/main.js

# NestJS com inspect
node --inspect dist/main.js

# NestJS com ts-node direto
node --inspect -r ts-node/register src/main.ts
```

1. Abra `chrome://inspect` no Chrome
2. Clique em "Open dedicated DevTools for Node"
3. Na aba **Memory**: heap snapshots, allocation timeline, sampling profiler

---

## Heap Snapshot — como ler

```
# Fluxo:
# 1. Tire snapshot 1 (baseline)
# 2. Faça N requests
# 3. Force GC: global.gc() (precisa de --expose-gc)
# 4. Tire snapshot 2
# 5. Compare: View "Objects allocated between Snapshots 1 and 2"
```

O que procurar no comparativo:
- **Closures retidas**: funções que guardam referência ao escopo pai maior do esperado
- **Arrays crescendo**: caches sem limite, acumuladores não limpos
- **EventEmitter listeners**: `.on()` sem `.off()` correspondente
- **Timers não limpos**: `setInterval` sem `clearInterval`

---

## Memory leaks mais comuns em NestJS

### 1. Event listeners não removidos

```ts
// ❌ Leak — listener adicionado em cada request se no REQUEST scope
@Injectable({ scope: Scope.REQUEST })
export class PedidoService {
  constructor(private readonly emitter: EventEmitter2) {
    // PROBLEMA: adicionado em cada instância, nunca removido
    this.emitter.on("pedido.criado", this.handlePedidoCriado.bind(this));
  }
}

// ✅ Correto — registrar em singleton, não em REQUEST scope
@Injectable()  // DEFAULT scope = singleton
export class PedidoEventHandler implements OnModuleInit, OnModuleDestroy {
  private handler = this.handlePedidoCriado.bind(this);

  constructor(private readonly emitter: EventEmitter2) {}

  onModuleInit() {
    this.emitter.on("pedido.criado", this.handler);
  }

  onModuleDestroy() {
    this.emitter.off("pedido.criado", this.handler);
  }
}
```

### 2. REQUEST scope em providers pesados

```ts
// ❌ Cada request cria um novo DrizzleRepository + todas as suas dependências
@Injectable({ scope: Scope.REQUEST })
export class DrizzlePedidoRepository { /* ... */ }

// ✅ Repository é stateless — deve ser singleton
@Injectable()  // DEFAULT
export class DrizzlePedidoRepository { /* ... */ }
```

### 3. Cache sem eviction policy

```ts
// ❌ Map que só cresce
const cache = new Map<string, PedidoData>();

function getCached(id: string): PedidoData {
  if (!cache.has(id)) cache.set(id, fetchPedido(id)); // nunca deleta
  return cache.get(id)!;
}

// ✅ LRU com limite
import LRU from "lru-cache";
const cache = new LRU<string, PedidoData>({ max: 500, ttl: 1000 * 60 * 5 });
```

### 4. Timers em providers sem cleanup

```ts
// ❌ setInterval nunca limpo
@Injectable()
export class MetricsService implements OnModuleInit {
  onModuleInit() {
    setInterval(() => this.flush(), 5000); // timer vaza se módulo destruído
  }
}

// ✅ com cleanup
@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  onModuleInit() { this.timer = setInterval(() => this.flush(), 5000); }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
}
```

---

## CPU Profiling — identificar o que é lento

```bash
# Gera isolate-*.log durante a execução
node --prof dist/main.js

# Após enviar carga (siege, k6, autocannon):
# Ctrl+C para parar

# Converte o log em formato legível
node --prof-process isolate-*.log > profile.txt
```

O output mostra % de tempo em cada função. Procure funções fora de `libuv` ou `v8` que consumam >5%.

### clinic.js — ferramenta mais amigável

```bash
npm i -g clinic
clinic doctor -- node dist/main.js
# Gera relatório HTML com gráfico de CPU, event loop lag e memória

clinic flame -- node dist/main.js
# Flame graph de CPU — visualiza o stack de chamadas
```

---

## Event Loop Lag — o silenciador silencioso

Event loop lag alto (> 50ms) = Node.js não consegue processar requests suficientemente rápido.

Causas comuns:
- **JSON.parse/stringify** de payloads grandes no request handler
- **Crypto síncrono** (`crypto.pbkdf2Sync` bloqueando)
- **fs síncrono** (`readFileSync` no path quente)
- **Loop pesado** sem yield (processamento de array grande sem `await`)

```ts
// Medir event loop lag
import { monitorEventLoopDelay } from "perf_hooks";

const h = monitorEventLoopDelay({ resolution: 10 });
h.enable();
setInterval(() => {
  console.log("Event loop lag (p99):", h.percentile(99) / 1e6, "ms");
  h.reset();
}, 5000);
```

---

## Autocannon — load test local rápido

```bash
npm i -g autocannon

# 100 conexões simultâneas, 10 segundos
autocannon -c 100 -d 10 http://localhost:3001/pedidos

# Output: latência p50/p99/p999, req/s, throughput
```

Se `p99` explodir enquanto `p50` fica ok → poucas requests lentas (I/O, lock, query N+1).  
Se todos os percentis sobem juntos → CPU ou event loop saturado.

---

## Checklist de diagnóstico de produção

```
1. heapUsed crescendo continuamente?          → Memory leak
2. RSS >> heapUsed?                            → Leak em buffer/addon
3. CPU > 80% de forma sustentada?             → Profiling com clinic flame
4. Latência p99 >> p50?                        → Algum request específico é lento (query, I/O)
5. Event loop lag > 50ms?                      → Operação síncrona pesada no path quente
6. Número de handles/requests subindo?         → Leak de handles (conexões não fechadas)
```

---

## Como pedir pra IA

> "Analise este heap snapshot comparativo [descreva os objetos que crescem]. Os objetos `Closure (handleEvent)` estão retendo 40MB em 500 instâncias. Nosso projeto usa NestJS com EventEmitter2. Explique como identificar qual listener está causando o leak e como corrigi-lo usando `onModuleDestroy`."

## Auditoria

- [ ] Providers com `Scope.REQUEST` são realmente necessários? Maioria deve ser `DEFAULT`.
- [ ] Todo `setInterval`/`setTimeout` em provider tem `clearInterval` em `onModuleDestroy`.
- [ ] Todo `.on()` de EventEmitter em provider tem `.off()` correspondente.
- [ ] Caches em memória têm limite máximo (LRU ou TTL).
- [ ] `--inspect` habilitado em staging para diagnóstico sob demanda.

## Anti-padrões

- `JSON.parse(JSON.stringify(obj))` para deep clone — usa CPU desnecessariamente, use `structuredClone`.
- `readFileSync` no path de request — bloqueia event loop.
- `crypto.pbkdf2Sync` em hash de senha — bloqueia event loop, use `bcrypt` com rounds razoável.
- Cache de módulo com `Set` que só cresce — sem eviction = leak garantido.
- Ignorar `heapUsed` subindo porque "a app ainda responde" — GC vai desacelerar antes de travar.
