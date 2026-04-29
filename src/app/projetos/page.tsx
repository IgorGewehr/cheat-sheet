"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, LinkButton, Tag } from "@/components/ui";
import { SignedOutBanner } from "@/components/signed-out-banner";
import { useAuth } from "@/lib/auth-context";
import { listProjects } from "@/lib/db";
import {
  PROJECT_STATUS_LABEL,
  PROJECT_TYPE_COLOR,
  PROJECT_TYPE_LABEL,
  type Project,
  type ProjectType,
} from "@/lib/types";

const TIPOS: (ProjectType | "todos")[] = ["todos", "fullstack", "frontend", "backend", "microsservico"];

export default function ProjetosPage() {
  const { signedIn } = useAuth();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [filter, setFilter] = useState<ProjectType | "todos">("todos");

  useEffect(() => {
    if (!signedIn) {
      setProjects([]);
      return;
    }
    listProjects().then(setProjects).catch((e) => {
      console.error(e);
      setProjects([]);
    });
  }, [signedIn]);

  const filtered = useMemo(() => {
    if (!projects) return null;
    if (filter === "todos") return projects;
    return projects.filter((p) => p.tipo === filter);
  }, [projects, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: projects?.length ?? 0 };
    for (const p of projects ?? []) {
      const k = p.tipo ?? "sem-tipo";
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [projects]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Projetos</h1>
          <p className="text-muted mt-1">
            Cada projeto guarda seus módulos, padrões adotados e ADRs.
          </p>
        </div>
        {signedIn && <LinkButton href="/projetos/novo">+ Novo projeto</LinkButton>}
      </header>

      <SignedOutBanner />

      <div className="flex flex-wrap gap-2">
        {TIPOS.map((t) => {
          const label = t === "todos" ? "Todos" : PROJECT_TYPE_LABEL[t];
          const active = filter === t;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={
                "px-3 py-1.5 rounded text-xs border transition " +
                (active
                  ? "bg-amber-500 text-zinc-950 border-amber-400"
                  : "bg-card text-muted border-line hover:border-line-strong")
              }
            >
              {label} <span className="opacity-60">({counts[t] ?? 0})</span>
            </button>
          );
        })}
      </div>

      {filtered === null ? (
        <p className="text-subtle">Carregando…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-muted mb-3">
            {filter === "todos" ? "Nenhum projeto ainda." : "Nenhum projeto desse tipo."}
          </p>
          <LinkButton href="/projetos/novo">Criar projeto</LinkButton>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <Link key={p.id} href={`/projetos/${p.id}`}>
              <Card className="h-full hover:bg-card-hover">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold">{p.nome}</h2>
                  {p.tipo && (
                    <Tag color={PROJECT_TYPE_COLOR[p.tipo]}>{PROJECT_TYPE_LABEL[p.tipo]}</Tag>
                  )}
                </div>
                {p.descricao && <p className="text-sm text-muted mt-1">{p.descricao}</p>}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p.stack.map((s) => (
                    <Tag key={s} color="sky">{s}</Tag>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-subtle">
                    Criado em {new Date(p.criadoEm).toLocaleDateString("pt-BR")}
                  </p>
                  {p.status && (
                    <span className="text-[11px] text-muted">{PROJECT_STATUS_LABEL[p.status]}</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
