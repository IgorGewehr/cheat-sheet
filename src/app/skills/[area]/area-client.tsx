"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { SkillTreeCanvas } from "@/components/skill-tree-canvas";
import { getAreaProgress, setNodeLevel } from "@/lib/skill-tree-db";
import type { SkillArea, SkillAreaProgress, SkillLevel } from "@/lib/skill-tree-types";

interface Props {
  area: SkillArea;
}

export function AreaClient({ area }: Props) {
  const [progress, setProgress] = useState<SkillAreaProgress>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    getAreaProgress(area.id)
      .then(setProgress)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [area.id]);

  const handleNodeClick = useCallback(
    async (nodeId: string, newLevel: "learning" | "mastered" | null) => {
      setProgress((prev) => {
        if (newLevel === null) {
          const { [nodeId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [nodeId]: newLevel };
      });
      setSaving(nodeId);
      try {
        await setNodeLevel(area.id, nodeId, newLevel);
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(null);
      }
    },
    [area.id],
  );

  const { nodes, colors } = area;
  const total = nodes.length;
  const mastered = nodes.filter((n) => progress[n.id] === "mastered").length;
  const learning = nodes.filter((n) => progress[n.id] === "learning").length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  const tiers = [...new Set(nodes.map((n) => n.tier))].sort();

  return (
    <div className="min-h-screen" style={{ background: "#09090b" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-6 py-3 flex items-center gap-4"
        style={{
          background: "rgba(9,9,11,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <Link
          href="/skills"
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: colors.textMuted }}
        >
          <ArrowLeft size={14} />
          Skills
        </Link>
        <ChevronRight size={12} style={{ color: "#52525b" }} />
        <span className="text-sm font-semibold" style={{ color: colors.text }}>
          {area.emoji} {area.name}
        </span>

        <div className="ml-auto flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs" style={{ color: "#71717a" }}>
            <span>
              <span style={{ color: colors.text, fontWeight: 600 }}>{mastered}</span>
              /{total} dominadas
            </span>
            {learning > 0 && (
              <span>
                <span style={{ color: colors.textMuted, fontWeight: 600 }}>{learning}</span>{" "}
                estudando
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div
            className="hidden sm:flex items-center gap-2"
            style={{ minWidth: 140 }}
          >
            <div
              className="flex-1 rounded-full overflow-hidden"
              style={{ height: 5, background: "rgba(39,39,42,0.8)" }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: colors.primary,
                  boxShadow: `0 0 8px ${colors.glow}`,
                  borderRadius: 9999,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: colors.text, minWidth: 32, textAlign: "right" }}
            >
              {pct}%
            </span>
          </div>
        </div>
      </div>

      {/* Page title */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-start gap-4 mb-6">
          <div
            className="rounded-xl flex items-center justify-center text-2xl font-mono"
            style={{
              width: 52,
              height: 52,
              background: colors.bgMedium,
              border: `1px solid ${colors.border}`,
              color: colors.primary,
              flexShrink: 0,
              boxShadow: `0 0 20px ${colors.glow}`,
            }}
          >
            {area.emoji}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
              {area.name}
            </h1>
            <p className="text-sm mt-1 max-w-xl" style={{ color: "#71717a" }}>
              {area.description}
            </p>
          </div>
        </div>

        {/* Tier legend */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {tiers.map((tier) => (
            <div
              key={tier}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
              style={{
                background: colors.bgLight,
                border: `1px solid ${colors.border}`,
                color: colors.textMuted,
              }}
            >
              <span className="font-bold tabular-nums" style={{ color: colors.text }}>
                {tier}
              </span>
              <span>{area.tierNames[tier] ?? `Tier ${tier}`}</span>
              <span style={{ color: "#52525b" }}>
                ({nodes.filter((n) => n.tier === tier).length})
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-6 text-xs" style={{ color: "#52525b" }}>
          {[
            { icon: "🔒", label: "Bloqueada" },
            { icon: "▷", label: "Disponível (clique para estudar)" },
            { icon: "⚡", label: "Estudando (clique para dominar)" },
            { icon: "✦", label: "Dominada (clique para resetar)" },
          ].map(({ icon, label }) => (
            <span key={icon} className="flex items-center gap-1">
              <span>{icon}</span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="px-6 pb-12">
        {loading ? (
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              height: 300,
              background: "rgba(9,9,11,0.85)",
              border: `1px solid ${colors.border}`,
              color: "#52525b",
            }}
          >
            Carregando progresso...
          </div>
        ) : (
          <SkillTreeCanvas area={area} progress={progress} onNodeClick={handleNodeClick} />
        )}
      </div>
    </div>
  );
}
