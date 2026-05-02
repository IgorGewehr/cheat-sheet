"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { HUNTER_RANKS, RADAR_STAT_SHORT } from "@/lib/types";
import type { RadarAxis } from "@/components/radar-chart";

// Stat short code → human label
const STAT_HUMAN: Record<string, string> = {
  STR: "Arquitetura",
  AGI: "Frontend",
  INT: "Banco & DB",
  VIT: "Infra & Deploy",
  PER: "Backend",
  SEN: "Auth & Sec",
  TEN: "Entrevista",
  WIL: "Autonomia",
  ARC: "Agentes IA",
  LOG: "Data Science",
  MAT: "Matemática",
};

interface StatusSnapshot {
  totalXP?: number;
  level?: number;
  rank?: string;
  streak?: number;
  xpPercent?: number;
  radarAxes?: RadarAxis[];
  topAchievements?: Array<{ id: string; icon: string; title: string; desc: string }>;
  mp?: { current: number; max: number };
  updatedAt?: number;
}

interface SidebarProgress {
  level?: number;
  levelTitle?: string;
  levelEmoji?: string;
  streak?: number;
  xpPercent?: number;
}

function getRankData(level: number) {
  return HUNTER_RANKS.find((r) => r.level === level) ?? HUNTER_RANKS[0];
}

function getNextRank(level: number) {
  return HUNTER_RANKS.find((r) => r.level === level + 1) ?? null;
}

interface StatusWindowProps {
  open: boolean;
  onClose: () => void;
}

export function StatusWindow({ open, onClose }: StatusWindowProps) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<StatusSnapshot>({});
  const [sidebar, setSidebar]   = useState<SidebarProgress>({});

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem("brain.statusSnapshot");
      if (raw) setSnapshot(JSON.parse(raw));
      const sb = localStorage.getItem("brain.sidebarProgress");
      if (sb) setSidebar(JSON.parse(sb));
    } catch {}
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const level       = snapshot.level   ?? sidebar.level   ?? 0;
  const xpPercent   = snapshot.xpPercent ?? sidebar.xpPercent ?? 0;
  const streak      = snapshot.streak  ?? sidebar.streak  ?? 0;
  const totalXP     = snapshot.totalXP ?? 0;
  const rankData    = getRankData(level);
  const nextRank    = getNextRank(level);
  const radarAxes   = snapshot.radarAxes ?? [];
  const achievements = snapshot.topAchievements ?? [];
  const mp          = snapshot.mp ?? { current: 100, max: 100 };
  const mpPct       = mp.max === 0 ? 0 : Math.round((mp.current / mp.max) * 100);

  const rankColorMap: Record<string, string> = {
    zinc:    "text-zinc-400 border-zinc-500/40 bg-zinc-500/10",
    slate:   "text-slate-400 border-slate-500/40 bg-slate-500/10",
    cyan:    "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
    blue:    "text-blue-400 border-blue-500/40 bg-blue-500/10",
    violet:  "text-violet-400 border-violet-500/40 bg-violet-500/10",
    fuchsia: "text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-500/10",
    amber:   "text-amber-400 border-amber-500/40 bg-amber-500/10",
  };
  const rankPill = rankColorMap[rankData.color] ?? "text-zinc-400 border-zinc-500/40 bg-zinc-500/10";

  // Build stat list from radarAxes using RADAR_STAT_SHORT inverse
  const statList = Object.entries(RADAR_STAT_SHORT).map(([label, code]) => {
    const axis = radarAxes.find((a) => a.label === label);
    return { code, label, value: axis?.value ?? 0, decaying: axis?.decaying ?? false };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={clsx(
          "w-full max-w-2xl rounded-xl border border-cyan-500/30 bg-zinc-950 shadow-2xl",
          "transition-all duration-200 ease-out",
        )}
        style={{ boxShadow: "var(--hunter-glow-cyan), 0 25px 50px rgba(0,0,0,0.8)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-400">
            [SYSTEM] · STATUS WINDOW · ◆◆◆
          </span>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — 3 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
          {/* Left: identity */}
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-xl font-bold text-zinc-950 select-none">
                H
              </div>
              <span className="text-xs font-mono text-zinc-400">Hunter</span>
              <span
                className={clsx(
                  "text-sm font-mono font-bold px-3 py-1 rounded-full border",
                  rankPill,
                )}
              >
                {rankData.glyph} Rank {rankData.rank}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{rankData.title}</span>
            </div>

            {/* XP */}
            <div className="space-y-1.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                <span>XP</span>
                <span className="text-cyan-400 font-bold">{totalXP}</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              {nextRank && (
                <p className="text-[10px] font-mono text-zinc-600">
                  {nextRank.min - totalXP > 0 ? `${nextRank.min - totalXP} XP → Rank ${nextRank.rank}` : `Rank ${nextRank.rank} desbloqueado`}
                </p>
              )}
            </div>

            {/* Streak + MP */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-center">
                <p className="text-lg font-bold font-mono text-amber-400">{streak}</p>
                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">dias streak</p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-center">
                <p className="text-lg font-bold font-mono text-cyan-400">{mpPct}%</p>
                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">MP</p>
              </div>
            </div>
          </div>

          {/* Center: stats */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-2">Stats</p>
            <div className="grid grid-cols-2 gap-1.5">
              {statList.map(({ code, label, value, decaying }) => (
                <div
                  key={code}
                  title={STAT_HUMAN[code] ?? label}
                  className={clsx(
                    "flex items-center justify-between px-2 py-1.5 rounded-md border text-[11px] font-mono cursor-default transition-colors",
                    decaying
                      ? "border-amber-500/30 bg-amber-500/5 text-amber-400"
                      : value > 0
                        ? "border-cyan-500/25 bg-cyan-500/5 text-cyan-400"
                        : "border-zinc-800 bg-zinc-900/40 text-zinc-600",
                  )}
                >
                  <span className="font-bold">{code}</span>
                  <span className={decaying ? "text-amber-300" : ""}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: achievements */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-2">
              Achievements ({achievements.length})
            </p>
            {achievements.length === 0 && (
              <p className="text-xs font-mono text-zinc-600 text-center py-4">
                Nenhum ainda — vá jogar!
              </p>
            )}
            <div className="space-y-2">
              {achievements.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800"
                >
                  <span className="text-base leading-none shrink-0 mt-0.5">{a.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono font-bold text-zinc-200 leading-tight">{a.title}</p>
                    <p className="text-[10px] font-mono text-zinc-500 leading-snug mt-0.5">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-mono text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200 transition"
          >
            FECHAR
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onClose(); router.push("/dashboard"); }}
              className="px-3 py-1.5 rounded-md text-xs font-mono text-cyan-400 border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 transition"
            >
              VER DASHBOARD
            </button>
            <button
              className="px-3 py-1.5 rounded-md text-xs font-mono text-fuchsia-400 border border-fuchsia-500/30 bg-fuchsia-500/8 hover:bg-fuchsia-500/15 transition opacity-50 cursor-not-allowed"
              disabled
              title="Em breve"
            >
              SAIR DO GATE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
