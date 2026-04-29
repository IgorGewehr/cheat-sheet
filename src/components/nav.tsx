"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Brain, BookOpen, FolderKanban, Settings, BarChart2, Sparkles, Zap, Scale, Flame } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";
import { AuthWidget } from "./auth-widget";

const items = [
  { href: "/",           label: "Dashboard",  icon: Brain },
  { href: "/sessao",     label: "Sessão IA",  icon: Zap,      hot: true },
  { href: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/comparar",   label: "Comparar",   icon: Scale,    hot: true },
  { href: "/projetos",   label: "Projetos",   icon: FolderKanban },
  { href: "/prompts",    label: "Prompts",    icon: Sparkles },
  { href: "/analytics",  label: "Analytics",  icon: BarChart2 },
  { href: "/workspace",  label: "Workspace",  icon: Settings },
];

export function Nav({ commandPalette }: { commandPalette?: ReactNode }) {
  const pathname = usePathname();
  return (
    <nav
      className="border-b border-line sticky top-0 z-10 backdrop-blur"
      style={{ background: "var(--nav)" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold shrink-0">
          <Brain className="w-5 h-5" />
          brain
        </Link>
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {items.map(({ href, label, icon: Icon, hot }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition whitespace-nowrap",
                  active
                    ? "bg-card-hover text-fg"
                    : "text-muted hover:text-fg hover:bg-card",
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
                {hot && !active && (
                  <Flame className="w-3 h-3 text-amber-500 opacity-70" />
                )}
              </Link>
            );
          })}
        </div>
        <div className="ml-auto shrink-0 flex items-center gap-2">
          {commandPalette}
          <ThemeToggle />
          <AuthWidget />
        </div>
      </div>
    </nav>
  );
}
