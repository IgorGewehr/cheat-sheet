import type { QuickTipo, QuickResult } from "@/app/api/idle/quick/route";

export type { QuickTipo, QuickResult };

export type QuickMode = QuickTipo | "plano";

export interface QuickModeConfig {
  id: QuickMode;
  label: string;
  description: string;
  placeholder: string;
}

export const QUICK_MODES: QuickModeConfig[] = [
  {
    id: "plano",
    label: "Plano completo",
    description: "Analise um plano antes de aprovar",
    placeholder: "Cole o plano do agente ou descreva o que pediu para o Claude fazer...",
  },
  {
    id: "decisao",
    label: "Decisao rapida",
    description: "Vou usar X ou Y? Receba 3 criterios + recomendacao",
    placeholder: "Ex: usar Redis ou memcache para sessoes? / Postgres JSONB ou tabela normalizada?",
  },
  {
    id: "bug",
    label: "Bug detective",
    description: "Stuck num bug? Receba 5 hipoteses ordenadas por probabilidade",
    placeholder: "Ex: query retorna duplicatas depois de adicionar paginacao offset no PostgreSQL",
  },
  {
    id: "standup",
    label: "Stand-up reverso",
    description: "Fiz X hoje, qual o proximo passo?",
    placeholder: "Ex: refatorei o AuthService, extraindo JWT do UserController. Proximo passo?",
  },
];
