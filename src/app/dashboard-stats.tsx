"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAllAdocoes, listProjects } from "@/lib/db";
import { Card, LinkButton, Tag } from "@/components/ui";
import { SignedOutBanner } from "@/components/signed-out-banner";
import { useAuth } from "@/lib/auth-context";
import type { Adocao, Project } from "@/lib/types";

const STEPS = [
  { n: 1, label: "Crie seu primeiro projeto", href: "/projetos/novo", done: (p: number) => p > 0 },
  { n: 2, label: "Explore a Biblioteca e adote padrões", href: "/biblioteca", done: (_: number, a: number) => a > 0 },
  { n: 3, label: "Rode um checklist num PR gerado por IA", href: "/biblioteca/audit-api-endpoint", done: () => false },
  { n: 4, label: "Gere um prompt turbo para seu módulo", href: "/prompts", done: () => false },
];

export function DashboardStats({ totalCards }: { totalCards: number }) {
  const { signedIn } = useAuth();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [adocoes, setAdocoes] = useState<Adocao[] | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (!signedIn) {
      setProjects([]);
      setAdocoes([]);
      setIsNew(false);
      return;
    }
    (async () => {
      try {
        const [ps, ads] = await Promise.all([listProjects(), listAllAdocoes()]);
        setProjects(ps);
        setAdocoes(ads);
        setIsNew(ps.length === 0 && ads.length === 0);
      } catch (err) {
        console.error(err);
        setProjects([]);
        setAdocoes([]);
      }
    })();
  }, [signedIn]);

  const pCount = projects?.length ?? 0;
  const aCount = adocoes?.length ?? 0;
  const recent = projects?.slice(0, 5) ?? [];

  return (
    <div className="space-y-5">
      <SignedOutBanner />

      {/* Welcome banner para novos usuários */}
      {isNew && signedIn && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
          <h2 className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
            Bem-vindo ao brain!
          </h2>
          <p className="text-sm text-muted mb-4">
            Siga esses 4 passos para começar a supervisionar código de IA como sênior:
          </p>
          <ol className="space-y-2">
            {STEPS.map(({ n, label, href, done }) => {
              const isDone = done(pCount, aCount);
              return (
                <li key={n} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isDone ? "bg-emerald-500 text-white" : "bg-amber-500/20 text-amber-600 dark:text-amber-400"}`}>
                    {isDone ? "✓" : n}
                  </span>
                  <Link href={href} className="text-sm hover:text-amber-600 dark:hover:text-amber-300 transition">
                    {label}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs uppercase text-muted mb-1">Cards na biblioteca</p>
          <p className="text-3xl font-semibold">{totalCards}</p>
          <div className="mt-3">
            <Link href="/biblioteca" className="text-xs text-amber-600 dark:text-amber-400 hover:underline">
              Explorar biblioteca →
            </Link>
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase text-muted mb-1">Projetos rastreados</p>
          <p className="text-3xl font-semibold">{projects === null ? "…" : pCount}</p>
          {recent.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {recent.map((p) => (
                <li key={p.id}>
                  <Link href={`/projetos/${p.id}`} className="text-sm text-muted hover:text-amber-600 dark:hover:text-amber-300">
                    {p.nome}
                  </Link>
                </li>
              ))}
            </ul>
          ) : projects !== null && pCount === 0 ? (
            <div className="mt-3">
              <LinkButton href="/projetos/novo" variant="secondary" className="text-xs px-3 py-1.5 h-auto">
                + Criar projeto
              </LinkButton>
            </div>
          ) : null}
        </Card>

        <Card>
          <p className="text-xs uppercase text-muted mb-1">Padrões adotados</p>
          <p className="text-3xl font-semibold">{adocoes === null ? "…" : aCount}</p>
          {aCount > 0 ? (
            <div className="mt-3">
              <Link href="/analytics" className="text-xs text-amber-600 dark:text-amber-400 hover:underline">
                Ver analytics →
              </Link>
            </div>
          ) : (
            <div className="mt-3"><Tag color="amber">Marque enquanto decide</Tag></div>
          )}
        </Card>
      </div>
    </div>
  );
}
