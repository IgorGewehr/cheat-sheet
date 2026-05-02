import type { Disciplina, DisciplinaArea } from "./matematica-types";
import type { TrilhaProgresso, Card } from "./types";

const MAT_CATEGORIES = new Set(["matematica"]);

export function computeMatScore(
  disciplinas: Disciplina[],
  trilha: TrilhaProgresso[],
  cards: Card[],
): number {
  const obrigatorias = disciplinas.filter(
    (d) => d.status !== "optativa",
  );
  const totalObrigatorias = obrigatorias.length;
  if (totalObrigatorias === 0) return 0;

  let disciplinaPoints = 0;
  for (const d of obrigatorias) {
    if (d.status === "aprovado") disciplinaPoints += 4;
    else if (d.status === "cursando") disciplinaPoints += 2;
  }
  const maxDisciplinaPoints = totalObrigatorias * 4;
  const disciplinaScore = (disciplinaPoints / maxDisciplinaPoints) * 100;

  const matCards = cards.filter((c) => MAT_CATEGORIES.has(c.category));
  let cardBonus = 0;
  if (matCards.length > 0) {
    const dominated = matCards.filter((c) =>
      trilha.some((t) => t.cardSlug === c.slug && t.dominado),
    ).length;
    cardBonus = (dominated / matCards.length) * 20;
  }

  const raw = disciplinaScore * 0.8 + cardBonus;
  return Math.min(100, Math.round(raw));
}

export function groupByArea(
  disciplinas: Disciplina[],
): Record<DisciplinaArea, Disciplina[]> {
  const result: Record<DisciplinaArea, Disciplina[]> = {
    fundamentos: [],
    calculo: [],
    algebra: [],
    analise: [],
    geometria: [],
    discreta: [],
    "prob-stat": [],
    aplicada: [],
    fisica: [],
    meta: [],
  };
  for (const d of disciplinas) {
    result[d.area].push(d);
  }
  return result;
}

export function progressByPeriodo(
  disciplinas: Disciplina[],
): Array<{ periodo: string; aprovadas: number; total: number }> {
  const map = new Map<string, { aprovadas: number; total: number }>();
  for (const d of disciplinas) {
    if (!d.periodo) continue;
    if (!map.has(d.periodo)) map.set(d.periodo, { aprovadas: 0, total: 0 });
    const entry = map.get(d.periodo)!;
    entry.total += 1;
    if (d.status === "aprovado") entry.aprovadas += 1;
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, data]) => ({ periodo, ...data }));
}
