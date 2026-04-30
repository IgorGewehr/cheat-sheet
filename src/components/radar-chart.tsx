"use client";
import { clsx } from "clsx";
import type { TrilhaProgresso, MockInterviewSession, SprintSemIA, WarGameSession, RFCSession } from "@/lib/types";
import type { Card } from "@/lib/types";

export interface RadarAxis {
  label: string;
  value: number; // 0–100
  emoji?: string;
}

export function RadarChart({ axes, size = 280 }: { axes: RadarAxis[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) * 0.68; // inner radius for data
  const labelRadius = (size / 2) * 0.88; // labels further out
  const ringRadii = [0.25, 0.5, 0.75, 1.0].map((r) => r * radius);
  const n = axes.length;

  const angle = (i: number) => (-Math.PI / 2) + (2 * Math.PI * i / n);
  const point = (r: number, i: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  // Build filled polygon points from data values
  const dataPoints = axes.map((axis, i) => {
    const r = (axis.value / 100) * radius;
    return point(r, i);
  });
  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      className="text-fg"
    >
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
            strokeWidth={0.5}
            className="text-line"
          />
        );
      })}

      {/* Axis spokes */}
      {axes.map((_, i) => {
        const outer = point(radius, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={outer.x}
            y2={outer.y}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-line"
            opacity={0.4}
          />
        );
      })}

      {/* Filled data polygon */}
      <polygon
        points={polygonPoints}
        fill="rgb(245 158 11 / 0.15)"
        stroke="#f59e0b"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Dots at each axis point */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="#f59e0b"
        />
      ))}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill="#f59e0b" />

      {/* Labels */}
      {axes.map((axis, i) => {
        const lp = point(labelRadius, i);
        // Determine text anchor based on x position relative to center
        const dx = lp.x - cx;
        const textAnchor =
          dx > 10 ? "start" : dx < -10 ? "end" : "middle";

        return (
          <g key={i} className={clsx(axis.value === 0 && "opacity-30")}>
            <text
              x={lp.x}
              y={lp.y - 6}
              textAnchor={textAnchor}
              fontSize={11}
              fill="currentColor"
              className="text-fg"
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
              className="text-muted"
              dominantBaseline="auto"
            >
              {axis.value}%
            </text>
          </g>
        );
      })}
    </svg>
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
  ];
}
