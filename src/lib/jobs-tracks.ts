import type { JobTrack } from "./jobs-types";

export const JOB_TRACKS: JobTrack[] = [
  // ─── 1. Full Stack Pleno ───────────────────────────────────────────────────
  {
    slug: "fullstack-pleno",
    titulo: "Full Stack — Pleno",
    papel: "Full Stack Engineer",
    categoria: "engenharia",
    nivelAlvo: "pleno",
    resumo:
      "Consolida HTTP, REST, banco relacional, frontend SSR/RSC, deploy contêiner e testes. Foco em ser autônomo no ciclo completo de uma feature: puxar do backlog, entregar, revisar, monitorar.",
    preRequisitos: [
      "JavaScript/TypeScript básico — sabe escrever funções, async/await e tipagem simples",
      "Git: commits, branches, merges sem travar o time",
      "Já fez algum CRUD — seja em Node, Python ou PHP — não precisa ser bom",
      "Entende o que é HTTP na teoria (verbo, status code, header)",
    ],
    marcos: [
      {
        id: "fs-01",
        titulo: "Fundamentos HTTP e REST",
        tipo: "estudo",
        descricao:
          "Estude status codes, headers essenciais (Content-Type, Authorization, Cache-Control), idempotência e design de endpoints REST. Muita entrevista pleno começa aqui.",
        cardSlug: "dto-validation",
        estimateHours: 4,
      },
      {
        id: "fs-02",
        titulo: "Banco relacional: migrations, queries e N+1",
        tipo: "estudo",
        descricao:
          "Estude migrations zero downtime e o problema N+1. São os dois bugs de banco mais comuns em sistemas pleno — e os primeiros que o code review vai apontar.",
        cardSlug: "n-plus-1",
        estimateHours: 5,
      },
      {
        id: "fs-03",
        titulo: "Migrations zero downtime na prática",
        tipo: "estudo",
        descricao:
          "Aprenda a fazer rename de coluna e add foreign key sem derrubar produção. Indispensável pra sistemas em produção com tráfego real.",
        cardSlug: "migrations-zero-downtime",
        estimateHours: 3,
      },
      {
        id: "fs-04",
        titulo: "Server Components, Server Actions e App Router",
        tipo: "estudo",
        descricao:
          "Entenda o modelo mental do App Router do Next.js 15: o que roda no servidor, o que é client, quando usar use client. Isso diferencia junior de pleno em entrevistas frontend.",
        cardSlug: "server-components",
        estimateHours: 5,
      },
      {
        id: "fs-05",
        titulo: "Pratica: construir feature com Server Actions",
        tipo: "pratica",
        descricao:
          "Implemente um formulário real usando Server Actions — sem useState para o form. Valide com Zod no servidor. Use o Revisor para receber feedback de código.",
        routeHref: "/revisor",
        estimateHours: 4,
      },
      {
        id: "fs-06",
        titulo: "Autenticação: JWT vs Cookie de sessão",
        tipo: "estudo",
        descricao:
          "Estude as trade-offs de JWT stateless vs cookie httpOnly. Pleno precisa conseguir defender qualquer escolha em code review com argumentos concretos.",
        cardSlug: "session-cookie-vs-jwt",
        estimateHours: 3,
      },
      {
        id: "fs-07",
        titulo: "RBAC básico — quem pode o quê",
        tipo: "estudo",
        descricao:
          "Entenda Role-Based Access Control com exemplos concretos. Todo sistema pleno tem pelo menos duas roles — admin e usuário comum. Saber modelar isso é fundamental.",
        cardSlug: "rbac-vs-abac",
        estimateHours: 3,
      },
      {
        id: "fs-08",
        titulo: "Docker Compose no desenvolvimento local",
        tipo: "estudo",
        descricao:
          "Aprenda a subir Postgres + Redis + app com Docker Compose. Pleno não depende de ambiente local configurado na mão — tudo deve subir em um comando.",
        cardSlug: "docker-compose-dev",
        estimateHours: 3,
      },
      {
        id: "fs-09",
        titulo: "Testes de integração e unitários",
        tipo: "pratica",
        descricao:
          "Escreva testes para a feature que você construiu. Sprint Sem IA: implemente os testes sem usar autocomplete — isso força você a entender o que está testando.",
        routeHref: "/sprint-sem-ia",
        estimateHours: 6,
      },
      {
        id: "fs-10",
        titulo: "Revisão de código com Sentinela",
        tipo: "pratica",
        descricao:
          "Cole o código da feature no Sentinela e analise os apontamentos. Pratique receber e responder feedback de code review — habilidade central de pleno.",
        routeHref: "/sentinela",
        estimateHours: 2,
      },
      {
        id: "fs-11",
        titulo: "Armadilhas comuns da IA: N+1, sem paginação, sem validação",
        tipo: "estudo",
        descricao:
          "Estude os patterns de bugs que a IA introduz. Pleno deve ser o filtro — não deixar código gerado ir pra produção sem revisão consciente.",
        cardSlug: "ai-n-plus-1",
        estimateHours: 2,
      },
      {
        id: "fs-12",
        titulo: "Deploy com Docker multistage",
        tipo: "estudo",
        descricao:
          "Aprenda a construir imagem de produção enxuta com multistage build. Reduz tamanho da imagem, melhora segurança e acelera deploy.",
        cardSlug: "docker-multistage",
        estimateHours: 3,
      },
      {
        id: "fs-13",
        titulo: "System Design: monolito modular vs microsserviços",
        tipo: "pratica",
        descricao:
          "Resolva um cenário de system design de nível pleno: quando manter monolito, quando extrair serviço. Documente sua decisão.",
        routeHref: "/system-design",
        estimateHours: 4,
      },
      {
        id: "fs-14",
        titulo: "Mock Interview técnica nível pleno",
        tipo: "entrevista",
        descricao:
          "Simule uma entrevista técnica de full stack pleno. Foco em live coding, HTTP/REST e decisões de banco. Grave e revise onde travou.",
        routeHref: "/mock-interview",
        estimateHours: 2,
      },
      {
        id: "fs-15",
        titulo: "Banco STAR — situações de entrega e conflito",
        tipo: "entrevista",
        descricao:
          "Registre 3 situações reais no formato STAR: uma entrega difícil, um bug em produção que você resolveu, e uma vez que você pediu ajuda a tempo.",
        routeHref: "/banco-star",
        estimateHours: 2,
      },
    ],
    projetoPortfolio: {
      titulo: "API REST + Frontend SSR com auth e deploy contêiner",
      descricao:
        "Construa do zero uma aplicação com autenticação (cookie httpOnly), CRUD com banco relacional (Postgres via Drizzle), frontend Next.js App Router com Server Actions, Docker Compose local e deploy em VPS ou Railway.",
      entregaveis: [
        "Repositório público com README documentando decisões técnicas",
        "Dockerfile multistage gerando imagem < 200MB",
        "Suite de testes com cobertura mínima de casos críticos",
        "Vídeo de 5 minutos demonstrando o fluxo completo (auth → CRUD → erro tratado)",
      ],
    },
    preparacaoEntrevista: {
      topicos: [
        "HTTP: status codes, idempotência, diferença PUT vs PATCH",
        "Autenticação: JWT stateless vs cookie de sessão, onde guardar o token",
        "Banco: índices, N+1, migrations sem downtime, soft delete",
        "React/Next.js: Server Components vs Client Components, hydration",
        "Testes: pirâmide de testes, mocks vs stubs, o que testar",
        "Deploy: diferença de build para produção, variáveis de ambiente",
      ],
      rotasMock: ["/mock-interview", "/system-design", "/interrogatorio"],
      perguntasComuns: [
        "Qual a diferença entre autenticação e autorização? Me dê um exemplo concreto.",
        "Você está desenvolvendo uma feature e percebe que o ORM está fazendo 50 queries por request. Como você identifica e resolve isso?",
        "Explique o ciclo de vida de uma requisição HTTP de um formulário Next.js até o banco.",
        "Quando você usaria Cookie httpOnly vs JWT no localStorage?",
        "Como você faria uma migration de renomear coluna sem derrubar produção?",
        "Qual a diferença entre Server Component e Client Component no Next.js 15?",
        "Como você estruturaria os testes de uma feature de cadastro de usuário?",
        "Me fale de um bug em produção que você resolveu. Como você diagnosticou?",
        "Quando você pede ajuda a um colega vs tenta resolver sozinho?",
        "Como você decide entre criar uma nova tabela ou adicionar colunas numa existente?",
      ],
    },
  },

  // ─── 2. Backend Engineer Sênior ───────────────────────────────────────────
  {
    slug: "backend-senior",
    titulo: "Backend Engineer — Sênior",
    papel: "Backend Engineer",
    categoria: "engenharia",
    nivelAlvo: "senior",
    resumo:
      "Arquiteturas distribuídas, modelagem de dados para escala, infra como código, observabilidade de produção e segurança. Foco em tomar decisões técnicas defendíveis com trade-offs explícitos.",
    preRequisitos: [
      "Constrói e mantém APIs REST/gRPC sem auxílio constante",
      "Conhece banco relacional de verdade: índices, transações, EXPLAIN",
      "Já trabalhou com filas ou eventos assíncronos pelo menos uma vez",
      "Sabe ler stack trace e diagnosticar erro em produção sozinho",
    ],
    marcos: [
      {
        id: "be-01",
        titulo: "Arquiteturas: Clean, Hexagonal, DDD light",
        tipo: "estudo",
        descricao:
          "Estude Clean Architecture e Hexagonal com foco em como aplicar em sistemas reais — não apenas teoria. DDD light para modelagem de domínio sem over-engineering.",
        cardSlug: "clean-architecture",
        estimateHours: 6,
      },
      {
        id: "be-02",
        titulo: "Event-Driven e Outbox Pattern",
        tipo: "estudo",
        descricao:
          "Entenda event sourcing básico, CQRS, e como o Outbox Pattern resolve a garantia de entrega sem two-phase commit. Padrão obrigatório em sistemas com filas.",
        cardSlug: "event-driven",
        estimateHours: 5,
      },
      {
        id: "be-03",
        titulo: "Outbox + Saga: consistência eventual",
        tipo: "estudo",
        descricao:
          "Aprofunde em Saga Pattern para transações distribuídas. Quando usar choreography vs orchestration. Sênior precisa saber quando cada um quebra.",
        cardSlug: "saga-pattern",
        estimateHours: 4,
      },
      {
        id: "be-04",
        titulo: "Modelagem multi-tenant",
        tipo: "estudo",
        descricao:
          "Estude as três estratégias de multi-tenant (shared DB, shared schema, separate schema) com trade-offs de custo, isolamento e complexidade operacional.",
        cardSlug: "multi-tenant-strategies",
        estimateHours: 4,
      },
      {
        id: "be-05",
        titulo: "Rate limiting distribuído e caching em camadas",
        tipo: "estudo",
        descricao:
          "Rate limit com Redis sliding window vs token bucket. Caching: L1 in-process, L2 Redis, L3 CDN. Sênior sabe quando cada camada é necessária.",
        cardSlug: "rate-limit-distribuido",
        estimateHours: 4,
      },
      {
        id: "be-06",
        titulo: "Observabilidade: métricas, logs, traces",
        tipo: "estudo",
        descricao:
          "Estude os três pilares de observabilidade. Saber configurar não basta — saber o que instrumentar, como reduzir ruído e como correlacionar traces é o que diferencia sênior.",
        cardSlug: "observability",
        estimateHours: 5,
      },
      {
        id: "be-07",
        titulo: "Background jobs e filas assíncronas",
        tipo: "estudo",
        descricao:
          "Entenda dead letter queues, retry com backoff exponencial, idempotência em workers. Sistemas sem isso quebram silenciosamente em produção.",
        cardSlug: "background-jobs",
        estimateHours: 4,
      },
      {
        id: "be-08",
        titulo: "Segurança: RBAC vs ABAC e injeção de IA",
        tipo: "estudo",
        descricao:
          "Compare Role-Based e Attribute-Based Access Control para sistemas complexos. Estude prompt injection — cada vez mais relevante em backends que integram LLMs.",
        cardSlug: "rbac-vs-abac",
        estimateHours: 3,
      },
      {
        id: "be-09",
        titulo: "Armadilha: IA gerando monolito arquivo único",
        tipo: "pratica",
        descricao:
          "Identifique o anti-pattern de monolito gerado por IA e refatore usando o Revisor. Sênior deve impedir que código gerado destrua a arquitetura.",
        cardSlug: "ai-monolito-arquivo-unico",
        estimateHours: 3,
      },
      {
        id: "be-10",
        titulo: "Architecture Audit de um serviço real",
        tipo: "pratica",
        descricao:
          "Faça um audit completo de uma API que você mantém ou de um projeto open source. Use o Architecture Audit para estruturar os achados.",
        routeHref: "/architecture-audit",
        estimateHours: 4,
      },
      {
        id: "be-11",
        titulo: "RFC: proposta de migração de arquitetura",
        tipo: "pratica",
        descricao:
          "Escreva uma RFC para uma mudança arquitetural real — ex: extrair serviço, migrar para event-driven, ou implementar multi-tenant. Sênior deve saber convencer o time por escrito.",
        routeHref: "/rfc-writing",
        estimateHours: 6,
      },
      {
        id: "be-12",
        titulo: "War Game: decisão sob pressão — incidente de produção",
        tipo: "pratica",
        descricao:
          "Simule um incidente: API com latência 10x acima do normal, sem logs claros, sob pressão do time. Treine a tomada de decisão rápida e comunicação.",
        routeHref: "/war-game",
        estimateHours: 2,
      },
      {
        id: "be-13",
        titulo: "System Design: sistema de notificações em escala",
        tipo: "pratica",
        descricao:
          "Projete um sistema de notificações para 1M usuários: push, email, SMS, deduplicação, preferências por canal. Documente trade-offs.",
        routeHref: "/system-design",
        estimateHours: 4,
      },
      {
        id: "be-14",
        titulo: "Mock Interview técnica nível sênior",
        tipo: "entrevista",
        descricao:
          "Simule entrevista sênior com foco em system design e decisões arquiteturais. Foque em defender escolhas com trade-offs — não em acertar resposta certa.",
        routeHref: "/mock-interview",
        estimateHours: 2,
      },
      {
        id: "be-15",
        titulo: "Banco STAR: liderança técnica e situações difíceis",
        tipo: "entrevista",
        descricao:
          "Prepare histórias de quando você influenciou uma decisão técnica, quando discordou de alguém sênior com argumentos, e quando um sistema que você projetou falhou.",
        routeHref: "/banco-star",
        estimateHours: 2,
      },
    ],
    projetoPortfolio: {
      titulo: "Serviço de background jobs com observabilidade completa",
      descricao:
        "Construa um serviço de processamento assíncrono com filas (BullMQ ou similar), Outbox Pattern para garantia de entrega, retry com backoff exponencial, dead letter queue, métricas Prometheus e dashboard de observabilidade.",
      entregaveis: [
        "Serviço com arquitetura hexagonal documentada em ADR",
        "Outbox Pattern implementado com garantia de at-least-once delivery",
        "Dashboard de métricas mostrando throughput, latência p99 e DLQ rate",
        "Runbook de incidente documentando como diagnosticar falhas no sistema",
      ],
    },
    preparacaoEntrevista: {
      topicos: [
        "Consistência eventual vs forte: quando usar cada uma",
        "Como o Outbox Pattern resolve o problema de dual write",
        "Multi-tenant: trade-offs de shared schema vs separate schema",
        "Observabilidade: diferença entre métricas, logs e traces",
        "Rate limiting: sliding window vs token bucket, onde implementar",
        "CQRS: quando vale a complexidade adicional",
        "Saga: choreography vs orchestration e quando cada um quebra",
        "Segurança em APIs: RBAC, token scoping, auditoria",
      ],
      rotasMock: ["/mock-interview", "/system-design", "/architecture-audit", "/war-game"],
      perguntasComuns: [
        "Você precisa garantir que um email de confirmação seja enviado exatamente uma vez após um pagamento. Como você garante isso mesmo com falhas de rede?",
        "Me explique como você projetaria um sistema de auditoria para todas as ações críticas de usuários.",
        "Qual a diferença entre Saga com choreography e orchestration? Em que situação cada um quebra?",
        "Como você decide entre monolito modular e microsserviços para uma startup de 10 devs?",
        "Um endpoint está com latência 10x acima do normal desde ontem. Você não tem alertas configurados. O que você faz?",
        "Como você implementaria multi-tenant garantindo que dados de um cliente nunca vazem para outro?",
        "Explique o problema do N+1 e como você detecta em produção (sem code review).",
        "Quando você colocaria um cache? Qual a estratégia de invalidação?",
        "Me fale de uma decisão técnica que você tomou e depois arrependeu. O que aprendeu?",
        "Como você avalia se uma RFC está pronta para ser aprovada?",
      ],
    },
  },

  // ─── 3. Frontend Engineer Sênior ──────────────────────────────────────────
  {
    slug: "frontend-senior",
    titulo: "Frontend Engineer — Sênior",
    papel: "Frontend Engineer",
    categoria: "engenharia",
    nivelAlvo: "senior",
    resumo:
      "RSC/SSR avançado, performance real (Core Web Vitals), design systems escaláveis, state management sem over-engineering e acessibilidade. Foco em código que o time consegue manter por anos.",
    preRequisitos: [
      "React sólido: hooks, context, memoização básica",
      "TypeScript com generics simples",
      "CSS e responsive design sem frameworks CSS externos",
      "Já trabalhou com pelo menos uma aplicação em produção",
    ],
    marcos: [
      {
        id: "fe-01",
        titulo: "Server Components e RSC no App Router",
        tipo: "estudo",
        descricao:
          "Entenda o modelo de RSC profundamente: async components, data fetching no servidor, streaming, Suspense boundaries. É o maior shift mental do frontend moderno.",
        cardSlug: "server-components",
        estimateHours: 6,
      },
      {
        id: "fe-02",
        titulo: "Streaming e Suspense boundaries",
        tipo: "estudo",
        descricao:
          "Estude como usar Suspense para streaming progressivo de UI. Loading states que não bloqueiam o usuário são diferencial de sênior.",
        cardSlug: "streaming-suspense",
        estimateHours: 4,
      },
      {
        id: "fe-03",
        titulo: "Server Actions: formulários e mutations",
        tipo: "estudo",
        descricao:
          "Domine Server Actions para formulários — progressive enhancement, validação servidor-side, error handling, optimistic updates. A forma certa de fazer mutations em Next.js 15.",
        cardSlug: "server-actions",
        estimateHours: 4,
      },
      {
        id: "fe-04",
        titulo: "Pratica: refatorar componente com RSC + Server Actions",
        tipo: "pratica",
        descricao:
          "Pegue um componente client-heavy e refatore para usar RSC onde possível. Use o Revisor para receber feedback sobre a separação client/server.",
        routeHref: "/revisor",
        estimateHours: 5,
      },
      {
        id: "fe-05",
        titulo: "Performance: Core Web Vitals e bundle analysis",
        tipo: "pratica",
        descricao:
          "Meça LCP, CLS e INP de uma aplicação real. Use Lighthouse + bundle analyzer. Sênior sabe onde o tempo de carregamento está sendo desperdiçado.",
        routeHref: "/sprint-sem-ia",
        estimateHours: 5,
      },
      {
        id: "fe-06",
        titulo: "Design Systems: componentes composable e acessíveis",
        tipo: "estudo",
        descricao:
          "Estude como construir componentes composable (compound components, slot pattern) e acessíveis (ARIA, keyboard navigation). Diferencial enorme em times maiores.",
        cardSlug: "app-router",
        estimateHours: 4,
      },
      {
        id: "fe-07",
        titulo: "State management: quando cada solução faz sentido",
        tipo: "estudo",
        descricao:
          "Entenda o espectro de estado: local → context → Zustand → React Query/SWR. Sênior não usa Zustand pra tudo — sabe o custo de cada abstração.",
        cardSlug: "cqrs-lite",
        estimateHours: 3,
      },
      {
        id: "fe-08",
        titulo: "Armadilhas de IA no frontend: sem paginação, sem erro tratado",
        tipo: "estudo",
        descricao:
          "Revise os anti-patterns que a IA introduz no frontend. Código sem loading state, sem error boundary e sem paginação — é o que sênior precisa pegar no code review.",
        cardSlug: "ai-sem-paginacao",
        estimateHours: 2,
      },
      {
        id: "fe-09",
        titulo: "Revisão de código: code review como ato de ensino",
        tipo: "pratica",
        descricao:
          "Use o Sentinela para auditar componentes React. Pratique dar feedback construtivo — sênior usa code review para ensinar, não apenas para bloquear.",
        routeHref: "/sentinela",
        estimateHours: 3,
      },
      {
        id: "fe-10",
        titulo: "Monorepo com Turborepo — compartilhando design system",
        tipo: "estudo",
        descricao:
          "Estude como estruturar um monorepo com pacotes shared. Sênior precisa saber como escalar o frontend para múltiplos produtos sem duplicação.",
        cardSlug: "monorepo-turborepo",
        estimateHours: 4,
      },
      {
        id: "fe-11",
        titulo: "System Design frontend: portal multi-tenant",
        tipo: "pratica",
        descricao:
          "Projete um portal frontend para múltiplos clientes com branding diferente, feature flags e autenticação separada. Documente as decisões de arquitetura de componentes.",
        routeHref: "/system-design",
        estimateHours: 4,
      },
      {
        id: "fe-12",
        titulo: "War Game: feature com deadline apertado",
        tipo: "pratica",
        descricao:
          "Simule pressão de entrega: feature que parece simples mas tem edge cases de acessibilidade e performance. Treine priorização e comunicação de riscos.",
        routeHref: "/war-game",
        estimateHours: 2,
      },
      {
        id: "fe-13",
        titulo: "Mock Interview técnica — frontend sênior",
        tipo: "entrevista",
        descricao:
          "Simule entrevista com perguntas de performance, state management e arquitetura de componentes. Foque em defender escolhas com argumentos concretos.",
        routeHref: "/mock-interview",
        estimateHours: 2,
      },
      {
        id: "fe-14",
        titulo: "Banco STAR: situações de impacto no produto",
        tipo: "entrevista",
        descricao:
          "Prepare histórias de quando você melhorou performance de uma página, quando bloqueou código problemático em review, e quando propôs uma mudança no design system.",
        routeHref: "/banco-star",
        estimateHours: 2,
      },
    ],
    projetoPortfolio: {
      titulo: "Design system com componentes acessíveis e demo app RSC",
      descricao:
        "Construa um design system em monorepo com componentes totalmente acessíveis (WCAG AA), publicado como pacote interno, e uma demo app Next.js 15 usando RSC + Server Actions demonstrando performance real.",
      entregaveis: [
        "Pacote de componentes com Storybook documentando acessibilidade",
        "Demo app com Lighthouse score >= 90 em todas as métricas",
        "ADR documentando decisões de state management e arquitetura",
        "Bundle analysis mostrando code splitting e lazy loading aplicados",
      ],
    },
    preparacaoEntrevista: {
      topicos: [
        "RSC: quando usar Server Component vs Client Component",
        "Performance: LCP, CLS, INP — o que causa e como corrigir",
        "State management: por que não colocar tudo em contexto global",
        "Acessibilidade: ARIA, keyboard nav, screen readers",
        "Hydration: o que é hydration mismatch e como evitar",
        "Bundle splitting: dynamic import, route-based splitting",
        "Design systems: compound components, slot pattern",
      ],
      rotasMock: ["/mock-interview", "/system-design", "/sentinela"],
      perguntasComuns: [
        "Qual a diferença entre Server Component e Client Component? Quando você usaria cada um?",
        "Um usuário reporta que a página principal está lenta. Como você investiga e corrige?",
        "Como você estruturaria o estado global de uma aplicação de médio porte sem Zustand?",
        "O que é hydration mismatch? Como você diagnosticaria e resolveria?",
        "Como você garantiria acessibilidade em um dropdown customizado?",
        "Quando você usaria React.memo vs useMemo vs useCallback?",
        "Explique como o Suspense funciona com streaming no App Router.",
        "Como você organizaria um design system para ser usado em 3 produtos diferentes?",
        "Me fale de uma melhoria de performance que você implementou. Qual foi o impacto?",
        "Como você daria feedback num code review para um junior que fez algo funcionando mas não escalável?",
      ],
    },
  },

  // ─── 4. ML Engineer ───────────────────────────────────────────────────────
  {
    slug: "ml-engineer",
    titulo: "ML Engineer",
    papel: "Machine Learning Engineer",
    categoria: "dados",
    nivelAlvo: "senior",
    resumo:
      "Stack ML end-to-end: EDA, feature engineering, modelagem, validação rigorosa, deploy em produção, monitoramento de drift e MLOps. Foco em modelos que funcionam no mundo real, não apenas no notebook.",
    preRequisitos: [
      "Python sólido: list comprehensions, classes, bibliotecas comuns",
      "Estatística básica: média, variância, distribuição normal",
      "Já treinou algum modelo, mesmo que seguindo tutorial",
      "Conhece pandas no básico: DataFrame, groupby, merge",
    ],
    marcos: [
      {
        id: "ml-01",
        titulo: "Pensamento estatístico para ML",
        tipo: "estudo",
        descricao:
          "Entenda distribuições, hipóteses, p-value e intervalos de confiança de forma aplicada. ML Engineer que não entende estatística toma decisões erradas sobre modelos.",
        cardSlug: "statistical-thinking",
        estimateHours: 6,
      },
      {
        id: "ml-02",
        titulo: "EDA: análise exploratória de dados real",
        tipo: "pratica",
        descricao:
          "Execute um EDA completo num dataset real. Use o workflow documentado — distribuições, outliers, correlações, missing values. Sem EDA rigoroso, o modelo vai ser lixo.",
        cardSlug: "eda-workflow",
        estimateHours: 6,
      },
      {
        id: "ml-03",
        titulo: "Feature engineering: criar features que importam",
        tipo: "estudo",
        descricao:
          "Estude encoding, transformações, features temporais e interações. A maior fonte de melhoria de modelo não é o algoritmo — é a feature.",
        cardSlug: "feature-engineering",
        estimateHours: 5,
      },
      {
        id: "ml-04",
        titulo: "Data leakage: o bug silencioso de ML",
        tipo: "estudo",
        descricao:
          "Entenda data leakage e como ele destrói a validade do modelo sem você perceber. É o erro mais comum de ML em produção — e o mais devastador.",
        cardSlug: "data-leakage",
        estimateHours: 4,
      },
      {
        id: "ml-05",
        titulo: "Avaliação de modelos sem ilusão",
        tipo: "estudo",
        descricao:
          "Cross-validation, métricas além da acurácia, curva ROC, PR curve, calibração. ML Engineer precisa saber qual métrica importa para o negócio — não apenas pra competição.",
        cardSlug: "ml-evaluation",
        estimateHours: 5,
      },
      {
        id: "ml-06",
        titulo: "Overfitting: estratégias reais",
        tipo: "estudo",
        descricao:
          "Regularização, early stopping, dropout, data augmentation, simplificação do modelo. Entenda por que overfitting acontece e como diagnosticar com learning curves.",
        cardSlug: "overfitting-strategies",
        estimateHours: 4,
      },
      {
        id: "ml-07",
        titulo: "Pipeline sklearn: transformers, pipelines e GridSearch",
        tipo: "pratica",
        descricao:
          "Construa um Pipeline sklearn end-to-end com preprocessor, modelo e cross-validation. Sprint Sem IA: escreva o pipeline na mão, sem autocomplete.",
        cardSlug: "sklearn-patterns",
        routeHref: "/sprint-sem-ia",
        estimateHours: 6,
      },
      {
        id: "ml-08",
        titulo: "Probabilidade e álgebra linear para ML",
        tipo: "pratica",
        descricao:
          "Reforce a base matemática: probabilidade condicional, Bayes, matrizes, decomposição SVD. Use o Math Quest para exercícios adaptativos de probabilidade.",
        routeHref: "/matematica",
        estimateHours: 8,
      },
      {
        id: "ml-09",
        titulo: "Deploy de modelo em produção",
        tipo: "estudo",
        descricao:
          "Entenda as opções de deploy: API REST com FastAPI, batch scoring, model serving com BentoML/Ray Serve. Saber treinar um modelo é metade — saber servir é a outra metade.",
        cardSlug: "ml-pipeline-production",
        estimateHours: 5,
      },
      {
        id: "ml-10",
        titulo: "MLOps básico: versionamento e tracking",
        tipo: "estudo",
        descricao:
          "Estude MLflow ou W&B para tracking de experimentos, versionamento de dados e modelos. Sem isso, você não consegue reproduzir um resultado de 3 meses atrás.",
        cardSlug: "mlops-basics",
        estimateHours: 5,
      },
      {
        id: "ml-11",
        titulo: "Seleção de modelo: quando complexidade vale a pena",
        tipo: "estudo",
        descricao:
          "Estude o bias-variance tradeoff na prática. Entenda quando usar linear vs tree-based vs neural. Modelo mais simples que funciona é sempre preferível.",
        cardSlug: "model-selection",
        estimateHours: 4,
      },
      {
        id: "ml-12",
        titulo: "Pratica: RFC de arquitetura de pipeline ML",
        tipo: "pratica",
        descricao:
          "Escreva uma RFC propondo um pipeline ML end-to-end para um problema real: ingestão, features, treinamento, deploy e monitoramento de drift.",
        routeHref: "/rfc-writing",
        estimateHours: 5,
      },
      {
        id: "ml-13",
        titulo: "Mock Interview: ML Engineer",
        tipo: "entrevista",
        descricao:
          "Simule entrevista técnica de ML Engineer. Perguntas de avaliação de modelo, overfitting, feature engineering e system design de pipeline.",
        routeHref: "/mock-interview",
        estimateHours: 2,
      },
      {
        id: "ml-14",
        titulo: "Banco STAR: projeto de ML com impacto mensurável",
        tipo: "entrevista",
        descricao:
          "Prepare histórias de um modelo que você deployou, um problema de data leakage que você encontrou, e uma vez que o modelo funcionou no notebook mas falhou em produção.",
        routeHref: "/banco-star",
        estimateHours: 2,
      },
    ],
    projetoPortfolio: {
      titulo: "Pipeline ML end-to-end com deploy e monitoramento de drift",
      descricao:
        "Construa um pipeline completo: EDA documentado, feature engineering, múltiplos modelos comparados com métricas corretas, deploy como API, monitoramento de data drift com Evidently, e retraining trigger.",
      entregaveis: [
        "Notebook de EDA com análise de dados e hipóteses documentadas",
        "Pipeline sklearn/reproducible com MLflow tracking de experimentos",
        "API de predição deployada com latência p99 documentada",
        "Dashboard de monitoramento com alertas de drift configurados",
      ],
    },
    preparacaoEntrevista: {
      topicos: [
        "Bias-variance tradeoff: como diagnosticar e corrigir",
        "Data leakage: tipos, como prevenir em pipelines reais",
        "Métricas: quando usar F1 vs ROC-AUC vs precision-recall",
        "Feature importance: SHAP vs gain vs permutation",
        "Overfitting: regularização, cross-validation, early stopping",
        "Deploy: batch vs real-time scoring, latência vs throughput",
        "Drift: data drift vs concept drift, como monitorar",
        "Reproducibilidade: como garantir que o modelo de 6 meses atrás seja reproduzível",
      ],
      rotasMock: ["/mock-interview", "/system-design", "/interrogatorio"],
      perguntasComuns: [
        "Seu modelo tem 95% de acurácia no teste mas performa mal em produção. O que você investiga primeiro?",
        "Explique a diferença entre data drift e concept drift. Como você detecta cada um?",
        "Como você escolheria entre um modelo de regressão logística e um gradient boosting para um problema de churn?",
        "O que é data leakage? Me dê um exemplo concreto de como ele pode acontecer num pipeline de features temporais.",
        "Como você garantiria que um experimento de ML é reproduzível 6 meses depois?",
        "Explique o que é cross-validation e por que accuracy no teste não é suficiente.",
        "Quando você usaria métricas de recall vs precision como principal critério de avaliação?",
        "Como você estruturaria um pipeline de MLOps para um time de 5 engenheiros?",
        "Me fale de um modelo que falhou em produção. O que aconteceu e o que você aprendeu?",
        "Como você explicaria para um stakeholder não-técnico por que o modelo errou numa predição importante?",
      ],
    },
  },

  // ─── 5. AI Engineer (LLM) ─────────────────────────────────────────────────
  {
    slug: "ai-engineer-llm",
    titulo: "AI Engineer (LLM)",
    papel: "AI Engineer",
    categoria: "ia",
    nivelAlvo: "senior",
    resumo:
      "LLMs em produção: RAG, eval, prompt engineering, controle de custo e latência, observabilidade, hallucination e segurança. Foco em colocar IA que funciona — não demos que impressionam.",
    preRequisitos: [
      "JavaScript ou Python sólido para construir APIs",
      "Conceito básico de embeddings e similaridade semântica",
      "Já usou a API da OpenAI ou Anthropic pelo menos uma vez",
      "Entende o que são tokens e como o pricing funciona",
    ],
    marcos: [
      {
        id: "ai-01",
        titulo: "Fundamentos de LLMs: tokens, context window, temperatura",
        tipo: "estudo",
        descricao:
          "Entenda como LLMs funcionam de verdade: tokenização, context window, temperatura, top-p, stop sequences. Sem esse fundamento, prompts serão sempre tentativa e erro.",
        cardSlug: "llm-fundamentos",
        estimateHours: 5,
      },
      {
        id: "ai-02",
        titulo: "Prompt engineering avançado",
        tipo: "estudo",
        descricao:
          "Estude chain-of-thought, few-shot, system prompts, delimitadores e técnicas de elicitação. Prompt engineering é engenharia — tem princípios, não é magia.",
        cardSlug: "prompt-engineering-avancado",
        estimateHours: 5,
      },
      {
        id: "ai-03",
        titulo: "RAG fundamentos: embeddings, retrieval, reranking",
        tipo: "estudo",
        descricao:
          "Entenda o pipeline RAG completo: chunking, embeddings, vector store, retrieval, reranking e geração. Cada etapa tem trade-offs de qualidade vs custo.",
        cardSlug: "rag-fundamentos",
        estimateHours: 6,
      },
      {
        id: "ai-04",
        titulo: "Vector databases: escolha e configuração",
        tipo: "estudo",
        descricao:
          "Estude as opções de vector store (Pinecone, Weaviate, pgvector, Qdrant). Quando usar cada uma, custo, escala e limitações em produção.",
        cardSlug: "vector-databases",
        estimateHours: 4,
      },
      {
        id: "ai-05",
        titulo: "RAG avançado: GraphRAG, híbrido, eval",
        tipo: "estudo",
        descricao:
          "Aprenda RAG híbrido (dense + sparse), GraphRAG para documentos com relações, e como avaliar retrieval com métricas como MRR e NDCG.",
        cardSlug: "rag-avancado",
        estimateHours: 6,
      },
      {
        id: "ai-06",
        titulo: "Tool use e function calling",
        tipo: "estudo",
        descricao:
          "Domine function calling da OpenAI e tool use da Anthropic. Entenda quando o modelo decide usar uma ferramenta, como tratar erros e como garantir respostas estruturadas.",
        cardSlug: "tool-use-function-calling",
        estimateHours: 5,
      },
      {
        id: "ai-07",
        titulo: "Anthropic SDK patterns e streaming",
        tipo: "pratica",
        descricao:
          "Implemente streaming com o SDK da Anthropic, incluindo error handling, retry e token counting. Use o Sentinela para auditar o código gerado.",
        cardSlug: "anthropic-sdk-patterns",
        routeHref: "/sentinela",
        estimateHours: 5,
      },
      {
        id: "ai-08",
        titulo: "Observabilidade com LangSmith",
        tipo: "estudo",
        descricao:
          "Configure tracing completo com LangSmith: traces de prompt, latência por step, custo por request. Sem observabilidade, você não sabe onde o dinheiro vai.",
        cardSlug: "langsmith-observabilidade",
        estimateHours: 4,
      },
      {
        id: "ai-09",
        titulo: "Hallucination: detecção e mitigação",
        tipo: "pratica",
        descricao:
          "Implemente um pipeline de detecção de hallucination usando o Sentinela. Estude grounding, citações e self-consistency como técnicas de mitigação.",
        routeHref: "/sentinela",
        estimateHours: 4,
      },
      {
        id: "ai-10",
        titulo: "Segurança: prompt injection e jailbreak",
        tipo: "estudo",
        descricao:
          "Estude prompt injection, jailbreak e como defender sistemas LLM. Inclui input sanitization, output validation e mecanismos de contenção.",
        cardSlug: "ai-prompt-injection",
        estimateHours: 4,
      },
      {
        id: "ai-11",
        titulo: "Pratica: construir pipeline RAG com eval",
        tipo: "pratica",
        descricao:
          "Construa um pipeline RAG funcional e escreva uma suite de eval usando LangSmith ou Ragas. Sprint Sem IA: implemente o retrieval sem usar biblioteca pronta.",
        routeHref: "/sprint-sem-ia",
        estimateHours: 8,
      },
      {
        id: "ai-12",
        titulo: "System Design: sistema RAG para base de conhecimento corporativa",
        tipo: "pratica",
        descricao:
          "Projete um RAG para 100k documentos internos: chunking strategy, atualização incremental, controle de acesso por documento, custo e latência.",
        routeHref: "/system-design",
        estimateHours: 4,
      },
      {
        id: "ai-13",
        titulo: "RFC: proposta de avaliação de LLM em produção",
        tipo: "pratica",
        descricao:
          "Escreva uma RFC sobre como avaliar a qualidade de um sistema LLM em produção: métricas automatizadas, human eval, regressão, golden datasets.",
        routeHref: "/rfc-writing",
        estimateHours: 5,
      },
      {
        id: "ai-14",
        titulo: "Mock Interview: AI Engineer nível sênior",
        tipo: "entrevista",
        descricao:
          "Simule entrevista com foco em RAG, eval, custo de LLMs e decisões de arquitetura. Pratique explicar trade-offs de chunking, embedding models e retrieval strategies.",
        routeHref: "/mock-interview",
        estimateHours: 2,
      },
      {
        id: "ai-15",
        titulo: "Banco STAR: projeto LLM em produção",
        tipo: "entrevista",
        descricao:
          "Prepare histórias de um sistema LLM que você deployou, um problema de hallucination que você resolveu, e uma decisão de custo vs qualidade que você precisou tomar.",
        routeHref: "/banco-star",
        estimateHours: 2,
      },
    ],
    projetoPortfolio: {
      titulo: "Sistema RAG com eval automatizado e observabilidade completa",
      descricao:
        "Construa um sistema RAG end-to-end com chunking configurável, vector store, reranking, tracing com LangSmith, suite de eval automatizada e dashboard de custos. Demonstre como detectar e mitigar hallucination.",
      entregaveis: [
        "Pipeline RAG com ao menos 3 estratégias de chunking comparadas via eval",
        "Dashboard LangSmith mostrando traces, latência e custo por query",
        "Suite de testes com golden dataset e métricas de relevância e fidelidade",
        "Documentação de security checklist contra prompt injection",
      ],
    },
    preparacaoEntrevista: {
      topicos: [
        "RAG: chunking strategies e trade-offs de qualidade vs custo",
        "Hallucination: tipos, causas e técnicas de mitigação",
        "Eval: como construir um golden dataset, LLM-as-judge",
        "Observabilidade: o que você instrumenta num sistema LLM",
        "Custo: como controlar tokens, quando usar modelos menores",
        "Prompt engineering: chain-of-thought, few-shot, system prompts",
        "Segurança: prompt injection, output validation",
        "Vector stores: HNSW vs IVF, dimensões de embedding, reranking",
      ],
      rotasMock: ["/mock-interview", "/system-design", "/sentinela", "/interrogatorio"],
      perguntasComuns: [
        "Como você escolheria o tamanho de chunk para um RAG sobre documentos jurídicos longos?",
        "Seu sistema RAG está retornando respostas incorretas com frequência. Como você diagnosticaria se o problema é retrieval ou geração?",
        "Como você controlaria o custo de um sistema que processa 100k queries por dia?",
        "Explique a diferença entre RAG denso e híbrido (dense + sparse). Quando cada um performa melhor?",
        "O que é prompt injection? Me dê um exemplo de ataque e como defender.",
        "Como você avaliaria a qualidade de um sistema LLM em produção sem avaliação humana constante?",
        "Quando você usaria fine-tuning em vez de RAG?",
        "Como você garantiria que o modelo não use informações fora da base de conhecimento autorizada?",
        "Me fale de um sistema LLM que falhou em produção. O que você aprendeu?",
        "Como você justificaria o custo de LLMs para um stakeholder focado em ROI?",
      ],
    },
  },

  // ─── 6. AI Agent Engineer ─────────────────────────────────────────────────
  {
    slug: "ai-agent-engineer",
    titulo: "AI Agent Engineer",
    papel: "AI Agent Engineer",
    categoria: "ia",
    nivelAlvo: "senior",
    resumo:
      "Agentes autônomos com tool use, multi-agent, ReAct, memória, observabilidade e eval. MCP Protocol, human-in-the-loop e segurança de agentes. Foco em agentes que não travam em loop nem gastam dinheiro à toa.",
    preRequisitos: [
      "Confortável com LLMs: tokens, prompts, function calling",
      "Python ou TypeScript para construir sistemas de produção",
      "Já usou LangChain ou SDK da Anthropic/OpenAI em algum projeto",
      "Entende async/await e tratamento de erros em APIs externas",
    ],
    marcos: [
      {
        id: "ag-01",
        titulo: "LangChain fundamentos: chains, tools e memory",
        tipo: "estudo",
        descricao:
          "Estude LangChain com foco em como chains encadeiam chamadas, como tools são registradas e como memory persiste contexto. Base para entender frameworks de agentes.",
        cardSlug: "langchain-fundamentos",
        estimateHours: 5,
      },
      {
        id: "ag-02",
        titulo: "LangGraph fundamentos: grafo de estados",
        tipo: "estudo",
        descricao:
          "Entenda o modelo de grafo de estados do LangGraph: nodes, edges, state management. É o framework mais robusto para agentes com fluxos complexos.",
        cardSlug: "langgraph-fundamentos",
        estimateHours: 6,
      },
      {
        id: "ag-03",
        titulo: "Tool use e function calling em profundidade",
        tipo: "estudo",
        descricao:
          "Domine o ciclo de tool use: definição de schema, invocação pelo modelo, execução, resultado de volta ao modelo. Inclui parallel tool calls e tratamento de erros.",
        cardSlug: "tool-use-function-calling",
        estimateHours: 5,
      },
      {
        id: "ag-04",
        titulo: "Claude tool use patterns",
        tipo: "estudo",
        descricao:
          "Estude os patterns específicos do Claude para tool use: como estruturar system prompts, tool descriptions que funcionam, e como o modelo decide chamar ferramentas.",
        cardSlug: "claude-tool-use",
        estimateHours: 4,
      },
      {
        id: "ag-05",
        titulo: "Pratica: War Game — agente entrando em loop",
        tipo: "pratica",
        descricao:
          "Simule o cenário de um agente que entra em loop infinito de tool calls. Treine como detectar, interromper e redesenhar o fluxo para evitar o problema.",
        routeHref: "/war-game",
        estimateHours: 3,
      },
      {
        id: "ag-06",
        titulo: "Memória de agentes: patterns de persistência",
        tipo: "estudo",
        descricao:
          "Estude in-context memory, external memory (episódico, semântico, procedural) e como decidir o que guardar. Agente sem memória bem projetada re-aprende tudo a cada conversa.",
        cardSlug: "agent-memory-patterns",
        estimateHours: 5,
      },
      {
        id: "ag-07",
        titulo: "Multi-agent orchestration",
        tipo: "estudo",
        descricao:
          "Entenda orchestration vs choreography de agentes, como passar contexto entre agentes e como lidar com falhas em sub-agentes. Inclui padrões de handoff.",
        cardSlug: "multi-agent-orchestration",
        estimateHours: 6,
      },
      {
        id: "ag-08",
        titulo: "LangGraph patterns avançados",
        tipo: "estudo",
        descricao:
          "Condicional edges, checkpointing, subgraphs e parallelism no LangGraph. Esses patterns são o que separa agentes de brinquedo de sistemas de produção.",
        cardSlug: "langgraph-patterns",
        estimateHours: 5,
      },
      {
        id: "ag-09",
        titulo: "Human-in-the-loop: quando o agente precisa de você",
        tipo: "estudo",
        descricao:
          "Estude aprovação explícita, interrupt nodes e clarification requests. Agente que age autonomamente em tudo é perigoso — saber onde colocar humano é design.",
        cardSlug: "human-in-the-loop",
        estimateHours: 4,
      },
      {
        id: "ag-10",
        titulo: "MCP Protocol: context padronizado para agentes",
        tipo: "estudo",
        descricao:
          "Entenda o Model Context Protocol da Anthropic: como servidores MCP expõem tools e resources, integração com Claude Desktop e como construir seu próprio servidor.",
        cardSlug: "mcp-protocol",
        estimateHours: 5,
      },
      {
        id: "ag-11",
        titulo: "Observabilidade com LangSmith",
        tipo: "pratica",
        descricao:
          "Configure tracing completo para um agente LangGraph. Trace cada tool call, latência e custo. Sem observabilidade, você não sabe onde o agente está gastando tokens.",
        cardSlug: "langsmith-observabilidade",
        routeHref: "/sentinela",
        estimateHours: 5,
      },
      {
        id: "ag-12",
        titulo: "Segurança de agentes: prompt injection e privilégio mínimo",
        tipo: "estudo",
        descricao:
          "Estude os vetores de ataque específicos de agentes: indirect prompt injection via tool results, escalação de privilégio, e como sandboxar execução de código.",
        cardSlug: "agent-security",
        estimateHours: 4,
      },
      {
        id: "ag-13",
        titulo: "Eval de agentes: métricas que importam",
        tipo: "estudo",
        descricao:
          "Avalie agentes com task completion rate, ferramentas usadas vs esperadas, custo por task e latência. LLM-as-judge para avaliação de qualidade de resposta.",
        cardSlug: "agent-evaluation",
        estimateHours: 5,
      },
      {
        id: "ag-14",
        titulo: "System Design: agente financeiro com multi-agent",
        tipo: "pratica",
        descricao:
          "Projete um sistema multi-agent para análise financeira: orquestrador, agente de dados, agente de análise, agente de relatório. Documente checkpoints de human-in-the-loop.",
        cardSlug: "agente-financeiro-erp",
        routeHref: "/system-design",
        estimateHours: 5,
      },
      {
        id: "ag-15",
        titulo: "RFC: arquitetura de agente para produção",
        tipo: "pratica",
        descricao:
          "Escreva uma RFC completa para um sistema de agentes: diagrama de fluxo, tools, memória, observabilidade, eval e plano de rollback.",
        routeHref: "/rfc-writing",
        estimateHours: 5,
      },
      {
        id: "ag-16",
        titulo: "Mock Interview: AI Agent Engineer",
        tipo: "entrevista",
        descricao:
          "Simule entrevista com foco em design de agentes, tool use, multi-agent e segurança. Pratique explicar decisões de design com trade-offs concretos.",
        routeHref: "/mock-interview",
        estimateHours: 2,
      },
      {
        id: "ag-17",
        titulo: "Banco STAR: agente em produção",
        tipo: "entrevista",
        descricao:
          "Prepare histórias de um agente que você deployou, um problema de loop ou custo excessivo que você resolveu, e como você adicionou human-in-the-loop a um fluxo problemático.",
        routeHref: "/banco-star",
        estimateHours: 2,
      },
    ],
    projetoPortfolio: {
      titulo: "Mini agente de produção com multi-agent, MCP e observabilidade",
      descricao:
        "Construa um agente LangGraph com ao menos 3 tools, memória persistente, checkpointing, human-in-the-loop em ações críticas, tracing completo no LangSmith e suite de eval com task completion rate.",
      entregaveis: [
        "Agente LangGraph com grafo de estados documentado e human-in-the-loop explícito",
        "Servidor MCP próprio expondo ao menos 2 resources para o agente",
        "Dashboard LangSmith com traces, custo por task e eval score",
        "Documento de threat model cobrindo prompt injection e escalação de privilégio",
      ],
    },
    preparacaoEntrevista: {
      topicos: [
        "ReAct: como o ciclo Reason-Act-Observe funciona",
        "Multi-agent: quando dividir em agentes vs manter num só",
        "Memória: tipos de memória e quando usar cada um",
        "Human-in-the-loop: como decidir onde colocar aprovação humana",
        "Segurança: indirect prompt injection via tool results",
        "Eval: como medir qualidade de um agente sem avaliação humana constante",
        "MCP: como o protocolo padroniza context para agentes",
        "Custo: como controlar token usage em agentes de longa execução",
      ],
      rotasMock: ["/mock-interview", "/system-design", "/war-game", "/sentinela"],
      perguntasComuns: [
        "Como você detectaria e quebraria um loop infinito num agente LangGraph?",
        "Um agente está chamando uma tool 15 vezes em sequência. Como você diagnosticaria e resolveria?",
        "Como você decidiria quais ações de um agente requerem aprovação humana explícita?",
        "Explique indirect prompt injection com um exemplo concreto e como defender.",
        "Qual a diferença entre orquestração e coreografia em sistemas multi-agent?",
        "Como você avaliaria a qualidade de um agente de forma automatizada?",
        "Quando você usaria LangGraph vs implementar um agente customizado sem framework?",
        "Como você garantiria que um agente com acesso ao banco de dados nunca execute DELETE acidental?",
        "Me fale de um agente que falhou em produção. O que aconteceu e o que você mudou?",
        "Como você controlaria o custo de um agente que pode chamar muitas ferramentas?",
      ],
    },
  },

  // ─── 7. Data Scientist ────────────────────────────────────────────────────
  {
    slug: "data-scientist",
    titulo: "Data Scientist",
    papel: "Data Scientist",
    categoria: "dados",
    nivelAlvo: "pleno",
    resumo:
      "Estatística aplicada, EDA rigorosa, ML clássico bem validado, comunicação de incerteza e pipelines reproduzíveis. Foco em análise que resiste a escrutínio e comunica com clareza.",
    preRequisitos: [
      "Python sólido com pandas e numpy no básico",
      "Estatística descritiva: média, desvio padrão, distribuição",
      "Já fez pelo menos um projeto de análise de dados, mesmo que acadêmico",
      "Sabe o que é um modelo de regressão e como interpretar coeficientes",
    ],
    marcos: [
      {
        id: "ds-01",
        titulo: "Pensamento estatístico: hipóteses e incerteza",
        tipo: "estudo",
        descricao:
          "Estatística inferencial aplicada: testes de hipótese, p-value, intervalos de confiança e tamanho de efeito. Data Scientist que não quantifica incerteza toma decisões erradas.",
        cardSlug: "statistical-thinking",
        estimateHours: 6,
      },
      {
        id: "ds-02",
        titulo: "Pandas avançado: agregações, transforms e performance",
        tipo: "pratica",
        descricao:
          "Domine groupby, pivot, melt, apply e como evitar loops em pandas. Sprint Sem IA: resolva 5 problemas de manipulação de dados sem autocomplete.",
        cardSlug: "pandas-patterns",
        routeHref: "/sprint-sem-ia",
        estimateHours: 6,
      },
      {
        id: "ds-03",
        titulo: "EDA: análise exploratória sistemática",
        tipo: "pratica",
        descricao:
          "Execute EDA completa num dataset real. Documente distribuições, outliers, correlações e hipóteses. EDA sem documentação é EDA que não transfere conhecimento.",
        cardSlug: "eda-workflow",
        estimateHours: 6,
      },
      {
        id: "ds-04",
        titulo: "Data cleaning: identificar e tratar problemas",
        tipo: "estudo",
        descricao:
          "Estude missing values, outliers, duplicatas, encoding errors e dados inconsistentes. 80% do tempo de Data Science vai pra cleaning — faça bem.",
        cardSlug: "data-cleaning",
        estimateHours: 4,
      },
      {
        id: "ds-05",
        titulo: "Feature engineering: criar sinal a partir do ruído",
        tipo: "estudo",
        descricao:
          "Transformações, interações, features temporais, encoding categórico. A diferença entre um modelo mediano e um bom geralmente está nas features, não no algoritmo.",
        cardSlug: "feature-engineering",
        estimateHours: 5,
      },
      {
        id: "ds-06",
        titulo: "Data leakage: invalidar análise silenciosamente",
        tipo: "estudo",
        descricao:
          "Entenda como data leakage destrói a validade de qualquer análise. É o erro mais comum — e mais constrangedor — em Data Science. Aprenda a prevenir em pipelines reais.",
        cardSlug: "data-leakage",
        estimateHours: 3,
      },
      {
        id: "ds-07",
        titulo: "Probabilidade para Data Science",
        tipo: "pratica",
        descricao:
          "Probabilidade condicional, distribuições, Bayes, esperança. A matemática por trás dos modelos que você usa. Reforce com Math Quest em probabilidade.",
        cardSlug: "probabilidade",
        routeHref: "/matematica",
        estimateHours: 8,
      },
      {
        id: "ds-08",
        titulo: "Avaliação de modelos: métricas corretas por problema",
        tipo: "estudo",
        descricao:
          "Escolha a métrica certa para cada problema: classificação desbalanceada, regressão com outliers, ranking. Reportar accuracy em dataset desbalanceado é desonestidade técnica.",
        cardSlug: "ml-evaluation",
        estimateHours: 4,
      },
      {
        id: "ds-09",
        titulo: "Overfitting e seleção de modelo",
        tipo: "estudo",
        descricao:
          "Cross-validation, regularização, bias-variance. Seleção de modelo com critérios objetivos. Data Scientist bom não escolhe modelo pelo que soa mais impressionante.",
        cardSlug: "overfitting-strategies",
        estimateHours: 4,
      },
      {
        id: "ds-10",
        titulo: "Pipeline reproduzível com sklearn",
        tipo: "pratica",
        descricao:
          "Construa um pipeline sklearn com preprocessor + modelo + cross-validation que qualquer colega pode executar e reproduzir. Reprodutibilidade não é opcional.",
        cardSlug: "sklearn-patterns",
        estimateHours: 5,
      },
      {
        id: "ds-11",
        titulo: "Comunicação: análise que convence stakeholders",
        tipo: "pratica",
        descricao:
          "Escreva um relatório de análise como se fosse para o CEO: hipótese, método, resultado, incerteza, recomendação. Use o Interrogatório para fortalecer argumentos.",
        routeHref: "/interrogatorio",
        estimateHours: 4,
      },
      {
        id: "ds-12",
        titulo: "Mock Interview: Data Scientist",
        tipo: "entrevista",
        descricao:
          "Simule entrevista com perguntas de estatística aplicada, avaliação de modelos e comunicação de resultados. Pratique defender escolhas metodológicas.",
        routeHref: "/mock-interview",
        estimateHours: 2,
      },
      {
        id: "ds-13",
        titulo: "Banco STAR: projeto de análise com impacto",
        tipo: "entrevista",
        descricao:
          "Prepare histórias de uma análise que influenciou uma decisão de negócio, um problema de data leakage que você encontrou, e uma vez que você apresentou incerteza honestamente.",
        routeHref: "/banco-star",
        estimateHours: 2,
      },
    ],
    projetoPortfolio: {
      titulo: "Análise end-to-end com modelo validado e relatório para stakeholder",
      descricao:
        "Escolha um problema de negócio real ou dataset público. Execute EDA documentada, modele com validação rigorosa, compare modelos com métricas corretas e entregue um relatório de análise que um stakeholder não-técnico consiga usar para tomar decisão.",
      entregaveis: [
        "Notebook de EDA com hipóteses e achados documentados em markdown",
        "Pipeline reproduzível com MLflow ou equivalente trackando experimentos",
        "Relatório executivo de 1 página com resultado, incerteza e recomendação",
        "Apresentação de 10 slides demonstrando análise para audiência não-técnica",
      ],
    },
    preparacaoEntrevista: {
      topicos: [
        "Estatística inferencial: quando usar cada teste de hipótese",
        "Avaliação: métricas por tipo de problema, datasets desbalanceados",
        "Data leakage: exemplos concretos e prevenção em pipelines",
        "Comunicação: como apresentar incerteza para stakeholders",
        "Feature engineering: como criar features que o modelo consegue usar",
        "Reproducibilidade: como garantir que outros possam verificar sua análise",
      ],
      rotasMock: ["/mock-interview", "/interrogatorio", "/banco-star"],
      perguntasComuns: [
        "Seu modelo tem 99% de acurácia mas o cliente está insatisfeito. O que você investigaria?",
        "Como você explicaria p-value para um gerente sem background técnico?",
        "Me mostre como você faria EDA num dataset com 30% de missing values.",
        "Como você detectaria e trataria outliers numa feature de renda?",
        "Qual a diferença entre correlação e causalidade? Dê um exemplo onde confundir os dois seria perigoso.",
        "Como você reportaria a incerteza de uma previsão para um tomador de decisão?",
        "Explique como data leakage pode aparecer num pipeline de forecasting.",
        "Quando você usaria regressão logística vs gradient boosting?",
        "Como você garantiria que sua análise é reproduzível 6 meses depois?",
        "Me fale de uma análise que você fez que influenciou uma decisão real. Qual foi o impacto?",
      ],
    },
  },

  // ─── 8. DevSecOps / Security Engineer ────────────────────────────────────
  {
    slug: "devsecops-security",
    titulo: "DevSecOps / Security Engineer",
    papel: "Security Engineer",
    categoria: "seguranca",
    nivelAlvo: "senior",
    resumo:
      "Zero Trust, RBAC/ABAC, OAuth 2.1, prompt injection, monitoramento moderno e modelagem de ameaças. Foco em segurança que é parte do processo de desenvolvimento, não auditoria pós-fato.",
    preRequisitos: [
      "Entende HTTP, TLS e como cookies e tokens funcionam",
      "Já implementou autenticação básica em algum sistema",
      "Conhece o conceito de least privilege e por que importa",
      "Sabe o que é uma CVE e como acompanhar vulnerabilidades",
    ],
    marcos: [
      {
        id: "sec-01",
        titulo: "Arquitetura de autenticação moderna",
        tipo: "estudo",
        descricao:
          "Estude auth architecture completa: sessões, tokens, refresh, revogação. O problema não é implementar auth — é implementar sem deixar brechas que só aparecem em produção.",
        cardSlug: "auth-architecture",
        estimateHours: 5,
      },
      {
        id: "sec-02",
        titulo: "OAuth 2.1 e fluxos de autorização",
        tipo: "estudo",
        descricao:
          "Estude OAuth 2.1 com PKCE, token binding e as mudanças do 2.0. Entenda cada fluxo e quando usar. Muita vulnerabilidade vem de usar o fluxo errado.",
        cardSlug: "oauth-2-1",
        estimateHours: 5,
      },
      {
        id: "sec-03",
        titulo: "Session strategy e token encryption",
        tipo: "estudo",
        descricao:
          "Sessões stateful vs stateless, onde guardar tokens, encryption at rest e rotation. Decisões que parecem simples mas têm implicações de segurança profundas.",
        cardSlug: "session-strategy",
        estimateHours: 3,
      },
      {
        id: "sec-04",
        titulo: "RBAC vs ABAC: modelagem de controle de acesso",
        tipo: "estudo",
        descricao:
          "Compare as duas abordagens com exemplos reais. Saiba quando RBAC não é suficiente e ABAC é necessário. Modelagem incorreta de acesso é uma das maiores fontes de vulnerabilidade.",
        cardSlug: "rbac-vs-abac",
        estimateHours: 4,
      },
      {
        id: "sec-05",
        titulo: "Zero Trust Architecture",
        tipo: "estudo",
        descricao:
          "Entenda o modelo Zero Trust: never trust, always verify. Microsegmentação, mTLS, service mesh e como aplicar em sistemas reais sem paralisar o time.",
        cardSlug: "zero-trust-architecture",
        estimateHours: 5,
      },
      {
        id: "sec-06",
        titulo: "Prompt injection: vetor de ataque moderno",
        tipo: "estudo",
        descricao:
          "Estude prompt injection direto e indireto, jailbreak, e como sistemas LLM criam novos vetores de ataque. Security Engineer precisa conhecer ameaças emergentes.",
        cardSlug: "ai-prompt-injection",
        estimateHours: 4,
      },
      {
        id: "sec-07",
        titulo: "Monitoramento moderno de segurança",
        tipo: "estudo",
        descricao:
          "SIEM, anomaly detection, honeypots, audit logs e alertas. Segurança que não é monitorada é segurança que você não sabe que foi comprometida.",
        cardSlug: "modern-monitoring-sec",
        estimateHours: 5,
      },
      {
        id: "sec-08",
        titulo: "Armadilha: IA sem audit log e sem validação",
        tipo: "estudo",
        descricao:
          "Estude como sistemas gerados por IA frequentemente omitem audit logs e validação de entrada. Security Engineer deve ser o último filtro antes do deploy.",
        cardSlug: "ai-sem-audit-log",
        estimateHours: 2,
      },
      {
        id: "sec-09",
        titulo: "Pratica: Sentinela — auditar código para vulnerabilidades",
        tipo: "pratica",
        descricao:
          "Cole código de autenticação ou autorização no Sentinela e analise as vulnerabilidades apontadas. Pratique pensar como atacante ao revisar código.",
        routeHref: "/sentinela",
        estimateHours: 4,
      },
      {
        id: "sec-10",
        titulo: "Modelagem de ameaças com STRIDE",
        tipo: "pratica",
        descricao:
          "Execute threat modeling STRIDE em um sistema real. Use o Architecture Audit para estruturar os riscos. Security que não modela ameaças reage em vez de prevenir.",
        routeHref: "/architecture-audit",
        estimateHours: 5,
      },
      {
        id: "sec-11",
        titulo: "Multi-tenant: isolamento real de dados",
        tipo: "estudo",
        descricao:
          "Estude como garantir isolamento de dados entre tenants em banco e aplicação. Vazamento de dados de um cliente para outro é um incidente que destrói reputação.",
        cardSlug: "ai-multi-tenant",
        estimateHours: 3,
      },
      {
        id: "sec-12",
        titulo: "RFC: Security Review Process",
        tipo: "pratica",
        descricao:
          "Escreva uma RFC propondo um processo de security review para o time: quando é obrigatório, checklist, responsabilidades e como não virar gargalo.",
        routeHref: "/rfc-writing",
        estimateHours: 5,
      },
      {
        id: "sec-13",
        titulo: "War Game: incidente de segurança",
        tipo: "pratica",
        descricao:
          "Simule um incidente de segurança: token vazado em produção, tentativa de SQL injection detectada, ou acesso não autorizado a endpoint de admin. Treine resposta a incidente.",
        routeHref: "/war-game",
        estimateHours: 2,
      },
      {
        id: "sec-14",
        titulo: "Mock Interview: Security Engineer",
        tipo: "entrevista",
        descricao:
          "Simule entrevista de security com foco em design de sistema seguro, modelagem de ameaças e decisões de controle de acesso. Pratique pensar em adversarial scenarios.",
        routeHref: "/mock-interview",
        estimateHours: 2,
      },
      {
        id: "sec-15",
        titulo: "Banco STAR: incidente que você preveniu ou resolveu",
        tipo: "entrevista",
        descricao:
          "Prepare histórias de uma vulnerabilidade que você encontrou antes do deploy, um incidente que você respondeu, e como você convenceu o time a priorizar segurança.",
        routeHref: "/banco-star",
        estimateHours: 2,
      },
    ],
    projetoPortfolio: {
      titulo: "Security review completa de aplicação web com threat model",
      descricao:
        "Faça uma security review completa de uma aplicação web (própria ou open source): threat modeling STRIDE, análise de autenticação/autorização, teste de prompt injection se aplicável, relatório de vulnerabilidades com severidade e remediação.",
      entregaveis: [
        "Threat model documentado com STRIDE cobrindo ao menos 10 ameaças identificadas",
        "Relatório de vulnerabilidades com severidade CVSS e remediação proposta",
        "Checklist de security review pronto para uso no time",
        "Runbook de resposta a incidente para os 3 cenários mais prováveis",
      ],
    },
    preparacaoEntrevista: {
      topicos: [
        "OAuth 2.1: fluxos, PKCE, token binding",
        "Zero Trust: princípios e implementação prática",
        "RBAC vs ABAC: quando usar cada um, exemplos de falha",
        "Prompt injection: vetores de ataque e defesas",
        "Threat modeling: STRIDE, PASTA, as metodologias",
        "Incident response: como estruturar resposta a incidente",
        "Audit logs: o que logar, como proteger, retention",
      ],
      rotasMock: ["/mock-interview", "/architecture-audit", "/war-game", "/sentinela"],
      perguntasComuns: [
        "Como você implementaria revisão de acesso periódica num sistema com RBAC?",
        "Explique PKCE e por que ele é necessário no OAuth 2.1.",
        "Como você detectaria que um token JWT foi comprometido e como você revogaria?",
        "O que é prompt injection indireto? Me dê um exemplo concreto.",
        "Como você garantiria que um endpoint de admin não é acessível por usuário comum, mesmo com bug no código?",
        "Explique Zero Trust em termos práticos para um time de desenvolvimento.",
        "Como você estruturaria audit logs para que sejam úteis numa investigação de incidente?",
        "Um desenvolvedor comitou uma chave de API no GitHub. O que você faz nos próximos 10 minutos?",
        "Como você convenceu um time relutante a adotar práticas de security?",
        "Me fale de uma vulnerabilidade que você encontrou. Como você a classificou e comunicou?",
      ],
    },
  },

  // ─── 9. Cybersecurity Fundamentals ───────────────────────────────────────────
  {
    slug: "cybersecurity-fundamentals",
    titulo: "Cybersecurity — Fundamentos",
    papel: "Security Engineer",
    categoria: "seguranca",
    nivelAlvo: "pleno",
    resumo:
      "Do zero até trabalhar com segurança no dia a dia: fundamentos de rede, criptografia, OWASP Top 10, autenticação segura, secrets management, scanning estático e dinâmico, incident response e threat modeling. Não é red team — é o security engineer que sabe defender sistemas reais.",
    preRequisitos: [
      "Desenvolve e faz deploy de aplicações web — back ou full stack",
      "Entende HTTP, cookies e como tokens JWT funcionam superficialmente",
      "Já implementou algum form de autenticação (login, sessão, OAuth)",
      "Conhece o básico de Docker e variáveis de ambiente",
    ],
    marcos: [
      {
        id: "cs-01",
        titulo: "Fundamentos de rede para devs: TLS, CORS e headers de segurança",
        tipo: "estudo",
        descricao:
          "Entenda TLS (por que HTTP puro não vai a produção), o que CORS realmente protege e quais headers de segurança toda aplicação deve ter. A base antes de qualquer outra coisa.",
        cardSlug: "network-security-basics",
        estimateHours: 4,
      },
      {
        id: "cs-02",
        titulo: "Criptografia prática: hashing, encryption simétrica e assimétrica",
        tipo: "estudo",
        descricao:
          "Aprenda por que MD5 e SHA-1 são inadequados para senhas, quando usar Argon2id vs bcrypt, AES-256-GCM para campos sensíveis no banco, e ECDSA para assinaturas. Com exemplos Node.js reais.",
        cardSlug: "cryptography-basics",
        estimateHours: 5,
      },
      {
        id: "cs-03",
        titulo: "Arquitetura de autenticação: identity, profile, membership",
        tipo: "estudo",
        descricao:
          "Entenda a separação correta entre identidade, perfil e pertencimento a tenants. Session strategy, token lifecycle, revogação. A fundação que a maioria dos sistemas erra.",
        cardSlug: "auth-architecture",
        estimateHours: 5,
      },
      {
        id: "cs-04",
        titulo: "OAuth 2.1 — fluxos, PKCE e armadilhas",
        tipo: "estudo",
        descricao:
          "Estude OAuth 2.1 com PKCE, as diferenças do 2.0, token binding e quando usar cada fluxo. Muita vulnerabilidade vem de usar o fluxo errado para o caso de uso.",
        cardSlug: "oauth-2-1",
        estimateHours: 5,
      },
      {
        id: "cs-05",
        titulo: "RBAC vs ABAC — modelagem correta de controle de acesso",
        tipo: "estudo",
        descricao:
          "Modelagem incorreta de acesso é uma das maiores fontes de IDOR e privilege escalation. Entenda quando Role-Based não é suficiente e Attribute-Based é necessário.",
        cardSlug: "rbac-vs-abac",
        estimateHours: 3,
      },
      {
        id: "cs-06",
        titulo: "OWASP Top 10 2021 — vulnerabilidades críticas com código real",
        tipo: "estudo",
        descricao:
          "Estude cada categoria do OWASP Top 10 com exemplos de código vulnerável vs seguro em Node.js/TypeScript. Injection, Broken Auth, XSS, IDOR, Security Misconfiguration e mais.",
        cardSlug: "owasp-top10",
        estimateHours: 6,
      },
      {
        id: "cs-07",
        titulo: "Pratica: auditar código com Sentinela buscando OWASP issues",
        tipo: "pratica",
        descricao:
          "Cole código de autenticação ou endpoints da sua aplicação no Sentinela. Busque especificamente por IDOR, SQL injection e misconfiguration. Pratique pensar como atacante.",
        routeHref: "/sentinela",
        estimateHours: 3,
      },
      {
        id: "cs-08",
        titulo: "Secrets management — nunca no código, sempre no vault",
        tipo: "estudo",
        descricao:
          "Aprenda a estrutura correta de .env.local vs produção, AWS Secrets Manager, rotação automática e como configurar detecção de leak com Gitleaks no CI.",
        cardSlug: "secrets-management",
        estimateHours: 4,
      },
      {
        id: "cs-09",
        titulo: "Session strategy e token encryption at rest",
        tipo: "estudo",
        descricao:
          "Sessões stateful vs stateless, onde guardar tokens, encryption at rest de campos sensíveis e rotação de chaves. Decisões que parecem simples mas têm implicações profundas.",
        cardSlug: "session-strategy",
        estimateHours: 3,
      },
      {
        id: "cs-10",
        titulo: "Zero Trust Architecture — never trust, always verify",
        tipo: "estudo",
        descricao:
          "Entenda o modelo Zero Trust: microsegmentação, mTLS entre serviços, service mesh e como aplicar em sistemas reais sem paralisar o time de desenvolvimento.",
        cardSlug: "zero-trust-architecture",
        estimateHours: 4,
      },
      {
        id: "cs-11",
        titulo: "SAST e DAST no pipeline — Semgrep, ZAP e Trivy",
        tipo: "pratica",
        descricao:
          "Integre Semgrep para análise estática de código, OWASP ZAP para testes dinâmicos em staging e Trivy para container scanning. Configure regras custom e priorize findings sem travar o deploy.",
        cardSlug: "sast-dast-scanning",
        estimateHours: 5,
      },
      {
        id: "cs-12",
        titulo: "Prompt injection — vetor de ataque emergente em sistemas com IA",
        tipo: "estudo",
        descricao:
          "Estude prompt injection direto e indireto, jailbreak e como sistemas LLM criam novos vetores de ataque. Cada vez mais relevante em backends que integram OpenAI ou Anthropic.",
        cardSlug: "ai-prompt-injection",
        estimateHours: 3,
      },
      {
        id: "cs-13",
        titulo: "Threat modeling com STRIDE — prevenir em vez de reagir",
        tipo: "pratica",
        descricao:
          "Execute threat modeling STRIDE em um sistema que você mantém. Identifique ameaças antes de construir, não depois de brechar. Use o Sentinela para estruturar os riscos.",
        routeHref: "/sentinela",
        estimateHours: 4,
      },
      {
        id: "cs-14",
        titulo: "Incident response — runbook de token vazado e breach containment",
        tipo: "pratica",
        descricao:
          "Estude o playbook de resposta a incidente: o que fazer nos primeiros 15 minutos após descobrir um token vazado, como preservar evidências, conter o breach e fazer post-mortem.",
        cardSlug: "incident-response-playbook",
        estimateHours: 4,
      },
      {
        id: "cs-15",
        titulo: "War Game: incidente de segurança sob pressão",
        tipo: "pratica",
        descricao:
          "Simule um incidente real: token de produção vazado no GitHub, acesso suspeito detectado em endpoint de admin, ou tentativa de SQL injection em produção. Treine decisão e comunicação.",
        routeHref: "/war-game",
        estimateHours: 2,
      },
      {
        id: "cs-16",
        titulo: "Mock Interview: Security Engineer pleno",
        tipo: "entrevista",
        descricao:
          "Simule entrevista de segurança focada em design de sistema seguro, trade-offs de autenticação, como você abordaria um code review de segurança e como você comunicaria vulnerabilidades.",
        routeHref: "/mock-interview",
        estimateHours: 2,
      },
    ],
    projetoPortfolio: {
      titulo: "Security review completa de uma aplicação com threat model e pipeline seguro",
      descricao:
        "Escolha uma aplicação própria ou open source. Execute: (1) threat modeling STRIDE documentado, (2) análise OWASP Top 10 com código vulnerável identificado e corrigido, (3) pipeline CI com Semgrep + Trivy configurados, (4) secrets management com rotação, (5) runbook de incident response para os 3 cenários mais prováveis da aplicação.",
      entregaveis: [
        "Threat model STRIDE cobrindo ao menos 8 ameaças identificadas com mitigações",
        "PR com correções de vulnerabilidades OWASP encontradas e explicadas",
        "Pipeline CI com Semgrep, Trivy e npm audit configurados e passando",
        "Runbook de incident response documentado e testado em simulação",
      ],
    },
    preparacaoEntrevista: {
      topicos: [
        "OWASP Top 10: exemplos concretos de cada categoria e como mitigar",
        "Autenticação: diferença entre stateful e stateless, quando usar cada um",
        "RBAC vs ABAC: quando um sistema precisa de atributos além de roles",
        "Criptografia: por que não MD5 pra senha, quando usar simétrico vs assimétrico",
        "Secrets: por que env var não é suficiente em produção, como fazer rotação",
        "TLS: o que mTLS adiciona ao TLS normal, quando usar entre serviços",
        "SAST vs DAST: o que cada um encontra, como integrar sem travar deploy",
        "Incident response: o que fazer nos primeiros 15 minutos após um breach",
      ],
      rotasMock: ["/mock-interview", "/sentinela", "/war-game", "/banco-star"],
      perguntasComuns: [
        "Um usuário reporta que consegue acessar notas fiscais de outros clientes apenas mudando o ID na URL. O que está errado e como você corrige?",
        "Por que você não pode usar SHA-256 diretamente para fazer hash de senhas? O que você usaria?",
        "Explique o que é PKCE no OAuth 2.1 e por que ele substituiu o client secret em apps públicas.",
        "Um desenvolvedor commitou uma API key do Stripe no GitHub por acidente. O que você faz nos próximos 15 minutos?",
        "Como você configuraria CORS em uma API que autentica usuários via cookie httpOnly?",
        "O que é um timing attack? Como você evita em comparação de tokens de segurança?",
        "Como você decidiria o que logar num evento de autenticação sem logar dados sensíveis?",
        "Descreva a diferença entre SAST e DAST. Em que momento do ciclo de dev cada um roda?",
        "Um colega quer guardar credenciais de banco em variáveis de ambiente do Docker. Qual é o problema e o que você proporia?",
        "Me fale de uma vulnerabilidade que você encontrou (ou poderia ter encontrado) em código que você revisou.",
      ],
    },
  },

  // ─── 10. Quant / AI Researcher ─────────────────────────────────────────────
  {
    slug: "quant-ai-researcher",
    titulo: "Quant / AI Researcher",
    papel: "Quantitative Researcher",
    categoria: "pesquisa",
    nivelAlvo: "staff",
    resumo:
      "Base matemática sólida (cálculo, álgebra linear, probabilidade, análise real, otimização), modelos estocásticos, leitura e implementação de papers, eval rigoroso e metodologia científica. Foco em pesquisa que resiste a peer review.",
    preRequisitos: [
      "Cálculo de uma variável sem dificuldade: derivadas, integrais, séries de Taylor",
      "Álgebra linear básica: matrizes, determinante, sistemas lineares",
      "Probabilidade básica: eventos, Bayes, distribuições discretas",
      "Python para implementar algoritmos matemáticos",
    ],
    marcos: [
      {
        id: "qt-01",
        titulo: "Álgebra linear: o coração do ML",
        tipo: "estudo",
        descricao:
          "Estude decomposição espectral, SVD, PCA, espaços vetoriais e transformações lineares. Não como listas de operações — como objetos geométricos que têm intuição.",
        cardSlug: "algebra-linear",
        estimateHours: 15,
      },
      {
        id: "qt-02",
        titulo: "Probabilidade: fundamentos rigorosos",
        tipo: "estudo",
        descricao:
          "Espaços de probabilidade, variáveis aleatórias, distribuições contínuas, esperança condicional, cadeias de Markov. A base de todo modelo estocástico.",
        cardSlug: "probabilidade",
        estimateHours: 12,
      },
      {
        id: "qt-03",
        titulo: "Estatística inferencial: rigor científico",
        tipo: "estudo",
        descricao:
          "Estimação por máxima verossimilhança, testes de hipótese, intervalos de confiança, Bayesian inference. Pesquisador que não entende estatística não consegue ler papers com espírito crítico.",
        cardSlug: "estatistica-inferencia",
        estimateHours: 12,
      },
      {
        id: "qt-04",
        titulo: "Cálculo multivariável: gradientes e otimização",
        tipo: "estudo",
        descricao:
          "Derivadas parciais, gradiente, Hessiana, multiplicadores de Lagrange. É a matemática do backpropagation, da otimização de portfólios e da teoria de controle.",
        cardSlug: "calculo-multivariavel",
        estimateHours: 12,
      },
      {
        id: "qt-05",
        titulo: "Otimização: gradient descent até métodos convexos",
        tipo: "estudo",
        descricao:
          "Stochastic gradient descent, Adam, otimização convexa, dualidade, programação linear e quadrática. Pesquisador de IA e quant precisam entender o que está sendo otimizado.",
        cardSlug: "otimizacao-pesquisa-op",
        estimateHours: 12,
      },
      {
        id: "qt-06",
        titulo: "Análise real: continuidade, limites, convergência",
        tipo: "estudo",
        descricao:
          "Sequências, séries, continuidade, teorema do valor intermediário, análise de convergência. Necessário para entender provas de convergência de algoritmos de otimização.",
        cardSlug: "analise-real",
        estimateHours: 10,
      },
      {
        id: "qt-07",
        titulo: "Equações diferenciais: sistemas dinâmicos",
        tipo: "estudo",
        descricao:
          "EDOs e EDPs com aplicações em modelos de difusão, finanças (equação de Black-Scholes) e aprendizado por reforço. A matemática por trás de como sistemas evoluem no tempo.",
        cardSlug: "equacoes-diferenciais-ordinarias",
        estimateHours: 10,
      },
      {
        id: "qt-08",
        titulo: "Math Quest: rank A em probabilidade e álgebra linear",
        tipo: "pratica",
        descricao:
          "Use o Math Quest para resolver problemas adaptativos em probabilidade e álgebra linear até atingir rank A. Sem prática em exercícios, teoria fica abstrata.",
        routeHref: "/matematica",
        estimateHours: 15,
      },
      {
        id: "qt-09",
        titulo: "Leitura de paper: Attention is All You Need",
        tipo: "estudo",
        descricao:
          "Leia o paper do Transformer com rigor matemático. Implemente o mecanismo de atenção do zero em Python. Researcher que não consegue implementar paper não pode validar claims.",
        externalUrl: "https://arxiv.org/abs/1706.03762",
        estimateHours: 10,
      },
      {
        id: "qt-10",
        titulo: "LaTeX: escrever matemática de forma publicável",
        tipo: "pratica",
        descricao:
          "Aprenda a escrever equações, teoremas, provas e figuras em LaTeX. Todo paper e RFC técnica de nível researcher deve ser escrita em LaTeX ou equivalente.",
        cardSlug: "latex-mat-papers",
        estimateHours: 5,
      },
      {
        id: "qt-11",
        titulo: "Metodologia científica: hipótese, experimento, rejeição",
        tipo: "estudo",
        descricao:
          "Como formular hipóteses falsificáveis, desenhar experimentos controlados e reportar resultados com honestidade intelectual. A diferença entre pesquisa e p-hacking.",
        cardSlug: "metodologia-cientifica",
        estimateHours: 5,
      },
      {
        id: "qt-12",
        titulo: "RFC: proposta de pesquisa com base matemática",
        tipo: "pratica",
        descricao:
          "Escreva uma proposta de pesquisa em LaTeX: motivação, hipótese, método de avaliação, baselines, limitações e próximos passos. Estrutura de paper ICLR/NeurIPS simplificada.",
        routeHref: "/rfc-writing",
        estimateHours: 8,
      },
      {
        id: "qt-13",
        titulo: "Modelagem matemática: problema real, solução formal",
        tipo: "pratica",
        descricao:
          "Escolha um problema de negócio ou de pesquisa e modele matematicamente. Use o War Game para simular a defesa do modelo sob questionamento de pares.",
        cardSlug: "modelagem-matematica",
        routeHref: "/war-game",
        estimateHours: 8,
      },
      {
        id: "qt-14",
        titulo: "Técnicas de demonstração: indução, contradição, construção",
        tipo: "estudo",
        descricao:
          "Estude as técnicas de prova formais. Researcher que não consegue escrever uma prova não consegue validar claims teóricos — nem os próprios nem os de outros.",
        cardSlug: "tecnicas-demonstracao",
        estimateHours: 6,
      },
      {
        id: "qt-15",
        titulo: "Mock Interview: Quant / AI Researcher",
        tipo: "entrevista",
        descricao:
          "Simule entrevista de pesquisa com derivação matemática ao vivo, implementação de algoritmo e discussão de paper. Pratique explicar intuição antes da fórmula.",
        routeHref: "/mock-interview",
        estimateHours: 2,
      },
      {
        id: "qt-16",
        titulo: "Banco STAR: pesquisa ou análise com impacto",
        tipo: "entrevista",
        descricao:
          "Prepare histórias de uma análise ou pesquisa que você fez que teve impacto real, um paper que você implementou e os resultados foram diferentes do reportado, e como você comunica incerteza.",
        routeHref: "/banco-star",
        estimateHours: 2,
      },
    ],
    projetoPortfolio: {
      titulo: "Implementação de paper com experimentos reproduzíveis e análise crítica",
      descricao:
        "Escolha um paper de ML, IA ou finanças quantitativas. Implemente do zero (sem copiar código do repositório oficial), execute experimentos de ablation, compare com baselines e escreva um relatório em LaTeX analisando criticamente os claims do paper.",
      entregaveis: [
        "Implementação do algoritmo do zero em Python com código bem documentado",
        "Experimentos reproduzíveis com MLflow ou equivalente",
        "Relatório LaTeX de 4-6 páginas com análise crítica dos resultados",
        "Apresentação de 15 minutos demonstrando a implementação e achados",
      ],
    },
    preparacaoEntrevista: {
      topicos: [
        "Álgebra linear: SVD, PCA, decomposição espectral com intuição",
        "Probabilidade: distribuições, Bayes, cadeias de Markov",
        "Otimização: convexidade, dualidade, convergência de SGD",
        "Transformers: mecanismo de atenção derivado matematicamente",
        "Metodologia: como detectar p-hacking em papers",
        "Implementação: derivar e implementar um algoritmo ao vivo",
        "Comunicação: explicar intuição matemática para audiência diversa",
      ],
      rotasMock: ["/mock-interview", "/interrogatorio", "/war-game", "/rfc-writing"],
      perguntasComuns: [
        "Derive o mecanismo de atenção do Transformer a partir do produto escalar. Por que dividir por sqrt(d_k)?",
        "Explique PCA com intuição geométrica. Como você escolheria quantos componentes usar?",
        "Como você detectaria se um paper está fazendo p-hacking nos resultados?",
        "Implemente gradient descent para regressão linear do zero. O que acontece se o learning rate for muito alto?",
        "Qual a diferença entre máxima verossimilhança e inferência Bayesiana? Quando cada uma é mais adequada?",
        "Explique a convergência do SGD para um stakeholder técnico sem background em otimização.",
        "Você implementou um paper e os resultados são 20% piores que o reportado. O que você investiga?",
        "Como você escolheria entre um modelo paramétrico e não-paramétrico para um problema de densidade estimada?",
        "Me fale de uma análise ou pesquisa que você fez. O que o dado te surpreendeu?",
        "Como você garantiria que seus experimentos são reproduzíveis por outro pesquisador?",
      ],
    },
  },

  // ─── 5. GovTech Engineer ──────────────────────────────────────────────────
  {
    slug: "govtech-engineer",
    titulo: "GovTech Engineer",
    papel: "GovTech Engineer",
    categoria: "engenharia",
    nivelAlvo: "senior",
    resumo:
      "Especialização em sistemas B2G (Business-to-Government) para prefeituras brasileiras. Cobre os requisitos que não existem no mercado privado: Event Sourcing para auditoria imutável exigida por TCEs, Keycloak com federação Gov.br, LGPD em órgãos públicos, PostGIS para dados geoespaciais municipais, Kafka para absorver picos de acesso previsíveis, isolamento single-tenant por exigência de edital, e acessibilidade WCAG obrigatória por lei. Stack: NestJS + Next.js + PostgreSQL + Keycloak.",
    preRequisitos: [
      "NestJS: Guards, Interceptors, Modules, providers — sabe construir API sem tutorial",
      "PostgreSQL: transactions, índices, EXPLAIN — já diagnosticou N+1 em produção",
      "Next.js App Router: Server Components, SSR, route handlers",
      "Autenticação: JWT, OAuth 2.0 e OIDC na teoria e na prática",
      "Docker Compose: sobe ambiente local completo com banco e cache",
    ],
    marcos: [
      {
        id: "gov-01",
        titulo: "Keycloak IAM: realm, RBAC hierárquico e SSO",
        tipo: "estudo",
        descricao:
          "Configure Keycloak do zero para uma prefeitura: realm por tenant, roles hierárquicas (prefeito → secretário → servidor), grupos por secretaria e exportação de realm para versionamento em Git. Entenda o ciclo de vida de sessão e token.",
        cardSlug: "keycloak-sso",
        estimateHours: 8,
      },
      {
        id: "gov-02",
        titulo: "Integração Gov.br via OpenID Connect",
        tipo: "estudo",
        descricao:
          "Estude como federar o Keycloak com o IdP nacional Gov.br: configuração de Identity Provider OIDC, mapeamento de claims (confiabilidades, CPF), ambiente de homologação e requisitos de cadastro no BNDES/MP. Prazo de aprovação leva semanas — comece cedo.",
        cardSlug: "oauth-2-1",
        estimateHours: 5,
      },
      {
        id: "gov-03",
        titulo: "RBAC granular com NestJS Guards",
        tipo: "pratica",
        descricao:
          "Implemente Guards e Decorators para RBAC granular: roles no JWT Keycloak, guard que valida hierarquia (secretário só acessa sua secretaria), testes de integração com usuário mockado. Use o Sentinela para revisar o código.",
        cardSlug: "rbac-vs-abac",
        routeHref: "/sentinela",
        estimateHours: 6,
      },
      {
        id: "gov-04",
        titulo: "LGPD em sistemas públicos: criptografia e DPO",
        tipo: "estudo",
        descricao:
          "Estude as obrigações LGPD específicas de órgãos públicos: base legal 'cumprimento de obrigação legal', criptografia de dados sensíveis (CPF, dados de saúde), pseudonimização para relatórios, prazos de retenção por legislação específica (CTN, CLT) e papel do DPO.",
        cardSlug: "lgpd-compliance",
        estimateHours: 6,
      },
      {
        id: "gov-05",
        titulo: "Criptografia at-rest e in-transit na prática",
        tipo: "pratica",
        descricao:
          "Implemente criptografia AES-256-GCM em colunas sensíveis do PostgreSQL com pgcrypto, serviço de criptografia NestJS com chave derivada via PBKDF2, hash para lookup sem decriptar e política de rotação de chaves. Sem frameworks prontos — implemente do zero.",
        cardSlug: "token-encryption-at-rest",
        estimateHours: 6,
      },
      {
        id: "gov-06",
        titulo: "Event Sourcing para auditoria imutável (TCE)",
        tipo: "estudo",
        descricao:
          "Entenda por que TCEs exigem trilha de auditoria imutável e como Event Sourcing resolve isso: modelagem de eventos financeiros (EmpenhoRegistrado, EmpenhoAnulado, PagamentoAutorizado), Aggregate base class, Event Store em PostgreSQL e replay de estado para qualquer data.",
        cardSlug: "event-sourcing-govtech",
        estimateHours: 10,
      },
      {
        id: "gov-07",
        titulo: "NestJS Audit Interceptor automático",
        tipo: "pratica",
        descricao:
          "Construa o interceptor de auditoria completo: decorator @Audited(), captura de quem/o quê/quando/IP sem bloquear o request, persistência assíncrona via BullMQ e tabela de audit_logs com particionamento mensal por 5 anos. Use o War Game para simular auditoria do TCE.",
        cardSlug: "nestjs-audit-interceptor",
        routeHref: "/war-game",
        estimateHours: 8,
      },
      {
        id: "gov-08",
        titulo: "PostGIS: dados geoespaciais municipais",
        tipo: "estudo",
        descricao:
          "Estude PostGIS para casos de uso de prefeitura: cálculo de área real de lote para IPTU (ST_Area geodésico), lotes em zona de preservação (ST_Within), buffer de APP em rios (ST_Buffer), SRID SIRGAS 2000 e índice GIST. A diferença entre área planar e geodésica quebra cálculos tributários.",
        cardSlug: "postgis-spatial",
        estimateHours: 7,
      },
      {
        id: "gov-09",
        titulo: "Kafka para resiliência em picos previsíveis",
        tipo: "estudo",
        descricao:
          "Entenda por que Kafka (não RabbitMQ) para sistemas públicos: retenção nativa como camada extra de auditoria, topologia de tópicos para ERP municipal, consumer groups por serviço (contabilidade, fiscal, transparência) e Dead Letter Topics para mensagens que falharam.",
        cardSlug: "kafka-govtech",
        estimateHours: 8,
      },
      {
        id: "gov-10",
        titulo: "Kafka na prática: producer idempotente e consumer com DLT",
        tipo: "pratica",
        descricao:
          "Implemente producer com idempotência (zero duplicatas em finanças), consumer com retry exponencial e Dead Letter Topic, e verificação de correlationId para idempotência no processamento. Configure alerta no DLT.",
        cardSlug: "outbox-pattern",
        estimateHours: 6,
      },
      {
        id: "gov-11",
        titulo: "Single-tenant isolation para prefeituras",
        tipo: "estudo",
        descricao:
          "Entenda por que editais de licitação frequentemente proíbem banco compartilhado entre municípios: isolamento por namespace Kubernetes com ArgoCD ApplicationSet, banco separado por prefeitura, Terraform por tenant. A decisão é legal antes de ser arquitetural.",
        cardSlug: "single-tenant-govtech",
        estimateHours: 6,
      },
      {
        id: "gov-12",
        titulo: "WCAG 2.1 AA/AAA e eMAG — acessibilidade obrigatória",
        tipo: "estudo",
        descricao:
          "Estude os critérios WCAG obrigatórios por lei (LBI 13.146/2015 + eMAG): contraste mínimo 4.5:1, navegação por teclado, ARIA roles corretos, skip links, alternativas textuais. Portais públicos sem acessibilidade estão sujeitos a ação do Ministério Público.",
        cardSlug: "wcag-govtech",
        estimateHours: 5,
      },
      {
        id: "gov-13",
        titulo: "Portal da Transparência: SSR, indexação e dados abertos",
        tipo: "pratica",
        descricao:
          "Implemente o portal de transparência com requisitos da LAI: SSR obrigatório (dados devem aparecer em buscas), sitemap.xml automático, exportação em CSV/JSON/ODS, cache para picos de acesso. Use o System Design para documentar a arquitetura.",
        cardSlug: "event-driven",
        routeHref: "/system-design",
        estimateHours: 8,
      },
      {
        id: "gov-14",
        titulo: "War Game: incidente em dia de vencimento de IPTU",
        tipo: "pratica",
        descricao:
          "Simule o incidente mais comum em prefeituras: API travada no dia de vencimento de IPTU, fila de Kafka acumulando, portal de pagamento fora. Tome decisões sob pressão com deadline legal. Documente o post-mortem.",
        routeHref: "/war-game",
        estimateHours: 3,
      },
      {
        id: "gov-15",
        titulo: "System Design: ERP municipal completo",
        tipo: "pratica",
        descricao:
          "Projete a arquitetura completa de um ERP municipal: módulos (financeiro, tributação, folha, protocolo), Event Sourcing onde necessário, Kafka entre módulos, Keycloak centralizado, single-tenant K8s, PostGIS, portal de transparência SSR. Documente trade-offs de cada decisão.",
        routeHref: "/system-design",
        estimateHours: 5,
      },
      {
        id: "gov-16",
        titulo: "Mock Interview: GovTech Engineer sênior",
        tipo: "entrevista",
        descricao:
          "Simule entrevista técnica focada em requisitos B2G: Por que Event Sourcing e não audit log simples? Como você isolaria dados de dois municípios? O que acontece se o Keycloak cair? Pratique defender decisões com argumentos legais e técnicos.",
        routeHref: "/mock-interview",
        estimateHours: 2,
      },
    ],
    projetoPortfolio: {
      titulo: "ERP Municipal Mínimo com Auditoria Imutável e Acessibilidade",
      descricao:
        "Construa um módulo financeiro municipal com: autenticação Keycloak (realm exportado, RBAC por secretaria), Event Sourcing para empenhos (EmpenhoRegistrado → EmpenhoAnulado → PagamentoAutorizado), Audit Interceptor automático com BullMQ, uma query PostGIS para cálculo de área de lote, e um Portal de Transparência Next.js SSR com score WCAG AA no Lighthouse.",
      entregaveis: [
        "Realm Keycloak exportado e versionado no repositório com CI de import",
        "Event Store PostgreSQL com eventos imutáveis e replay demonstrado em teste",
        "Audit log de todas as mutações financeiras com particionamento mensal",
        "Query PostGIS documentada calculando área real de pelo menos 3 lotes de teste",
        "Portal de transparência Next.js SSR com score Lighthouse Accessibility ≥ 90",
        "Runbook de incidente simulando auditoria do TCE com replay de estado",
      ],
    },
    preparacaoEntrevista: {
      topicos: [
        "Event Sourcing vs CRUD com audit log: quando cada um é suficiente para TCE",
        "Keycloak: ciclo de vida de token, sessão e revogação imediata de acesso",
        "LGPD em órgãos públicos: base legal, criptografia obrigatória, prazos de retenção",
        "PostGIS: diferença entre ST_Area planar e geodésico, SRID SIRGAS 2000",
        "Kafka vs RabbitMQ: por que retenção nativa importa para auditoria",
        "Single-tenant vs multi-tenant: quando o edital de licitação decide a arquitetura",
        "WCAG: critérios AA obrigatórios por lei, eMAG e consequências legais",
        "Resiliência em picos: vencimento de IPTU, folha de pagamento, fim de exercício",
      ],
      rotasMock: ["/mock-interview", "/system-design", "/war-game", "/banco-star", "/rfc-writing"],
      perguntasComuns: [
        "O TCE pediu uma auditoria: 'mostre todos os pagamentos autorizados entre 01/03 e 15/03 e quem autorizou cada um'. Como seu sistema atende isso?",
        "Um servidor foi exonerado hoje. Como você garante que o acesso dele a todos os sistemas da prefeitura é revogado imediatamente?",
        "O edital exige que 'dados do município X não sejam acessíveis ao município Y'. Como você arquitetaria isso? Quais as implicações operacionais?",
        "Um empenho foi registrado com valor errado. O contador quer 'desfazer'. Como você modela isso sem violar a imutabilidade exigida pelo TCE?",
        "É dia 30 de dezembro (deadline de execução orçamentária). O sistema de empenhos está com latência 20x acima do normal. O que você faz?",
        "A CGU solicitou logs de todos os acessos ao módulo de folha de pagamento dos últimos 3 anos. Sua arquitetura suporta isso? Em quanto tempo você entrega?",
        "O licitante exige WCAG 2.1 AA no portal do cidadão. Como você verifica conformidade? O que você testa automaticamente vs manualmente?",
        "Por que você escolheria Kafka em vez de RabbitMQ para integração entre módulos de um ERP municipal?",
        "Como você calcularia o IPTU de um lote com geometria irregular usando PostGIS? Por que não usar a área declarada pelo contribuinte?",
        "Explique como o Gov.br funciona como IdP externo no Keycloak. O que acontece se o Gov.br ficar fora do ar?",
      ],
    },
  },

  // ─── 12. Spring Boot + Kotlin (Backend Enterprise) ────────────────────────
  {
    slug: "spring-boot-kotlin",
    titulo: "Backend Spring Boot + Kotlin — Sênior",
    papel: "Backend Engineer (Spring + Kotlin)",
    categoria: "engenharia",
    nivelAlvo: "senior",
    resumo:
      "Trilha completa Kotlin + Spring Boot 3.x para vagas sênior em Big Tech e governo: linguagem, persistência JPA, arquitetura hexagonal/DDD, Kafka/RabbitMQ, Resilience4j, OAuth2, Spring AI e capstone com 2 microsserviços empresariais.",
    preRequisitos: [
      "Java básico ou outra linguagem orientada a objeto",
      "HTTP, REST e JSON",
      "SQL e modelagem relacional básica",
      "Conceitos de containers e Docker básico",
      "Git e fluxo de PR",
    ],
    marcos: [
      {
        id: "sbk-01",
        titulo: "Kotlin: primeiros passos e toolchain",
        tipo: "estudo",
        descricao:
          "JDK 21+, Gradle Kotlin DSL, IntelliJ, build/test/run. O vocabulário técnico que separa quem usa de quem entende.",
        cardSlug: "kotlin-primeiros-passos",
        estimateHours: 4,
      },
      {
        id: "sbk-02",
        titulo: "Linguagem Kotlin essencial",
        tipo: "estudo",
        descricao:
          "val/var, null-safety, data classes, sealed classes, when exaustivo, scope functions, extensions e o type system que elimina classes inteiras de bug.",
        cardSlug: "kotlin-linguagem-essencial",
        estimateHours: 6,
      },
      {
        id: "sbk-03",
        titulo: "Gradle multi-module e layout enterprise",
        tipo: "estudo",
        descricao:
          "Version catalog, convention plugins em buildSrc, multi-module por camada arquitetural. Compilador como linter de arquitetura.",
        cardSlug: "kotlin-gradle-multi-module",
        estimateHours: 4,
      },
      {
        id: "sbk-04",
        titulo: "Errors, Result e Either (Arrow)",
        tipo: "estudo",
        descricao:
          "Quando lançar exception, quando retornar Result<T>, quando usar Either da Arrow. Modelagem de erros de domínio com sealed class.",
        cardSlug: "kotlin-errors-result-arrow",
        estimateHours: 3,
      },
      {
        id: "sbk-05",
        titulo: "Spring Boot Essentials",
        tipo: "estudo",
        descricao:
          "Auto-configuration, ApplicationContext, beans, profiles, lifecycle, graceful shutdown e Actuator em produção.",
        cardSlug: "spring-boot-essentials",
        estimateHours: 5,
      },
      {
        id: "sbk-06",
        titulo: "Spring Web MVC e ProblemDetail",
        tipo: "estudo",
        descricao:
          "Controllers tipados, ResponseEntity, @RestControllerAdvice global, ProblemDetail RFC 7807, status codes corretos e versionamento.",
        cardSlug: "spring-web-controllers",
        estimateHours: 5,
      },
      {
        id: "sbk-07",
        titulo: "Validation Jakarta Bean (com @field:)",
        tipo: "estudo",
        descricao:
          "Bean Validation 3.0 em Kotlin sem armadilha: @field:, validadores customizados, grupos e cross-field validation.",
        cardSlug: "spring-validation-bean",
        estimateHours: 3,
      },
      {
        id: "sbk-08",
        titulo: "Kotlin Coroutines e Spring Async",
        tipo: "estudo",
        descricao:
          "Structured concurrency, suspend, withContext, Flow, supervisorScope. Integração com Spring MVC + Virtual Threads.",
        cardSlug: "kotlin-coroutines",
        estimateHours: 5,
      },
      {
        id: "sbk-09",
        titulo: "Logging estruturado com MDC",
        tipo: "estudo",
        descricao:
          "Logback JSON em prod, MDC com correlation ID via filter, level por package e o que NUNCA deve aparecer em log.",
        cardSlug: "spring-logging-mdc",
        estimateHours: 3,
      },
      {
        id: "sbk-10",
        titulo: "Testes: JUnit 5, Kotest, MockK",
        tipo: "estudo",
        descricao:
          "Stack profissional de testes Kotlin: JUnit + Kotest StringSpec, MockK com coEvery, Spring slices @WebMvcTest/@DataJpaTest.",
        cardSlug: "kotlin-testing-junit-kotest-mockk",
        estimateHours: 5,
      },
      {
        id: "sbk-11",
        titulo: "Checkpoint Tier 1",
        tipo: "pratica",
        descricao:
          "Antes de avançar: valide fundamentos Kotlin + Spring Web. Faça o exame Tier 1 (aprovação ≥ 70) com avaliação por IA.",
        cardSlug: "spring-checkpoint-tier-1",
        routeHref: "/skills/spring-boot-kotlin/exam/1",
        estimateHours: 4,
      },
      {
        id: "sbk-12",
        titulo: "Spring Data JPA: N+1, EntityGraph, Projections",
        tipo: "estudo",
        descricao:
          "JPA do jeito sênior: entidade vs domínio, EntityGraph contra N+1, projections para read, locks otimista vs pessimista.",
        cardSlug: "spring-data-jpa",
        estimateHours: 6,
      },
      {
        id: "sbk-13",
        titulo: "Flyway: migrations zero-downtime",
        tipo: "estudo",
        descricao:
          "Versionamento de schema, baseline em legado, repeatable migrations e os 5 passos pra renomear coluna sem dor.",
        cardSlug: "spring-flyway-migrations",
        estimateHours: 3,
      },
      {
        id: "sbk-14",
        titulo: "@Transactional: isolation, propagation, pitfalls",
        tipo: "estudo",
        descricao:
          "Self-invocation, REQUIRES_NEW para auditoria, isolation levels e os 5 bugs clássicos que pegam até pleno.",
        cardSlug: "spring-transactions-isolation",
        estimateHours: 4,
      },
      {
        id: "sbk-15",
        titulo: "Testcontainers: Postgres, Kafka, Redis reais",
        tipo: "estudo",
        descricao:
          "@ServiceConnection, shared containers, withReuse local, Awaitility e setup no bootRun para dev.",
        cardSlug: "spring-testcontainers",
        estimateHours: 4,
      },
      {
        id: "sbk-16",
        titulo: "SDD com OpenAPI / springdoc",
        tipo: "estudo",
        descricao:
          "Code-first vs contract-first, OpenAPI Generator + interfaces Kotlin, contract tests e design REST sênior.",
        cardSlug: "spring-openapi-springdoc",
        estimateHours: 4,
      },
      {
        id: "sbk-17",
        titulo: "Arquitetura Hexagonal em Kotlin",
        tipo: "estudo",
        descricao:
          "Domínio puro sem Spring, ports/adapters, módulos Gradle por camada — compilador como linter de arquitetura.",
        cardSlug: "spring-hexagonal-kotlin",
        estimateHours: 6,
      },
      {
        id: "sbk-18",
        titulo: "DDD pragmático com sealed classes",
        tipo: "estudo",
        descricao:
          "Aggregates com invariantes, value classes, máquina de estados via sealed, domain events e bounded contexts.",
        cardSlug: "spring-ddd-aggregates-kotlin",
        estimateHours: 6,
      },
      {
        id: "sbk-19",
        titulo: "Mensageria: Kafka & RabbitMQ",
        tipo: "estudo",
        descricao:
          "Producer idempotente, consumer com manual ack, DLT/DLQ, exponential backoff, schema registry e idempotência.",
        cardSlug: "spring-kafka-rabbitmq",
        estimateHours: 6,
      },
      {
        id: "sbk-20",
        titulo: "Redis: cache, locks distribuídos, idempotency",
        tipo: "estudo",
        descricao:
          "Cache-aside com TTL, idempotency keys via SETNX, Redisson com lease apropriado e rate limit.",
        cardSlug: "spring-redis-cache-idempotencia",
        estimateHours: 4,
      },
      {
        id: "sbk-21",
        titulo: "gRPC com Kotlin e Protobuf",
        tipo: "estudo",
        descricao:
          "grpc-kotlin + suspend/Flow, interceptors, deadlines, status codes específicos e quando preferir REST.",
        cardSlug: "spring-grpc-kotlin",
        estimateHours: 5,
      },
      {
        id: "sbk-22",
        titulo: "Resilience4j: CB, retry, bulkhead",
        tipo: "estudo",
        descricao:
          "Timeout em camadas, retry com jitter (NUNCA em operação não-idempotente), circuit breaker e fallback útil.",
        cardSlug: "spring-resilience4j",
        estimateHours: 4,
      },
      {
        id: "sbk-23",
        titulo: "Checkpoint Tier 3",
        tipo: "pratica",
        descricao:
          "Antes do Tier 4: valide JPA, hexagonal/DDD, mensageria, gRPC e resiliência. Exame Tier 3 (aprovação ≥ 70).",
        cardSlug: "spring-checkpoint-tier-3",
        routeHref: "/skills/spring-boot-kotlin/exam/3",
        estimateHours: 5,
      },
      {
        id: "sbk-24",
        titulo: "Microsserviços empresariais",
        tipo: "estudo",
        descricao:
          "Monolito modular primeiro, bounded context, dados por serviço, Saga vs 2PC, K8s service discovery e Spring Cloud com parcimônia.",
        cardSlug: "spring-microservices-enterprise",
        estimateHours: 5,
      },
      {
        id: "sbk-25",
        titulo: "Outbox Pattern e consistência eventual",
        tipo: "estudo",
        descricao:
          "Tabela outbox com FOR UPDATE SKIP LOCKED, poller vs Debezium CDC e consumer idempotente at-least-once.",
        cardSlug: "spring-outbox-pattern",
        estimateHours: 4,
      },
      {
        id: "sbk-26",
        titulo: "Observabilidade: Micrometer + OTel + Prometheus",
        tipo: "estudo",
        descricao:
          "Os 3 pilares com traceId correlacionado, métricas low-cardinality, Observation API, SLOs e dashboards para incidente.",
        cardSlug: "spring-observability-micrometer-otel",
        estimateHours: 5,
      },
      {
        id: "sbk-27",
        titulo: "Performance JVM: GC, JFR, HikariCP",
        tipo: "estudo",
        descricao:
          "GC G1/ZGC, JFR em prod, async-profiler, escape analysis, HikariCP dimensionamento e armadilhas JPA em batch.",
        cardSlug: "spring-performance-jvm-tuning",
        estimateHours: 5,
      },
      {
        id: "sbk-28",
        titulo: "Segurança: OWASP, supply chain, headers",
        tipo: "estudo",
        descricao:
          "OWASP Top 10 em Kotlin/Spring, SSRF, SQL injection em JPQL nativa, OWASP DC, headers de segurança e secrets.",
        cardSlug: "spring-security-pratico",
        estimateHours: 5,
      },
      {
        id: "sbk-29",
        titulo: "Spring Security 6 + OAuth2 + OIDC",
        tipo: "estudo",
        descricao:
          "Resource Server com JWT, PKCE em SPA, PASETO, refresh rotation, RBAC vs ABAC com bean customizado em SpEL.",
        cardSlug: "spring-security-oauth2-jwt",
        estimateHours: 5,
      },
      {
        id: "sbk-30",
        titulo: "Docker + GraalVM Native",
        tipo: "estudo",
        descricao:
          "Multi-stage com layertools, Buildpacks/JIB, GraalVM native-image com AOT do Spring 3, distroless e securityContext.",
        cardSlug: "spring-docker-graalvm-native",
        estimateHours: 4,
      },
      {
        id: "sbk-31",
        titulo: "Spring AI: ChatClient, RAG, Function Calling, MCP",
        tipo: "estudo",
        descricao:
          "Spring AI 1.x: ChatClient unificado, structured output, function calling com @Tool, RAG pgvector e MCP Server.",
        cardSlug: "spring-ai-integration",
        estimateHours: 5,
      },
      {
        id: "sbk-32",
        titulo: "Production Checklist completo",
        tipo: "pratica",
        descricao:
          "Aplique o checklist sênior a um serviço real seu (ou audit da empresa). Marque cada item e abra backlog dos gaps.",
        cardSlug: "spring-microservice-production-checklist",
        estimateHours: 6,
      },
      {
        id: "sbk-33",
        titulo: "Sentinela revisão de código",
        tipo: "pratica",
        descricao:
          "Passe pelo menos 3 sessões de Sentinela em código Kotlin/Spring que você escreveu. Vire revisor mais crítico que IA.",
        routeHref: "/sentinela",
        estimateHours: 3,
      },
      {
        id: "sbk-34",
        titulo: "System Design: 2 cenários enterprise",
        tipo: "pratica",
        descricao:
          "Projete: (1) sistema de pagamentos com idempotência e Saga; (2) plataforma multi-tenant com isolamento por município (GovTech).",
        routeHref: "/system-design",
        estimateHours: 6,
      },
      {
        id: "sbk-35",
        titulo: "RFC: migração ou arquitetura nova",
        tipo: "pratica",
        descricao:
          "Escreva uma RFC: 'migrar monolito legado X para microsserviços' OU 'adoção de Outbox + Kafka em workflow Y'.",
        routeHref: "/rfc-writing",
        estimateHours: 5,
      },
      {
        id: "sbk-36",
        titulo: "War Game: incidente em produção",
        tipo: "pratica",
        descricao:
          "Simule incidente Spring real: connection pool exausto, Kafka consumer parado, OOM por memory leak. Pratique diagnóstico sob pressão.",
        routeHref: "/war-game",
        estimateHours: 3,
      },
      {
        id: "sbk-37",
        titulo: "Entrevista Sênior — preparação",
        tipo: "entrevista",
        descricao:
          "Estude JVM internals, Spring deep, JPA pitfalls e prepare banco STAR de 7 histórias.",
        cardSlug: "spring-entrevista-senior",
        estimateHours: 6,
      },
      {
        id: "sbk-38",
        titulo: "Mock Interview técnica nível sênior",
        tipo: "entrevista",
        descricao:
          "Pratique entrevista com foco em arquitetura Spring, JVM internals, decisões de design e trade-offs.",
        routeHref: "/mock-interview",
        estimateHours: 3,
      },
      {
        id: "sbk-39",
        titulo: "Banco STAR: liderança técnica e incidentes",
        tipo: "entrevista",
        descricao:
          "Prepare 7 histórias STAR: incidente, decisão difícil, conflito, erro próprio, liderança, projeto de impacto, aprendizado rápido.",
        routeHref: "/banco-star",
        estimateHours: 4,
      },
      {
        id: "sbk-40",
        titulo: "Checkpoint Tier 5",
        tipo: "pratica",
        descricao:
          "Validação final: segurança, observabilidade, performance, OAuth2, Spring AI, entrevista sênior. Exame Tier 5 (aprovação ≥ 75).",
        cardSlug: "spring-checkpoint-tier-5",
        routeHref: "/skills/spring-boot-kotlin/exam/5",
        estimateHours: 6,
      },
    ],
    projetoPortfolio: {
      titulo: "Capstone: 2 Microsserviços Spring + Kotlin integrados",
      descricao:
        "Construa dois microsserviços empresariais (ex: 'billing-service' e 'notification-service') integrados via Kafka + gRPC. Cada um com seu Postgres, Flyway, OpenAPI, arquitetura hexagonal + DDD em Kotlin, Spring Security/OAuth2, observabilidade completa, outbox pattern e suíte de testes com Testcontainers. Deploy em Docker/K8s com GraalVM native opcional.",
      entregaveis: [
        "Repo GitHub público com 2 serviços, README, ADRs e runbook de incidente",
        "OpenAPI 3.1 versionado em ambos; contract tests rodando em CI",
        "Pipeline CI: testes (unit + integration com Testcontainers), OWASP DC, Trivy, build de imagem multi-arch",
        "Outbox pattern entre billing → notification via Kafka, com DLT e idempotency",
        "Spring Security: OAuth2 Resource Server em ambos, validação JWT entre serviços",
        "Observability completa: Prometheus + Grafana + Tempo + Loki + dashboards para incidente",
        "Postman / Insomnia collection demonstrando golden path + edge cases",
        "Diagrama C4 da arquitetura + decisão de trade-offs explicada nas ADRs",
        "1 vídeo (max 10min) demonstrando funcionalidade + decisões técnicas",
      ],
    },
    preparacaoEntrevista: {
      topicos: [
        "Kotlin idiomático: null-safety, sealed classes, value classes, scope functions",
        "JVM internals: GC G1/ZGC, escape analysis, JIT tiers, classpath",
        "Spring deep: AOP, ApplicationContext lifecycle, transactions (self-invocation, propagation)",
        "JPA pitfalls: N+1, lazy loading, EntityGraph, projections, locks",
        "Arquitetura: hexagonal vs camadas, DDD aggregates, bounded contexts",
        "Microsserviços: quando dividir, Saga vs 2PC, Outbox pattern, eventual consistency",
        "Mensageria: Kafka vs RabbitMQ, idempotência, DLT, exactly-once como ilusão",
        "Segurança: OAuth2 fluxos, JWT armadilhas, OWASP Top 10 com exemplos Spring",
        "Observabilidade: cardinality, SLOs, traces correlacionados",
        "Performance: HikariCP dimensionamento, GC tuning, JFR, profiling em prod",
      ],
      rotasMock: ["/mock-interview", "/system-design", "/rfc-writing", "/war-game", "/sentinela"],
      perguntasComuns: [
        "O que acontece quando você chama método @Transactional de outro método da mesma classe? Como contornar?",
        "Você está em um sistema com 100k pedidos/dia. Como resolveria N+1 em listagem de 1000 pedidos com 5 itens cada?",
        "Saga orquestrada vs coreografada — quando cada uma? Dê exemplo concreto.",
        "Por que data class não é boa entidade JPA? O que usar?",
        "Em Kotlin, qual a diferença entre @NotBlank no construtor e @field:NotBlank? Por que importa?",
        "Como você implementaria Outbox Pattern com Kafka e Postgres? Por que não publicar direto?",
        "Você tem 200 conexões no HikariCP e Postgres com 'too many connections'. O que fez de errado?",
        "Explique virtual threads (JDK 21) vs corrotinas Kotlin. Quando usar cada uma?",
        "JWT vs Session Cookie — onde cada um faz sentido? E PASETO?",
        "Como você detectaria memory leak num serviço Spring em produção?",
        "Por que GraalVM native faz sentido em Lambda e NÃO em monolito 24h up?",
        "Você precisa migrar de monolito Spring para microsserviços. Como você começaria? O que NÃO faria?",
        "Explique como funciona @PreAuthorize com SpEL e bean customizado. Quando faz sentido sobre RBAC simples?",
        "Como você testaria que sua aplicação NÃO tem N+1 em CI?",
        "Me fale de um incidente em produção que você liderou a solução. O que aprendeu?",
        "Como você convence o time/diretoria a NÃO virar microsserviços agora?",
      ],
    },
  },
];
