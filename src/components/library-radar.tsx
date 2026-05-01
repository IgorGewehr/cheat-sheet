"use client";

import { useEffect, useState } from "react";
import { RadarChart, computeRadarAxes, type RadarAxis } from "@/components/radar-chart";
import { getAllCards } from "@/lib/content";
import {
  listTrilhaProgresso,
  listAllAdocoes,
  listAllDecisoes,
  listMockInterviews,
  listSprintsSemIA,
  listWarGames,
  listRFCSessions,
} from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui";

export function LibraryRadar() {
  const { user, signedIn } = useAuth();
  const [axes, setAxes] = useState<RadarAxis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!signedIn) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [trilha, adocoes, decisoes, interviews, sprints, warGames, rfcs] = await Promise.all([
          listTrilhaProgresso(),
          listAllAdocoes(),
          listAllDecisoes(),
          listMockInterviews(),
          listSprintsSemIA(),
          listWarGames(),
          listRFCSessions(),
        ]);
        const allCards = getAllCards();
        const computed = computeRadarAxes(trilha, allCards, interviews, sprints, warGames, rfcs, adocoes, decisoes);
        setAxes(computed);
      } catch (err) {
        console.error("Erro ao carregar radar na biblioteca:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [signedIn]);

  if (loading) {
    return <div className="h-40 w-full animate-pulse bg-card-hover rounded-xl" />;
  }

  if (!signedIn || axes.length === 0) return null;

  return (
    <Card className="p-6 border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="w-[180px] h-[180px] shrink-0 relative z-10 flex items-center justify-center">
        <RadarChart axes={axes} size={180} />
      </div>
      
      <div className="flex-1 relative z-10 text-center md:text-left">
        <h3 className="text-xl font-bold tracking-tight text-fg mb-2">Evolução de Domínios</h3>
        <p className="text-sm text-muted mb-4 max-w-lg">
          O estudo de cards e a adoção prática de arquiteturas na aba Projetos formam sua teia de skills. Aqui estão seus maiores destaques:
        </p>
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {axes.sort((a,b) => b.value - a.value).slice(0, 4).map(ax => (
            <div key={ax.label} className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 font-semibold flex items-center gap-1.5">
              <span>{ax.emoji}</span> {ax.label} <span className="opacity-70">{ax.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
