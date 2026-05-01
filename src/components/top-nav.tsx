"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Search } from "lucide-react";
import { clsx } from "clsx";
import { ThemeToggle } from "./theme-toggle";
import { AuthWidget } from "./auth-widget";
import { ProjectPill } from "./project-pill";

export type Verb = "trabalhar" | "estudar" | "treinar" | "refletir";

const VERB_ROUTES: Record<Verb, string[]> = {
  trabalhar: ["/sessao", "/comparar", "/fim-do-dia", "/gerar-card", "/projetos"],
  estudar: ["/biblioteca", "/trilha", "/card-do-dia", "/mapa-dominio", "/retrospectiva"],
  treinar: [
    "/revisor", "/anti-pattern", "/interrogatorio", "/mentoria", "/war-game",
    "/system-design", "/mock-interview", "/refatoracao", "/architecture-audit",
    "/rfc-writing", "/sprint-sem-ia", "/banco-star",
  ],
  refletir: ["/health-score", "/divida", "/biblioteca-erros", "/analytics", "/dashboard"],
};

const VERB_LABELS: Record<Verb, string> = {
  trabalhar: "Trabalhar",
  estudar: "Estudar",
  treinar: "Treinar",
  refletir: "Refletir",
};

// Primary route for each verb (used by verb-switch in Cmd+K)
export const VERB_PRIMARY: Record<Verb, string> = {
  trabalhar: "/sessao",
  estudar: "/biblioteca",
  treinar: "/revisor",
  refletir: "/health-score",
};

export function getActiveVerb(pathname: string): Verb {
  for (const [verb, routes] of Object.entries(VERB_ROUTES) as [Verb, string[]][]) {
    if (routes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
      return verb;
    }
  }
  return "trabalhar";
}

interface TopNavProps {
  onCmdK?: () => void;
  cmdKTrigger?: React.ReactNode;
}

export function TopNav({ onCmdK, cmdKTrigger }: TopNavProps) {
  const pathname = usePathname();
  const activeVerb = getActiveVerb(pathname);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-card/95 backdrop-blur">
      <div className="flex items-center gap-2 px-4 h-12 max-w-screen-2xl mx-auto">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group mr-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm group-hover:shadow-amber-500/30 group-hover:shadow-md transition-shadow">
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
                    ? "font-bold text-amber-600 dark:text-amber-400 underline underline-offset-4 decoration-amber-500"
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
          <ProjectPill />

          {/* Cmd+K trigger */}
          {cmdKTrigger ?? (
            <button
              onClick={onCmdK}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line text-xs text-muted hover:text-fg hover:border-amber-500/40 hover:bg-card-hover transition"
              title="Buscar (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buscar</span>
              <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-card-hover text-[10px] font-mono text-subtle">⌘K</kbd>
            </button>
          )}

          <AuthWidget />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
