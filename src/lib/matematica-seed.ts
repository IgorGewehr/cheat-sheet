import type { Disciplina, DisciplinaArea, DisciplinaStatus } from "./matematica-types";

type SeedDisciplina = Omit<Disciplina, "id" | "atualizadoEm">;

function d(
  nome: string,
  area: DisciplinaArea,
  status: DisciplinaStatus,
  periodo?: string,
  cardSlug?: string,
  creditos = 4,
): SeedDisciplina {
  return { nome, area, status, periodo, cardSlug, creditos };
}

export const SEED_DISCIPLINAS: SeedDisciplina[] = [
  // Período 2024.4 (1º)
  d("Trigonometria", "fundamentos", "reprovado", "2024.4", "trigonometria-essencial"),
  d("Cálculo Diferencial e Integral", "calculo", "aprovado", "2024.4", "calculo-1-variavel"),
  d("Geometria Plana", "geometria", "aprovado", "2024.4", "geometria-plana"),
  d("Teoria dos Números", "discreta", "aprovado", "2024.4", "teoria-dos-numeros"),

  // Período 2025.2 (2º)
  d("Lógica de Programação", "fundamentos", "aprovado", "2025.2"),
  d("Geometria Espacial", "geometria", "aprovado", "2025.2", "geometria-espacial"),
  d("Lógica Matemática", "fundamentos", "aprovado", "2025.2", "logica-matematica"),
  d("Trigonometria", "fundamentos", "aprovado", "2025.2", "trigonometria-essencial"),
  d("Álgebra Linear", "algebra", "aprovado", "2025.2", "algebra-linear"),

  // Período 2025.4 (3º)
  d("Análise Combinatória", "discreta", "reprovado", "2025.4", "analise-combinatoria"),
  d("Estruturas Algébricas", "algebra", "aprovado", "2025.4", "estruturas-algebricas"),
  d("Cálculo de Múltiplas Variáveis", "calculo", "aprovado", "2025.4", "calculo-multivariavel"),
  d("Análise Real", "analise", "aprovado", "2025.4", "analise-real"),
  d("Equações Diferenciais Ordinárias", "aplicada", "aprovado", "2025.4", "equacoes-diferenciais-ordinarias"),

  // Período atual (4º — cursando)
  d("Metodologia Científica", "meta", "cursando", "2026.1", "metodologia-cientifica"),
  d("Modelagem Matemática", "aplicada", "cursando", "2026.1", "modelagem-matematica"),
  d("Cálculo Vetorial e Geometria Analítica", "calculo", "cursando", "2026.1", "calculo-vetorial-geometria-analitica"),
  d("Física Teórica Experimental – Mecânica", "fisica", "cursando", "2026.1", "fisica-mecanica-classica"),
  d("Números Complexos e Equações Algébricas", "algebra", "cursando", "2026.1", "numeros-complexos"),

  // Futuro (5-8)
  d("Análise Combinatória (refazer)", "discreta", "futuro", undefined, "analise-combinatoria"),
  d("Análise Real II", "analise", "futuro", undefined, "analise-real"),
  d("Topologia Geral", "analise", "futuro", undefined, "topologia-geral"),
  d("Análise Complexa", "analise", "futuro", undefined, "analise-complexa"),
  d("Equações Diferenciais Parciais", "aplicada", "futuro", undefined, "equacoes-diferenciais-parciais"),
  d("Geometria Diferencial", "geometria", "futuro", undefined, "geometria-diferencial"),
  d("Probabilidade", "prob-stat", "futuro", undefined, "probabilidade"),
  d("Estatística e Inferência", "prob-stat", "futuro", undefined, "estatistica-inferencia"),
  d("Análise Numérica", "aplicada", "futuro", undefined, "analise-numerica"),
  d("Otimização e Pesquisa Operacional", "aplicada", "futuro", undefined, "otimizacao-pesquisa-op"),
  d("Teoria dos Grafos", "discreta", "futuro", undefined, "teoria-grafos-mat"),
  d("Eletromagnetismo", "fisica", "futuro", undefined, "fisica-mecanica-classica"),
  d("Análise Funcional / Medida e Integração", "analise", "futuro", undefined, "medida-integracao"),
  d("Teoria de Galois", "algebra", "futuro", undefined, "algebra-galois"),
  d("Mecânica Lagrangiana e Hamiltoniana", "fisica", "futuro", undefined, "mecanica-lagrangiana-hamiltoniana"),
  d("Topologia Algébrica", "analise", "futuro", undefined, "topologia-algebrica"),
  d("Processos Estocásticos", "prob-stat", "futuro", undefined, "processos-estocasticos"),
  d("Análise de Fourier", "analise", "futuro", undefined, "analise-fourier"),
  d("TCC — Trabalho de Conclusão de Curso", "meta", "futuro"),
  d("Estágio Supervisionado", "meta", "futuro"),

  // Extras / optativas
  d("Séries e Sequências", "analise", "optativa", undefined, "series-e-sequencias"),
  d("LaTeX & Paper de Matemática", "meta", "optativa", undefined, "latex-mat-papers"),
  d("Técnicas de Demonstração", "fundamentos", "optativa", undefined, "tecnicas-demonstracao"),
];
