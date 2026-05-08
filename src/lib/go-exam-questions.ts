// Questões do exame Go-Enterprise por tier.
// Diferentes dos checkpoints (que servem como prep) — aqui o user é avaliado pela IA.

export type QuestionType = "code-review" | "short-answer" | "multiple-choice";

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  code?: string; // opcional — bloco de código para code-review
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
  title: "Exame Tier 1 — Base, HTTP, Concorrência, Generics",
  description:
    "Validação de fundamentos Go: layout de projeto, errors+context, concorrência idiomática, generics modernos e HTTP server. Aprovação ≥ 70.",
  passThreshold: 70,
  questions: [
    {
      id: "t1-q1",
      type: "code-review",
      prompt:
        "Aponte TODOS os problemas neste handler HTTP em Go. Estima-se 4 ou mais. Para cada problema, dê a correção em 1 linha.",
      code: `func ListUsers(w http.ResponseWriter, r *http.Request) {
    body, _ := io.ReadAll(r.Body)
    var f Filter
    json.Unmarshal(body, &f)

    rows, _ := db.Query("SELECT id, name FROM users WHERE name LIKE '%" + f.Name + "%'")
    defer rows.Close()

    var out []User
    for rows.Next() {
        var u User
        rows.Scan(&u.ID, &u.Name)
        out = append(out, u)
    }
    json.NewEncoder(w).Encode(out)
}`,
      rubric:
        "Espera: SQL injection (string concat), erros ignorados (ReadAll/Unmarshal/Query/Scan), sem context propagado, sem MaxBytesReader, sem rows.Err(), sem auth/validation, sem paginação. Sênior cita 5+. Pleno 4+. Júnior 3.",
      weight: 1.5,
    },
    {
      id: "t1-q2",
      type: "short-answer",
      prompt:
        "Em Go, qual a diferença entre `var ch chan int` e `ch := make(chan int)`? E o que acontece em cada caso ao executar `ch <- 1`?",
      rubric:
        "Resposta correta: o primeiro é nil channel — send bloqueia para sempre. O segundo é unbuffered — send bloqueia até alguém receber. Sênior também menciona que receive em nil também bloqueia para sempre, e que isso é útil em select para desabilitar um caso.",
    },
    {
      id: "t1-q3",
      type: "code-review",
      prompt:
        "Esta função tem um bug clássico de Go pré-1.22 (e segue sendo bug em closures que escapam). Identifique, explique e corrija.",
      code: `func Schedule(jobs []Job) {
    for _, job := range jobs {
        go func() {
            process(job)
        }()
    }
}`,
      rubric:
        "Espera: variável de loop capturada por referência. Em Go ≤ 1.21 todas as goroutines podem ver o último 'job'. Correção: passar como argumento `go func(j Job) { process(j) }(job)` ou usar `j := job` antes do go. Em Go 1.22+ o loop tem novo escopo por iteração, mas a prática segura ainda é passar como argumento. Sênior menciona race detector.",
      weight: 1.2,
    },
    {
      id: "t1-q4",
      type: "multiple-choice",
      prompt:
        "Qual é o uso correto de generics em Go nesta lista? (escolha apenas a opção que faz sentido sênior usar generics)",
      choices: [
        "A) `func Repository[T any] struct { db *sql.DB }` — repositório genérico com 'Save', 'Find', 'Delete'",
        "B) `func Map[T, U any](in []T, f func(T) U) []U` — utilitário em pacote shared",
        "C) `func PrintLog[T any](v T)` — wrapper de fmt.Println",
        "D) `func ParseConfig[T any](path string) T` — leitor genérico de YAML para qualquer tipo",
      ],
      rubric:
        "Resposta correta: B. Justificativa: utilitário comum (Map/Filter/Reduce) com tipos paramétricos é caso clássico. A é antipattern — repository genérico esconde domínio. C não ganha nada (any já existe). D obriga reflection ou bind manual, prejuízo de tipo. Sênior explica POR QUE A é problemático.",
    },
    {
      id: "t1-q5",
      type: "short-answer",
      prompt:
        "Por que `errors.New(\"user not found\")` retornado em wrap como `fmt.Errorf(\"%v: %s\", err, id)` é um bug? Qual é a forma idiomática?",
      rubric:
        "Espera: `%v` perde o erro original, `errors.Is/As` deixa de funcionar contra a sentinel. Correção: `fmt.Errorf(\"get user %s: %w\", id, err)` com `%w`. Bonus: definir `var ErrUserNotFound = errors.New(...)` em pacote e chamadores fazem `errors.Is(err, ErrUserNotFound)`.",
    },
    {
      id: "t1-q6",
      type: "code-review",
      prompt:
        "Esta middleware de Chi tem um problema de segurança/correção. Aponte e corrija.",
      code: `func RequestID(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        id := r.Header.Get("X-Request-ID")
        if id == "" {
            id = uuid.NewString()
        }
        ctx := context.WithValue(r.Context(), "request_id", id)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}`,
      rubric:
        "Problemas: (1) confiar em header do cliente sem validar — atacante injeta IDs colidentes/poisoned em log; (2) chave de context é string raw — colide com outras middlewares. Correções: validar formato (UUID válido), usar `type ctxKey struct{}` como chave, propagar header de volta na resposta. Sênior cita os 2 pontos.",
    },
    {
      id: "t1-q7",
      type: "short-answer",
      prompt:
        "Cite duas situações em que você PREFERE `sync.Mutex` a um channel em Go. E uma situação em que você prefere channel.",
      rubric:
        "Mutex: (1) proteger leitura/escrita de struct compartilhada onde não há transferência de posse; (2) regiões críticas curtas com alta contenção (mutex tem menos overhead). Channel: transferência de trabalho entre estágios (worker pool, pipeline). Sênior também menciona sync.RWMutex quando reads dominam.",
    },
    {
      id: "t1-q8",
      type: "code-review",
      prompt:
        "Este config loader passa em testes mas falha sob pressão real. Aponte 3 problemas.",
      code: `func Load() Config {
    return Config{
        DatabaseURL: os.Getenv("DATABASE_URL"),
        HTTPAddr:    os.Getenv("HTTP_ADDR"),
        LogLevel:    os.Getenv("LOG_LEVEL"),
    }
}`,
      rubric:
        "Problemas: (1) sem validação — DATABASE_URL vazio passa, falha no primeiro request em vez do boot; (2) sem default em HTTP_ADDR — fica string vazia; (3) sem retorno de erro — chamador não sabe que config é inválida. Correção: assinatura `Load() (Config, error)` que valida campos obrigatórios e aplica defaults. Sênior também menciona checagem de produção (ex: localhost em prod).",
    },
  ],
};

const TIER_3_EXAM: ExamTier = {
  tier: 3,
  title: "Exame Tier 3 — Persistência, Arquitetura, gRPC, Resiliência",
  description:
    "Validação pleno+: transações, hexagonal, DDD, eventos, Redis, gRPC, resiliência distribuída e trade-offs. Aprovação ≥ 70.",
  passThreshold: 70,
  questions: [
    {
      id: "t3-q1",
      type: "short-answer",
      prompt:
        "Explique o problema do dual-write entre PostgreSQL e RabbitMQ e como o Outbox Pattern resolve. Mencione a garantia que o outbox oferece.",
      rubric:
        "Dual-write: salvar no DB e publicar no broker em duas operações separadas — qualquer falha entre as duas leva a inconsistência. Outbox: salvar evento numa tabela `outbox` na MESMA transação do insert; worker separado lê e publica. Garantia: at-least-once (consumer precisa ser idempotente). Sênior também menciona ordem (outbox preserva ordenação por particionamento) e dedup downstream.",
      weight: 1.3,
    },
    {
      id: "t3-q2",
      type: "code-review",
      prompt:
        "Aponte os problemas de hexagonal/clean nessa estrutura de application service.",
      code: `package application

import (
    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/redis/go-redis/v9"
)

type CreateInvoice struct {
    pool  *pgxpool.Pool
    redis *redis.Client
}

func (uc *CreateInvoice) Execute(ctx context.Context, cmd Command) error {
    _, err := uc.pool.Exec(ctx, "INSERT ...")
    if err != nil { return err }
    uc.redis.Del(ctx, "invoices:"+cmd.CustomerID)
    return nil
}`,
      rubric:
        "Problemas: (1) application importa pgx e redis — vazou infra; (2) sem ports/interfaces, impossível testar com fake; (3) lógica de cache misturada com use case. Correção: definir `InvoiceRepository` e `InvoiceCache` como interfaces no pacote application; implementações em infrastructure; wiring em cmd. Sênior cita os 3 pontos.",
      weight: 1.3,
    },
    {
      id: "t3-q3",
      type: "multiple-choice",
      prompt:
        "Você está modelando 'Pedido' que tem N 'Itens'. Qual heurística DDD identifica corretamente o aggregate?",
      choices: [
        "A) Pedido tem muitos Itens → Pedido é aggregate, Itens são entities filhas, sempre. Ignore detalhes de invariante.",
        "B) Se a soma dos itens precisa bater com o total do pedido → Pedido é aggregate. Se itens podem ser editados livremente sem ferir consistência → talvez sejam entities independentes.",
        "C) Sempre crie aggregates pequenos. Pedido e Item são aggregates independentes — escalabilidade é mais importante que consistência.",
        "D) Aggregate é uma decisão da camada de persistência: o que está na mesma tabela é o mesmo aggregate.",
      ],
      rubric:
        "Resposta: B. Justificativa: aggregate protege uma invariante de consistência forte. Sem invariante, agregar é overhead. Aggregate pequeno é preferível, mas não absolutismo — depende da regra de negócio. Sênior explica que A leva a aggregates gigantes (DB contention), e D confunde domínio com persistência.",
    },
    {
      id: "t3-q4",
      type: "short-answer",
      prompt:
        "Em um endpoint POST /charges com header Idempotency-Key, descreva 3 cenários distintos e o comportamento esperado em cada.",
      rubric:
        "Cenários: (1) chave nova → processa, salva resultado, retorna 201; (2) mesma chave + mesmo payload (hash) → retorna resultado anterior, mesmo status; (3) mesma chave + payload DIFERENTE → 409 Conflict, sem reprocessar. Sênior menciona TTL (24-48h), escopo por usuário/tenant, e que persistência precisa ser na mesma transação do charge ou via outbox.",
      weight: 1.2,
    },
    {
      id: "t3-q5",
      type: "short-answer",
      prompt:
        "Liste 4 critérios objetivos para escolher gRPC vs REST/JSON entre microsserviços internos da mesma empresa. Dê o veredito.",
      rubric:
        "Critérios esperados: (1) latência/payload — gRPC com proto+HTTP/2 ganha ~30%; (2) contrato — proto gera tipos cliente/servidor, mudanças incompatíveis quebram em build; (3) streaming nativo bidirecional; (4) operação/debugging — REST tem mais ferramenta. Veredito: gRPC para interno (ou Connect-Go quando precisa HTTP/1.1 também), REST/JSON para API pública. Sênior também menciona organização (proto como source of truth versionado).",
    },
    {
      id: "t3-q6",
      type: "code-review",
      prompt:
        "Esta tentativa de circuit breaker está errada conceitualmente. Aponte os 2 problemas principais.",
      code: `var failCount int

func CallGateway(ctx context.Context, payload Payload) error {
    if failCount > 5 {
        return errors.New("gateway down")
    }
    err := gateway.Charge(ctx, payload)
    if err != nil {
        failCount++
    } else {
        failCount = 0
    }
    return err
}`,
      rubric:
        "Problemas: (1) sem janela de tempo — falCount cresce eternamente, primeira falha permanente trava tudo; (2) data race no failCount (sem sync); (3) sem half-open — depois de aberto, nunca tenta de novo (assumindo bugfix de #1); (4) sem timeout, sem distinção entre erros transitórios e permanentes. Correção: usar sony/gobreaker ou implementar com janela deslizante + estados closed/open/half-open. Sênior cita pelo menos 2 dos 4.",
      weight: 1.2,
    },
    {
      id: "t3-q7",
      type: "short-answer",
      prompt:
        "Seu consumer RabbitMQ está saturando o pool de conexões PostgreSQL. Liste 3 alavancas a ajustar, em ordem de prioridade.",
      rubric:
        "(1) Prefetch do consumer (channel.Qos) — limita quantas mensagens o broker entrega simultaneamente, deixa o broker ser o reservatório; (2) limitar concorrência interna no consumer (worker pool com semáforo); (3) revisar transações longas — boundary correto libera conexão rápido. Aumentar pool é último recurso. Sênior NÃO sugere 'aumentar o banco' como primeira opção e menciona backpressure como conceito.",
    },
    {
      id: "t3-q8",
      type: "code-review",
      prompt:
        "Esta função tem cache stampede e outras armadilhas de produção. Aponte.",
      code: `func GetInvoice(ctx context.Context, id string) (Invoice, error) {
    if cached, ok := cache.Get("invoice:" + id); ok {
        return cached, nil
    }
    inv, err := repo.FindByID(ctx, id)
    if err != nil { return Invoice{}, err }
    cache.Set("invoice:"+id, inv, 24*time.Hour)
    return inv, nil
}`,
      rubric:
        "Problemas: (1) cache stampede — N requests simultâneos em miss batem todos no DB. Mitigar com singleflight (golang.org/x/sync/singleflight) ou jittered TTL; (2) sem invalidação no path de update — invoice modificado fica stale por 24h; (3) sem propagação de context para cache.Get/Set; (4) cache de erro/empty — cuidado para não cachear nil como hit. Sênior cita pelo menos 2 e nomeia singleflight.",
    },
  ],
};

const TIER_5_EXAM: ExamTier = {
  tier: 5,
  title: "Exame Tier 5 — Produção Sênior, Segurança, AI-Era e Entrevista",
  description:
    "Checkpoint sênior: supply chain, JWT pitfalls, observability, AI integration e system design. Aprovação ≥ 75.",
  passThreshold: 75,
  questions: [
    {
      id: "t5-q1",
      type: "code-review",
      prompt:
        "Esta validação de JWT é catastrófica. Aponte os problemas e mostre a versão correta.",
      code: `token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
    return secret, nil
})
if err != nil { return nil, err }
claims := token.Claims.(jwt.MapClaims)
return claims, nil`,
      rubric:
        "Problemas: (1) aceita alg=none (token sem assinatura); (2) alg confusion: se também usa RS256 em outro lugar, atacante assina com HS256 usando a chave pública RSA; (3) não exige expiração; (4) type assertion sem ok pode panic; (5) não valida iss/aud. Correção: validar SigningMethodHMAC explicitamente, jwt.WithValidMethods, jwt.WithExpirationRequired, jwt.WithIssuer, jwt.WithAudience. Sênior cita 3+.",
      weight: 1.5,
    },
    {
      id: "t5-q2",
      type: "short-answer",
      prompt:
        "Você herda um Go service sem checagem de supply chain. Liste 5 itens, em ordem, que você adiciona ao CI hoje.",
      rubric:
        "(1) govulncheck ./... — falha em CVE ativa; (2) golangci-lint com gosec, staticcheck, errcheck, bodyclose; (3) GOFLAGS=-mod=readonly + go mod verify; (4) SBOM (syft/cyclonedx-gomod) salvo como artifact; (5) scan de imagem (trivy/grype) e cosign sign se policy exigir. Sênior também menciona Renovate/Dependabot. 4+ corretos = pass.",
      weight: 1.3,
    },
    {
      id: "t5-q3",
      type: "short-answer",
      prompt:
        "Pod K8s rodando Go service em nó com 96 cores, limits.cpu=2, limits.memory=2Gi. Sem ajuste, qual problema acontece e qual a correção completa?",
      rubric:
        "Problema: GOMAXPROCS retorna 96 (em Go pré-1.25 sem detecção de cgroup), scheduler tenta usar 96 P's mas cgroup só dá 2 CPUs efetivos → contention enorme, p99 explode, throughput cai. Correção: (1) `import _ \"go.uber.org/automaxprocs\"` ou setar GOMAXPROCS=2; (2) GOMEMLIMIT=1900MiB (95% do limit) — sem isso GC não acompanha pressão e pod morre OOM. Go 1.25+ detecta cgroup automaticamente. Sênior menciona ambos os ajustes.",
      weight: 1.3,
    },
    {
      id: "t5-q4",
      type: "short-answer",
      prompt:
        "Reclamação: '/checkout p99 passa de 2s só em pico'. Você tem slog, OTel traces, métricas Prometheus. Descreva sua sequência de diagnóstico em 4 passos concretos.",
      rubric:
        "(1) RED: gráfico p50/p95/p99 sobreposto com taxa e erros — confirma quando começou e correlaciona com pico; (2) USE: pool DB (pgxpool.Stat), goroutines, CPU/mem do container — identifica saturação; (3) tail-sample: trace de uma request lenta no horário, identifica span longo (DB? Redis? gateway?); (4) log correlacionado por trace_id — confirma a query/conexão. Sênior também menciona pprof se for CPU/alloc, e que pool exausto costuma ser sintoma de query lenta nova ou tx longa.",
    },
    {
      id: "t5-q5",
      type: "short-answer",
      prompt:
        "Refresh token de 30 dias. Cliente reporta 'alguém parece estar logado na minha conta'. Você detecta token reuse no log. Qual a ação correta E qual a engenharia que permite essa detecção?",
      rubric:
        "Ação: revogar TODA a árvore (família) de tokens daquela sessão — não basta o atual. Usuário precisa fazer login novamente. Engenharia: cada refresh token tem family_id; rotação marca o anterior como 'used' com timestamp; se um 'used' aparecer de novo, todos com mesmo family_id são revogados. Sem isso, refresh vazado dá acesso vitalício até expiração. Sênior também menciona alerta de segurança e logging do incidente.",
      weight: 1.2,
    },
    {
      id: "t5-q6",
      type: "short-answer",
      prompt:
        "POST /ai/summarize em Go com streaming Claude. Liste 5 cuidados de produção que você inclui antes do deploy.",
      rubric:
        "(1) WriteTimeout do servidor extendido (60-90s) para esse endpoint; (2) propagar r.Context() para o stream — se cliente fecha, request ao provider cancela; (3) métricas de tokens (input/output/cache hit) e custo estimado por request via OTel attributes; (4) prompt caching ativo (cache_control: ephemeral) no system prompt — economia de até 90%; (5) circuit breaker no client + fallback degradado; bonus: rate limit por tenant, idempotency key. Sênior cita 4+.",
      weight: 1.2,
    },
    {
      id: "t5-q7",
      type: "short-answer",
      prompt:
        "Desenhe em alto nível um sistema Go que processa 50k pagamentos/segundo, multi-tenant, p99 < 300ms. Liste os 6 componentes principais e a justificativa de cada.",
      rubric:
        "(1) API gateway (Chi/Connect-Go) — rate limit por tenant, AuthN, request ID, tracing; (2) charge-service — valida e enfileira (resposta sync 'accepted, ID=' < 50ms); (3) outbox + RabbitMQ/Kafka — at-least-once entre DB e fila; (4) processor workers — circuit breaker + retry idempotente, idempotency-key obrigatória; (5) PostgreSQL particionado por tenant + read replicas; (6) reconciliation cron — confere com extrato dos gateways. Sênior também menciona KMS para tokens, audit imutável (event sourcing), DR runbook, SLO + error budget.",
      weight: 1.5,
    },
    {
      id: "t5-q8",
      type: "code-review",
      prompt:
        "Liste 7+ problemas neste handler. Sênior chega em 9.",
      code: `func ProcessOrder(w http.ResponseWriter, r *http.Request) {
    body, _ := io.ReadAll(r.Body)
    var req Order
    json.Unmarshal(body, &req)

    db.Exec("INSERT INTO orders VALUES (?, ?, ?)", req.ID, req.Total, req.UserID)

    log.Printf("order created: %s", req.ID)

    json.NewEncoder(w).Encode(req)
}`,
      rubric:
        "Esperado (cite 7+): (1) erros ignorados em ReadAll/Unmarshal/Exec/Encode; (2) sem MaxBytesReader; (3) sem context propagado para db.Exec; (4) sem AuthN/AuthZ — qualquer um cria order para qualquer UserID; (5) sem validação (campos obrigatórios, total negativo); (6) log plain sem trace_id ou correlation; (7) status code 200 em vez de 201 com Location; (8) sem rate limit; (9) potencial SQL injection dependendo do driver e placeholder; (10) sem auditoria. Sênior cita 7-9.",
      weight: 1.3,
    },
  ],
};

export const GO_EXAMS: Record<1 | 3 | 5, ExamTier> = {
  1: TIER_1_EXAM,
  3: TIER_3_EXAM,
  5: TIER_5_EXAM,
};

export function getExam(tier: number): ExamTier | undefined {
  if (tier === 1 || tier === 3 || tier === 5) {
    return GO_EXAMS[tier];
  }
  return undefined;
}

export const EXAM_TIERS: Array<1 | 3 | 5> = [1, 3, 5];
