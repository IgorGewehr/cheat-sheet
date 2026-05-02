export type DisciplinaStatus = "aprovado" | "reprovado" | "cursando" | "futuro" | "optativa";
export type DisciplinaArea =
  | "fundamentos"
  | "calculo"
  | "algebra"
  | "analise"
  | "geometria"
  | "discreta"
  | "prob-stat"
  | "aplicada"
  | "fisica"
  | "meta";

export interface Disciplina {
  id: string;
  nome: string;
  area: DisciplinaArea;
  status: DisciplinaStatus;
  periodo?: string;
  creditos?: number;
  cardSlug?: string;
  notas?: string;
  atualizadoEm: number;
}
