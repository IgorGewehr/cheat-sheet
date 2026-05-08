"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Menu, Search, Settings2, X } from "lucide-react";
import { clsx } from "clsx";
import { ThemeToggle } from "./theme-toggle";
import { AuthWidget } from "./auth-widget";
import { ProjectPill } from "./project-pill";
import { TaskPill } from "./task-pill";
import { DamageMeter } from "./damage-meter";

export type Verb = "estudar" | "treinar" | "refletir";

const VERB_ROUTES: Record<Verb, string[]> = {
  estudar: ["/biblioteca", "/trilha", "/card-do-dia", "/mapa-dominio", "/retrospectiva", "/skills"],
  treinar: [
    "/debate", "/math-quest", "/anti-pattern", "/war-game",
    "/system-design", "/mock-interview", "/refatoracao", "/architecture-audit",
    "/rfc-writing", "/sprint-sem-ia", "/banco-star",
  ],
  refletir: ["/health-score", "/divida", "/biblioteca-erros", "/analytics", "/dashboard"],
};

const VERB_LABELS: Record<Verb, string> = {
  estudar: "Estudar",
  treinar: "Treinar",
  refletir: "Refletir",
};

// Primary route for each verb (used by verb-switch in Cmd+K)
export const VERB_PRIMARY: Record<Verb, string> = {
  estudar: "/trilha",
  treinar: "/debate",
  refletir: "/health-score",
};

export function getActiveVerb(pathname: string): Verb {
  for (const [verb, routes] of Object.entries(VERB_ROUTES) as [Verb, string[]][]) {
    if (routes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
      return verb;
    }
  }
  return "estudar";
}

interface TopNavProps {
  onCmdK?: () => void;
  cmdKTrigger?: React.ReactNode;
}

export function TopNav({ onCmdK, cmdKTrigger }: TopNavProps) {
  const pathname = usePathname();
  const activeVerb = getActiveVerb(pathname);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [drawerOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-line bg-card/95 backdrop-blur">
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-12 max-w-screen-2xl mx-auto">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group mr-1 sm:mr-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center shadow-sm group-hover:shadow-violet-500/30 group-hover:shadow-md transition-shadow">
              <Brain className="w-4 h-4 text-zinc-950" />
            </div>
            <span className="text-sm font-semibold tracking-tight hidden sm:block">brain</span>
          </Link>

          {/* Verb pills — hidden on mobile, drawer instead */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {(Object.entries(VERB_LABELS) as [Verb, string][]).map(([verb, label]) => {
              const isActive = activeVerb === verb;
              return (
                <Link
                  key={verb}
                  href={VERB_PRIMARY[verb]}
                  className={clsx(
                    "px-3 py-1.5 rounded-md text-sm transition",
                    isActive
                      ? "font-bold text-violet-600 dark:text-violet-300 underline underline-offset-4 decoration-violet-500"
                      : "text-muted hover:text-fg hover:bg-card-hover",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile: active verb chip (tap to open drawer) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm flex-1 min-w-0"
            style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.4)" }}
            aria-label="Abrir menu"
          >
            <Menu className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="font-bold text-violet-600 dark:text-violet-300 truncate">
              {VERB_LABELS[activeVerb]}
            </span>
          </button>

          {/* Right side */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Pills — hidden on mobile (drawer) */}
            <div className="hidden md:flex items-center gap-2">
              <TaskPill />
              <DamageMeter />
              <ProjectPill />
            </div>

            {/* Cmd+K trigger */}
            {cmdKTrigger ?? (
              <button
                onClick={onCmdK}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-line text-xs text-muted hover:text-fg hover:border-violet-500/40 hover:bg-card-hover transition"
                title="Buscar (Cmd+K)"
                aria-label="Buscar"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buscar</span>
                <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-card-hover text-[10px] font-mono text-subtle">⌘K</kbd>
              </button>
            )}

            <Link
              href="/workspace"
              className={clsx(
                "hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-line transition",
                pathname === "/workspace"
                  ? "border-violet-500/60 text-violet-400 bg-violet-500/10"
                  : "text-muted hover:text-fg hover:border-violet-500/40 hover:bg-card-hover",
              )}
              title="Workspace / Integrações"
            >
              <Settings2 className="w-4 h-4" />
            </Link>

            <AuthWidget />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside
            className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[80vw] max-w-xs bg-card border-r border-line shadow-2xl flex flex-col"
            style={{ animation: "slideInLeft 0.18s ease-out" }}
          >
            <div className="flex items-center justify-between px-4 h-12 border-b border-line shrink-0">
              <span className="text-sm font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-card-hover transition"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-subtle px-2 py-1.5">Modos</div>
              {(Object.entries(VERB_LABELS) as [Verb, string][]).map(([verb, label]) => {
                const isActive = activeVerb === verb;
                return (
                  <Link
                    key={verb}
                    href={VERB_PRIMARY[verb]}
                    className={clsx(
                      "block px-3 py-2.5 rounded-lg text-sm transition",
                      isActive
                        ? "font-bold text-violet-600 dark:text-violet-300 bg-violet-500/10 border border-violet-500/30"
                        : "text-fg hover:bg-card-hover border border-transparent",
                    )}
                  >
                    {label}
                  </Link>
                );
              })}

              <div className="text-[10px] uppercase tracking-wider text-subtle px-2 pt-4 pb-1.5">Status</div>
              <div className="px-2 space-y-2">
                <TaskPill />
                <DamageMeter />
                <ProjectPill />
              </div>

              <div className="text-[10px] uppercase tracking-wider text-subtle px-2 pt-4 pb-1.5">Outros</div>
              <Link
                href="/workspace"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-fg hover:bg-card-hover transition"
              >
                <Settings2 className="w-4 h-4" />
                Workspace / Integrações
              </Link>
            </nav>
          </aside>

          <style jsx>{`
            @keyframes slideInLeft {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}
    </>
  );
}
