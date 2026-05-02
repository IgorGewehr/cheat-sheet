export type AwakeningTrack = "fullstack" | "data-science" | "ai-engineer" | "ai-agents";

export type HunterRankCode = "E" | "D" | "C" | "B" | "A" | "S";

export interface AwakeningQuestion {
  id: string;
  track: AwakeningTrack;
  difficulty: 1 | 2 | 3 | 4 | 5;
  pergunta: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
}

export interface AwakeningSession {
  id: string;
  track: AwakeningTrack;
  respostas: {
    questionId: string;
    resposta: number;
    correta: boolean;
    difficulty: number;
  }[];
  rankAtribuido: HunterRankCode;
  trilhaSugerida: string;
  pontosFracos: string[];
  criadoEm: number;
}

export interface EntryTrailStep {
  id: string;
  titulo: string;
  descricao: string;
  cardSlug?: string;
  tipo: "leitura" | "pratica" | "reflexao";
}

export interface EntryTrail {
  track: AwakeningTrack;
  titulo: string;
  descricaoCurta: string;
  etapas: EntryTrailStep[];
}

export interface EntryTrailProgress {
  id: string;
  track: AwakeningTrack;
  etapasCompletas: string[];
  iniciadoEm: number;
  ultimaAtualizacao: number;
}
