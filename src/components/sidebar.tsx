"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen, FolderKanban, BarChart2, Sparkles, Zap,
  Scale, Flame, CalendarDays, TrendingUp, AlertCircle,
  Eye, Swords, MessageSquareMore,
  Dumbbell, BookMarked, FlaskConical, FileText, Map, Mic,
  Star, GitBranch, Activity, Moon,
} from "lucide-react";
import { clsx } from "clsx";
import { ThemeToggle } from "./theme-toggle";
import { AuthWidget } from "./auth-widget";
import type { Verb } from "./top-nav";
import { getActiveVerb } from "./top-nav";

type Item = { href: string; label: string; icon: typeof BookOpen; hot?: boolean };

const VERB_ITEMS: Record<Verb, Item[]> = {
  trabalhar: [
    { href: "/sessao",      label: "Sessão IA",        icon: Zap, hot: true },
    { href: "/comparar",    label: "Comparar",          icon: Scale, hot: true },
    { href: "/fim-do-dia",  label: "Fim do Dia",        icon: Moon },
    { href: "/gerar-card",  label: "Gerar Card c/ IA",  icon: Sparkles, hot: true },
    { href: "/projetos",    label: "Projetos",           icon: FolderKanban },
  ],
  estudar: [
    { href: "/biblioteca",     label: "Biblioteca",       icon: BookOpen },
    { href: "/trilha",         label: "Trilha Sênior",    icon: TrendingUp },
    { href: "/card-do-dia",    label: "Card do Dia",      icon: CalendarDays, hot: true },
    { href: "/mapa-dominio",   label: "Mapa de Domínio",  icon: Map },
    { href: "/retrospectiva",  label: "Retrospectiva",    icon: BookMarked },
  ],
  treinar: [
    { href: "/revisor",           label: "Revisor Ativo",       icon: Eye },
    { href: "/anti-pattern",      label: "Anti-Pattern",        icon: AlertCircle },
    { href: "/interrogatorio",    label: "Interrogatório",      icon: MessageSquareMore },
    { href: "/mentoria",          label: "Mentoria Invertida",  icon: Dumbbell },
    { href: "/war-game",          label: "War Game",            icon: Swords, hot: true },
    { href: "/system-design",     label: "System Design",       icon: GitBranch },
    { href: "/mock-interview",    label: "Mock Interview",      icon: Mic },
    { href: "/refatoracao",       label: "Refatoração Guiada",  icon: Sparkles },
    { href: "/architecture-audit",label: "Architecture Audit",  icon: Activity },
    { href: "/rfc-writing",       label: "RFC Writing",         icon: FileText },
    { href: "/sprint-sem-ia",     label: "Sprint sem IA",       icon: FlaskConical },
    { href: "/banco-star",        label: "Banco STAR",          icon: Star },
  ],
  refletir: [
    { href: "/health-score",      label: "Health Score",            icon: Activity },
    { href: "/divida",            label: "Dívida de Conhecimento",  icon: AlertCircle },
    { href: "/biblioteca-erros",  label: "Erros Pessoais",          icon: BookOpen },
    { href: "/analytics",         label: "Analytics",               icon: BarChart2 },
    { href: "/dashboard",         label: "Dashboard",               icon: BarChart2 },
  ],
};

interface SidebarProgress {
  level: number;
  levelTitle: string;
  levelEmoji: string;
  streak: number;
  xpPercent: number;
  pendingDividas: number;
  cardDoneToday: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const verb = getActiveVerb(pathname);
  const items = VERB_ITEMS[verb];

  const [collapsed, setCollapsed] = useState(true);
  const [progress, setProgress] = useState<SidebarProgress | null>(null);

  // Load collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("brain.sidebarCollapsed");
      if (saved !== null) setCollapsed(saved === "true");
    } catch {}
  }, []);

  // Load progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem("brain.sidebarProgress");
      if (raw) setProgress(JSON.parse(raw) as SidebarProgress);
    } catch {}
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem("brain.sidebarCollapsed", String(next)); } catch {}
      return next;
    });
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <aside
      className={clsx(
        "fixed inset-y-0 left-0 z-30 flex flex-col top-12",
        "bg-card/95 backdrop-blur border-r border-line",
        "transform transition-all duration-200 ease-out",
        "hidden lg:flex",
        collapsed ? "w-14" : "w-56",
      )}
      onMouseEnter={() => !collapsed && undefined}
    >
      {/* Toggle button */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-4 w-6 h-6 rounded-full bg-card border border-line flex items-center justify-center text-muted hover:text-fg hover:bg-card-hover transition z-10 shadow-sm"
        title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        <span className="text-[10px] font-mono">{collapsed ? "›" : "‹"}</span>
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {items.map(({ href, label, icon: Icon, hot }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={clsx(
                "relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all",
                collapsed ? "justify-center" : "",
                active
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
                  : "text-muted hover:text-fg hover:bg-card-hover",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-amber-500" />
              )}
              <Icon className={clsx("w-4 h-4 shrink-0", active && "text-amber-500")} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  {hot && !active && (
                    <Flame className="w-3 h-3 text-amber-500 opacity-70 shrink-0" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer with progress */}
      <div className={clsx("px-2 py-2 border-t border-line space-y-2", collapsed && "px-1")}>
        {/* Progress compact */}
        {progress && !collapsed && (
          <div className="px-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">{progress.levelEmoji}</span>
                <div>
                  <p className="text-xs font-medium text-fg leading-tight">{progress.levelTitle}</p>
                  <p className="text-[10px] text-subtle">Nível {progress.level}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Flame className="w-3 h-3 shrink-0" />
                <span className="text-xs font-semibold">{progress.streak}d</span>
              </div>
            </div>
            <div className="h-1 rounded-full bg-card-hover overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                style={{ width: `${progress.xpPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!progress.cardDoneToday && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                  card do dia
                </span>
              )}
              {progress.pendingDividas > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500 font-medium">
                  {progress.pendingDividas} dívida{progress.pendingDividas > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Collapsed: streak indicator only */}
        {progress && collapsed && (
          <div className="flex justify-center py-1">
            <div className="flex items-center gap-0.5 text-amber-500" title={`Streak: ${progress.streak} dias`}>
              <Flame className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">{progress.streak}</span>
            </div>
          </div>
        )}

        {!collapsed && (
          <div className="flex items-center justify-between gap-1 px-1">
            <AuthWidget />
            <ThemeToggle />
          </div>
        )}
      </div>
    </aside>
  );
}
