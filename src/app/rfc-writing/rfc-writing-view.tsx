"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  FileText, ChevronLeft, CheckCircle2, XCircle,
  AlertTriangle, Save, RotateCcw, ChevronDown, ChevronUp,
  Trash2, Zap,
} from "lucide-react";
import { Button, Card, Input, Label, Tag, Textarea } from "@/components/ui";
import { createRFCSession, deleteRFCSession, listRFCSessions, updateRFCSession } from "@/lib/db";
import type { RFCFeedback } from "@/app/api/ai/rfc/route";
import type { RFCSession } from "@/lib/types";

const RFC_TEMPLATE = `## Contexto
(O que existe hoje e por que é problemático)

## Objetivos
(O que queremos alcançar)

## Alternativas Consideradas
### Opção A: [Nome]
**Prós:** ...
**Contras:** ...

### Opção B: [Nome]
**Prós:** ...
**Contras:** ...

## Decisão Proposta
(Qual alternativa recomendo e por quê)

## Plano de Implementação
(Passos principais, riscos, rollback plan)

## Critérios de Sucesso
(Como saberemos que funcionou)`;

function ScoreBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = value >= 7 ? "bg-emerald-500" : value >= 5 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-medium tabular-nums">{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-card-hover overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

type Tab = "novo" | "meus";
type Step = 1 | 2 | 3;

export function RFCWritingView() {
  const [tab, setTab] = useState<Tab>("novo");
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [titulo, setTitulo] = useState("");
  const [problema, setProblema] = useState("");

  // Step 2
  const [rfc, setRfc] = useState("");

  // Step 3 — feedback
  const [feedback, setFeedback] = useState<RFCFeedback | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState("");

  // Save state
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // My RFCs
  const [rfcs, setRfcs] = useState<RFCSession[]>([]);
  const [rfcsLoading, setRfcsLoading] = useState(false);
  const [expandedRfc, setExpandedRfc] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [listError, setListError] = useState("");

  async function loadRFCs() {
    setRfcsLoading(true);
    try {
      const list = await listRFCSessions();
      setRfcs(list);
    } catch {
      setListError("Erro ao carregar RFCs.");
    } finally {
      setRfcsLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "meus") loadRFCs();
  }, [tab]);

  function resetForm() {
    setStep(1);
    setTitulo("");
    setProblema("");
    setRfc("");
    setFeedback(null);
    setCurrentId(null);
    setSaved(false);
    setSaveError("");
    setEvalError("");
  }

  async function avaliarRFC() {
    if (!rfc.trim()) return;
    setEvaluating(true);
    setEvalError("");
    setFeedback(null);
    try {
      const res = await fetch("/api/ai/rfc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, problema, rfc }),
      });
      const data = (await res.json()) as RFCFeedback & { error?: string };
      if (data.error) { setEvalError(data.error); return; }
      setFeedback(data);
      setStep(3);
    } catch {
      setEvalError("Erro ao conectar com a API.");
    } finally {
      setEvaluating(false);
    }
  }

  async function salvarRascunho() {
    if (!titulo.trim() || !problema.trim() || !rfc.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const session = await createRFCSession({
        titulo,
        problema,
        rfc,
        status: "rascunho",
      });
      setCurrentId(session.id);
      setSaved(true);
    } catch {
      setSaveError("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function salvarComFeedback() {
    if (!feedback) return;
    setSaving(true);
    setSaveError("");
    try {
      if (currentId) {
        await updateRFCSession(currentId, {
          feedbackIA: JSON.stringify(feedback),
          scoreClarez: feedback.scoreClarez,
          scoreCompletude: feedback.scoreCompletude,
          scoreRaciocinio: feedback.scoreRaciocinio,
          status: "revisado",
        });
      } else {
        const session = await createRFCSession({
          titulo,
          problema,
          rfc,
          feedbackIA: JSON.stringify(feedback),
          scoreClarez: feedback.scoreClarez,
          scoreCompletude: feedback.scoreCompletude,
          scoreRaciocinio: feedback.scoreRaciocinio,
          status: "revisado",
        });
        setCurrentId(session.id);
      }
      setSaved(true);
    } catch {
      setSaveError("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function excluir(id: string) {
    setDeleting(id);
    try {
      await deleteRFCSession(id);
      setRfcs((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setListError("Erro ao excluir.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <FileText className="w-8 h-8 text-amber-500" />
          RFC Writing
        </h1>
        <p className="text-muted max-w-xl">
          Pratique escrever propostas técnicas. Avaliado como se você fosse um Staff Engineer enviando ao time.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line">
        {(["novo", "meus"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); }}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition",
              tab === t ? "border-amber-500 text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {t === "novo" ? "Novo RFC" : "Meus RFCs"}
          </button>
        ))}
      </div>

      {/* MEUS RFCS */}
      {tab === "meus" && (
        <div className="space-y-4">
          {rfcsLoading ? (
            <div className="flex items-center gap-2 text-muted text-sm">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Carregando...
            </div>
          ) : listError ? (
            <p className="text-sm text-red-500">{listError}</p>
          ) : rfcs.length === 0 ? (
            <p className="text-muted text-sm">Nenhum RFC salvo ainda.</p>
          ) : (
            rfcs.map((r) => (
              <Card key={r.id} className="space-y-3">
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedRfc(expandedRfc === r.id ? null : r.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{r.titulo}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted">{new Date(r.criadoEm).toLocaleDateString("pt-BR")}</p>
                        <Tag color={r.status === "revisado" ? "emerald" : "zinc"}>
                          {r.status === "revisado" ? "Revisado" : "Rascunho"}
                        </Tag>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {r.scoreClarez != null && (
                        <div className="text-right">
                          <p className="text-xs text-muted">Score</p>
                          <p className={clsx("text-lg font-bold tabular-nums", scoreColor((r.scoreClarez + (r.scoreCompletude ?? 0) + (r.scoreRaciocinio ?? 0)) / 3 * 10))}>
                            {r.scoreClarez + (r.scoreCompletude ?? 0) + (r.scoreRaciocinio ?? 0)}/30
                          </p>
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); excluir(r.id); }}
                        disabled={deleting === r.id}
                        className="p-1.5 rounded text-muted hover:text-red-500 hover:bg-red-500/10 transition"
                      >
                        {deleting === r.id
                          ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                      {expandedRfc === r.id
                        ? <ChevronUp className="w-4 h-4 text-muted" />
                        : <ChevronDown className="w-4 h-4 text-muted" />}
                    </div>
                  </div>
                </button>
                {expandedRfc === r.id && (
                  <div className="space-y-4 pt-3 border-t border-line">
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide mb-1">Problema</p>
                      <p className="text-sm text-fg">{r.problema}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide mb-1">RFC</p>
                      <p className="text-sm text-fg whitespace-pre-wrap">{r.rfc}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* NOVO RFC */}
      {tab === "novo" && (
        <div className="space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            {([1, 2, 3] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted">→</span>}
                <span className={clsx(
                  "font-medium",
                  step === s ? "text-amber-600 dark:text-amber-400" : step > s ? "text-emerald-600 dark:text-emerald-400" : "text-muted",
                )}>
                  {s === 1 ? "Problema" : s === 2 ? "Escrever RFC" : "Feedback"}
                </span>
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <Card className="space-y-5 max-w-2xl">
              <h2 className="text-base font-semibold">Defina o problema</h2>
              <div className="space-y-1.5">
                <Label htmlFor="rfc-titulo">Título do RFC</Label>
                <Input
                  id="rfc-titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Migração de Session Store para Redis"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rfc-problema">Descrição do problema</Label>
                <Textarea
                  id="rfc-problema"
                  rows={5}
                  value={problema}
                  onChange={(e) => setProblema(e.target.value)}
                  placeholder="O que está errado hoje? Por que isso importa? Qual o impacto se não resolver?"
                />
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!titulo.trim() || !problema.trim()}
                className="w-full justify-center"
              >
                Continuar →
              </Button>
            </Card>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-sm text-muted hover:text-fg transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <span className="font-semibold text-sm">{titulo}</span>
              </div>

              {/* Template reference */}
              <div className="rounded-lg border border-line bg-card-hover p-4 space-y-2">
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Template sugerido</p>
                <pre className="text-xs text-muted whitespace-pre-wrap font-mono leading-relaxed">{RFC_TEMPLATE}</pre>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rfc-content">Seu RFC</Label>
                <Textarea
                  id="rfc-content"
                  rows={24}
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value)}
                  placeholder="Escreva seu RFC seguindo o template acima..."
                  className="min-h-[600px] font-mono text-sm"
                />
              </div>

              {evalError && <p className="text-sm text-red-500">{evalError}</p>}
              {saveError && <p className="text-sm text-red-500">{saveError}</p>}

              <div className="flex items-center gap-3">
                <Button
                  onClick={avaliarRFC}
                  disabled={evaluating || !rfc.trim()}
                  className="flex-1 justify-center"
                >
                  {evaluating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Avaliando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> Avaliar RFC
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={salvarRascunho}
                  disabled={saving || saved || !rfc.trim()}
                >
                  {saving
                    ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <Save className="w-4 h-4" />}
                  {saved ? "Salvo!" : "Salvar rascunho"}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 — FEEDBACK */}
          {step === 3 && feedback && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 text-sm text-muted hover:text-fg transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Editar RFC
                </button>
                <span className="font-semibold text-sm">{titulo}</span>
              </div>

              {/* Score geral */}
              <Card className="flex items-center gap-6">
                <div className="text-center shrink-0">
                  <span className={clsx("text-6xl font-bold tabular-nums", scoreColor(feedback.scoreGeral))}>
                    {feedback.scoreGeral}
                  </span>
                  <p className="text-xs text-muted mt-1">/ 100</p>
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {feedback.scoreGeral >= 75 ? "RFC sólido" : feedback.scoreGeral >= 50 ? "RFC razoável" : "Precisa de melhorias"}
                  </p>
                  <p className="text-sm text-muted mt-1">Avaliado como Staff Engineer</p>
                </div>
              </Card>

              {/* 3 dimensões */}
              <Card className="space-y-4">
                <p className="text-sm font-semibold text-muted uppercase tracking-wide">Dimensões</p>
                <ScoreBar label="Clareza do problema" value={feedback.scoreClarez} />
                <ScoreBar label="Completude (alternativas)" value={feedback.scoreCompletude} />
                <ScoreBar label="Solidez do raciocínio" value={feedback.scoreRaciocinio} />
              </Card>

              {/* Pontos fortes */}
              {feedback.pontosFortes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Pontos fortes
                  </p>
                  <ul className="space-y-1.5">
                    {feedback.pontosFortes.map((p, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pontos frágeis */}
              {feedback.pontosFrageis.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" /> Pontos frágeis
                  </p>
                  <ul className="space-y-1.5">
                    {feedback.pontosFrageis.map((p, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Alternativas não consideradas */}
              {feedback.alternativasNaoConsideradas.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2 text-sky-600 dark:text-sky-400">
                    Alternativas não consideradas
                  </p>
                  <ul className="space-y-1.5">
                    {feedback.alternativasNaoConsideradas.map((p, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Perguntas não respondidas */}
              {feedback.perguntasNaoRespondidas.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="w-4 h-4" /> Perguntas que leitores fariam
                  </p>
                  <ul className="space-y-1.5">
                    {feedback.perguntasNaoRespondidas.map((p, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sugestões de estrutura */}
              {feedback.sugestoesEstrutura.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted">Sugestões de estrutura</p>
                  <ul className="space-y-1.5">
                    {feedback.sugestoesEstrutura.map((p, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-line bg-card-hover px-3 py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted mt-1.5 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Feedback geral */}
              <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4 space-y-1.5">
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Feedback geral</p>
                <p className="text-sm leading-relaxed">{feedback.feedbackGeral}</p>
              </div>

              {saveError && <p className="text-sm text-red-500">{saveError}</p>}

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={salvarComFeedback}
                  disabled={saving || saved}
                >
                  {saving
                    ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <Save className="w-4 h-4" />}
                  {saved ? "Salvo!" : "Salvar com feedback"}
                </Button>
                <Button variant="secondary" onClick={resetForm}>
                  <RotateCcw className="w-4 h-4" /> Novo RFC
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
