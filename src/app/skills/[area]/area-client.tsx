"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, ExternalLink, Flame, Lock, PlayCircle } from "lucide-react";
import { SkillTreeCanvas } from "@/components/skill-tree-canvas";
import { getAreaProgress, setNodeLevel } from "@/lib/skill-tree-db";
import type { SkillArea, SkillAreaProgress, SkillLevel } from "@/lib/skill-tree-types";
import type { CardCategory } from "@/lib/types";

interface StudyCard {
  slug: string;
  title: string;
  category: CardCategory;
  excerpt: string;
  tags: string[];
  stack: string[];
}

interface Props {
  area: SkillArea;
  cards: StudyCard[];
}

function getNodeCardSlugs(node: SkillArea["nodes"][number]): string[] {
  return [
    ...(node.cardSlugs ?? []),
    ...(node.cardSlug && !node.cardSlugs?.includes(node.cardSlug) ? [node.cardSlug] : []),
  ];
}

function getNodeLevel(
  node: SkillArea["nodes"][number],
  progress: SkillAreaProgress,
): SkillLevel {
  const saved = progress[node.id];
  if (saved === "mastered" || saved === "learning") return saved;
  if (node.prerequisites.length === 0) return "available";
  return node.prerequisites.every((pid) => progress[pid] === "mastered")
    ? "available"
    : "locked";
}

function StudyStatus({
  level,
  colors,
}: {
  level: SkillLevel;
  colors: SkillArea["colors"];
}) {
  if (level === "mastered") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: colors.text }}>
        <CheckCircle2 size={14} />
        Dominada
      </span>
    );
  }
  if (level === "learning") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: colors.textMuted }}>
        <Flame size={14} />
        Estudando
      </span>
    );
  }
  if (level === "available") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: colors.textMuted }}>
        <PlayCircle size={14} />
        Próxima
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#52525b" }}>
      <Lock size={14} />
      Bloqueada
    </span>
  );
}

function StudyPlanPanel({
  area,
  progress,
  cards,
  onStartNode,
}: {
  area: SkillArea;
  progress: SkillAreaProgress;
  cards: StudyCard[];
  onStartNode: (nodeId: string) => void;
}) {
  const cardsBySlug = new Map(cards.map((card) => [card.slug, card]));
  const orderedNodes = [...area.nodes].sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name, "pt-BR"));
  const learningNode = orderedNodes.find((node) => getNodeLevel(node, progress) === "learning");
  const availableNode = orderedNodes.find((node) => getNodeLevel(node, progress) === "available");
  const focusNode = learningNode ?? availableNode;
  const focusCards = focusNode ? getNodeCardSlugs(focusNode).map((slug) => cardsBySlug.get(slug)).filter(Boolean) as StudyCard[] : [];
  const nodesWithCards = orderedNodes.filter((node) => getNodeCardSlugs(node).length > 0);

  return (
    <section className="space-y-4 mb-6">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4">
        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(15,15,18,0.72)",
            border: `1px solid ${area.colors.border}`,
          }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: area.colors.text }}>
            <BookOpen size={18} />
            <h2 className="text-base font-semibold">Roteiro de estudo</h2>
          </div>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#a1a1aa" }}>
            Use esta área como sequência de cards da biblioteca. Marque um node como estudando,
            leia os cards associados e só domine quando conseguir explicar os conceitos sem consultar.
          </p>

          {focusNode ? (
            <div
              className="rounded-lg p-4"
              style={{
                background: area.colors.bgLight,
                border: `1px solid ${area.colors.border}`,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "#71717a" }}>
                    Foco agora
                  </p>
                  <h3 className="font-semibold" style={{ color: area.colors.text }}>
                    {focusNode.name}
                  </h3>
                </div>
                <StudyStatus level={getNodeLevel(focusNode, progress)} colors={area.colors} />
              </div>
              <p className="text-sm mb-4" style={{ color: "#a1a1aa" }}>
                {focusNode.description}
              </p>
              {getNodeLevel(focusNode, progress) === "available" && (
                <button
                  onClick={() => onStartNode(focusNode.id)}
                  className="text-sm font-medium rounded-lg px-3 py-2 transition hover:opacity-85"
                  style={{
                    background: area.colors.bgMedium,
                    border: `1px solid ${area.colors.border}`,
                    color: area.colors.text,
                  }}
                >
                  Começar este node
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-line p-4 text-sm" style={{ color: "#a1a1aa" }}>
              Todos os nodes disponíveis já foram dominados.
            </div>
          )}
        </div>

        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(15,15,18,0.72)",
            border: `1px solid ${area.colors.border}`,
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold" style={{ color: area.colors.text }}>
              Cards do foco
            </h2>
            {focusCards.length > 0 && (
              <span className="text-xs" style={{ color: "#71717a" }}>
                {focusCards.length} card{focusCards.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {focusCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {focusCards.map((card) => (
                <Link
                  key={card.slug}
                  href={`/biblioteca/${card.slug}`}
                  className="group rounded-lg p-4 transition"
                  style={{
                    background: "rgba(9,9,11,0.64)",
                    border: "1px solid rgba(63,63,70,0.72)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <h3 className="text-sm font-semibold flex-1 leading-snug" style={{ color: "#fafafa" }}>
                      {card.title}
                    </h3>
                    <ExternalLink size={14} style={{ color: area.colors.textMuted }} />
                  </div>
                  {card.excerpt && (
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: "#a1a1aa" }}>
                      {card.excerpt}
                    </p>
                  )}
                  {(card.stack.length > 0 || card.tags.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {[...card.stack.slice(0, 2), ...card.tags.slice(0, 3)].map((label) => (
                        <span
                          key={label}
                          className="text-[11px] rounded px-1.5 py-0.5"
                          style={{
                            background: area.colors.bgLight,
                            color: area.colors.textMuted,
                          }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-line p-4 text-sm" style={{ color: "#a1a1aa" }}>
              Este node ainda não tem cards associados. Use a descrição como guia e adicione cards depois.
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-xl p-5"
        style={{
          background: "rgba(15,15,18,0.72)",
          border: `1px solid ${area.colors.border}`,
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold" style={{ color: area.colors.text }}>
            Sequência completa de cards
          </h2>
          <span className="text-xs" style={{ color: "#71717a" }}>
            {nodesWithCards.length} nodes com cards
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {nodesWithCards.map((node) => {
            const level = getNodeLevel(node, progress);
            const nodeCards = getNodeCardSlugs(node)
              .map((slug) => cardsBySlug.get(slug))
              .filter(Boolean) as StudyCard[];

            return (
              <div
                key={node.id}
                className="rounded-lg p-4"
                style={{
                  background: level === "locked" ? "rgba(9,9,11,0.36)" : "rgba(9,9,11,0.64)",
                  border: "1px solid rgba(63,63,70,0.72)",
                  opacity: level === "locked" ? 0.58 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "#71717a" }}>
                      {area.tierNames[node.tier] ?? `Tier ${node.tier}`}
                    </p>
                    <h3 className="text-sm font-semibold leading-snug" style={{ color: "#fafafa" }}>
                      {node.name}
                    </h3>
                  </div>
                  <StudyStatus level={level} colors={area.colors} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {nodeCards.map((card) => (
                    <Link
                      key={card.slug}
                      href={`/biblioteca/${card.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs rounded-md px-2 py-1 transition hover:opacity-85"
                      style={{
                        background: area.colors.bgLight,
                        color: area.colors.textMuted,
                        border: `1px solid ${area.colors.border}`,
                      }}
                    >
                      {card.title}
                      <ExternalLink size={12} />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
          {nodesWithCards.length === 0 && (
            <div className="rounded-lg border border-line p-4 text-sm" style={{ color: "#a1a1aa" }}>
              Esta área ainda não possui cards ligados aos nodes.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function AreaClient({ area, cards }: Props) {
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
          <>
            <StudyPlanPanel
              area={area}
              progress={progress}
              cards={cards}
              onStartNode={(nodeId) => void handleNodeClick(nodeId, "learning")}
            />
            <SkillTreeCanvas area={area} progress={progress} onNodeClick={handleNodeClick} />
          </>
        )}
      </div>
    </div>
  );
}
