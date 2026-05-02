"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { ChevronDown, Plus, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SignedOutBanner } from "@/components/signed-out-banner";
import { Card } from "@/components/ui";
import {
  listDisciplinas,
  upsertDisciplina,
  seedDisciplinasIfEmpty,
} from "@/lib/matematica-db";
import { computeMatScore, groupByArea, progressByPeriodo } from "@/lib/matematica-stats";
import type { Disciplina, DisciplinaArea, DisciplinaStatus } from "@/lib/matematica-types";
import { isAuthRequiredError } from "@/lib/firebase";

const STATUS_LABEL: Record<DisciplinaStatus, string> = {
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  cursando: "Cursando",
  futuro: "Futuro",
  optativa: "Optativa",
};

const STATUS_COLOR: Record<DisciplinaStatus, string> = {
  aprovado: "border-violet-500/40 bg-violet-500/10 text-violet-400",
  reprovado: "border-red-500/50 bg-red-500/10 text-red-400",
  cursando: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  futuro: "border-zinc-500/50 bg-zinc-500/10 text-zinc-400",
  optativa: "border-violet-500/30 bg-violet-500/5 text-violet-500",
};

const AREA_LABEL: Record<DisciplinaArea, string> = {
  fundamentos: "Fundamentos",
  calculo: "Cálculo",
  algebra: "Álgebra",
  analise: "Análise",
  geometria: "Geometria",
  discreta: "Discreta",
  "prob-stat": "Prob & Estat",
  aplicada: "Aplicada",
  fisica: "Física",
  meta: "Meta",
};

const ALL_STATUSES: DisciplinaStatus[] = ["aprovado", "reprovado", "cursando", "futuro", "optativa"];
const ALL_AREAS: DisciplinaArea[] = ["fundamentos", "calculo", "algebra", "analise", "geometria", "discreta", "prob-stat", "aplicada", "fisica", "meta"];

function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className={clsx("h-1.5 rounded-full bg-card-hover overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface AddModalProps {
  onClose: () => void;
  onSave: (d: Omit<Disciplina, "id" | "atualizadoEm">) => Promise<void>;
}

function AddModal({ onClose, onSave }: AddModalProps) {
  const [nome, setNome] = useState("");
  const [area, setArea] = useState<DisciplinaArea>("fundamentos");
  const [status, setStatus] = useState<DisciplinaStatus>("futuro");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSaving(true);
    try {
      await onSave({ nome: nome.trim(), area, status, creditos: 4 });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-card p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-fg">Nova disciplina</span>
          <button onClick={onClose} className="text-muted hover:text-fg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted mb-1 block">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-card-hover border border-line rounded-md px-3 py-2 text-sm text-fg focus:outline-none focus:border-violet-500/60"
              placeholder="Nome da disciplina"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Área</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value as DisciplinaArea)}
              className="w-full bg-card-hover border border-line rounded-md px-3 py-2 text-sm text-fg focus:outline-none focus:border-violet-500/60"
            >
              {ALL_AREAS.map((a) => (
                <option key={a} value={a}>{AREA_LABEL[a]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DisciplinaStatus)}
              className="w-full bg-card-hover border border-line rounded-md px-3 py-2 text-sm text-fg focus:outline-none focus:border-violet-500/60"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving || !nome.trim()}
            className="w-full py-2 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-500/25 transition disabled:opacity-40"
          >
            {saving ? "Salvando..." : "Adicionar"}
          </button>
        </form>
      </div>
    </div>
  );
}

interface StatusDropdownProps {
  disciplina: Disciplina;
  onUpdate: (d: Disciplina) => Promise<void>;
}

function StatusDropdown({ disciplina, onUpdate }: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleChange(s: DisciplinaStatus) {
    setOpen(false);
    if (s === disciplina.status) return;
    setSaving(true);
    try {
      await onUpdate({ ...disciplina, status: s, atualizadoEm: Date.now() });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className="flex items-center gap-1 text-xs text-muted hover:text-fg transition disabled:opacity-40"
      >
        {saving ? "..." : "Mudar status"}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-card border border-line rounded-md shadow-lg overflow-hidden min-w-[130px]">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleChange(s)}
                className={clsx(
                  "w-full text-left px-3 py-1.5 text-xs hover:bg-card-hover transition",
                  s === disciplina.status ? "text-violet-400" : "text-fg",
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function MatematicaClient() {
  const { signedIn } = useAuth();

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [filterArea, setFilterArea] = useState<DisciplinaArea | "todas">("todas");
  const [filterStatus, setFilterStatus] = useState<DisciplinaStatus | "todos">("todos");
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    try {
      const list = await listDisciplinas();
      setDisciplinas(list);
      return list;
    } catch (err) {
      if (!isAuthRequiredError(err)) console.error(err);
      return [];
    }
  }

  useEffect(() => {
    if (!signedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [signedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSeed() {
    if (seeded) return;
    setSeeded(true);
    try {
      await seedDisciplinasIfEmpty();
      const list = await load();
      setDisciplinas(list);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdate(updated: Disciplina) {
    await upsertDisciplina(updated);
    setDisciplinas((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }

  async function handleAdd(input: Omit<Disciplina, "id" | "atualizadoEm">) {
    const { v4: uuidv4 } = await import("uuid");
    const d: Disciplina = { ...input, id: uuidv4(), atualizadoEm: Date.now() };
    await upsertDisciplina(d);
    setDisciplinas((prev) => [...prev, d]);
  }

  const filtered = disciplinas.filter((d) => {
    if (filterArea !== "todas" && d.area !== filterArea) return false;
    if (filterStatus !== "todos" && d.status !== filterStatus) return false;
    return true;
  });

  const aprovadas = disciplinas.filter((d) => d.status === "aprovado").length;
  const cursando = disciplinas.filter((d) => d.status === "cursando").length;
  const futuro = disciplinas.filter((d) => d.status === "futuro" || d.status === "optativa").length;
  const total = disciplinas.length;
  const obrigatorias = disciplinas.filter((d) => d.status !== "optativa").length;
  const progressoGeral = obrigatorias === 0 ? 0 : Math.round((aprovadas / obrigatorias) * 100);

  const periodos = progressByPeriodo(disciplinas);
  const matScore = computeMatScore(disciplinas, [], []);

  if (!signedIn && !loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-4">
        <SignedOutBanner message="Faça login pra acessar o Matemática." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <Card className="p-5 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-fg">Matemática</h1>
          <p className="text-sm text-muted mt-0.5">Bacharelado em Matemática</p>
        </div>

        {loading ? (
          <div className="h-16 animate-pulse bg-card-hover rounded-lg" />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-line bg-card-hover p-3 text-center">
                <div className="text-2xl font-bold text-fg">{total}</div>
                <div className="text-xs text-muted mt-0.5">Total</div>
              </div>
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 text-center">
                <div className="text-2xl font-bold text-violet-400">{aprovadas}</div>
                <div className="text-xs text-violet-500 mt-0.5">Aprovadas</div>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                <div className="text-2xl font-bold text-amber-400">{cursando}</div>
                <div className="text-xs text-amber-500 mt-0.5">Cursando</div>
              </div>
              <div className="rounded-lg border border-line bg-card-hover p-3 text-center">
                <div className="text-2xl font-bold text-muted">{futuro}</div>
                <div className="text-xs text-muted mt-0.5">Futuro</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-muted">Progresso obrigatórias</span>
                <span className="text-xs text-violet-400 font-semibold">{progressoGeral}%</span>
              </div>
              <ProgressBar value={aprovadas} max={obrigatorias} />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-muted">Mat Score</span>
                <span className="text-xs text-violet-400 font-semibold">{matScore}</span>
              </div>
              <ProgressBar value={matScore} max={100} />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {disciplinas.length === 0 && (
                <button
                  onClick={handleSeed}
                  disabled={seeded}
                  className="px-3 py-1.5 rounded-md text-xs bg-violet-500/15 border border-violet-500/30 text-violet-400 font-medium hover:bg-violet-500/25 transition disabled:opacity-40"
                >
                  {seeded ? "Carregando..." : "Carregar grade padrão"}
                </button>
              )}
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-violet-500/15 border border-violet-500/30 text-violet-400 font-medium hover:bg-violet-500/25 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar disciplina
              </button>
            </div>
          </>
        )}
      </Card>

      {!loading && disciplinas.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted">Filtrar:</span>
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value as DisciplinaArea | "todas")}
            className="bg-card-hover border border-line rounded-md px-2 py-1 text-xs text-fg focus:outline-none focus:border-violet-500/60"
          >
            <option value="todas">Todas as áreas</option>
            {ALL_AREAS.map((a) => <option key={a} value={a}>{AREA_LABEL[a]}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as DisciplinaStatus | "todos")}
            className="bg-card-hover border border-line rounded-md px-2 py-1 text-xs text-fg focus:outline-none focus:border-violet-500/60"
          >
            <option value="todos">Todos os status</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          {(filterArea !== "todas" || filterStatus !== "todos") && (
            <button
              onClick={() => { setFilterArea("todas"); setFilterStatus("todos"); }}
              className="text-xs text-muted hover:text-fg transition flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          )}
          <span className="text-xs text-muted ml-auto">{filtered.length} disciplinas</span>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((d) => (
            <div
              key={d.id}
              className={clsx(
                "rounded-lg border bg-card p-3.5 flex flex-col gap-2.5 transition-all hover:-translate-y-0.5",
                d.status === "cursando" ? "border-violet-500/20 hover:border-violet-500/30" :
                d.status === "aprovado" ? "border-violet-500/15 hover:border-violet-500/25" :
                d.status === "reprovado" ? "border-red-500/20 hover:border-red-500/30" :
                d.status === "optativa" ? "border-line hover:border-violet-500/20" :
                "border-line hover:border-line-strong",
              )}
            >
              <div>
                <p className="text-sm font-semibold text-fg leading-snug">{d.nome}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-card-hover text-muted border border-line">
                    {AREA_LABEL[d.area]}
                  </span>
                  {d.periodo && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-card-hover text-muted border border-line">
                      {d.periodo}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className={clsx("text-[10px] font-medium px-2 py-0.5 rounded border", STATUS_COLOR[d.status])}>
                  {STATUS_LABEL[d.status]}
                </span>
                <StatusDropdown disciplina={d} onUpdate={handleUpdate} />
              </div>
              {d.cardSlug && (
                <Link
                  href={`/biblioteca/${d.cardSlug}`}
                  className="text-[10px] text-violet-400/70 hover:text-violet-400 transition self-start"
                >
                  Estudar →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && disciplinas.length > 0 && (
        <div className="text-center py-10 text-sm text-muted">
          Nenhuma disciplina com esses filtros.
        </div>
      )}

      {!loading && periodos.length > 0 && (
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-fg">Progresso por Período</h2>
          <div className="space-y-3">
            {periodos.map(({ periodo, aprovadas: ap, total: tot }) => (
              <div key={periodo}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-fg">{periodo}</span>
                  <span className="text-xs text-muted">{ap}/{tot} aprovadas</span>
                </div>
                <ProgressBar value={ap} max={tot} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {showAdd && (
        <AddModal onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
    </div>
  );
}
