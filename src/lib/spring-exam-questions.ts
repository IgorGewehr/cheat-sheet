// Questões do exame Spring Boot + Kotlin por tier.
// Avaliação por IA, rubrica sênior, sem floreio.

export type QuestionType = "code-review" | "short-answer" | "multiple-choice";

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  code?: string; // bloco de código para code-review
  choices?: string[]; // somente para multiple-choice
  rubric: string; // critério de avaliação que vai pro prompt da IA
  weight?: number; // default 1, peso na nota agregada
}

export interface ExamTier {
  tier: 1 | 3 | 5;
  title: string;
  description: string;
  passThreshold: number; // 0-100, nota mínima para aprovação
  questions: ExamQuestion[];
}

const TIER_1_EXAM: ExamTier = {
  tier: 1,
  title: "Exame Tier 1 — Kotlin & Spring Boot Essentials",
  description:
    "Validação de fundamentos: Kotlin idiomático (null-safety, sealed, when), Spring Boot (auto-config, beans, profiles), Spring Web (Controllers, ProblemDetail), Validation Jakarta com @field: e Testing (Kotest/MockK). Aprovação ≥ 70.",
  passThreshold: 70,
  questions: [
    {
      id: "t1-q1",
      type: "code-review",
      prompt:
        "Aponte TODOS os problemas neste controller Spring + Kotlin. Estima-se 5 ou mais. Para cada problema, dê a correção em 1 linha.",
      code: `@RestController
@RequestMapping("/usuarios")
class UsuarioController {
    @Autowired lateinit var repo: UsuarioRepository

    @PostMapping
    fun criar(@RequestBody req: CriarUsuarioRequest): Any {
        val user = repo.save(UsuarioEntity(nome = req.nome, email = req.email, senha = req.senha))
        return user
    }

    @GetMapping("/{id}")
    fun buscar(@PathVariable id: Long) = repo.findById(id).get()
}

data class CriarUsuarioRequest(
    @NotBlank val nome: String,
    @Email val email: String,
    val senha: String,
)`,
      rubric:
        "Espera 5+: (1) @Autowired em field — usar constructor injection; (2) retorna Any/entidade JPA — usar Response DTO; (3) @NotBlank/@Email no construtor sem @field: — anotações ignoradas; (4) senha sem hash + sendo persistida + sendo retornada (vaza); (5) findById(id).get() — explode com NoSuchElementException em 404 — usar Optional/orElseThrow com 404 explícito; (6) sem @Valid no @RequestBody — validação não roda; (7) sem ResponseEntity, sem 201 + Location no POST; (8) ResponseEntity ausente. Sênior cita 6+. Pleno 4+. Júnior 3.",
      weight: 1.5,
    },
    {
      id: "t1-q2",
      type: "short-answer",
      prompt:
        "Em Kotlin, qual a diferença entre `data class CriarPedidoRequest(@NotBlank val clienteId: String)` e `data class CriarPedidoRequest(@field:NotBlank val clienteId: String)`? Por que isso importa em Spring Boot?",
      rubric:
        "Resposta correta: sem @field:, a anotação vai pro parâmetro do construtor primário, e Bean Validation lê do field/getter — fica silenciosamente ignorada. Com @field: a anotação é colocada no campo gerado. Em Spring, o resultado prático é que validação não roda — POST com clienteId vazio é aceito. Sênior também menciona @get: como alternativa e que isso é um dos bugs Kotlin+Spring mais comuns em produção.",
    },
    {
      id: "t1-q3",
      type: "code-review",
      prompt:
        "Este código tem múltiplos problemas em arquitetura, manipulação de erros e idiomas Kotlin. Liste 4+ problemas com correções.",
      code: `@Service
class PedidoService(val repo: PedidoRepository) {
    fun confirmar(id: Long): Pedido {
        val pedido = repo.findById(id).orElse(null)
        if (pedido != null) {
            try {
                pedido.status = "CONFIRMADO"
                return repo.save(pedido)
            } catch (e: Exception) {
                e.printStackTrace()
                throw RuntimeException("erro")
            }
        }
        throw RuntimeException("nao achou")
    }
}`,
      rubric:
        "Espera 4+: (1) `val repo` no construtor de @Service — funciona, mas idiomático Kotlin usa `private val`; (2) findById(id).orElse(null) com if/else — usar getOrNull() (Kotlin extension) ou getOrElse { throw }; (3) status como String é frágil — usar enum/sealed; (4) e.printStackTrace() em vez de logger SLF4J; (5) throw RuntimeException genérica sem tipo específico (deveria ser exceção de domínio); (6) catch Exception engole tudo, inclusive InterruptedException/Error; (7) mensagem 'erro' / 'nao achou' inútil — perde stack original. Sênior cita 5-6.",
      weight: 1.3,
    },
    {
      id: "t1-q4",
      type: "multiple-choice",
      prompt:
        "Quando você deve usar `@Transactional(propagation = Propagation.REQUIRES_NEW)` em vez do default `REQUIRED`?",
      choices: [
        "A) Sempre que possível, para isolar transações e melhorar performance.",
        "B) Em métodos que devem persistir mesmo se a transação principal der rollback (ex: auditoria de falha).",
        "C) Em qualquer chamada interna entre métodos do mesmo bean para evitar self-invocation gotcha.",
        "D) Em queries de leitura intensiva, para evitar lock contention.",
      ],
      rubric:
        "Resposta correta: B. Justificativa: REQUIRES_NEW suspende a TX atual e cria uma nova, comitando independente. Útil para auditoria, log de falha — o registro persiste mesmo se a TX principal rollback. (A) Errado: nova TX é cara, não é otimização default. (C) Errado: self-invocation é problema de AOP/proxy, REQUIRES_NEW não resolve (chamada interna nem passa pelo proxy). (D) Errado: leitura usa readOnly=true, não REQUIRES_NEW.",
    },
    {
      id: "t1-q5",
      type: "short-answer",
      prompt:
        "Explique o que `server.shutdown: graceful` faz no Spring Boot e por que isso é importante em Kubernetes. Cite o que precisa ser configurado no manifest do Pod.",
      rubric:
        "Resposta correta: graceful shutdown faz o Spring Boot parar de aceitar requests novos no SIGTERM e esperar os ativos terminarem por até `spring.lifecycle.timeout-per-shutdown-phase` (default 30s). Em K8s, sem isso, o pod corta requests no meio durante rollout e SLO vira piada. Manifest precisa: terminationGracePeriodSeconds maior que o timeout do Spring (ex: 60s); preStop hook com `sleep 10` para o load balancer ter tempo de remover endpoint antes do SIGTERM. Sênior menciona também que se a app não responde a SIGTERM, K8s manda SIGKILL após termination grace.",
    },
    {
      id: "t1-q6",
      type: "code-review",
      prompt:
        "Por que este teste é ruim? Liste 3+ problemas e proponha uma versão refatorada.",
      code: `@SpringBootTest
class PedidoControllerTest {
    @Autowired lateinit var mockMvc: MockMvc

    @Test
    fun test1() {
        val r = mockMvc.perform(post("/pedidos")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""{"clienteId":"C-1","itens":[{"sku":"S","quantidade":1}]}"""))
            .andReturn()
        assertThat(r.response.status).isEqualTo(201)
    }
}`,
      rubric:
        "Espera 3+: (1) @SpringBootTest carrega ApplicationContext inteiro — use @WebMvcTest para testar só o controller; (2) nome 'test1' inútil — usar nome semântico em backticks como `POST cria pedido e retorna 201`; (3) usa andReturn().response.status em vez do MockMvc DSL Kotlin (andExpect { status { isCreated() } }); (4) não verifica Location header em POST 201; (5) sem @MockkBean do use case — depende de schema/DB real; (6) AssertJ + MockMvc Java DSL em vez de Kotlin DSL. Sênior cita 4-5.",
      weight: 1.2,
    },
  ],
};

const TIER_3_EXAM: ExamTier = {
  tier: 3,
  title: "Exame Tier 3 — JPA, Arquitetura, Mensageria, gRPC",
  description:
    "Validação pleno-sênior: N+1, EntityGraph, Transactional pitfalls, hexagonal/DDD, Kafka idempotência, Resilience4j. Aprovação ≥ 70.",
  passThreshold: 70,
  questions: [
    {
      id: "t3-q1",
      type: "code-review",
      prompt:
        "Este código tem N+1 e outros problemas de JPA + Spring. Liste 5+ problemas com correção.",
      code: `@RestController
class PedidoController(val service: PedidoService) {
    @GetMapping("/pedidos")
    @Transactional
    fun listar(): List<PedidoEntity> {
        val pedidos = service.findAll()
        pedidos.forEach { println("pedido ${it.id} tem ${it.itens.size} itens") }
        return pedidos
    }
}

@Entity
data class PedidoEntity(
    @Id @GeneratedValue var id: Long? = null,
    @OneToMany(mappedBy = "pedido", fetch = FetchType.EAGER, cascade = [CascadeType.ALL])
    var itens: MutableList<ItemEntity> = mutableListOf(),
)`,
      rubric:
        "Espera 5+: (1) data class como @Entity — equals/hashCode por campos quebra PersistenceContext, usar class; (2) FetchType.EAGER em coleção @OneToMany — carrega tudo sempre, pior que lazy; (3) @Transactional em controller — TX longa segurando conexão durante serialização HTTP; (4) retornar entidade JPA do controller — lazy + Jackson explode com LazyInitializationException; (5) println em vez de logger SLF4J; (6) acesso a `itens.size` em loop = N+1 mesmo com EAGER ele já carregou demais; (7) sem paginação em endpoint /pedidos; (8) sem fetch join / EntityGraph adequado; (9) MutableList exposta direto (encapsulamento). Sênior cita 6-7.",
      weight: 1.5,
    },
    {
      id: "t3-q2",
      type: "short-answer",
      prompt:
        "Em Spring, você anota um método com `@Transactional` e ele é chamado de outro método do MESMO bean. A transação abre? Por quê? Como resolver?",
      rubric:
        "Resposta: NÃO abre. Spring AOP gera proxy CGLIB ou JDK dinâmico — a transação é interceptada quando o método é chamado VIA o proxy. Chamada interna `this.metodo()` pula o proxy e atinge a impl direta. Soluções: (1) mover o método para outro bean injetado; (2) injetar o próprio bean via `@Autowired private lateinit var self: MyService` (gambiarra); (3) usar TransactionTemplate programático; (4) `(applicationContext.getBean(MyService::class.java) as MyService).metodo()`. Sênior também menciona que @Transactional em método private/final nem é interceptado, e que plugin kotlin-spring abre classes Spring automaticamente.",
    },
    {
      id: "t3-q3",
      type: "code-review",
      prompt:
        "Este consumer Kafka tem 4+ problemas críticos em produção. Identifique e corrija.",
      code: `@KafkaListener(topics = ["pedido-criado"])
fun handle(@Payload evento: PedidoCriado) {
    val pedido = service.criar(evento.toCommand())
    notificacaoService.enviar(pedido)
    auditoria.registrar(pedido)
}`,
      rubric:
        "Espera 4+: (1) sem ack manual (assumindo ack-mode=manual_immediate na config) — Spring auto-ack pode comitar antes do processo terminar = mensagem perdida em crash; (2) sem idempotência — at-least-once duplica em retry; (3) sem try/catch ou error handler — exception para o consumer; (4) sem DLT/DLQ configurado para falha terminal; (5) sem MDC/correlation propagado do header Kafka — log perde rastro; (6) chamadas em cascata sem transaction boundary clara — meia operação em falha; (7) sem timeout / circuit breaker em chamadas externas (notificacao). Sênior cita 5+.",
      weight: 1.4,
    },
    {
      id: "t3-q4",
      type: "multiple-choice",
      prompt:
        "Você precisa publicar um evento Kafka 'PedidoConfirmado' atomicamente com o UPDATE no Postgres. O que faz?",
      choices: [
        "A) Configura `acks=all` + `enable.idempotence=true` no producer e chama kafka.send() dentro do método @Transactional após o save.",
        "B) Usa `@TransactionalEventListener(phase = AFTER_COMMIT)` para publicar no Kafka após commit.",
        "C) Implementa Outbox Pattern: insere na tabela `outbox` na mesma TX do save; relay (poller ou Debezium) publica no Kafka depois.",
        "D) Usa XA Transactions (2PC) entre Postgres e Kafka via JTA.",
      ],
      rubric:
        "Resposta correta: C. Justificativa: (A) acks=all + idempotence garante NÃO duplicar dentro de uma sessão de producer, mas se o send falhar após o commit DB, evento perde — não há atomicidade entre DB e broker. (B) AFTER_COMMIT publica após commit, mas se a app crasha entre commit e listener, perde. (C) Outbox é a solução canônica: tudo no DB (atômico via TX local), relay publica depois com at-least-once. (D) XA/2PC é frágil, lento e Kafka tem suporte limitado.",
    },
    {
      id: "t3-q5",
      type: "short-answer",
      prompt:
        "Qual a ordem correta de anotações `@CircuitBreaker`, `@Retry`, `@TimeLimiter` em um service Spring + Resilience4j que chama API externa? Por que essa ordem?",
      rubric:
        "Resposta: ordem padrão sênior (de fora pra dentro): `@CircuitBreaker` → `@Retry` → `@TimeLimiter` (ou bulkhead). Justificativa: (a) CB primeiro para evitar retentar quando o circuito está aberto (falha fast); (b) Retry depois — retenta operação dentro do CB; (c) TimeLimiter por último — timeout aplica a cada tentativa individual. Inversão de ordem é problema: se Retry vem antes de CB, retries não contam para o threshold do breaker (não abre nunca); se TimeLimiter vem antes de Retry, timeout aplica ao retry inteiro em vez de cada tentativa. Sênior também menciona @Fallback no final.",
    },
    {
      id: "t3-q6",
      type: "code-review",
      prompt:
        "Avalie esta migration Flyway. O que está errado em zero-downtime / segurança / performance?",
      code: `-- V42__rename_email_to_email_corporativo.sql
ALTER TABLE usuarios RENAME COLUMN email TO email_corporativo;
ALTER TABLE usuarios ALTER COLUMN email_corporativo SET NOT NULL;
UPDATE usuarios SET email_corporativo = LOWER(email_corporativo);
CREATE UNIQUE INDEX idx_usuarios_email ON usuarios(email_corporativo);`,
      rubric:
        "Espera 4+: (1) RENAME COLUMN durante deploy — app antiga rodando ainda usa `email`, quebra; renomear precisa de 5 deploys (add new, dual-write, dual-read, switch, drop old); (2) SET NOT NULL após RENAME — se houver pod antigo escrevendo NULL fica trava; (3) UPDATE em toda a tabela trava se for grande — deveria ser em batches; (4) CREATE UNIQUE INDEX bloqueia tabela; em PG usar CREATE UNIQUE INDEX CONCURRENTLY (mas isso não pode estar dentro de TX, requer split em duas migrations); (5) sem cláusula condicional / IF NOT EXISTS para idempotência. Sênior também questiona se a migration está realmente needed (refactor de schema) e propõe alternativas.",
      weight: 1.3,
    },
  ],
};

const TIER_5_EXAM: ExamTier = {
  tier: 5,
  title: "Exame Tier 5 — Produção, Segurança, AI-Era, System Design",
  description:
    "Validação sênior+ : observability, performance JVM, OWASP, OAuth2/JWT, Spring AI, system design e decisões de arquitetura. Aprovação ≥ 75.",
  passThreshold: 75,
  questions: [
    {
      id: "t5-q1",
      type: "code-review",
      prompt:
        "Este endpoint de pagamento tem 7+ problemas críticos de produção (segurança, idempotência, observabilidade, resiliência). Liste TODOS com correção.",
      code: `@RestController
class PagamentoController(val client: PagamentoApiClient) {
    private val log = LoggerFactory.getLogger(javaClass)

    @PostMapping("/pagamentos")
    fun pagar(@RequestBody req: PagamentoRequest): Map<String, Any> {
        log.info("processando pagamento: $req")
        val resp = client.cobrar(req.cartao, req.cvv, req.valor)
        log.info("resposta: $resp")
        return mapOf("status" to "ok", "id" to resp.transactionId, "raw" to resp)
    }
}

data class PagamentoRequest(val cartao: String, val cvv: String, val valor: BigDecimal)`,
      rubric:
        "Espera 7+: (1) log de cartão e CVV (PCI-DSS violation grave); (2) sem auth — qualquer um cobra; (3) sem validação Bean Validation; (4) sem @PreAuthorize; (5) sem Idempotency-Key header — retry duplica cobrança; (6) sem rate limit; (7) sem ResponseEntity + status apropriado (201/202); (8) Map<String, Any> sem tipo — contrato fraco; (9) campo 'raw' vaza dados internos do provedor; (10) sem timeout/CB/retry; (11) sem MDC correlation ID; (12) sem ProblemDetail em erro; (13) cartao e CVV em DTO + serialização Jackson — log pode capturar mesmo sem o log.info explícito. Sênior cita 9+.",
      weight: 2.0,
    },
    {
      id: "t5-q2",
      type: "short-answer",
      prompt:
        "Você tem um serviço Spring + JPA com sintomas: pool HikariCP atinge max-active=50, requests com timeout, CPU baixa (20%), GC normal. Como você diagnostica e quais as causas mais prováveis em ordem?",
      rubric:
        "Resposta correta: sintoma clássico de pool exhaustion. Diagnóstico: (1) métricas HikariCP — hikaricp_connections_pending sustentado; (2) hikaricp_connections_usage para tempo de hold; (3) tracing/logs procurando queries longas; (4) `pg_stat_activity` no Postgres procurando idle in transaction. Causas em ordem: (a) TX longa segurando conexão por chamada HTTP/Kafka externa dentro de @Transactional; (b) query lenta sem índice; (c) N+1 saturando; (d) lock pessimista mal usado; (e) chamadas async dentro de TX que não propagaram corretamente. Solução: extrair chamada externa para fora da TX, adicionar índice, usar leak detection (`leak-detection-threshold`). Sênior também menciona statement_timeout no PG.",
    },
    {
      id: "t5-q3",
      type: "code-review",
      prompt:
        "Avalie esta config de Spring Security. Liste 4+ problemas graves.",
      code: `@Bean
fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
    return http
        .csrf().disable()
        .authorizeHttpRequests {
            it.requestMatchers("/actuator/**").permitAll()
            it.requestMatchers("/api/**").authenticated()
            it.anyRequest().permitAll()
        }
        .oauth2ResourceServer { it.jwt() }
        .build()
}`,
      rubric:
        "Espera 4+: (1) /actuator/** completo público expõe /env, /heapdump, /threaddump — vazamento de info e RCE; (2) anyRequest().permitAll() é permissivo demais — deve ser .authenticated() ou .denyAll(); (3) CSRF disabled OK para API REST stateless mas sem comentário explicativo; (4) sem session creation policy STATELESS; (5) sem headers configurados (HSTS, CSP, X-Frame); (6) sem JwtAuthenticationConverter para mapear roles de claims; (7) sem validação de issuer/audience explícita; (8) sem exception handling customizado (AuthenticationEntryPoint, AccessDeniedHandler); (9) sem rate limit em endpoints públicos como /actuator/health. Sênior cita 5+.",
      weight: 1.5,
    },
    {
      id: "t5-q4",
      type: "multiple-choice",
      prompt:
        "Você precisa decidir entre Spring MVC com Virtual Threads (JDK 21), Spring MVC com coroutines suspend, e Spring WebFlux para um serviço Spring Boot 3 que usa JPA (Postgres), chama 3 APIs externas via HTTP e tem 5000 req/min. Qual escolhe?",
      choices: [
        "A) Spring WebFlux com R2DBC + WebClient reactive — máximo throughput.",
        "B) Spring MVC com Virtual Threads ativadas (`spring.threads.virtual.enabled=true`) e JPA bloqueante normal.",
        "C) Spring MVC com controllers `suspend fun` e `withContext(Dispatchers.IO)` em chamadas JPA.",
        "D) Tanto B quanto C são razoáveis; A seria overengineering com JPA porque bloqueia o event loop.",
      ],
      rubric:
        "Resposta correta: D. Justificativa: (A) WebFlux + JPA bloqueante é desastre — bloqueia event loop, throughput cai 50×. R2DBC seria opção, mas reescrita massiva. (B) Virtual Threads é a opção zero-reescrita: JPA continua bloqueante, threads são leves, throughput excelente. (C) Coroutines suspend dão controle composicional fino mas exigem refactor; também boa opção. (D) Ambas B e C funcionam para esse cenário; escolha por preferência do time. Sênior também menciona que 5000 req/min (~83 req/s) é carga moderada — não justifica WebFlux mesmo se stack fosse reativa.",
    },
    {
      id: "t5-q5",
      type: "short-answer",
      prompt:
        "Sua app Spring Boot tem memory leak suspeito: heap cresce até OOM após 4-6h em prod. Descreva 5 passos para diagnosticar em produção, sem precisar reproduzir local.",
      rubric:
        "Resposta correta: (1) verificar métricas Micrometer — `jvm_memory_used` por área (Eden, Survivor, Old) e `jvm_gc_collection_seconds`; (2) habilitar `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps/` para capturar dump no OOM; (3) `jcmd <pid> GC.heap_info` ou `jstat -gcutil <pid>` para snapshot durante crescimento; (4) `jcmd <pid> JFR.start name=leak duration=10m` antes do esperado OOM — JFR captura alocação por tipo com baixo overhead; (5) analisar heap dump com Eclipse MAT — `Leak Suspects Report` mostra dominador (geralmente cache sem TTL, ThreadLocal, listener não desregistrado, ehcache mal configurado). Sênior menciona também rastrear `Counter` Micrometer que cresce indefinidamente (cardinality), conexões pendentes no DB, e auditoria de @PostConstruct sem @PreDestroy.",
    },
    {
      id: "t5-q6",
      type: "short-answer",
      prompt:
        "Você está construindo um sistema RAG em Spring AI para uma base de conhecimento corporativa multi-tenant com 500k documentos. Descreva 5 decisões críticas de arquitetura e justifique cada uma.",
      rubric:
        "Resposta sênior abrange 5+: (1) Chunking strategy — 500-800 tokens com overlap de 50, baseado em medição com golden dataset; (2) Vector store: pgvector com HNSW (cosine distance) se já tem PG; Qdrant/Pinecone se precisa escalar isolado; (3) Multi-tenant isolation: filtro por metadata `tenant_id` em todas as queries — NUNCA confiar que chunks de outro tenant não aparecerão; também row-level security se for SaaS regulado; (4) Embedding model: text-embedding-3-small ou Cohere embed-multilingual — custo × qualidade; cache de embeddings (hash do conteúdo) para reindexação barata; (5) Reranking: cross-encoder ou modelo dedicado em top-20 do retrieval para top-5 da geração — melhora precisão significativamente; (6) Eval suite: golden dataset com 100+ perguntas, métricas como Recall@K, MRR e Faithfulness; (7) Controle de custo: cache de respostas para perguntas frequentes, modelos menores onde possível; (8) Hallucination mitigation: schema rígido de resposta, citações obrigatórias, output validation; (9) Observability: tokens por request, latência por etapa (retrieval, rerank, generation), métricas de cache hit. Sênior cita 6-7 com trade-offs concretos.",
      weight: 1.5,
    },
    {
      id: "t5-q7",
      type: "code-review",
      prompt:
        "Esta implementação de Outbox Pattern em Spring tem 5+ problemas. Liste todos.",
      code: `@Component
class OutboxPoller(val repo: OutboxRepository, val kafka: KafkaTemplate<String, String>) {

    @Scheduled(fixedDelay = 100)
    fun publicar() {
        val pendentes = repo.findAll().filter { it.processedAt == null }
        pendentes.forEach { entry ->
            kafka.send(entry.topic, entry.payload)
            entry.processedAt = Instant.now()
            repo.save(entry)
        }
    }
}`,
      rubric:
        "Espera 5+: (1) fixedDelay=100ms = 10 vezes por segundo, hammering o DB; melhor 1-5s; (2) findAll() carrega TUDO em memória — fora de qualquer escala; usar query com LIMIT + WHERE processed_at IS NULL; (3) sem FOR UPDATE SKIP LOCKED — se múltiplos pods publicam, evento duplicado; (4) kafka.send é async — não espera ack antes de marcar processado; usar .get(5, SECONDS) ou listener com retry; (5) sem error handling — exception no kafka.send mata o batch; (6) sem batch flush — N round-trips ao DB; (7) sem métricas/log de quanto processou; (8) sem tratativa de envelhecimento (eventos parados há > X minutos = alerta); (9) índice parcial em outbox(created_at) WHERE processed_at IS NULL não usado se filter é em memória. Sênior cita 6+.",
      weight: 1.5,
    },
  ],
};

export const SPRING_EXAMS: Record<1 | 3 | 5, ExamTier> = {
  1: TIER_1_EXAM,
  3: TIER_3_EXAM,
  5: TIER_5_EXAM,
};

export function getExam(tier: number): ExamTier | undefined {
  if (tier === 1 || tier === 3 || tier === 5) {
    return SPRING_EXAMS[tier];
  }
  return undefined;
}

export const EXAM_TIERS: Array<1 | 3 | 5> = [1, 3, 5];
