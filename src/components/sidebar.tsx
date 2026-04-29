"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Brain, BookOpen, FolderKanban, Settings, BarChart2, Sparkles, Zap,
  Scale, Flame, Menu, X,
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
    label: "Conhecimento",
    items: [
      { href: "/biblioteca", label: "Biblioteca", icon: BookOpen },
      { href: "/prompts",    label: "Prompts",    icon: Sparkles },
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

export function Sidebar({ commandPalette }: { commandPalette?: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
