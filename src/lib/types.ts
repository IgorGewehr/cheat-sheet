export type CardCategory =
  | "arquiteturas"
  | "auth"
  | "padroes-frontend"
  | "padroes-backend"
  | "banco"
  | "stack-guides"
  | "infra"
  | "testes"
  | "prompts"
  | "checklists"
  | "armadilhas-ia"
  | "craft"
  | "agentes-ia"
  | "data-science"
  | "matematica";

export const CATEGORY_LABEL: Record<CardCategory, string> = {
  arquiteturas: "Arquiteturas",
  auth: "Autenticação & Contas",
  "padroes-frontend": "Padrões — Frontend",
  "padroes-backend": "Padrões — Backend",
  banco: "Banco & Persistência",
  "stack-guides": "Stack Guides",
  infra: "Infra & Microsserviços",
  testes: "Testes",
  prompts: "Prompts pra IA",
  checklists: "Checklists de Auditoria",
  "armadilhas-ia": "Armadilhas da IA",
  craft: "Craft & Julgamento Sênior",
  "agentes-ia": "Agentes de IA",
  "data-science": "Data Science & ML",
  matematica: "Matemática (Bacharelado)",
};

export interface CardFrontmatter {
  title: string;
  category: CardCategory;
  stack?: string[];
  tags?: string[];
  excerpt: string;
  related?: string[];
  updated?: string;
}

export interface Card extends CardFrontmatter {
  slug: string;
  body: string;
}

export type ProjectType = "frontend" | "backend" | "fullstack" | "microsservico";

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Fullstack",
  microsservico: "Microsserviço",
};

export const PROJECT_TYPE_COLOR: Record<ProjectType, "amber" | "emerald" | "sky" | "violet"> = {
  frontend: "sky",
  backend: "emerald",
  fullstack: "amber",
  microsservico: "violet",
};

export type ProjectStatus = "planejando" | "em-desenvolvimento" | "concluido" | "manutencao";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planejando: "Planejando",
  "em-desenvolvimento": "Em desenvolvimento",
  concluido: "Concluído / em produção",
  manutencao: "Manutenção",
};

export interface Project {
  id: string;
  nome: string;
  descricao?: string;
  stack: string[];
  tipo?: ProjectType;
  status?: ProjectStatus;
  repoUrl?: string;
  criadoEm: number;
  origemModulo?: { projetoId: string; projetoNome: string; moduloId: string; moduloNome: string };
}

export type ModuloStatus = "planejando" | "em-desenvolvimento" | "concluido" | "extraido";

export interface Modulo {
  id: string;
  projetoId: string;
  nome: string;
  tipo: string;
  status: ModuloStatus;
  descricao?: string;
  criadoEm: number;
  projetoExtraidoId?: string;
}

export type AdocaoStatus = "adotado" | "revisar" | "dificuldade" | "outra-abordagem";

export const ADOCAO_STATUS_LABEL: Record<AdocaoStatus, string> = {
  adotado: "Adotado",
  revisar: "Revisar",
  dificuldade: "Com dificuldade",
  "outra-abordagem": "Outra abordagem",
};

export const ADOCAO_STATUS_COLOR: Record<AdocaoStatus, string> = {
  adotado: "border-emerald-500 bg-emerald-500/10",
  revisar: "border-amber-500 bg-amber-500/10",
  dificuldade: "border-red-500 bg-red-500/10",
  "outra-abordagem": "border-violet-500 bg-violet-500/10 opacity-60",
};

export const ADOCAO_STATUS_DOT: Record<AdocaoStatus, string> = {
  adotado: "bg-emerald-500",
  revisar: "bg-amber-500",
  dificuldade: "bg-red-500",
  "outra-abordagem": "bg-violet-400",
};

export interface Adocao {
  id: string;
  projetoId: string;
  moduloId: string | null;
  cardSlug: string;
  status?: AdocaoStatus;
  notas?: string;
  dataDecisao: number;
}

export interface Decisao {
  id: string;
  projetoId: string;
  titulo: string;
  contexto: string;
  decisao: string;
  consequencias: string;
  status: "proposta" | "aceita" | "depreciada";
  data: number;
  cardSlugs?: string[];
  revisitas?: RevisitaDecisao[];
  revisitadoEm?: number[];  // timestamps de revisão via Idle Companion (compat A2)
}

// === DECISION JOURNAL (A3) ===

export type DecisaoUrgencia = "calmo" | "proximo" | "atrasado";

export interface RevisitaDecisao {
  data: number; // timestamp ms
  resposta: "ainda-faria" | "mudaria" | "depende";
  observacao?: string;
}

// ── Checklist Sessions ───────────────────────────────────────

export interface ChecklistSession {
  id: string;
  cardSlug: string;
  cardTitle: string;
  projetoId?: string;
  titulo: string;
  prUrl?: string;
  checked: boolean[];
  total: number;
  criadoEm: number;
}

// ── Comparações salvas ──────────────────────────────────────

export interface SavedComparison {
  id: string;
  titulo: string;
  slugs: string[];
  context: {
    scale?: "mvp" | "scale" | "enterprise";
    team?: "solo" | "small" | "medium" | "large";
    deadline?: "fast" | "normal" | "long";
    priority?: "speed" | "cost" | "quality" | "security";
    currentStack?: string[];
    notes?: string;
  };
  weights: Record<string, number>;
  // result.totalScores e ranking são suficientes pra preview;
  // result completo é re-gerado se o user reabrir
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any;
  criadoEm: number;
}

// ── Custom User Cards ────────────────────────────────────────

export interface CustomCard {
  id: string;
  title: string;
  category: CardCategory;
  stack: string[];
  tags: string[];
  excerpt: string;
  body: string;
  isCustom: true;
  criadoEm: number;
}

// ── Card do Dia (#1) ─────────────────────────────────────────

export interface CardDoDiaProgresso {
  id: string;
  cardSlug: string;
  data: string; // YYYY-MM-DD
  acertosQuiz: number;
  totalQuiz: number;
  completado: boolean;
  criadoEm: number;
}

// ── Trilha de Senioridade (#5) ───────────────────────────────

export type NivelTrilha = "junior" | "pleno" | "senior" | "staff";

export interface TrilhaProgresso {
  cardSlug: string;
  dominado: boolean;
  tentativas: number;
  melhorScore: number; // 0-100
  ultimaRevisao?: number;
}

// ── Dívida de Conhecimento (#7) ──────────────────────────────

export type DividaStatus = "pendente" | "em-andamento" | "paga";

export interface DividaConhecimento {
  id: string;
  descricao: string;
  contexto?: string;
  cardSlug?: string;
  status: DividaStatus;
  criadoEm: number;
  resolvidoEm?: number;
}

// ── Retrospectiva Semanal (#13) ──────────────────────────────

export interface Retrospectiva {
  id: string;
  semana: string; // YYYY-Www
  aprendizados: string;
  dividas: string;
  acertos: string;
  melhorias: string;
  scoreAprendizado: number; // 1-5
  geradaPorIA: boolean;
  criadoEm: number;
}

// ── Sprint sem IA (#14) ──────────────────────────────────────

export type SprintSemIAStatus = "em-andamento" | "concluido";

export interface SprintSemIA {
  id: string;
  titulo: string;
  descricao: string;
  status: SprintSemIAStatus;
  codigoProducido?: string;
  codigoIA?: string;
  reflexao?: string;
  lacunas?: string;
  criadoEm: number;
  concluidoEm?: number;
}

// ── Biblioteca de Erros Pessoais (#15) ───────────────────────

export interface ErroPersonal {
  id: string;
  titulo: string;
  descricao: string;
  categorias: string[];
  padraoViolado?: string;
  causaRaiz: string;
  comoDetectar: string;
  comoPrevenir: string;
  criadoEm: number;
}

// ── Banco de Experiências STAR (#19) ─────────────────────────

export interface ExperienciaSTAR {
  id: string;
  titulo: string;
  situacao: string;
  tarefa: string;
  acao: string;
  resultado: string;
  tags: string[];
  respostaFormatada?: string;
  criadoEm: number;
}

// ── System Design (#17) ──────────────────────────────────────

export type SystemDesignStatus = "rascunho" | "avaliado";

export interface SystemDesignSession {
  id: string;
  titulo: string;
  enunciado: string;
  resposta: string;
  feedbackIA?: string;
  scoreGeral?: number;
  pontosFracos?: string[];
  status: SystemDesignStatus;
  criadoEm: number;
}

// ── Mock Interview (#18) ─────────────────────────────────────

export type MockInterviewTipo = "tecnica" | "comportamental" | "misto";
export type MockInterviewStatus = "em-andamento" | "concluido";

export interface MockInterviewPergunta {
  pergunta: string;
  resposta: string;
  feedback?: string;
  score?: number;
}

export interface MockInterviewSession {
  id: string;
  tipo: MockInterviewTipo;
  nivel: "pleno" | "senior" | "staff";
  perguntas: MockInterviewPergunta[];
  scoreGeral?: number;
  feedbackGeral?: string;
  status: MockInterviewStatus;
  criadoEm: number;
}

// ── RFC Writing (#21) ────────────────────────────────────────

export type RFCStatus = "rascunho" | "revisado";

export interface RFCSession {
  id: string;
  titulo: string;
  problema: string;
  rfc: string;
  feedbackIA?: string;
  scoreClarez?: number;
  scoreCompletude?: number;
  scoreRaciocinio?: number;
  status: RFCStatus;
  criadoEm: number;
}

// ── War Game (#9) ────────────────────────────────────────────

export interface WarGameSession {
  id: string;
  cenario: string;
  restricoes: string[];
  decisao: string;
  justificativa: string;
  feedbackIA?: string;
  scoreDecisao?: number;
  tempoGasto?: number;
  criadoEm: number;
}

// ── Revisor de Código (#3) ───────────────────────────────────

export interface RevisorSession {
  id: string;
  cardSlug?: string;
  titulo: string;
  codigo: string;
  revisaoUsuario: string;
  revisaoIA?: string;
  lacunasUsuario?: string[];
  acertosUsuario?: string[];
  scoreRevisao?: number;
  status: "pendente" | "avaliado";
  criadoEm: number;
}

// === IDLE COMPANION (A2) ===

export interface IdleSession {
  id: string;
  workspaceId: string;
  plano: string;
  riscosIA: string[];
  perguntasIA: string[];
  alternativaIA: string;
  riscosConsiderados: string[];
  observacao?: string;
  criadoEm: number;
}

export interface QuestSession {
  id: string;
  workspaceId: string;
  decisaoId?: string;       // se foi gerada de decisão real
  fallback: boolean;
  pergunta: string;
  resposta: string;
  feedback: string;
  score: number;            // 0-100
  duracaoMs: number;
  criadoEm: number;
}

// ── Level Tiers ───────────────────────────────────────────────

export interface LevelTier {
  level: number;
  title: string;
  min: number;
  max: number;
  color: string;
  emoji: string;
}

export const LEVEL_TIERS: LevelTier[] = [
  { level: 0, title: "Iniciante",  min: 0,    max: 50,       color: "zinc",   emoji: "🌱" },
  { level: 1, title: "Aprendiz",   min: 50,   max: 200,      color: "slate",  emoji: "📘" },
  { level: 2, title: "Júnior",     min: 200,  max: 500,      color: "violet", emoji: "🌿" },
  { level: 3, title: "Pleno",      min: 500,  max: 1100,     color: "violet", emoji: "🌳" },
  { level: 4, title: "Sênior",     min: 1100, max: 2500,     color: "violet", emoji: "🔥" },
  { level: 5, title: "Staff",      min: 2500, max: 5000,     color: "violet", emoji: "🌟" },
  { level: 6, title: "Principal",  min: 5000, max: Infinity, color: "violet", emoji: "👑" },
];

// ── Squad / Team Collaboration ────────────────────────────────

export type SquadRole = "owner" | "editor";

export interface SquadMember {
  userId: string;
  displayName: string;
  role: SquadRole;
  joinedAt: number;
  avatarColor: string;
}

export interface SquadPresence {
  userId: string;
  displayName: string;
  currentPage: string;
  currentTask?: string;
  lastSeen: number;
  sessionId: string;
}

export type ConstraintType = "must" | "should" | "never" | "pattern";

export const CONSTRAINT_TYPE_LABEL: Record<ConstraintType, string> = {
  must:    "MUST",
  should:  "SHOULD",
  never:   "NEVER",
  pattern: "PATTERN",
};

export const CONSTRAINT_TYPE_COLOR: Record<ConstraintType, string> = {
  must:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  should:  "bg-sky-500/15 text-sky-400 border-sky-500/30",
  never:   "bg-red-500/15 text-red-400 border-red-500/30",
  pattern: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

export interface SquadConstraint {
  id: string;
  title: string;
  description: string;
  type: ConstraintType;
  category: string;
  cardSlug?: string;
  examples?: string[];
  createdBy: string;
  createdAt: number;
  active: boolean;
}

export interface SquadActivityEvent {
  id: string;
  userId: string;
  displayName: string;
  verb: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  timestamp: number;
  url?: string;
}

export interface Squad {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerDisplayName: string;
  workspaceId: string;
  inviteCode: string;
  createdAt: number;
}
