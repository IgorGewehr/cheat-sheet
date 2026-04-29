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
  | "craft";

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
