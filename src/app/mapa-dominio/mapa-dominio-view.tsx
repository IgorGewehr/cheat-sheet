"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Map as MapIcon, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, Tag } from "@/components/ui";
import Link from "next/link";
import {
  CATEGORY_LABEL,
  type Card as CardType,
  type CardCategory,
  type TrilhaProgresso,
} from "@/lib/types";
import { listTrilhaProgresso } from "@/lib/db";

const CATEGORY_ORDER: CardCategory[] = [
  "arquiteturas",
  "padroes-backend",
  "padroes-frontend",
  "auth",
  "banco",
  "infra",
  "stack-guides",
  "testes",
  "checklists",
  "armadilhas-ia",
  "prompts",
  "craft",
  "agentes-ia",
];

const CATEGORY_COLORS: Record<CardCategory, string> = {
  arquiteturas: "sky",
  "padroes-backend": "amber",
  "padroes-frontend": "emerald",
  auth: "violet",
  banco: "sky",
  infra: "amber",
  "stack-guides": "zinc",
  testes: "emerald",
  checklists: "sky",
  "armadilhas-ia": "zinc",
  prompts: "amber",
  craft: "violet",
  "agentes-ia": "emerald",
};

type MasteryColor = "green" | "amber" | "red" | "gray";

function getMasteryColor(pct: number, hasAny: boolean): MasteryColor {
  if (!hasAny) return "gray";
  if (pct >= 80) return "green";
  if (pct >= 40) return "amber";
  return "red";
}

const MASTERY_CLASSES: Record<MasteryColor, { bar: string; border: string; bg: string; text: string }> = {
  green: {
    bar: "bg-emerald-500",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    bar: "bg-amber-500",
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-600 dark:text-amber-400",
  },
  red: {
    bar: "bg-red-500",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    text: "text-red-600 dark:text-red-400",
  },
  gray: {
    bar: "bg-zinc-400",
    border: "border-line",
    bg: "",
    text: "text-muted",
  },
};

export function MapaDominioView({ allCards }: { allCards: CardType[] }) {
  const [progresso, setProgresso] = useState<TrilhaProgresso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listTrilhaProgresso()
      .then(setProgresso)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const progressBySlug: Map<string, TrilhaProgresso> = new Map();
  for (const p of progresso) {
    progressBySlug.set(p.cardSlug, p);
  }

  // Group cards by category
  const cardsByCategory: Map<CardCategory, CardType[]> = new Map();
  for (const card of allCards) {
    const list = cardsByCategory.get(card.category) ?? [];
    list.push(card);
    cardsByCategory.set(card.category, list);
  }

  // Per-category stats
  const categoryStats = CATEGORY_ORDER.map((cat) => {
    const cards = cardsByCategory.get(cat) ?? [];
    const dominados = cards.filter((c: CardType) => progressBySlug.get(c.slug)?.dominado).length;
    const emProgresso = cards.filter(
      (c: CardType) => !progressBySlug.get(c.slug)?.dominado && (progressBySlug.get(c.slug)?.tentativas ?? 0) > 0,
    ).length;
    const pct = cards.length > 0 ? Math.round((dominados / cards.length) * 100) : 0;
    const hasAny = dominados > 0 || emProgresso > 0;
    const color = getMasteryColor(pct, hasAny);
    return { cat, cards, dominados, emProgresso, pct, color };
  }).filter((s) => s.cards.length > 0);

  // Overall stats
  const totalCards = allCards.length;
  const totalDominados = progresso.filter((p) => p.dominado).length;
  const totalEmProgresso = progresso.filter((p) => !p.dominado && p.tentativas > 0).length;
  const totalNaoIniciados = totalCards - totalDominados - totalEmProgresso;

  // Strongest and weakest categories
  const withCards = categoryStats.filter((s) => s.cards.length > 0 && s.pct > 0);
  const strongest = [...withCards].sort((a, b) => b.pct - a.pct).slice(0, 3);
  const weakest = categoryStats.filter((s) => s.cards.length > 0 && s.pct < 40).sort((a, b) => a.pct - b.pct).slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <MapIcon className="w-8 h-8 text-amber-500" />
          Mapa de Domínio
        </h1>
        <p className="text-muted max-w-2xl">
          Visão completa do seu domínio por categoria. Verde significa domínio sólido, amarelo em
          progresso, vermelho precisa de atenção.
        </p>
      </header>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Overall stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total de conceitos" value={String(totalCards)} color="text-fg" />
        <StatCard label="Dominados" value={String(totalDominados)} color="text-emerald-500" />
        <StatCard label="Em progresso" value={String(totalEmProgresso)} color="text-amber-500" />
        <StatCard label="Não iniciados" value={String(totalNaoIniciados)} color="text-muted" />
      </div>

      {/* Radar text summary */}
      {(strongest.length > 0 || weakest.length > 0) && (
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Análise de Pontos</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {strongest.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  Pontos fortes
                </div>
                <ul className="space-y-1.5">
                  {strongest.map((s) => (
                    <li key={s.cat} className="flex items-center justify-between text-sm">
                      <span className="text-fg">{CATEGORY_LABEL[s.cat]}</span>
                      <span className="text-emerald-500 font-medium">{s.pct}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {weakest.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
                  <TrendingDown className="w-4 h-4" />
                  Precisa de atenção
                </div>
                <ul className="space-y-1.5">
                  {weakest.map((s) => (
                    <li key={s.cat} className="flex items-center justify-between text-sm">
                      <span className="text-fg">{CATEGORY_LABEL[s.cat]}</span>
                      <span className="text-amber-500 font-medium">
                        {s.pct > 0 ? `${s.pct}%` : "não iniciado"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {strongest.length === 0 && weakest.length === 0 && (
              <div className="flex items-center gap-2 text-muted text-sm">
                <Minus className="w-4 h-4" />
                Complete alguns cards para ver a análise aqui.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categoryStats.map(({ cat, cards, dominados, emProgresso, pct, color }) => {
          const style = MASTERY_CLASSES[color];
          const tagColor = CATEGORY_COLORS[cat] as "zinc" | "amber" | "emerald" | "sky" | "violet";

          return (
            <Card
              key={cat}
              className={clsx(
                "space-y-4 transition-colors",
                color !== "gray" && style.border,
                color !== "gray" && style.bg,
              )}
            >
              {/* Category header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <Tag color={tagColor}>{CATEGORY_LABEL[cat]}</Tag>
                  <div className="flex items-center gap-3 text-xs text-muted pt-1">
                    <span>{cards.length} cards</span>
                    {dominados > 0 && (
                      <span className="text-emerald-500">{dominados} dominados</span>
                    )}
                    {emProgresso > 0 && (
                      <span className="text-amber-500">{emProgresso} em prog.</span>
                    )}
                  </div>
                </div>
                <span className={clsx("text-xl font-semibold shrink-0", style.text)}>
                  {pct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-card border border-line overflow-hidden">
                <div
                  className={clsx("h-full rounded-full transition-all duration-700", style.bar)}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Card list */}
              <div className="space-y-1">
                {cards.map((card: CardType) => {
                  const p = progressBySlug.get(card.slug);
                  const isDominado = p?.dominado ?? false;
                  const isEmProgresso = !isDominado && (p?.tentativas ?? 0) > 0;

                  return (
                    <Link
                      key={card.slug}
                      href={`/biblioteca/${card.slug}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-card-hover transition group"
                    >
                      <span
                        className={clsx(
                          "w-2 h-2 rounded-full shrink-0",
                          isDominado
                            ? "bg-emerald-500"
                            : isEmProgresso
                            ? "bg-amber-500"
                            : "bg-zinc-400",
                        )}
                      />
                      <span
                        className={clsx(
                          "text-xs flex-1 truncate",
                          isDominado ? "text-fg" : "text-muted group-hover:text-fg transition",
                        )}
                      >
                        {card.title}
                      </span>
                      {p?.melhorScore != null && p.melhorScore > 0 && (
                        <span className="text-[10px] text-muted shrink-0">{p.melhorScore}%</span>
                      )}
                      <ExternalLink className="w-3 h-3 text-muted opacity-0 group-hover:opacity-60 transition shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 text-xs text-muted pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/40" />
          ≥ 80% dominado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/40" />
          ≥ 40% em progresso
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500/15 border border-red-500/20" />
          &lt; 40% precisa atenção
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-card border border-line" />
          Não iniciado
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="text-center py-4 space-y-1">
      <div className={clsx("text-3xl font-semibold", color)}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </Card>
  );
}
