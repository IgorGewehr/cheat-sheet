export type MathArea =
  | "calculo"
  | "algebra"
  | "analise"
  | "probabilidade"
  | "discreta"
  | "geometria"
  | "logica"
  | "numeros"
  | "aplicada";

export type QuestRank = "E" | "D" | "C" | "B" | "A" | "S";

export type QuestVerdict = "PASS" | "PARTIAL" | "FAIL" | "PENDING";

export interface MathQuestProblem {
  id: string;
  area: MathArea;
  rank: QuestRank;
  enunciado: string;
  contextoSolucao?: string;
  isBoss?: boolean;
  expectedConcepts: string[];
}

export interface MathQuestAnswer {
  problemId: string;
  resposta: string;
  veredito: QuestVerdict;
  scoreAvaliacao: number;
  feedback: string;
  conceitosCobertos: string[];
  conceitosFaltantes: string[];
  dicasUsadas: number;
  mpFinal: number;
}

export interface MathQuestRun {
  id: string;
  area: MathArea;
  rank: QuestRank;
  problemas: MathQuestProblem[];
  respostas: MathQuestAnswer[];
  xpGanho: number;
  status: "em-andamento" | "concluido" | "abandonado";
  iniciadoEm: number;
  concluidoEm?: number;
}
