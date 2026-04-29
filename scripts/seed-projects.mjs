// Seed dos 4 projetos analisados (saas-erp, gestao-raiz, sefaz-api, notification-server)
// no workspace EKQuaUZAnsYfKprk8grlZlkzkRk2 do brain.
//
// Uso:
//   node scripts/seed-projects.mjs
//
// Preserva docs existentes — adiciona com IDs novos. Pra zerar, apague na UI antes.

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, writeBatch, collection } from "firebase/firestore";
import { randomUUID } from "node:crypto";

const firebaseConfig = {
  apiKey: "AIzaSyDqGt7sYozIVZJHeBa3-5JQ8D0srcemnkE",
  authDomain: "facilito-9f70c.firebaseapp.com",
  projectId: "facilito-9f70c",
  storageBucket: "facilito-9f70c.firebasestorage.app",
  messagingSenderId: "851640298286",
  appId: "1:851640298286:web:35ebad519bd288acb568bf",
};

const WORKSPACE_ID = "EKQuaUZAnsYfKprk8grlZlkzkRk2";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

const ts = (offset = 0) => Date.now() + offset;
const mid = () => randomUUID();

function ref(name, id) {
  return doc(db, "workspaces", WORKSPACE_ID, name, id);
}

// ========= Projeto 1: saas-erp (ServicePro) =========

const saasErp = {
  id: mid(),
  nome: "ServicePro (saas-erp)",
  descricao: "SaaS multi-tenant fullstack para prestadores de serviço. 15 módulos em produção, agente IA Python autônomo, omnichannel WhatsApp/Meta. Auditoria pré-produção concluída com isolamento businessId.",
  stack: ["Next.js 15", "React 19", "TypeScript", "Firebase", "Firestore", "MUI", "Tailwind CSS", "TanStack Query", "FastAPI", "LangGraph", "Docker", "Cloudflare Tunnel"],
  tipo: "fullstack",
  status: "concluido",
  repoUrl: "/Users/igorgewehr/air/saas-erp",
  criadoEm: ts(0),
};

const saasErpModulos = [
  { nome: "Dashboard",      tipo: "feature", descricao: "KPIs + AI Analyst chat" },
  { nome: "Agenda",         tipo: "feature", descricao: "Appointments + sync Google/Apple" },
  { nome: "CRM",            tipo: "feature", descricao: "Contatos, deals, pipeline, automações, broadcasts" },
  { nome: "PDV",            tipo: "feature", descricao: "Ponto de venda, pagamentos PIX/TEF, giftcards, loyalty" },
  { nome: "Financeiro",     tipo: "feature", descricao: "Transações, recorrência, conciliação bancária" },
  { nome: "Estoque",        tipo: "feature", descricao: "Produtos, movimentações, transfer, devolução" },
  { nome: "Fiscal",         tipo: "feature", descricao: "NFe, NFCe, NFSe, certificados A1 AES" },
  { nome: "Conversas",      tipo: "feature", descricao: "Omnichannel WhatsApp/Facebook/Instagram + notas internas" },
  { nome: "Kanban",         tipo: "feature", descricao: "Boards customizáveis, visibilidade por setor" },
  { nome: "Configurações",  tipo: "feature", descricao: "Empresa, usuários, invite codes, setores, Enterprise mode" },
  { nome: "Integrações",    tipo: "feature", descricao: "Stripe, OpenAI, Anthropic, GitHub, Vercel, Resend, Discord" },
  { nome: "Relatórios",     tipo: "feature", descricao: "BI, ROI campanhas, NPS, reputação" },
  { nome: "Senhas/Cofre",   tipo: "feature", descricao: "Password vault AES-256-GCM com logs de acesso" },
  { nome: "Booking público",tipo: "feature", descricao: "Página pública de agendamento" },
  { nome: "Agente IA",      tipo: "microsservico", descricao: "Python FastAPI + LangGraph (orders, agendamentos)" },
];

const saasErpAdocoes = [
  ["modular-monolith",         "adotado"],
  ["multi-tenant-strategies",  "adotado"],
  ["firestore-multi-tenant",   "adotado"],
  ["auth-architecture",        "adotado"],
  ["rbac-vs-abac",             "adotado"],
  ["account-creation-flow",    "adotado"],
  ["session-strategy",         "adotado"],
  ["background-jobs",          "adotado"],
  ["caching-layers",           "adotado"],
  ["docker-compose-dev",       "adotado"],
  ["docker-multistage",        "adotado"],
  ["app-router",               "adotado"],
  ["dto-validation",           "adotado"],
  ["ddd-light-erp",            "adotado"],
  ["omnichannel-conversations","adotado"],
  ["token-encryption-at-rest", "adotado"],
  ["microservices-quando-usar","dificuldade"],
  ["repository-pattern",       "dificuldade"],
  ["soft-delete-audit",        "revisar"],
  ["server-actions",           "revisar"],
  ["server-components",        "revisar"],
  ["streaming-suspense",       "revisar"],
  ["event-driven",             "revisar"],
  ["cqrs-lite",                "revisar"],
  ["use-cases",                "revisar"],
  ["observability",            "revisar"],
  ["firestore-cost-optimization","revisar"],
  ["rate-limit-distribuido",   "revisar"],
  ["outbox-pattern",           "outra-abordagem"],
  ["saga-pattern",             "outra-abordagem"],
];

const saasErpDecisoes = [
  {
    titulo: "Multi-tenancy via campo businessId em todo doc",
    contexto: "Firestore não tem schemas/RLS. Precisamos isolar dados de N negócios.",
    decisao: "Toda coleção carrega businessId. Toda query filtra por businessId. Firestore Rules verificam request.auth.uid + role + businessId.",
    consequencias: "Disciplina de query obrigatória. Esquecer um WHERE vaza dados. Auditoria pré-prod cobriu 15 módulos.",
    status: "aceita",
    cardSlugs: ["multi-tenant-strategies", "firestore-multi-tenant"],
  },
  {
    titulo: "Tokens de canal e senha de certificado encriptados (AES-256-GCM)",
    contexto: "Tokens WhatsApp/FB/IG e senha do PFX trafegam pro Firestore. Plaintext = vazamento garante.",
    decisao: "AES-256-GCM com chaves SEPARADAS pra cada escopo (token vs cert password). Decrypt apenas server-side.",
    consequencias: "Mais um cuidado em cada feature nova de canal. Migration de chave futura precisa versionamento.",
    status: "aceita",
    cardSlugs: ["token-encryption-at-rest", "certificado-digital-a1"],
  },
  {
    titulo: "Atomicidade crítica via writeBatch (não outbox)",
    contexto: "PDV.confirmSale envolve venda + estoque + transação + loyalty + giftcard.",
    decisao: "writeBatch único. Falha = nada persiste. Outbox seria over-engineering pra escala atual.",
    consequencias: "Limite de 500 ops/batch. Não suporta cross-region. Re-avaliar quando chegar a múltiplos shards.",
    status: "aceita",
    cardSlugs: ["outbox-pattern", "saga-pattern"],
  },
  {
    titulo: "Webhook Meta com dedup obrigatória + HMAC + DLQ",
    contexto: "Meta entrega at-least-once. Sem dedup = mensagem duplicada, contagem errada, automação 2x.",
    decisao: "externalMessageId único antes de inserir. X-Hub-Signature-256 verificado com timingSafeEqual. Dead-letter queue pra falhas.",
    consequencias: "Latência adicional no webhook (consulta antes de insert). Aceitável.",
    status: "aceita",
    cardSlugs: ["omnichannel-conversations"],
  },
  {
    titulo: "Agente IA como microsserviço Python separado",
    contexto: "LangGraph + tool-calling em Python ecosystem. Não cabia no Next.",
    decisao: "Microsserviço Python (FastAPI) atrás de Cloudflare Tunnel. Comunicação HTTP com shared secret + ID token.",
    consequencias: "Operação extra. Tight-coupling temporário (HTTP sync). Futuro: message queue.",
    status: "aceita",
    cardSlugs: ["microservices-quando-usar"],
  },
  {
    titulo: "Listeners onSnapshot sem paginação em conversas",
    contexto: "UX precisa real-time. limit() complicaria 'load more'.",
    decisao: "ACEITAR custo. Roadmap: implementar limit(50) + lazy load.",
    consequencias: "Custo Firestore proporcional ao volume de mensagens. Já flagged no AUDIT.",
    status: "proposta",
    cardSlugs: ["firestore-cost-optimization", "ai-sem-paginacao"],
  },
];

// ========= Projeto 2: gestao-raiz =========

const gestaoRaiz = {
  id: mid(),
  nome: "Gestão Raiz",
  descricao: "ERP fullstack com foco fiscal (NFe/NFCe/MDFe/SPED). Service layer, Firestore multi-tenant, Zod validation, 410 testes (90% passando). 2 BLOCKERs pré-deploy: hardcoded tenantId em admin route, race condition FEFO no PDV.",
  stack: ["Next.js 16", "React 19", "TypeScript 5.9", "Tailwind 4", "Firestore", "Firebase Auth", "Zod", "Radix UI", "Vitest", "Docker", "Cloudflare Tunnel"],
  tipo: "fullstack",
  status: "em-desenvolvimento",
  repoUrl: "/Users/igorgewehr/webstormprojects/gestao-raiz",
  criadoEm: ts(1),
};

const gestaoRaizModulos = [
  { nome: "Fiscal",       tipo: "feature", descricao: "NFe, NFCe, MDFe, SPED, DANFE, certificado A1" },
  { nome: "Financial",    tipo: "feature", descricao: "AR, pagamentos, banco, reconciliação, DRE" },
  { nome: "Industrial",   tipo: "feature", descricao: "Ordens de produção, BOM, MRP, calibração" },
  { nome: "Products",     tipo: "feature", descricao: "Catálogo, fórmulas, GHS, ANVISA, marketplace sync" },
  { nome: "Clients/CRM",  tipo: "feature", descricao: "Cadastro, scoring, interações, batch import" },
  { nome: "Compras",      tipo: "feature", descricao: "Notas recebidas, SEFAZ sync, fornecedores" },
  { nome: "PDV",          tipo: "feature", descricao: "Ponto de venda com FEFO lot selection (race condition pendente)" },
  { nome: "Auth",         tipo: "feature", descricao: "Firebase Auth + custom claims (tenantId, role)" },
  { nome: "Admin",        tipo: "feature", descricao: "Endpoints privilegiados, fix-invoices (BLOCKER), webhooks" },
  { nome: "Assistant",    tipo: "feature", descricao: "OpenAI chat com streaming, knowledge base" },
  { nome: "Reports",      tipo: "feature", descricao: "DRE, accounting export (XML + SPED)" },
  { nome: "Webhooks",     tipo: "feature", descricao: "SEFAZ fiscal, MDFe, marketplace, Asaas pagamentos" },
  { nome: "Automations",  tipo: "feature", descricao: "SEFAZ sync-all, reconciliation manual" },
];

const gestaoRaizAdocoes = [
  ["clean-architecture",       "adotado"],
  ["modular-monolith",         "adotado"],
  ["multi-tenant-strategies",  "adotado"],
  ["firestore-multi-tenant",   "adotado"],
  ["account-creation-flow",    "adotado"],
  ["auth-architecture",        "adotado"],
  ["rbac-vs-abac",             "adotado"],
  ["soft-delete-audit",        "adotado"],
  ["docker-compose-dev",       "adotado"],
  ["docker-multistage",        "adotado"],
  ["app-router",               "adotado"],
  ["server-components",        "adotado"],
  ["dto-validation",           "adotado"],
  ["certificado-digital-a1",   "adotado"],
  ["sefaz-integration-br",     "adotado"],
  ["gateway-compliance",       "adotado"],
  ["ddd-light-erp",            "revisar"],
  ["hexagonal",                "dificuldade"],
  ["multi-filial",             "revisar"],
  ["n-plus-1",                 "dificuldade"],
  ["background-jobs",          "revisar"],
  ["caching-layers",           "revisar"],
  ["observability",            "revisar"],
  ["server-actions",           "dificuldade"],
  ["streaming-suspense",       "revisar"],
  ["session-strategy",         "revisar"],
  ["session-cookie-vs-jwt",    "revisar"],
  ["rate-limit-distribuido",   "dificuldade"],
  ["decimal-money",            "revisar"],
  ["firestore-cost-optimization","revisar"],
  ["event-driven",             "outra-abordagem"],
];

const gestaoRaizDecisoes = [
  {
    titulo: "Service layer pattern (sem Repository explícito)",
    contexto: "Firebase Admin SDK já é abstração. Repository extra seria duplicação.",
    decisao: "Route → withAuth middleware → service (fiscal.service.ts) → Firestore SDK direto.",
    consequencias: "Difícil trocar de DB sem refatoração ampla. Test isolation requer mock do Admin SDK.",
    status: "aceita",
    cardSlugs: ["clean-architecture", "repository-pattern"],
  },
  {
    titulo: "SEFAZ API em repositório separado (Node Express)",
    contexto: "Compliance fiscal muda em NTs anuais. Deploy próprio reduz risco.",
    decisao: "Microsserviço com circuit breaker, rate limit por IP, status endpoints.",
    consequencias: "Latência extra em emissão. Necessário monitorar conexão entre serviços.",
    status: "aceita",
    cardSlugs: ["sefaz-integration-br", "gateway-compliance", "microservices-quando-usar"],
  },
  {
    titulo: "Firebase Auth + custom claims (tenantId/role) sincronizados via /api/auth/sync-claims",
    contexto: "Custom claims só atualizam no refresh do ID token. UI precisa de feedback rápido quando role muda.",
    decisao: "Endpoint sync-claims dispara getIdToken(true). Cookie __session client-side.",
    consequencias: "HIGH-01: cookie sem HttpOnly → vulnerável a XSS. Pendente migrar pra session cookie HttpOnly via Admin SDK.",
    status: "proposta",
    cardSlugs: ["session-cookie-vs-jwt", "auth-architecture"],
  },
  {
    titulo: "Rate limiter in-memory (HIGH-03)",
    contexto: "Single-container Docker + Cloudflare Tunnel.",
    decisao: "Map em memória. Funciona em 1 instância.",
    consequencias: "Inútil se migrar pra Netlify/Vercel multi-instance. Precisa Redis ou Firestore-backed.",
    status: "proposta",
    cardSlugs: ["rate-limit-distribuido"],
  },
  {
    titulo: "Race condition FEFO no PDV (HIGH-05)",
    contexto: "Lote selecionado client-side antes do writeBatch.",
    decisao: "Mover seleção FEFO pro endpoint server-side com runTransaction.",
    consequencias: "Risco real de estoque negativo com 2 caixas simultâneos. Em backlog crítico.",
    status: "proposta",
    cardSlugs: ["decimal-money"],
  },
  {
    titulo: "ignoreBuildErrors: true no next.config (HIGH-06/09)",
    contexto: "87 erros TS escondidos pra deploy não falhar. Inclui crash potencial em runtime.",
    decisao: "DEVE ser removido antes de produção. Investigar caso a caso.",
    consequencias: "Risco alto de bug em runtime sem proteção do compilador.",
    status: "proposta",
    cardSlugs: ["como-auditar-codigo-ia"],
  },
];

// ========= Projeto 3: sefaz-api =========

const sefazApi = {
  id: mid(),
  nome: "sefaz-api",
  descricao: "Microsserviço REST para integração com SEFAZ. Emissão NFe (modelo 55 async), NFCe (65 sync), NFSe multi-provider (Betha/Nacional/SP), MDFe. Assinatura A1 SHA-1, polling assíncrono, multi-provider abstraction.",
  stack: ["Node.js 22", "TypeScript", "Express 5.1", "xml-crypto", "node-forge", "xmlbuilder2", "fast-xml-parser", "Vitest", "Docker"],
  tipo: "microsservico",
  status: "concluido",
  repoUrl: "/Users/igorgewehr/webstormprojects/sefaz-api",
  criadoEm: ts(2),
};

const sefazApiModulos = [
  { nome: "NFe (modelo 55)",       tipo: "endpoint", descricao: "Emissão B2B com polling assíncrono SEFAZ" },
  { nome: "NFCe (modelo 65)",      tipo: "endpoint", descricao: "Cupom B2C síncrono, cancel 30min" },
  { nome: "NFSe Betha",            tipo: "endpoint", descricao: "Provider Betha (municipios SC, RS, PR…)" },
  { nome: "NFSe Nacional",         tipo: "endpoint", descricao: "Padrão Nacional (várias cidades)" },
  { nome: "NFSe São Paulo",        tipo: "endpoint", descricao: "Provider específico SP" },
  { nome: "MDFe (modelo 58)",      tipo: "endpoint", descricao: "Manifesto de transporte" },
  { nome: "Documentation",         tipo: "feature",  descricao: "Swagger/OpenAPI auto-gerado" },
  { nome: "Metrics",               tipo: "feature",  descricao: "In-memory metrics (precisa Redis em prod)" },
];

const sefazApiAdocoes = [
  ["microservices-quando-usar",  "adotado"],
  ["sefaz-integration-br",       "adotado"],
  ["certificado-digital-a1",     "adotado"],
  ["gateway-compliance",         "adotado"],
  ["auth-architecture",          "adotado"],
  ["use-cases",                  "adotado"],
  ["repository-pattern",         "adotado"],
  ["cqrs-lite",                  "adotado"],
  ["docker-multistage",          "adotado"],
  ["dto-validation",             "revisar"],
  ["observability",              "revisar"],
  ["caching-layers",             "revisar"],
  ["rate-limit-distribuido",     "dificuldade"],
];

const sefazApiDecisoes = [
  {
    titulo: "SHA-1 (não SHA-256) na assinatura XML",
    contexto: "NT 2016.002. SVRS rejeita SHA-256 em produção (erro 225).",
    decisao: "xml-crypto forçando rsa-sha1 + canonicalization C14N + digest sha1.",
    consequencias: "Requer atenção se SEFAZ atualizar NT. Documentado no signer.",
    status: "aceita",
    cardSlugs: ["sefaz-integration-br", "certificado-digital-a1"],
  },
  {
    titulo: "Polling assíncrono pra NFe modelo 55 (3s × 10 tentativas)",
    contexto: "indSinc=0 entrega recibo nRec, processamento real é em background.",
    decisao: "Polling 3s, max 10 tentativas. Após timeout, devolve status='processando'.",
    consequencias: "Worker pode esperar até 30s. Gateway timeout configurado.",
    status: "aceita",
    cardSlugs: ["gateway-compliance", "cqrs-lite"],
  },
  {
    titulo: "Multi-provider NFSe via factory + interface comum",
    contexto: "Cada município tem provider diferente (Betha, Nacional, SP).",
    decisao: "INfseProvider interface, provider-factory.ts resolve por código IBGE. Singletons.",
    consequencias: "Adicionar município novo = nova classe + entrada na factory. Sem refactor.",
    status: "aceita",
    cardSlugs: ["repository-pattern"],
  },
  {
    titulo: "API key Bearer com timingSafeEqual",
    contexto: "Endpoints públicos protegidos com token compartilhado.",
    decisao: "crypto.timingSafeEqual evita timing attacks.",
    consequencias: "Sem rotation automatic. Token único por instância.",
    status: "aceita",
    cardSlugs: ["auth-architecture"],
  },
  {
    titulo: "Métricas in-memory (precisa Redis em prod)",
    contexto: "Métricas de latência/erro sem persistir.",
    decisao: "Storage em-memory, comentário 'use Redis em produção'.",
    consequencias: "Reset a cada restart. Não escala em multi-instância.",
    status: "proposta",
    cardSlugs: ["rate-limit-distribuido", "observability"],
  },
];

// ========= Projeto 4: notification-server =========

const notificationServer = {
  id: mid(),
  nome: "notification-server",
  descricao: "Microsserviço multi-canal (WhatsApp via Baileys + Email SMTP) com agendamento via node-cron, persistência Firestore, dashboard SSE. Monolito de arquivo único (server.js 1.3k linhas) — anti-pattern conhecido.",
  stack: ["Node.js 20", "Express 4.21", "Firebase", "Firestore", "Baileys", "Nodemailer", "node-cron", "Pino", "Multer", "Docker", "Cloudflare"],
  tipo: "microsservico",
  status: "manutencao",
  repoUrl: "/Users/igorgewehr/WebstormProjects/notification-server",
  criadoEm: ts(3),
};

const notifModulos = [
  { nome: "WhatsApp (Baileys)",   tipo: "endpoint",      descricao: "Cliente não-oficial, sessions locais em ./auth" },
  { nome: "Email (SMTP)",         tipo: "endpoint",      descricao: "Nodemailer com transporters por app, in-memory cache" },
  { nome: "Bulk send",            tipo: "endpoint",      descricao: "Múltiplos destinatários com personalização" },
  { nome: "Agendamento",          tipo: "feature",       descricao: "node-cron + Map (não-distribuído, jobs duplicam em multi-instance)" },
  { nome: "Dashboard SSE",        tipo: "feature",       descricao: "HTML vanilla, log/status push" },
  { nome: "Auth/Sessions",        tipo: "feature",       descricao: "API_KEY → cookie nf_session" },
  { nome: "Upload contábil",      tipo: "endpoint",      descricao: "ZIP via Multer, envio pra contador" },
];

const notifAdocoes = [
  ["microservices-quando-usar",  "adotado"],
  ["session-strategy",           "adotado"],
  ["caching-layers",             "adotado"],
  ["modular-monolith",           "dificuldade"],
  ["ai-monolito-arquivo-unico",  "adotado"],
  ["background-jobs",            "dificuldade"],
  ["rate-limit-distribuido",     "dificuldade"],
  ["dto-validation",             "revisar"],
  ["repository-pattern",         "dificuldade"],
  ["outbox-pattern",             "dificuldade"],
  ["observability",              "revisar"],
  ["docker-multistage",          "revisar"],
];

const notifDecisoes = [
  {
    titulo: "Tudo em server.js (1.3k linhas)",
    contexto: "MVP entregue rápido. IA gerou estrutura monolítica.",
    decisao: "ACEITAR temporariamente. Refatoração planejada por camadas (routes/services/repos/gateways).",
    consequencias: "Onboarding lento, conflito de merge constante, teste é integração only.",
    status: "proposta",
    cardSlugs: ["ai-monolito-arquivo-unico", "modular-monolith"],
  },
  {
    titulo: "Baileys (WhatsApp não-oficial)",
    contexto: "WhatsApp Business API exige Business Account + custos.",
    decisao: "Baileys via WebSocket. Sessions locais.",
    consequencias: "Risco de bloqueio de número. Sem SLA. Bom pra B2B fechado.",
    status: "aceita",
    cardSlugs: ["omnichannel-conversations"],
  },
  {
    titulo: "Agendamento em node-cron + Map global",
    contexto: "Single-instance, simples.",
    decisao: "node-cron + scheduledJobs Map.",
    consequencias: "Restart perde jobs em-memory. Multi-instance duplica execução.",
    status: "proposta",
    cardSlugs: ["background-jobs", "rate-limit-distribuido"],
  },
  {
    titulo: "Multi-tenant via appId (cada empresa = config própria)",
    contexto: "Servir Gestão Raiz + outros SaaS no mesmo serviço.",
    decisao: "Cada appId tem WhatsApp + SMTP próprios. SMTP em Firestore, WA local.",
    consequencias: "Sessions WA não migram entre instâncias. Operação manual em deploy.",
    status: "aceita",
    cardSlugs: ["multi-tenant-strategies"],
  },
];

// ========= Execução =========

async function seedOne(project, modulos, adocoes, decisoes) {
  const projectDoc = clean(project);
  const batch = writeBatch(db);

  batch.set(ref("projetos", project.id), projectDoc);

  const moduloIds = [];
  modulos.forEach((m, i) => {
    const id = mid();
    moduloIds.push(id);
    batch.set(ref("modulos", id), clean({
      id,
      projetoId: project.id,
      nome: m.nome,
      tipo: m.tipo,
      status: "concluido",
      descricao: m.descricao,
      criadoEm: ts(10 + i),
    }));
  });

  adocoes.forEach(([cardSlug, status], i) => {
    const id = mid();
    batch.set(ref("adocoes", id), clean({
      id,
      projetoId: project.id,
      moduloId: null,
      cardSlug,
      status,
      dataDecisao: ts(100 + i),
    }));
  });

  decisoes.forEach((d, i) => {
    const id = mid();
    batch.set(ref("decisoes", id), clean({
      id,
      projetoId: project.id,
      titulo: d.titulo,
      contexto: d.contexto,
      decisao: d.decisao,
      consequencias: d.consequencias,
      status: d.status,
      data: ts(1000 + i),
      cardSlugs: d.cardSlugs,
    }));
  });

  await batch.commit();
  console.log(`✓ ${project.nome} — ${modulos.length} módulos, ${adocoes.length} adoções, ${decisoes.length} decisões`);
}

async function main() {
  console.log("Autenticando...");
  await signInAnonymously(auth);
  console.log("✓ Auth: ", auth.currentUser?.uid);
  console.log(`Workspace alvo: workspaces/${WORKSPACE_ID}\n`);

  await seedOne(saasErp,            saasErpModulos,    saasErpAdocoes,    saasErpDecisoes);
  await seedOne(gestaoRaiz,         gestaoRaizModulos, gestaoRaizAdocoes, gestaoRaizDecisoes);
  await seedOne(sefazApi,           sefazApiModulos,   sefazApiAdocoes,   sefazApiDecisoes);
  await seedOne(notificationServer, notifModulos,      notifAdocoes,      notifDecisoes);

  console.log("\n✅ Seed concluído. Acesse https://...workspace e cole o ID:");
  console.log(`   ${WORKSPACE_ID}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
