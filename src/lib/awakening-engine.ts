import type { AwakeningQuestion, AwakeningSession, HunterRankCode } from "./awakening-types";
import { AWAKENING_QUESTIONS } from "./awakening-content";

export function pickQuestions(
  track: AwakeningSession["track"],
  count = 10,
): AwakeningQuestion[] {
  const pool = AWAKENING_QUESTIONS.filter((q) => q.track === track);
  const byDifficulty = (d: number) =>
    pool.filter((q) => q.difficulty === d).sort(() => Math.random() - 0.5);

  const selected: AwakeningQuestion[] = [];
  // adaptive: start at difficulty 2, adjust based on correctness
  let currentDifficulty = 2;
  // track which ids are already picked
  const usedIds = new Set<string>();

  // seed with one question at difficulty 2 to start
  const seed = byDifficulty(2).find((q) => !usedIds.has(q.id));
  if (seed) {
    selected.push(seed);
    usedIds.add(seed.id);
  }

  // we pre-pick the adaptive sequence by simulating median performance
  // real adaptation happens in the client; here we return a well-spread set
  const spread = [1, 2, 2, 3, 3, 4, 4, 5, 5, 3];
  for (const targetDiff of spread) {
    if (selected.length >= count) break;
    const clampedDiff = Math.max(1, Math.min(5, targetDiff)) as 1 | 2 | 3 | 4 | 5;
    const candidate = pool
      .filter((q) => q.difficulty === clampedDiff && !usedIds.has(q.id))
      .sort(() => Math.random() - 0.5)[0];
    if (candidate) {
      selected.push(candidate);
      usedIds.add(candidate.id);
    }
  }

  // fill remaining from any difficulty if needed
  if (selected.length < count) {
    const remaining = pool
      .filter((q) => !usedIds.has(q.id))
      .sort(() => Math.random() - 0.5);
    for (const q of remaining) {
      if (selected.length >= count) break;
      selected.push(q);
      usedIds.add(q.id);
    }
  }

  return selected.slice(0, count);
}

// pure adaptive selector used by client: given history of answers, picks next question
export function pickNextQuestion(
  track: AwakeningSession["track"],
  answered: AwakeningSession["respostas"],
  allPicked: AwakeningQuestion[],
): AwakeningQuestion | null {
  const answeredIds = new Set(answered.map((r) => r.questionId));
  const remaining = allPicked.filter((q) => !answeredIds.has(q.id));
  if (remaining.length === 0) return null;

  const lastAnswer = answered[answered.length - 1];
  let targetDifficulty = 2;

  if (lastAnswer) {
    const delta = lastAnswer.correta ? 1 : -1;
    targetDifficulty = Math.max(1, Math.min(5, lastAnswer.difficulty + delta));
  }

  // try exact match first, then nearest difficulty
  const exact = remaining.find((q) => q.difficulty === targetDifficulty);
  if (exact) return exact;

  return remaining.sort(
    (a, b) =>
      Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty),
  )[0];
}

export function assignRank(session: AwakeningSession): HunterRankCode {
  if (session.respostas.length === 0) return "E";
  const correct = session.respostas.filter((r) => r.correta).length;
  const pct = correct / session.respostas.length;

  if (pct >= 0.95) return "S";
  if (pct >= 0.85) return "A";
  if (pct >= 0.70) return "B";
  if (pct >= 0.50) return "C";
  if (pct >= 0.30) return "D";
  return "E";
}

const TOPIC_TAGS: Record<string, string> = {
  "fs-1": "HTTP / Redes",
  "fs-2": "HTTP / Semântica REST",
  "fs-3": "Async / Event Loop",
  "fs-4": "Segurança / Env Vars",
  "fs-5": "SQL / JOINs",
  "fs-6": "Validação / Forms",
  "fs-7": "Git",
  "fs-8": "Testes",
  "fs-9": "Banco / Tipos de Dados",
  "fs-10": "Infra / Docker",
  "fs-11": "Performance / Query Plan",
  "fs-12": "Banco / Soft Delete",
  "ds-1": "Tipos de Dados",
  "ds-2": "Pandas / EDA",
  "ds-3": "Train/Test Split",
  "ds-4": "Data Leakage",
  "ds-5": "Avaliação / Métricas",
  "ds-6": "Overfitting",
  "ds-7": "Quando usar ML",
  "ds-8": "Feature Scaling",
  "ds-9": "Dimensionalidade",
  "ds-10": "Cross-Validation",
  "ds-11": "Precision/Recall",
  "ds-12": "Feature Engineering",
  "ai-eng-1": "Tokens / Tokenização",
  "ai-eng-2": "Prompts / System Prompt",
  "ai-eng-3": "Context Window",
  "ai-eng-4": "Temperature / Parâmetros",
  "ai-eng-5": "Alucinação",
  "ai-eng-6": "RAG",
  "ai-eng-7": "Eval / Antes de Shippar",
  "ai-eng-8": "Custo / Modelos",
  "ai-eng-9": "Prompt Injection",
  "ai-eng-10": "Fine-tuning vs RAG",
  "ai-eng-11": "Retrieval / Hybrid",
  "ai-eng-12": "Eval / LLM-as-Judge",
  "ag-1": "Agentes vs Chat",
  "ag-2": "Function Calling",
  "ag-3": "ReAct Pattern",
  "ag-4": "Memória de Agentes",
  "ag-5": "Falhas / Loop Infinito",
  "ag-6": "Human-in-the-Loop",
  "ag-7": "Observabilidade",
  "ag-8": "Segurança / Acesso a DB",
  "ag-9": "Alucinação em Tool Calls",
  "ag-10": "Multi-Agent Systems",
  "ag-11": "Eval de Agentes",
  "ag-12": "Prompt Injection em Agentes",
};

export function identifyWeakSpots(
  session: AwakeningSession,
  allQuestions: AwakeningQuestion[],
): string[] {
  const missed = session.respostas.filter((r) => !r.correta);
  if (missed.length === 0) return [];

  // count missed per topic tag
  const tagCount: Record<string, number> = {};
  for (const r of missed) {
    const tag = TOPIC_TAGS[r.questionId] ?? r.questionId;
    tagCount[tag] = (tagCount[tag] ?? 0) + 1;
  }

  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
}
