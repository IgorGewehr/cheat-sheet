"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search, BookOpen, FolderKanban, Sparkles, Zap, Scale, BarChart2, Settings,
  FileText, Eye, AlertTriangle, MessageSquareMore, Dumbbell, Swords, GitBranch,
  Mic, FlaskConical, Star, Activity, AlertCircle, Map, CalendarDays,
  TrendingUp, BookMarked, Moon, Clock, Plus,
} from "lucide-react";
import Fuse from "fuse.js";
import { CATEGORY_LABEL, type CardCategory } from "@/lib/types";
import { VERB_PRIMARY, type Verb } from "./top-nav";

type IconType = typeof BookOpen;

type Item = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  type: "page" | "card" | "project" | "verb" | "action";
  icon: IconType;
};

type Props = {
  cards: { slug: string; title: string; category: string; excerpt: string }[];
  projects?: { id: string; nome: string; tipo?: string }[];
};

const PAGES: Item[] = [
  // Trabalhar
  { id: "p:sessao",           label: "Sessão IA",           hint: "trabalhar · briefing pré-IA",          href: "/sessao",            type: "page", icon: Zap },
  { id: "p:comparar",         label: "Comparar",            hint: "trabalhar · matriz de decisão",         href: "/comparar",          type: "page", icon: Scale },
  { id: "p:fim-do-dia",       label: "Fim do Dia",          hint: "trabalhar · retrospectiva diária",      href: "/fim-do-dia",        type: "page", icon: Moon },
  { id: "p:gerar-card",       label: "Gerar Card c/ IA",    hint: "trabalhar · geração de cards",          href: "/gerar-card",        type: "page", icon: Sparkles },
  { id: "p:projetos",         label: "Projetos",            hint: "trabalhar · gerenciar projetos",        href: "/projetos",          type: "page", icon: FolderKanban },
  // Estudar
  { id: "p:biblioteca",       label: "Biblioteca",          hint: "estudar · cards de padrão",             href: "/biblioteca",        type: "page", icon: BookOpen },
  { id: "p:trilha",           label: "Trilha Sênior",       hint: "estudar · módulos de aprendizado",      href: "/trilha",            type: "page", icon: TrendingUp },
  { id: "p:card-do-dia",      label: "Card do Dia",         hint: "estudar · revisão diária",              href: "/card-do-dia",       type: "page", icon: CalendarDays },
  { id: "p:mapa-dominio",     label: "Mapa de Domínio",     hint: "estudar · visualizar domínio",          href: "/mapa-dominio",      type: "page", icon: Map },
  { id: "p:retrospectiva",    label: "Retrospectiva",       hint: "estudar · revisão periódica",           href: "/retrospectiva",     type: "page", icon: BookMarked },
  // Treinar
  { id: "p:revisor",          label: "Revisor Ativo",       hint: "treinar · revisão de código",           href: "/revisor",           type: "page", icon: Eye },
  { id: "p:anti-pattern",     label: "Anti-Pattern",        hint: "treinar · detectar anti-padrões",       href: "/anti-pattern",      type: "page", icon: AlertTriangle },
  { id: "p:interrogatorio",   label: "Interrogatório",      hint: "treinar · questionamento socrático",    href: "/interrogatorio",    type: "page", icon: MessageSquareMore },
  { id: "p:mentoria",         label: "Mentoria Invertida",  hint: "treinar · ensinar para aprender",       href: "/mentoria",          type: "page", icon: Dumbbell },
  { id: "p:war-game",         label: "War Game",            hint: "treinar · simulação de incidente",      href: "/war-game",          type: "page", icon: Swords },
  { id: "p:system-design",    label: "System Design",       hint: "treinar · design de sistemas",          href: "/system-design",     type: "page", icon: GitBranch },
  { id: "p:mock-interview",   label: "Mock Interview",      hint: "treinar · simulação de entrevista",     href: "/mock-interview",    type: "page", icon: Mic },
  { id: "p:refatoracao",      label: "Refatoração Guiada",  hint: "treinar · refatoração com IA",          href: "/refatoracao",       type: "page", icon: Sparkles },
  { id: "p:arch-audit",       label: "Architecture Audit",  hint: "treinar · auditoria de arquitetura",    href: "/architecture-audit",type: "page", icon: Activity },
  { id: "p:rfc-writing",      label: "RFC Writing",         hint: "treinar · escrever RFC",                href: "/rfc-writing",       type: "page", icon: FileText },
  { id: "p:sprint-sem-ia",    label: "Sprint sem IA",       hint: "treinar · foco sem IA",                 href: "/sprint-sem-ia",     type: "page", icon: FlaskConical },
  { id: "p:banco-star",       label: "Banco STAR",          hint: "treinar · histórias de entrevista",     href: "/banco-star",        type: "page", icon: Star },
  // Refletir
  { id: "p:health-score",     label: "Health Score",        hint: "refletir · saúde do projeto",           href: "/health-score",      type: "page", icon: Activity },
  { id: "p:divida",           label: "Dívida de Conhecimento", hint: "refletir · dívidas técnicas",        href: "/divida",            type: "page", icon: AlertCircle },
  { id: "p:biblioteca-erros", label: "Erros Pessoais",      hint: "refletir · aprender com erros",        href: "/biblioteca-erros",  type: "page", icon: BookOpen },
  { id: "p:analytics",        label: "Analytics",           hint: "refletir · métricas de uso",            href: "/analytics",         type: "page", icon: BarChart2 },
  { id: "p:dashboard",        label: "Dashboard",           hint: "refletir · visão geral",                href: "/dashboard",         type: "page", icon: BarChart2 },
  // System
  { id: "p:workspace",        label: "Workspace",           hint: "sistema · configurações",               href: "/workspace",         type: "page", icon: Settings },
];

const VERB_SWITCH_ITEMS: Item[] = (Object.entries(VERB_PRIMARY) as [Verb, string][]).map(([verb, href]) => ({
  id: `verb:${verb}`,
  label: `Ir para: ${verb.charAt(0).toUpperCase() + verb.slice(1)}`,
  hint: `ir para seção ${verb}`,
  href,
  type: "verb",
  icon: Zap,
}));

const QUICK_CAPTURE_ITEM: Item = {
  id: "action:quick-capture",
  label: "Captura Rápida",
  hint: "dívida · erro · abrir formulário",
  href: "#quick-capture",
  type: "action",
  icon: Plus,
};

const RECENT_KEY = "brain.cmdkRecents";
const MAX_RECENTS = 5;

function loadRecents(): Item[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Item[];
  } catch {
    return [];
  }
}

function saveRecent(item: Item) {
  if (typeof window === "undefined") return;
  if (item.type === "action" || item.type === "verb") return;
  try {
    const existing = loadRecents().filter((r) => r.id !== item.id);
    const updated = [item, ...existing].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

export function CommandPalette({ cards, projects = [] }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [recents, setRecents] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allItems = useMemo<Item[]>(() => {
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
    return [...PAGES, ...VERB_SWITCH_ITEMS, QUICK_CAPTURE_ITEM, ...projectItems, ...cardItems];
  }, [cards, projects]);

  const fuse = useMemo(
    () =>
      new Fuse(allItems, {
        keys: [
          { name: "label", weight: 0.6 },
          { name: "hint", weight: 0.4 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [allItems],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return [
        ...recents,
        ...PAGES.slice(0, 8),
        ...allItems.filter((i) => i.type !== "page" && i.type !== "verb").slice(0, 8),
      ].filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx);
    }
    // Quick-capture triggers
    const q = query.toLowerCase();
    if (["captura", "dívida", "divida", "erro", "bug"].some((kw) => q.includes(kw))) {
      return [QUICK_CAPTURE_ITEM, ...fuse.search(query).slice(0, 20).map((r) => r.item)];
    }
    return fuse.search(query).slice(0, 30).map((r) => r.item);
  }, [query, fuse, allItems, recents]);

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

  // Listen for external open event (e.g. from mobile nav)
  useEffect(() => {
    function onOpen() { setOpen(true); }
    window.addEventListener("brain:cmdk-open", onOpen);
    return () => window.removeEventListener("brain:cmdk-open", onOpen);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIdx(0);
      setRecents(loadRecents());
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    setIdx(0);
  }, [query]);

  const go = useCallback(
    (item: Item) => {
      setOpen(false);
      if (item.type === "action" && item.id === "action:quick-capture") {
        window.dispatchEvent(new Event("brain:quick-capture-open"));
        return;
      }
      saveRecent(item);
      router.push(item.href);
    },
    [router],
  );

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

  const trigger = (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line text-xs text-muted hover:text-fg hover:border-amber-500/40 hover:bg-card-hover transition"
      title="Buscar (Cmd+K)"
    >
      <Search className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Buscar</span>
      <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-card-hover text-[10px] font-mono text-subtle">⌘K</kbd>
    </button>
  );

  if (!open || !mounted) return trigger;

  function typeLabel(type: Item["type"]) {
    if (type === "verb") return "seção";
    if (type === "action") return "ação";
    return type;
  }

  const showRecentsSection = !query.trim() && recents.length > 0;

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl mx-4 bg-card rounded-xl shadow-2xl border border-line overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 p-3 border-b border-line">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar página, card, projeto ou verbo…"
            className="flex-1 bg-transparent text-fg placeholder:text-subtle outline-none text-sm"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] bg-card-hover text-muted rounded font-mono">ESC</kbd>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-1.5">
          {/* Recents section header */}
          {showRecentsSection && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-subtle uppercase tracking-wider font-semibold">
              <Clock className="w-3 h-3" />
              Recentes
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-subtle">
              Nada encontrado pra <strong>&ldquo;{query}&rdquo;</strong>
            </div>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              const active = i === idx;
              const isRecent = !query.trim() && recents.some((r) => r.id === item.id);
              return (
                <button
                  key={item.id}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => go(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition text-sm ${
                    active ? "bg-amber-500/15 text-fg" : "text-muted hover:bg-card-hover"
                  }`}
                >
                  {isRecent ? (
                    <Clock className={`w-4 h-4 shrink-0 ${active ? "text-amber-500" : "text-subtle"}`} />
                  ) : (
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-amber-500" : "text-subtle"}`} />
                  )}
                  <span className="font-medium truncate flex-1">{item.label}</span>
                  {item.hint && (
                    <span className="text-[11px] text-subtle truncate max-w-[160px]">{item.hint}</span>
                  )}
                  <span
                    className={`text-[10px] uppercase tracking-wide font-mono ${
                      active ? "text-amber-600 dark:text-amber-400" : "text-subtle"
                    }`}
                  >
                    {typeLabel(item.type)}
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
  );

  return (
    <>
      {trigger}
      {createPortal(modal, document.body)}
    </>
  );
}
