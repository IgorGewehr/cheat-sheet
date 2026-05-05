"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAllProgress } from "@/lib/skill-tree-db";
import { SKILL_AREAS } from "@/lib/skill-trees";
import type { SkillAreaProgress } from "@/lib/skill-tree-types";

// ─── Path definitions ─────────────────────────────────────────────────────────

const PATHS = [
  {
    id: "engenharia",
    emoji: "⚙",
    title: "Engenharia de Software",
    description:
      "Arquitetura, sistemas distribuídos, DevOps e GovTech. O caminho do engenheiro sênior.",
    areaIds: ["software", "devops", "govtech"] as const,
    primary: "#06b6d4",
    glow: "rgba(6,182,212,0.30)",
    bgLight: "rgba(6,182,212,0.07)",
    bgMedium: "rgba(6,182,212,0.18)",
    text: "#a5f3fc",
    textMuted: "#67e8f9",
    border: "rgba(6,182,212,0.45)",
    borderMastered: "rgba(6,182,212,0.90)",
  },
  {
    id: "data-ia",
    emoji: "◈",
    title: "Data Science & IA",
    description:
      "LangGraph, LangSmith, Graph RAG, MLOps. Do dado ao sistema de IA em produção.",
    areaIds: ["data-science", "ia-llm"] as const,
    primary: "#10b981",
    glow: "rgba(16,185,129,0.30)",
    bgLight: "rgba(16,185,129,0.07)",
    bgMedium: "rgba(16,185,129,0.18)",
    text: "#6ee7b7",
    textMuted: "#34d399",
    border: "rgba(16,185,129,0.45)",
    borderMastered: "rgba(16,185,129,0.90)",
  },
  {
    id: "security",
    emoji: "⛨",
    title: "Segurança",
    description:
      "Fundamentos de redes e criptografia até red team, incident response e arquitetura zero-trust.",
    areaIds: ["security"] as const,
    primary: "#f43f5e",
    glow: "rgba(244,63,94,0.30)",
    bgLight: "rgba(244,63,94,0.07)",
    bgMedium: "rgba(244,63,94,0.18)",
    text: "#fda4af",
    textMuted: "#fb7185",
    border: "rgba(244,63,94,0.45)",
    borderMastered: "rgba(244,63,94,0.90)",
  },
];

type PathConfig = (typeof PATHS)[number];

// ─── Path Card ────────────────────────────────────────────────────────────────

function PathCard({
  path,
  allProgress,
}: {
  path: PathConfig;
  allProgress: Record<string, SkillAreaProgress>;
}) {
  const areas = path.areaIds
    .map((id) => SKILL_AREAS.find((a) => a.id === id))
    .filter(Boolean) as (typeof SKILL_AREAS)[number][];

  const totalNodes = areas.reduce((sum, a) => sum + a.nodes.length, 0);
  const masteredNodes = areas.reduce((sum, a) => {
    const prog = allProgress[a.id] ?? {};
    return sum + a.nodes.filter((n) => prog[n.id] === "mastered").length;
  }, 0);
  const learningNodes = areas.reduce((sum, a) => {
    const prog = allProgress[a.id] ?? {};
    return sum + a.nodes.filter((n) => prog[n.id] === "learning").length;
  }, 0);

  const pct = totalNodes > 0 ? Math.round((masteredNodes / totalNodes) * 100) : 0;

  return (
    <div
      className="rounded-2xl flex flex-col overflow-hidden"
      style={{
        background: "rgba(9,9,11,0.85)",
        border: `1px solid ${path.border}`,
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-5 flex items-center gap-4"
        style={{ borderBottom: `1px solid ${path.border}` }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-mono flex-shrink-0"
          style={{
            background: path.bgMedium,
            border: `1px solid ${path.border}`,
            color: path.primary,
            boxShadow: `0 0 16px ${path.glow}`,
          }}
        >
          {path.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold" style={{ color: path.text }}>
            {path.title}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#71717a" }}>
            {path.description}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-2xl font-bold tabular-nums" style={{ color: path.primary }}>
            {pct}%
          </div>
          <div className="text-xs" style={{ color: "#52525b" }}>
            {masteredNodes}/{totalNodes}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(39,39,42,0.6)" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: path.primary,
            boxShadow: `0 0 8px ${path.glow}`,
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* Area sub-links */}
      <div className="px-6 py-4 flex flex-col gap-2">
        {areas.map((area) => {
          const prog = allProgress[area.id] ?? {};
          const total = area.nodes.length;
          const mastered = area.nodes.filter((n) => prog[n.id] === "mastered").length;
          const areaPct = total > 0 ? Math.round((mastered / total) * 100) : 0;

          return (
            <Link
              key={area.id}
              href={`/skills/${area.id}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
              style={{ background: path.bgLight, border: `1px solid ${path.border}` }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = path.bgMedium;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 10px ${path.glow}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = path.bgLight;
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <span className="text-base flex-shrink-0" style={{ color: path.primary }}>
                {area.emoji}
              </span>
              <span className="flex-1 text-sm font-medium" style={{ color: path.text }}>
                {area.name}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className="rounded-full overflow-hidden"
                  style={{ width: 60, height: 4, background: "rgba(39,39,42,0.6)" }}
                >
                  <div
                    style={{
                      width: `${areaPct}%`,
                      height: "100%",
                      background: path.primary,
                      borderRadius: 9999,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <span
                  className="text-xs tabular-nums"
                  style={{ color: path.textMuted, minWidth: 36, textAlign: "right" }}
                >
                  {mastered}/{total}
                </span>
              </div>
              <ChevronRight size={14} style={{ color: path.textMuted }} />
            </Link>
          );
        })}
      </div>

      {/* In-progress indicator */}
      {learningNodes > 0 && (
        <div className="px-6 pb-4 text-xs" style={{ color: "#52525b" }}>
          <span style={{ color: path.textMuted }}>{learningNodes}</span> em estudo agora
        </div>
      )}
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function TrilhaView() {
  const [allProgress, setAllProgress] = useState<Record<string, SkillAreaProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllProgress()
      .then(setAllProgress)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const seniorAreas = SKILL_AREAS.filter((a) => a.id !== "matematica");
  const totalNodes = seniorAreas.reduce((sum, a) => sum + a.nodes.length, 0);
  const masteredTotal = seniorAreas.reduce((sum, a) => {
    const prog = allProgress[a.id] ?? {};
    return sum + a.nodes.filter((n) => prog[n.id] === "mastered").length;
  }, 0);
  const pctTotal = totalNodes > 0 ? Math.round((masteredTotal / totalNodes) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ background: "#09090b" }}>
      {/* Header */}
      <div className="px-6 pt-10 pb-6 max-w-3xl mx-auto">
        <div
          className="mb-2 text-xs font-mono tracking-widest uppercase"
          style={{ color: "#52525b" }}
        >
          Trilha Sênior
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#fafafa" }}>
          Escolha seu caminho
        </h1>
        <p className="text-sm mb-6" style={{ color: "#71717a" }}>
          Três trilhas de progressão vertical. Cada nó aponta para um card na biblioteca.
        </p>

        {/* Global progress */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex-1 rounded-full overflow-hidden"
            style={{ height: 6, background: "rgba(39,39,42,0.8)" }}
          >
            <div
              style={{
                width: `${pctTotal}%`,
                height: "100%",
                background: "linear-gradient(90deg, #06b6d4, #10b981, #f43f5e)",
                boxShadow: "0 0 10px rgba(6,182,212,0.4)",
                transition: "width 0.6s ease",
                borderRadius: 9999,
              }}
            />
          </div>
          <span
            className="text-sm font-bold tabular-nums flex-shrink-0"
            style={{ color: "#a1a1aa" }}
          >
            {masteredTotal}/{totalNodes}
          </span>
        </div>
        <p className="text-xs" style={{ color: "#52525b" }}>
          Matemática tem trilha separada em{" "}
          <Link href="/skills/matematica" className="underline" style={{ color: "#71717a" }}>
            /skills/matematica
          </Link>
        </p>
      </div>

      {/* Paths */}
      <div className="px-6 pb-16 max-w-3xl mx-auto flex flex-col gap-6">
        {loading ? (
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              height: 200,
              background: "rgba(9,9,11,0.85)",
              border: "1px solid rgba(63,63,70,0.4)",
              color: "#52525b",
            }}
          >
            Carregando progresso...
          </div>
        ) : (
          PATHS.map((path) => (
            <PathCard key={path.id} path={path} allProgress={allProgress} />
          ))
        )}
      </div>
    </div>
  );
}
