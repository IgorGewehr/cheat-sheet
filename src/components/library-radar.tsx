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
    <div className="glass p-6 rounded-2xl border border-violet-500/15">
      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6 items-start">
        <div className="w-full max-w-[360px] aspect-square mx-auto">
          <RadarChart axes={axes} size={360} />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold text-fg mb-1">Evolução de Domínios</h3>
            <p className="text-sm text-muted leading-relaxed">
              O estudo de cards e a adoção prática de arquiteturas na aba Projetos formam sua teia de skills. Aqui estão seus maiores destaques:
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {axes.sort((a, b) => b.value - a.value).slice(0, 4).map((ax) => (
              <div
                key={ax.label}
                className="flex items-center text-sm px-3 py-1.5 rounded-lg border border-violet-500/20 bg-violet-500/5 text-violet-300 hover:bg-violet-500/10 transition-colors cursor-default"
              >
                <span className="font-medium">{ax.label}</span>
                <span className="ml-2 text-violet-400/70">{ax.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
