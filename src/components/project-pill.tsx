"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FolderKanban } from "lucide-react";
import { clsx } from "clsx";
import { getActiveProject, setActiveProject, type ActiveProjectContext } from "@/lib/active-project";
import { subscribeProjects } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import type { Project } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ProjectPill() {
  const { signedIn } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<ActiveProjectContext | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Read active project from localStorage on mount
  useEffect(() => {
    setActive(getActiveProject());
  }, []);

  // Subscribe to projects when signed in
  useEffect(() => {
    if (!signedIn) { setProjects([]); return; }
    const unsub = subscribeProjects(setProjects);
    return () => unsub();
  }, [signedIn]);

  // Listen for brain:project-changed events
  useEffect(() => {
    function onChanged() {
      setActive(getActiveProject());
    }
    window.addEventListener("brain:project-changed", onChanged);
    return () => window.removeEventListener("brain:project-changed", onChanged);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function selectProject(p: Project) {
    const ctx: ActiveProjectContext = { id: p.id, nome: p.nome, stack: p.stack ?? [], tipo: p.tipo };
    setActiveProject(ctx);
    setActive(ctx);
    window.dispatchEvent(new Event("brain:project-changed"));
    setOpen(false);
  }

  const noProject = !active;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition",
          noProject
            ? "border-amber-500 border-dashed text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            : "border-line text-muted hover:text-fg hover:bg-card-hover",
        )}
        title={active?.nome ?? "Defina um projeto"}
      >
        <FolderKanban className="w-3.5 h-3.5 shrink-0" />
        <span className="max-w-[120px] truncate">
          {active?.nome ?? "Defina um projeto"}
        </span>
        <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 w-56 rounded-xl border border-line bg-card shadow-2xl z-50 overflow-hidden">
          {projects.length === 0 && (
            <div className="px-3 py-3 text-xs text-subtle">
              {signedIn ? "Nenhum projeto ainda" : "Faça login para ver projetos"}
            </div>
          )}
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProject(p)}
              className={clsx(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition hover:bg-card-hover",
                active?.id === p.id && "text-amber-600 dark:text-amber-400 font-medium",
              )}
            >
              <FolderKanban className="w-3.5 h-3.5 shrink-0 text-subtle" />
              <span className="truncate">{p.nome}</span>
              {active?.id === p.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
            </button>
          ))}
          <div className="border-t border-line">
            <Link
              href="/projetos"
              onClick={() => { setOpen(false); router.push("/projetos"); }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted hover:text-fg hover:bg-card-hover transition"
            >
              Gerenciar →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
