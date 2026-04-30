"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  BookOpen,
  Target,
  Zap,
  Brain,
  BarChart2,
} from "lucide-react";
import { Card } from "@/components/ui";
import {
  listProjects,
  listAllAdocoes,
  listDividas,
  listErrosPersonais,
  listSprintsSemIA,
  listRetrospectivas,
  listCardDoDiaProgresso,
  listTrilhaProgresso,
} from "@/lib/db";
import type {
  Project,
  Adocao,
  DividaConhecimento,
  ErroPersonal,
  SprintSemIA,
  Retrospectiva,
  CardDoDiaProgresso,
  TrilhaProgresso,
  ProjectStatus,
} from "@/lib/types";
import { PROJECT_STATUS_LABEL } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────

interface ProjectMetrics {
  projeto: Project;
  totalAdocoes: number;
  adotados: number;
  dificuldades: number;
  adocaoRate: number;
  dificuldadeRate: number;
  statusScore: number;
  projetoScore: number;
  adocoesDificuldade: Adocao[];
}

interface AprendizadoMetrics {
  streakCardDoDia: number;
  completionRate30d: number;
  dividasAtivas: number;
  dividasPagas30d: number;
  sprintsSemIA30d: number;
  trilhaDominados: number;
  quizAccuracy: number;
  retrospectivaScore: number;
  errosRegistrados: number;
  aprendizadoScore: number;
  lastCardDate: number | null;
}

interface HealthScore {
  overall: number;
  aprendizadoScore: number;
  projetosScore: number;
  trend: "up" | "down" | "stable";
  computedAt: number;
  projectMetrics: ProjectMetrics[];
  aprendizadoMetrics: AprendizadoMetrics;
}

interface Alert {
  id: string;
  message: string;
  href: string;
  urgency: number; // higher = more urgent
}

// ── Score computation ─────────────────────────────────────────

const STATUS_SCORE: Record<ProjectStatus, number> = {
  planejando: 40,
  "em-desenvolvimento": 70,
  concluido: 100,
  manutencao: 85,
};

function computeStatusScore(status?: ProjectStatus): number {
  if (!status) return 50;
  return STATUS_SCORE[status];
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, v));
}

function computeProjectMetrics(
  projeto: Project,
  adocoes: Adocao[],
): ProjectMetrics {
  const projectAdocoes = adocoes.filter((a) => a.projetoId === projeto.id);
  const total = projectAdocoes.length;
  const adotados = projectAdocoes.filter((a) => a.status === "adotado").length;
  const dificuldades = projectAdocoes.filter((a) => a.status === "dificuldade").length;

  const adocaoRate = total > 0 ? (adotados / total) * 100 : 0;
  const dificuldadeRate = total > 0 ? (dificuldades / total) * 100 : 0;
  const statusScore = computeStatusScore(projeto.status);

  // Project score: adocaoRate 60%, statusScore 40%
  // adocaoRate is already 0-100; dificuldadeRate penalizes
  const adocaoComponent = total > 0 ? adocaoRate * 0.6 : 50 * 0.6;
  const statusComponent = statusScore * 0.4;
  const dificuldadePenalty = dificuldadeRate * 0.2; // penalty
  const projetoScore = clamp(adocaoComponent + statusComponent - dificuldadePenalty);

  const adocoesDificuldade = projectAdocoes.filter((a) => a.status === "dificuldade");

  return {
    projeto,
    totalAdocoes: total,
    adotados,
    dificuldades,
    adocaoRate,
    dificuldadeRate,
    statusScore,
    projetoScore,
    adocoesDificuldade,
  };
}

function computeStreakAndRecency(
  cards: CardDoDiaProgresso[],
): { streak: number; lastDate: number | null } {
  if (cards.length === 0) return { streak: 0, lastDate: null };

  // Build a set of dates with completado=true
  const completedDates = new Set<string>(
    cards.filter((c) => c.completado).map((c) => c.data),
  );

  const today = new Date();
  let streak = 0;
  let lastDate: number | null = null;

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (completedDates.has(key)) {
      if (i === 0 || streak > 0) streak++;
      if (lastDate === null) lastDate = d.getTime();
    } else {
      if (i === 0) {
        // today not done yet — check yesterday to start streak
        continue;
      }
      break;
    }
  }

  // find last card date from all cards regardless of completado
  const allDates = cards
    .filter((c) => c.completado)
    .map((c) => new Date(c.data).getTime());
  const realLastDate = allDates.length > 0 ? Math.max(...allDates) : null;

  return { streak, lastDate: realLastDate };
}

function computeAprendizadoMetrics(
  cards: CardDoDiaProgresso[],
  dividas: DividaConhecimento[],
  sprints: SprintSemIA[],
  retrospectivas: Retrospectiva[],
  trilha: TrilhaProgresso[],
  erros: ErroPersonal[],
): AprendizadoMetrics {
  const now = Date.now();
  const ms30d = 30 * 24 * 60 * 60 * 1000;
  const cutoff30d = now - ms30d;

  // Streak and last card
  const { streak, lastDate: lastCardDate } = computeStreakAndRecency(cards);

  // Completion rate last 30 days
  const cards30d = cards.filter((c) => new Date(c.data).getTime() >= cutoff30d);
  const completados30d = cards30d.filter((c) => c.completado).length;
  const completionRate30d = (completados30d / 30) * 100;

  // Quiz accuracy across all records
  const cardsWithQuiz = cards.filter((c) => c.totalQuiz > 0);
  const quizAccuracy =
    cardsWithQuiz.length > 0
      ? (cardsWithQuiz.reduce((sum, c) => sum + c.acertosQuiz / c.totalQuiz, 0) /
          cardsWithQuiz.length) *
        100
      : 0;

  // Dividas
  const dividasAtivas = dividas.filter(
    (d) => d.status === "pendente" || d.status === "em-andamento",
  ).length;
  const dividasPagas30d = dividas.filter(
    (d) =>
      d.status === "paga" &&
      d.resolvidoEm !== undefined &&
      d.resolvidoEm >= cutoff30d,
  ).length;

  // Sprints sem IA in last 30d
  const sprintsSemIA30d = sprints.filter((s) => s.criadoEm >= cutoff30d).length;

  // Trilha dominados
  const trilhaDominados = trilha.filter((t) => t.dominado).length;

  // Retrospectiva score last 30d
  const retros30d = retrospectivas.filter((r) => r.criadoEm >= cutoff30d);
  const retrospectivaScore =
    retros30d.length > 0
      ? (retros30d.reduce((sum, r) => sum + r.scoreAprendizado, 0) / retros30d.length / 5) * 100
      : 0;

  // Erros registrados (more = better self-awareness, cap at 20)
  const errosRegistrados = erros.length;

  // Aprendizado score weights:
  // completionRate30d: 30%
  // quizAccuracy: 25%
  // dividasPagas30d: 15% (normalized, cap at 5 = 100%)
  // retrospectivaScore: 15%
  // sprintsSemIA30d: 15% (cap at 4 = 100%)

  const dividasScore = clamp((dividasPagas30d / 5) * 100);
  const sprintsScore = clamp((sprintsSemIA30d / 4) * 100);

  const aprendizadoScore = clamp(
    completionRate30d * 0.3 +
      quizAccuracy * 0.25 +
      dividasScore * 0.15 +
      retrospectivaScore * 0.15 +
      sprintsScore * 0.15,
  );

  return {
    streakCardDoDia: streak,
    completionRate30d: clamp(completionRate30d),
    dividasAtivas,
    dividasPagas30d,
    sprintsSemIA30d,
    trilhaDominados,
    quizAccuracy: clamp(quizAccuracy),
    retrospectivaScore: clamp(retrospectivaScore),
    errosRegistrados,
    aprendizadoScore,
    lastCardDate,
  };
}

function computeHealthScore(
  projects: Project[],
  adocoes: Adocao[],
  dividas: DividaConhecimento[],
  sprints: SprintSemIA[],
  retrospectivas: Retrospectiva[],
  cards: CardDoDiaProgresso[],
  trilha: TrilhaProgresso[],
  erros: ErroPersonal[],
): HealthScore {
  const projectMetrics = projects.map((p) => computeProjectMetrics(p, adocoes));
  const aprendizadoMetrics = computeAprendizadoMetrics(
    cards,
    dividas,
    sprints,
    retrospectivas,
    trilha,
    erros,
  );

  const avgProjetoScore =
    projectMetrics.length > 0
      ? projectMetrics.reduce((s, m) => s + m.projetoScore, 0) / projectMetrics.length
      : 50;

  const overall = clamp(aprendizadoMetrics.aprendizadoScore * 0.5 + avgProjetoScore * 0.5);

  // Trend: compare current retrospectiva score to last week
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const thisWeekRetros = retrospectivas.filter((r) => r.criadoEm >= now - oneWeek);
  const lastWeekRetros = retrospectivas.filter(
    (r) => r.criadoEm >= now - 2 * oneWeek && r.criadoEm < now - oneWeek,
  );
  const thisWeekAvg =
    thisWeekRetros.length > 0
      ? thisWeekRetros.reduce((s, r) => s + r.scoreAprendizado, 0) / thisWeekRetros.length
      : null;
  const lastWeekAvg =
    lastWeekRetros.length > 0
      ? lastWeekRetros.reduce((s, r) => s + r.scoreAprendizado, 0) / lastWeekRetros.length
      : null;

  let trend: "up" | "down" | "stable" = "stable";
  if (thisWeekAvg !== null && lastWeekAvg !== null) {
    if (thisWeekAvg > lastWeekAvg + 0.2) trend = "up";
    else if (thisWeekAvg < lastWeekAvg - 0.2) trend = "down";
  }

  return {
    overall,
    aprendizadoScore: aprendizadoMetrics.aprendizadoScore,
    projetosScore: avgProjetoScore,
    trend,
    computedAt: Date.now(),
    projectMetrics,
    aprendizadoMetrics,
  };
}

function computeAlerts(
  score: HealthScore,
  dividas: DividaConhecimento[],
  retrospectivas: Retrospectiva[],
): Alert[] {
  const alerts: Alert[] = [];
  const now = Date.now();
  const { aprendizadoMetrics, projectMetrics } = score;

  // Dívidas pendentes há mais de 7 dias
  const ms7d = 7 * 24 * 60 * 60 * 1000;
  const dividasAntigas = dividas.filter(
    (d) =>
      (d.status === "pendente" || d.status === "em-andamento") &&
      now - d.criadoEm > ms7d,
  );
  if (dividasAntigas.length > 0) {
    alerts.push({
      id: "dividas-antigas",
      message: `Você tem ${dividasAntigas.length} dívida${dividasAntigas.length > 1 ? "s" : ""} pendente${dividasAntigas.length > 1 ? "s" : ""} há mais de 7 dias`,
      href: "/divida",
      urgency: 80,
    });
  }

  // Nenhum Sprint sem IA em 30 dias
  if (aprendizadoMetrics.sprintsSemIA30d === 0) {
    alerts.push({
      id: "sem-sprint",
      message: "Não fez nenhum Sprint sem IA nos últimos 30 dias",
      href: "/sprint-sem-ia",
      urgency: 60,
    });
  }

  // Quiz accuracy abaixo de 60%
  if (
    aprendizadoMetrics.quizAccuracy < 60 &&
    aprendizadoMetrics.quizAccuracy > 0
  ) {
    alerts.push({
      id: "quiz-baixo",
      message: `Precisão no quiz em ${Math.round(aprendizadoMetrics.quizAccuracy)}% — abaixo de 60%. Revise os conceitos e refaça os quizzes`,
      href: "/card-do-dia",
      urgency: 70,
    });
  }

  // Sem retrospectiva nas últimas 2 semanas
  const ms14d = 14 * 24 * 60 * 60 * 1000;
  const recentRetro = retrospectivas.find((r) => now - r.criadoEm < ms14d);
  if (!recentRetro) {
    alerts.push({
      id: "sem-retro",
      message: "Sem retrospectiva nas últimas 2 semanas",
      href: "/retrospectiva",
      urgency: 65,
    });
  }

  // Projetos com muitos padrões com dificuldade
  for (const m of projectMetrics) {
    if (m.dificuldades >= 2) {
      alerts.push({
        id: `dificuldade-${m.projeto.id}`,
        message: `${m.dificuldades} padrão${m.dificuldades > 1 ? "s" : ""} com dificuldade no projeto ${m.projeto.nome}`,
        href: "/biblioteca",
        urgency: 55,
      });
    }
  }

  // Streak quebrado
  const lastCardDate = aprendizadoMetrics.lastCardDate;
  if (lastCardDate !== null) {
    const daysSince = Math.floor((now - lastCardDate) / (24 * 60 * 60 * 1000));
    if (daysSince >= 2) {
      alerts.push({
        id: "streak-quebrado",
        message: `Streak quebrado: último Card do Dia foi há ${daysSince} dia${daysSince > 1 ? "s" : ""}`,
        href: "/card-do-dia",
        urgency: 75,
      });
    }
  } else {
    alerts.push({
      id: "sem-card",
      message: "Você ainda não completou nenhum Card do Dia",
      href: "/card-do-dia",
      urgency: 50,
    });
  }

  // Sort by urgency desc, return top 5
  return alerts.sort((a, b) => b.urgency - a.urgency).slice(0, 5);
}

// ── Helpers ───────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function scoreBg(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function scoreLabel(score: number): string {
  if (score >= 75) return "Saudável";
  if (score >= 50) return "Atenção";
  return "Crítico";
}

function metricColor(value: number, thresholds: { good: number; ok: number }): string {
  if (value >= thresholds.good) return "text-emerald-500";
  if (value >= thresholds.ok) return "text-amber-500";
  return "text-red-500";
}

function formatTs(ts: number): string {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Skeleton ──────────────────────────────────────────────────

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div className={clsx("rounded-lg bg-card-hover animate-pulse", className)} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-64" />
        <SkeletonBox className="h-4 w-96" />
      </div>
      {/* Overall score skeleton */}
      <SkeletonBox className="h-40 w-full" />
      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBox key={i} className="h-28" />
        ))}
      </div>
      {/* Projects skeleton */}
      <div className="space-y-3">
        <SkeletonBox className="h-6 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBox key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  colorClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className={clsx("p-1.5 rounded-md", colorClass.replace("text-", "bg-").replace("500", "500/10").replace("emerald-", "emerald-").replace("amber-", "amber-").replace("red-", "red-"))}>
          <Icon className={clsx("w-4 h-4", colorClass)} />
        </div>
        <span className="text-xs text-muted font-medium truncate">{label}</span>
      </div>
      <p className={clsx("text-2xl font-bold leading-none", colorClass)}>{value}</p>
      {sub && <p className="text-xs text-subtle leading-snug">{sub}</p>}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────

function ProgressBar({
  value,
  label,
  colorClass = "bg-amber-500",
}: {
  value: number;
  label?: string;
  colorClass?: string;
}) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-muted">{label}</span>
          <span className="text-xs text-fg font-medium">{Math.round(value)}%</span>
        </div>
      )}
      <div className="h-2 bg-card-hover rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all duration-500", colorClass)}
          style={{ width: `${clamp(value)}%` }}
        />
      </div>
    </div>
  );
}

// ── Project Status Badge ──────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  planejando: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "em-desenvolvimento": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  concluido: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  manutencao: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
};

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <span
      className={clsx(
        "inline-block px-2 py-0.5 rounded text-[11px] font-medium",
        STATUS_BADGE[status] ?? "bg-card-hover text-muted",
      )}
    >
      {PROJECT_STATUS_LABEL[status as ProjectStatus] ?? status}
    </span>
  );
}

// ── Main View ─────────────────────────────────────────────────

export function HealthScoreView() {
  const [score, setScore] = useState<HealthScore | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEmpty, setIsEmpty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [projects, adocoes, dividas, erros, sprints, retros, cards, trilha] =
        await Promise.all([
          listProjects(),
          listAllAdocoes(),
          listDividas(),
          listErrosPersonais(),
          listSprintsSemIA(),
          listRetrospectivas(),
          listCardDoDiaProgresso(),
          listTrilhaProgresso(),
        ]);

      // Empty state check: no meaningful data at all
      const hasData =
        projects.length > 0 ||
        adocoes.length > 0 ||
        cards.length > 0 ||
        retros.length > 0 ||
        sprints.length > 0;

      if (!hasData) {
        setIsEmpty(true);
        setLoading(false);
        return;
      }

      const computed = computeHealthScore(
        projects,
        adocoes,
        dividas,
        sprints,
        retros,
        cards,
        trilha,
        erros,
      );
      const computedAlerts = computeAlerts(computed, dividas, retros);
      setScore(computed);
      setAlerts(computedAlerts);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={load}
          className="mt-4 text-sm text-amber-500 hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (isEmpty || !score) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-fg">Health Score</h1>
          <p className="text-sm text-muted mt-1">
            Saúde de engenharia e aprendizado, medida semana a semana.
          </p>
        </div>
        <Card className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Brain className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <p className="text-fg font-medium">Sem dados ainda</p>
              <p className="text-sm text-muted mt-1 max-w-sm mx-auto leading-relaxed">
                Comece a usar o app e seu health score aparecerá aqui automaticamente.
                Registre projetos, faça Cards do Dia, retrospectivas e sprints sem IA.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              <Link href="/card-do-dia" className="text-xs text-amber-500 hover:underline">
                → Card do Dia
              </Link>
              <Link href="/projetos" className="text-xs text-amber-500 hover:underline">
                → Projetos
              </Link>
              <Link href="/retrospectiva" className="text-xs text-amber-500 hover:underline">
                → Retrospectiva
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const { overall, aprendizadoScore, projetosScore, trend, computedAt, projectMetrics, aprendizadoMetrics } = score;

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-500"
      : trend === "down"
        ? "text-red-500"
        : "text-muted";
  const trendLabel =
    trend === "up" ? "Tendência de alta" : trend === "down" ? "Tendência de queda" : "Estável";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-fg">Health Score</h1>
        <p className="text-sm text-muted mt-1">
          Saúde de engenharia e aprendizado — objetivo, semanal, sem autoengano.
        </p>
      </div>

      {/* Overall Score */}
      <div className="rounded-xl border border-line bg-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Big number */}
          <div className="flex items-end gap-3">
            <span className={clsx("text-7xl font-black leading-none tabular-nums", scoreColor(overall))}>
              {Math.round(overall)}
            </span>
            <div className="pb-2 flex flex-col gap-1">
              <span className={clsx("text-sm font-semibold", scoreColor(overall))}>
                {scoreLabel(overall)}
              </span>
              <div className={clsx("flex items-center gap-1 text-xs", trendColor)}>
                <TrendIcon className="w-3.5 h-3.5" />
                <span>{trendLabel}</span>
              </div>
            </div>
          </div>

          {/* Sub-scores */}
          <div className="flex-1 min-w-0 space-y-3 w-full sm:w-auto">
            <ProgressBar
              value={aprendizadoScore}
              label="Aprendizado pessoal"
              colorClass={scoreBg(aprendizadoScore)}
            />
            <ProgressBar
              value={projetosScore}
              label="Projetos"
              colorClass={scoreBg(projetosScore)}
            />
          </div>

          {/* Updated at */}
          <div className="text-xs text-subtle whitespace-nowrap flex items-center gap-1 sm:self-end">
            <Clock className="w-3 h-3" />
            <span>Atualizado {formatTs(computedAt)}</span>
          </div>
        </div>
      </div>

      {/* Section 1: Aprendizado Pessoal */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-fg uppercase tracking-wide">
            Aprendizado Pessoal
          </h2>
          <span className={clsx("text-sm font-bold", scoreColor(aprendizadoScore))}>
            {Math.round(aprendizadoScore)}/100
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <MetricCard
            icon={Flame}
            label="Streak Card do Dia"
            value={`${aprendizadoMetrics.streakCardDoDia} dia${aprendizadoMetrics.streakCardDoDia !== 1 ? "s" : ""}`}
            sub="consecutivos"
            colorClass={metricColor(aprendizadoMetrics.streakCardDoDia, { good: 7, ok: 3 })}
          />
          <MetricCard
            icon={Target}
            label="Consistência 30d"
            value={`${Math.round(aprendizadoMetrics.completionRate30d)}%`}
            sub="dos dias com card completo"
            colorClass={metricColor(aprendizadoMetrics.completionRate30d, { good: 70, ok: 40 })}
          />
          <MetricCard
            icon={Brain}
            label="Precisão no Quiz"
            value={
              aprendizadoMetrics.quizAccuracy > 0
                ? `${Math.round(aprendizadoMetrics.quizAccuracy)}%`
                : "—"
            }
            sub="média de acertos"
            colorClass={metricColor(aprendizadoMetrics.quizAccuracy, { good: 75, ok: 55 })}
          />
          <MetricCard
            icon={BookOpen}
            label="Dívidas Resolvidas"
            value={`${aprendizadoMetrics.dividasPagas30d}`}
            sub="pagas este mês"
            colorClass={metricColor(aprendizadoMetrics.dividasPagas30d, { good: 3, ok: 1 })}
          />
          <MetricCard
            icon={Zap}
            label="Sprints sem IA"
            value={`${aprendizadoMetrics.sprintsSemIA30d}`}
            sub="este mês"
            colorClass={metricColor(aprendizadoMetrics.sprintsSemIA30d, { good: 2, ok: 1 })}
          />
          <MetricCard
            icon={BarChart2}
            label="Conceitos Dominados"
            value={`${aprendizadoMetrics.trilhaDominados}/65`}
            sub="na trilha sênior"
            colorClass={metricColor(
              (aprendizadoMetrics.trilhaDominados / 65) * 100,
              { good: 60, ok: 30 },
            )}
          />
        </div>

        {/* Sub-score bar */}
        <div className="rounded-lg border border-line bg-card px-4 py-3">
          <ProgressBar
            value={aprendizadoScore}
            label="Score de aprendizado"
            colorClass={scoreBg(aprendizadoScore)}
          />
        </div>
      </section>

      {/* Section 2: Projetos */}
      {projectMetrics.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-fg uppercase tracking-wide">
              Projetos
            </h2>
            <span className={clsx("text-sm font-bold", scoreColor(projetosScore))}>
              {Math.round(projetosScore)}/100
            </span>
          </div>

          <div className="space-y-3">
            {projectMetrics.map((m) => (
              <div
                key={m.projeto.id}
                className="rounded-xl border border-line bg-card p-4 hover:border-line-strong transition"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <Link
                      href={`/projetos/${m.projeto.id}`}
                      className="text-sm font-semibold text-fg hover:text-amber-500 transition truncate"
                    >
                      {m.projeto.nome}
                    </Link>
                    <StatusBadge status={m.projeto.status} />
                  </div>
                  <span
                    className={clsx(
                      "text-sm font-bold shrink-0",
                      scoreColor(m.projetoScore),
                    )}
                  >
                    {Math.round(m.projetoScore)}
                  </span>
                </div>

                {/* Adoption rate bar */}
                <div className="mb-3">
                  <ProgressBar
                    value={m.totalAdocoes > 0 ? m.adocaoRate : 0}
                    label="Taxa de adoção"
                    colorClass={scoreBg(m.adocaoRate)}
                  />
                </div>

                {/* Quick stats */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-muted">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {m.adotados}
                    </span>{" "}
                    adotados
                  </span>
                  {m.dificuldades > 0 && (
                    <span className="text-muted">
                      <span className="font-medium text-red-500">{m.dificuldades}</span> com
                      dificuldade
                    </span>
                  )}
                  <span className="text-subtle">{m.totalAdocoes} padrões no total</span>
                </div>

                {/* Difficulty patterns */}
                {m.adocoesDificuldade.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-line flex flex-wrap gap-1.5">
                    <span className="text-[11px] text-red-500 font-medium mr-1">Risco:</span>
                    {m.adocoesDificuldade.slice(0, 4).map((a) => (
                      <Link
                        key={a.id}
                        href={`/biblioteca/${a.cardSlug}`}
                        className="text-[11px] bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded hover:bg-red-500/20 transition"
                      >
                        {a.cardSlug}
                      </Link>
                    ))}
                    {m.adocoesDificuldade.length > 4 && (
                      <span className="text-[11px] text-subtle">
                        +{m.adocoesDificuldade.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Alertas e Recomendações */}
      {alerts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-fg uppercase tracking-wide mb-4">
            Alertas e Recomendações
          </h2>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href}
                className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-3 hover:border-amber-500/40 hover:bg-amber-500/5 transition group"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-sm text-fg flex-1 leading-snug">{alert.message}</span>
                <span className="text-xs text-amber-500 shrink-0 group-hover:underline">
                  Ver →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {alerts.length === 0 && score && (
        <section>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-sm text-fg">
              Nenhum alerta no momento. Seu health score está em dia.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
