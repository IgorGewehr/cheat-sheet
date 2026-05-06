export type ChallengeArea =
  | "arrays-strings"
  | "hashmaps"
  | "trees-graphs"
  | "dp"
  | "nestjs-design";

export type ChallengeRank = "E" | "D" | "C" | "B";

export type ChallengeVerdict = "PASS" | "PARTIAL" | "FAIL" | "PENDING";

export interface ChallengeExample {
  input: string;
  output: string;
  explicacao?: string;
}

export interface CodingChallenge {
  titulo: string;
  area: ChallengeArea;
  rank: ChallengeRank;
  enunciado: string;
  exemplos: ChallengeExample[];
  dicas: string[];
  expectedConcepts: string[];
  complexidadeEsperada: string;
}

export interface ChallengeRun {
  id: string;
  challenge: CodingChallenge;
  solucao: string;
  veredito: ChallengeVerdict;
  score: number;
  feedback: string;
  complexidadeAnalisada: string;
  conceitosCobertos: string[];
  conceitosFaltantes: string[];
  createdAt: number;
}
