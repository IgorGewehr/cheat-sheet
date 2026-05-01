"use client";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import type { TrilhaProgresso, MockInterviewSession, SprintSemIA, WarGameSession, RFCSession, Adocao, Decisao } from "@/lib/types";
import type { Card } from "@/lib/types";

export interface RadarAxis {
  label: string;
  value: number; // 0–100
  emoji?: string;
  decaying?: boolean;
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
                {axis.emoji} {axis.label} {axis.decaying && "🔥"}
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
  adocoes: Adocao[],
  decisoes: Decisao[]
): RadarAxis[] {
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  function categoryScore(cat: string): { value: number; decaying: boolean } {
    const cardsInCategory = allCards.filter((c) => c.category === cat);
    if (cardsInCategory.length === 0) return { value: 0, decaying: false };
    
    let totalScore = 0;
    let latestActivity = 0;
    
    cardsInCategory.forEach((c) => {
      let score = 0;
      
      const tr = trilha.find((t) => t.cardSlug === c.slug);
      if (tr && tr.dominado) {
        score += 1;
        if (tr.ultimaRevisao && tr.ultimaRevisao > latestActivity) latestActivity = tr.ultimaRevisao;
      }
      
      const adopted = adocoes.find((a) => a.cardSlug === c.slug && a.status === "adotado");
      if (adopted) {
        score += 3;
        if (adopted.dataDecisao > latestActivity) latestActivity = adopted.dataDecisao;
      }
      
      const decided = decisoes.find((d) => d.status === "aceita" && d.cardSlugs?.includes(c.slug));
      if (decided) {
        score += 2;
        if (decided.data > latestActivity) latestActivity = decided.data;
      }
      
      totalScore += Math.min(4, score);
    });

    const maxScore = cardsInCategory.length * 4; 
    if (maxScore === 0) return { value: 0, decaying: false };
    
    let rawScore = (totalScore / maxScore) * 100;
    let decaying = false;

    if (totalScore > 0 && latestActivity > 0 && (now - latestActivity > THIRTY_DAYS)) {
      decaying = true;
      rawScore = Math.max(0, rawScore * 0.9); // -10% penalty
    }
    
    return { value: Math.round(rawScore), decaying };
  }

  const interviewsConcluido = interviews.filter((i) => i.status === "concluido").length;
  const rfcsRevisados = rfcs.filter((r) => r.status === "revisado").length;
  const sprintsConcluidos = sprints.filter((s) => s.status === "concluido").length;
  const warGamesPlayed = warGames.length;

  const agentCards = allCards.filter((c) => c.category === "agentes-ia");
  let agentTotalScore = 0;
  let agentLatestActivity = 0;
  agentCards.forEach(c => {
    let score = 0;
    const tr = trilha.find((t) => t.cardSlug === c.slug);
    if (tr && tr.dominado) { score += 1; if (tr.ultimaRevisao && tr.ultimaRevisao > agentLatestActivity) agentLatestActivity = tr.ultimaRevisao; }
    const adopted = adocoes.find(a => a.cardSlug === c.slug && a.status === "adotado");
    if (adopted) { score += 3; if (adopted.dataDecisao > agentLatestActivity) agentLatestActivity = adopted.dataDecisao; }
    const decided = decisoes.find(d => d.status === "aceita" && d.cardSlugs?.includes(c.slug));
    if (decided) { score += 2; if (decided.data > agentLatestActivity) agentLatestActivity = decided.data; }
    agentTotalScore += Math.min(4, score);
  });
  
  let agentScore = agentCards.length === 0 ? 0 : (agentTotalScore / (agentCards.length * 4)) * 100;
  let agentDecaying = false;
  if (agentTotalScore > 0 && agentLatestActivity > 0 && (now - agentLatestActivity > THIRTY_DAYS)) {
    agentDecaying = true;
    agentScore = Math.max(0, agentScore * 0.9);
  }

  return [
    { label: "Arquitetura",   emoji: "🏗️",  ...categoryScore("arquiteturas") },
    { label: "Backend",       emoji: "⚙️",  ...categoryScore("padroes-backend") },
    { label: "Banco & DB",    emoji: "🗄️",  ...categoryScore("banco") },
    { label: "Auth & Sec",    emoji: "🔐",  ...categoryScore("auth") },
    { label: "Frontend",      emoji: "🎨",  ...categoryScore("padroes-frontend") },
    { label: "Infra & Deploy",emoji: "☁️",  ...categoryScore("infra") },
    {
      label: "Entrevista",
      emoji: "🎤",
      value: Math.min(100, interviewsConcluido * 25 + rfcsRevisados * 20),
      decaying: false
    },
    {
      label: "Autonomia",
      emoji: "💪",
      value: Math.min(100, sprintsConcluidos * 20 + warGamesPlayed * 10),
      decaying: false
    },
    { label: "Agentes IA",    emoji: "🤖",  value: Math.round(agentScore), decaying: agentDecaying },
    { label: "Data Science",  emoji: "📊",  ...categoryScore("data-science") },
  ];
}
