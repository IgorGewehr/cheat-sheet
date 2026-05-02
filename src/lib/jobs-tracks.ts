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

  // ─── 9. Quant / AI Researcher ─────────────────────────────────────────────
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
];
