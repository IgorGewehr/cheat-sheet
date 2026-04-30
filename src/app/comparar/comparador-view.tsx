"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Scale, X, ChevronDown, ChevronUp, Sparkles, CheckCircle2, XCircle,
  Save, History, Trash2, Trophy, AlertTriangle, Target, ArrowRight, GitFork,
} from "lucide-react";
import { Button, Card, Input, Select, Tag } from "@/components/ui";
import { CATEGORY_LABEL, type CardCategory, type SavedComparison, type Project, PROJECT_TYPE_LABEL } from "@/lib/types";
import type { CompareContext, CompareResult } from "@/app/api/ai/compare/route";
import { createComparacao, deleteComparacao, listComparacoes, listProjectsByCardSlug } from "@/lib/db";
import { getActiveProject, setActiveProject, type ActiveProjectContext } from "@/lib/active-project";
import Link from "next/link";

type CardLite = { slug: string; title: string; category: string; excerpt: string };

const DEFAULT_CRITERIA = [
  { key: "complexity",     label: "Complexidade" },
  { key: "scale",          label: "Escala" },
  { key: "latency",        label: "Latência" },
  { key: "maintainability",label: "Manutenibilidade" },
  { key: "team_fit",       label: "Fit equipe pequena" },
  { key: "infra_cost",     label: "Custo infra" },
  { key: "testability",    label: "Testabilidade" },
  { key: "time_to_prod",   label: "Tempo até prod" },
  { key: "tech_risk",      label: "Risco técnico" },
  { key: "security",       label: "Segurança" },
];

const STACK_PRESETS = [
  "Next.js", "NestJS", "Express", "Firebase", "Firestore", "PostgreSQL",
  "Go", "Drizzle", "Prisma", "Redis", "Docker", "Vercel", "TanStack Query",
];

const CATEGORY_COLORS: Partial<Record<CardCategory, "amber" | "emerald" | "sky" | "violet" | "zinc">> = {
  arquiteturas: "amber",
  "padroes-backend": "sky",
  "padroes-frontend": "emerald",
  infra: "violet",
  "stack-guides": "zinc",
  banco: "sky",
  auth: "violet",
};

function scoreColor(score: number) {
  if (score >= 8) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 6) return "text-amber-600 dark:text-amber-400";
  if (score >= 4) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBg(score: number) {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-amber-500";
  if (score >= 4) return "bg-orange-500";
  return "bg-red-500";
}

export function ComparadorView({ cards }: { cards: CardLite[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState("");
  const [expandedRecs, setExpandedRecs] = useState<string[]>([]);

  const [ctxOpen, setCtxOpen] = useState(true);
  const [ctxScale, setCtxScale] = useState<CompareContext["scale"] | "">("");
  const [ctxTeam, setCtxTeam] = useState<CompareContext["team"] | "">("");
  const [ctxDeadline, setCtxDeadline] = useState<CompareContext["deadline"] | "">("");
  const [ctxPriority, setCtxPriority] = useState<CompareContext["priority"] | "">("");
  const [ctxStack, setCtxStack] = useState<string[]>([]);
  const [ctxNotes, setCtxNotes] = useState("");

  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(DEFAULT_CRITERIA.map((c) => [c.key, 1])),
  );
  const [weightsOpen, setWeightsOpen] = useState(false);

  const [projectsByCard, setProjectsByCard] = useState<Map<string, Project[]>>(new Map());
  const [savedTitle, setSavedTitle] = useState("");
  const [history, setHistory] = useState<SavedComparison[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeProject, setActiveProjectState] = useState<ActiveProjectContext | null>(null);

  useEffect(() => {
    const p = getActiveProject();
    if (p) {
      setActiveProjectState(p);
      if (p.stack.length > 0) {
        setCtxStack((prev) =>
          prev.length === 0
            ? p.stack.filter((s) => STACK_PRESETS.includes(s))
            : prev,
        );
      }
    }
  }, []);

  const categories = ["all", ...Array.from(new Set(cards.map((c) => c.category)))];

  const filtered = cards.filter((c) => {
    const matchText = c.title.toLowerCase().includes(filter.toLowerCase()) ||
      c.excerpt.toLowerCase().includes(filter.toLowerCase());
    const matchCat = categoryFilter === "all" || c.category === categoryFilter;
    return matchText && matchCat;
  });

  const selectedCards = useMemo(
    () => selected.map((s) => cards.find((c) => c.slug === s)).filter(Boolean) as CardLite[],
    [selected, cards],
  );

  // Buscar projetos que adotam os slugs selecionados
  useEffect(() => {
    if (selected.length < 2) {
      setProjectsByCard(new Map());
      return;
    }
    let cancelled = false;
    listProjectsByCardSlug(selected)
      .then((m) => { if (!cancelled) setProjectsByCard(m); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selected]);

  // Carregar histórico
  useEffect(() => {
    listComparacoes().then(setHistory).catch(() => {});
  }, []);

  function toggle(slug: string) {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 4) return prev;
      return [...prev, slug];
    });
    setResult(null);
  }

  function toggleStack(s: string) {
    setCtxStack((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  async function compare() {
    if (selected.length < 2) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const context: CompareContext = {
        scale: ctxScale || undefined,
        team: ctxTeam || undefined,
        deadline: ctxDeadline || undefined,
        priority: ctxPriority || undefined,
        currentStack: ctxStack.length ? ctxStack : undefined,
        notes: ctxNotes.trim() || undefined,
      };
      const res = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: selected, context, weights }),
      });
      const data = await res.json() as CompareResult & { error?: string };
      if (data.error) { setError(data.error); return; }
      setResult(data);
      // título sugerido se vazio
      if (!savedTitle) {
        setSavedTitle(selectedCards.map((c) => c.title).join(" × "));
      }
    } catch {
      setError("Erro ao conectar com a API.");
    } finally {
      setLoading(false);
    }
  }

  async function salvar() {
    if (!result) return;
    const titulo = savedTitle.trim() || selectedCards.map((c) => c.title).join(" × ");
    await createComparacao({
      titulo,
      slugs: selected,
      context: {
        scale: ctxScale || undefined,
        team: ctxTeam || undefined,
        deadline: ctxDeadline || undefined,
        priority: ctxPriority || undefined,
        currentStack: ctxStack.length ? ctxStack : undefined,
        notes: ctxNotes.trim() || undefined,
      },
      weights,
      result,
    });
    const h = await listComparacoes();
    setHistory(h);
  }

  async function reabrir(c: SavedComparison) {
    setSelected(c.slugs);
    setCtxScale(c.context.scale ?? "");
    setCtxTeam(c.context.team ?? "");
    setCtxDeadline(c.context.deadline ?? "");
    setCtxPriority(c.context.priority ?? "");
    setCtxStack(c.context.currentStack ?? []);
    setCtxNotes(c.context.notes ?? "");
    setWeights(c.weights);
    setResult(c.result);
    setSavedTitle(c.titulo);
    setHistoryOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function apagar(id: string) {
    if (!confirm("Apagar comparação salva?")) return;
    await deleteComparacao(id);
    setHistory(history.filter((h) => h.id !== id));
  }

  function toggleRec(slug: string) {
    setExpandedRecs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function resetWeights() {
    setWeights(Object.fromEntries(DEFAULT_CRITERIA.map((c) => [c.key, 1])));
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <Scale className="w-8 h-8 text-amber-500" />
            Comparar Arquiteturas
          </h1>
          <p className="text-muted max-w-2xl">
            Selecione 2 a 4 opções, dê contexto do seu cenário, ajuste pesos dos critérios.
            GPT-5.5 dá nota objetiva, calcula score ponderado e recomenda <strong>pra você</strong>.
          </p>
        </div>
        <button
          onClick={() => setHistoryOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border border-line hover:bg-card-hover transition"
        >
          <History className="w-4 h-4" />
          Histórico ({history.length})
        </button>
      </header>

      {historyOpen && (
        <Card>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <History className="w-4 h-4" /> Comparações salvas
          </h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma comparação salva. Faça uma e clique em "Salvar".</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-line hover:bg-card-hover transition">
                  <button onClick={() => reabrir(h)} className="text-left flex-1 min-w-0">
                    <p className="font-medium truncate">{h.titulo}</p>
                    <p className="text-xs text-subtle mt-0.5">
                      {h.slugs.length} opções · {new Date(h.criadoEm).toLocaleDateString("pt-BR")}
                    </p>
                  </button>
                  <button onClick={() => apagar(h.id)} className="p-1.5 text-subtle hover:text-red-500 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Projeto ativo */}
      {activeProject && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <GitFork className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-sm text-fg flex-1">
            Contexto: <span className="font-semibold">{activeProject.nome}</span>
            {activeProject.stack.length > 0 && (
              <span className="text-muted ml-1.5">— {activeProject.stack.join(", ")}</span>
            )}
          </span>
          <button
            onClick={() => { setActiveProjectState(null); setActiveProject(null); }}
            className="text-muted hover:text-fg transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selector */}
        <div className="space-y-3">
          <div className="space-y-2">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar arquitetura…"
              className="w-full rounded-md bg-card border border-line px-3 py-2 text-sm text-fg outline-none focus:border-amber-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-md bg-card border border-line px-3 py-2 text-sm text-fg outline-none focus:border-amber-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "Todas as categorias" : CATEGORY_LABEL[c as CardCategory] ?? c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
            {filtered.map((c) => {
              const isSelected = selected.includes(c.slug);
              const isDisabled = !isSelected && selected.length >= 4;
              const cat = c.category as CardCategory;
              return (
                <button
                  key={c.slug}
                  onClick={() => !isDisabled && toggle(c.slug)}
                  disabled={isDisabled}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition text-sm ${
                    isSelected
                      ? "border-amber-500/50 bg-amber-500/10 text-fg"
                      : isDisabled
                      ? "border-transparent text-subtle cursor-not-allowed opacity-40"
                      : "border-transparent text-muted hover:bg-card-hover hover:text-fg"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{c.title}</div>
                    <Tag color={CATEGORY_COLORS[cat] ?? "zinc"}>
                      {CATEGORY_LABEL[cat] ?? c.category}
                    </Tag>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main area */}
        <div className="lg:col-span-2 space-y-5">
          {/* Selected chips */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-medium">
                {selected.length === 0
                  ? "Selecione 2 a 4 opções à esquerda"
                  : `${selected.length} selecionada${selected.length > 1 ? "s" : ""}`}
              </p>
              {selected.length >= 2 && (
                <Button onClick={compare} disabled={loading}>
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Analisando…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Comparar</>
                  )}
                </Button>
              )}
            </div>

            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedCards.map((c) => {
                  const projects = projectsByCard.get(c.slug) ?? [];
                  return (
                    <div
                      key={c.slug}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-sm"
                    >
                      <span className="font-medium">{c.title}</span>
                      {projects.length > 0 && (
                        <span title={projects.map((p) => p.nome).join(", ")} className="text-[10px] bg-amber-500/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full">
                          {projects.length} projeto{projects.length > 1 ? "s" : ""}
                        </span>
                      )}
                      <button onClick={() => toggle(c.slug)} className="hover:text-red-500 transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Context */}
          {selected.length >= 2 && (
            <Card>
              <button
                onClick={() => setCtxOpen((v) => !v)}
                className="flex items-center justify-between w-full text-left"
              >
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-500" />
                    Contexto do seu cenário
                  </h3>
                  <p className="text-xs text-muted mt-0.5">A IA usa pra calibrar a recomendação pra você (não a "melhor abstrata")</p>
                </div>
                {ctxOpen ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
              </button>
              {ctxOpen && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">Escala alvo</label>
                      <Select value={ctxScale} onChange={(e) => setCtxScale(e.target.value as CompareContext["scale"] | "")}>
                        <option value="">— escolher —</option>
                        <option value="mvp">MVP / poucos usuários</option>
                        <option value="scale">Em crescimento (milhares)</option>
                        <option value="enterprise">Enterprise (alta carga)</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">Equipe</label>
                      <Select value={ctxTeam} onChange={(e) => setCtxTeam(e.target.value as CompareContext["team"] | "")}>
                        <option value="">— escolher —</option>
                        <option value="solo">1 dev</option>
                        <option value="small">2-5 devs</option>
                        <option value="medium">6-15 devs</option>
                        <option value="large">15+ devs</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">Prazo</label>
                      <Select value={ctxDeadline} onChange={(e) => setCtxDeadline(e.target.value as CompareContext["deadline"] | "")}>
                        <option value="">— escolher —</option>
                        <option value="fast">Agressivo (semanas)</option>
                        <option value="normal">Normal (1-3 meses)</option>
                        <option value="long">Longo (6+ meses)</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">Prioridade</label>
                      <Select value={ctxPriority} onChange={(e) => setCtxPriority(e.target.value as CompareContext["priority"] | "")}>
                        <option value="">— escolher —</option>
                        <option value="speed">Velocidade de entrega</option>
                        <option value="cost">Custo operacional baixo</option>
                        <option value="quality">Qualidade/manutenibilidade</option>
                        <option value="security">Segurança/compliance</option>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">Stack atual</label>
                    <div className="flex flex-wrap gap-1.5">
                      {STACK_PRESETS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleStack(s)}
                          className={
                            "px-2.5 py-1 rounded text-xs border transition " +
                            (ctxStack.includes(s)
                              ? "bg-amber-500 text-zinc-950 border-amber-400"
                              : "bg-card text-muted border-line hover:border-line-strong")
                          }
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">Contexto extra</label>
                    <textarea
                      rows={2}
                      value={ctxNotes}
                      onChange={(e) => setCtxNotes(e.target.value)}
                      placeholder="ex: integração com SEFAZ obrigatória, time aprende rápido, preciso multi-tenant…"
                      className="w-full rounded-md bg-card border border-line px-3 py-2 text-sm text-fg outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Weights */}
          {selected.length >= 2 && (
            <Card>
              <button
                onClick={() => setWeightsOpen((v) => !v)}
                className="flex items-center justify-between w-full text-left"
              >
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-500" />
                    Pesos dos critérios
                  </h3>
                  <p className="text-xs text-muted mt-0.5">Padrão: peso 1 em tudo. Suba pro que importa pra você (max 3)</p>
                </div>
                {weightsOpen ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
              </button>
              {weightsOpen && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-end">
                    <button onClick={resetWeights} className="text-xs text-amber-600 dark:text-amber-400 hover:underline">
                      Resetar pesos
                    </button>
                  </div>
                  {DEFAULT_CRITERIA.map((c) => (
                    <div key={c.key} className="flex items-center gap-3">
                      <label className="text-sm text-muted w-44 shrink-0">{c.label}</label>
                      <input
                        type="range"
                        min={0}
                        max={3}
                        step={1}
                        value={weights[c.key] ?? 1}
                        onChange={(e) => setWeights({ ...weights, [c.key]: Number(e.target.value) })}
                        className="flex-1 accent-amber-500"
                      />
                      <span className={`text-sm font-mono w-6 text-right ${
                        (weights[c.key] ?? 1) === 0 ? "text-subtle" :
                        (weights[c.key] ?? 1) >= 3 ? "text-amber-600 dark:text-amber-400 font-bold" :
                        "text-fg"
                      }`}>
                        {weights[c.key] ?? 1}×
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Result */}
          {result && (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <p className="text-sm text-muted mb-2">Análise geral</p>
                <p className="text-fg leading-relaxed">{result.summary}</p>
              </Card>

              {/* Ranking */}
              {result.ranking && result.ranking.length > 0 && (
                <Card>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Ranking ponderado
                  </h3>
                  <div className="space-y-2.5">
                    {result.ranking.map((r, i) => (
                      <div key={r.slug}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                              i === 0 ? "bg-amber-500 text-zinc-950" : "bg-card-hover text-muted"
                            }`}>
                              {i + 1}
                            </span>
                            <Link href={`/biblioteca/${r.slug}`} className="font-medium hover:text-amber-600 dark:hover:text-amber-400 transition">
                              {r.title}
                            </Link>
                          </div>
                          <span className="font-mono text-xs text-muted">
                            {r.total} pts ({Math.round(r.percent)}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-card-hover overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-all"
                            style={{ width: `${Math.min(100, r.percent)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* For your case */}
              {result.forYourCase && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">
                          Pra SEU caso
                        </p>
                        <Link href={`/biblioteca/${result.forYourCase.pick}`} className="text-xl font-semibold mt-1 inline-block hover:text-amber-600 dark:hover:text-amber-400">
                          → {result.forYourCase.pickTitle}
                        </Link>
                      </div>
                      <p className="text-sm leading-relaxed">{result.forYourCase.why}</p>

                      {result.forYourCase.risks?.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-red-600 dark:text-red-400 font-semibold mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> Riscos a mitigar
                          </p>
                          <ul className="space-y-1">
                            {result.forYourCase.risks.map((r, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.forYourCase.nextSteps?.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold mb-2 flex items-center gap-1.5">
                            <ArrowRight className="w-3.5 h-3.5" /> Próximos passos
                          </p>
                          <ol className="space-y-1.5">
                            {result.forYourCase.nextSteps.map((s, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold w-5 shrink-0">{i + 1}.</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Criteria matrix */}
              {result.criteria && result.criteria.length > 0 && (
                <div className="rounded-xl border border-line overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line bg-card-hover">
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted font-semibold w-44">
                            Critério
                          </th>
                          <th className="text-center px-2 py-3 text-xs uppercase tracking-wide text-muted font-semibold w-12">
                            Peso
                          </th>
                          {selectedCards.map((c) => (
                            <th key={c.slug} className="text-left px-4 py-3 font-semibold">
                              <Link href={`/biblioteca/${c.slug}`} className="hover:text-amber-600 dark:hover:text-amber-400 transition">
                                {c.title}
                              </Link>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.criteria.map((row, i) => (
                          <tr key={row.key} className={`border-b border-line ${i % 2 === 0 ? "" : "bg-card/50"}`}>
                            <td className="px-4 py-3 align-top">
                              <div className="font-medium text-fg text-xs">{row.label}</div>
                              {row.description && (
                                <div className="text-[11px] text-subtle mt-0.5 leading-snug">{row.description}</div>
                              )}
                            </td>
                            <td className="px-2 py-3 align-top text-center">
                              <span className={`text-xs font-mono ${row.weight >= 2 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted"}`}>
                                {row.weight}×
                              </span>
                            </td>
                            {selectedCards.map((c) => {
                              const score = row.scores?.[c.slug] ?? 0;
                              const flag = row.riskFlag?.[c.slug] ?? false;
                              const rationale = row.rationale?.[c.slug] ?? "";
                              return (
                                <td key={c.slug} className="px-4 py-3 align-top">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-mono text-base font-bold ${scoreColor(score)}`}>
                                      {score}
                                    </span>
                                    <div className="h-1.5 flex-1 max-w-[60px] rounded-full bg-card-hover overflow-hidden">
                                      <div
                                        className={`h-full ${scoreBg(score)}`}
                                        style={{ width: `${score * 10}%` }}
                                      />
                                    </div>
                                    {flag && (
                                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                    )}
                                  </div>
                                  {rationale && (
                                    <div className="text-[11px] text-subtle mt-1 leading-snug">{rationale}</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Projects using each */}
              {[...projectsByCard.values()].some((arr) => arr.length > 0) && (
                <Card>
                  <h3 className="font-semibold mb-3">Seus projetos por opção</h3>
                  <div className="space-y-2">
                    {selectedCards.map((c) => {
                      const projects = projectsByCard.get(c.slug) ?? [];
                      if (projects.length === 0) return (
                        <div key={c.slug} className="flex items-baseline gap-2">
                          <span className="font-medium text-sm">{c.title}:</span>
                          <span className="text-xs text-subtle">nenhum projeto adotou</span>
                        </div>
                      );
                      return (
                        <div key={c.slug} className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-medium text-sm">{c.title}:</span>
                          {projects.map((p) => (
                            <Link key={p.id} href={`/projetos/${p.id}`}>
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-card-hover hover:bg-line transition">
                                {p.nome}
                                {p.tipo && <span className="text-subtle">· {PROJECT_TYPE_LABEL[p.tipo]}</span>}
                              </span>
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Quando usar cada um</h2>
                  {result.recommendations.map((rec) => {
                    const expanded = expandedRecs.includes(rec.slug);
                    return (
                      <div key={rec.slug} className="rounded-xl border border-line overflow-hidden">
                        <button
                          onClick={() => toggleRec(rec.slug)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-card-hover transition"
                        >
                          <span className="font-medium">{rec.title}</span>
                          {expanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                        </button>
                        {expanded && (
                          <div className="px-4 pb-4 pt-2 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold mb-2">
                                  Use quando
                                </p>
                                <ul className="space-y-1.5">
                                  {rec.useWhen.map((u, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                      {u}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-red-600 dark:text-red-400 font-semibold mb-2">
                                  Evite quando
                                </p>
                                <ul className="space-y-1.5">
                                  {rec.avoid.map((a, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                      {a}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            {rec.migrationFromOthers && (
                              <div className="rounded-lg bg-card-hover p-3 text-sm">
                                <p className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold mb-1.5">
                                  Caminho de migração
                                </p>
                                <p>{rec.migrationFromOthers}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Verdict */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                <p className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold mb-2">
                  Veredito do arquiteto
                </p>
                <p className="text-fg leading-relaxed">{result.verdict}</p>
              </div>

              {/* Save */}
              <Card>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Save className="w-4 h-4 text-amber-500" />
                  Salvar comparação
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={savedTitle}
                    onChange={(e) => setSavedTitle(e.target.value)}
                    placeholder="Nome (ex: 'DB para gestao-raiz v2')"
                  />
                  <Button onClick={salvar}>Salvar</Button>
                </div>
                <p className="text-xs text-subtle mt-2">
                  Fica no seu workspace. Reabra do Histórico pra revisar/iterar.
                </p>
              </Card>
            </div>
          )}

          {!result && !loading && selected.length === 0 && (
            <Card className="text-center py-12 text-muted">
              <Scale className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Selecione 2 a 4 opções para comparar</p>
              <p className="text-sm mt-1 text-subtle">
                Tente: <strong>Modular Monolith</strong> × <strong>Microservices</strong> × <strong>Clean Arch</strong>
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
