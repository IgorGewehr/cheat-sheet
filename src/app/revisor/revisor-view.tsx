"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  Eye, History, Trash2, Save, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, MessageSquare, Code2, GitFork, X, AlertCircle,
} from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import {
  createRevisorSession,
  deleteRevisorSession,
  listRevisoesCodigo,
} from "@/lib/db";
import type { RevisorSession } from "@/lib/types";
import type { RevisorResult } from "@/app/api/ai/revisor/route";
import { getActiveProject, setActiveProject, type ActiveProjectContext } from "@/lib/active-project";

type Tab = "nova" | "historico" | "padroes";

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    : score >= 50
    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
    : "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30";

  return (
    <span className={clsx("inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold border", color)}>
      {score}/100
    </span>
  );
}

export function RevisorView() {
  const [tab, setTab] = useState<Tab>("nova");

  // Form state
  const [titulo, setTitulo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [revisaoUsuario, setRevisaoUsuario] = useState("");
  const [cardSlug, setCardSlug] = useState("");

  // Result state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RevisorResult | null>(null);
  const [revisaoExpanded, setRevisaoExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Projeto ativo
  const [activeProject, setActiveProjectState] = useState<ActiveProjectContext | null>(null);
  useEffect(() => { setActiveProjectState(getActiveProject()); }, []);

  // Histórico
  const [historico, setHistorico] = useState<RevisorSession[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  useEffect(() => {
    if (tab === "historico" || tab === "padroes") {
      setLoadingHistorico(true);
      listRevisoesCodigo()
        .then(setHistorico)
        .catch(() => {})
        .finally(() => setLoadingHistorico(false));
    }
  }, [tab]);

  async function submeter() {
    if (!titulo.trim() || !codigo.trim() || !revisaoUsuario.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);
    try {
      const res = await fetch("/api/ai/revisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          codigo: codigo.trim(),
          revisaoUsuario: revisaoUsuario.trim(),
          cardSlug: cardSlug.trim() || undefined,
          projectNome: activeProject?.nome,
          projectStack: activeProject?.stack,
        }),
      });
      const data = (await res.json()) as RevisorResult & { error?: string };
      if (data.error) {
        setError(data.error);
        return;
      }
      setResult(data);
    } catch {
      setError("Erro ao conectar com a API. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function salvar() {
    if (!result) return;
    setSaving(true);
    try {
      await createRevisorSession({
        titulo: titulo.trim(),
        codigo: codigo.trim(),
        revisaoUsuario: revisaoUsuario.trim(),
        cardSlug: cardSlug.trim() || undefined,
        revisaoIA: result.revisaoCompleta,
        lacunasUsuario: result.lacunas,
        acertosUsuario: result.acertos,
        scoreRevisao: result.scoreRevisao,
        status: "avaliado",
      });
      setSaved(true);
    } catch {
      setError("Erro ao salvar sessão.");
    } finally {
      setSaving(false);
    }
  }

  async function deletarSessao(id: string) {
    if (!confirm("Apagar esta revisão?")) return;
    await deleteRevisorSession(id);
    setHistorico((prev) => prev.filter((s) => s.id !== id));
  }

  function resetar() {
    setTitulo("");
    setCodigo("");
    setRevisaoUsuario("");
    setCardSlug("");
    setResult(null);
    setError("");
    setSaved(false);
    setRevisaoExpanded(false);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <Eye className="w-8 h-8 text-amber-500" />
          Revisor Ativo
        </h1>
        <p className="text-muted max-w-2xl">
          Revise o código por conta própria <strong>antes</strong> de ver o que a IA encontrou.
          Treine o olho crítico que separa devs sêniores dos demais.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line">
        {(["nova", "historico", "padroes"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "px-4 py-2 text-sm font-medium transition border-b-2 -mb-px",
              tab === t
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            {t === "nova"      && <span className="flex items-center gap-1.5"><Code2   className="w-4 h-4" /> Nova Revisão</span>}
            {t === "historico" && <span className="flex items-center gap-1.5"><History className="w-4 h-4" /> Histórico</span>}
            {t === "padroes"   && <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Pontos Cegos</span>}
          </button>
        ))}
      </div>

      {/* ─── Tab: Nova Revisão ─── */}
      {tab === "nova" && (
        <div className="space-y-6">
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

          {/* Notice */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Eye className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Escreva sua análise ANTES de ver a revisão da IA.</strong> Este é o exercício:
              identificar problemas independentemente desenvolve o julgamento crítico que a IA não substitui.
            </p>
          </div>

          {/* Form */}
          {!result && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo">Título da revisão</Label>
                  <Input
                    id="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="ex: UserService.createUser()"
                  />
                </div>
                <div>
                  <Label htmlFor="card-slug">Card de referência (opcional)</Label>
                  <Input
                    id="card-slug"
                    value={cardSlug}
                    onChange={(e) => setCardSlug(e.target.value)}
                    placeholder="ex: n-plus-1"
                  />
                </div>
              </div>

              {/* Two-column on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="codigo">Código para revisar</Label>
                  <Textarea
                    id="codigo"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Cole o código aqui…"
                    className="min-h-[300px] font-mono text-xs resize-y"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="revisao">Sua revisão</Label>
                  <Textarea
                    id="revisao"
                    value={revisaoUsuario}
                    onChange={(e) => setRevisaoUsuario(e.target.value)}
                    placeholder="Quais problemas você consegue identificar neste código? Seja específico: aponte linha, comportamento esperado vs real, risco de segurança/performance/manutenibilidade…"
                    className="min-h-[300px] resize-y"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                onClick={submeter}
                disabled={loading || !titulo.trim() || !codigo.trim() || !revisaoUsuario.trim()}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                    Analisando…
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Submeter minha revisão
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-5">
              {/* Score header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">Resultado: {titulo}</h2>
                  <ScoreBadge score={result.scoreRevisao} />
                </div>
                <Button variant="secondary" onClick={resetar}>
                  Nova revisão
                </Button>
              </div>

              {/* Two-column: acertos / lacunas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Acertos */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    Você acertou ({result.acertos.length})
                  </h3>
                  {result.acertos.length === 0 ? (
                    <p className="text-sm text-subtle">Nenhum item identificado corretamente.</p>
                  ) : (
                    <ul className="space-y-2">
                      {result.acertos.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Lacunas */}
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-red-700 dark:text-red-300">
                    <XCircle className="w-4 h-4" />
                    Você perdeu ({result.lacunas.length})
                  </h3>
                  {result.lacunas.length === 0 ? (
                    <p className="text-sm text-subtle">Nenhum problema importante foi perdido.</p>
                  ) : (
                    <ul className="space-y-2">
                      {result.lacunas.map((l, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Feedback geral */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <MessageSquare className="w-4 h-4" />
                  Feedback da IA
                </h3>
                <p className="text-sm leading-relaxed">{result.feedbackGeral}</p>
              </div>

              {/* Revisão completa expandível */}
              <div className="rounded-xl border border-line overflow-hidden">
                <button
                  onClick={() => setRevisaoExpanded((v) => !v)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-card hover:bg-card-hover transition text-left"
                >
                  <span className="font-semibold flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-500" />
                    Revisão completa da IA
                  </span>
                  {revisaoExpanded
                    ? <ChevronUp className="w-4 h-4 text-muted" />
                    : <ChevronDown className="w-4 h-4 text-muted" />}
                </button>
                {revisaoExpanded && (
                  <div className="px-5 py-4 border-t border-line prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownRenderer body={result.revisaoCompleta} />
                  </div>
                )}
              </div>

              {/* Save */}
              {!saved ? (
                <Card>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-medium text-sm">Salvar revisão no histórico</p>
                      <p className="text-xs text-subtle mt-0.5">
                        Guarda código, sua análise, resultado da IA e score.
                      </p>
                    </div>
                    <Button onClick={salvar} disabled={saving}>
                      {saving ? (
                        <>
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                          Salvando…
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Revisão salva no histórico.
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Histórico ─── */}
      {tab === "historico" && (
        <div className="space-y-4">
          {loadingHistorico ? (
            <div className="flex items-center gap-2 text-muted py-8">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
              Carregando histórico…
            </div>
          ) : historico.length === 0 ? (
            <Card className="text-center py-12 text-muted">
              <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhuma revisão salva ainda.</p>
              <p className="text-sm mt-1 text-subtle">
                Faça uma revisão na aba "Nova Revisão" e clique em Salvar.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {historico.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-line hover:border-line-strong bg-card transition"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{s.titulo}</p>
                      {s.scoreRevisao !== undefined && (
                        <ScoreBadge score={s.scoreRevisao} />
                      )}
                      <span
                        className={clsx(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          s.status === "avaliado"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                        )}
                      >
                        {s.status === "avaliado" ? "Avaliado" : "Pendente"}
                      </span>
                    </div>
                    <p className="text-xs text-subtle">
                      {new Date(s.criadoEm).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {s.cardSlug && ` · card: ${s.cardSlug}`}
                    </p>
                  </div>
                  <button
                    onClick={() => deletarSessao(s.id)}
                    className="p-1.5 text-subtle hover:text-red-500 transition shrink-0"
                    title="Apagar revisão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Pontos Cegos ─── */}
      {tab === "padroes" && (
        <div className="space-y-4">
          {loadingHistorico ? (
            <div className="flex items-center gap-2 text-muted py-8">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
              Analisando revisões…
            </div>
          ) : historico.length === 0 ? (
            <Card className="text-center py-12 text-muted">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhuma revisão avaliada ainda.</p>
              <p className="text-sm mt-1 text-subtle">Faça revisões e salve para ver seus pontos cegos.</p>
            </Card>
          ) : (() => {
            const avaliadas = historico.filter((s) => s.lacunasUsuario?.length);
            if (avaliadas.length === 0) return (
              <Card className="text-center py-12 text-muted">
                <p className="font-medium">Nenhuma lacuna registrada ainda.</p>
                <p className="text-sm mt-1 text-subtle">Complete revisões com avaliação da IA para ver padrões.</p>
              </Card>
            );

            // Aggregate lacunas with frequency count
            const freq = new Map<string, number>();
            avaliadas.forEach((s) => s.lacunasUsuario!.forEach((l) => {
              freq.set(l, (freq.get(l) ?? 0) + 1);
            }));
            const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
            const totalLacunas = sorted.reduce((acc, [, c]) => acc + c, 0);

            return (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span>{avaliadas.length} revisão{avaliadas.length > 1 ? "ões" : ""} analisada{avaliadas.length > 1 ? "s" : ""}</span>
                  <span className="w-1 h-1 rounded-full bg-muted/40" />
                  <span className="text-red-600 dark:text-red-400 font-medium">{totalLacunas} lacuna{totalLacunas > 1 ? "s" : ""} no total</span>
                </div>
                <div className="space-y-2">
                  {sorted.map(([lacuna, count], i) => (
                    <div
                      key={i}
                      className={clsx(
                        "flex items-start gap-3 p-3.5 rounded-xl border transition",
                        count > 1 ? "border-red-500/30 bg-red-500/5" : "border-line bg-card",
                      )}
                    >
                      <XCircle className={clsx("w-4 h-4 shrink-0 mt-0.5", count > 1 ? "text-red-500" : "text-muted")} />
                      <p className="text-sm flex-1 leading-relaxed">{lacuna}</p>
                      {count > 1 && (
                        <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400">
                          {count}×
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
