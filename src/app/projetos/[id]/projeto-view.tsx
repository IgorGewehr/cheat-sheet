"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  Plus, Trash2, BookOpen, ChevronRight, Circle,
  CheckCircle2, AlertTriangle, XCircle, GitBranch, Sparkles, Boxes, ArrowUpRight, Download,
} from "lucide-react";
import { Button, Card, LinkButton, Tag } from "@/components/ui";
import {
  createAdocao,
  deleteAdocao,
  deleteProject,
  getProject,
  subscribeAdocoes,
  subscribeModulos,
  deleteModulo,
  updateAdocaoStatus,
  updateModuloStatus,
  exportProjectAsArchitecture,
} from "@/lib/db";
import { DecisoesSection } from "./decisoes-section";
import { ExtractModal } from "./extract-modal";
import type { Adocao, AdocaoStatus, Modulo, ModuloStatus, Project } from "@/lib/types";
import {
  ADOCAO_STATUS_COLOR,
  ADOCAO_STATUS_LABEL,
} from "@/lib/types";

type CardLite = { slug: string; title: string; excerpt: string; stack: string[] };

const STATUS_MOD_LABEL: Record<ModuloStatus, string> = {
  planejando: "Planejando",
  "em-desenvolvimento": "Em desenvolvimento",
  concluido: "Concluído",
  extraido: "Extraído",
};
const STATUS_MOD_DOT: Record<ModuloStatus, string> = {
  planejando: "bg-zinc-400",
  "em-desenvolvimento": "bg-amber-400",
  concluido: "bg-emerald-400",
  extraido: "bg-violet-400",
};
const ADOCAO_ICON: Record<AdocaoStatus, React.ReactNode> = {
  adotado: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  revisar: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  dificuldade: <XCircle className="w-4 h-4 text-red-500" />,
  "outra-abordagem": <GitBranch className="w-4 h-4 text-violet-400" />,
};
const STATUS_CYCLE: AdocaoStatus[] = ["adotado", "revisar", "dificuldade", "outra-abordagem"];

type ActiveTab = "modulos" | "decisoes";

export function ProjetoView({ projetoId, cards }: { projetoId: string; cards: CardLite[] }) {
  const router = useRouter();
  const [projeto, setProjeto] = useState<Project | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [adocoes, setAdocoes] = useState<Adocao[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("modulos");
  const [loading, setLoading] = useState(true);
  const [addingSlug, setAddingSlug] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [aiSuggested, setAiSuggested] = useState<string[]>([]);
  const [extractingModulo, setExtractingModulo] = useState<Modulo | null>(null);

  // Load project once, then subscribe to real-time modulos + adocoes
  useEffect(() => {
    let mounted = true;
    getProject(projetoId).then((p) => {
      if (!mounted) return;
      setProjeto(p);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [projetoId]);

  useEffect(() => {
    const unsubModulos = subscribeModulos(projetoId, (m) => {
      setModulos(m);
      setActiveId((prev) => prev ?? m[0]?.id ?? null);
    });
    const unsubAdocoes = subscribeAdocoes(projetoId, setAdocoes);
    return () => {
      unsubModulos();
      unsubAdocoes();
    };
  }, [projetoId]);

  const activeModulo = modulos.find((m) => m.id === activeId) ?? null;
  const adocoesModulo = adocoes.filter((a) => a.moduloId === activeId);
  const adotadosSlugs = new Set(adocoesModulo.map((a) => a.cardSlug));
  const stackLower = projeto?.stack.map((s) => s.toLowerCase()) ?? [];
  const sugeridos = cards
    .filter((c) => !adotadosSlugs.has(c.slug))
    .filter((c) => {
      if (aiSuggested.length > 0) return aiSuggested.includes(c.slug);
      return c.stack.some((s) => stackLower.includes(s.toLowerCase()));
    })
    .slice(0, 8);

  const totalRelevantes = cards.filter((c) =>
    c.stack.some((s) => stackLower.includes(s.toLowerCase())),
  ).length;
  const healthPct =
    totalRelevantes > 0
      ? Math.min(100, Math.round((adocoes.length / totalRelevantes) * 100))
      : 0;

  async function suggestWithAI() {
    if (!projeto || suggesting) return;
    setSuggesting(true);
    setAiSuggested([]);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `${projeto.nome}${projeto.descricao ? ": " + projeto.descricao : ""}`,
          stack: projeto.stack,
          availableSlugs: cards.map((c) => ({
            slug: c.slug,
            title: c.title,
            category: "geral",
            excerpt: c.excerpt,
          })),
        }),
      });
      const data = await res.json() as { slugs?: string[] };
      setAiSuggested(data.slugs ?? []);
    } finally {
      setSuggesting(false);
    }
  }

  async function cycleStatus(id: string, current: AdocaoStatus) {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
    await updateAdocaoStatus(id, next);
  }

  async function removeAdocao(id: string) {
    await deleteAdocao(id);
  }

  async function addCard(slug: string) {
    if (!activeId || addingSlug) return;
    setAddingSlug(slug);
    try {
      await createAdocao({ projetoId, moduloId: activeId, cardSlug: slug, status: "adotado" });
    } finally {
      setAddingSlug(null);
    }
  }

  async function changeModuloStatus(mid: string, status: ModuloStatus) {
    await updateModuloStatus(mid, status);
  }

  async function deleteModuloLocal(mid: string) {
    if (!confirm("Apagar este módulo e suas adoções?")) return;
    await deleteModulo(mid);
    setActiveId((cur) => {
      if (cur !== mid) return cur;
      return modulos.find((m) => m.id !== mid)?.id ?? null;
    });
  }

  async function deleteProjeto() {
    if (!projeto || !confirm(`Apagar "${projeto.nome}" e tudo dentro?`)) return;
    await deleteProject(projeto.id);
    router.push("/projetos");
  }

  function cardFor(slug: string) { return cards.find((c) => c.slug === slug); }

  if (loading && !projeto) return (
    <div className="flex items-center justify-center h-64 text-muted text-sm">Carregando…</div>
  );
  if (!projeto) return (
    <div className="flex items-center justify-center h-64 text-muted text-sm">Projeto não encontrado nesse workspace.</div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link href="/projetos" className="text-xs text-muted hover:text-fg flex items-center gap-1 mb-2 transition">
            <ChevronRight className="w-3 h-3 rotate-180" /> projetos
          </Link>
          <h1 className="text-2xl font-semibold">{projeto.nome}</h1>
          {projeto.origemModulo && (
            <Link
              href={`/projetos/${projeto.origemModulo.projetoId}`}
              className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition mt-0.5"
            >
              <ArrowUpRight className="w-3 h-3" />
              Extraído de {projeto.origemModulo.projetoNome} / {projeto.origemModulo.moduloNome}
            </Link>
          )}
          {projeto.descricao && <p className="text-muted mt-1 text-sm">{projeto.descricao}</p>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {projeto.stack.map((s) => <Tag key={s} color="sky">{s}</Tag>)}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <LinkButton href={`/projetos/${projeto.id}/modulos/novo`} variant="secondary">
            <Plus className="w-4 h-4" /> Módulo
          </LinkButton>
          <Button
            variant="secondary"
            onClick={async () => {
              const arch = await exportProjectAsArchitecture(projeto.id);
              const blob = new Blob([JSON.stringify(arch, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${projeto.nome.toLowerCase().replace(/\s+/g, "-")}-architecture.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            title="Exportar arquitetura como JSON"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="danger" onClick={deleteProjeto}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Health score */}
      {totalRelevantes > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${healthPct}%`,
                background: healthPct >= 70 ? "#10b981" : healthPct >= 40 ? "#f59e0b" : "#71717a",
              }}
            />
          </div>
          <span className="text-xs text-muted shrink-0">
            {adocoes.length} / {totalRelevantes} padrões relevantes adotados
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line">
        {(["modulos", "decisoes"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition",
              activeTab === tab
                ? "border-amber-500 text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            {tab === "modulos" ? "Módulos" : "Decisões"}
          </button>
        ))}
      </div>

      {activeTab === "decisoes" ? (
        <DecisoesSection projetoId={projetoId} cards={cards} projetoStack={projeto.stack} />
      ) : (
        <div className="flex gap-5 items-start">

          {/* Sidebar: lista de módulos */}
          <aside className="w-52 shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-2 px-1">Módulos</p>
            <div className="space-y-0.5">
              {modulos.length === 0 ? (
                <p className="text-xs text-muted px-2 py-1">Nenhum módulo.</p>
              ) : modulos.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveId(m.id)}
                  className={clsx(
                    "w-full text-left px-2.5 py-2 rounded-lg transition flex items-start gap-2 border text-sm",
                    m.status === "extraido" && "opacity-60",
                    m.id === activeId
                      ? "border-amber-500/50 bg-amber-500/10 text-fg"
                      : "border-transparent text-muted hover:bg-card-hover hover:text-fg",
                  )}
                >
                  <span className={clsx("w-2 h-2 rounded-full shrink-0 mt-1.5", STATUS_MOD_DOT[m.status])} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-snug">{m.nome}</p>
                    <p className="text-[11px] text-muted">
                      {m.status === "extraido" ? "microsserviço" : m.tipo}
                    </p>
                  </div>
                  {m.status === "extraido"
                    ? <ArrowUpRight className="w-3 h-3 text-violet-400 mt-1 shrink-0" />
                    : m.id === activeId && <ChevronRight className="w-3 h-3 text-amber-500 mt-1 shrink-0" />
                  }
                </button>
              ))}
            </div>
            <LinkButton
              href={`/projetos/${projeto.id}/modulos/novo`}
              variant="ghost"
              className="w-full justify-start text-xs text-muted mt-2 px-2.5 py-1.5"
            >
              <Plus className="w-3 h-3" /> novo módulo
            </LinkButton>
          </aside>

          {/* Painel principal */}
          <div className="flex-1 min-w-0 space-y-6">
            {!activeModulo ? (
              <Card><p className="text-muted text-sm">Selecione um módulo.</p></Card>
            ) : (
              <>
                {/* Cabeçalho do módulo ativo */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{activeModulo.nome}</h2>
                    {activeModulo.descricao && <p className="text-sm text-muted">{activeModulo.descricao}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {activeModulo.status !== "extraido" && (
                      <>
                        <select
                          value={activeModulo.status}
                          onChange={(e) => changeModuloStatus(activeModulo.id, e.target.value as ModuloStatus)}
                          className="text-xs rounded-md bg-card border border-line px-2 py-1.5 text-fg"
                        >
                          {(["planejando", "em-desenvolvimento", "concluido"] as ModuloStatus[]).map((v) => (
                            <option key={v} value={v}>{STATUS_MOD_LABEL[v]}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => projeto && setExtractingModulo(activeModulo)}
                          className="p-1.5 rounded text-muted hover:text-violet-400 hover:bg-violet-500/10 transition"
                          title="Extrair como microsserviço"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteModuloLocal(activeModulo.id)}
                      className="p-1.5 rounded text-muted hover:text-red-500 hover:bg-red-500/10 transition"
                      title="Apagar módulo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {activeModulo.status === "extraido" && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-500/30 bg-violet-500/5 text-sm text-violet-400">
                    <Boxes className="w-4 h-4 shrink-0" />
                    <span>Este módulo foi extraído como microsserviço independente.</span>
                    {activeModulo.projetoExtraidoId && (
                      <Link
                        href={`/projetos/${activeModulo.projetoExtraidoId}`}
                        className="ml-auto flex items-center gap-1 text-xs font-medium hover:text-violet-300 transition shrink-0"
                      >
                        Ver projeto <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                )}

                {/* Padrões adotados */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-2">
                    Padrões adotados · {adocoesModulo.length}
                  </p>
                  {adocoesModulo.length === 0 ? (
                    <p className="text-sm text-muted">
                      Nenhum ainda. Adicione clicando em <Plus className="w-3 h-3 inline" /> nos sugeridos abaixo ou na Biblioteca.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {adocoesModulo.map((a) => {
                        const c = cardFor(a.cardSlug);
                        const st: AdocaoStatus = a.status ?? "adotado";
                        return (
                          <div
                            key={a.id}
                            className={clsx(
                              "flex items-center gap-3 px-3 py-2 rounded-lg border-l-2 border border-line transition",
                              ADOCAO_STATUS_COLOR[st],
                            )}
                          >
                            <button
                              onClick={() => cycleStatus(a.id, st)}
                              title={`${ADOCAO_STATUS_LABEL[st]} — clique pra mudar status`}
                              className="shrink-0"
                            >
                              {ADOCAO_ICON[st]}
                            </button>
                            <div className="flex-1 min-w-0">
                              {c ? (
                                <Link
                                  href={`/biblioteca/${c.slug}`}
                                  className="text-sm font-medium hover:text-amber-600 dark:hover:text-amber-400 transition block truncate"
                                >
                                  {c.title}
                                </Link>
                              ) : (
                                <span className="text-sm text-muted">{a.cardSlug}</span>
                              )}
                              {a.notas && (
                                <p className="text-[11px] text-muted italic truncate mt-0.5">{a.notas}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-muted hidden sm:block whitespace-nowrap">
                                {ADOCAO_STATUS_LABEL[st]}
                              </span>
                              <button
                                onClick={() => removeAdocao(a.id)}
                                className="p-1 rounded text-muted hover:text-red-500 hover:bg-red-500/10 transition"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Sugeridos */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
                      {aiSuggested.length > 0 ? "Sugeridos pela IA" : "Sugeridos para este módulo"}
                    </p>
                    <button
                      onClick={suggestWithAI}
                      disabled={suggesting}
                      className="flex items-center gap-1 text-[11px] text-muted hover:text-amber-500 transition disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      {suggesting ? "analisando…" : aiSuggested.length > 0 ? "re-sugerir" : "sugerir com IA"}
                    </button>
                  </div>
                  {sugeridos.length === 0 ? (
                    <p className="text-xs text-muted">Todos os padrões relevantes já foram adotados.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {sugeridos.map((c) => (
                        <div
                          key={c.slug}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg border border-line bg-card hover:border-line-strong transition"
                        >
                          <Circle className="w-3 h-3 mt-1 text-muted shrink-0" />
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/biblioteca/${c.slug}`}
                              className="text-sm font-medium hover:text-amber-600 dark:hover:text-amber-400 transition block truncate"
                            >
                              {c.title}
                            </Link>
                            <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{c.excerpt}</p>
                          </div>
                          <button
                            onClick={() => addCard(c.slug)}
                            disabled={addingSlug === c.slug}
                            title="Adicionar ao módulo"
                            className="shrink-0 p-1 rounded text-muted hover:text-emerald-500 hover:bg-emerald-500/10 transition disabled:opacity-40"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {aiSuggested.length === 0 && (
                    <Link
                      href="/biblioteca"
                      className="flex items-center gap-1.5 text-xs text-muted hover:text-fg mt-3 transition"
                    >
                      <BookOpen className="w-3 h-3" /> Ver todos os cards na Biblioteca
                    </Link>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      )}

      {extractingModulo && projeto && (
        <ExtractModal
          projeto={projeto}
          modulo={extractingModulo}
          adocoes={adocoes.filter((a) => a.moduloId === extractingModulo.id)}
          onClose={() => setExtractingModulo(null)}
        />
      )}
    </div>
  );
}
