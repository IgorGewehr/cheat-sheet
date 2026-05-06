"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { SkillArea, SkillNode, SkillLevel, SkillAreaProgress } from "@/lib/skill-tree-types";

// ─── Layout constants ────────────────────────────────────────────────────────

const NW_DEFAULT = 176;  // node width fallback (before container measured)
const NW_MIN = 140;      // minimum node width
const NH = 72;           // node height
const GAP_X = 16;        // horizontal gap between nodes in same tier
const GAP_Y = 56;        // vertical gap between tier rows
const PAD_X = 24;
const PAD_Y = 24;
const TIER_LABEL_H = 32;

// ─── Utilities ───────────────────────────────────────────────────────────────

function computeLevel(
  node: SkillNode,
  progress: SkillAreaProgress,
): SkillLevel {
  const saved = progress[node.id];
  if (saved === "mastered" || saved === "learning") return saved;
  if (node.prerequisites.length === 0) return "available";
  const prereqsMet = node.prerequisites.every((pid) => progress[pid] === "mastered");
  return prereqsMet ? "available" : "locked";
}

type NodePos = { x: number; y: number };

function computeLayout(
  nodes: SkillNode[],
  nw: number,
): { positions: Map<string, NodePos>; canvasH: number; canvasW: number } {
  const tiers = [...new Set(nodes.map((n) => n.tier))].sort((a, b) => a - b);
  const numTiers = tiers.length;

  const tierNodeMap = new Map<number, SkillNode[]>();
  for (const t of tiers) tierNodeMap.set(t, nodes.filter((n) => n.tier === t));

  const maxCount = Math.max(...[...tierNodeMap.values()].map((ns) => ns.length));
  const totalContentW = maxCount * nw + Math.max(0, maxCount - 1) * GAP_X;

  const positions = new Map<string, NodePos>();
  for (const [tier, tierNodes] of tierNodeMap) {
    const tierIndex = tiers.indexOf(tier);
    const tierW = tierNodes.length * nw + Math.max(0, tierNodes.length - 1) * GAP_X;
    const startX = PAD_X + (totalContentW - tierW) / 2;
    const y = PAD_Y + tierIndex * (TIER_LABEL_H + NH + GAP_Y) + TIER_LABEL_H;
    tierNodes.forEach((node, i) => {
      positions.set(node.id, { x: startX + i * (nw + GAP_X), y });
    });
  }

  return {
    positions,
    canvasH: PAD_Y * 2 + numTiers * (TIER_LABEL_H + NH) + Math.max(0, numTiers - 1) * GAP_Y,
    canvasW: PAD_X * 2 + totalContentW,
  };
}

// Vertical bezier: bottom-center of source → top-center of target
function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const cy = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`;
}

function cycleLevel(current: SkillLevel): "learning" | "mastered" | null {
  if (current === "available") return "learning";
  if (current === "learning") return "mastered";
  if (current === "mastered") return null;
  return null;
}

// ─── Node Component ──────────────────────────────────────────────────────────

interface NodeProps {
  node: SkillNode;
  level: SkillLevel;
  colors: SkillArea["colors"];
  nw: number;
  areaId: string;
  onClick: () => void;
  style: React.CSSProperties;
}

function SkillNodeCard({ node, level, colors, nw, areaId, onClick, style }: NodeProps) {
  const [hovered, setHovered] = useState(false);

  const isLocked = level === "locked";
  const effectiveCardSlugs = [
    ...(node.cardSlugs ?? []),
    ...(node.cardSlug && !node.cardSlugs?.includes(node.cardSlug) ? [node.cardSlug] : []),
  ];
  const isMastered = level === "mastered";
  const isLearning = level === "learning";

  const borderColor = isLocked
    ? "rgba(63,63,70,0.6)"
    : isMastered
    ? colors.borderMastered
    : colors.border;

  const bgColor = isLocked
    ? "rgba(15,15,18,0.5)"
    : isMastered
    ? colors.bgMedium
    : isLearning
    ? colors.bgLight
    : "rgba(15,15,18,0.4)";

  const boxShadow =
    isMastered && hovered
      ? `0 0 0 1px ${colors.borderMastered}, 0 0 18px ${colors.glow}, 0 2px 8px rgba(0,0,0,0.4)`
      : isMastered
      ? `0 0 12px ${colors.glow}, 0 2px 8px rgba(0,0,0,0.3)`
      : isLearning && hovered
      ? `0 0 0 1px ${colors.border}, 0 0 10px ${colors.bgMedium}`
      : hovered && !isLocked
      ? `0 0 0 1px ${colors.border}`
      : "none";

  const dots = isLearning ? 2 : isMastered ? 5 : 0;

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="absolute text-left group"
      style={{
        ...style,
        width: nw,
        height: NH,
        borderRadius: 10,
        border: `1px solid ${isLearning ? "transparent" : borderColor}`,
        outline: isLearning ? `1.5px solid ${colors.border}` : "none",
        background: bgColor,
        boxShadow,
        opacity: isLocked ? 0.45 : 1,
        cursor: isLocked ? "not-allowed" : "pointer",
        transition: "box-shadow 0.2s, opacity 0.2s",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backdropFilter: "blur(4px)",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>
          {isLocked ? "🔒" : isMastered ? "✦" : isLearning ? "⚡" : "▷"}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: isLocked ? "#52525b" : isMastered ? colors.text : isLearning ? colors.textMuted : "#a1a1aa",
            lineHeight: 1.3,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.name}
        </span>
        {effectiveCardSlugs.length === 1 && !isLocked && (
          <a
            href={`/biblioteca/${effectiveCardSlugs[0]}`}
            onClick={(e) => e.stopPropagation()}
            title="Ver card na biblioteca"
            style={{ fontSize: 11, color: colors.textMuted, opacity: 0.75, flexShrink: 0, lineHeight: 1 }}
          >
            ↗
          </a>
        )}
        {effectiveCardSlugs.length > 1 && !isLocked && (
          <a
            href={`/biblioteca?node=${node.id}&area=${areaId}`}
            onClick={(e) => e.stopPropagation()}
            title={`${effectiveCardSlugs.length} cards na biblioteca`}
            style={{
              fontSize: 10,
              color: colors.textMuted,
              opacity: 0.8,
              flexShrink: 0,
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {effectiveCardSlugs.length} ↗
          </a>
        )}
      </div>

      {/* Footer row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
        {(isMastered || isLearning) && (
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: i < dots ? colors.primary : "rgba(63,63,70,0.6)",
                  boxShadow: i < dots ? `0 0 4px ${colors.glow}` : "none",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        )}
        <span
          style={{
            fontSize: 10,
            color: isLocked ? "#3f3f46" : isMastered ? colors.textMuted : isLearning ? colors.textMuted : "#52525b",
            fontWeight: 500,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {isLocked
            ? `Precisa: ${node.prerequisites.length} pré-req`
            : isMastered
            ? "Dominada"
            : isLearning
            ? "Estudando"
            : "Disponível"}
        </span>
      </div>
    </button>
  );
}

// ─── Main Canvas ─────────────────────────────────────────────────────────────

interface Props {
  area: SkillArea;
  progress: SkillAreaProgress;
  onNodeClick: (nodeId: string, newLevel: "learning" | "mastered" | null) => void;
}

export function SkillTreeCanvas({ area, progress, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure container width synchronously before first paint, then track resizes
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? el.clientWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { nodes, colors, tierNames } = area;

  const tiers = useMemo(() => {
    const s = new Set(nodes.map((n) => n.tier));
    return [...s].sort((a, b) => a - b);
  }, [nodes]);

  const maxTierCount = useMemo(
    () => Math.max(...tiers.map((t) => nodes.filter((n) => n.tier === t).length)),
    [nodes, tiers],
  );

  // Node width that fills the container exactly (min NW_MIN)
  const nw = useMemo(() => {
    if (containerWidth === 0) return NW_DEFAULT;
    const available = containerWidth - PAD_X * 2 - Math.max(0, maxTierCount - 1) * GAP_X;
    return Math.max(NW_MIN, Math.floor(available / maxTierCount));
  }, [containerWidth, maxTierCount]);

  const { positions, canvasH, canvasW } = useMemo(
    () => computeLayout(nodes, nw),
    [nodes, nw],
  );

  const levels = useMemo(() => {
    const m = new Map<string, SkillLevel>();
    for (const n of nodes) m.set(n.id, computeLevel(n, progress));
    return m;
  }, [nodes, progress]);

  const edges = useMemo(() => {
    const result: { from: string; to: string }[] = [];
    for (const node of nodes) {
      for (const prereqId of node.prerequisites) {
        if (positions.has(prereqId) && positions.has(node.id)) {
          result.push({ from: prereqId, to: node.id });
        }
      }
    }
    return result;
  }, [nodes, positions]);

  function edgeColor(fromId: string, toId: string): string {
    const fromLevel = levels.get(fromId) ?? "locked";
    const toLevel = levels.get(toId) ?? "locked";
    if (fromLevel === "mastered" && toLevel === "mastered") return colors.primary;
    if (fromLevel === "mastered") return colors.border;
    return "rgba(63,63,70,0.25)";
  }

  function edgeWidth(fromId: string, toId: string): number {
    return levels.get(fromId) === "mastered" && levels.get(toId) === "mastered" ? 1.5 : 1;
  }

  function edgeGlow(fromId: string, toId: string): boolean {
    return levels.get(fromId) === "mastered" && levels.get(toId) === "mastered";
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-x-auto"
      style={{
        background: "rgba(9,9,11,0.85)",
        border: `1px solid ${colors.border}`,
        minHeight: 240,
        backgroundImage: `radial-gradient(circle, ${colors.bgLight} 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }}
    >
      <div style={{ width: canvasW, minWidth: canvasW, height: canvasH, position: "relative" }}>
        {/* Tier labels — full-width strip above each row */}
        {tiers.map((tier, tierIndex) => {
          const labelY = PAD_Y + tierIndex * (TIER_LABEL_H + NH + GAP_Y);
          return (
            <div
              key={tier}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: labelY,
                height: TIER_LABEL_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: colors.textMuted,
                  background: colors.bgLight,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  padding: "2px 10px",
                }}
              >
                {tierNames[tier] ?? `Tier ${tier}`}
              </span>
            </div>
          );
        })}

        {/* SVG connections — vertical beziers (bottom-center → top-center) */}
        <svg
          style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
          width="100%"
          height={canvasH}
        >
          <defs>
            <filter id={`glow-${area.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {edges.map(({ from, to }) => {
            const fp = positions.get(from)!;
            const tp = positions.get(to)!;
            const x1 = fp.x + nw / 2;
            const y1 = fp.y + NH;
            const x2 = tp.x + nw / 2;
            const y2 = tp.y;
            const glow = edgeGlow(from, to);
            return (
              <path
                key={`${from}-${to}`}
                d={bezierPath(x1, y1, x2, y2)}
                fill="none"
                stroke={edgeColor(from, to)}
                strokeWidth={edgeWidth(from, to)}
                filter={glow ? `url(#glow-${area.id})` : undefined}
                opacity={glow ? 0.9 : 0.6}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = positions.get(node.id)!;
          const level = levels.get(node.id) ?? "locked";
          return (
            <SkillNodeCard
              key={node.id}
              node={node}
              level={level}
              colors={colors}
              nw={nw}
              areaId={area.id}
              style={{ left: pos.x, top: pos.y }}
              onClick={() => {
                const next = cycleLevel(level);
                onNodeClick(node.id, next);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Mini preview (vertical: rows = tiers, dots spread horizontally) ─────────

interface MiniPreviewProps {
  area: SkillArea;
  progress: SkillAreaProgress;
  size?: number;
}

export function SkillTreeMiniPreview({ area, progress }: MiniPreviewProps) {
  const { nodes, colors } = area;

  const tiers = useMemo(() => {
    const s = new Set(nodes.map((n) => n.tier));
    return [...s].sort((a, b) => a - b);
  }, [nodes]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: 8,
        background: "rgba(9,9,11,0.6)",
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
      }}
    >
      {tiers.map((tier) => {
        const tierNodes = nodes.filter((n) => n.tier === tier);
        return (
          <div key={tier} style={{ display: "flex", gap: 3, alignItems: "center" }}>
            {tierNodes.map((node) => {
              const lvl = progress[node.id];
              const isMastered = lvl === "mastered";
              const isLearning = lvl === "learning";
              return (
                <div
                  key={node.id}
                  title={node.name}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: isMastered ? colors.primary : isLearning ? colors.bgMedium : "rgba(39,39,42,0.8)",
                    border: `1px solid ${isMastered ? colors.borderMastered : isLearning ? colors.border : "rgba(63,63,70,0.4)"}`,
                    boxShadow: isMastered ? `0 0 4px ${colors.glow}` : "none",
                    transition: "background 0.3s",
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
