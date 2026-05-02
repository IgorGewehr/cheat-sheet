"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

interface DamageStats {
  addedLines: number;
  changedFiles: number;
  commitsToday: number;
  tsErrors: number;
  lintErrors: number;
  untested: number;
}

export function DamageMeter() {
  const [stats, setStats] = useState<DamageStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cli/damage-meter");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Erro ao buscar damage stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const onFocus = () => fetchStats();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!stats) return null;

  const totalErrors = stats.tsErrors + stats.lintErrors;
  const isDanger = stats.addedLines > 100 || totalErrors > 0;

  return (
    <div
      className={clsx(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition cursor-default",
        isDanger
          ? "border-amber-500/40 text-amber-600 dark:text-amber-300 bg-amber-500/10"
          : "border-line text-muted bg-card-hover",
        loading && "opacity-70"
      )}
      title="Damage Meter (Atualizado no foco)"
    >
      {isDanger ? (
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <Activity className="w-3.5 h-3.5 shrink-0" />
      )}
      <span className="font-medium whitespace-nowrap">
        {stats.addedLines} L · {stats.changedFiles} arq
        {totalErrors > 0 && ` · ${totalErrors} err`}
      </span>
    </div>
  );
}
