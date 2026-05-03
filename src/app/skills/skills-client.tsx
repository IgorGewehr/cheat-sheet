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
        className="px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <div
          className="rounded-lg flex items-center justify-center font-mono text-lg"
          style={{
            width: 40,
            height: 40,
            background: colors.bgMedium,
            color: colors.primary,
            border: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          {area.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate" style={{ color: colors.text }}>
            {area.name}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#52525b" }}>
            {total} skills · {area.tierNames.length} tiers
          </div>
        </div>
        <div className="flex-shrink-0 relative">
          <ProgressRing pct={pct} color={colors.primary} size={52} />
          <div
            className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums"
            style={{ color: colors.text }}
          >
            {pct}%
          </div>
        </div>
      </div>

      {/* Mini preview */}
      <div className="px-4 py-3">
        <SkillTreeMiniPreview area={area} progress={progress} />
      </div>

      {/* Stats + CTA */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-3 text-xs" style={{ color: "#52525b" }}>
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
          className="flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all"
          style={{ color: colors.textMuted }}
        >
          Ver árvore <ChevronRight size={12} />
        </div>
      </div>
    </Link>
  );
}

// ─── Radar (all areas) ────────────────────────────────────────────────────────

function MasterRadar({
  allProgress,
}: {
  allProgress: Record<string, SkillAreaProgress>;
}) {
  const axes = SKILL_AREAS.map((area) => {
    const total = area.nodes.length;
    const mastered = area.nodes.filter((n) => (allProgress[area.id] ?? {})[n.id] === "mastered").length;
    return {
      label: area.emoji + " " + area.name.split(" ")[0],
      value: total > 0 ? Math.round((mastered / total) * 100) : 0,
      color: area.colors.primary,
    };
  });

  const n = axes.length;
  const cx = 160;
  const cy = 160;
  const r = 120;
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
      className="rounded-xl p-6"
      style={{
        background: "rgba(15,15,18,0.7)",
        border: "1px solid rgba(63,63,70,0.5)",
        backdropFilter: "blur(8px)",
      }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#a1a1aa" }}>
        Cobertura Total
      </h3>
      <div className="flex items-center justify-center">
        <svg width={320} height={320} viewBox="0 0 320 320">
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
            const p = point(i, r + 20);
            const anchor = p.x < cx - 5 ? "end" : p.x > cx + 5 ? "start" : "middle";
            return (
              <text
                key={i}
                x={p.x}
                y={p.y + 4}
                textAnchor={anchor}
                fontSize={10}
                fill={ax.value > 0 ? "#a1a1aa" : "#52525b"}
                fontFamily="monospace"
              >
                {ax.label}
              </text>
            );
          })}
        </svg>
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
    <div className="min-h-screen px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-start gap-6 flex-wrap">
          {/* Overall progress ring */}
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
      </div>

      {/* Area grid + Radar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Areas grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SKILL_AREAS.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              progress={loading ? {} : (allProgress[area.id] ?? {})}
            />
          ))}
        </div>

        {/* Radar */}
        <div className="flex flex-col gap-4">
          <MasterRadar allProgress={loading ? {} : allProgress} />
          {/* Quick legend */}
          <div
            className="rounded-xl p-4 text-xs space-y-2"
            style={{
              background: "rgba(15,15,18,0.7)",
              border: "1px solid rgba(63,63,70,0.5)",
              color: "#52525b",
            }}
          >
            <div className="font-semibold mb-2" style={{ color: "#71717a" }}>
              Como funciona
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
