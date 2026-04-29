"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, FolderKanban, Sparkles, Zap, Scale, BarChart2, Settings, FileText } from "lucide-react";
import Fuse from "fuse.js";
import { CATEGORY_LABEL, type CardCategory } from "@/lib/types";

type IconType = typeof BookOpen;

type Item = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  type: "page" | "card" | "project";
  icon: IconType;
};

type Props = {
  cards: { slug: string; title: string; category: string; excerpt: string }[];
  projects?: { id: string; nome: string; tipo?: string }[];
};

const PAGES: Item[] = [
  { id: "p:dashboard",  label: "Dashboard",       href: "/",            type: "page", icon: BarChart2 },
  { id: "p:sessao",     label: "Sessão IA",       hint: "briefing pra pré-IA", href: "/sessao",      type: "page", icon: Zap },
  { id: "p:biblioteca", label: "Biblioteca",      hint: "cards de padrão",     href: "/biblioteca",  type: "page", icon: BookOpen },
  { id: "p:comparar",   label: "Comparar",        hint: "matriz de decisão",   href: "/comparar",    type: "page", icon: Scale },
  { id: "p:projetos",   label: "Projetos",        href: "/projetos",    type: "page", icon: FolderKanban },
  { id: "p:prompts",    label: "Prompts",         href: "/prompts",     type: "page", icon: Sparkles },
  { id: "p:analytics",  label: "Analytics",       href: "/analytics",   type: "page", icon: BarChart2 },
  { id: "p:workspace",  label: "Workspace",       href: "/workspace",   type: "page", icon: Settings },
];

export function CommandPalette({ cards, projects = [] }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const projectItems: Item[] = projects.map((p) => ({
      id: `proj:${p.id}`,
      label: p.nome,
      hint: p.tipo,
      href: `/projetos/${p.id}`,
      type: "project",
      icon: FolderKanban,
    }));
    const cardItems: Item[] = cards.map((c) => ({
      id: `card:${c.slug}`,
      label: c.title,
      hint: CATEGORY_LABEL[c.category as CardCategory] ?? c.category,
      href: `/biblioteca/${c.slug}`,
      type: "card",
      icon: FileText,
    }));
    return [...PAGES, ...projectItems, ...cardItems];
  }, [cards, projects]);

  const fuse = useMemo(
    () => new Fuse(items, {
      keys: [{ name: "label", weight: 0.7 }, { name: "hint", weight: 0.3 }],
      threshold: 0.4,
      ignoreLocation: true,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) {
      // top: pages first, then 8 latest cards
      return [...PAGES, ...items.filter((i) => i.type !== "page").slice(0, 12)];
    }
    return fuse.search(query).slice(0, 30).map((r) => r.item);
  }, [query, fuse, items]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    setIdx(0);
  }, [query]);

  function go(i: Item) {
    setOpen(false);
    router.push(i.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((v) => Math.min(v + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((v) => Math.max(v - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[idx]) go(filtered[idx]);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md border border-line text-muted hover:text-fg hover:bg-card-hover transition"
        title="Buscar (Cmd+K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Buscar</span>
        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-card text-[10px] font-mono text-subtle">⌘K</kbd>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md border border-line text-muted hover:text-fg hover:bg-card-hover transition"
        title="Buscar (Cmd+K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Buscar</span>
        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-card text-[10px] font-mono text-subtle">⌘K</kbd>
      </button>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      >
        <div
          className="w-full max-w-xl mx-4 bg-card rounded-xl shadow-2xl border border-line overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 p-3 border-b border-line">
            <Search className="w-4 h-4 text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Buscar página, card ou projeto…"
              className="flex-1 bg-transparent text-fg placeholder:text-subtle outline-none text-sm"
            />
            <kbd className="px-1.5 py-0.5 text-[10px] bg-card-hover text-muted rounded font-mono">ESC</kbd>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-subtle">
                Nada encontrado pra <strong>“{query}”</strong>
              </div>
            ) : (
              filtered.map((item, i) => {
                const Icon = item.icon;
                const active = i === idx;
                return (
                  <button
                    key={item.id}
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => go(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition text-sm ${
                      active ? "bg-amber-500/15 text-fg" : "text-muted hover:bg-card-hover"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-amber-500" : "text-subtle"}`} />
                    <span className="font-medium truncate flex-1">{item.label}</span>
                    {item.hint && (
                      <span className="text-[11px] text-subtle truncate max-w-[160px]">{item.hint}</span>
                    )}
                    <span className={`text-[10px] uppercase tracking-wide font-mono ${
                      active ? "text-amber-600 dark:text-amber-400" : "text-subtle"
                    }`}>
                      {item.type}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-3 py-2 border-t border-line text-[10px] text-subtle flex items-center gap-3 font-mono">
            <span><kbd className="px-1 rounded bg-card-hover">↑↓</kbd> navegar</span>
            <span><kbd className="px-1 rounded bg-card-hover">↵</kbd> abrir</span>
            <span><kbd className="px-1 rounded bg-card-hover">esc</kbd> fechar</span>
          </div>
        </div>
      </div>
    </>
  );
}
