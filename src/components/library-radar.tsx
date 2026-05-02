"use client";

import { useEffect, useState } from "react";
import { RadarChart, computeRadarAxes, type RadarAxis } from "@/components/radar-chart";
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
import type { Card as CardType } from "@/lib/types";

export function LibraryRadar({ allCards }: { allCards: CardType[] }) {
  const { signedIn } = useAuth();
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
    <div className="relative overflow-hidden bg-card/60 backdrop-blur-xl p-8 rounded-3xl border border-violet-500/20 shadow-[0_0_40px_-15px_rgba(139,92,246,0.15)]">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-center">
        <div className="flex flex-col gap-6 order-2 lg:order-1">
          <div>
            <h3 className="text-3xl font-bold mb-3 tracking-tight bg-gradient-to-br from-white to-violet-300 dark:from-white dark:to-violet-400 bg-clip-text text-transparent">
              Evolução de Domínios
            </h3>
            <p className="text-base text-muted leading-relaxed max-w-lg">
              Sua teia de skills em tempo real. Estude cards, passe por entrevistas e implemente adoções na aba Projetos para expandir seu radar. Aqui estão seus maiores destaques:
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-2">
            {axes.sort((a, b) => b.value - a.value).slice(0, 4).map((ax) => (
              <div
                key={ax.label}
                className="group flex items-center px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-400/50 transition-all cursor-default shadow-[0_0_15px_-3px_rgba(139,92,246,0.2)] hover:shadow-[0_0_20px_-3px_rgba(139,92,246,0.4)]"
              >
                <span className="text-base mr-2">{ax.emoji}</span>
                <span className="font-medium text-sm text-fg mr-3 group-hover:text-white transition-colors">{ax.label}</span>
                <span className="font-bold text-violet-400">{ax.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full order-1 lg:order-2 flex justify-center items-center">
          <RadarChart axes={axes} size={380} />
        </div>
      </div>
    </div>
  );
}
