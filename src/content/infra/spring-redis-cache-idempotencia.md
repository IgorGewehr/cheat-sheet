---
title: "Spring + Redis: Cache, Distributed Locks, Idempotency"
category: infra
stack: [Spring Boot, Kotlin, Redis, Redisson]
tags: [redis, cache, distributed-lock, idempotency, rate-limit, lettuce]
excerpt: "Redis em Spring com cautela sênior: Spring Data Redis (Lettuce), @Cacheable que NÃO destrói consistência, Redisson para locks distribuídos com cuidado e idempotency keys de verdade."
related: [spring-kafka-rabbitmq, caching-layers, rate-limit-distribuido]
updated: "2026-05-11"
---

## Quando usar Redis (e quando não)

Use Redis para:
- **cache de leitura** que pode ser stale por segundos;
- **idempotency keys** de endpoints sensíveis;
- **rate limit** distribuído;
- **session store** centralizado;
- **lock distribuído pontual** (cuidado!);
- **counters** de alta volumetria.

NÃO use Redis para:
- **fonte da verdade** de dado importante (Redis cai, dado some);
- **fila de tarefas crítica** (use SQS / Kafka / RabbitMQ);
- **lock distribuído como fundação de correção** (algoritmo Redlock tem críticas válidas).

## Setup

```kotlin
implementation("org.springframework.boot:spring-boot-starter-data-redis")
implementation("io.lettuce:lettuce-core")
implementation("org.redisson:redisson-spring-boot-starter:3.34.1")
```

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      timeout: 2s
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
          min-idle: 2
```

## Cache com @Cacheable

```kotlin
@Configuration
@EnableCaching
class CacheConfig {

    @Bean
    fun cacheManager(connectionFactory: RedisConnectionFactory): CacheManager {
        val defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5))
            .serializeValuesWith(SerializationPair.fromSerializer(GenericJackson2JsonRedisSerializer()))
            .disableCachingNullValues()

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withCacheConfiguration("produtos", defaultConfig.entryTtl(Duration.ofMinutes(30)))
            .withCacheConfiguration("usuarios", defaultConfig.entryTtl(Duration.ofMinutes(1)))
            .build()
    }
}

@Service
class ProdutoService(private val repo: ProdutoRepository) {

    @Cacheable(cacheNames = ["produtos"], key = "#id")
    fun buscar(id: String): Produto? = repo.findById(id)

    @CacheEvict(cacheNames = ["produtos"], key = "#produto.id")
    fun atualizar(produto: Produto) = repo.save(produto)

    @CacheEvict(cacheNames = ["produtos"], allEntries = true)
    fun importarLote(produtos: List<Produto>) {
        repo.saveAll(produtos)
    }
}
```

**Pegadinha 1**: `@Cacheable` em método private/final não funciona (AOP). Plugin `kotlin-spring` abre classes.

**Pegadinha 2**: chamada interna não passa pelo proxy. `this.buscar(id)` ignora cache. Use bean separado ou `ApplicationContext`.

**Pegadinha 3**: cache de `null` pode dar amplificação de query (1000 cache misses por ID inexistente). `disableCachingNullValues()` evita, mas então perde benefício de "negative caching". Decida com base no padrão de acesso.

## TTL Strategy

Cache sem TTL é vazamento de memória. Estratégias:

| Estratégia | Quando |
|---|---|
| TTL curto (30s-5min) | dado que muda; tolere staleness pequeno |
| TTL longo (1h-1d) | dado quase imutável (catálogo, código de país) |
| Sem TTL + invalidação manual | difícil; só se você controla todas as escritas |
| Versão no key (`produto:v3:123`) | invalidação massiva por mudança de schema |

## Cache Patterns

**Cache-aside** (pull, mais comum):

```kotlin
fun buscar(id: String): Produto {
    return redis.get(id)
        ?: repo.findById(id)?.also { redis.put(id, it, ttl) }
        ?: throw NotFoundException()
}
```

**Write-through**: escreve em cache antes de DB. Garante consistência mas dobra latência de write.

**Write-behind**: escreve em cache, DB depois. Risco de perda se Redis cai.

**Read-through**: cache transparente, biblioteca busca no DB sozinha em miss.

**Recomendação default**: cache-aside com TTL + invalidação em write. Simples e seguro.

## Idempotency Keys

Cliente pode retentar POST por timeout. Você não quer cobrar 2×.

```kotlin
@RestController
class PagamentoController(
    private val redis: StringRedisTemplate,
    private val pagar: ProcessarPagamentoUseCase,
) {

    @PostMapping("/pagamentos")
    fun pagar(
        @RequestHeader("Idempotency-Key") key: String,
        @Valid @RequestBody req: PagamentoRequest,
    ): ResponseEntity<PagamentoResponse> {
        val redisKey = "idempotency:pagamento:$key"

        // SETNX: só seta se não existe
        val locked = redis.opsForValue().setIfAbsent(redisKey, "processing", Duration.ofMinutes(10))
        if (locked != true) {
            // já processado ou em andamento — busca resultado cacheado
            val cached = redis.opsForValue().get("$redisKey:result")
                ?: return ResponseEntity.status(HttpStatus.CONFLICT).build()
            return ResponseEntity.ok(jackson.readValue(cached))
        }

        return try {
            val resp = pagar.executar(req.toCommand()).toResponse()
            redis.opsForValue().set("$redisKey:result", jackson.writeValueAsString(resp), Duration.ofDays(1))
            ResponseEntity.status(HttpStatus.CREATED).body(resp)
        } catch (e: Exception) {
            redis.delete(redisKey)  // libera para retry
            throw e
        }
    }
}
```

A chave de idempotência:
- vem do cliente (UUID gerado por ele);
- vale por tempo razoável (1 dia = bom default);
- retorna a **mesma resposta** se chamado de novo;
- libera a chave se a primeira chamada falhou (cliente decide retry).

## Distributed Locks com Redisson

**Aviso**: distributed lock é difícil. Use só quando outras opções (otimismo, particionamento por key) não servem. Martin Kleppmann tem [crítica famosa](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) ao Redlock.

```kotlin
@Service
class ImportarLoteService(private val redisson: RedissonClient) {

    fun importar(loteId: String) {
        val lock = redisson.getLock("import:$loteId")

        if (!lock.tryLock(0, 30, TimeUnit.SECONDS)) {
            throw LoteJaProcessandoException(loteId)
        }

        try {
            // ... processa
        } finally {
            if (lock.isHeldByCurrentThread) lock.unlock()
        }
    }
}
```

Cuidados:
- `tryLock(waitTime, leaseTime, unit)`: lease deve ser **maior que o trabalho esperado**, mas curto suficiente pra liberar em crash.
- Sempre `try/finally`.
- Não use lock para correctness crítica (transferência financeira). Use TX otimista do DB.

## Rate Limit (token bucket)

```kotlin
@Component
class RateLimiter(private val redisson: RedissonClient) {

    fun permitir(userId: String, limitePorMinuto: Int): Boolean {
        val limiter = redisson.getRateLimiter("rate:$userId")
        limiter.trySetRate(RateType.OVERALL, limitePorMinuto.toLong(), 1, RateIntervalUnit.MINUTES)
        return limiter.tryAcquire(1)
    }
}

// uso no filter:
@Component
class RateLimitFilter(private val limiter: RateLimiter) : OncePerRequestFilter() {
    override fun doFilterInternal(req: HttpServletRequest, resp: HttpServletResponse, chain: FilterChain) {
        val userId = req.userPrincipal?.name ?: req.remoteAddr
        if (!limiter.permitir(userId, 100)) {
            resp.status = 429
            resp.writer.write("""{"error":"rate limit exceeded"}""")
            return
        }
        chain.doFilter(req, resp)
    }
}
```

Alternativas mais robustas: [Bucket4j](https://bucket4j.com/) ou [Resilience4j RateLimiter](https://resilience4j.readme.io/) — mais maduros para este caso de uso.

## Pub/Sub (limitações)

Redis Pub/Sub é **fire-and-forget**: sem persistência, sem replay, sem garantia de entrega. Use para **notificação efêmera** (invalidar cache em todos os pods), não para evento de domínio.

Para evento de domínio confiável: Kafka, RabbitMQ.

Para invalidação de cache:

```kotlin
@Service
class CacheInvalidator(private val redis: StringRedisTemplate) {
    fun invalidar(chave: String) {
        redis.convertAndSend("cache-invalidation", chave)
    }
}

@Component
class CacheInvalidationListener(private val cache: CacheManager) : MessageListener {
    override fun onMessage(message: Message, pattern: ByteArray?) {
        val chave = String(message.body)
        cache.getCache("produtos")?.evict(chave)
    }
}
```

## Anti-padrões

1. **Cache de dado crítico sem TTL**: stale forever. Bug em produção difícil de pegar.
2. **`@Cacheable` em método com side effect**: cache esconde a chamada; side effect some.
3. **Lock distribuído pra tudo**: pessimismo desnecessário; otimismo + retry geralmente serve.
4. **Idempotency key gerada pelo servidor**: defeita o propósito. Cliente gera, servidor honra.
5. **Redis como fonte da verdade**: SLA do Redis < SLA do PG. Replicar é trabalhoso.

## Critério de domínio

Você dominou este card quando consegue: configurar `CacheManager` com TTL por cache; explicar cache-aside vs write-through; implementar idempotency key correta (com SETNX + resultado cacheado); usar Redisson lock com lease apropriado; e listar 3 cuidados em lock distribuído.
