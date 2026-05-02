export type JobLevel = "junior" | "pleno" | "senior" | "staff";

export type JobCategory =
  | "engenharia"
  | "dados"
  | "ia"
  | "seguranca"
  | "pesquisa"
  | "govtech";

export interface JobTrackMilestone {
  id: string;
  titulo: string;
  tipo: "estudo" | "pratica" | "projeto" | "entrevista";
  descricao: string;
  cardSlug?: string;
  routeHref?: string;
  externalUrl?: string;
  estimateHours?: number;
}

export interface JobTrack {
  slug: string;
  titulo: string;
  papel: string;
  categoria: JobCategory;
  nivelAlvo: JobLevel;
  resumo: string;
  preRequisitos: string[];
  marcos: JobTrackMilestone[];
  projetoPortfolio: {
    titulo: string;
    descricao: string;
    entregaveis: string[];
  };
  preparacaoEntrevista: {
    topicos: string[];
    rotasMock: string[];
    perguntasComuns: string[];
  };
}

export interface JobTrackProgress {
  trackSlug: string;
  marcosConcluidos: string[];
  iniciadoEm: number;
  ultimaAtualizacao: number;
}
