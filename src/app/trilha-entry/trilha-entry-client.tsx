"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui";
import { getEntryTrailProgress, markEntryTrailStep, unmarkEntryTrailStep, listAwakeningSessions } from "@/lib/awakening-db";
import { ENTRY_TRAILS } from "@/lib/awakening-content";
import { isAuthRequiredError } from "@/lib/firebase";
import type { AwakeningTrack, EntryTrailProgress, HunterRankCode } from "@/lib/awakening-types";

const TRACK_LABELS: Record<AwakeningTrack, string> = {
  fullstack: "Full Stack",
  "data-science": "Data Science",
  "ai-engineer": "AI Engineer",
  "ai-agents": "AI Agents",
};

const TIPO_BADGE: Record<string, { label: string; color: string }> = {
  leitura: { label: "Leitura", color: "bg-sky-500/15 text-sky-300" },
  pratica: { label: "Pratica", color: "bg-amber-500/15 text-amber-300" },
  reflexao: { label: "Reflexao", color: "bg-violet-500/15 text-violet-300" },
};

const PRATICA_ROUTES: Record<string, string> = {
  revisor: "/revisor",
  interrogatorio: "/interrogatorio",
};

const RANK_COLORS: Record<HunterRankCode, string> = {
  E: "text-zinc-400",
  D: "text-emerald-400",
  C: "text-sky-400",
  B: "text-violet-400",
  A: "text-amber-400",
  S: "text-cyan-400",
};

export function TrilhaEntryClient() {
  const searchParams = useSearchParams();
  const rawTrack = searchParams.get("track") ?? "fullstack";
  const track: AwakeningTrack = (["fullstack", "data-science", "ai-engineer", "ai-agents"].includes(rawTrack)
    ? rawTrack
    : "fullstack") as AwakeningTrack;

  const [progress, setProgress] = useState<EntryTrailProgress | null>(null);
  const [latestRank, setLatestRank] = useState<HunterRankCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setAuthError(false);

    Promise.all([
      getEntryTrailProgress(track),
      listAwakeningSessions(),
    ])
      .then(([prog, sessions]) => {
        setProgress(prog);
        const trackSessions = sessions.filter((s) => s.track === track);
        if (trackSessions.length > 0) {
          setLatestRank(trackSessions[0].rankAtribuido);
        } else {
          setLatestRank(null);
        }
      })
      .catch((err) => {
        if (isAuthRequiredError(err)) setAuthError(true);
      })
      .finally(() => setLoading(false));
  }, [track]);

  const handleToggleStep = async (stepId: string) => {
    if (toggling) return;
    setToggling(stepId);
    const isComplete = progress?.etapasCompletas.includes(stepId) ?? false;
    try {
      if (isComplete) {
        await unmarkEntryTrailStep(track, stepId);
        setProgress((prev) =>
          prev
            ? { ...prev, etapasCompletas: prev.etapasCompletas.filter((id) => id !== stepId) }
            : prev,
        );
      } else {
        await markEntryTrailStep(track, stepId);
        setProgress((prev) =>
          prev
            ? { ...prev, etapasCompletas: [...prev.etapasCompletas, stepId] }
            : {
                id: track,
                track,
                etapasCompletas: [stepId],
                iniciadoEm: Date.now(),
                ultimaAtualizacao: Date.now(),
              },
        );
      }
    } catch (err) {
      if (isAuthRequiredError(err)) setAuthError(true);
    } finally {
      setToggling(null);
    }
  };

  const trail = ENTRY_TRAILS[track];
  const completedSet = new Set(progress?.etapasCompletas ?? []);
  const completedCount = trail.etapas.filter((e) => completedSet.has(e.id)).length;

  if (authError) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-4">
        <p className="text-xs uppercase tracking-wider font-mono text-cyan-500">[SYSTEM] · TRILHA ENTRY</p>
        <p className="text-sm text-muted">
          Faça login para acessar sua trilha.{" "}
          <Link href="/awakening" className="text-cyan-500 hover:underline">
            Fazer o Awakening primeiro?
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider font-mono text-cyan-500">[SYSTEM] · TRILHA ENTRY</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-fg">{trail.titulo}</h1>
            <p className="text-sm text-muted mt-1">{trail.descricaoCurta}</p>
          </div>
          {latestRank && (
            <div className="flex-shrink-0 text-right">
              <p className="text-xs font-mono text-muted uppercase tracking-wider">Rank</p>
              <p className={`text-2xl font-bold font-mono ${RANK_COLORS[latestRank]}`}>{latestRank}</p>
            </div>
          )}
        </div>

        {!latestRank && !loading && (
          <Link
            href="/awakening"
            className="inline-block text-xs text-cyan-500 hover:underline font-mono"
          >
            Fazer o Awakening para receber seu rank
          </Link>
        )}
      </div>

      {/* track switcher */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TRACK_LABELS) as AwakeningTrack[]).map((t) => (
          <Link
            key={t}
            href={`/trilha-entry?track=${t}`}
            className={`px-3 py-1.5 rounded-md text-xs font-mono border transition ${
              t === track
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                : "border-line bg-card text-muted hover:border-line-strong hover:text-fg"
            }`}
          >
            {TRACK_LABELS[t]}
          </Link>
        ))}
      </div>

      {/* progress bar */}
      {!loading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted font-mono">
            <span>{completedCount} de {trail.etapas.length} etapas</span>
            <span>{Math.round((completedCount / trail.etapas.length) * 100)}%</span>
          </div>
          <div className="w-full h-1 rounded-full bg-line">
            <div
              className="h-1 rounded-full bg-cyan-500 transition-all"
              style={{ width: `${(completedCount / trail.etapas.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* step list */}
      {loading ? (
        <p className="text-sm text-muted font-mono">Carregando...</p>
      ) : (
        <ol className="space-y-3 relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-line" />
          {trail.etapas.map((etapa, idx) => {
            const done = completedSet.has(etapa.id);
            const isToggling = toggling === etapa.id;
            const badgeInfo = TIPO_BADGE[etapa.tipo];

            // resolve link
            let href: string | null = null;
            if (etapa.cardSlug) {
              href = `/biblioteca/${etapa.cardSlug}`;
            } else if (etapa.tipo === "pratica") {
              if (etapa.descricao.toLowerCase().includes("revisor")) href = PRATICA_ROUTES.revisor;
              else if (etapa.descricao.toLowerCase().includes("interrogat")) href = PRATICA_ROUTES.interrogatorio;
            }

            return (
              <li key={etapa.id} className="flex gap-4 relative pl-10">
                {/* step number / check */}
                <button
                  onClick={() => handleToggleStep(etapa.id)}
                  disabled={isToggling}
                  className={`absolute left-0 top-0 w-8 h-8 rounded-full border flex items-center justify-center text-xs font-mono transition flex-shrink-0 ${
                    done
                      ? "bg-cyan-500 border-cyan-500 text-zinc-950"
                      : "bg-card border-line text-muted hover:border-cyan-500/60"
                  }`}
                >
                  {done ? "+" : idx + 1}
                </button>

                <div
                  className={`flex-1 rounded-xl border p-4 space-y-2 transition ${
                    done
                      ? "border-cyan-500/30 bg-cyan-500/5"
                      : "border-line bg-card hover:border-line-strong"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${done ? "line-through text-muted" : "text-fg"}`}>
                      {etapa.titulo}
                    </p>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-medium ${badgeInfo.color}`}>
                      {badgeInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{etapa.descricao}</p>
                  {href && (
                    <Link
                      href={href}
                      className="inline-block text-xs text-cyan-500 hover:underline font-mono mt-1"
                    >
                      Abrir &rarr;
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
