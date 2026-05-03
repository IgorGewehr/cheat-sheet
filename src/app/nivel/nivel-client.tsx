"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  Target,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Brain,
  Dumbbell,
  Flame,
  Info,
  Award,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { computeRadarAxes } from "@/components/radar-chart";
import {
  computeLevelAssessment,
  INDUSTRY_LEVEL_LABEL,
  INDUSTRY_LEVEL_COLOR,
  type LevelAssessment,
  type IndustryLevel,
} from "@/lib/level-assessment";
import { computeMatScore } from "@/lib/matematica-stats";
import {
  listSprintsSemIA,
  listDividas,
  listWarGames,
  listSystemDesigns,
  listRFCSessions,
  listMockInterviews,
  listRevisoesCodigo,
  listErrosPersonais,
  listExperienciasSTAR,
  listCardDoDiaProgresso,
  listRetrospectivas,
  listTrilhaProgresso,
  listAllAdocoes,
  listAllDecisoes,
  listComparacoes,
} from "@/lib/db";
import { listSentinelaSessions } from "@/lib/sentinela-db";
import { listDisciplinas } from "@/lib/matematica-db";
import { JOB_TRACKS } from "@/lib/jobs-tracks";
import type { Card } from "@/lib/types";

// ── Dimension icon map ────────────────────────────────────────

const DIMENSION_ICON: Record<string, React.ElementType> = {
  "Governança de IA": ShieldCheck,
  "Conhecimento Técnico": Brain,
  "Julgamento de Engenharia": Target,
  Autonomia: Dumbbell,
  Consistência: Flame,
};

// ── Score → bar color ─────────────────────────────────────────

function barColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-sky-500";
  if (score >= 35) return "bg-amber-500";
  return "bg-red-500";
}

// ── Split "bg-X text-X" color string ─────────────────────────

function splitLevelColor(colorStr: string): { bg: string; text: string } {
  const parts = colorStr.split(" ");
  const bg = parts.find((p) => p.startsWith("bg-")) ?? "bg-sky-500";
  const text = parts.find((p) => p.startsWith("text-")) ?? "text-sky-500";
  return { bg, text };
}

// ── Confidence badge ──────────────────────────────────────────

function ConfidenceBadge({ confianca }: { confianca: LevelAssessment["confianca"] }) {
  const label =
    confianca === "baixa" ? "baixa" : confianca === "media" ? "média" : "alta";
  const cls =
    confianca === "baixa"
      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
      : confianca === "media"
        ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  return (
    <span
      className={clsx(
        "text-xs font-mono px-2 py-0.5 rounded-full border",
        cls,
      )}
    >
      Confiança: {label}
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────

interface NivelClientProps {
  allCards: Card[];
}

// ── Component ─────────────────────────────────────────────────

export function NivelClient({ allCards }: NivelClientProps) {
  const { signedIn } = useAuth();
  const [assessment, setAssessment] = useState<LevelAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!signedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [
          sentinela,
          sprints,
          dividas,
          warGames,
          systemDesigns,
          rfcs,
          interviews,
          revisoes,
          erros,
          star,
          cardProgresso,
          retrospectivas,
          trilha,
          adocoes,
          decisoes,
          comparacoes,
          disciplinas,
        ] = await Promise.all([
          listSentinelaSessions(200),
          listSprintsSemIA(),
          listDividas(),
          listWarGames(),
          listSystemDesigns(),
          listRFCSessions(),
          listMockInterviews(),
          listRevisoesCodigo(),
          listErrosPersonais(),
          listExperienciasSTAR(),
          listCardDoDiaProgresso(),
          listRetrospectivas(),
          listTrilhaProgresso(),
          listAllAdocoes(),
          listAllDecisoes(),
          listComparacoes(),
          listDisciplinas(),
        ]);

        if (cancelled) return;

        const matScore = computeMatScore(disciplinas, trilha, allCards);

        const radarAxes = computeRadarAxes(
          trilha,
          allCards,
          interviews,
          sprints,
          warGames,
          rfcs,
          adocoes,
          decisoes,
          matScore,
        );

        const result = computeLevelAssessment({
          sentinela,
          sprints,
          dividas,
          warGames,
          systemDesigns,
          rfcs,
          interviews,
          revisoes,
          erros,
          star,
          cardProgresso,
          retrospectivas,
          trilha,
          adocoes,
          decisoes,
          comparacoes,
          radarAxes,
        });

        if (!cancelled) {
          setAssessment(result);
          try {
            localStorage.setItem("brain.industryLevel", JSON.stringify({
              nivel: result.nivel,
              score: result.score,
              confianca: result.confianca,
              updatedAt: Date.now(),
            }));
          } catch {}
        }
      } catch {
        // leave assessment null — error state is shown below
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [signedIn, allCards]);

  // ── Loading ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-8 px-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-card-hover rounded-xl h-32"
          />
        ))}
      </div>
    );
  }

  // ── Not signed in ──────────────────────────────────────────

  if (!signedIn) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 flex justify-center">
        <div className="border border-line rounded-2xl bg-card p-8 text-center space-y-3 max-w-sm w-full">
          <Award className="mx-auto text-muted" size={36} />
          <p className="font-semibold text-fg">Faça login para ver seu nível</p>
          <p className="text-sm text-muted">
            A avaliação de nível precisa acessar seus dados de atividade.
          </p>
        </div>
      </div>
    );
  }

  // ── Error (null after loading) ─────────────────────────────

  if (!assessment) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 flex justify-center">
        <div className="border border-line rounded-2xl bg-card p-8 text-center space-y-2 max-w-sm w-full">
          <AlertTriangle className="mx-auto text-amber-400" size={32} />
          <p className="text-sm text-muted">
            Não foi possível calcular a avaliação. Tente recarregar a página.
          </p>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────

  const levelColorStr = INDUSTRY_LEVEL_COLOR[assessment.nivel];
  const { bg: levelBg, text: levelText } = splitLevelColor(levelColorStr);

  const dimensionEntries: Array<{
    key: keyof LevelAssessment["dimensoes"];
    label: string;
  }> = [
    { key: "governancaIA", label: "Governança de IA" },
    { key: "conhecimentoTecnico", label: "Conhecimento Técnico" },
    { key: "julgamento", label: "Julgamento de Engenharia" },
    { key: "autonomia", label: "Autonomia" },
    { key: "consistencia", label: "Consistência" },
  ];

  const compatibleTracks = JOB_TRACKS.filter((t) =>
    assessment.jobsCompativeis.includes(t.slug),
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 px-4">

      {/* ── Seção 1: Header com nível atual ── */}
      <div className="border border-line rounded-2xl bg-card p-6 space-y-4">

        {/* Top row: mono title + confidence badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-mono text-xs text-muted tracking-widest uppercase">
            [AVALIAÇÃO DE NÍVEL]
          </span>
          <ConfidenceBadge confianca={assessment.confianca} />
        </div>

        {/* Level label */}
        <div>
          <p className={clsx("text-5xl font-black leading-none", levelText)}>
            {INDUSTRY_LEVEL_LABEL[assessment.nivel]}
          </p>
          <p className="text-sm text-muted mt-1">nível de indústria estimado</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted font-mono">
            <span>Score geral</span>
            <span>{assessment.score}/100</span>
          </div>
          <div className="w-full bg-card-hover rounded-full h-2 overflow-hidden">
            <div
              className={clsx(
                "transition-all duration-700 h-2 rounded-full",
                levelBg,
              )}
              style={{ width: `${assessment.score}%` }}
            />
          </div>
        </div>

        {/* Separator */}
        <hr className="border-line" />

        {/* Next level gaps */}
        {assessment.proximoNivel && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-fg">
              Para chegar em{" "}
              <span className="font-black">
                {INDUSTRY_LEVEL_LABEL[assessment.proximoNivel.nivel]}
              </span>
              :
            </p>
            <ul className="space-y-1">
              {assessment.proximoNivel.gaps.slice(0, 4).map((gap, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted shrink-0" />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Seção 2: 5 Dimensões ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-muted" />
          <h2 className="text-sm font-semibold text-fg">Dimensões</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dimensionEntries.map(({ key, label }) => {
            const dim = assessment.dimensoes[key];
            const Icon = DIMENSION_ICON[label] ?? Target;
            const color = barColor(dim.score);

            return (
              <div
                key={key}
                className="border border-line rounded-xl bg-card p-4 space-y-3"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-muted shrink-0" />
                    <span className="text-sm font-semibold text-fg">{label}</span>
                  </div>
                  <span className="text-sm font-mono text-muted tabular-nums">
                    {dim.score}
                  </span>
                </div>

                {/* Bar */}
                <div className="w-full bg-card-hover rounded-full h-2 overflow-hidden">
                  <div
                    className={clsx(
                      "transition-all duration-700 h-2 rounded-full",
                      color,
                    )}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>

                {/* Evidences */}
                {dim.evidencias.length > 0 && (
                  <ul className="space-y-0.5">
                    {dim.evidencias.slice(0, 3).map((ev, i) => (
                      <li key={i} className="text-xs text-muted leading-relaxed">
                        · {ev}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Seção 3: Trilhas compatíveis ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-muted" />
          <h2 className="text-sm font-semibold text-fg">
            Trilhas compatíveis com seu nível
          </h2>
        </div>

        {compatibleTracks.length === 0 ? (
          <p className="text-sm text-muted">
            Acumule mais atividade para desbloquear trilhas compatíveis.
          </p>
        ) : (
          <div className="space-y-2">
            {compatibleTracks.map((track) => (
              <Link
                key={track.slug}
                href={`/jobs/${track.slug}`}
                className="flex items-center justify-between gap-3 border border-line rounded-xl bg-card px-4 py-3 hover:bg-card-hover transition-colors group"
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-card-hover text-muted border border-line capitalize">
                      {track.categoria}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-fg truncate">
                    {track.titulo}
                  </p>
                  <p className="text-xs text-muted truncate">{track.papel}</p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted shrink-0 group-hover:text-fg transition-colors"
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Seção 4: Nota de transparência ── */}
      <div className="border border-line rounded-xl bg-card/50 p-4 flex gap-3">
        <Info size={14} className="text-muted shrink-0 mt-0.5" />
        <p className="text-xs text-muted leading-relaxed">
          Esta avaliação é baseada nos seus registros no Brain. Quanto mais você
          usar o app — Sentinela, Sprints sem IA, War Games, etc. — mais precisa
          ela fica. Com poucos dados, a confiança é baixa.
        </p>
      </div>
    </div>
  );
}
