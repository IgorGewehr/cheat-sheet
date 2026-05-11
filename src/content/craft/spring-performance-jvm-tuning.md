---
title: "Spring + JVM Performance: GC, JFR, Profiling, HikariCP"
category: craft
stack: [Spring Boot, Kotlin, JVM, Hibernate, HikariCP]
tags: [jvm, gc, performance, jfr, async-profiler, hikaricp, profiling]
excerpt: "Performance JVM em Spring Boot: GC G1/ZGC/Shenandoah, JFR sem custo em prod, async-profiler, escape analysis, HikariCP tuning e ferramentas que separam quem chuta de quem mede."
related: [spring-observability-micrometer-otel, spring-data-jpa]
updated: "2026-05-11"
---

## Filosofia

Tuning sem medir é fé. **Profile primeiro**. As otimizações abaixo são para depois que você identificou um bottleneck real — não receita preventiva.

## GC: escolher o coletor

JDK 21 oferece:

| GC | Para | Pause típica |
|---|---|---|
| **G1** (default) | heap <16GB, latência razoável | 10-100ms |
| **ZGC** | heap grande (até TB), latência crítica | <1ms |
| **Shenandoah** | similar a ZGC, alternativa Red Hat | <10ms |
| **Parallel** | throughput máximo, batch | 100ms-1s |
| **Serial** | apps pequenas, baixa memória | depende |

Como ligar:

```bash
-XX:+UseG1GC                # default
-XX:+UseZGC                 # JDK 15+
-XX:+UseShenandoahGC        # builds OpenJDK com Shenandoah
```

**Regra default**: deixe G1. Mude só se métrica mostrar problema concreto.

## Tamanho de heap

```bash
java -Xms2g -Xmx2g -jar app.jar
```

Em K8s:

```yaml
env:
  - name: JAVA_TOOL_OPTIONS
    value: "-XX:MaxRAMPercentage=75 -XX:InitialRAMPercentage=50"
resources:
  limits:
    memory: 1Gi
```

Use `MaxRAMPercentage` (não `Xmx`) em container — a JVM respeita `cgroup` limits automaticamente.

**Heap pequeno**: GC frequente, possível OOM.
**Heap grande**: pauses longas no G1; ZGC mitiga.

## JFR: profiling em produção

Java Flight Recorder é **incluído na OpenJDK desde JDK 11**, baixo overhead (~1-2%), pronto para prod:

```bash
# coleta de 5 min
jcmd <pid> JFR.start name=profile duration=5m filename=/tmp/profile.jfr
```

Em K8s:

```yaml
livenessProbe:
  exec:
    command: ["sh", "-c", "jcmd 1 JFR.start name=continuous"]
```

Ou via property:

```bash
-XX:StartFlightRecording=duration=5m,filename=/var/log/jfr/profile.jfr
```

Analise com **JDK Mission Control** (`jmc`) ou converta com `jfr summary profile.jfr`.

JFR captura:
- alocação por tipo;
- métodos hot (CPU samples);
- pause de GC;
- contention de lock;
- I/O timings.

## async-profiler

Para profile detalhado (não nativo OpenJDK, mas excelente):

```bash
./profiler.sh -d 30 -f profile.html <pid>
```

Gera flame graph interativo. **Use em staging idêntico a prod**, não em prod (overhead até 5%).

CPU flame graph mostra **onde tempo é gasto**. Alocação mostra **o que está pressionando GC**.

## Hibernate / JPA: armadilhas comuns

1. **N+1** (já visto no card JPA): fetch join, EntityGraph, batch.
2. **Cache de segundo nível ativo sem necessidade**: `hibernate.cache.use_second_level_cache=false` por default.
3. **`@OneToMany(fetch = EAGER)`**: trava todas as queries com fetch grande.
4. **PersistenceContext gigante em batch**:

```kotlin
@Transactional
fun importar(items: List<Item>) {
    items.forEachIndexed { i, item ->
        repo.save(item)
        if (i % 100 == 0) {
            entityManager.flush()
            entityManager.clear()
        }
    }
}
```

Sem flush+clear, todos os 100k items ficam na memory PersistenceContext.

5. **`saveAndFlush` em loop**: 1 flush por item; faça flush 1× no fim.

## HikariCP: pool de conexão

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 5000     # ms
      idle-timeout: 300000          # 5min
      max-lifetime: 1800000         # 30min
      leak-detection-threshold: 30000  # 30s — alerta se conexão pendurada
```

Como calcular `maximum-pool-size`:

> connections = ((core_count * 2) + effective_spindle_count)

Para PG, valor típico **5-20** por instância de app. Mais que isso geralmente é piora. Postgres não escala bem com 200 conexões — coloque PgBouncer.

**Sinal de pool exausto**: requests aguardando connection → latência alta sem CPU/IO alto. Hikari métrica:

```text
hikaricp_connections_active = max
hikaricp_connections_pending > 0
hikaricp_connections_timeout_total > 0
```

## JIT e escape analysis

```bash
-XX:+PrintCompilation        # ver o que JIT compila
-XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining   # ver inlining
```

Compilation é boa: método quente vira código nativo otimizado. Mas:

- **Após N invocações**, método chega em "C2 tier" (otimização agressiva).
- **Após muitas mudanças de tipo** (megamorphic call site), JIT desiste de inline.
- **Allocation**: escape analysis pode alocar objeto em stack em vez de heap se ele não escapa o método.

Cuidados:
- Não force `inline` em Kotlin sem motivo. Em hot path com lambdas, sim.
- `data class` em hot path pode dobrar alocações; use objetos primitivos ou `value class`.

## Async / corrotinas / virtual threads

Em CPU-bound (cálculo), corrotinas/virtual threads não ajudam — número de núcleos é o teto.

Em I/O-bound (Read DB, HTTP):
- **Virtual Threads (JDK 21)**: sem reescrita; threads cooperativas;
- **Corrotinas**: melhor design composicional, suspend nativo;
- **Reactive (Flux/Mono)**: mais throughput em I/O massivo, mais complexidade.

Para a maioria dos backends Spring em 2026: **virtual threads + suspend onde faz sentido**.

## Connection do JDBC: read-only flag

```kotlin
@Transactional(readOnly = true)
fun listar(): List<Pedido> = ...
```

Hibernate pula dirty checking, e o JDBC driver pode rotear pra réplica. Em query massiva, ganho real.

## Native compilation (GraalVM)

Spring Boot 3 + GraalVM compila pra binário nativo:

- **start-up <100ms** vs 3-5s em JVM normal;
- **memória <200MB** vs 500MB+;
- **sem JIT warmup**: a primeira request já é rápida.

Custos:
- compilação lenta (3-10min);
- algumas libs não compilam (reflection nativa);
- runtime menos otimizado em hot path longo (sem JIT).

Vale para **serviços que escalam horizontalmente** (lambdas, K8s autoscaler reagindo a tráfego). Não vale para app monolítico que fica 24h up.

## Métricas para monitorar

| Métrica | Alarme se |
|---|---|
| `jvm_memory_used / jvm_memory_max` | >85% sustentado |
| `jvm_gc_pause_seconds` p99 | >100ms |
| `process_cpu_usage` | >80% sustentado |
| `hikaricp_connections_pending` | >0 sustentado |
| `http_server_requests_seconds` p99 | acima SLO |
| `jvm_threads_states{state="WAITING"}` | crescendo sem cair |

Tem essas, descobre 95% dos problemas antes do cliente.

## Anti-padrões

1. **Tuning GC sem medir**: você adicionou XX:+UseG1GC já existente como default. Inútil.
2. **Pool grande "por garantia"**: 200 conexões = Postgres morrendo.
3. **Profile em dev local**: comportamento diferente; profile em staging.
4. **Async pra tudo**: complexidade > benefício em CRUD simples.
5. **Cache de segundo nível JPA em multi-instance**: invalidação cross-pod é receita de bug.

## Critério de domínio

Você dominou este card quando consegue: rodar JFR e abrir no JMC; calcular tamanho de pool HikariCP; explicar diferença entre G1 e ZGC; identificar PersistenceContext gigante; e listar 5 métricas pra alarmar em produção.
