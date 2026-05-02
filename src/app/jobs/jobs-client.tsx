"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { ChevronRight, Briefcase } from "lucide-react";
import { Card } from "@/components/ui";
import { JOB_TRACKS } from "@/lib/jobs-tracks";
import { listAllProgress } from "@/lib/jobs-db";
import type { JobLevel, JobCategory, JobTrackProgress } from "@/lib/jobs-types";

const LEVEL_LABEL: Record<JobLevel, string> = {
  junior: "Junior",
  pleno: "Pleno",
  senior: "Sênior",
  staff: "Staff",
};

const LEVEL_COLOR: Record<JobLevel, string> = {
  junior: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  pleno: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  senior: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  staff: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

const CATEGORY_LABEL: Record<JobCategory, string> = {
  engenharia: "Engenharia",
  dados: "Dados",
  ia: "IA",
  seguranca: "Segurança",
  pesquisa: "Pesquisa",
  govtech: "GovTech",
};

const CATEGORY_COLOR: Record<JobCategory, string> = {
  engenharia: "border-sky-500/40",
  dados: "border-emerald-500/40",
  ia: "border-violet-500/40",
  seguranca: "border-amber-500/40",
  pesquisa: "border-fuchsia-500/40",
  govtech: "border-cyan-500/40",
};

type FilterLevel = "all" | JobLevel;
type FilterCategory = "all" | JobCategory;

export function JobsClient() {
  const [progressMap, setProgressMap] = useState<Map<string, JobTrackProgress>>(new Map());
  const [filterLevel, setFilterLevel] = useState<FilterLevel>("all");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");

  useEffect(() => {
    listAllProgress()
      .then((list) => {
        const map = new Map<string, JobTrackProgress>();
        for (const p of list) map.set(p.trackSlug, p);
        setProgressMap(map);
      })
      .catch(() => {
        // not signed in — show tracks without progress
      });
  }, []);

  const filtered = JOB_TRACKS.filter((t) => {
    if (filterLevel !== "all" && t.nivelAlvo !== filterLevel) return false;
    if (filterCategory !== "all" && t.categoria !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="rounded-xl border border-line bg-card p-5">
        <div className="flex items-center gap-3 mb-2">
          <Briefcase className="w-5 h-5 text-violet-500" />
          <h1 className="text-lg font-bold text-fg">Carreira</h1>
        </div>
        <h1 className="text-2xl font-bold mb-1">Trilhas de Preparação para Vagas</h1>
        <p className="text-sm text-muted max-w-2xl">
          Trilhas curadas que conectam os cards do brain a uma sequência prática. Estudo, prática,
          projeto de portfolio e simulação de entrevista — em 2 a 3 meses, preparado para vaga
          real.
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "junior", "pleno", "senior", "staff"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setFilterLevel(l)}
              className={clsx(
                "px-3 py-1 rounded text-xs font-medium transition border",
                filterLevel === l
                  ? "bg-violet-500/15 border-violet-500/40 text-violet-400"
                  : "border-line bg-card-hover text-muted hover:border-line-strong",
              )}
            >
              {l === "all" ? "Todos os níveis" : LEVEL_LABEL[l]}
            </button>
          ))}
        </div>
        <div className="w-px bg-line hidden sm:block" />
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "engenharia", "govtech", "ia", "seguranca", "dados", "pesquisa"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={clsx(
                "px-3 py-1 rounded text-xs font-medium transition border",
                filterCategory === c
                  ? "bg-violet-500/20 border-violet-500/60 text-violet-400"
                  : "border-line bg-card-hover text-muted hover:border-line-strong",
              )}
            >
              {c === "all" ? "Todas as áreas" : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Track Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((track) => {
          const progress = progressMap.get(track.slug);
          const concluded = progress?.marcosConcluidos.length ?? 0;
          const total = track.marcos.length;
          const pct = total > 0 ? Math.round((concluded / total) * 100) : 0;
          const started = concluded > 0;

          return (
            <Card
              key={track.slug}
              className={clsx(
                "flex flex-col gap-4 border-l-2",
                CATEGORY_COLOR[track.categoria],
              )}
            >
              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-medium text-violet-400">
                    {track.papel}
                  </span>
                  <span
                    className={clsx(
                      "inline-block px-2 py-0.5 rounded text-[11px] font-medium",
                      LEVEL_COLOR[track.nivelAlvo],
                    )}
                  >
                    {LEVEL_LABEL[track.nivelAlvo]}
                  </span>
                </div>
                <h2 className="text-base font-semibold leading-snug">{track.titulo}</h2>
                <p className="text-xs text-muted leading-relaxed line-clamp-2">{track.resumo}</p>
              </div>

              {/* Category + milestones count */}
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="px-2 py-0.5 rounded bg-card-hover">
                  {CATEGORY_LABEL[track.categoria]}
                </span>
                <span>{total} marcos</span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Progresso</span>
                  <span className="font-medium tabular-nums text-fg">
                    {concluded}/{total}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-card-hover overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: pct === 100
                        ? "#8b5cf6"
                        : pct > 50
                        ? "#7c3aed"
                        : "#6d28d9",
                    }}
                  />
                </div>
              </div>

              {/* CTA */}
              <Link
                href={`/jobs/${track.slug}`}
                className={clsx(
                  "mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition",
                  started
                    ? "bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/30"
                    : "bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 text-violet-400",
                )}
              >
                {started ? "Continuar Trilha" : "Iniciar Trilha"}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted py-12 text-sm">
          Nenhuma trilha encontrada para os filtros selecionados.
        </p>
      )}
    </div>
  );
}
