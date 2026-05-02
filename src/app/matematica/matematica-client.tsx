"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { ChevronDown, Plus, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SignedOutBanner } from "@/components/signed-out-banner";
import { SystemWindow } from "@/components/system-window";
import { ManaBar } from "@/components/mana-bar";
import { BossFightBanner } from "@/components/boss-fight-banner";
import { RadarChart } from "@/components/radar-chart";
import type { RadarAxis } from "@/components/radar-chart";
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
  aprovado: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
  reprovado: "border-red-500/50 bg-red-500/10 text-red-400",
  cursando: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  futuro: "border-zinc-500/50 bg-zinc-500/10 text-zinc-400",
  optativa: "border-violet-500/50 bg-violet-500/10 text-violet-400",
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
    <div className={clsx("h-1.5 rounded-full bg-zinc-800 overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-500"
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
      <div className="w-full max-w-sm rounded-xl border border-cyan-500/30 bg-zinc-950 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">[SYSTEM] · NOVA DISCIPLINA</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 font-mono mb-1 block">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/60"
              placeholder="Nome da disciplina"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-mono mb-1 block">Área</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value as DisciplinaArea)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/60"
            >
              {ALL_AREAS.map((a) => (
                <option key={a} value={a}>{AREA_LABEL[a]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-mono mb-1 block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DisciplinaStatus)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/60"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving || !nome.trim()}
            className="w-full py-2 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-sm font-mono font-semibold hover:bg-cyan-500/30 transition disabled:opacity-40"
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
        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition font-mono disabled:opacity-40"
      >
        {saving ? "..." : "Mudar status"}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg overflow-hidden min-w-[130px]">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleChange(s)}
                className={clsx(
                  "w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-zinc-800 transition",
                  s === disciplina.status ? "text-cyan-400" : "text-zinc-300",
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

  // Mini radar axes from area groups
  const areaGroups = groupByArea(disciplinas);
  const matRadarAxes: RadarAxis[] = (Object.entries(areaGroups) as [DisciplinaArea, Disciplina[]][])
    .filter(([area]) => area !== "meta")
    .map(([area, list]) => {
      const nonOpt = list.filter((d) => d.status !== "optativa");
      const aprov  = list.filter((d) => d.status === "aprovado").length;
      const total  = nonOpt.length;
      return {
        label: AREA_LABEL[area],
        value: total === 0 ? 0 : Math.round((aprov / total) * 100),
      };
    });

  // Next boss disciplina: earliest futuro non-optativa
  const nextBoss = disciplinas
    .filter((d) => d.status === "futuro")
    .sort((a, b) => (a.periodo ?? "").localeCompare(b.periodo ?? ""))[0] ?? null;

  if (!signedIn && !loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-4">
        <SystemWindow label="[SYSTEM] · MATH GATE" subtitle="Bacharelado em Matemática">
          <SignedOutBanner message="Faça login pra acessar o Math Skill Tracker." />
        </SystemWindow>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Mana bar */}
      <SystemWindow label="[SYSTEM] · RESOURCES">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <ManaBar variant="full" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">MAT Score</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">{computeMatScore(disciplinas, [], [])}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
                style={{ width: `${computeMatScore(disciplinas, [], [])}%` }}
              />
            </div>
          </div>
        </div>
      </SystemWindow>

      {/* Header */}
      <SystemWindow label="[SYSTEM] · MATH GATE" subtitle="Bacharelado em Matemática">
        <div className="space-y-4">
          {/* Stats row */}
          {loading ? (
            <div className="h-16 animate-pulse bg-zinc-800/50 rounded-lg" />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold font-mono text-zinc-100">{total}</div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">Total</div>
                </div>
                <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold font-mono text-cyan-400">{aprovadas}</div>
                  <div className="text-[10px] font-mono text-cyan-600 uppercase tracking-wider mt-0.5">Aprovadas</div>
                </div>
                <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold font-mono text-amber-400">{cursando}</div>
                  <div className="text-[10px] font-mono text-amber-600 uppercase tracking-wider mt-0.5">Cursando</div>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-700/40 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold font-mono text-zinc-400">{futuro}</div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">Futuro</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-mono text-zinc-400">Progresso obrigatórias</span>
                  <span className="text-xs font-mono text-cyan-400 font-bold">{progressoGeral}%</span>
                </div>
                <ProgressBar value={aprovadas} max={obrigatorias} />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {disciplinas.length === 0 && (
                  <button
                    onClick={handleSeed}
                    disabled={seeded}
                    className="px-3 py-1.5 rounded-md text-xs bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-mono font-semibold hover:bg-cyan-500/30 transition disabled:opacity-40"
                  >
                    {seeded ? "Carregando..." : "Carregar grade padrão"}
                  </button>
                )}
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-violet-500/15 border border-violet-500/30 text-violet-400 font-mono font-semibold hover:bg-violet-500/25 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar disciplina
                </button>
              </div>
            </>
          )}
        </div>
      </SystemWindow>

      {/* Filters */}
      {!loading && disciplinas.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Filtrar:</span>
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value as DisciplinaArea | "todas")}
            className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-300 font-mono focus:outline-none focus:border-cyan-500/60"
          >
            <option value="todas">Todas as áreas</option>
            {ALL_AREAS.map((a) => <option key={a} value={a}>{AREA_LABEL[a]}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as DisciplinaStatus | "todos")}
            className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-300 font-mono focus:outline-none focus:border-cyan-500/60"
          >
            <option value="todos">Todos os status</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          {(filterArea !== "todas" || filterStatus !== "todos") && (
            <button
              onClick={() => { setFilterArea("todas"); setFilterStatus("todos"); }}
              className="text-xs text-zinc-500 hover:text-zinc-300 font-mono transition flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          )}
          <span className="text-xs font-mono text-zinc-600 ml-auto">{filtered.length} disciplinas</span>
        </div>
      )}

      {/* Mini radar + boss fight */}
      {!loading && disciplinas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SystemWindow label="[SYSTEM] · AREA RADAR">
            <div className="flex justify-center">
              <RadarChart axes={matRadarAxes} size={220} />
            </div>
          </SystemWindow>

          <div className="space-y-3">
            {nextBoss && (
              <BossFightBanner
                headline="PRÓXIMA BOSS DISCIPLINA"
                subtitle={`${nextBoss.nome} — ${AREA_LABEL[nextBoss.area]}${nextBoss.periodo ? ` · ${nextBoss.periodo}` : ""}`}
              />
            )}
            {!nextBoss && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-4 text-center">
                <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">Todas disciplinas concluídas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disciplines grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((d) => (
            <div
              key={d.id}
              className={clsx(
                "rounded-lg border bg-zinc-950/80 p-3.5 flex flex-col gap-2.5 group transition-all",
                d.status === "aprovado" ? "border-cyan-500/30 hover:border-cyan-500/50" :
                d.status === "reprovado" ? "border-red-500/30 hover:border-red-500/50" :
                d.status === "cursando"  ? "border-amber-500/30 hover:border-amber-500/50" :
                d.status === "optativa" ? "border-violet-500/20 hover:border-violet-500/40" :
                "border-zinc-700/40 hover:border-zinc-600/60",
              )}
              style={{
                boxShadow: d.status === "aprovado" ? "0 0 12px rgba(6,182,212,0.06)" :
                           d.status === "cursando"  ? "0 0 12px rgba(245,158,11,0.06)" : undefined,
              }}
            >
              <div>
                <p className="text-sm font-semibold text-zinc-100 leading-snug">{d.nome}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {AREA_LABEL[d.area]}
                  </span>
                  {d.periodo && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-500 border border-zinc-800">
                      {d.periodo}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className={clsx("text-[10px] font-mono font-bold px-2 py-0.5 rounded border", STATUS_COLOR[d.status])}>
                  {STATUS_LABEL[d.status].toUpperCase()}
                </span>
                <StatusDropdown disciplina={d} onUpdate={handleUpdate} />
              </div>
              {d.cardSlug && (
                <Link
                  href={`/biblioteca/${d.cardSlug}`}
                  className="text-[10px] font-mono text-cyan-500/70 hover:text-cyan-400 transition self-start"
                >
                  Estudar →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && disciplinas.length > 0 && (
        <div className="text-center py-10 text-sm font-mono text-zinc-600">
          Nenhuma disciplina com esses filtros.
        </div>
      )}

      {/* Progress by period */}
      {!loading && periodos.length > 0 && (
        <SystemWindow label="[SYSTEM] · PERÍODOS">
          <div className="space-y-3">
            {periodos.map(({ periodo, aprovadas: ap, total: tot }) => (
              <div key={periodo}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-zinc-300">{periodo}</span>
                  <span className="text-xs font-mono text-zinc-500">{ap}/{tot} aprovadas</span>
                </div>
                <ProgressBar value={ap} max={tot} />
              </div>
            ))}
          </div>
        </SystemWindow>
      )}

      {showAdd && (
        <AddModal onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
    </div>
  );
}
