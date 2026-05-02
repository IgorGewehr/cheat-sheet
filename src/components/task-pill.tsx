"use client";

import { useEffect, useRef, useState } from "react";
import { Target, X, ShieldAlert, Hourglass, Zap } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { getActiveTask, setActiveTask, onActiveTaskChange, type ActiveTask } from "@/lib/active-task";

export function TaskPill() {
  const [task, setTask] = useState<ActiveTask | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTask(getActiveTask());
    return onActiveTaskChange(() => setTask(getActiveTask()));
  }, []);

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

  if (!task) return null;

  const elapsedMin = Math.floor((Date.now() - task.startedAt) / 60000);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition",
          "border-violet-500/40 text-violet-600 dark:text-violet-300 bg-violet-500/10 hover:bg-violet-500/15",
        )}
        title={task.titulo}
      >
        <Target className="w-3.5 h-3.5 shrink-0" />
        <span className="max-w-[160px] truncate font-medium">{task.titulo}</span>
        <span className="text-[10px] text-muted hidden md:inline">{elapsedMin}m</span>
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 w-72 rounded-xl border border-line bg-card shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-line">
            <p className="text-[10px] uppercase tracking-wide text-muted mb-0.5">Tarefa atual</p>
            <p className="text-sm font-medium text-fg leading-tight">{task.titulo}</p>
            <p className="text-[10px] text-subtle mt-1">
              iniciada {new Date(task.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              {task.dominios.length > 0 && ` · ${task.dominios.join(", ")}`}
            </p>
          </div>

          <div className="p-1">
            <Link
              href="/sessao"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md text-sm hover:bg-card-hover transition"
            >
              <Zap className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span>Briefing</span>
              {task.briefing && <span className="ml-auto text-[10px] text-emerald-500">✓</span>}
            </Link>
            <Link
              href="/idle"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md text-sm hover:bg-card-hover transition"
            >
              <Hourglass className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span>Idle (enquanto IA gera)</span>
              {task.idleSessionIds.length > 0 && (
                <span className="ml-auto text-[10px] text-muted">{task.idleSessionIds.length}</span>
              )}
            </Link>
            <Link
              href="/sentinela"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md text-sm hover:bg-card-hover transition"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span>Auditar saída</span>
              {task.sentinelaSessionIds.length > 0 && (
                <span className="ml-auto text-[10px] text-muted">{task.sentinelaSessionIds.length}</span>
              )}
            </Link>
          </div>

          <div className="border-t border-line">
            <button
              onClick={() => {
                setActiveTask(null);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted hover:text-red-500 hover:bg-card-hover transition"
            >
              <X className="w-3 h-3" />
              Encerrar tarefa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
