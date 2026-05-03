import type {
  SprintSemIA,
  DividaConhecimento,
  WarGameSession,
  SystemDesignSession,
  RFCSession,
  MockInterviewSession,
  RevisorSession,
  ErroPersonal,
  ExperienciaSTAR,
  CardDoDiaProgresso,
  Retrospectiva,
  TrilhaProgresso,
  Adocao,
  Decisao,
  SavedComparison,
} from "@/lib/types";
import type { SentinelaSession } from "@/lib/sentinela-types";
import type { RadarAxis } from "@/components/radar-chart";

// ── Exported types ────────────────────────────────────────────

export type IndustryLevel = "entry" | "junior" | "pleno" | "senior" | "staff";

export const INDUSTRY_LEVEL_LABEL: Record<IndustryLevel, string> = {
  entry: "Entry Level",
  junior: "Junior",
  pleno: "Pleno",
  senior: "Sênior",
  staff: "Staff",
};

export const INDUSTRY_LEVEL_COLOR: Record<IndustryLevel, string> = {
  entry: "bg-amber-500 text-amber-500",
  junior: "bg-yellow-500 text-yellow-500",
  pleno: "bg-sky-500 text-sky-500",
  senior: "bg-violet-500 text-violet-500",
  staff: "bg-emerald-500 text-emerald-500",
};

export interface DimensionResult {
  score: number;
  label: string;
  evidencias: string[];
  dataPoints: number;
}

export interface LevelAssessment {
  nivel: IndustryLevel;
  score: number;
  confianca: "baixa" | "media" | "alta";
  dimensoes: {
    governancaIA: DimensionResult;
    conhecimentoTecnico: DimensionResult;
    julgamento: DimensionResult;
    autonomia: DimensionResult;
    consistencia: DimensionResult;
  };
  proximoNivel: {
    nivel: IndustryLevel;
    gaps: string[];
  } | null;
  jobsCompativeis: string[];
}

export interface LevelAssessmentInput {
  sentinela: SentinelaSession[];
  sprints: SprintSemIA[];
  dividas: DividaConhecimento[];
  warGames: WarGameSession[];
  systemDesigns: SystemDesignSession[];
  rfcs: RFCSession[];
  interviews: MockInterviewSession[];
  revisoes: RevisorSession[];
  erros: ErroPersonal[];
  star: ExperienciaSTAR[];
  cardProgresso: CardDoDiaProgresso[];
  retrospectivas: Retrospectiva[];
  trilha: TrilhaProgresso[];
  adocoes: Adocao[];
  decisoes: Decisao[];
  comparacoes: SavedComparison[];
  radarAxes: RadarAxis[];
}

// ── Helpers ───────────────────────────────────────────────────

function cap(value: number, max: number): number {
  return Math.min(value, max);
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function scoreToLevel(score: number): IndustryLevel {
  if (score < 20) return "entry";
  if (score < 40) return "junior";
  if (score < 60) return "pleno";
  if (score < 75) return "senior";
  return "staff";
}

function nextLevel(level: IndustryLevel): IndustryLevel | null {
  const order: IndustryLevel[] = ["entry", "junior", "pleno", "senior", "staff"];
  const idx = order.indexOf(level);
  if (idx === -1 || idx === order.length - 1) return null;
  return order[idx + 1];
}

function computeStreak(cardProgresso: CardDoDiaProgresso[], today: string): number {
  const completed = new Set(
    cardProgresso.filter((c) => c.completado).map((c) => c.data)
  );
  let streak = 0;
  const date = new Date(today + "T00:00:00");
  for (let i = 0; i < 365; i++) {
    const key = date.toISOString().slice(0, 10);
    if (!completed.has(key)) break;
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

function isWithinDays(timestamp: number, days: number, now: number): boolean {
  return now - timestamp <= days * 24 * 60 * 60 * 1000;
}

// ── Dimension calculators ─────────────────────────────────────

function computeGovernancaIA(
  sentinela: SentinelaSession[],
  sprints: SprintSemIA[],
  dividas: DividaConhecimento[]
): DimensionResult {
  const evidencias: string[] = [];
  let score = 0;

  // Sentinela signal
  const recent = sentinela.slice(-50);
  const total = recent.length;
  const passCount = recent.filter((s) => s.veredito === "PASS").length;
  const warnCount = recent.filter((s) => s.veredito === "WARN").length;
  const denyCount = recent.filter((s) => s.veredito === "DENY").length;

  if (total === 0) {
    evidencias.push("Nenhuma auditoria Sentinela registrada ainda");
  } else {
    const passRate = passCount / total;
    let sentinelaScore: number;
    if (passRate >= 0.8) {
      sentinelaScore = 60;
    } else if (passRate >= 0.5) {
      sentinelaScore = 30 + ((passRate - 0.5) / 0.3) * 30;
    } else {
      sentinelaScore = (passRate / 0.5) * 30;
    }
    const penalty = denyCount * 3;
    sentinelaScore = Math.max(0, sentinelaScore - penalty);
    score += sentinelaScore;
    evidencias.push(
      `${total} auditorias Sentinela — ${passCount} PASS, ${warnCount} WARN, ${denyCount} DENY`
    );
  }

  // Sprints signal
  const sprintsDone = sprints.filter((s) => s.status === "concluido").length;
  let sprintScore = 0;
  if (sprintsDone >= 5) sprintScore = 30;
  else if (sprintsDone >= 3) sprintScore = 20;
  else if (sprintsDone >= 1) sprintScore = 12;
  score += sprintScore;
  if (sprintsDone > 0) {
    evidencias.push(`${sprintsDone} sprint${sprintsDone > 1 ? "s" : ""} implementado${sprintsDone > 1 ? "s" : ""} sem IA`);
  }

  // Dívidas signal
  const dividaTotal = dividas.length;
  const dividasPagas = dividas.filter((d) => d.status === "paga").length;
  const dividaScore = dividaTotal > 0 ? (dividasPagas / dividaTotal) * 10 : 0;
  score += dividaScore;
  if (dividaTotal > 0) {
    evidencias.push(`${dividasPagas}/${dividaTotal} dívidas de conhecimento resolvidas`);
  }

  return {
    score: Math.min(100, Math.round(score)),
    label: "Governança de IA",
    evidencias,
    dataPoints: sentinela.length + sprints.length,
  };
}

function computeConhecimentoTecnico(
  radarAxes: RadarAxis[],
  trilha: TrilhaProgresso[],
  adocoes: Adocao[],
  decisoes: Decisao[]
): DimensionResult {
  const evidencias: string[] = [];
  const EXCLUDED_LABELS = ["Entrevista", "Autonomia"];

  // Radar axes (technical only)
  const techAxes = radarAxes.filter((a) => !EXCLUDED_LABELS.includes(a.label));
  const radarAvg = techAxes.length > 0 ? avg(techAxes.map((a) => a.value)) : 0;
  const radarScore = (radarAvg / 100) * 50;
  if (techAxes.length > 0) {
    evidencias.push(`Radar técnico médio: ${Math.round(radarAvg)}%`);
  }

  // Trilha dominados
  const dominados = trilha.filter((t) => t.dominado).length;
  const trilhaScore = cap(dominados * 1.5, 25);
  if (dominados > 0) {
    evidencias.push(`${dominados} conceito${dominados > 1 ? "s" : ""} dominado${dominados > 1 ? "s" : ""} na trilha`);
  }

  // Adoções
  const adotados = adocoes.filter((a) => a.status === "adotado").length;
  const adocaoScore = cap(adotados * 2, 25);
  if (adotados > 0) {
    evidencias.push(`${adotados} padrão${adotados > 1 ? "ões" : ""} adotado${adotados > 1 ? "s" : ""} em projetos reais`);
  }

  // Decisões aceitas
  const decisoesAceitas = decisoes.filter((d) => d.status === "aceita").length;
  const decisaoScore = cap(decisoesAceitas * 2, 10);
  if (decisoesAceitas > 0) {
    evidencias.push(`${decisoesAceitas} decisão${decisoesAceitas > 1 ? "ões" : ""} arquitetural${decisoesAceitas > 1 ? "is" : ""} registrada${decisoesAceitas > 1 ? "s" : ""}`);
  }

  const rawScore = radarScore + trilhaScore + adocaoScore + decisaoScore;
  // Max possible: 50+25+25+10=110, normalize to 0-100
  const normalized = Math.min(100, (rawScore / 110) * 100);

  return {
    score: Math.round(normalized),
    label: "Conhecimento Técnico",
    evidencias,
    dataPoints: trilha.length + adocoes.length + decisoes.length,
  };
}

function computeJulgamento(
  warGames: WarGameSession[],
  systemDesigns: SystemDesignSession[],
  rfcs: RFCSession[],
  interviews: MockInterviewSession[],
  revisoes: RevisorSession[],
  decisoes: Decisao[],
  comparacoes: SavedComparison[]
): DimensionResult {
  const treino_ev: string[] = [];
  const trabalho_ev: string[] = [];

  // ── Trilha de TREINO ──────────────────────────────────────
  type WS = { score: number; weight: number };
  const signals: WS[] = [];

  const warScores = warGames
    .map((w) => w.scoreDecisao)
    .filter((s): s is number => s !== undefined);
  if (warScores.length > 0) {
    signals.push({ score: avg(warScores), weight: 20 });
    treino_ev.push(`${warGames.length} war game${warGames.length > 1 ? "s" : ""} — média ${Math.round(avg(warScores))}/100`);
  }

  const sdAvaliados = systemDesigns.filter((s) => s.status === "avaliado");
  const sdScores = sdAvaliados.map((s) => s.scoreGeral).filter((s): s is number => s !== undefined);
  if (sdScores.length > 0) {
    signals.push({ score: avg(sdScores), weight: 25 });
    treino_ev.push(`${sdAvaliados.length} system design${sdAvaliados.length > 1 ? "s" : ""} avaliado${sdAvaliados.length > 1 ? "s" : ""} — média ${Math.round(avg(sdScores))}/100`);
  }

  const rfcsRevisados = rfcs.filter((r) => r.status === "revisado");
  const rfcScores = rfcsRevisados
    .map((r) => {
      const parts = [r.scoreClarez, r.scoreCompletude, r.scoreRaciocinio].filter((v): v is number => v !== undefined);
      return parts.length > 0 ? avg(parts) : undefined;
    })
    .filter((s): s is number => s !== undefined);
  if (rfcScores.length > 0) {
    signals.push({ score: avg(rfcScores), weight: 25 });
    treino_ev.push(`${rfcsRevisados.length} RFC${rfcsRevisados.length > 1 ? "s" : ""} revisado${rfcsRevisados.length > 1 ? "s" : ""} — média ${Math.round(avg(rfcScores))}/100`);
  }

  const interviewsDone = interviews.filter((i) => i.status === "concluido");
  const interviewScores = interviewsDone.map((i) => i.scoreGeral).filter((s): s is number => s !== undefined);
  if (interviewScores.length > 0) {
    signals.push({ score: avg(interviewScores), weight: 20 });
    treino_ev.push(`${interviewsDone.length} entrevista${interviewsDone.length > 1 ? "s" : ""} concluída${interviewsDone.length > 1 ? "s" : ""} — média ${Math.round(avg(interviewScores))}/100`);
  }

  const revisoesAvaliadas = revisoes.filter((r) => r.status === "avaliado");
  const revisaoScores = revisoesAvaliadas.map((r) => r.scoreRevisao).filter((s): s is number => s !== undefined);
  if (revisaoScores.length > 0) {
    signals.push({ score: avg(revisaoScores), weight: 10 });
    treino_ev.push(`${revisoesAvaliadas.length} revisão${revisoesAvaliadas.length > 1 ? "ões" : ""} de código avaliada${revisoesAvaliadas.length > 1 ? "s" : ""}`);
  }

  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const treinoScore = signals.length > 0
    ? signals.reduce((sum, s) => sum + (s.score * s.weight) / totalWeight, 0)
    : -1; // -1 = sem dados

  // ── Trilha de TRABALHO ────────────────────────────────────
  // Decisões arquiteturais reais têm mais peso que qualquer simulação.
  const decisoesAceitas = decisoes.filter((d) => d.status === "aceita").length;
  const decisoesScore = cap(decisoesAceitas * 8, 50);
  if (decisoesAceitas > 0) {
    trabalho_ev.push(`${decisoesAceitas} decisão${decisoesAceitas > 1 ? "ões" : ""} arquitetural${decisoesAceitas > 1 ? "is" : ""} registrada${decisoesAceitas > 1 ? "s" : ""}`);
  }

  const comparacoesScore = cap(comparacoes.length * 6, 30);
  if (comparacoes.length > 0) {
    trabalho_ev.push(`${comparacoes.length} comparação${comparacoes.length > 1 ? "ões" : ""} de arquitetura avaliada${comparacoes.length > 1 ? "s" : ""}`);
  }

  // Revisões também são sinal de trabalho
  const revisaoTrabalhoScore = revisaoScores.length > 0 ? avg(revisaoScores) * 0.20 : 0;

  const trabalhoRaw = decisoesScore + comparacoesScore + revisaoTrabalhoScore;
  const trabalhoScore = trabalhoRaw > 0 ? Math.min(100, trabalhoRaw) : -1;

  // ── Combinar: usa o melhor dos dois caminhos ──────────────
  const hasTreino = treinoScore >= 0;
  const hasTrab = trabalhoScore >= 0;

  let finalScore: number;
  if (hasTreino && hasTrab) {
    finalScore = Math.max(treinoScore, trabalhoScore);
  } else if (hasTreino) {
    finalScore = treinoScore;
  } else if (hasTrab) {
    finalScore = trabalhoScore;
  } else {
    return {
      score: 0,
      label: "Julgamento de Engenharia",
      evidencias: ["Nenhum sinal de julgamento registrado ainda — use Sentinela, registre decisões arquiteturais ou complete war games"],
      dataPoints: 0,
    };
  }

  const evidencias = [...trabalho_ev, ...treino_ev];

  return {
    score: Math.round(finalScore),
    label: "Julgamento de Engenharia",
    evidencias,
    dataPoints: warGames.length + systemDesigns.length + rfcs.length + interviews.length + revisoes.length + decisoesAceitas + comparacoes.length,
  };
}

function computeAutonomia(
  sprints: SprintSemIA[],
  interviews: MockInterviewSession[],
  star: ExperienciaSTAR[],
  erros: ErroPersonal[],
  decisoes: Decisao[],
  comparacoes: SavedComparison[]
): DimensionResult {
  const evidencias: string[] = [];

  // Sinais de treino
  const sprintsDone = sprints.filter((s) => s.status === "concluido").length;
  const sprintScore = cap(sprintsDone * 12, 35);
  if (sprintsDone > 0) {
    evidencias.push(`${sprintsDone} sprint${sprintsDone > 1 ? "s" : ""} realizado${sprintsDone > 1 ? "s" : ""} sem assistência de IA`);
  }

  const interviewsDone = interviews.filter((i) => i.status === "concluido").length;
  const interviewScore = cap(interviewsDone * 8, 25);
  if (interviewsDone > 0) {
    evidencias.push(`${interviewsDone} entrevista${interviewsDone > 1 ? "s" : ""} mock concluída${interviewsDone > 1 ? "s" : ""}`);
  }

  const starCount = star.length;
  const starScore = cap(starCount * 6, 15);
  if (starCount > 0) {
    evidencias.push(`${starCount} experiência${starCount > 1 ? "s" : ""} STAR documentada${starCount > 1 ? "s" : ""}`);
  }

  const errosAnalisados = erros.filter((e) => e.causaRaiz.trim().length > 0).length;
  const erroScore = cap(errosAnalisados * 4, 10);
  if (errosAnalisados > 0) {
    evidencias.push(`${errosAnalisados} erro${errosAnalisados > 1 ? "s" : ""} analisado${errosAnalisados > 1 ? "s" : ""} com causa raiz`);
  }

  // Sinais de trabalho real — autonomia = tomar decisões e pesquisar independente
  const decisoesAceitas = decisoes.filter((d) => d.status === "aceita").length;
  const decisoesAutoScore = cap(decisoesAceitas * 4, 15);
  if (decisoesAceitas > 0) {
    evidencias.push(`${decisoesAceitas} decisão${decisoesAceitas > 1 ? "ões" : ""} arquitetural${decisoesAceitas > 1 ? "is" : ""} tomada${decisoesAceitas > 1 ? "s" : ""} autonomamente`);
  }

  const comparacoesScore = cap(comparacoes.length * 3, 10);
  if (comparacoes.length > 0) {
    evidencias.push(`${comparacoes.length} comparação${comparacoes.length > 1 ? "ões" : ""} de tecnologia avaliada${comparacoes.length > 1 ? "s" : ""} de forma independente`);
  }

  const score = Math.min(100, sprintScore + interviewScore + starScore + erroScore + decisoesAutoScore + comparacoesScore);

  if (evidencias.length === 0) {
    evidencias.push("Nenhum sinal de autonomia registrado — faça sprints sem IA, registre decisões arquiteturais ou documente experiências STAR");
  }

  return {
    score: Math.round(score),
    label: "Autonomia",
    evidencias,
    dataPoints: sprints.length + interviews.length + star.length + erros.length + decisoesAceitas + comparacoes.length,
  };
}

function computeConsistencia(
  cardProgresso: CardDoDiaProgresso[],
  retrospectivas: Retrospectiva[],
  recentWorkTimestamps: number[], // criadoEm/data de qualquer feature de trabalho (últimos registros)
  today: string,
  now: number
): DimensionResult {
  const evidencias: string[] = [];
  const DAY14 = 14 * 24 * 60 * 60 * 1000;
  const DAY7  =  7 * 24 * 60 * 60 * 1000;

  // Streak de estudo (card-do-dia) — bônus mas não dominante
  const streak = computeStreak(cardProgresso, today);
  const streakScore = cap(streak * 2, 25);
  if (streak > 0) evidencias.push(`Streak de estudo: ${streak} dia${streak !== 1 ? "s" : ""}`);

  // Retrospectivas nos últimos 30 dias
  const retroLast30 = retrospectivas.filter((r) => isWithinDays(r.criadoEm, 30, now)).length;
  const retroScore = cap(retroLast30 * 20, 35);
  if (retroLast30 > 0) {
    evidencias.push(`${retroLast30} retrospectiva${retroLast30 !== 1 ? "s" : ""} nos últimos 30 dias`);
  }

  // Atividade recente — qualquer feature: estudo, treino OU trabalho
  const allTimestamps = [
    ...cardProgresso.filter((c) => c.completado).map((c) => c.criadoEm),
    ...retrospectivas.map((r) => r.criadoEm),
    ...recentWorkTimestamps,
  ];
  const recentActivity14 = allTimestamps.some((t) => now - t <= DAY14);
  const recentActivity7  = allTimestamps.some((t) => now - t <= DAY7);
  const activityScore = recentActivity7 ? 30 : recentActivity14 ? 20 : 0;

  if (recentActivity7) evidencias.push("Ativo nos últimos 7 dias");
  else if (recentActivity14) evidencias.push("Ativo nos últimos 14 dias");
  else evidencias.push("Sem atividade registrada nos últimos 14 dias");

  const score = Math.min(100, streakScore + retroScore + activityScore);

  return {
    score: Math.round(score),
    label: "Consistência",
    evidencias,
    dataPoints: cardProgresso.filter((c) => c.completado).length + retrospectivas.length + recentWorkTimestamps.length,
  };
}

// ── Gap generation ────────────────────────────────────────────

function buildGaps(
  govScore: number,
  techScore: number,
  judgmentScore: number,
  autonomyScore: number,
  consistencyScore: number,
  currentLevel: IndustryLevel,
  next: IndustryLevel
): string[] {
  const gaps: string[] = [];

  // Thresholds for next level (minimum expected scores per dimension)
  const thresholds: Record<IndustryLevel, Record<string, number>> = {
    entry:   { gov: 0,  tech: 0,  judgment: 0,  autonomy: 0,  consistency: 0  },
    junior:  { gov: 20, tech: 20, judgment: 10, autonomy: 15, consistency: 20 },
    pleno:   { gov: 40, tech: 40, judgment: 35, autonomy: 35, consistency: 35 },
    senior:  { gov: 60, tech: 60, judgment: 55, autonomy: 50, consistency: 50 },
    staff:   { gov: 75, tech: 75, judgment: 70, autonomy: 65, consistency: 60 },
  };

  const t = thresholds[next];

  if (govScore < t.gov) {
    if (govScore < 20) {
      gaps.push("Registre mais auditorias Sentinela antes de aceitar código IA");
    } else {
      gaps.push("Reduza a taxa de DENY no Sentinela — revise o código antes de aceitar");
    }
  }
  if (techScore < t.tech) {
    gaps.push("Domine mais conceitos na Trilha e registre adoções reais");
  }
  if (judgmentScore < t.judgment) {
    gaps.push("Registre decisões arquiteturais reais, faça comparações de tecnologia ou complete war games e system designs");
  }
  if (autonomyScore < t.autonomy) {
    gaps.push("Realize sprints sem IA para demonstrar independência");
  }
  if (consistencyScore < t.consistency) {
    gaps.push("Use o app regularmente (qualquer modo) e faça retrospectivas semanais");
  }

  // Always provide at least one gap if moving toward a new level
  if (gaps.length === 0) {
    gaps.push(`Continue acumulando sinais para consolidar o nível ${INDUSTRY_LEVEL_LABEL[next]}`);
  }

  return gaps;
}

// ── Jobs compatíveis ──────────────────────────────────────────

function resolveJobsCompativeis(level: IndustryLevel): string[] {
  switch (level) {
    case "entry":
    case "junior":
      return ["fullstack-pleno"];
    case "pleno":
      return [
        "backend-senior",
        "frontend-senior",
        "ai-engineer-llm",
        "data-scientist",
        "govtech-engineer",
      ];
    case "senior":
      return [
        "ai-agent-engineer",
        "devsecops-security",
        "cybersecurity-fundamentals",
        "quant-ai-researcher",
      ];
    case "staff":
      return ["ai-agent-engineer", "quant-ai-researcher"];
  }
}

// ── Main export ───────────────────────────────────────────────

export function computeLevelAssessment(input: LevelAssessmentInput): LevelAssessment {
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);

  const governancaIA = computeGovernancaIA(input.sentinela, input.sprints, input.dividas);
  const conhecimentoTecnico = computeConhecimentoTecnico(
    input.radarAxes,
    input.trilha,
    input.adocoes,
    input.decisoes
  );
  const julgamento = computeJulgamento(
    input.warGames,
    input.systemDesigns,
    input.rfcs,
    input.interviews,
    input.revisoes,
    input.decisoes,
    input.comparacoes
  );
  const autonomia = computeAutonomia(
    input.sprints,
    input.interviews,
    input.star,
    input.erros,
    input.decisoes,
    input.comparacoes
  );

  // Timestamps de atividade de trabalho recente (qualquer signal de trabalho)
  const recentWorkTs: number[] = [
    ...input.sentinela.map((s) => s.criadoEm),
    ...input.adocoes.map((a) => a.dataDecisao),
    ...input.decisoes.map((d) => d.data),
    ...input.warGames.map((w) => w.criadoEm),
    ...input.systemDesigns.map((s) => s.criadoEm),
    ...input.rfcs.map((r) => r.criadoEm),
    ...input.interviews.map((i) => i.criadoEm),
    ...input.revisoes.map((r) => r.criadoEm),
    ...input.comparacoes.map((c) => c.criadoEm),
    ...input.erros.map((e) => e.criadoEm),
  ];

  const consistencia = computeConsistencia(
    input.cardProgresso,
    input.retrospectivas,
    recentWorkTs,
    today,
    now
  );

  // Weighted overall score
  const overallScore =
    governancaIA.score * 0.25 +
    conhecimentoTecnico.score * 0.30 +
    julgamento.score * 0.25 +
    autonomia.score * 0.15 +
    consistencia.score * 0.05;

  const nivel = scoreToLevel(overallScore);
  const next = nextLevel(nivel);

  // Confidence
  const totalDataPoints =
    input.sentinela.length +
    input.sprints.length +
    input.warGames.length +
    input.systemDesigns.length +
    input.rfcs.length +
    input.interviews.length +
    input.cardProgresso.filter((c) => c.completado).length +
    input.retrospectivas.length +
    input.decisoes.filter((d) => d.status === "aceita").length +
    input.comparacoes.length +
    input.adocoes.filter((a) => a.status === "adotado").length;

  const confianca: "baixa" | "media" | "alta" =
    totalDataPoints < 5 ? "baixa" : totalDataPoints < 25 ? "media" : "alta";

  // Próximo nível e gaps
  const proximoNivel =
    next !== null
      ? {
          nivel: next,
          gaps: buildGaps(
            governancaIA.score,
            conhecimentoTecnico.score,
            julgamento.score,
            autonomia.score,
            consistencia.score,
            nivel,
            next
          ),
        }
      : null;

  return {
    nivel,
    score: Math.round(overallScore),
    confianca,
    dimensoes: {
      governancaIA,
      conhecimentoTecnico,
      julgamento,
      autonomia,
      consistencia,
    },
    proximoNivel,
    jobsCompativeis: resolveJobsCompativeis(nivel),
  };
}
