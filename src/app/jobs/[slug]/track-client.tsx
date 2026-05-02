"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  BookOpen,
  Hammer,
  FolderGit2,
  MessageSquare,
  ExternalLink,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
} from "lucide-react";
import { Card, Button } from "@/components/ui";
import { getProgress, markMilestone, unmarkMilestone } from "@/lib/jobs-db";
import type { JobTrack, JobLevel, JobTrackMilestone } from "@/lib/jobs-types";

// ─── Config ──────────────────────────────────────────────────────────────────

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

type MilestoneType = JobTrackMilestone["tipo"];

const TIPO_LABEL: Record<MilestoneType, string> = {
  estudo: "Estudo",
  pratica: "Prática",
  projeto: "Projeto",
  entrevista: "Entrevista",
};

const TIPO_COLOR: Record<MilestoneType, string> = {
  estudo: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  pratica: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  projeto: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300",
  entrevista: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
};

const TIPO_ICON: Record<MilestoneType, React.ReactNode> = {
  estudo: <BookOpen className="w-4 h-4" />,
  pratica: <Hammer className="w-4 h-4" />,
  projeto: <FolderGit2 className="w-4 h-4" />,
  entrevista: <MessageSquare className="w-4 h-4" />,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMilestoneHref(marco: JobTrackMilestone): string | null {
  if (marco.cardSlug) return `/biblioteca/${marco.cardSlug}`;
  if (marco.routeHref) return marco.routeHref;
  return null;
}

// ─── Components ──────────────────────────────────────────────────────────────

function MilestoneRow({
  marco,
  index,
  concluded,
  onToggle,
}: {
  marco: JobTrackMilestone;
  index: number;
  concluded: boolean;
  onToggle: (id: string) => void;
}) {
  const href = getMilestoneHref(marco);

  return (
    <div
      className={clsx(
        "flex gap-4 p-4 rounded-lg border transition",
        concluded
          ? "border-line bg-card opacity-60"
          : "border-line bg-card hover:border-line-strong",
      )}
    >
      {/* Step number + check */}
      <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
        <span className="text-[11px] text-muted tabular-nums w-5 text-center">{index + 1}</span>
        <button
          onClick={() => onToggle(marco.id)}
          className={clsx(
            "w-5 h-5 rounded border-2 flex items-center justify-center transition shrink-0",
            concluded
              ? "bg-[var(--hunter-cyan)] border-[var(--hunter-cyan)]"
              : "border-line-strong hover:border-[var(--hunter-cyan)]",
          )}
          aria-label={concluded ? "Desmarcar como concluído" : "Marcar como concluído"}
        >
          {concluded && <Check className="w-3 h-3 text-zinc-950" strokeWidth={3} />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium", TIPO_COLOR[marco.tipo])}>
              {TIPO_ICON[marco.tipo]}
              {TIPO_LABEL[marco.tipo]}
            </span>
            <h3 className="text-sm font-semibold">{marco.titulo}</h3>
          </div>
          {marco.estimateHours && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted shrink-0">
              <Clock className="w-3 h-3" />
              {marco.estimateHours}h
            </span>
          )}
        </div>

        <p className="text-xs text-muted leading-relaxed">{marco.descricao}</p>

        {/* Links */}
        <div className="flex flex-wrap gap-2">
          {href && (
            <Link
              href={href}
              className="inline-flex items-center gap-1 text-xs text-[var(--hunter-cyan)] hover:underline"
            >
              {marco.cardSlug ? "Ver card" : "Abrir ferramenta"}
              <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
            </Link>
          )}
          {marco.externalUrl && (
            <a
              href={marco.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--hunter-cyan)] hover:underline"
            >
              Link externo
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ExpandableQuestion({ pergunta }: { pergunta: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-line rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-card-hover transition"
      >
        <span className="font-medium">{pergunta}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3 text-xs text-muted leading-relaxed border-t border-line pt-3">
          Responda usando o{" "}
          <Link href="/interrogatorio" className="text-[var(--hunter-cyan)] hover:underline">
            Interrogatório Socrático
          </Link>{" "}
          ou simule no{" "}
          <Link href="/mock-interview" className="text-[var(--hunter-cyan)] hover:underline">
            Mock Interview
          </Link>
          .
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TrackClient({ track }: { track: JobTrack }) {
  const [concluded, setConcluded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    getProgress(track.slug)
      .then((p) => {
        if (p) setConcluded(new Set(p.marcosConcluidos));
      })
      .catch(() => {});
  }, [track.slug]);

  const handleToggle = useCallback(
    async (milestoneId: string) => {
      const wasDone = concluded.has(milestoneId);
      // Optimistic update
      setConcluded((prev) => {
        const next = new Set(prev);
        if (wasDone) next.delete(milestoneId);
        else next.add(milestoneId);
        return next;
      });
      setSaving(milestoneId);
      try {
        if (wasDone) {
          await unmarkMilestone(track.slug, milestoneId);
        } else {
          await markMilestone(track.slug, milestoneId);
        }
      } catch {
        // Rollback on error
        setConcluded((prev) => {
          const next = new Set(prev);
          if (wasDone) next.add(milestoneId);
          else next.delete(milestoneId);
          return next;
        });
      } finally {
        setSaving(null);
      }
    },
    [concluded, track.slug],
  );

  const total = track.marcos.length;
  const done = concluded.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Todas as trilhas
      </Link>

      {/* ── Header ── */}
      <div className="hunter-window p-5 hunter-glow-cyan space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="hunter-text-system text-[10px] font-semibold"
            style={{ color: "var(--hunter-cyan)" }}
          >
            [SYSTEM] · {track.papel.toUpperCase()}
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
        <h1 className="text-2xl font-bold">{track.titulo}</h1>
        <p className="text-sm text-muted leading-relaxed max-w-2xl">{track.resumo}</p>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted">Progresso</span>
            <span className="font-medium tabular-nums">
              {done}/{total} marcos ({pct}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-card-hover overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background:
                  pct === 100
                    ? "var(--hunter-cyan)"
                    : pct > 50
                    ? "var(--hunter-violet)"
                    : "var(--hunter-fuchsia)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Pre-requisites ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Pré-requisitos
        </h2>
        <Card>
          <ul className="space-y-2">
            {track.preRequisitos.map((req, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-[var(--hunter-cyan)] mt-0.5 shrink-0">-</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ── Roadmap ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Roadmap
          </h2>
          <span className="text-xs text-muted">{saving ? "Salvando..." : ""}</span>
        </div>
        <div className="space-y-3">
          {track.marcos.map((marco, i) => (
            <MilestoneRow
              key={marco.id}
              marco={marco}
              index={i}
              concluded={concluded.has(marco.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </section>

      {/* ── Portfolio Project ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Projeto Portfolio
        </h2>
        <div
          className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: "var(--hunter-fuchsia)", background: "rgba(217,70,239,0.05)" }}
        >
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4" style={{ color: "var(--hunter-fuchsia)" }} />
            <span
              className="hunter-text-system text-[10px] font-semibold"
              style={{ color: "var(--hunter-fuchsia)" }}
            >
              [SYSTEM] · PROJETO FINAL
            </span>
          </div>
          <h3 className="text-base font-bold">{track.projetoPortfolio.titulo}</h3>
          <p className="text-sm text-muted leading-relaxed">{track.projetoPortfolio.descricao}</p>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Entregáveis
            </p>
            <ul className="space-y-2">
              {track.projetoPortfolio.entregaveis.map((e, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span style={{ color: "var(--hunter-fuchsia)" }} className="shrink-0">
                    {i + 1}.
                  </span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Interview Prep ── */}
      <section className="space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Preparação para Entrevista
        </h2>

        {/* Topics */}
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold">Tópicos a dominar</h3>
          <ul className="space-y-1.5">
            {track.preparacaoEntrevista.topicos.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-[var(--hunter-violet)] shrink-0">-</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Mock routes */}
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold">Ferramentas de simulação</h3>
          <div className="flex flex-wrap gap-2">
            {track.preparacaoEntrevista.rotasMock.map((rota) => (
              <Link
                key={rota}
                href={rota}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--hunter-violet)]/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition"
              >
                {rota}
                <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
              </Link>
            ))}
          </div>
        </Card>

        {/* Common questions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Perguntas comuns</h3>
          <div className="space-y-2">
            {track.preparacaoEntrevista.perguntasComuns.map((q, i) => (
              <ExpandableQuestion key={i} pergunta={q} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom actions ── */}
      <div className="flex gap-3 flex-wrap pb-4">
        <Button
          variant="secondary"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Voltar ao topo
        </Button>
        <Link
          href="/mock-interview"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition bg-[var(--hunter-cyan)]/15 hover:bg-[var(--hunter-cyan)]/25 border border-[var(--hunter-cyan)]/30 text-[var(--hunter-cyan)]"
        >
          Iniciar Mock Interview
          <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
        </Link>
      </div>
    </div>
  );
}
