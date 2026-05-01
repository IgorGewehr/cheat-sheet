"use client";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import type { TrilhaProgresso, MockInterviewSession, SprintSemIA, WarGameSession, RFCSession } from "@/lib/types";
import type { Card } from "@/lib/types";

export interface RadarAxis {
  label: string;
  value: number; // 0–100
  emoji?: string;
}

export function RadarChart({ axes, size = 280 }: { axes: RadarAxis[]; size?: number }) {
  const [mounted, setMounted] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    // Slight delay for entry animation to be visible
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) * 0.65; // Slightly smaller to fit glow and labels safely
  const labelRadius = (size / 2) * 0.88;
  const ringRadii = [0.25, 0.5, 0.75, 1.0].map((r) => r * radius);
  const n = axes.length;

  const angle = (i: number) => (-Math.PI / 2) + (2 * Math.PI * i / n);
  const point = (r: number, i: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  const dataPoints = axes.map((axis, i) => {
    const r = (axis.value / 100) * radius;
    return point(r, i);
  });
  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height="100%"
        className="text-fg overflow-visible"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="radar-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(245 158 11)" stopOpacity={0.6} />
            <stop offset="100%" stopColor="rgb(245 158 11)" stopOpacity={0.1} />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Concentric rings */}
        {ringRadii.map((r, ri) => {
          const ringPoints = Array.from({ length: n }, (_, i) => point(r, i));
          const d = ringPoints
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
            .join(" ") + " Z";
          return (
            <path
              key={ri}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={ri === ringRadii.length - 1 ? 1 : 0.5}
              className={clsx(
                "transition-opacity duration-1000",
                mounted ? "opacity-100" : "opacity-0"
              )}
              style={{
                color: "var(--line)",
                opacity: ri === ringRadii.length - 1 ? 0.6 : 0.2,
              }}
              strokeDasharray={ri === ringRadii.length - 1 ? "none" : "3 4"}
            />
          );
        })}

        {/* Axis spokes */}
        {axes.map((_, i) => {
          const outer = point(radius, i);
          const isHovered = hoveredIdx === i;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="currentColor"
              strokeWidth={isHovered ? 1.5 : 0.5}
              className={clsx(
                "transition-all duration-300 ease-out",
                isHovered ? "text-amber-500 opacity-80" : "text-line opacity-30",
                !mounted && "opacity-0"
              )}
            />
          );
        })}

        {/* Filled data polygon */}
        <g
          className="transition-transform duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] origin-center"
          style={{ transform: mounted ? "scale(1)" : "scale(0)" }}
        >
          <polygon
            points={polygonPoints}
            fill="url(#radar-gradient)"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Dots at each axis point */}
          {dataPoints.map((p, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : 4}
                fill="#f59e0b"
                stroke="var(--card)"
                strokeWidth={1.5}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
              />
            );
          })}
        </g>

        {/* Center dot */}
        <circle
          cx={cx}
          cy={cy}
          r={3}
          fill="#f59e0b"
          className={clsx("transition-opacity duration-700", mounted ? "opacity-100" : "opacity-0")}
        />

        {/* Labels */}
        {axes.map((axis, i) => {
          const lp = point(labelRadius, i);
          const dx = lp.x - cx;
          const textAnchor = dx > 10 ? "start" : dx < -10 ? "end" : "middle";
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={i}
              className={clsx(
                "transition-all duration-500 cursor-pointer select-none origin-center",
                !mounted && "opacity-0 translate-y-2",
                mounted && axis.value === 0 && !isHovered ? "opacity-40" : "opacity-100",
                isHovered && "scale-110"
              )}
              style={{ transitionDelay: `${mounted ? i * 50 : 0}ms` }}
              onMouseEnter={() => setHoveredIdx(i)}
            >
              <text
                x={lp.x}
                y={lp.y - 6}
                textAnchor={textAnchor}
                fontSize={isHovered ? 12 : 11}
                fontWeight={isHovered ? 600 : 400}
                fill="currentColor"
                className={clsx("transition-colors duration-300", isHovered ? "text-amber-500" : "text-fg")}
                dominantBaseline="auto"
              >
                {axis.emoji} {axis.label}
              </text>
              <text
                x={lp.x}
                y={lp.y + 8}
                textAnchor={textAnchor}
                fontSize={10}
                fill="currentColor"
                className={clsx("transition-colors duration-300", isHovered ? "text-amber-400" : "text-muted")}
                dominantBaseline="auto"
              >
                {Math.round(axis.value)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── computeRadarAxes ────────────────────────────────────────

export function computeRadarAxes(
  trilha: TrilhaProgresso[],
  allCards: Card[],
  interviews: MockInterviewSession[],
  sprints: SprintSemIA[],
  warGames: WarGameSession[],
  rfcs: RFCSession[],
): RadarAxis[] {
  const dominated = trilha.filter((t) => t.dominado).map((t) => t.cardSlug);

  function categoryScore(cat: string): number {
    const cardsInCategory = allCards.filter((c) => c.category === cat);
    if (cardsInCategory.length === 0) return 0;
    return Math.round(
      (cardsInCategory.filter((c) => dominated.includes(c.slug)).length /
        cardsInCategory.length) *
        100,
    );
  }

  const interviewsConcluido = interviews.filter((i) => i.status === "concluido").length;
  const rfcsRevisados = rfcs.filter((r) => r.status === "revisado").length;
  const sprintsConcluidos = sprints.filter((s) => s.status === "concluido").length;
  const warGamesPlayed = warGames.length;

  // Agentes IA axis — based on dominated agentes-ia cards
  const agentCards = allCards.filter((c) => c.category === "agentes-ia");
  const agentDominated = agentCards.filter((c) => dominated.includes(c.slug)).length;
  const agentScore = agentCards.length === 0 ? 0
    : Math.round((agentDominated / agentCards.length) * 100);

  return [
    { label: "Arquitetura",   emoji: "🏗️",  value: categoryScore("arquiteturas") },
    { label: "Backend",       emoji: "⚙️",  value: categoryScore("padroes-backend") },
    { label: "Banco & DB",    emoji: "🗄️",  value: categoryScore("banco") },
    { label: "Auth & Sec",    emoji: "🔐",  value: categoryScore("auth") },
    { label: "Frontend",      emoji: "🎨",  value: categoryScore("padroes-frontend") },
    { label: "Infra & Deploy",emoji: "☁️",  value: categoryScore("infra") },
    {
      label: "Entrevista",
      emoji: "🎤",
      value: Math.min(100, interviewsConcluido * 25 + rfcsRevisados * 20),
    },
    {
      label: "Autonomia",
      emoji: "💪",
      value: Math.min(100, sprintsConcluidos * 20 + warGamesPlayed * 10),
    },
    { label: "Agentes IA",    emoji: "🤖",  value: agentScore },
    { label: "Data Science",  emoji: "📊",  value: categoryScore("data-science") },
  ];
}
