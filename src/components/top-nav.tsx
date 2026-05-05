"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Search, Settings2 } from "lucide-react";
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

  return (
    <>
    <header className="sticky top-0 z-40 w-full border-b border-line bg-card/95 backdrop-blur">
      <div className="flex items-center gap-2 px-4 h-12 max-w-screen-2xl mx-auto">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group mr-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center shadow-sm group-hover:shadow-violet-500/30 group-hover:shadow-md transition-shadow">
            <Brain className="w-4 h-4 text-zinc-950" />
          </div>
          <span className="text-sm font-semibold tracking-tight hidden sm:block">brain</span>
        </Link>

        {/* Verb pills */}
        <nav className="flex items-center gap-0.5 flex-1">
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

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <TaskPill />
          <DamageMeter />
          <ProjectPill />

          {/* Cmd+K trigger */}
          {cmdKTrigger ?? (
            <button
              onClick={onCmdK}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line text-xs text-muted hover:text-fg hover:border-violet-500/40 hover:bg-card-hover transition"
              title="Buscar (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buscar</span>
              <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-card-hover text-[10px] font-mono text-subtle">⌘K</kbd>
            </button>
          )}

          <Link
            href="/workspace"
            className={clsx(
              "flex items-center justify-center w-8 h-8 rounded-lg border border-line transition",
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
    </>
  );
}
