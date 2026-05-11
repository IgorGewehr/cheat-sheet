---
title: "Entrevista Sênior Spring + Kotlin: JVM Internals, Padrões, STAR"
category: craft
stack: [Spring Boot, Kotlin, JVM]
tags: [entrevista, senior, jvm, kotlin, spring, system-design, star]
excerpt: "Preparação para entrevista sênior de Spring Boot + Kotlin em Big Tech, governo e enterprise: JVM internals, classpath, GC, JPA pitfalls, system design e banco STAR — sem decoreba."
related: [entrevista-algoritmos, spring-microservices-enterprise, spring-performance-jvm-tuning]
updated: "2026-05-11"
---

## Pirâmide da entrevista sênior

1. **Linguagem & JVM**: Kotlin idiomático, JVM internals, GC, concorrência.
2. **Spring profundo**: lifecycle, transactions, AOP, JPA, configuração.
3. **Banco**: indexes, transações, N+1, locks, modelagem.
4. **Arquitetura**: hexagonal, DDD, microsserviços, padrões de integração.
5. **System Design**: escala, consistência, trade-offs.
6. **Soft skills**: STAR, decisões de carreira, liderança técnica.

Sênior raramente é reprovado por algoritmos (LeetCode médio basta). É reprovado por **não articular trade-offs**, **não explicar decisão de arquitetura**, **não saber dizer "depende, porque..."**.

## Bloco 1: Kotlin & JVM

**Q: Diferença entre `val` e `var` e implicações para concorrência?**

`val` é binding imutável (referência não muda; objeto interno pode ser mutável se for `MutableList`). `var` muta. Em concorrência, `val` + estrutura imutável é thread-safe; `var` ou `val MutableList` precisa de sync ou estruturas concorrentes (`AtomicReference`, `ConcurrentHashMap`).

**Q: O que é `inline class` / `@JvmInline value class`?**

Wrapper de tipo único, **zero overhead em runtime** (compilador unboxa). `value class CPF(val v: String)` é `String` em bytecode, mas com tipo distinto no código. Útil para evitar passar CPF onde se espera CNPJ.

**Q: Coroutines vs Virtual Threads?**

Coroutines são suspend functions com structured concurrency, compostas (Flow, supervisorScope). Virtual Threads (JDK 21) são threads gerenciadas pela JVM que não bloqueiam OS thread. Ambas atendem I/O-bound. Coroutines têm composição superior; Virtual Threads são drop-in (código bloqueante existente). Em projeto novo, ambas funcionam; coroutines ganham em modelagem de fluxos complexos.

**Q: Como funciona o GC G1 em alta cardinalidade de alocação?**

G1 divide heap em regiões. Pausa curta para survivor copy/old promotion. Em alta alocação, "evacuation failure" pode acontecer (não tem espaço pra mover); G1 estende pause. Métricas: `jvm_gc_pause_seconds`, `g1_full_collection_count`. Mitigação: aumentar heap, mudar para ZGC, perfil de alocação com JFR.

**Q: Como detecta memory leak em produção?**

Sintoma: `used` cresce até OOM. Heap dump em `OutOfMemoryError` (`-XX:+HeapDumpOnOutOfMemoryError`). Analisa com Eclipse MAT ou VisualVM: dominator tree mostra qual objeto segura o heap. Causa comum: cache sem TTL, `ThreadLocal` não limpo, listener não desregistrado, GC root acidental.

## Bloco 2: Spring profundo

**Q: O que acontece quando você chama método `@Transactional` de outro método na mesma classe?**

Self-invocation gotcha. Spring AOP gera proxy; chamada interna passa pelo `this` direto, **ignora proxy**, transação não abre. Solução: injetar o próprio bean, mover método pra bean separado, ou `TransactionTemplate`.

**Q: Diferença entre `@Component`, `@Service`, `@Repository`, `@Controller`?**

Tecnicamente todos registram bean. Semanticamente:
- `@Repository` adiciona translation de exceptions de persistência;
- `@Controller` + `@RestController` são detectados por dispatcher web;
- `@Service` é convenção semântica.

Use o mais específico — facilita leitura.

**Q: `@Transactional(propagation = REQUIRES_NEW)` — quando?**

Auditoria ou logging que deve persistir mesmo se TX principal sofrer rollback. Sempre faça via outro bean (self-invocation).

**Q: Spring Boot 3 trouxe quais mudanças importantes?**

- Java 17 mínimo;
- migração para Jakarta EE (javax → jakarta);
- Observation API unificada (substitui Sleuth);
- AOT processing (suporte GraalVM nativo);
- HTTP Interface declarativa (`@HttpExchange`);
- ProblemDetail RFC 7807 nativo.

## Bloco 3: Banco

**Q: O que é N+1 e como detecta?**

1 query inicial + N queries lazy. Detecta com: log de SQL (`org.hibernate.SQL=DEBUG`), ferramenta como `hypersistence-utils`, assert de count em teste de integração. Mitigação: fetch join, `@EntityGraph`, `@BatchSize`, projection DTO.

**Q: Diferença entre lock otimista e pessimista?**

Otimista: `@Version`, conflito → `OptimisticLockException`, retry. Use quando conflito é raro. Pessimista: `SELECT FOR UPDATE`, outras TXs esperam. Use em hot path com alta contenção (decremento de saldo).

**Q: Como faz uma migration zero-downtime?**

Múltiplos deploys com schema backward-compatible. Adicionar coluna: nullable primeiro, deploy app que escreve, backfill, ALTER NOT NULL. Remover coluna: deploy app que NÃO usa, esperar rollout, drop. Renomear: adicionar nova, dual-write, dual-read, switch, drop antiga.

**Q: Quando usar índice em coluna?**

Coluna em `WHERE`, `JOIN`, `ORDER BY` de query frequente. Avalie com `EXPLAIN ANALYZE`. Custo: escritas mais lentas, espaço. Índice composto: ordem importa (mais seletivo primeiro). Índice parcial: filtro como `WHERE deleted_at IS NULL`. PG: BTREE default, GIN para JSONB/full-text, BRIN para tabela enorme com correlação.

## Bloco 4: Arquitetura

**Q: Quando você usaria arquitetura hexagonal?**

Quando domínio é complexo (lógica de negócio rica, regras intricadas) e você quer testabilidade isolada + flexibilidade de infra (trocar DB, broker). Pago com mais módulos e mapping. Não vale em CRUD trivial.

**Q: Microsserviços vs monolito modular?**

Monolito modular: mesmo deploy, fronteira lógica, transação local. Microsserviços: deploy independente, escala independente, autonomia de time. Custos de microsserviço: complexidade operacional 10×, eventual consistency, debug distribuído. Comece com monolito; divida quando dor real aparece.

**Q: Saga vs 2PC?**

2PC (XA Transactions): coordenador trava todos os participantes; lento, frágil, não-particionável. Saga: cada step é local + compensação se algum falha. Eventual consistency. Use Saga em microsserviços.

**Q: Outbox pattern — por quê?**

Para publicar evento + atualizar DB atomicamente. TX local INSERT outbox + UPDATE pedido. Relay (poller ou Debezium) publica no broker depois. Sem isso, perda de evento ou inconsistência.

## Bloco 5: System Design

**Q: Desenhe um sistema de notificações para 10 milhões de usuários.**

Componentes:
- API REST para criar notificação;
- Kafka topic `notification.created`;
- Consumer fan-out: email, push, SMS;
- Provedores externos (SendGrid, FCM, Twilio);
- Rate limit por usuário (Redis);
- Outbox pattern entre API e Kafka;
- DLQ para falhas terminais;
- Dashboard de status.

Considere:
- prioridade (transacional vs marketing);
- preferências do usuário (opt-out);
- janela de envio (não enviar 3h da manhã);
- métricas (taxa de entrega, abertura);
- cost control.

**Q: Como cachear dado que pode estar stale por até 5s?**

Cache-aside com TTL=5s. Hit retorna cached, miss busca + popula. Invalidação em write (`@CacheEvict`). Se múltiplos pods, cache externo (Redis). Sem stampede: use lock distribuído ou `singleflight` (uma chamada faz, outras aguardam o resultado).

## Bloco 6: STAR

**Banco mínimo de 7 histórias preparadas**:

1. **Incidente em produção** (situação grave, ação rápida, lição aprendida).
2. **Decisão técnica difícil** (escolha entre 2-3 opções, justificativa, resultado).
3. **Conflito com colega/time** (resolução madura, sem culpado).
4. **Erro pessoal e correção** (humildade + crescimento).
5. **Liderança técnica** (mentoria, conduzir projeto, alinhar time).
6. **Projeto de impacto** (problema, abordagem, resultado mensurável).
7. **Aprender algo novo rápido** (necessidade, processo, aplicação).

Estrutura STAR:
- **S**ituation: contexto, 1-2 frases.
- **T**ask: seu papel, o que precisava ser feito.
- **A**ction: o QUE você fez (em primeira pessoa).
- **R**esult: resultado mensurável + lição.

**Cuidado**: não roube crédito do time, mas use "eu" para suas ações. "Nós entregamos" é vago; "eu propus, conduzi a revisão técnica" é claro.

## Perguntas para você fazer ao entrevistador

Sênior sempre pergunta. Top 5:

1. "Como vocês escolhem entre monolito modular e microsserviços?"
2. "Como é o ciclo de feedback de produção pra dev? (logs, alertas, métricas)"
3. "Conta de uma decisão técnica difícil que o time tomou recentemente."
4. "Como é o on-call rotation? E o postmortem após incidente?"
5. "Qual a maior dor técnica do time agora?"

A última costuma revelar muito.

## Estudo prático antes da entrevista

- **JVM internals**: leia "Java Performance: The Definitive Guide" (Scott Oaks), capítulos sobre GC e JIT.
- **Spring deep dive**: docs oficiais Spring 6 + Spring Boot 3. Conceito chave: ApplicationContext lifecycle.
- **Kotlin idiomático**: leia código aberto bom (Ktor, Exposed, Spring Kotlin DSL). Veja como sealed/extension são usadas.
- **System design**: "Designing Data-Intensive Applications" (Martin Kleppmann) — leitura obrigatória.
- **Banco**: "PostgreSQL Internals" (Egor Rogov) — entender MVCC, WAL, locks.
- **Pratique**: mock interview com colega ou ferramenta. Articule pensando em voz alta.

## Anti-padrões na entrevista

1. **Dar resposta sem perguntar contexto**: sênior sempre clarifica antes.
2. **"Pra performance" como justificativa sem medir**: sênior fala em medição, não fé.
3. **"Use microsserviço sempre"**: você não vai passar.
4. **Trash talk de stack/empresa anterior**: vermelhão imediato.
5. **Não saber dizer "não sei"**: melhor "não sei, mas pesquisaria começando por..." que inventar.

## Critério de domínio

Você dominou este card quando consegue: articular trade-offs em vez de receita; ter 7 histórias STAR ensaiadas em 90s cada; explicar 5 sub-sistemas de qualquer system design pedido; fazer perguntas substantivas ao entrevistador; e responder "depende, porque..." em vez de afirmação categórica em pergunta de design.
