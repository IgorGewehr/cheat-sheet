"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Award, ArrowLeft, BookOpen, CheckCircle2, ChevronRight, ExternalLink, Flame, GraduationCap, Lock, PlayCircle, Sparkles, AlertCircle } from "lucide-react";
import { SkillTreeCanvas } from "@/components/skill-tree-canvas";
import { getAreaProgress, setNodeLevel } from "@/lib/skill-tree-db";
import { getBestGoExamSessionsByTier, type GoExamSession, getBestSpringExamSessionsByTier, type SpringExamSession } from "@/lib/db";
import type { SkillArea, SkillAreaProgress, SkillLevel } from "@/lib/skill-tree-types";
import type { CardCategory } from "@/lib/types";

const GO_EXAM_TIERS: Array<{ tier: 1 | 3 | 5; title: string; checkpointSlug: string; description: string }> = [
  {
    tier: 1,
    title: "Tier 1 — Base, Concorrência, Generics",
    checkpointSlug: "go-checkpoint-tier-1",
    description: "Fundamentos Go: layout, errors+context, channels, generics, HTTP. Aprovação ≥ 70.",
  },
  {
    tier: 3,
    title: "Tier 3 — Persistência, Arquitetura, gRPC",
    checkpointSlug: "go-checkpoint-tier-3",
    description: "Pleno: hexagonal, DDD, eventos, Redis, gRPC, resiliência. Aprovação ≥ 70.",
  },
  {
    tier: 5,
    title: "Tier 5 — Produção, Segurança, AI-Era",
    checkpointSlug: "go-checkpoint-tier-5",
    description: "Sênior: supply chain, JWT, observability, AI integration, system design. Aprovação ≥ 75.",
  },
];

const SPRING_EXAM_TIERS: Array<{ tier: 1 | 3 | 5; title: string; checkpointSlug: string; description: string }> = [
  {
    tier: 1,
    title: "Tier 1 — Kotlin & Spring Boot Essentials",
    checkpointSlug: "spring-checkpoint-tier-1",
    description: "Fundamentos: Kotlin idiomático, Spring Web, ProblemDetail, Validation com @field:, Testing. Aprovação ≥ 70.",
  },
  {
    tier: 3,
    title: "Tier 3 — JPA, Arquitetura, Mensageria",
    checkpointSlug: "spring-checkpoint-tier-3",
    description: "Pleno: N+1, hexagonal/DDD em Kotlin, Kafka idempotente, Resilience4j, gRPC. Aprovação ≥ 70.",
  },
  {
    tier: 5,
    title: "Tier 5 — Produção, Segurança, Spring AI",
    checkpointSlug: "spring-checkpoint-tier-5",
    description: "Sênior: observability, performance JVM, OWASP, OAuth2, Spring AI, system design. Aprovação ≥ 75.",
  },
];

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
          className="rounded-xl p-4 sm:p-5"
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
          className="rounded-xl p-4 sm:p-5"
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
        className="rounded-xl p-4 sm:p-5"
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

function GoExamPanel({
  area,
  progress,
}: {
  area: SkillArea;
  progress: SkillAreaProgress;
}) {
  const [bestExams, setBestExams] = useState<Record<1 | 3 | 5, GoExamSession | null>>({ 1: null, 3: null, 5: null });

  useEffect(() => {
    getBestGoExamSessionsByTier()
      .then(setBestExams)
      .catch(() => {});
  }, []);

  const tierReadiness: Record<number, { mastered: number; total: number; ready: boolean }> = {};
  GO_EXAM_TIERS.forEach(({ tier }) => {
    const ceiling = tier; // questões cobrem nodes até o tier
    const tierNodes = area.nodes.filter((n) => n.tier <= ceiling);
    const mastered = tierNodes.filter((n) => progress[n.id] === "mastered").length;
    tierReadiness[tier] = {
      mastered,
      total: tierNodes.length,
      ready: tierNodes.length > 0 && mastered / tierNodes.length >= 0.7,
    };
  });

  return (
    <section
      className="rounded-xl p-4 sm:p-5 mb-6"
      style={{
        background: "rgba(15,15,18,0.78)",
        border: `1px solid ${area.colors.border}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: area.colors.text }}>
        <GraduationCap size={18} />
        <h2 className="text-base font-semibold">Checkpoints & Exames</h2>
      </div>
      <p className="text-xs sm:text-sm leading-relaxed mb-4" style={{ color: "#a1a1aa" }}>
        Antes de marcar tier como dominado, valide com IA: leia o checkpoint markdown e faça o exame.
        Avaliação por GPT-5.5 com rubrica técnica, sem floreio.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {GO_EXAM_TIERS.map(({ tier, title, checkpointSlug, description }) => {
          const best = bestExams[tier];
          const ready = tierReadiness[tier]?.ready ?? false;

          return (
            <div
              key={tier}
              className="rounded-lg p-3 sm:p-4 flex flex-col gap-3"
              style={{
                background: best?.passed ? "rgba(16,185,129,0.06)" : "rgba(9,9,11,0.6)",
                border: `1px solid ${best?.passed ? "rgba(16,185,129,0.4)" : "rgba(63,63,70,0.6)"}`,
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs uppercase tracking-wide" style={{ color: area.colors.textMuted }}>
                    Tier {tier}
                  </span>
                  {best?.passed ? (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                      style={{ background: "rgba(16,185,129,0.18)", color: "#6ee7b7" }}
                    >
                      <Award size={10} />
                      {best.finalScore}
                    </span>
                  ) : best ? (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                      style={{ background: "rgba(245,158,11,0.18)", color: "#fde68a" }}
                    >
                      <AlertCircle size={10} />
                      {best.finalScore}
                    </span>
                  ) : ready ? (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                      style={{ background: area.colors.bgMedium, color: area.colors.text }}
                    >
                      <Sparkles size={10} />
                      Pronto
                    </span>
                  ) : null}
                </div>
                <h3 className="text-sm font-semibold leading-snug mb-1.5" style={{ color: "#fafafa" }}>
                  {title.split(" — ")[1] ?? title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "#a1a1aa" }}>
                  {description}
                </p>
              </div>

              <div className="text-[11px] tabular-nums" style={{ color: "#71717a" }}>
                {tierReadiness[tier]?.mastered ?? 0}/{tierReadiness[tier]?.total ?? 0} nodes dominados
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                <Link
                  href={`/biblioteca/${checkpointSlug}`}
                  className="flex-1 text-xs font-medium rounded-md px-2.5 py-1.5 text-center transition hover:opacity-85"
                  style={{
                    background: area.colors.bgLight,
                    border: `1px solid ${area.colors.border}`,
                    color: area.colors.text,
                  }}
                >
                  Checkpoint
                </Link>
                <Link
                  href={`/skills/go-enterprise/exam/${tier}`}
                  className="flex-1 text-xs font-semibold rounded-md px-2.5 py-1.5 text-center transition hover:opacity-85 inline-flex items-center justify-center gap-1"
                  style={{
                    background: area.colors.bgMedium,
                    border: `1px solid ${area.colors.border}`,
                    color: area.colors.text,
                  }}
                >
                  <Sparkles size={11} />
                  {best ? "Refazer" : "Fazer exame"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SpringExamPanel({
  area,
  progress,
}: {
  area: SkillArea;
  progress: SkillAreaProgress;
}) {
  const [bestExams, setBestExams] = useState<Record<1 | 3 | 5, SpringExamSession | null>>({ 1: null, 3: null, 5: null });

  useEffect(() => {
    getBestSpringExamSessionsByTier()
      .then(setBestExams)
      .catch(() => {});
  }, []);

  const tierReadiness: Record<number, { mastered: number; total: number; ready: boolean }> = {};
  SPRING_EXAM_TIERS.forEach(({ tier }) => {
    const ceiling = tier;
    const tierNodes = area.nodes.filter((n) => n.tier <= ceiling);
    const mastered = tierNodes.filter((n) => progress[n.id] === "mastered").length;
    tierReadiness[tier] = {
      mastered,
      total: tierNodes.length,
      ready: tierNodes.length > 0 && mastered / tierNodes.length >= 0.7,
    };
  });

  return (
    <section
      className="rounded-xl p-4 sm:p-5 mb-6"
      style={{
        background: "rgba(15,15,18,0.78)",
        border: `1px solid ${area.colors.border}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: area.colors.text }}>
        <GraduationCap size={18} />
        <h2 className="text-base font-semibold">Checkpoints & Exames</h2>
      </div>
      <p className="text-xs sm:text-sm leading-relaxed mb-4" style={{ color: "#a1a1aa" }}>
        Antes de marcar tier como dominado, valide com IA: leia o checkpoint markdown e faça o exame.
        Avaliação por GPT-5.5 com rubrica técnica, sem floreio.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SPRING_EXAM_TIERS.map(({ tier, title, checkpointSlug, description }) => {
          const best = bestExams[tier];
          const ready = tierReadiness[tier]?.ready ?? false;

          return (
            <div
              key={tier}
              className="rounded-lg p-3 sm:p-4 flex flex-col gap-3"
              style={{
                background: best?.passed ? "rgba(16,185,129,0.06)" : "rgba(9,9,11,0.6)",
                border: `1px solid ${best?.passed ? "rgba(16,185,129,0.4)" : "rgba(63,63,70,0.6)"}`,
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs uppercase tracking-wide" style={{ color: area.colors.textMuted }}>
                    Tier {tier}
                  </span>
                  {best?.passed ? (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                      style={{ background: "rgba(16,185,129,0.18)", color: "#6ee7b7" }}
                    >
                      <Award size={10} />
                      {best.finalScore}
                    </span>
                  ) : best ? (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                      style={{ background: "rgba(245,158,11,0.18)", color: "#fde68a" }}
                    >
                      <AlertCircle size={10} />
                      {best.finalScore}
                    </span>
                  ) : ready ? (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                      style={{ background: area.colors.bgMedium, color: area.colors.text }}
                    >
                      <Sparkles size={10} />
                      Pronto
                    </span>
                  ) : null}
                </div>
                <h3 className="text-sm font-semibold leading-snug mb-1.5" style={{ color: "#fafafa" }}>
                  {title.split(" — ")[1] ?? title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "#a1a1aa" }}>
                  {description}
                </p>
              </div>

              <div className="text-[11px] tabular-nums" style={{ color: "#71717a" }}>
                {tierReadiness[tier]?.mastered ?? 0}/{tierReadiness[tier]?.total ?? 0} nodes dominados
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                <Link
                  href={`/biblioteca/${checkpointSlug}`}
                  className="flex-1 text-xs font-medium rounded-md px-2.5 py-1.5 text-center transition hover:opacity-85"
                  style={{
                    background: area.colors.bgLight,
                    border: `1px solid ${area.colors.border}`,
                    color: area.colors.text,
                  }}
                >
                  Checkpoint
                </Link>
                <Link
                  href={`/skills/spring-boot-kotlin/exam/${tier}`}
                  className="flex-1 text-xs font-semibold rounded-md px-2.5 py-1.5 text-center transition hover:opacity-85 inline-flex items-center justify-center gap-1"
                  style={{
                    background: area.colors.bgMedium,
                    border: `1px solid ${area.colors.border}`,
                    color: area.colors.text,
                  }}
                >
                  <Sparkles size={11} />
                  {best ? "Refazer" : "Fazer exame"}
                </Link>
              </div>
            </div>
          );
        })}
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
        className="sticky top-0 z-20 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4"
        style={{
          background: "rgba(9,9,11,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <Link
          href="/skills"
          className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm transition-colors shrink-0"
          style={{ color: colors.textMuted }}
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Skills</span>
        </Link>
        <ChevronRight size={12} style={{ color: "#52525b" }} className="hidden sm:inline shrink-0" />
        <span className="text-xs sm:text-sm font-semibold truncate" style={{ color: colors.text }}>
          {area.emoji} {area.name}
        </span>

        <div className="ml-auto flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Stats */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs" style={{ color: "#71717a" }}>
            <span>
              <span style={{ color: colors.text, fontWeight: 600 }}>{mastered}</span>
              /{total}
              <span className="hidden sm:inline"> dominadas</span>
            </span>
            {learning > 0 && (
              <span className="hidden sm:inline">
                <span style={{ color: colors.textMuted, fontWeight: 600 }}>{learning}</span>{" "}
                estudando
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div
            className="hidden md:flex items-center gap-2"
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

          {/* Mobile-only inline percent */}
          <span
            className="md:hidden text-[11px] font-bold tabular-nums"
            style={{ color: colors.text }}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* Page title */}
      <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
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
        <div className="flex items-center gap-x-4 gap-y-1 mb-6 text-xs flex-wrap" style={{ color: "#52525b" }}>
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
      <div className="px-4 sm:px-6 pb-12">
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
            {area.id === "go-enterprise" && <GoExamPanel area={area} progress={progress} />}
            {area.id === "spring-boot-kotlin" && <SpringExamPanel area={area} progress={progress} />}
            <SkillTreeCanvas area={area} progress={progress} onNodeClick={handleNodeClick} />
          </>
        )}
      </div>
    </div>
  );
}
