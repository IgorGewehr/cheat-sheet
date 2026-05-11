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
  description:
    "Da trigonometria à análise harmônica em grupos — currículo completo de bacharelado internacional + ponte para mestrado. 7 tiers, 50+ marcos, 5 checkpoints e capstone TCC.",
  tierNames: [
    "Fundamentos",
    "Núcleo Cálculo & Álgebra",
    "Análise & EDOs",
    "Análise Avançada & Álgebra Abstrata",
    "Análise Funcional & Geometria",
    "Topologia, Lie & Estruturas Modernas",
    "Pós-Graduação & Capstone",
  ],
  nodes: [
    // ── Tier 0: Fundamentos ──
    { id: "mat-trig", name: "Trigonometria", description: "Funções trig, identidades, círculo unitário, fórmula de Euler.", tier: 0, prerequisites: [], cardSlug: "trigonometria-essencial" },
    { id: "mat-geo-plana", name: "Geometria Plana", description: "Teoremas euclidianos, congruência, semelhança, áreas.", tier: 0, prerequisites: [], cardSlug: "geometria-plana" },
    { id: "mat-geo-espacial", name: "Geometria Espacial", description: "Sólidos, vetores no espaço, coordenadas, planos.", tier: 0, prerequisites: ["mat-geo-plana"], cardSlug: "geometria-espacial" },
    { id: "mat-num-complex", name: "Números Complexos", description: "Forma polar, Euler, raízes da unidade, equações algébricas.", tier: 0, prerequisites: ["mat-trig"], cardSlug: "numeros-complexos" },
    { id: "mat-logica", name: "Lógica Matemática", description: "Proposições, quantificadores, dedução natural, conjuntos.", tier: 0, prerequisites: [], cardSlug: "logica-matematica" },
    { id: "mat-tec-demo", name: "Técnicas de Demonstração", description: "Indução, contradição, contrapositiva, construção.", tier: 0, prerequisites: ["mat-logica"], cardSlug: "tecnicas-demonstracao" },

    // ── Tier 1: Núcleo Cálculo & Álgebra ──
    { id: "mat-calculo1", name: "Cálculo I", description: "Limites, derivadas, integrais, TFC — fundação da análise.", tier: 1, prerequisites: ["mat-trig", "mat-logica"], cardSlug: "calculo-1-variavel" },
    { id: "mat-calculo-multi", name: "Cálculo Multivariável", description: "Derivadas parciais, gradiente, integrais múltiplas, Jacobiano, formas diferenciais.", tier: 1, prerequisites: ["mat-calculo1"], cardSlug: "calculo-multivariavel" },
    { id: "mat-series", name: "Séries e Sequências", description: "Convergência, séries de potências, Taylor, Fourier introdutório.", tier: 1, prerequisites: ["mat-calculo1"], cardSlug: "series-e-sequencias" },
    { id: "mat-alg-lin", name: "Álgebra Linear", description: "Espaços vetoriais, SVD, Jordan, tensores, formas bilineares.", tier: 1, prerequisites: ["mat-geo-plana", "mat-logica"], cardSlug: "algebra-linear" },
    { id: "mat-teoria-num", name: "Teoria dos Números", description: "Primos, divisibilidade, congruências, Fermat, Euler.", tier: 1, prerequisites: ["mat-logica", "mat-tec-demo"], cardSlug: "teoria-dos-numeros" },
    { id: "mat-comb", name: "Análise Combinatória", description: "Contagem, inclusão-exclusão, geradores, pigeonhole.", tier: 1, prerequisites: ["mat-teoria-num"], cardSlug: "analise-combinatoria" },
    { id: "mat-grafos", name: "Teoria dos Grafos", description: "Conexidade, árvores, Euler, Hamilton, espectral.", tier: 1, prerequisites: ["mat-comb"], cardSlug: "teoria-grafos-mat" },
    { id: "mat-cp-tier1", name: "Checkpoint Tier 1", description: "Problemset cálculo + álgebra + séries + discreta. Validar antes de análise rigorosa.", tier: 1, prerequisites: ["mat-calculo-multi", "mat-series", "mat-alg-lin", "mat-grafos"], cardSlug: "checkpoint-tier-1-calculo-algebra" },

    // ── Tier 2: Análise & EDOs ──
    { id: "mat-analise-real", name: "Análise Real", description: "ε-δ, sequências, séries, completude de ℝ, TVM, integração de Riemann.", tier: 2, prerequisites: ["mat-cp-tier1", "mat-tec-demo"], cardSlug: "analise-real" },
    { id: "mat-calculo-vet", name: "Cálculo Vetorial & Geometria Analítica", description: "Divergência, rotacional, Stokes, Green, Gauss, Frenet-Serret.", tier: 2, prerequisites: ["mat-cp-tier1", "mat-geo-espacial"], cardSlug: "calculo-vetorial-geometria-analitica" },
    { id: "mat-estruturas", name: "Estruturas Algébricas", description: "Grupos, anéis, corpos, homomorfismos, teoremas de isomorfismo.", tier: 2, prerequisites: ["mat-alg-lin", "mat-teoria-num"], cardSlug: "estruturas-algebricas" },
    { id: "mat-edo", name: "EDOs", description: "Equações diferenciais ordinárias, sistemas, Picard-Lindelöf, estabilidade.", tier: 2, prerequisites: ["mat-calculo-multi", "mat-alg-lin"], cardSlug: "equacoes-diferenciais-ordinarias" },
    { id: "mat-prob", name: "Probabilidade", description: "Espaços de probabilidade, variáveis aleatórias, LGN, TCL.", tier: 2, prerequisites: ["mat-analise-real", "mat-comb"], cardSlug: "probabilidade" },
    { id: "mat-num-analise", name: "Análise Numérica", description: "Métodos numéricos para EDOs, sistemas lineares, interpolação.", tier: 2, prerequisites: ["mat-calculo-multi", "mat-alg-lin"], cardSlug: "analise-numerica" },
    { id: "mat-cp-tier2", name: "Checkpoint Tier 2", description: "Problemset análise rigorosa + EDOs + estruturas + probabilidade.", tier: 2, prerequisites: ["mat-analise-real", "mat-edo", "mat-estruturas", "mat-prob"], cardSlug: "checkpoint-tier-2-analise-edo" },

    // ── Tier 3: Análise Avançada & Álgebra Abstrata ──
    { id: "mat-analise-complexa", name: "Análise Complexa", description: "Funções analíticas, Cauchy, resíduos, Riemann mapping.", tier: 3, prerequisites: ["mat-cp-tier2"], cardSlug: "analise-complexa" },
    { id: "mat-topologia", name: "Topologia Geral", description: "Espaços topológicos, continuidade, compacidade, conexidade.", tier: 3, prerequisites: ["mat-analise-real"], cardSlug: "topologia-geral" },
    { id: "mat-edp", name: "EDPs", description: "Equação do calor, onda, Laplace; séries de Fourier; princípio do máximo.", tier: 3, prerequisites: ["mat-edo", "mat-calculo-vet"], cardSlug: "equacoes-diferenciais-parciais" },
    { id: "mat-galois", name: "Teoria de Galois", description: "Extensões de corpos (algébricas/transcendentais), grupo de Galois, solubilidade.", tier: 3, prerequisites: ["mat-estruturas", "mat-analise-complexa"], cardSlug: "algebra-galois" },
    { id: "mat-alg-comutativa", name: "Álgebra Comutativa", description: "Anéis Noetherianos, Nullstellensatz, Dedekind, Cohen-Macaulay, Groebner.", tier: 3, prerequisites: ["mat-estruturas", "mat-galois"], cardSlug: "algebra-comutativa" },
    { id: "mat-estatistica", name: "Estatística & Inferência", description: "Estimação, ML, intervalos, testes de hipótese, Bayes.", tier: 3, prerequisites: ["mat-prob"], cardSlug: "estatistica-inferencia" },
    { id: "mat-otimizacao", name: "Otimização & PO", description: "Convexidade, KKT, dualidade, programação linear.", tier: 3, prerequisites: ["mat-calculo-multi", "mat-alg-lin"], cardSlug: "otimizacao-pesquisa-op" },
    { id: "mat-cp-tier3", name: "Checkpoint Tier 3", description: "Problemset análise complexa + topologia + Galois + EDPs.", tier: 3, prerequisites: ["mat-analise-complexa", "mat-topologia", "mat-galois", "mat-edp"], cardSlug: "checkpoint-tier-3-analise-avancada" },

    // ── Tier 4: Análise Funcional & Geometria ──
    { id: "mat-medida", name: "Medida e Integração", description: "Lebesgue, espaços Lᵖ, teoremas de convergência, Fubini.", tier: 4, prerequisites: ["mat-topologia", "mat-analise-complexa"], cardSlug: "medida-integracao" },
    { id: "mat-analise-funcional", name: "Análise Funcional", description: "Banach, Hilbert, Hahn-Banach, espectral, Sobolev — álgebra linear em dim. infinita.", tier: 4, prerequisites: ["mat-medida", "mat-topologia"], cardSlug: "analise-funcional" },
    { id: "mat-fourier", name: "Análise de Fourier", description: "Séries de Fourier, transformada, L², Parseval, EDPs.", tier: 4, prerequisites: ["mat-analise-real", "mat-medida"], cardSlug: "analise-fourier" },
    { id: "mat-geo-dif", name: "Geometria Diferencial", description: "Curvas, superfícies, variedades, formas diferenciais, Stokes generalizado.", tier: 4, prerequisites: ["mat-calculo-vet", "mat-topologia"], cardSlug: "geometria-diferencial" },
    { id: "mat-proc-esto", name: "Processos Estocásticos", description: "Markov, Browniano, martingales, Itô, Fokker-Planck.", tier: 4, prerequisites: ["mat-prob", "mat-medida"], cardSlug: "processos-estocasticos" },
    { id: "mat-fisica-classica", name: "Física: Mecânica Clássica", description: "Newton, energia, simetrias, forças centrais, oscilador.", tier: 4, prerequisites: ["mat-calculo-vet", "mat-edo"], cardSlug: "fisica-mecanica-classica" },
    { id: "mat-mecanica-lag", name: "Mecânica Lagrangiana & Hamiltoniana", description: "Lagrangiana, Hamiltoniana, espaço de fase, Noether, simplética.", tier: 4, prerequisites: ["mat-fisica-classica", "mat-geo-dif"], cardSlug: "mecanica-lagrangiana-hamiltoniana" },
    { id: "mat-calc-variacoes", name: "Cálculo das Variações", description: "Euler-Lagrange, geodésicas, braquistócrona, transporte ótimo.", tier: 4, prerequisites: ["mat-edo", "mat-calculo-multi"], cardSlug: "calculo-das-variacoes" },
    { id: "mat-sistemas-din", name: "Sistemas Dinâmicos", description: "Fluxos, bifurcações, atratores, caos, expoentes de Lyapunov.", tier: 4, prerequisites: ["mat-edo", "mat-geo-dif"], cardSlug: "sistemas-dinamicos-caos" },
    { id: "mat-cp-tier4", name: "Checkpoint Tier 4", description: "Problemset medida + funcional + Fourier + geometria + estocástico.", tier: 4, prerequisites: ["mat-analise-funcional", "mat-fourier", "mat-geo-dif", "mat-proc-esto", "mat-mecanica-lag"], cardSlug: "checkpoint-tier-4-analise-funcional-geometria" },

    // ── Tier 5: Topologia, Lie & Estruturas Modernas ──
    { id: "mat-top-alg", name: "Topologia Algébrica", description: "π₁, recobrimentos, homologia, cohomologia, sheaves, classes características.", tier: 5, prerequisites: ["mat-topologia", "mat-estruturas"], cardSlug: "topologia-algebrica" },
    { id: "mat-var-riem", name: "Variedades Riemannianas", description: "Métrica, Levi-Civita, curvatura Ricci/seccional, Hodge, Bonnet-Myers.", tier: 5, prerequisites: ["mat-geo-dif", "mat-analise-funcional"], cardSlug: "variedades-riemannianas" },
    { id: "mat-grupos-lie", name: "Grupos de Lie", description: "Álgebras de Lie, exponencial, Cartan-Iwasawa, raízes, Dynkin.", tier: 5, prerequisites: ["mat-geo-dif", "mat-estruturas"], cardSlug: "grupos-de-lie" },
    { id: "mat-repr", name: "Teoria de Representação", description: "Representações de grupos, caracteres, Schur, Peter-Weyl, SU(2).", tier: 5, prerequisites: ["mat-grupos-lie", "mat-galois"], cardSlug: "teoria-representacao" },
    { id: "mat-analise-harm", name: "Análise Harmônica", description: "Pontryagin, FT em LCA, harmonics em grupos, representações unitárias.", tier: 5, prerequisites: ["mat-fourier", "mat-repr"], cardSlug: "analise-harmonica" },
    { id: "mat-alg-hom", name: "Álgebra Homológica", description: "Complexos de cadeia, Tor, Ext, sequências espectrais, derivados.", tier: 5, prerequisites: ["mat-galois", "mat-top-alg"], cardSlug: "algebra-homologica" },
    { id: "mat-categorias", name: "Teoria das Categorias", description: "Categorias, functores, adjunções, limites, topos.", tier: 5, prerequisites: ["mat-estruturas", "mat-top-alg"], cardSlug: "teoria-categorias" },
    { id: "mat-tan", name: "Teoria Algébrica dos Números", description: "Corpos de números, Dedekind, ramificação, p-ádicos, adèles, Langlands.", tier: 5, prerequisites: ["mat-galois", "mat-alg-comutativa"], cardSlug: "teoria-algebrica-numeros" },
    { id: "mat-cp-tier5", name: "Checkpoint Tier 5", description: "Problemset π₁/homologia + Lie + representação + categorias + TAN.", tier: 5, prerequisites: ["mat-top-alg", "mat-grupos-lie", "mat-repr", "mat-alg-hom", "mat-tan"], cardSlug: "checkpoint-tier-5-estruturas-modernas" },

    // ── Tier 6: Pós-Graduação & Capstone ──
    { id: "mat-geo-alg", name: "Geometria Algébrica", description: "Variedades afins, Nullstellensatz, esquemas de Grothendieck.", tier: 6, prerequisites: ["mat-alg-comutativa", "mat-alg-hom"], cardSlug: "geometria-algebrica-intro" },
    { id: "mat-fundamentos", name: "Fundamentos & Gödel", description: "ZFC, axioma da escolha, incompletude, intuicionismo.", tier: 6, prerequisites: ["mat-logica", "mat-categorias"], cardSlug: "fundamentos-godel-zfc" },
    { id: "mat-comput", name: "Computabilidade & Complexidade", description: "Turing, halting, P vs NP, Cook-Levin, PCP.", tier: 6, prerequisites: ["mat-logica", "mat-grafos"], cardSlug: "computabilidade-complexidade" },
    { id: "mat-teoria-info", name: "Teoria da Informação", description: "Entropia, Shannon, Kullback-Leibler, channel capacity.", tier: 6, prerequisites: ["mat-prob", "mat-estatistica"], cardSlug: "teoria-da-informacao" },
    { id: "mat-teoria-jogos", name: "Teoria dos Jogos", description: "Nash, minimax, design de mecanismos, VCG, GANs.", tier: 6, prerequisites: ["mat-prob", "mat-otimizacao"], cardSlug: "teoria-dos-jogos" },
    { id: "mat-modelagem", name: "Modelagem Matemática", description: "Ciclo de modelagem, EDOs/EDPs aplicadas, validação, SIR.", tier: 6, prerequisites: ["mat-edo", "mat-estatistica"], cardSlug: "modelagem-matematica" },
    { id: "mat-metodologia", name: "Metodologia Científica", description: "Pesquisa em matemática, peer review, conjecturas, ética.", tier: 6, prerequisites: ["mat-tec-demo"], cardSlug: "metodologia-cientifica" },
    { id: "mat-latex", name: "LaTeX & Papers Matemáticos", description: "AMS-LaTeX, BibTeX, estrutura de paper, ler arXiv.", tier: 6, prerequisites: ["mat-metodologia"], cardSlug: "latex-mat-papers" },
    { id: "mat-capstone", name: "Capstone — TCC & Mestrado", description: "TCC formato paper em LaTeX, banca simulada, candidatura a mestrado.", tier: 6, prerequisites: ["mat-cp-tier5", "mat-latex", "mat-metodologia"], cardSlug: "capstone-tcc-mat" },
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
    { id: "se-poo", name: "OOP & Paradigmas", description: "Classes, herança, polimorfismo, OOP vs funcional vs procedural.", tier: 0, prerequisites: [], cardSlugs: ["nestjs-por-onde-comecar", "typescript-por-que-usar"] },
    { id: "se-git", name: "Git & Versionamento", description: "Branches, merge, rebase, pull requests, conventional commits.", tier: 0, prerequisites: [], cardSlugs: ["git-workflow-equipes"] },
    { id: "se-linux", name: "Linux & Shell", description: "Filesystem, processos, scripting bash, pipes, cron.", tier: 0, prerequisites: [], cardSlugs: ["linux-shell-dev"] },
    { id: "se-sql", name: "SQL & Bancos Relacionais", description: "DDL/DML, JOINs, índices, transações ACID, Drizzle ORM, PostgreSQL.", tier: 0, prerequisites: [], cardSlugs: ["n-plus-1", "drizzle-schema-queries", "migrations-zero-downtime", "postgres-erp-checklist", "postgres-indexes-explain", "soft-delete-audit", "decimal-money", "drizzle-vs-prisma-2026", "audit-migration"] },
    { id: "se-http", name: "HTTP & Redes", description: "TCP/IP, HTTP/1.1, HTTP/2, TLS, DNS, REST semântica.", tier: 0, prerequisites: [], cardSlugs: ["http-fundamentos-api"] },

    // ── Tier 1 ──
    { id: "se-patterns", name: "Design Patterns & NestJS DI", description: "GoF: factory, strategy, observer. NestJS: DI container, providers, escopos, tokens, forRoot.", tier: 1, prerequisites: ["se-poo"], cardSlugs: ["typescript-avancado", "repository-pattern", "cqrs-lite", "saga-pattern", "nest-module-organization", "nestjs-guards-interceptors", "nestjs-di-providers", "prompt-modulo-crud-nest", "prompt-modulo-financeiro"] },
    { id: "se-clean-code", name: "Clean Code & SOLID", description: "Naming, SRP, OCP, LSP, ISP, DIP — código como documentação.", tier: 1, prerequisites: ["se-poo"], cardSlugs: ["clean-architecture", "use-cases", "como-auditar-codigo-ia", "ai-monolito-arquivo-unico", "ai-sem-tratamento-erro"] },
    { id: "se-frontend", name: "Next.js & RSC", description: "App Router, React Server Components, Server Actions, streaming com Suspense, os 4 caches do Next.js 15.", tier: 1, prerequisites: ["se-http"], cardSlugs: ["app-router", "server-components", "server-actions", "streaming-suspense", "nextjs-caching-model", "react-testing-library"] },
    { id: "se-testing", name: "TDD & Testing", description: "TDD Red/Green/Refactor, unit tests com Jest, integration tests, pirâmide de testes, E2E Playwright.", tier: 1, prerequisites: ["se-clean-code"], cardSlugs: ["tdd-red-green-refactor", "jest-unit-nestjs", "nestjs-integration-testing", "testing-pyramid-nestjs", "playwright-nextjs", "test-data-builders", "react-testing-library"] },
    { id: "se-api", name: "REST API Design & SDD", description: "Resources, HTTP verbs, status codes, versionamento, OpenAPI spec-first com NestJS.", tier: 1, prerequisites: ["se-http", "se-sql"], cardSlugs: ["dto-validation", "sdd-openapi-nestjs", "gateway-compliance", "audit-api-endpoint", "ai-sem-paginacao", "ai-sem-validacao"] },
    { id: "se-ci-cd", name: "CI/CD & Config", description: "Pipelines, Github Actions, build, lint, test, deploy, variáveis de ambiente com validação.", tier: 1, prerequisites: ["se-git", "se-testing"], cardSlugs: ["github-actions-cicd", "monorepo-turborepo", "nestjs-config-env", "docker-compose-dev", "ai-config-hardcoded"] },

    // ── Tier 2 ──
    { id: "se-ddd", name: "Domain-Driven Design", description: "Bounded contexts, aggregates, events, ubiquitous language.", tier: 2, prerequisites: ["se-patterns", "se-clean-code"], cardSlugs: ["ddd-light-erp", "hexagonal"] },
    { id: "se-auth", name: "Auth & Segurança Web", description: "JWT, OAuth2, OIDC, RBAC, OWASP Top 10 básico.", tier: 2, prerequisites: ["se-api", "se-sql"], cardSlugs: ["session-cookie-vs-jwt", "rbac-vs-abac", "oauth-2-1", "session-strategy", "account-creation-flow", "auth-architecture", "audit-auth", "ai-esquece-auth"] },
    { id: "se-observ", name: "Observabilidade", description: "Logs estruturados, métricas, traces, OpenTelemetry, alertas.", tier: 2, prerequisites: ["se-ci-cd"], cardSlugs: ["observability", "opentelemetry-observabilidade"] },
    { id: "se-microsserv", name: "Microsserviços", description: "Decomposição, comunicação síncrona/assíncrona, monolito modular — quando escalar e quando não escalar.", tier: 2, prerequisites: ["se-api", "se-ddd"], cardSlugs: ["microservices-quando-usar", "modular-monolith", "go-vs-nest-microservices", "ai-multi-tenant"] },
    { id: "se-event-driven", name: "Event-Driven & CQRS", description: "Event sourcing, Kafka, outbox pattern, eventual consistency.", tier: 2, prerequisites: ["se-ddd", "se-microsserv"], cardSlugs: ["outbox-pattern", "event-driven", "cqrs-lite", "background-jobs", "ai-sincrono-deveria-ser-fila"] },

    // ── Tier 3 ──
    { id: "se-arq-dist", name: "Arquitetura Distribuída", description: "CAP, consensus, particionamento, replicação, SLA/SLO.", tier: 3, prerequisites: ["se-microsserv", "se-event-driven"], cardSlugs: ["multi-filial", "multi-tenant-strategies"] },
    { id: "se-performance", name: "Performance & Escalabilidade", description: "Caching, sharding, load balancing, profiling Node.js, N+1, PostgreSQL query tuning.", tier: 3, prerequisites: ["se-observ", "se-arq-dist"], cardSlugs: ["caching-layers", "rate-limit-distribuido", "n-plus-1", "postgres-indexes-explain", "nodejs-profiling", "ai-n-plus-1"] },
    { id: "se-security", name: "AppSec & OWASP", description: "SAST/DAST, threat modeling, OWASP Top 10 avançado, WAF.", tier: 3, prerequisites: ["se-auth", "se-api"], cardSlugs: ["owasp-top10", "sast-dast-scanning", "ai-prompt-injection"] },
    { id: "se-system-design", name: "System Design", description: "URL shortener, Twitter, WhatsApp — prática completa.", tier: 3, prerequisites: ["se-arq-dist", "se-performance"], routeHref: "/system-design" },
    { id: "se-iac", name: "Infraestrutura como Código", description: "Terraform, Pulumi, Helm, GitOps, ambientes efêmeros.", tier: 3, prerequisites: ["se-ci-cd", "se-observ"], cardSlugs: ["terraform-iac", "argocd-gitops"] },

    // ── Tier 4 ──
    { id: "se-staff-arch", name: "Arquitetura Staff-Level", description: "ADRs, cross-team design, decisões defendíveis com trade-offs documentados.", tier: 4, prerequisites: ["se-system-design", "se-security"], cardSlugs: ["quando-nao-usar-ia", "adr-como-escrever"], routeHref: "/war-game" },
    { id: "se-rfc", name: "RFC & ADR Writing", description: "Escrita técnica persuasiva, trade-offs documentados, RFCs.", tier: 4, prerequisites: ["se-staff-arch"], cardSlugs: ["adr-como-escrever"], routeHref: "/rfc-writing" },
    { id: "se-tech-lead", name: "Entrevistas & Live Coding", description: "Algoritmos para entrevista, mock interviews, system design ao vivo, banco de histórias STAR.", tier: 4, prerequisites: ["se-staff-arch", "se-rfc"], cardSlugs: ["entrevista-algoritmos"], routeHref: "/coding-challenge" },
  ],
};

// ─── Go Enterprise ───────────────────────────────────────────────────────────

const GO_ENTERPRISE: SkillArea = {
  id: "go-enterprise",
  name: "Go Enterprise",
  emoji: "Go",
  colors: P.cyan,
  description:
    "Trilha júnior → pleno → sênior em Go: linguagem moderna, concorrência, generics, microsserviços spec-driven (Chi, gRPC), PostgreSQL com sqlc/pgx, RabbitMQ, Redis, resiliência, segurança, auth, AI integration, observabilidade e capstone empresarial.",
  tierNames: ["Base Júnior", "HTTP, Concorrência & Modernos", "Persistência & Spec-Driven", "Arquitetura Distribuída", "Produção Sênior & Segurança", "AI-Era, Carreira & Capstone"],
  nodes: [
    // ── Tier 0: Base Júnior ──
    { id: "go-start", name: "Primeiros Passos", description: "Instalação, toolchain, go.mod, comandos essenciais e primeiro serviço executável.", tier: 0, prerequisites: [], cardSlugs: ["go-primeiros-passos"] },
    { id: "go-language", name: "Linguagem Go", description: "Tipos, structs, interfaces, ponteiros, slices, maps e composição idiomática.", tier: 0, prerequisites: ["go-start"], cardSlugs: ["go-sintaxe-tipos-controle"] },
    { id: "go-project-layout", name: "Layout de Projeto", description: "cmd, internal, pkg, migrations, api, scripts e fronteiras de pacote sem overengineering.", tier: 0, prerequisites: ["go-language"], cardSlugs: ["go-modulos-layout-projetos"] },
    { id: "go-errors-context", name: "Errors & Context", description: "Error wrapping, sentinels, cancellation, deadlines e propagação de request scope.", tier: 0, prerequisites: ["go-language"], cardSlugs: ["go-errors-context"] },

    // ── Tier 1: HTTP, Concorrência & Modernos ──
    { id: "go-chi", name: "HTTP com Chi", description: "Router, middlewares, request parsing, response envelopes, validação e graceful shutdown.", tier: 1, prerequisites: ["go-project-layout", "go-errors-context"], cardSlugs: ["go-chi-http", "golang-chi-gin-fiber"] },
    { id: "go-concurrency", name: "Concorrência Idiomática", description: "Goroutines, channels, select, worker pools, sync primitives, race detector e backpressure — a pergunta #1 de entrevista Go.", tier: 1, prerequisites: ["go-language", "go-errors-context"], cardSlugs: ["go-concorrencia-goroutines"] },
    { id: "go-generics", name: "Generics Modernos (1.18+)", description: "Type parameters, constraints, type sets, inferência e quando NÃO usar genérico.", tier: 1, prerequisites: ["go-language"], cardSlugs: ["go-generics-modernos"] },
    { id: "go-config-logs", name: "Config & Logs", description: "envconfig/Viper, slog (1.21+ stdlib), Zap/Zerolog, correlation ids e config validada no boot.", tier: 1, prerequisites: ["go-chi"], cardSlugs: ["go-config-envconfig-viper", "go-observabilidade-zap-otel"] },
    { id: "go-testing-core", name: "Testes Go Core", description: "testing, testify, table-driven tests, fakes, fixtures e cobertura útil.", tier: 1, prerequisites: ["go-language"], cardSlugs: ["go-testing-testify", "tdd-red-green-refactor"] },

    // ── Tier 2: Persistência & Spec-Driven ──
    { id: "go-sdd", name: "SDD com OpenAPI", description: "Spec-driven development: contrato primeiro, geração, validação e testes de contrato.", tier: 2, prerequisites: ["go-chi", "go-testing-core"], cardSlugs: ["go-sdd-openapi", "go-contract-sdd-tests"] },
    { id: "go-postgres", name: "PostgreSQL com sqlc + pgx", description: "Queries tipadas, pgxpool, transações, nullable types e modelagem relacional.", tier: 2, prerequisites: ["go-sdd", "go-testing-core"], cardSlugs: ["go-postgres-pgx-sqlc", "postgres-indexes-explain", "n-plus-1"] },
    { id: "go-migrations", name: "Migrations", description: "Goose ou Atlas, versionamento de schema, rollback honesto e zero downtime.", tier: 2, prerequisites: ["go-postgres"], cardSlugs: ["go-migrations-goose-atlas", "migrations-zero-downtime"] },
    { id: "go-transactions", name: "Transações & Repositórios", description: "Unit of Work pragmático, isolation levels, locks, interfaces e boundary de use case.", tier: 2, prerequisites: ["go-postgres"], cardSlugs: ["go-transactions-repositories", "repository-pattern"] },
    { id: "go-integration-tests", name: "Testcontainers", description: "Testes de integração reais com Postgres, RabbitMQ e Redis efêmeros.", tier: 2, prerequisites: ["go-postgres", "go-testing-core"], cardSlugs: ["go-integration-testcontainers"] },

    // ── Tier 3: Arquitetura Distribuída ──
    { id: "go-hexagonal", name: "Arquitetura Hexagonal", description: "Domínio sem framework, ports/adapters, use cases e separação de infraestrutura.", tier: 3, prerequisites: ["go-transactions", "go-sdd"], cardSlugs: ["go-clean-hexagonal", "hexagonal", "clean-architecture"] },
    { id: "go-ddd", name: "DDD Pragmático", description: "Aggregates, invariantes, domain services, application services e eventos de domínio.", tier: 3, prerequisites: ["go-hexagonal"], cardSlugs: ["go-ddd-aggregates", "ddd-light-erp"] },
    { id: "go-rabbitmq", name: "RabbitMQ & Eventos", description: "Exchanges, queues, routing keys, retries, DLQ, consumers idempotentes e backpressure.", tier: 3, prerequisites: ["go-ddd", "go-integration-tests", "go-concurrency"], cardSlugs: ["go-rabbitmq-event-driven", "event-driven", "background-jobs"] },
    { id: "go-redis", name: "Redis Cache & Idempotência", description: "Cache-aside, distributed locks com cautela, idempotency keys e rate limiting.", tier: 3, prerequisites: ["go-rabbitmq"], cardSlugs: ["go-redis-cache-idempotencia", "caching-layers", "rate-limit-distribuido"] },
    { id: "go-grpc", name: "gRPC & Protobuf", description: "Comunicação síncrona entre serviços: protobuf, streaming, Connect-Go, interceptors e quando preferir HTTP/REST.", tier: 3, prerequisites: ["go-sdd", "go-concurrency"], cardSlugs: ["golang-grpc", "golang-microservices"] },
    { id: "go-resilience", name: "Resiliência Distribuída", description: "Timeouts em camadas, retry com backoff+jitter, circuit breaker, bulkhead e hedging — sem cargo cult.", tier: 3, prerequisites: ["go-redis", "go-rabbitmq"], cardSlugs: ["go-resilience-patterns"] },

    // ── Tier 4: Produção Sênior & Segurança ──
    { id: "go-microservices", name: "Microsserviços Empresariais", description: "Bounded contexts, APIs internas, contratos, deploy independente e dados por serviço.", tier: 4, prerequisites: ["go-ddd", "go-rabbitmq", "go-grpc"], cardSlugs: ["go-microservices-enterprise", "microservices-quando-usar", "modular-monolith", "go-vs-nest-microservices"] },
    { id: "go-outbox", name: "Outbox & Consistência", description: "Outbox pattern, exactly-once como ilusão, deduplicação e consistência eventual.", tier: 4, prerequisites: ["go-rabbitmq", "go-transactions"], cardSlugs: ["go-outbox-idempotency", "outbox-pattern"] },
    { id: "go-observability", name: "Observabilidade", description: "slog, logs estruturados, métricas, traces, RED/USE, SLOs e diagnóstico de incidentes.", tier: 4, prerequisites: ["go-config-logs", "go-microservices"], cardSlugs: ["go-observabilidade-zap-otel", "observability", "opentelemetry-observabilidade"] },
    { id: "go-performance", name: "Performance Go", description: "Benchmarks, pprof, allocation profiling, race detector, pool com parcimônia, escape analysis e tuning.", tier: 4, prerequisites: ["go-observability", "go-redis", "go-concurrency"], cardSlugs: ["go-benchmarks-profiling"] },
    { id: "go-security", name: "Segurança em Go", description: "gosec, govulncheck, supply chain, SQL injection, command injection, crypto correto e secrets handling.", tier: 4, prerequisites: ["go-microservices", "go-resilience"], cardSlugs: ["go-security-pratico", "owasp-top10", "secrets-management"] },
    { id: "go-auth", name: "Auth: JWT, PASETO, Sessions, RBAC", description: "Emissão e validação de token sem armadilha (alg confusion, refresh rotation), OAuth2 com PKCE e middleware AuthN/AuthZ.", tier: 4, prerequisites: ["go-chi", "go-security"], cardSlugs: ["go-auth-jwt-paseto", "session-cookie-vs-jwt", "oauth-2-1", "rbac-vs-abac"] },

    // ── Tier 5: AI-Era, Carreira & Capstone ──
    { id: "go-docker", name: "Docker & Compose", description: "Multi-stage builds, imagens pequenas, healthchecks e ambiente local reproduzível.", tier: 5, prerequisites: ["go-microservices", "go-integration-tests"], cardSlugs: ["go-docker-compose-enterprise", "docker-compose-dev", "docker-multistage"] },
    { id: "go-production-checklist", name: "Checklist de Produção", description: "Critérios de aceite para serviço Go de alto valor: segurança, dados, operação e rollback.", tier: 5, prerequisites: ["go-docker", "go-outbox", "go-performance", "go-auth"], cardSlugs: ["go-microservice-production-checklist", "container-security", "secrets-management"] },
    { id: "go-ai-integration", name: "AI Integration em Go", description: "OpenAI/Anthropic SDK Go, streaming SSE, function calling, MCP server em Go, RAG com pgvector e controle de custo.", tier: 5, prerequisites: ["go-resilience", "go-postgres"], cardSlugs: ["go-ai-integration", "mcp-protocol", "tool-use-function-calling"] },
    { id: "go-interview-prep", name: "Entrevista Sênior", description: "GC, runtime, escape analysis, channels internals, system design com Go, banco de respostas STAR e perguntas pra fazer ao entrevistador.", tier: 5, prerequisites: ["go-performance", "go-microservices"], cardSlugs: ["go-entrevista-senior", "entrevista-algoritmos"] },
    { id: "go-capstone", name: "Capstone: 2 Microsserviços", description: "Construir dois serviços empresariais integrados por eventos+gRPC, OpenAPI, banco próprio, observabilidade completa, auth e suíte de testes.", tier: 5, prerequisites: ["go-production-checklist", "go-ai-integration", "go-interview-prep"], cardSlugs: ["go-microservices-enterprise", "go-sdd-openapi", "go-outbox-idempotency", "go-microservice-production-checklist"] },
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
  description:
    "Trilha 0 → sênior pra AI Engineer empresarial 2026+. Cobre LLM internals modernos, prompt engineering avançado, RAG production-grade, agents com MCP, observability e cost optimization, deploy production-ready, AI safety/compliance (EU AI Act, NIST AI RMF) e capstone end-to-end. Foco em construir AI products que funcionam em produção, não demos.",
  tierNames: [
    "Base AI Engineer",
    "LLM Prático Moderno",
    "RAG & Embeddings Produção",
    "Agents & MCP",
    "LLM em Produção",
    "Sênior 2026+ & Capstone",
  ],
  nodes: [
    // ── Tier 0: Base AI Engineer ──
    { id: "ai-py-async", name: "Python para AI", description: "asyncio, type hints, Pydantic v2, FastAPI básico, gerenciamento de deps com uv — o stack que apps AI rodam em 2026.", tier: 0, prerequisites: [], cardSlugs: ["ai-py-async"] },
    { id: "ai-llm-internals", name: "LLM Internals", description: "Tokens, context window, sampling (temperature, top_p, min_p, repetition penalty), latência por token, custos por token de input vs output cacheado.", tier: 0, prerequisites: [], cardSlugs: ["ai-llm-internals-2026", "llm-fundamentos"] },
    { id: "ai-prompt-eng", name: "Prompt Engineering 2026", description: "System vs user prompts, few-shot, chain-of-thought, structured output, XML tags (Claude), prompt templates, A/B testing de prompts.", tier: 0, prerequisites: ["ai-llm-internals"], cardSlugs: ["prompt-engineering-avancado"] },
    { id: "ai-provider-apis", name: "Anthropic & OpenAI SDK", description: "Messages API, completions, streaming, tool use básico — comparison entre providers e quando preferir cada um.", tier: 0, prerequisites: ["ai-py-async", "ai-prompt-eng"], cardSlugs: ["ai-openai-vs-anthropic", "anthropic-sdk-patterns"] },
    { id: "ai-structured-out", name: "Structured Output", description: "JSON mode, function calling como validador, Pydantic + Instructor, Outlines — garantia de schema sem retries.", tier: 0, prerequisites: ["ai-provider-apis"], cardSlugs: ["ai-structured-output"] },

    // ── Tier 1: LLM Prático Moderno ──
    { id: "ai-prompt-caching", name: "Prompt Caching", description: "Anthropic + OpenAI prompt caching — economia 5-10x em workloads com contexto grande. Cache breakpoints, TTL, hit rate.", tier: 1, prerequisites: ["ai-provider-apis"], cardSlugs: ["ai-prompt-caching"] },
    { id: "ai-extended-think", name: "Extended Thinking & Reasoning", description: "Claude extended thinking, OpenAI reasoning models (o1/o3), quando vale o custo, controle de budget de raciocínio.", tier: 1, prerequisites: ["ai-prompt-caching"], cardSlugs: ["ai-extended-thinking"] },
    { id: "ai-tool-use-deep", name: "Tool Use Avançado", description: "Tool calling paralelo, error handling, retry sem loop infinito, tool description engineering, parallel vs sequential.", tier: 1, prerequisites: ["ai-structured-out"], cardSlugs: ["tool-use-function-calling", "claude-tool-use"] },
    { id: "ai-streaming-sse", name: "Streaming & SSE", description: "Server-Sent Events, async iteration, partial JSON, cancelamento, parsing incremental de tool calls.", tier: 1, prerequisites: ["ai-provider-apis"], cardSlugs: ["ai-streaming-sse"] },
    { id: "ai-multimodal", name: "Vision & Audio", description: "Vision LLMs (Claude, GPT-4V), OCR vs vision (quando preferir cada), audio (Whisper, Sonnet 4.5 audio), interleaved multimodal.", tier: 1, prerequisites: ["ai-tool-use-deep"], cardSlugs: ["ai-multimodal-2026"] },
    { id: "ai-cp-claude-app", name: "Checkpoint: Claude App from Scratch", description: "Build app Claude-powered sem framework (sem LangChain) com prompt caching, tool use, streaming, structured output, multimodal. Submeter via /sentinela.", tier: 1, prerequisites: ["ai-prompt-caching", "ai-extended-think", "ai-tool-use-deep", "ai-streaming-sse", "ai-multimodal"], cardSlugs: ["ai-checkpoint-claude-app"], routeHref: "/sentinela" },

    // ── Tier 2: RAG & Embeddings Produção ──
    { id: "ai-embeddings", name: "Embeddings Modernos", description: "Voyage vs OpenAI vs Cohere vs BGE — MTEB benchmark, dimensão, Matryoshka embeddings, multilingual, cost per 1M tokens.", tier: 2, prerequisites: ["ai-cp-claude-app"], cardSlugs: ["ai-embeddings-2026"] },
    { id: "ai-vector-db", name: "Vector Databases", description: "pgvector vs Pinecone vs Qdrant vs Weaviate vs Chroma — hybrid search (BM25 + dense), filtering performante, custo em escala.", tier: 2, prerequisites: ["ai-embeddings"], cardSlugs: ["vector-databases"] },
    { id: "ai-rag-prod", name: "RAG Production-Grade", description: "Chunking strategies (parent-child, late-chunking), retrieval, reranking (Cohere Rerank, BGE), citation tracking, freshness.", tier: 2, prerequisites: ["ai-vector-db"], cardSlugs: ["rag-fundamentos", "rag-avancado"] },
    { id: "ai-rag-contextual", name: "Contextual Retrieval & GraphRAG", description: "Anthropic contextual retrieval (49% melhora), HyDE, multi-query, GraphRAG, query decomposition, hybrid search avançado.", tier: 2, prerequisites: ["ai-rag-prod"], cardSlugs: ["ai-rag-contextual", "graph-rag"] },
    { id: "ai-eval-driven", name: "Eval-Driven Development", description: "Ragas (RAG-específico), DeepEval, PromptFoo, Inspect (UK AISI), golden datasets, LLM-as-judge, regression tests em CI.", tier: 2, prerequisites: ["ai-rag-contextual"], cardSlugs: ["ai-eval-driven-dev", "agent-evaluation"] },
    { id: "ai-cp-rag-prod", name: "Checkpoint: Production RAG", description: "Build RAG sobre corpus técnico complexo (legal, scientific, médico) + eval suite com Ragas + monitoring. Submeter via /sentinela.", tier: 2, prerequisites: ["ai-rag-contextual", "ai-eval-driven"], cardSlugs: ["ai-checkpoint-rag-prod"], routeHref: "/sentinela" },

    // ── Tier 3: Agents & MCP ──
    { id: "ai-agent-patterns", name: "Agent Patterns 2026", description: "ReAct, Plan-and-Execute, Reflexion, agentic loop com state machines, recovery, thin agent + thick tools.", tier: 3, prerequisites: ["ai-cp-rag-prod"], cardSlugs: ["ai-agent-patterns-2026", "ai-agent-architecture", "agent-memory-patterns"] },
    { id: "ai-mcp-deep", name: "MCP — Building & Securing", description: "Model Context Protocol profundo: building MCP servers, transports (stdio, SSE, HTTP), security (allowlists, sandbox), Claude Desktop + Code integration.", tier: 3, prerequisites: ["ai-agent-patterns"], cardSlugs: ["ai-mcp-building", "mcp-protocol"] },
    { id: "ai-claude-sdk-pro", name: "Anthropic Agent SDK", description: "Claude Agent SDK profundo: subagents, hooks, slash commands, file ops, permissions, deployment patterns.", tier: 3, prerequisites: ["ai-mcp-deep"], cardSlugs: ["claude-code-sdk"] },
    { id: "ai-langgraph-prod", name: "LangGraph em Produção", description: "Stateful graphs, conditional edges, human-in-the-loop, persistence, time travel, debug com LangGraph Studio.", tier: 3, prerequisites: ["ai-agent-patterns"], cardSlugs: ["langgraph-fundamentos", "langgraph-patterns", "langchain-fundamentos"] },
    { id: "ai-multi-agent", name: "Multi-Agent Orchestration", description: "Quando usar multi-agent vs single, supervisor/worker, CrewAI vs LangGraph vs AutoGen, handoffs, falhas em cascata.", tier: 3, prerequisites: ["ai-langgraph-prod"], cardSlugs: ["multi-agent-orchestration", "human-in-the-loop"] },
    { id: "ai-agent-eval", name: "Agent Evals", description: "Avaliação de agentes — task completion, tool use accuracy, trajectory eval, eval de multi-turn, custo por task.", tier: 3, prerequisites: ["ai-multi-agent", "ai-eval-driven"], cardSlugs: ["agent-evaluation"] },
    { id: "ai-cp-agent-mcp", name: "Checkpoint: Agentic + MCP", description: "Build workflow agentic com MCP server customizado (real use case) + suite de evals + traces. Submeter via /sentinela.", tier: 3, prerequisites: ["ai-claude-sdk-pro", "ai-multi-agent", "ai-agent-eval"], cardSlugs: ["ai-checkpoint-agent-mcp"], routeHref: "/sentinela" },

    // ── Tier 4: LLM em Produção ──
    { id: "ai-cost-opt", name: "Cost Optimization", description: "Prompt caching agressivo + batching API (50% discount) + model routing (Haiku/Sonnet/Opus) + context compression + token budgets.", tier: 4, prerequisites: ["ai-cp-agent-mcp"], cardSlugs: ["ai-cost-optimization"] },
    { id: "ai-latency", name: "Latency & Streaming UX", description: "Latency budgets (p50, p99), TTFT (Time To First Token), streaming UX, parallel calls, speculative decoding, predicted outputs.", tier: 4, prerequisites: ["ai-cost-opt"], cardSlugs: ["ai-latency-budgets"] },
    { id: "ai-resilience", name: "Fallback & Resilience", description: "Circuit breakers, multi-provider fallback (Anthropic → OpenAI → local), retry com backoff exponential, async queue para retry.", tier: 4, prerequisites: ["ai-latency"], cardSlugs: ["ai-fallback-resilience"] },
    { id: "ai-observability", name: "Observability LLM", description: "LangSmith, Langfuse, Helicone, OpenLLMetry — tracing, debugging, cost tracking, drift detection.", tier: 4, prerequisites: ["ai-resilience"], cardSlugs: ["langsmith-observabilidade", "agent-observabilidade-producao"] },
    { id: "ai-fine-tuning", name: "Fine-Tuning 2026", description: "Quando fine-tune vs prompt vs RAG, LoRA/QLoRA, dataset curation, DPO/ORPO, eval de modelo fine-tuned.", tier: 4, prerequisites: ["ai-observability"], cardSlugs: ["ai-fine-tuning-2026"] },
    { id: "ai-deployment", name: "Deployment Patterns", description: "Modal, Replicate, AWS Bedrock, Azure OpenAI, GCP Vertex, self-hosted (vLLM, llama.cpp, Ollama), quantization para edge.", tier: 4, prerequisites: ["ai-fine-tuning"], cardSlugs: ["ai-deployment-2026", "agent-deployment"] },
    { id: "ai-cp-deploy", name: "Checkpoint: Production Deploy", description: "Deploy production LLM app: monitoring + fallback multi-provider + cost dashboard + eval-driven CI. Submeter via /sentinela.", tier: 4, prerequisites: ["ai-cost-opt", "ai-resilience", "ai-observability", "ai-deployment"], cardSlugs: ["ai-checkpoint-deploy"], routeHref: "/sentinela" },

    // ── Tier 5: Sênior 2026+ & Capstone ──
    { id: "ai-product-ux", name: "AI Product UX", description: "UX patterns para LLM: streaming, citations clicáveis, retry/escape hatches, partial states, undo, source attribution, expectation setting.", tier: 5, prerequisites: ["ai-cp-deploy"], cardSlugs: ["ai-product-ux"] },
    { id: "ai-safety", name: "Safety & Guardrails", description: "Llama Guard 3, NeMo Guardrails, Anthropic prompt shields, Constitutional AI, content moderation, blocklist + allowlist tools.", tier: 5, prerequisites: ["ai-product-ux"], cardSlugs: ["ai-safety-guardrails", "agent-security", "ai-prompt-injection"] },
    { id: "ai-compliance", name: "Compliance & Governance", description: "EU AI Act (entra em vigor 2026), NIST AI RMF, ISO 42001:2023, data residency, GDPR/LGPD em AI, model cards, AI impact assessment.", tier: 5, prerequisites: ["ai-safety"], cardSlugs: ["ai-compliance-2026"] },
    { id: "ai-team-process", name: "AI Engineering Team Process", description: "Eval-driven dev, prompt versioning (git-like), CI/CD para AI apps, prompt review como code review, A/B testing em prod.", tier: 5, prerequisites: ["ai-compliance"], cardSlugs: ["ai-team-process"] },
    { id: "ai-emerging", name: "AI Research Tracking", description: "Reasoning models (chain-of-thought scaling), Mixture of Experts, State Space Models (Mamba), agent benchmarks, paper tracking pragmático.", tier: 5, prerequisites: ["ai-team-process"], cardSlugs: ["ai-emerging-2026"] },
    { id: "ai-capstone", name: "Capstone: AI Product End-to-End", description: "Build, deploy e monitor AI product completo: agentic + RAG + evals + multi-provider fallback + cost dashboard + post-mortem. Submeter via /sentinela.", tier: 5, prerequisites: ["ai-safety", "ai-compliance", "ai-emerging"], cardSlugs: ["ai-capstone"], routeHref: "/sentinela" },
  ],
};

// ─── Cybersecurity ───────────────────────────────────────────────────────────

const SECURITY: SkillArea = {
  id: "security",
  name: "Cybersecurity",
  emoji: "⛨",
  colors: P.rose,
  description:
    "Trilha 0 → sênior em segurança ofensiva para consultoria e pentest empresarial real. Cobre Web AppSec, Cloud/Container, Red Team adversary simulation, secure code review, AI security 2026+ (LLM red team, MCP exploitation, agent security) e fechamento com engagement completo (scope → recon → exploit → relatório executivo + técnico).",
  tierNames: [
    "Base Júnior Sec",
    "Web AppSec & Pentest",
    "Cloud, Container & Network",
    "Red Team & Adversary Simulation",
    "AppSec & Secure Code Review",
    "AI Security 2026+, Consultoria & Capstone",
  ],
  nodes: [
    // ── Tier 0: Base Júnior Sec ──
    { id: "sec-redes", name: "Redes & Protocolos", description: "TCP/IP, DNS, TLS 1.3 handshake, HTTP/2 e /3, BGP basics — o que um pentester precisa saber sobre a stack que vai atacar.", tier: 0, prerequisites: [], cardSlugs: ["sec-redes-protocolos-2026", "network-security-basics"] },
    { id: "sec-linux", name: "Linux Hardening & Forense Básica", description: "Permissões, SELinux/AppArmor, namespaces, capabilities, auditd, syslog — base pra entender escape e priv-esc.", tier: 0, prerequisites: [], cardSlugs: ["sec-linux-hardening"] },
    { id: "sec-cripto", name: "Criptografia Aplicada", description: "Argon2, AES-GCM, ECDSA, PKI, TLS handshake interno — onde a cripto quebra na prática.", tier: 0, prerequisites: [], cardSlugs: ["cryptography-basics", "certificado-digital-a1"] },
    { id: "sec-web-funda", name: "Web Fundamentos de Segurança", description: "Same-origin, CORS, CSP, cookies (SameSite, __Host-), headers (HSTS, COOP/COEP), HTTPS — o terreno que XSS/SSRF/CSRF exploram.", tier: 0, prerequisites: ["sec-redes"], cardSlugs: ["sec-web-fundamentos-headers", "session-strategy", "auth-architecture"] },
    { id: "sec-toolkit", name: "Toolkit Pentest 2026", description: "Caido (Burp moderno), nuclei templates, ffuf, Wireshark, Kali/Parrot setup, OPSEC básica — ferramentas que você vai usar todo dia.", tier: 0, prerequisites: ["sec-redes", "sec-linux"], cardSlugs: ["sec-toolkit-pentest-2026"] },

    // ── Tier 1: Web AppSec & Pentest ──
    { id: "sec-owasp-2025", name: "OWASP Top 10 (2025)", description: "Versão atualizada pós-LLM com LLM01 (prompt injection) no top — não a Top 10 de 2021 que todo curso ensina.", tier: 1, prerequisites: ["sec-web-funda"], cardSlugs: ["sec-owasp-top10-2025", "owasp-top10", "ai-prompt-injection"] },
    { id: "sec-auth-attacks", name: "Ataques de Auth Modernos", description: "JWT alg confusion, OAuth misconfig (state, PKCE), SAML signature wrapping, MFA bypass, session fixation, account takeover.", tier: 1, prerequisites: ["sec-web-funda", "sec-cripto"], cardSlugs: ["sec-auth-attacks-modern", "session-cookie-vs-jwt", "oauth-2-1", "rbac-vs-abac"] },
    { id: "sec-injection", name: "Injection Profundo", description: "SQLi blind/time-based, NoSQLi (Mongo, Elastic), GraphQL introspection abuse, XSS + CSP bypass, DOM clobbering, prototype pollution.", tier: 1, prerequisites: ["sec-web-funda", "sec-toolkit"], cardSlugs: ["sec-injection-attacks-deep"] },
    { id: "sec-server-side", name: "Server-Side Attacks", description: "SSRF (incluindo cloud metadata IMDSv1/v2), SSTI (Jinja/Twig/Handlebars), XXE, deserialization, request smuggling.", tier: 1, prerequisites: ["sec-injection"], cardSlugs: ["sec-server-side-attacks"] },
    { id: "sec-access", name: "Broken Access Control", description: "IDOR, BOLA (OWASP API#1), mass assignment, privilege escalation web, business logic flaws — onde 90% dos bugs reais estão.", tier: 1, prerequisites: ["sec-owasp-2025"], cardSlugs: ["sec-broken-access-control"] },
    { id: "sec-cp-portswigger", name: "Checkpoint: PortSwigger Labs", description: "30+ labs do PortSwigger Web Security Academy (SQLi, XSS, SSRF, Access Control, JWT) + writeup técnico salvo no brain. Validar veredito com /sentinela.", tier: 1, prerequisites: ["sec-auth-attacks", "sec-injection", "sec-server-side", "sec-access"], cardSlugs: ["sec-checkpoint-portswigger"], routeHref: "/sentinela" },

    // ── Tier 2: Cloud, Container & Network ──
    { id: "sec-aws", name: "AWS Pentest", description: "IAM enumeration (Pacu, enumerate-iam), escalation paths, S3 bucket misconfig, EC2 metadata SSRF (IMDSv1), Lambda execution escape, STS abuse.", tier: 2, prerequisites: ["sec-server-side", "sec-toolkit"], cardSlugs: ["sec-aws-pentest"] },
    { id: "sec-azure-gcp", name: "Azure & GCP Pentest", description: "Entra ID (ex-Azure AD): device code phishing, refresh token abuse. GCP: service account impersonation, OAuth scopes, project lateral movement.", tier: 2, prerequisites: ["sec-aws"], cardSlugs: ["sec-azure-gcp-pentest"] },
    { id: "sec-k8s", name: "Kubernetes & Container Pentest", description: "Container escapes (capabilities, hostPath, /proc), RBAC bypass, ServiceAccount token abuse, kube-hunter, peirates, pod security policy.", tier: 2, prerequisites: ["sec-linux", "sec-aws"], cardSlugs: ["sec-k8s-container-pentest", "container-security"] },
    { id: "sec-supply", name: "Supply Chain Attacks", description: "Dependency confusion, typosquatting (npm, PyPI), malicious GitHub Actions, Terraform module abuse, Helm chart backdoors — o vetor que dominou 2024-2025.", tier: 2, prerequisites: ["sec-toolkit"], cardSlugs: ["sec-supply-chain-attacks"] },
    { id: "sec-ad-net", name: "AD & Network Pentest", description: "BloodHound 6, kerberoasting, AS-REP roasting, NTLM relay (mitm6, ntlmrelayx), pivoting com Ligolo-ng, AD CS (ESC1-ESC15).", tier: 2, prerequisites: ["sec-redes", "sec-toolkit"], cardSlugs: ["sec-ad-network-pentest"] },
    { id: "sec-cp-cloudgoat", name: "Checkpoint: CloudGoat + HTB AD", description: "Completar CloudGoat (AWS scenarios), HTB Active Directory Pro Lab e CICD-Goat (Cider Security). Writeup técnico + relatório de findings.", tier: 2, prerequisites: ["sec-aws", "sec-azure-gcp", "sec-k8s", "sec-supply", "sec-ad-net"], cardSlugs: ["sec-checkpoint-cloudgoat-htb"], routeHref: "/sentinela" },

    // ── Tier 3: Red Team & Adversary Simulation ──
    { id: "sec-red-ops", name: "Red Team Operations", description: "Scoping de engagement, RoE (Rules of Engagement), MITRE ATT&CK mapping, threat-informed defense, OPSEC, Atomic Red Team.", tier: 3, prerequisites: ["sec-cp-cloudgoat"], cardSlugs: ["sec-red-team-ops-2026"] },
    { id: "sec-c2", name: "C2 Frameworks Modernos", description: "Sliver (post-Cobalt-Strike default), Mythic, Havoc — multiplayer C2, malleable profiles, BOFs, .NET reflective loading. Cobalt Strike é caro e queimado.", tier: 3, prerequisites: ["sec-red-ops"], cardSlugs: ["sec-c2-frameworks-modern"] },
    { id: "sec-initial", name: "Initial Access Moderno", description: "Evilginx3 (MFA-bypass phishing), browser-in-the-browser, OAuth consent phishing, LNK + ISO smuggling, container delivery, social engineering 2026.", tier: 3, prerequisites: ["sec-red-ops"], cardSlugs: ["sec-initial-access-modern"] },
    { id: "sec-post-exploit", name: "Post-Exploitation", description: "Persistence (registry, scheduled tasks, COM hijacking, systemd, cron), lateral movement (PsExec → WMI → DCOM → WinRM), Linux/Windows priv-esc.", tier: 3, prerequisites: ["sec-initial"], cardSlugs: ["sec-post-exploitation"] },
    { id: "sec-edr", name: "EDR/AMSI/AV — Entendimento Defensivo", description: "Como EDRs detectam (kernel callbacks, ETW, ELAM), AMSI bypass técnicas (academicamente), unhooking — base pra trabalhar EM equipes de defesa contra red team. Não pra atacar empresas sem autorização.", tier: 3, prerequisites: ["sec-c2", "sec-post-exploit"], cardSlugs: ["sec-edr-evasion-defensive"] },
    { id: "sec-cp-prolab", name: "Checkpoint: HTB Pro Lab", description: "Completar Dante OU RastaLabs OU Offshore (HTB Pro Labs). Relatório de red team estilo cliente: executive summary + cadeia técnica + remediation.", tier: 3, prerequisites: ["sec-c2", "sec-initial", "sec-post-exploit", "sec-edr"], cardSlugs: ["sec-checkpoint-prolabs"], routeHref: "/sentinela" },

    // ── Tier 4: AppSec & Secure Code Review ──
    { id: "sec-threat-model", name: "Threat Modeling 2026", description: "STRIDE com IA (LLM-assisted), attack trees, PASTA, dataflow modeling, abuser stories, MITRE ATT&CK Defender. Base do AppSec consultant.", tier: 4, prerequisites: ["sec-cp-portswigger"], cardSlugs: ["sec-threat-modeling-2026"] },
    { id: "sec-code-review", name: "Secure Code Review Playbook", description: "Semgrep com custom rules, CodeQL queries, manual review checklist por linguagem (Go, TS/Node, Python, Java), SARIF triage, false-positive culling.", tier: 4, prerequisites: ["sec-threat-model"], cardSlugs: ["sec-secure-code-review-playbook", "sast-dast-scanning"] },
    { id: "sec-fuzzing", name: "Fuzzing Moderno", description: "AFL++, LibFuzzer, structure-aware (protobuf), coverage-guided, OSS-Fuzz contribution, Go fuzz nativo (1.18+), Atheris para Python.", tier: 4, prerequisites: ["sec-code-review"], cardSlugs: ["sec-fuzzing-modern"] },
    { id: "sec-supply-def", name: "Defesa de Supply Chain", description: "SLSA L3/L4, SBOM (CycloneDX, SPDX), Sigstore/cosign signing, in-toto attestations, dependency pinning, GitHub Actions hardening.", tier: 4, prerequisites: ["sec-code-review"], cardSlugs: ["secrets-management", "sec-supply-chain-attacks"] },
    { id: "sec-zt-real", name: "Zero Trust Implementation Real", description: "BeyondCorp implementation, mTLS interno (SPIFFE/SPIRE), identity-aware proxy, microsegmentation, ZTNA vs VPN — não a buzzword vendor.", tier: 4, prerequisites: ["sec-supply-def"], cardSlugs: ["zero-trust-architecture"] },
    { id: "sec-cp-codeql", name: "Checkpoint: Auditoria Real OSS", description: "Auditoria de codebase open-source escolhida (Node/Go/Python) com Semgrep + CodeQL + revisão manual. Entregar relatório executivo + técnico para validar com /sentinela.", tier: 4, prerequisites: ["sec-code-review", "sec-fuzzing", "sec-supply-def", "sec-zt-real"], cardSlugs: ["sec-checkpoint-codeql-engagement"], routeHref: "/sentinela" },

    // ── Tier 5: AI Security 2026+, Consultoria & Capstone ──
    { id: "sec-llm-red", name: "LLM Red Teaming", description: "Prompt injection direta, indirect injection (RAG, web, email), jailbreaks (DAN, persona, base64, ASCII art), refusal bypass, multi-turn jailbreak, context pollution.", tier: 5, prerequisites: ["sec-cp-prolab", "sec-cp-codeql"], cardSlugs: ["sec-llm-redteam-2026", "ai-prompt-injection"] },
    { id: "sec-ai-supply", name: "AI Supply Chain Attacks", description: "Model backdooring (BadNets, weight poisoning), data poisoning, RAG vector store poisoning, pickle bombs, LoRA backdoors, HuggingFace risk surface.", tier: 5, prerequisites: ["sec-llm-red"], cardSlugs: ["sec-ai-supply-chain-attacks"] },
    { id: "sec-agent-mcp", name: "Agent & MCP Security", description: "Tool abuse, MCP server exploitation, agentic recursive prompt injection, capability escape, indirect tool injection, lethal trifecta (privado + não-confiável + tool action).", tier: 5, prerequisites: ["sec-llm-red"], cardSlugs: ["sec-agent-mcp-security", "agent-security"] },
    { id: "sec-ai-tools", name: "AI Pentest Tools 2026", description: "Garak (LLM red team scanner), Pyrit (Microsoft), PromptFoo, NVIDIA Aegis, agentes autônomos de pentest (PentestGPT, AutoGPT redteam), responsible disclosure de AI bugs.", tier: 5, prerequisites: ["sec-llm-red", "sec-agent-mcp"], cardSlugs: ["sec-ai-pentest-tools-2026"] },
    { id: "sec-report", name: "Pentest Report Profissional", description: "Estrutura: executive summary, escopo, methodology, findings com CVSS 4.0, evidence + repro steps, remediation prioritizada, retest plan. Template + exemplos reais.", tier: 5, prerequisites: ["sec-cp-prolab", "sec-cp-codeql"], cardSlugs: ["sec-pentest-report-pro"] },
    { id: "sec-consult", name: "Consultoria & Engagement Business", description: "Scoping call, SOW (Statement of Work), RoE, pricing (project vs retainer vs day-rate), proposal writing, kick-off, readout call, follow-up & retest economics.", tier: 5, prerequisites: ["sec-report"], cardSlugs: ["sec-consultoria-engagement"] },
    { id: "sec-capstone", name: "Capstone: Engagement Completo", description: "Pentest end-to-end em escopo escolhido (web + cloud + AI). Pré-engagement → recon → scanning → exploitation → post-exploit → relatório executivo + técnico → readout simulado. Valida com /sentinela.", tier: 5, prerequisites: ["sec-ai-supply", "sec-ai-tools", "sec-consult"], cardSlugs: ["sec-capstone-pentest-engagement"], routeHref: "/sentinela" },
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
  GO_ENTERPRISE,
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
