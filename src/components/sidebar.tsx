"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Brain, BookOpen, FolderKanban, Settings, BarChart2, Sparkles, Zap,
  Scale, Flame, Menu, X, CalendarDays, TrendingUp, AlertCircle,
  Eye, Swords, MessageSquareMore, Trophy, AlertTriangle,
  Dumbbell, BookMarked, FlaskConical, FileText, Map, Mic,
  Star, GitBranch, Activity, Bot,
} from "lucide-react";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";
import { AuthWidget } from "./auth-widget";

type Item = { href: string; label: string; icon: typeof Brain; hot?: boolean };
type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: "Trabalho diário",
    items: [
      { href: "/",         label: "Dashboard",  icon: BarChart2 },
      { href: "/sessao",   label: "Sessão IA",  icon: Zap, hot: true },
      { href: "/comparar", label: "Comparar",   icon: Scale, hot: true },
    ],
  },
  {
    label: "Aprender",
    items: [
      { href: "/card-do-dia",    label: "Card do Dia",        icon: CalendarDays, hot: true },
      { href: "/trilha",         label: "Trilha Sênior",      icon: TrendingUp },
      { href: "/retrospectiva",  label: "Retrospectiva",      icon: BookMarked },
      { href: "/mapa-dominio",   label: "Mapa de Domínio",    icon: Map },
    ],
  },
  {
    label: "Treinar",
    items: [
      { href: "/revisor",        label: "Revisor Ativo",      icon: Eye },
      { href: "/anti-pattern",   label: "Anti-Pattern",       icon: AlertTriangle },
      { href: "/interrogatorio", label: "Interrogatório",     icon: MessageSquareMore },
      { href: "/mentoria",       label: "Mentoria Invertida", icon: Dumbbell },
    ],
  },
  {
    label: "Desafios",
    items: [
      { href: "/war-game",       label: "War Game",           icon: Swords, hot: true },
      { href: "/system-design",  label: "System Design",      icon: GitBranch },
      { href: "/mock-interview", label: "Mock Interview",     icon: Mic },
    ],
  },
  {
    label: "Accountability",
    items: [
      { href: "/health-score",    label: "Health Score",           icon: Activity },
      { href: "/divida",          label: "Dívida de Conhecimento", icon: AlertCircle },
      { href: "/sprint-sem-ia",   label: "Sprint sem IA",          icon: FlaskConical },
      { href: "/biblioteca-erros",label: "Erros Pessoais",         icon: BookOpen },
    ],
  },
  {
    label: "Entrevista",
    items: [
      { href: "/banco-star",     label: "Banco STAR",         icon: Star },
      { href: "/rfc-writing",    label: "RFC Writing",        icon: FileText },
    ],
  },
  {
    label: "Diagnóstico",
    items: [
      { href: "/refatoracao",       label: "Refatoração Guiada", icon: Trophy },
      { href: "/architecture-audit",label: "Architecture Audit", icon: Sparkles },
    ],
  },
  {
    label: "Conhecimento",
    items: [
      { href: "/biblioteca",                   label: "Biblioteca",   icon: BookOpen },
      { href: "/prompts",                      label: "Prompts",      icon: Sparkles },
      { href: "/biblioteca?category=agentes-ia", label: "Agentes de IA", icon: Bot },
    ],
  },
  {
    label: "Projetos",
    items: [
      { href: "/projetos",  label: "Projetos",  icon: FolderKanban },
      { href: "/analytics", label: "Analytics", icon: BarChart2 },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/workspace", label: "Workspace", icon: Settings },
    ],
  },
];

interface SidebarProgress {
  level: number;
  levelTitle: string;
  levelEmoji: string;
  streak: number;
  xpPercent: number;
  pendingDividas: number;
  cardDoneToday: boolean;
}

export function Sidebar({ commandPalette }: { commandPalette?: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<SidebarProgress | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("brain.sidebarProgress");
      if (raw) setProgress(JSON.parse(raw) as SidebarProgress);
    } catch {}
  }, []);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-line shadow-lg"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:fixed inset-y-0 left-0 z-40 w-64 flex flex-col",
          "bg-card/95 backdrop-blur border-r border-line",
          "transform transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-line">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm group-hover:shadow-amber-500/30 group-hover:shadow-md transition-shadow">
              <Brain className="w-5 h-5 text-zinc-950" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-tight">brain</p>
              <p className="text-[10px] text-subtle uppercase tracking-wider">cheat sheet de eng</p>
            </div>
          </Link>

          {commandPalette && (
            <div className="mt-4">
              {commandPalette}
            </div>
          )}

          {/* Progress mini-bar */}
          {progress && (
            <div className="mt-3 space-y-2">
              {/* Level + streak row */}
              <div className="flex items-center justify-between gap-2 px-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{progress.levelEmoji}</span>
                  <div>
                    <p className="text-xs font-medium text-fg leading-tight">{progress.levelTitle}</p>
                    <p className="text-[10px] text-subtle">Nível {progress.level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <Flame className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-semibold">{progress.streak}d</span>
                </div>
              </div>
              {/* XP bar */}
              <div>
                <div className="h-1.5 rounded-full bg-card-hover overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                    style={{ width: `${progress.xpPercent}%` }}
                  />
                </div>
              </div>
              {/* Alerts row */}
              <div className="flex items-center gap-2 flex-wrap">
                {!progress.cardDoneToday && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                    📅 card do dia
                  </span>
                )}
                {progress.pendingDividas > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 font-medium">
                    {progress.pendingDividas} dívida{progress.pendingDividas > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-subtle">
                {group.label}
              </h3>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon, hot }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={clsx(
                        "relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                        active
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
                          : "text-muted hover:text-fg hover:bg-card-hover",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-amber-500" />
                      )}
                      <Icon className={clsx("w-4 h-4 shrink-0", active && "text-amber-500")} />
                      <span className="flex-1 truncate">{label}</span>
                      {hot && !active && (
                        <Flame className="w-3 h-3 text-amber-500 opacity-70 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-line space-y-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <AuthWidget />
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
