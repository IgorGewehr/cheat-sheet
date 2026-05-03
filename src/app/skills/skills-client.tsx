"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAllProgress } from "@/lib/skill-tree-db";
import { SKILL_AREAS } from "@/lib/skill-trees";
import { SkillTreeMiniPreview } from "@/components/skill-tree-canvas";
import type { SkillAreaProgress } from "@/lib/skill-tree-types";

// ─── Circular progress ring ───────────────────────────────────────────────────

function ProgressRing({
  pct,
  color,
  size = 64,
}: {
  pct: number;
  color: string;
  size?: number;
}) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(39,39,42,0.8)" strokeWidth={4} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={4}
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease", filter: `drop-shadow(0 0 4px ${color}80)` }}
      />
    </svg>
  );
}

// ─── Area Card ────────────────────────────────────────────────────────────────

function AreaCard({
  area,
  progress,
}: {
  area: (typeof SKILL_AREAS)[number];
  progress: SkillAreaProgress;
}) {
  const total = area.nodes.length;
  const mastered = area.nodes.filter((n) => progress[n.id] === "mastered").length;
  const learning = area.nodes.filter((n) => progress[n.id] === "learning").length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const { colors } = area;

  return (
    <Link
      href={`/skills/${area.id}`}
      className="group flex flex-col rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: "rgba(15,15,18,0.7)",
        border: `1px solid ${colors.border}`,
        backdropFilter: "blur(8px)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${colors.borderMastered}, 0 8px 32px ${colors.glow}`;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "none";
      }}
    >
      {/* Card header */}
      <div
        className="px-6 py-5 flex items-center gap-4"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <div
          className="rounded-xl flex items-center justify-center font-mono text-2xl flex-shrink-0"
          style={{
            width: 52,
            height: 52,
            background: colors.bgMedium,
            color: colors.primary,
            border: `1px solid ${colors.border}`,
          }}
        >
          {area.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base leading-snug" style={{ color: colors.text }}>
            {area.name}
          </div>
          <div className="text-xs mt-1" style={{ color: "#52525b" }}>
            {total} skills · {area.tierNames.length} tiers
          </div>
        </div>
        <div className="flex-shrink-0 relative">
          <ProgressRing pct={pct} color={colors.primary} size={58} />
          <div
            className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums"
            style={{ color: colors.text }}
          >
            {pct}%
          </div>
        </div>
      </div>

      {/* Mini preview */}
      <div className="px-5 py-4">
        <SkillTreeMiniPreview area={area} progress={progress} />
      </div>

      {/* Stats + CTA */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-4 text-sm" style={{ color: "#52525b" }}>
          <span>
            <span style={{ color: colors.text, fontWeight: 600 }}>{mastered}</span>
            {" dominadas"}
          </span>
          {learning > 0 && (
            <span>
              <span style={{ color: colors.textMuted, fontWeight: 600 }}>{learning}</span>
              {" estudando"}
            </span>
          )}
        </div>
        <div
          className="flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all"
          style={{ color: colors.textMuted }}
        >
          Ver árvore <ChevronRight size={14} />
        </div>
      </div>
    </Link>
  );
}

// ─── Full-width coverage panel ────────────────────────────────────────────────

function CoveragePanel({
  allProgress,
}: {
  allProgress: Record<string, SkillAreaProgress>;
}) {
  const axes = SKILL_AREAS.map((area) => {
    const total = area.nodes.length;
    const mastered = area.nodes.filter((n) => (allProgress[area.id] ?? {})[n.id] === "mastered").length;
    return {
      label: area.emoji + " " + area.name.split(" ")[0],
      fullName: area.name,
      value: total > 0 ? Math.round((mastered / total) * 100) : 0,
      color: area.colors.primary,
      mastered,
      total,
      area,
    };
  });

  const n = axes.length;
  const cx = 200;
  const cy = 200;
  const r = 155;
  const rings = [0.25, 0.5, 0.75, 1];

  function angleOf(i: number) {
    return ((i / n) * 2 * Math.PI) - Math.PI / 2;
  }

  function point(i: number, radius: number) {
    const a = angleOf(i);
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  }

  const polygonPoints = axes
    .map((ax, i) => {
      const p = point(i, (ax.value / 100) * r);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <div
      className="rounded-xl w-full"
      style={{
        background: "rgba(15,15,18,0.7)",
        border: "1px solid rgba(63,63,70,0.5)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex flex-col lg:flex-row gap-0">
        {/* Radar SVG */}
        <div className="flex items-center justify-center p-6 lg:border-r border-b lg:border-b-0" style={{ borderColor: "rgba(63,63,70,0.4)" }}>
          <svg width={400} height={400} viewBox="0 0 400 400">
            {/* Rings */}
            {rings.map((f) => (
              <polygon
                key={f}
                points={axes
                  .map((_, i) => {
                    const p = point(i, r * f);
                    return `${p.x},${p.y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="rgba(63,63,70,0.4)"
                strokeWidth={1}
              />
            ))}
            {/* Ring labels */}
            {rings.map((f) => {
              const p = point(0, r * f);
              return (
                <text
                  key={f}
                  x={p.x + 4}
                  y={p.y - 3}
                  fontSize={9}
                  fill="rgba(82,82,91,0.8)"
                  fontFamily="monospace"
                >
                  {Math.round(f * 100)}%
                </text>
              );
            })}
            {/* Axis lines */}
            {axes.map((_, i) => {
              const p = point(i, r);
              return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(63,63,70,0.25)" strokeWidth={1} />;
            })}
            {/* Data polygon */}
            <polygon
              points={polygonPoints}
              fill="rgba(139,92,246,0.12)"
              stroke="rgba(139,92,246,0.6)"
              strokeWidth={1.5}
            />
            {/* Data points */}
            {axes.map((ax, i) => {
              const p = point(i, (ax.value / 100) * r);
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill={ax.color}
                  style={{ filter: `drop-shadow(0 0 4px ${ax.color}80)` }}
                />
              );
            })}
            {/* Labels */}
            {axes.map((ax, i) => {
              const p = point(i, r + 22);
              const anchor = p.x < cx - 8 ? "end" : p.x > cx + 8 ? "start" : "middle";
              return (
                <text
                  key={i}
                  x={p.x}
                  y={p.y + 4}
                  textAnchor={anchor}
                  fontSize={11}
                  fill={ax.value > 0 ? "#a1a1aa" : "#52525b"}
                  fontFamily="monospace"
                >
                  {ax.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Right panel: header + per-area bars + legend */}
        <div className="flex-1 p-6 flex flex-col gap-5 min-w-0">
          <div>
            <h3 className="text-base font-semibold mb-0.5" style={{ color: "#a1a1aa" }}>
              Cobertura Total
            </h3>
            <p className="text-xs" style={{ color: "#52525b" }}>
              Progresso por área de conhecimento
            </p>
          </div>

          {/* Per-area breakdown */}
          <div className="space-y-3 flex-1">
            {axes.map((ax) => (
              <div key={ax.area.id} className="flex items-center gap-3">
                <span className="text-base w-6 text-center flex-shrink-0">{ax.area.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate pr-2" style={{ color: ax.value > 0 ? "#d4d4d8" : "#71717a" }}>
                      {ax.fullName}
                    </span>
                    <span className="text-xs tabular-nums font-bold flex-shrink-0" style={{ color: ax.color }}>
                      {ax.value}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(39,39,42,0.8)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${ax.value}%`,
                        background: ax.color,
                        boxShadow: ax.value > 0 ? `0 0 6px ${ax.color}60` : "none",
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs tabular-nums flex-shrink-0" style={{ color: "#52525b" }}>
                  {ax.mastered}/{ax.total}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div
            className="rounded-lg p-3 text-xs space-y-1.5"
            style={{
              background: "rgba(9,9,11,0.5)",
              border: "1px solid rgba(63,63,70,0.4)",
              color: "#52525b",
            }}
          >
            <div className="font-semibold mb-2" style={{ color: "#71717a" }}>
              Status dos nodes
            </div>
            {[
              ["▷ Disponível", "pré-requisitos cumpridos"],
              ["⚡ Estudando", "em progresso ativo"],
              ["✦ Dominada", "skill dominada"],
              ["🔒 Bloqueada", "pré-requisitos pendentes"],
            ].map(([icon, desc]) => (
              <div key={icon} className="flex gap-2">
                <span style={{ color: "#a1a1aa", minWidth: 80 }}>{icon}</span>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SkillsClient() {
  const [allProgress, setAllProgress] = useState<Record<string, SkillAreaProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllProgress()
      .then(setAllProgress)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalNodes = SKILL_AREAS.reduce((s, a) => s + a.nodes.length, 0);
  const totalMastered = SKILL_AREAS.reduce((s, a) => {
    const prog = allProgress[a.id] ?? {};
    return s + a.nodes.filter((n) => prog[n.id] === "mastered").length;
  }, 0);
  const totalLearning = SKILL_AREAS.reduce((s, a) => {
    const prog = allProgress[a.id] ?? {};
    return s + a.nodes.filter((n) => prog[n.id] === "learning").length;
  }, 0);
  const overallPct = totalNodes > 0 ? Math.round((totalMastered / totalNodes) * 100) : 0;

  const rankLabel =
    overallPct >= 80
      ? "Mestre"
      : overallPct >= 60
      ? "Sênior"
      : overallPct >= 40
      ? "Pleno"
      : overallPct >= 20
      ? "Júnior"
      : overallPct >= 5
      ? "Aprendiz"
      : "Iniciante";

  return (
    <div className="min-h-screen px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* Hero */}
      <div className="flex items-start gap-6 flex-wrap">
        <div className="relative flex-shrink-0">
          <ProgressRing pct={overallPct} color="#8b5cf6" size={100} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold tabular-nums" style={{ color: "#c4b5fd" }}>
              {overallPct}%
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: "#f4f4f5" }}>
              Skill Tracker
            </h1>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(139,92,246,0.15)",
                color: "#c4b5fd",
                border: "1px solid rgba(139,92,246,0.4)",
                letterSpacing: "0.08em",
              }}
            >
              {rankLabel}
            </span>
          </div>
          <p className="text-sm mb-3" style={{ color: "#71717a" }}>
            {SKILL_AREAS.length} áreas · {totalNodes} skills mapeadas
          </p>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="font-bold tabular-nums" style={{ color: "#c4b5fd" }}>
                {totalMastered}
              </span>
              <span style={{ color: "#71717a" }}> dominadas</span>
            </div>
            <div>
              <span className="font-bold tabular-nums" style={{ color: "#a78bfa" }}>
                {totalLearning}
              </span>
              <span style={{ color: "#71717a" }}> estudando</span>
            </div>
            <div>
              <span className="font-bold tabular-nums" style={{ color: "#52525b" }}>
                {totalNodes - totalMastered - totalLearning}
              </span>
              <span style={{ color: "#52525b" }}> não iniciadas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coverage panel — full width */}
      <CoveragePanel allProgress={loading ? {} : allProgress} />

      {/* Area cards — 3 per row, no GovTech card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SKILL_AREAS.filter((a) => a.id !== "govtech").map((area) => (
          <AreaCard
            key={area.id}
            area={area}
            progress={loading ? {} : (allProgress[area.id] ?? {})}
          />
        ))}
      </div>
    </div>
  );
}
