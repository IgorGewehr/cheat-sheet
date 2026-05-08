---
title: "Go: Entrevista Sênior — Runtime, Escape Analysis, GC, Channels Internals, System Design"
category: craft
stack: [Go]
tags: [entrevista, golang, runtime, gc, escape-analysis, channels, system-design, interview]
excerpt: "Banco de respostas pra entrevista Go sênior: GC, runtime, escape analysis, channels por dentro, mutex vs RWMutex, system design com Go e os trade-offs que se espera de staff candidate."
related: [go-concorrencia-goroutines, go-benchmarks-profiling, go-generics-modernos, entrevista-algoritmos, go-microservices-enterprise]
updated: "2026-05-08"
---

## Como entrevista sênior funciona

Em vaga sênior/staff, a maior parte da entrevista é trade-off, não syntax. Esperam que você:

- explique **por que** uma escolha custa o que custa em produção;
- proponha alternativas e diga quando usar cada;
- admita o que não sabe sem floreio;
- conte experiência concreta — incidentes, refatorações, decisões com consequência.

Decorar respostas perde para entender mecanismos. Use este card como roteiro, não como script.

## Runtime e scheduler (M:N)

Goroutines são multiplexadas em threads do SO pelo modelo M:N do runtime Go:

- **G**: goroutine, ~2KB de stack inicial, cresce dinâmica;
- **M**: machine, thread do SO;
- **P**: processor, contexto lógico que casa M com G prontas (configurado por `GOMAXPROCS`).

Trade-off: criar goroutines é barato (2KB), trocar de contexto entre elas é barato (no userland, sem syscall). Mas isso só vale se elas terminam. Goroutine sem fim conhecido = leak.

Pergunta de prova: "O que acontece se você criar 100k goroutines bloqueadas em I/O?" Resposta sênior: o scheduler aloca M extras conforme threads bloqueiam em syscall, e cresce até bater limites do SO; o "leve" virou caro porque você não modelou backpressure.

## Escape analysis

O compilador decide se uma variável vive na stack ou no heap. Stack é grátis (frame liberado no return). Heap custa GC.

```bash
go build -gcflags="-m" ./...
```

Pistas comuns para escape:

- retornar ponteiro para variável local;
- passar valor para função `interface{}` (boxing);
- closure capturando variável referenciada após o return;
- slice cresce além do tamanho conhecido em compile-time.

Otimização **honesta**: rode benchmark com `b.ReportAllocs()`, identifique alocação cara, inspecione `-gcflags=-m`, mude o código, valide. Otimizar sem medir é folclore.

## Garbage Collector

GC do Go é concurrent mark-sweep, não-generacional, com STW pausa típica < 1ms em apps bem comportados. Sintonia importante:

- **`GOGC`** (default 100): trigger relativo ao heap vivo. `GOGC=200` adia GC, gasta mais memória. `GOGC=off` desliga (não use em produção).
- **`GOMEMLIMIT`** (Go 1.19+): limite de memória soft. Em container, **sempre** defina junto do `GOMAXPROCS`.

Sem `GOMEMLIMIT` em container Kubernetes, o GC pode não acompanhar a pressão e o pod morre OOM antes do scaling reagir.

`GOMAXPROCS` em container: use `automaxprocs` (Uber) ou Go 1.25+ que detecta cgroups automaticamente. Sem isso, o runtime acha que tem 96 CPUs no nó e cria contention absurda.

## Channels por dentro

Channel é um buffer circular protegido por mutex + filas de senders e receivers bloqueados. Send em canal cheio (ou unbuffered sem receiver pronto) parqueia a goroutine; receive de canal vazio idem.

| Operação | Custo aproximado |
|---|---|
| Send em canal com buffer livre | ~70ns |
| Send com handoff para receiver pronto | ~120ns |
| Send que bloqueia | depende do scheduler |

Quando usar mutex em vez de channel:

- proteger leitura/escrita de struct compartilhada — mutex.
- transferir trabalho entre estágios — channel.
- sinalização (one-shot ou broadcast) — `chan struct{}` fechado.

Pergunta clássica: "Diferença entre send em canal nil, canal fechado, canal cheio". Send em **nil** bloqueia para sempre. Send em canal **fechado** dá panic. Send em canal **cheio** bloqueia até abrir espaço ou contexto cancelar.

## sync.Mutex vs sync.RWMutex

`RWMutex` permite N leitores OU um escritor. Custa mais por operação que `Mutex`.

Regra prática: use `RWMutex` só quando:

- leituras dominam claramente (>10x escritas);
- a região crítica é cara o bastante para amortizar o overhead.

Para hot paths curtos, `Mutex` simples é mais rápido por menor contention de cache lines.

`sync.Map` brilha em **dois** padrões: append-only ou keys disjuntas por goroutine. Para o resto, `map + Mutex` ou `map + RWMutex` ganha em previsibilidade.

## Memory model resumido

Go tem memory model formal desde 1.19. Em prática:

- canal e `sync` (Mutex, WaitGroup, atomic) são os únicos **happens-before** confiáveis;
- ler/escrever a mesma variável de duas goroutines sem sincronização é **data race** — comportamento indefinido, mesmo se "parecer funcionar".

`go test -race` é obrigatório em CI.

## Errors idiomáticos

```go
var ErrNotFound = errors.New("not found")

func FindUser(id string) (User, error) {
    u, err := repo.Get(id)
    if err != nil {
        return User{}, fmt.Errorf("find user %s: %w", id, err)
    }
    return u, nil
}

if errors.Is(err, ErrNotFound) { ... }

var pgErr *pgconn.PgError
if errors.As(err, &pgErr) && pgErr.Code == "23505" { ... }
```

Trade-off comum: sentinels (`errors.New`) vs structured (`type *MyError struct`). Sentinels para erros sem contexto extra, structured quando precisa carregar campos. **`errors.Join`** (1.20+) para múltiplos erros.

## context.Context: o que esperar em entrevista

- propagação de cancel/deadline/values;
- nunca armazenar `Context` em struct;
- nunca passar `nil` — use `context.Background()` ou `context.TODO()`;
- `context.WithValue` é para request-scoped data (request id, user) — não para passar argumentos;
- `Done()` retorna canal que fecha em cancel/timeout — receba em `select` em qualquer loop bloqueante.

## System design com Go: questões frequentes

### "Desenhe um shortener de URL processando 100k req/s"

Pontos esperados:

- Go HTTP serve 100k req/s num node decente — bottleneck é storage;
- write path: gerar shortcode (base62 de id sequencial vs hash), Postgres como source of truth;
- read path: Redis cache (TTL longo, invalidação quase nunca), CDN para hot keys;
- ID generation: snowflake-like ou Postgres sequence + base62 — mostrar trade-off de fragmentação;
- replicação read-only para leitura;
- shard se write virar gargalo (raro nesse caso).

### "Desenhe um sistema de pagamentos em Go"

Pontos esperados:

- idempotência obrigatória — chave por request, hash do payload;
- outbox pattern para eventos pós-pagamento;
- circuit breaker por gateway externo;
- retry com backoff só onde idempotente;
- timeout em cada camada;
- audit imutável (event log);
- isolation level adequado — `READ COMMITTED` default, `SERIALIZABLE` em path crítico se necessário;
- reconciliação contra extrato do banco (job noturno).

### "Quando você escolheria Go vs Node/Python?"

Não responda "Go é mais rápido". Responda em termos de:

- tipo de workload (CPU-bound concorrente, I/O-bound, ML, scripting);
- ecossistema disponível (libs maduras pro problema);
- time atual (curva de aprendizado, contratação);
- operação (binário único vs runtime, footprint de memória);
- latência aceitável (p99).

## Live coding: como conduzir

1. **Esclareça antes de escrever**: input, output, restrições, escala.
2. **Solução naive primeiro**: passa, é correta.
3. **Análise**: O grande de tempo, alocação, concorrência.
4. **Otimize com motivo**: "agora que sabemos que vira gargalo aqui, troco struct".
5. **Teste enquanto pensa**: `go test` mental ou rabiscado.
6. **Comente trade-off** que ficou de fora ("não cobri retry porque assumi single-call").

Erros comuns: pular para otimização, escrever sem testar, não verbalizar pensamento. Live coding é entrevista de comunicação tanto quanto de código.

## Banco de respostas STAR

Tenha 4-5 histórias prontas, cada uma cobrindo:

- **Incidente em produção**: o que falhou, como diagnosticou, o que mudou.
- **Refatoração grande**: por que fez, como derisicou, resultado mensurável.
- **Decisão arquitetural com trade-off**: opções consideradas, critério, consequência.
- **Conflito técnico**: divergência com colega, como resolveu sem ego.
- **Mentoria**: como ajudou alguém a crescer, o que aprendeu de volta.

Estrutura **STAR**: Situation, Task, Action, Result. 90 segundos cada. Pratique em voz alta — texto na tela engana.

## Perguntas pra fazer ao entrevistador

- "Como vocês medem qualidade do código que entra em main?"
- "Qual incidente recente moldou a arquitetura atual?"
- "Como é o ciclo de feedback de prod pra dev — alerta, postmortem, mudança?"
- "O que diferencia sênior de staff aqui na prática?"
- "Onde Go custa mais a vocês hoje? Build, ops, contratação?"

Boas perguntas mostram que você pensa em sistema, não só em ticket.

## Critério de domínio

Você está pronto para entrevista Go sênior quando consegue, em 5 minutos, explicar GOMAXPROCS+GOMEMLIMIT em container, escolher entre channel e mutex com justificativa, contar uma história de incidente em formato STAR e listar três trade-offs reais entre Go e o stack alternativo que conheceu — sem ler de cola.
