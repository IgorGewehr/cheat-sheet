"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";

const LS_CURRENT = "brain.mp.current";
const LS_MAX     = "brain.mp.max";
const LS_RESET   = "brain.mp.lastReset";

export function resetManaIfNewDay(): void {
  if (typeof window === "undefined") return;
  try {
    const last = localStorage.getItem(LS_RESET);
    const today = new Date().toISOString().split("T")[0];
    if (last !== today) {
      const max = parseInt(localStorage.getItem(LS_MAX) ?? "100", 10);
      localStorage.setItem(LS_CURRENT, String(max));
      localStorage.setItem(LS_RESET, today);
    }
  } catch {}
}

export function consumeMana(amount: number): boolean {
  if (typeof window === "undefined") return false;
  try {
    resetManaIfNewDay();
    const current = parseInt(localStorage.getItem(LS_CURRENT) ?? "100", 10);
    if (current < amount) return false;
    localStorage.setItem(LS_CURRENT, String(current - amount));
    window.dispatchEvent(new Event("brain.mp.change"));
    return true;
  } catch {
    return false;
  }
}

interface ManaBarProps {
  variant?: "compact" | "full";
  className?: string;
}

export function ManaBar({ variant = "compact", className }: ManaBarProps) {
  const [current, setCurrent] = useState(100);
  const [max, setMax]         = useState(100);

  function read() {
    try {
      resetManaIfNewDay();
      const c = parseInt(localStorage.getItem(LS_CURRENT) ?? "100", 10);
      const m = parseInt(localStorage.getItem(LS_MAX)     ?? "100", 10);
      setCurrent(c);
      setMax(m);
    } catch {}
  }

  useEffect(() => {
    read();
    window.addEventListener("brain.mp.change", read);
    return () => window.removeEventListener("brain.mp.change", read);
  }, []);

  const pct = max === 0 ? 0 : Math.round((current / max) * 100);
  const depleted = pct === 0;
  const low      = pct <= 25;

  if (variant === "compact") {
    return (
      <div
        className={clsx("flex items-center gap-1.5 group relative", className)}
        title={`MP: ${current}/${max} — Mana usada em dicas do /math-quest`}
      >
        <span className="text-[10px] font-mono font-bold text-cyan-500 dark:text-[var(--hunter-cyan)] select-none">MP</span>
        <div className="w-14 h-1.5 rounded-full bg-zinc-700/60 overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-500",
              depleted ? "bg-red-500 animate-pulse" :
              low      ? "bg-orange-500" :
                         "bg-gradient-to-r from-cyan-500 to-violet-500",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-zinc-500 tabular-nums">{pct}%</span>
      </div>
    );
  }

  return (
    <div className={clsx("space-y-1", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-cyan-500 dark:text-[var(--hunter-cyan)] uppercase tracking-widest">MP</span>
        <span className={clsx("text-xs font-mono tabular-nums", depleted ? "text-red-400" : "text-zinc-400")}>
          {current} / {max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-700",
            depleted ? "bg-red-500 animate-pulse" :
            low      ? "bg-orange-500" :
                       "bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {depleted && (
        <p className="text-[10px] font-mono text-red-400/80">Mana esgotada — recarrega à meia-noite</p>
      )}
    </div>
  );
}
