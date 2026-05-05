import type { SkillArea } from "./skill-tree-types";

// ─── Palettes ───────────────────────────────────────────────────────────────

const P = {
  violet: {
    primary: "#8b5cf6",
    glow: "rgba(139,92,246,0.30)",
    bgLight: "rgba(139,92,246,0.07)",
    bgMedium: "rgba(139,92,246,0.18)",
    text: "#c4b5fd",
    textMuted: "#a78bfa",
    border: "rgba(139,92,246,0.45)",
    borderMastered: "rgba(139,92,246,0.90)",
  },
  cyan: {
    primary: "#06b6d4",
    glow: "rgba(6,182,212,0.30)",
    bgLight: "rgba(6,182,212,0.07)",
    bgMedium: "rgba(6,182,212,0.18)",
    text: "#a5f3fc",
    textMuted: "#67e8f9",
    border: "rgba(6,182,212,0.45)",
    borderMastered: "rgba(6,182,212,0.90)",
  },
  emerald: {
    primary: "#10b981",
    glow: "rgba(16,185,129,0.30)",
    bgLight: "rgba(16,185,129,0.07)",
    bgMedium: "rgba(16,185,129,0.18)",
    text: "#6ee7b7",
    textMuted: "#34d399",
    border: "rgba(16,185,129,0.45)",
    borderMastered: "rgba(16,185,129,0.90)",
  },
  amber: {
    primary: "#f59e0b",
    glow: "rgba(245,158,11,0.30)",
    bgLight: "rgba(245,158,11,0.07)",
    bgMedium: "rgba(245,158,11,0.18)",
    text: "#fde68a",
    textMuted: "#fcd34d",
    border: "rgba(245,158,11,0.45)",
    borderMastered: "rgba(245,158,11,0.90)",
  },
  rose: {
    primary: "#f43f5e",
    glow: "rgba(244,63,94,0.30)",
    bgLight: "rgba(244,63,94,0.07)",
    bgMedium: "rgba(244,63,94,0.18)",
    text: "#fda4af",
    textMuted: "#fb7185",
    border: "rgba(244,63,94,0.45)",
    borderMastered: "rgba(244,63,94,0.90)",
  },
  indigo: {
    primary: "#6366f1",
    glow: "rgba(99,102,241,0.30)",
    bgLight: "rgba(99,102,241,0.07)",
    bgMedium: "rgba(99,102,241,0.18)",
    text: "#c7d2fe",
    textMuted: "#a5b4fc",
    border: "rgba(99,102,241,0.45)",
    borderMastered: "rgba(99,102,241,0.90)",
  },
  teal: {
    primary: "#14b8a6",
    glow: "rgba(20,184,166,0.30)",
    bgLight: "rgba(20,184,166,0.07)",
    bgMedium: "rgba(20,184,166,0.18)",
    text: "#99f6e4",
    textMuted: "#5eead4",
    border: "rgba(20,184,166,0.45)",
    borderMastered: "rgba(20,184,166,0.90)",
  },
};

// ─── Matemática ──────────────────────────────────────────────────────────────

const MATEMATICA: SkillArea = {
  id: "matematica",
  name: "Matemática",
  emoji: "∑",
  colors: P.violet,
  description: "Da trigonometria às estruturas algébricas mais abstratas — a progressão completa de um bacharelado internacional.",
  tierNames: ["Fundamentos", "Núcleo", "Análise & Álgebra", "Avançado", "Expert", "Mestre"],
  nodes: [
    // ── Tier 0: Fundamentos ──
    { id: "mat-trig", name: "Trigonometria", description: "Funções trig, identidades, círculo unitário, equações.", tier: 0, prerequisites: [], cardSlug: "trigonometria-essencial" },
    { id: "mat-geo-plana", name: "Geometria Plana", description: "Teoremas euclidianos, congruência, semelhança, áreas.", tier: 0, prerequisites: [], cardSlug: "geometria-plana" },
    { id: "mat-logica", name: "Lógica Matemática", description: "Proposições, quantificadores, dedução natural, conjuntos.", tier: 0, prerequisites: [], cardSlug: "logica-matematica" },
    { id: "mat-tec-demo", name: "Técnicas de Demonstração", description: "Indução, contradição, contrapositiva, construção.", tier: 0, prerequisites: [], cardSlug: "tecnicas-demonstracao" },

    // ── Tier 1: Núcleo ──
    { id: "mat-calculo1", name: "Cálculo I", description: "Limites, derivadas, integrais, TFC — fundação da análise.", tier: 1, prerequisites: ["mat-trig", "mat-logica"], cardSlug: "calculo-1-variavel" },
    { id: "mat-alg-lin", name: "Álgebra Linear", description: "Espaços vetoriais, matrizes, autovalores, transformações lineares.", tier: 1, prerequisites: ["mat-geo-plana", "mat-logica"], cardSlug: "algebra-linear" },
    { id: "mat-geo-espacial", name: "Geometria Espacial", description: "Sólidos, vetores no espaço, coordenadas, planos.", tier: 1, prerequisites: ["mat-geo-plana"], cardSlug: "geometria-espacial" },
    { id: "mat-teoria-num", name: "Teoria dos Números", description: "Primos, divisibilidade, congruências, Fermat, Euler.", tier: 1, prerequisites: ["mat-logica", "mat-tec-demo"], cardSlug: "teoria-dos-numeros" },

    // ── Tier 2: Análise & Álgebra ──
    { id: "mat-calculo-multi", name: "Cálculo Multivariável", description: "Derivadas parciais, gradiente, integrais múltiplas, Jacobiano.", tier: 2, prerequisites: ["mat-calculo1"], cardSlug: "calculo-multivariavel" },
    { id: "mat-analise-real", name: "Análise Real I", description: "ε-δ, sequências, séries, completude de ℝ, TVM.", tier: 2, prerequisites: ["mat-calculo1", "mat-tec-demo"], cardSlug: "analise-real" },
    { id: "mat-estruturas", name: "Estruturas Algébricas", description: "Grupos, anéis, corpos, homomorfismos, teoremas de isomorfismo.", tier: 2, prerequisites: ["mat-alg-lin", "mat-teoria-num"], cardSlug: "estruturas-algebricas" },
    { id: "mat-comb", name: "Análise Combinatória", description: "Contagem, inclusão-exclusão, geradores, pigeonhole.", tier: 2, prerequisites: ["mat-teoria-num"], cardSlug: "analise-combinatoria" },

    // ── Tier 3: Avançado ──
    { id: "mat-calculo-vet", name: "Cálculo Vetorial", description: "Divergência, rotacional, Stokes, Green, Gauss.", tier: 3, prerequisites: ["mat-calculo-multi", "mat-geo-espacial"], cardSlug: "calculo-vetorial-geometria-analitica" },
    { id: "mat-analise-complexa", name: "Análise Complexa", description: "Funções analíticas, Cauchy, resíduos, transformadas conformes.", tier: 3, prerequisites: ["mat-calculo-multi", "mat-analise-real"], cardSlug: "analise-complexa" },
    { id: "mat-topologia", name: "Topologia Geral", description: "Espaços topológicos, continuidade, compacidade, conexidade.", tier: 3, prerequisites: ["mat-analise-real"], cardSlug: "topologia-geral" },
    { id: "mat-edo", name: "EDOs", description: "Equações diferenciais ordinárias, sistemas, estabilidade.", tier: 3, prerequisites: ["mat-calculo-multi", "mat-alg-lin"], cardSlug: "equacoes-diferenciais-ordinarias" },
    { id: "mat-prob", name: "Probabilidade", description: "Espaços de probabilidade, variáveis aleatórias, distribuições, LGN.", tier: 3, prerequisites: ["mat-analise-real", "mat-comb"], cardSlug: "probabilidade" },
    { id: "mat-num-analise", name: "Análise Numérica", description: "Métodos numéricos para EDOs, sistemas lineares, interpolação.", tier: 3, prerequisites: ["mat-calculo-multi", "mat-alg-lin"], cardSlug: "analise-numerica" },

    // ── Tier 4: Expert ──
    { id: "mat-medida", name: "Medida e Integração", description: "Lebesgue, espaços Lp, Banach, Hilbert, análise funcional.", tier: 4, prerequisites: ["mat-topologia", "mat-analise-complexa"], cardSlug: "medida-integracao" },
    { id: "mat-galois", name: "Teoria de Galois", description: "Extensões de corpos, grupo de Galois, solubilidade por radicais.", tier: 4, prerequisites: ["mat-estruturas", "mat-analise-complexa"], cardSlug: "algebra-galois" },
    { id: "mat-geo-dif", name: "Geometria Diferencial", description: "Curvas, superfícies, curvatura, variedades, formas diferenciais.", tier: 4, prerequisites: ["mat-calculo-vet", "mat-topologia"], cardSlug: "geometria-diferencial" },
    { id: "mat-fourier", name: "Análise de Fourier", description: "Séries de Fourier, transformada, L², Parseval, PDEs.", tier: 4, prerequisites: ["mat-analise-real", "mat-medida"], cardSlug: "analise-fourier" },
    { id: "mat-proc-esto", name: "Processos Estocásticos", description: "Markov, Browniano, martingales, Itô, Fokker-Planck.", tier: 4, prerequisites: ["mat-prob", "mat-medida"], cardSlug: "processos-estocasticos" },
    { id: "mat-mecanica-lag", name: "Mecânica Lagrangiana", description: "Lagrangiana, Hamiltoniana, espaço de fase, simetrias.", tier: 4, prerequisites: ["mat-calculo-vet", "mat-edo"], cardSlug: "mecanica-lagrangiana-hamiltoniana" },
    { id: "mat-sistemas-din", name: "Sistemas Dinâmicos", description: "Fluxos, bifurcações, atratores, caos, expoentes de Lyapunov.", tier: 4, prerequisites: ["mat-edo", "mat-geo-dif"], cardSlug: "sistemas-dinamicos-caos" },

    // ── Tier 5: Mestre ──
    { id: "mat-top-alg", name: "Topologia Algébrica", description: "Grupo fundamental, recobrimentos, homologia, CW-complexos.", tier: 5, prerequisites: ["mat-topologia", "mat-estruturas"], cardSlug: "topologia-algebrica" },
    { id: "mat-alg-hom", name: "Álgebra Homológica", description: "Complexos de cadeia, Tor, Ext, sequências exatas, derivados.", tier: 5, prerequisites: ["mat-galois", "mat-top-alg"], cardSlug: "algebra-homologica" },
    { id: "mat-categorias", name: "Teoria das Categorias", description: "Categorias, functores, transformações naturais, adjunções.", tier: 5, prerequisites: ["mat-estruturas", "mat-top-alg"], cardSlug: "teoria-categorias" },
    { id: "mat-geo-alg", name: "Geometria Algébrica", description: "Variedades afins, Nullstellensatz, esquemas de Grothendieck.", tier: 5, prerequisites: ["mat-galois", "mat-alg-hom"], cardSlug: "geometria-algebrica-intro" },
    { id: "mat-repr", name: "Teoria de Representação", description: "Representações de grupos, caracteres, Schur, SU(2).", tier: 5, prerequisites: ["mat-galois", "mat-categorias"], cardSlug: "teoria-representacao" },
    { id: "mat-fundamentos", name: "Fundamentos & Gödel", description: "ZFC, axioma da escolha, incompletude, computabilidade.", tier: 5, prerequisites: ["mat-logica", "mat-top-alg"], cardSlug: "fundamentos-godel-zfc" },
  ],
};

// ─── Engenharia de Software ──────────────────────────────────────────────────

const SOFTWARE: SkillArea = {
  id: "software",
  name: "Engenharia de Software",
  emoji: "⚙",
  colors: P.cyan,
  description: "De fundamentos de programação a arquitetura de sistemas distribuídos e liderança técnica staff-level.",
  tierNames: ["Base", "Fundamentos", "Aplicado", "Arquitetura", "Staff"],
  nodes: [
    // ── Tier 0 ──
    { id: "se-poo", name: "OOP & Paradigmas", description: "Classes, herança, polimorfismo, OOP vs funcional vs procedural.", tier: 0, prerequisites: [] },
    { id: "se-git", name: "Git & Versionamento", description: "Branches, merge, rebase, pull requests, conventional commits.", tier: 0, prerequisites: [] },
    { id: "se-linux", name: "Linux & Shell", description: "Filesystem, processos, scripting bash, pipes, cron.", tier: 0, prerequisites: [] },
    { id: "se-sql", name: "SQL & Bancos Relacionais", description: "DDL/DML, JOINs, índices, transações ACID, Drizzle ORM, PostgreSQL.", tier: 0, prerequisites: [], cardSlugs: ["n-plus-1", "drizzle-schema-queries", "migrations-zero-downtime", "postgres-erp-checklist", "postgres-indexes-explain", "soft-delete-audit", "decimal-money", "drizzle-vs-prisma-2026", "audit-migration"] },
    { id: "se-http", name: "HTTP & Redes", description: "TCP/IP, HTTP/1.1, HTTP/2, TLS, DNS, REST semântica.", tier: 0, prerequisites: [] },

    // ── Tier 1 ──
    { id: "se-patterns", name: "Design Patterns & NestJS DI", description: "GoF: factory, strategy, observer. NestJS: DI container, providers, escopos, tokens, forRoot.", tier: 1, prerequisites: ["se-poo"], cardSlugs: ["repository-pattern", "cqrs-lite", "saga-pattern", "nest-module-organization", "nestjs-guards-interceptors", "nestjs-di-providers", "prompt-modulo-crud-nest", "prompt-modulo-financeiro"] },
    { id: "se-clean-code", name: "Clean Code & SOLID", description: "Naming, SRP, OCP, LSP, ISP, DIP — código como documentação.", tier: 1, prerequisites: ["se-poo"], cardSlugs: ["clean-architecture", "use-cases", "como-auditar-codigo-ia", "ai-monolito-arquivo-unico", "ai-sem-tratamento-erro"] },
    { id: "se-frontend", name: "Next.js & RSC", description: "App Router, React Server Components, Server Actions, streaming com Suspense, os 4 caches do Next.js 15.", tier: 1, prerequisites: ["se-http"], cardSlugs: ["app-router", "server-components", "server-actions", "streaming-suspense", "nextjs-caching-model"] },
    { id: "se-testing", name: "TDD & Testing", description: "TDD Red/Green/Refactor, unit tests com Jest, integration tests, pirâmide de testes, E2E Playwright.", tier: 1, prerequisites: ["se-clean-code"], cardSlugs: ["tdd-red-green-refactor", "jest-unit-nestjs", "nestjs-integration-testing", "testing-pyramid-nestjs", "playwright-nextjs", "test-data-builders"] },
    { id: "se-api", name: "REST API Design & SDD", description: "Resources, HTTP verbs, status codes, versionamento, OpenAPI spec-first com NestJS.", tier: 1, prerequisites: ["se-http", "se-sql"], cardSlugs: ["dto-validation", "sdd-openapi-nestjs", "gateway-compliance", "audit-api-endpoint", "ai-sem-paginacao", "ai-sem-validacao"] },
    { id: "se-ci-cd", name: "CI/CD & Config", description: "Pipelines, Github Actions, build, lint, test, deploy, variáveis de ambiente com validação.", tier: 1, prerequisites: ["se-git", "se-testing"], cardSlugs: ["github-actions-cicd", "monorepo-turborepo", "nestjs-config-env", "ai-config-hardcoded"] },

    // ── Tier 2 ──
    { id: "se-ddd", name: "Domain-Driven Design", description: "Bounded contexts, aggregates, events, ubiquitous language.", tier: 2, prerequisites: ["se-patterns", "se-clean-code"], cardSlugs: ["ddd-light-erp", "hexagonal"] },
    { id: "se-auth", name: "Auth & Segurança Web", description: "JWT, OAuth2, OIDC, RBAC, OWASP Top 10 básico.", tier: 2, prerequisites: ["se-api", "se-sql"], cardSlugs: ["session-cookie-vs-jwt", "rbac-vs-abac", "oauth-2-1", "session-strategy", "account-creation-flow", "auth-architecture", "audit-auth", "ai-esquece-auth"] },
    { id: "se-observ", name: "Observabilidade", description: "Logs estruturados, métricas, traces, OpenTelemetry, alertas.", tier: 2, prerequisites: ["se-ci-cd"], cardSlugs: ["observability", "opentelemetry-observabilidade"] },
    { id: "se-microsserv", name: "Microsserviços", description: "Decomposição, comunicação síncrona/assíncrona, service mesh.", tier: 2, prerequisites: ["se-api", "se-ddd"], cardSlugs: ["microservices-quando-usar", "modular-monolith", "go-vs-nest-microservices", "golang-microservices", "golang-grpc", "firestore-multi-tenant", "ai-multi-tenant"] },
    { id: "se-event-driven", name: "Event-Driven & CQRS", description: "Event sourcing, Kafka, outbox pattern, eventual consistency.", tier: 2, prerequisites: ["se-ddd", "se-microsserv"], cardSlugs: ["outbox-pattern", "event-driven", "cqrs-lite", "omnichannel-conversations", "background-jobs", "ai-sincrono-deveria-ser-fila"] },

    // ── Tier 3 ──
    { id: "se-arq-dist", name: "Arquitetura Distribuída", description: "CAP, consensus, particionamento, replicação, SLA/SLO.", tier: 3, prerequisites: ["se-microsserv", "se-event-driven"], cardSlugs: ["multi-filial", "multi-tenant-strategies"] },
    { id: "se-performance", name: "Performance & Escalabilidade", description: "Caching, sharding, load balancing, profiling, N+1, PostgreSQL query tuning.", tier: 3, prerequisites: ["se-observ", "se-arq-dist"], cardSlugs: ["caching-layers", "rate-limit-distribuido", "n-plus-1", "postgres-indexes-explain", "nextjs-caching-model", "ai-n-plus-1", "firestore-cost-optimization"] },
    { id: "se-security", name: "AppSec & OWASP", description: "SAST/DAST, threat modeling, OWASP Top 10 avançado, WAF.", tier: 3, prerequisites: ["se-auth", "se-api"], cardSlugs: ["owasp-top10", "sast-dast-scanning", "ai-prompt-injection"] },
    { id: "se-system-design", name: "System Design", description: "URL shortener, Twitter, WhatsApp — prática completa.", tier: 3, prerequisites: ["se-arq-dist", "se-performance"], routeHref: "/system-design" },
    { id: "se-iac", name: "Infraestrutura como Código", description: "Terraform, Pulumi, Helm, GitOps, ambientes efêmeros.", tier: 3, prerequisites: ["se-ci-cd", "se-observ"], cardSlugs: ["terraform-iac", "argocd-gitops"] },

    // ── Tier 4 ──
    { id: "se-staff-arch", name: "Arquitetura Staff-Level", description: "Cross-team design, plataformas internas, golden paths.", tier: 4, prerequisites: ["se-system-design", "se-security"], cardSlugs: ["quando-nao-usar-ia"] },
    { id: "se-rfc", name: "RFC & ADR Writing", description: "Escrita técnica persuasiva, trade-offs documentados, RFCs.", tier: 4, prerequisites: ["se-staff-arch"], routeHref: "/rfc-writing" },
    { id: "se-tech-lead", name: "Tech Leadership", description: "1:1s técnicos, revisão de código como coaching, roadmap.", tier: 4, prerequisites: ["se-staff-arch", "se-rfc"] },
  ],
};

// ─── Data Science ────────────────────────────────────────────────────────────

const DATA_SCIENCE: SkillArea = {
  id: "data-science",
  name: "Data Science",
  emoji: "◈",
  colors: P.emerald,
  description: "Python, estatística e ML até pesquisa e MLOps — o caminho do analista ao cientista de dados sênior.",
  tierNames: ["Ferramentas", "ML Fundamentos", "ML Avançado", "Deep Learning", "Research"],
  nodes: [
    // ── Tier 0 ──
    { id: "ds-python", name: "Python & Pandas", description: "NumPy, Pandas, Matplotlib, Jupyter — o ecossistema de dados.", tier: 0, prerequisites: [], cardSlugs: ["pandas-patterns", "sklearn-patterns"] },
    { id: "ds-sql", name: "SQL & Data Warehousing", description: "Window functions, CTEs, BigQuery/Redshift, dbt, modelagem.", tier: 0, prerequisites: [] },
    { id: "ds-estat", name: "Estatística Descritiva", description: "Média, variância, distribuições, correlação, visualização.", tier: 0, prerequisites: [], cardSlugs: ["statistical-thinking", "eda-workflow"] },
    { id: "ds-prob", name: "Probabilidade Aplicada", description: "Teorema de Bayes, distribuições, variáveis aleatórias, CLT.", tier: 0, prerequisites: [] },

    // ── Tier 1 ──
    { id: "ds-alg-lin", name: "Álgebra Linear para DS", description: "Matrizes, SVD, PCA, projeções — o fundamento do ML.", tier: 1, prerequisites: ["ds-estat"] },
    { id: "ds-ml-basico", name: "ML Supervisionado Básico", description: "Regressão, classificação, kNN, SVM, decision trees.", tier: 1, prerequisites: ["ds-alg-lin", "ds-prob"], cardSlugs: ["model-selection", "ml-evaluation"] },
    { id: "ds-viz", name: "Visualização de Dados", description: "Seaborn, Plotly, storytelling com dados, dashboards.", tier: 1, prerequisites: ["ds-python", "ds-estat"] },
    { id: "ds-feature-eng", name: "Feature Engineering", description: "Encoding, scaling, imputação, criação de features, pipelines.", tier: 1, prerequisites: ["ds-python", "ds-sql"], cardSlugs: ["feature-engineering", "data-cleaning"] },

    // ── Tier 2 ──
    { id: "ds-ml-adv", name: "ML Avançado", description: "Ensemble (XGBoost, LightGBM), stacking, hyperparameter tuning.", tier: 2, prerequisites: ["ds-ml-basico", "ds-feature-eng"], cardSlugs: ["overfitting-strategies"] },
    { id: "ds-validacao", name: "Validação & Experimentos", description: "Cross-validation, métricas, curvas ROC/PR, leakage.", tier: 2, prerequisites: ["ds-ml-basico"], cardSlugs: ["data-leakage"] },
    { id: "ds-nlp", name: "NLP Fundamentos", description: "Tokenização, TF-IDF, word2vec, classificação de texto.", tier: 2, prerequisites: ["ds-ml-basico"] },
    { id: "ds-timeseries", name: "Séries Temporais", description: "ARIMA, decomposição, Prophet, forecasting, sazonalidade.", tier: 2, prerequisites: ["ds-estat", "ds-ml-basico"] },

    // ── Tier 3 ──
    { id: "ds-deep-learning", name: "Deep Learning", description: "Redes neurais, backprop, CNNs, RNNs, Transformers básico.", tier: 3, prerequisites: ["ds-ml-adv", "ds-alg-lin"] },
    { id: "ds-ab-testing", name: "Experimentos A/B", description: "Poder estatístico, significância, erros tipo I/II, CUPED.", tier: 3, prerequisites: ["ds-validacao", "ds-estat"] },
    { id: "ds-mlops", name: "MLOps & Deployment", description: "Versionamento de modelos, feature store, drift, monitoring.", tier: 3, prerequisites: ["ds-deep-learning", "ds-validacao"], cardSlugs: ["ml-pipeline-production", "mlops-basics"] },
    { id: "ds-interpret", name: "Interpretabilidade", description: "SHAP, LIME, PDP, análise de erro, fairness, bias.", tier: 3, prerequisites: ["ds-ml-adv"] },

    // ── Tier 4 ──
    { id: "ds-llm-ft", name: "LLMs & Fine-tuning", description: "Pré-treinamento, RLHF, LoRA, instruction tuning, evals.", tier: 4, prerequisites: ["ds-deep-learning", "ds-nlp"] },
    { id: "ds-causal", name: "Inferência Causal", description: "Grafos causais, DAGs, diferenças-em-diferenças, IV.", tier: 4, prerequisites: ["ds-ab-testing", "ds-prob"] },
    { id: "ds-research", name: "Research Methods", description: "Leitura de papers, reprodução, contribuição, escrita científica.", tier: 4, prerequisites: ["ds-causal", "ds-interpret"] },
  ],
};

// ─── IA / LLM ────────────────────────────────────────────────────────────────

const IA_LLM: SkillArea = {
  id: "ia-llm",
  name: "IA & LLM Engineering",
  emoji: "⬡",
  colors: P.amber,
  description: "Da engenharia de prompt a sistemas multi-agentes e LLMs em produção — o stack do AI Engineer.",
  tierNames: ["Bases IA", "LLMs Core", "Agentes", "Sistemas Prod.", "Research"],
  nodes: [
    // ── Tier 0 ──
    { id: "ai-python", name: "Python para IA", description: "async, type hints, Pydantic, APIs, gerenciamento de dependências.", tier: 0, prerequisites: [] },
    { id: "ai-transformers", name: "Arquitetura Transformer", description: "Attention, encoder/decoder, positional encoding, tokenização.", tier: 0, prerequisites: [], cardSlugs: ["llm-fundamentos"] },
    { id: "ai-alg-lin", name: "Álgebra Linear para IA", description: "Embeddings como vetores, similaridade coseno, matrizes de atenção.", tier: 0, prerequisites: [] },
    { id: "ai-prompt", name: "Prompt Engineering", description: "Zero/few-shot, CoT, sistema vs usuário, jailbreak awareness.", tier: 0, prerequisites: ["ai-transformers"], cardSlugs: ["prompt-engineering-avancado"] },

    // ── Tier 1 ──
    { id: "ai-rag", name: "RAG", description: "Retrieval Augmented Generation, chunking, reranking, HyDE.", tier: 1, prerequisites: ["ai-prompt", "ai-alg-lin"], cardSlugs: ["rag-fundamentos", "rag-avancado"] },
    { id: "ai-embeddings", name: "Embeddings & Semântica", description: "Modelos de embedding, índices vetoriais, FAISS, distâncias.", tier: 1, prerequisites: ["ai-transformers", "ai-alg-lin"], cardSlugs: ["vector-databases"] },
    { id: "ai-fine-tuning", name: "Fine-tuning de LLMs", description: "SFT, LoRA, QLoRA, instruction tuning, DPO, RLHF.", tier: 1, prerequisites: ["ai-transformers", "ai-python"] },
    { id: "ai-eval", name: "Avaliação de LLMs", description: "Benchmarks, evals automatizadas, LLM-as-judge, hallucination.", tier: 1, prerequisites: ["ai-prompt", "ai-rag"], cardSlugs: ["agent-evaluation"] },

    // ── Tier 2 ──
    { id: "ai-agents", name: "AI Agents", description: "ReAct, tooling, planning, memória, ciclos de raciocínio.", tier: 2, prerequisites: ["ai-rag", "ai-eval"], cardSlugs: ["ai-agent-architecture", "langchain-agents", "langgraph-fundamentos", "langchain-fundamentos", "agent-memory-patterns", "agente-financeiro-erp"] },
    { id: "ai-tool-use", name: "Tool Use & Function Calling", description: "Definição de tools, orquestração, streaming, erros.", tier: 2, prerequisites: ["ai-agents"], cardSlugs: ["tool-use-function-calling", "claude-tool-use", "anthropic-sdk-patterns", "mcp-protocol"] },
    { id: "ai-vector-db", name: "Vector Databases", description: "Pinecone, Weaviate, pgvector, Qdrant, índices e filtragem.", tier: 2, prerequisites: ["ai-embeddings", "ai-rag"], cardSlugs: ["vector-databases"] },
    { id: "ai-multimodal", name: "Modelos Multimodais", description: "Vision LLMs, geração de imagem, audio, interleaving.", tier: 2, prerequisites: ["ai-fine-tuning", "ai-embeddings"] },

    // ── Tier 3 ──
    { id: "ai-multi-agent", name: "Sistemas Multi-agente", description: "Orquestração, handoffs, supervisores, crew AI, A2A.", tier: 3, prerequisites: ["ai-agents", "ai-tool-use"], cardSlugs: ["multi-agent-orchestration", "langgraph-patterns", "human-in-the-loop"] },
    { id: "ai-safety", name: "AI Safety & Alignment", description: "Jailbreaks, red teaming, guardrails, Constitutional AI.", tier: 3, prerequisites: ["ai-eval", "ai-multi-agent"], cardSlugs: ["agent-security"] },
    { id: "ai-prod", name: "LLMs em Produção", description: "Latência, custo, caching, fallbacks, observabilidade, SLOs.", tier: 3, prerequisites: ["ai-multi-agent", "ai-vector-db"], cardSlugs: ["agent-observabilidade-producao", "agent-deployment", "langsmith-observabilidade"] },
    { id: "ai-graph-rag", name: "Graph RAG & Retrieval Avançado", description: "Knowledge graphs, GraphRAG, hybrid search, query decomp.", tier: 3, prerequisites: ["ai-vector-db", "ai-multi-agent"], cardSlugs: ["graph-rag", "rag-avancado"] },

    // ── Tier 4 ──
    { id: "ai-optimization", name: "Otimização de LLMs", description: "Quantização, distilação, vLLM, speculative decoding, batching.", tier: 4, prerequisites: ["ai-prod", "ai-fine-tuning"], cardSlugs: ["claude-code-sdk"] },
    { id: "ai-research", name: "AI Research", description: "Arquiteturas novas, Mixture of Experts, SSMs, leitura de papers.", tier: 4, prerequisites: ["ai-safety", "ai-optimization"] },
  ],
};

// ─── Cybersecurity ───────────────────────────────────────────────────────────

const SECURITY: SkillArea = {
  id: "security",
  name: "Cybersecurity",
  emoji: "⛨",
  colors: P.rose,
  description: "Fundamentos de redes e criptografia até red team, incident response e arquitetura zero-trust.",
  tierNames: ["Fundamentos Sec", "Ofensiva Básica", "Defesa & Gov", "Red Team", "APT / Research"],
  nodes: [
    // ── Tier 0 ──
    { id: "sec-net", name: "Redes (TCP/IP, DNS, TLS)", description: "OSI, TCP handshake, DNS lookup, TLS 1.3, HTTP/2.", tier: 0, prerequisites: [], cardSlugs: ["network-security-basics"] },
    { id: "sec-linux", name: "Linux para Segurança", description: "Permissões, sudoers, auditd, cgroups, SELinux/AppArmor.", tier: 0, prerequisites: [] },
    { id: "sec-cripto", name: "Criptografia Fundamentos", description: "Simétrica/assimétrica, hashing, PKI, certificados, TLS.", tier: 0, prerequisites: [], cardSlugs: ["cryptography-basics", "certificado-digital-a1"] },
    { id: "sec-http", name: "HTTP & Web Security", description: "Cookies, CORS, SOP, headers de segurança, HTTPS, HTTP/2.", tier: 0, prerequisites: ["sec-net"], cardSlugs: ["session-strategy", "auth-architecture"] },

    // ── Tier 1 ──
    { id: "sec-owasp", name: "OWASP Top 10", description: "Injection, XSS, IDOR, SSRF, deserialization, supply chain.", tier: 1, prerequisites: ["sec-http"], cardSlugs: ["owasp-top10", "ai-prompt-injection"] },
    { id: "sec-pentest", name: "Pen Testing Básico", description: "Recon, scanning (nmap/masscan), exploitation básico, Metasploit.", tier: 1, prerequisites: ["sec-linux", "sec-net"] },
    { id: "sec-auth-adv", name: "Auth Avançado", description: "JWT attacks, OAuth flows, MFA bypass, SAML, Kerberos basics.", tier: 1, prerequisites: ["sec-http", "sec-cripto"], cardSlugs: ["session-cookie-vs-jwt", "oauth-2-1", "token-encryption-at-rest", "account-creation-flow", "rbac-vs-abac"] },
    { id: "sec-firewall", name: "Firewall & WAF", description: "iptables, nftables, WAF rules, IDS/IPS, network ACLs.", tier: 1, prerequisites: ["sec-net"] },

    // ── Tier 2 ──
    { id: "sec-threat-model", name: "Threat Modeling", description: "STRIDE, DREAD, attack trees, dataflow diagrams, PASTA.", tier: 2, prerequisites: ["sec-owasp", "sec-pentest"] },
    { id: "sec-siem", name: "SIEM & SOC", description: "Log agregation, Splunk/ELK, alertas, playbooks, triage.", tier: 2, prerequisites: ["sec-firewall", "sec-net"], cardSlugs: ["incident-response-playbook", "modern-monitoring-sec"] },
    { id: "sec-devsecops", name: "DevSecOps", description: "SAST, DAST, SCA, secret scanning, policy-as-code, shift-left.", tier: 2, prerequisites: ["sec-owasp", "sec-auth-adv"], cardSlugs: ["sast-dast-scanning", "secrets-management"] },
    { id: "sec-vuln", name: "Vulnerability Assessment", description: "CVE/CVSS, scanner (Nessus/OpenVAS), patch management, VDP.", tier: 2, prerequisites: ["sec-pentest", "sec-owasp"] },

    // ── Tier 3 ──
    { id: "sec-malware", name: "Malware Analysis", description: "Análise estática/dinâmica, sandbox, reversing básico (IDA/Ghidra).", tier: 3, prerequisites: ["sec-vuln", "sec-linux"] },
    { id: "sec-red-team", name: "Red Team Ops", description: "Lateral movement, persistence, C2 frameworks, TTPs (MITRE ATT&CK).", tier: 3, prerequisites: ["sec-pentest", "sec-threat-model"] },
    { id: "sec-incident", name: "Incident Response", description: "Playbooks, containment, forensics, memória, cadeia de custódia.", tier: 3, prerequisites: ["sec-siem", "sec-threat-model"], cardSlugs: ["incident-response-playbook"] },
    { id: "sec-zero-trust", name: "Zero Trust Architecture", description: "BeyondCorp, ZTNA, micro-segmentação, identidade como perímetro.", tier: 3, prerequisites: ["sec-devsecops", "sec-auth-adv"], cardSlugs: ["zero-trust-architecture"] },

    // ── Tier 4 ──
    { id: "sec-apt", name: "APT Research", description: "Nation-state TTPs, threat intelligence, diamond model, hunting.", tier: 4, prerequisites: ["sec-red-team", "sec-malware"] },
    { id: "sec-exploit", name: "Exploit Development", description: "Buffer overflow, ROP chains, heap spray, kernel exploits.", tier: 4, prerequisites: ["sec-red-team", "sec-linux"] },
    { id: "sec-arq", name: "Security Architecture", description: "Framework NIST, ISO 27001, cloud security arch, review de design.", tier: 4, prerequisites: ["sec-zero-trust", "sec-incident"] },
  ],
};

// ─── DevOps / Infra ──────────────────────────────────────────────────────────

const DEVOPS: SkillArea = {
  id: "devops",
  name: "DevOps & Infra",
  emoji: "⬡",
  colors: P.indigo,
  description: "De containers e Kubernetes a Platform Engineering, SRE e arquitetura multi-cloud.",
  tierNames: ["Fundamentos Ops", "Containers", "Orquestração", "Platform", "SRE / Multi-cloud"],
  nodes: [
    // ── Tier 0 ──
    { id: "ops-linux", name: "Linux Administração", description: "systemd, namespaces, cgroups, networking, troubleshooting.", tier: 0, prerequisites: [] },
    { id: "ops-networking", name: "Redes & DNS", description: "VPC, subnets, routing, DNS, load balancers, CDN.", tier: 0, prerequisites: [] },
    { id: "ops-git", name: "Git & Automação", description: "Hooks, CI-friendly scripting, monorepos, release automation.", tier: 0, prerequisites: [] },
    { id: "ops-docker", name: "Docker Fundamentos", description: "Images, containers, Dockerfile, networking básico, volumes.", tier: 0, prerequisites: ["ops-linux"], cardSlugs: ["docker-compose-dev"] },

    // ── Tier 1 ──
    { id: "ops-docker-adv", name: "Docker Avançado", description: "Multi-stage builds, compose, registries, build caching, SBOM.", tier: 1, prerequisites: ["ops-docker"], cardSlugs: ["docker-multistage"] },
    { id: "ops-cloud", name: "Cloud (AWS/GCP/Azure)", description: "IAM, VPC, compute, storage, serverless, serviços gerenciados.", tier: 1, prerequisites: ["ops-networking", "ops-docker"] },
    { id: "ops-ci-cd", name: "CI/CD Pipelines", description: "GitHub Actions, ArgoCD, pipeline as code, blue/green, canary.", tier: 1, prerequisites: ["ops-git", "ops-docker-adv"], cardSlugs: ["github-actions-cicd", "argocd-gitops"] },
    { id: "ops-secrets", name: "Secrets Management", description: "Vault, AWS Secrets Manager, SOPS, sealed secrets, rotation.", tier: 1, prerequisites: ["ops-cloud"], cardSlugs: ["secrets-management"] },

    // ── Tier 2 ──
    { id: "ops-k8s", name: "Kubernetes", description: "Pods, deployments, services, ingress, RBAC, HPA, operators.", tier: 2, prerequisites: ["ops-docker-adv", "ops-cloud"], cardSlugs: ["kubernetes-workloads", "helm-charts"] },
    { id: "ops-iac", name: "Terraform & IaC", description: "State, modules, workspaces, Terragrunt, policy-as-code (OPA).", tier: 2, prerequisites: ["ops-cloud", "ops-ci-cd"], cardSlugs: ["terraform-iac"] },
    { id: "ops-observ", name: "Observabilidade", description: "Prometheus, Grafana, Loki, Jaeger, SLIs/SLOs, alertmanager.", tier: 2, prerequisites: ["ops-k8s"], cardSlugs: ["observability", "opentelemetry-observabilidade"] },
    { id: "ops-service-mesh", name: "Service Mesh (Istio)", description: "mTLS, traffic management, circuit breaker, observability.", tier: 2, prerequisites: ["ops-k8s", "ops-networking"] },

    // ── Tier 3 ──
    { id: "ops-platform", name: "Platform Engineering", description: "IDPs, Backstage, golden paths, self-service infra, paved roads.", tier: 3, prerequisites: ["ops-iac", "ops-service-mesh"] },
    { id: "ops-finops", name: "FinOps & Cost", description: "Cloud cost analysis, rightsizing, spot instances, savings plans.", tier: 3, prerequisites: ["ops-cloud", "ops-observ"], cardSlugs: ["firestore-cost-optimization"] },
    { id: "ops-chaos", name: "Chaos Engineering", description: "Chaos Monkey, litmus, failure injection, game days, DR drills.", tier: 3, prerequisites: ["ops-k8s", "ops-observ"] },
    { id: "ops-security", name: "Cloud Security", description: "CIS benchmarks, CSPM, image scanning, RBAC hardening, KSPM.", tier: 3, prerequisites: ["ops-iac", "ops-secrets"], cardSlugs: ["container-security"] },

    // ── Tier 4 ──
    { id: "ops-sre", name: "SRE Avançado", description: "Error budgets, toil reduction, postmortems, reliability roadmap.", tier: 4, prerequisites: ["ops-platform", "ops-chaos", "ops-finops"], cardSlugs: ["sre-reliability"] },
    { id: "ops-multi-cloud", name: "Multi-cloud & Edge", description: "Anthos/Crossplane, cloud abstraction, edge computing, FinOps multi-cloud.", tier: 4, prerequisites: ["ops-sre", "ops-platform"] },
  ],
};

// ─── GovTech ─────────────────────────────────────────────────────────────────

const GOVTECH: SkillArea = {
  id: "govtech",
  name: "GovTech",
  emoji: "⊕",
  colors: P.teal,
  description: "Sistemas públicos digitais: LGPD, NFS-e, Keycloak, WCAG, audit trail e arquitetura federada municipal.",
  tierNames: ["Gov Basics", "Integrações", "Compliance", "Arquitetura Gov", "Plataforma Completa"],
  nodes: [
    // ── Tier 0 ──
    { id: "gov-lgpd", name: "LGPD & Privacidade", description: "Bases legais, ANPD, DPIA, consentimento, dados sensíveis.", tier: 0, prerequisites: [], cardSlugs: ["lgpd-compliance"] },
    { id: "gov-lei", name: "Legislação Gov Digital", description: "LAI, LGPD, decreto digital, gov.br, interoperabilidade.", tier: 0, prerequisites: [] },
    { id: "gov-arq", name: "Arquitetura de Sistemas Públicos", description: "Requisitos de continuidade, auditabilidade, multi-instância.", tier: 0, prerequisites: [], cardSlugs: ["single-tenant-govtech"] },
    { id: "gov-opendata", name: "Open Data & APIs Públicas", description: "Portais de dados, CKAN, padrões de interoperabilidade Gov.", tier: 0, prerequisites: ["gov-arq"], cardSlugs: ["portal-transparencia"] },

    // ── Tier 1 ──
    { id: "gov-nfse", name: "Integração NFS-e / SEFAZ", description: "ABRASF, Nota Fiscal eletrônica, DANFE, contingência, XML.", tier: 1, prerequisites: ["gov-arq", "gov-opendata"], cardSlugs: ["nfse-padrao-nacional", "nfse-contingencia", "sefaz-integration-br", "xml-json-digital-signature"] },
    { id: "gov-keycloak", name: "Keycloak & SSO Gov", description: "Realms, clients, flows customizados, federação LDAP/AD.", tier: 1, prerequisites: ["gov-lgpd", "gov-arq"], cardSlugs: ["keycloak-sso", "govbr-sso"] },
    { id: "gov-wcag", name: "WCAG & Acessibilidade", description: "WCAG 2.1 AA, VoiceOver, NVDA, tabindex, semântica HTML.", tier: 1, prerequisites: ["gov-arq"], cardSlugs: ["wcag-govtech"] },
    { id: "gov-audit", name: "Trilha de Auditoria", description: "Event log imutável, assinatura, quem fez o quê quando.", tier: 1, prerequisites: ["gov-lgpd", "gov-arq"], cardSlugs: ["nestjs-audit-interceptor", "ai-sem-audit-log"] },

    // ── Tier 2 ──
    { id: "gov-event-sourcing", name: "Event Sourcing Gov", description: "Aggregate store, projections, audit como efeito colateral.", tier: 2, prerequisites: ["gov-audit", "gov-nfse"], cardSlugs: ["event-sourcing-govtech", "kafka-govtech"] },
    { id: "gov-postgis", name: "PostGIS & GeoDados", description: "Consultas espaciais, shapefile, geocodificação, limites municipais.", tier: 2, prerequisites: ["gov-opendata"], cardSlugs: ["postgis-spatial"] },
    { id: "gov-tce", name: "TCE & Compliance Fiscal", description: "SIAFEM, SIOPE, SIAPC, transparência, relatórios legais.", tier: 2, prerequisites: ["gov-audit", "gov-lgpd"], cardSlugs: ["tce-audit-compliance", "dispensa-licitacao-govtech"] },
    { id: "gov-multi-tenant", name: "Multi-tenant Municipal", description: "Isolamento de dado por município, schema-per-tenant, CNPJ.", tier: 2, prerequisites: ["gov-keycloak", "gov-event-sourcing"], cardSlugs: ["multi-tenant-strategies", "single-tenant-govtech"] },

    // ── Tier 3 ──
    { id: "gov-fiscal", name: "FiscalTech Avançado", description: "GNRE, DCTF, EFD-REINF, integrações Receita Federal.", tier: 3, prerequisites: ["gov-nfse", "gov-event-sourcing", "gov-tce"], cardSlugs: ["reforma-tributaria-2026"] },
    { id: "gov-geo-platform", name: "Plataforma Geoespacial", description: "Geoserver, WFS/WMS, mapas de calor, análise territorial.", tier: 3, prerequisites: ["gov-postgis", "gov-multi-tenant"] },
    { id: "gov-federado", name: "Arquitetura Federada", description: "API gateway municipal, tenant-specific configs, federation hub.", tier: 3, prerequisites: ["gov-multi-tenant", "gov-geo-platform"] },
    { id: "gov-data-gov", name: "Data Governance Público", description: "Catálogo de dados, linhagem, classificação, LGPD em analytics.", tier: 3, prerequisites: ["gov-tce", "gov-lgpd"] },

    // ── Tier 4 ──
    { id: "gov-plataforma", name: "Plataforma Gov Completa", description: "Orquestração de serviços municipais, marketplace, suporte.", tier: 4, prerequisites: ["gov-federado", "gov-fiscal", "gov-data-gov"] },
    { id: "gov-consultant", name: "Transformação Digital Gov", description: "Diagnóstico, roadmap, change management, capacitação.", tier: 4, prerequisites: ["gov-plataforma"] },
  ],
};

// ─── Export ──────────────────────────────────────────────────────────────────

export const SKILL_AREAS: SkillArea[] = [
  MATEMATICA,
  SOFTWARE,
  DATA_SCIENCE,
  IA_LLM,
  SECURITY,
  DEVOPS,
  GOVTECH,
];

export const SKILL_AREA_MAP: Record<string, SkillArea> = Object.fromEntries(
  SKILL_AREAS.map((a) => [a.id, a]),
);

export function getArea(id: string): SkillArea | undefined {
  return SKILL_AREA_MAP[id];
}
