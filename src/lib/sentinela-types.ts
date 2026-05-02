export type SentinelaVeredito = "PASS" | "WARN" | "DENY";

export type SentinelaCategoria =
  | "seguranca"
  | "validacao"
  | "performance"
  | "manutenibilidade"
  | "testes"
  | "compatibilidade"
  | "alucinacao"
  | "convencoes";

export interface SentinelaAchado {
  categoria: SentinelaCategoria;
  severidade: "critico" | "alto" | "medio" | "baixo";
  linha?: number;
  trecho?: string;
  descricao: string;
  comoCorrigir: string;
}

export interface SentinelaChecklistItem {
  id: string;
  pergunta: string;
  obrigatorio: boolean;
}

export type SentinelaModo = "codigo" | "diff";

export interface SentinelaSession {
  id: string;
  titulo: string;
  contexto?: string;
  codigo: string;
  linguagem?: string;
  modo?: SentinelaModo;
  prUrl?: string;
  taskId?: string;
  veredito: SentinelaVeredito;
  scoreConfianca: number;
  achados: SentinelaAchado[];
  checklistRespondido: { itemId: string; resposta: "sim" | "nao" | "nao-sei" }[];
  decisaoFinal?: "aceito" | "rejeitado" | "corrigir";
  reflexao?: string;
  adrId?: string;
  criadoEm: number;
}
