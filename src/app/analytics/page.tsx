"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2, TrendingUp, AlertTriangle, BookOpen } from "lucide-react";
import { Card, Tag } from "@/components/ui";
import { listAllAdocoes, listProjects } from "@/lib/db";
import type { Adocao, AdocaoStatus } from "@/lib/types";
import { ADOCAO_STATUS_LABEL, CATEGORY_LABEL } from "@/lib/types";

type CardSlugStats = {
  slug: string;
  title: string;
  category: string;
  counts: Record<AdocaoStatus, number>;
  total: number;
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CardSlugStats[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [totalAdocoes, setTotalAdocoes] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [adocoes, projects] = await Promise.all([listAllAdocoes(), listProjects()]);
        setProjectCount(projects.length);
        setTotalAdocoes(adocoes.length);

        const map = new Map<string, CardSlugStats>();
        for (const a of adocoes) {
          if (!map.has(a.cardSlug)) {
            map.set(a.cardSlug, {
              slug: a.cardSlug,
              title: a.cardSlug,
              category: "",
              counts: { adotado: 0, revisar: 0, dificuldade: 0, "outra-abordagem": 0 },
              total: 0,
            });
          }
          const entry = map.get(a.cardSlug)!;
          const st = (a.status ?? "adotado") as AdocaoStatus;
          entry.counts[st]++;
          entry.total++;
        }

        setStats(
          Array.from(map.values()).sort((a, b) => b.total - a.total),
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const topAdotados = stats.filter((s) => s.counts.adotado > 0).slice(0, 8);
  const topDificuldade = stats.filter((s) => s.counts.dificuldade > 0).slice(0, 6);
  const topRevisar = stats.filter((s) => s.counts.revisar > 0).slice(0, 6);

  const statusColors: Record<AdocaoStatus, string> = {
    adotado: "bg-emerald-500",
    revisar: "bg-amber-500",
    dificuldade: "bg-red-500",
    "outra-abordagem": "bg-violet-400",
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-amber-500" />
          Analytics de Adoção
        </h1>
        <p className="text-muted max-w-2xl">
          Visão geral de quais padrões você mais adota, onde há dificuldade, e o que precisa de revisão.
        </p>
      </header>

      {loading ? (
        <p className="text-muted">Carregando dados…</p>
      ) : totalAdocoes === 0 ? (
        <Card>
          <p className="text-muted mb-3">Nenhuma adoção registrada ainda.</p>
          <p className="text-xs text-subtle">
            Adote padrões nos seus projetos para ver os analytics aqui.
          </p>
          <div className="mt-4">
            <Link href="/biblioteca" className="text-sm text-amber-600 dark:text-amber-400 hover:underline">
              Ir para a Biblioteca →
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Métricas gerais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs uppercase text-muted mb-1">Total de adoções</p>
              <p className="text-3xl font-semibold">{totalAdocoes}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase text-muted mb-1">Padrões únicos usados</p>
              <p className="text-3xl font-semibold">{stats.length}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase text-muted mb-1">Projetos rastreados</p>
              <p className="text-3xl font-semibold">{projectCount}</p>
            </Card>
          </div>

          {/* Status breakdown */}
          <Card>
            <p className="text-sm font-semibold mb-4">Distribuição de status</p>
            <div className="space-y-3">
              {(["adotado", "revisar", "dificuldade", "outra-abordagem"] as AdocaoStatus[]).map((status) => {
                const count = stats.reduce((sum, s) => sum + s.counts[status], 0);
                const pct = totalAdocoes > 0 ? Math.round((count / totalAdocoes) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs text-muted w-32 shrink-0">{ADOCAO_STATUS_LABEL[status]}</span>
                    <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${statusColors[status]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted w-16 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top adotados */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Mais adotados
              </h2>
              {topAdotados.length === 0 ? (
                <p className="text-sm text-muted">Nenhum padrão marcado como adotado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {topAdotados.map((s) => (
                    <div key={s.slug} className="flex items-center gap-3 p-3 rounded-lg border border-line bg-card">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/biblioteca/${s.slug}`}
                          className="text-sm font-medium hover:text-amber-600 dark:hover:text-amber-400 transition block truncate"
                        >
                          {s.title !== s.slug ? s.title : s.slug}
                        </Link>
                      </div>
                      <Tag color="emerald">{s.counts.adotado}x</Tag>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Com dificuldade */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Com dificuldade
              </h2>
              {topDificuldade.length === 0 ? (
                <Card>
                  <p className="text-sm text-muted">Nenhum padrão marcado com dificuldade.</p>
                  <p className="text-xs text-subtle mt-1">Bom sinal — ou você ainda não tem muitos dados.</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {topDificuldade.map((s) => (
                    <div key={s.slug} className="flex items-center gap-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/biblioteca/${s.slug}`}
                          className="text-sm font-medium hover:text-red-500 transition block truncate"
                        >
                          {s.slug}
                        </Link>
                      </div>
                      <Tag color="zinc">{s.counts.dificuldade}x</Tag>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Para revisar */}
          {topRevisar.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" /> Para revisar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {topRevisar.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/biblioteca/${s.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/50 transition"
                  >
                    <span className="text-sm truncate">{s.slug}</span>
                    <Tag color="amber">{s.counts.revisar}x</Tag>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
