"use client";

import { useEffect, useState } from "react";
import { Target, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { Card } from "@/components/ui";
import { clsx } from "clsx";
import type { RadarAxis } from "@/components/radar-chart";
import type { DividaConhecimento } from "@/lib/types";

export function DailyQuestWidget({ axes, dividas }: { axes: RadarAxis[]; dividas: DividaConhecimento[] }) {
  const [quest, setQuest] = useState<{ title: string; subtitle: string; icon: any; color: string; done?: boolean; border: string; bg: string } | null>(null);

  useEffect(() => {
    // Generate Quest deterministically based on date and props
    const today = new Date().toISOString().split("T")[0];
    const storageKey = `brain.dailyQuestDone_${today}`;
    const isDone = localStorage.getItem(storageKey) === "true";

    const decayingAxis = axes.find(a => a.decaying);
    const pendingDivida = dividas.find(d => d.status === "pendente");

    if (decayingAxis) {
      setQuest({
        title: `Alerta de Deterioração: ${decayingAxis.label}`,
        subtitle: `Você não pratica ${decayingAxis.label} há mais de 30 dias. Revise ou adote uma tecnologia hoje!`,
        icon: AlertTriangle,
        color: "text-red-500",
        border: "border-l-red-500",
        bg: "bg-red-500/5",
        done: isDone
      });
    } else if (pendingDivida) {
      setQuest({
        title: "Dívida Técnica Pendente",
        subtitle: "Você tem um débito técnico precisando de atenção. Vá até a aba Accountability.",
        icon: Target,
        color: "text-amber-500",
        border: "border-l-amber-500",
        bg: "bg-amber-500/5",
        done: isDone
      });
    } else {
      setQuest({
        title: "Rotina de Excelência",
        subtitle: "Suas skills estão afiadas. Estude 1 card hoje para manter seu bônus de consistência.",
        icon: ShieldCheck,
        color: "text-emerald-500",
        border: "border-l-emerald-500",
        bg: "bg-emerald-500/5",
        done: isDone
      });
    }
  }, [axes, dividas]);

  if (!quest) return null;

  return (
    <Card className={clsx("p-4 border-l-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors", quest.done ? "border-l-emerald-500 bg-emerald-500/5 opacity-70" : `${quest.border} ${quest.bg}`)}>
      <div className="flex items-center gap-4">
        <div className={clsx("p-2.5 rounded-xl bg-card shadow-sm border border-line", quest.color)}>
          <quest.icon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-fg leading-tight">{quest.title}</h3>
            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-card-hover text-muted border border-line shadow-sm">Daily Quest</span>
          </div>
          <p className="text-sm text-muted">{quest.subtitle}</p>
        </div>
      </div>
      <div className="shrink-0 flex items-center justify-end w-full md:w-auto border-t border-line md:border-t-0 pt-3 md:pt-0">
        {quest.done ? (
          <span className="text-sm font-semibold text-emerald-500 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-lg">
            <ShieldCheck className="w-4 h-4" /> Concluída
          </span>
        ) : (
          <div className="text-right flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-amber-500 flex items-center justify-end gap-1">
                +150 <Zap className="w-3.5 h-3.5 fill-amber-500" />
              </p>
              <p className="text-[10px] text-muted uppercase font-medium">Recompensa</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
