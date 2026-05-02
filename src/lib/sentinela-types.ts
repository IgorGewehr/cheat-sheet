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

export interface SentinelaSession {
  id: string;
  titulo: string;
  contexto?: string;
  codigo: string;
  linguagem?: string;
  veredito: SentinelaVeredito;
  scoreConfianca: number;
  achados: SentinelaAchado[];
  checklistRespondido: { itemId: string; resposta: "sim" | "nao" | "nao-sei" }[];
  decisaoFinal?: "aceito" | "rejeitado" | "corrigir";
  reflexao?: string;
  criadoEm: number;
}
