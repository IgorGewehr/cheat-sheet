"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { clsx } from "clsx";
import {
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Zap,
  CheckCircle2,
  Circle,
  Timer,
  RotateCcw,
  CheckCheck,
  Trophy,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Bug,
  MicOff,
  FileText,
} from "lucide-react";
import { Button, Label, Textarea } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import {
  createIdleSession,
  createQuestSession,
  listAllDecisoes,
  listAllAdocoes,
  markDecisaoRevisitada,
  listIdleSessions,
} from "@/lib/db";
import { getWorkspaceId } from "@/lib/workspace";
import type { ParsePlanResult } from "@/app/api/idle/parse-plan/route";
import type { QuestResult } from "@/app/api/idle/quest/route";
import type { QuestFeedbackResult } from "@/app/api/idle/quest-feedback/route";
import type { QuickResult, QuickTipo } from "@/app/api/idle/quick/route";
import { QUICK_MODES, type QuickMode } from "@/lib/idle-quick-types";
import type { IdleSession } from "@/lib/types";

// ── Plan Review Panel ──────────────────────────────────────────

function PlanReviewPanel() {
  const [plano, setPlano] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsePlanResult | null>(null);
  const [riscosConsiderados, setRiscosConsiderados] = useState<boolean[]>([]);
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParsePlan() {
    if (!plano.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/idle/parse-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano }),
      });
      if (!res.ok) throw new Error("Falha na analise");
      const data = (await res.json()) as ParsePlanResult;
      setResult(data);
      setRiscosConsiderados(new Array(data.riscos.length).fill(false));
    } catch {
      setError("Erro ao analisar o plano. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function toggleRisco(i: number) {
    setRiscosConsiderados((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      await createIdleSession({
        workspaceId: getWorkspaceId(),
        plano,
        riscosIA: result.riscos,
        perguntasIA: result.perguntas,
        alternativaIA: result.alternativa,
        riscosConsiderados: result.riscos.filter((_, i) => riscosConsiderados[i]),
        observacao: observacao.trim() || undefined,
      });
      setSaved(true);
    } catch {
      setError("Erro ao salvar sessao.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setPlano("");
    setResult(null);
    setRiscosConsiderados([]);
    setObservacao("");
    setSaved(false);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {!result && (
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="plano-input">Cole o plano do agente aqui</Label>
            <Textarea
              id="plano-input"
              rows={10}
              value={plano}
              onChange={(e) => setPlano(e.target.value)}
              placeholder={`Cole o plano markdown do .claude/plans/... ou descreva o que pediu para o Claude/Cursor fazer.\n\nEx:\n## Objetivo\nRefatorar modulo de auth do saas-erp para suportar SSO.\n\n## Passos\n1. Extrair AuthService de UserController\n2. ...`}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button onClick={handleParsePlan} disabled={loading || !plano.trim()}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Analisando…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Carregar plano
              </>
            )}
          </Button>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-fg">3 riscos para revisar</span>
            </div>
            <div className="flex flex-col gap-2">
              {result.riscos.map((risco, i) => (
                <button
                  key={i}
                  onClick={() => toggleRisco(i)}
                  className={clsx(
                    "flex items-start gap-3 rounded-xl border p-3 text-left text-sm transition",
                    riscosConsiderados[i]
                      ? "border-emerald-500/30 bg-emerald-500/8 text-fg"
                      : "border-violet-500/15 bg-violet-500/5 hover:border-violet-500/25 text-fg",
                  )}
                >
                  {riscosConsiderados[i] ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  )}
                  <span>{risco}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-medium text-fg">2 perguntas pre-mortem</span>
            </div>
            <ul className="flex flex-col gap-2">
              {result.perguntas.map((p, i) => (
                <li key={i} className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-sm text-fg">
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-fg">1 alternativa nao considerada</span>
            </div>
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-sm text-fg">
              {result.alternativa}
            </div>
          </div>

          {!saved && (
            <div className="flex flex-col gap-3 pt-1 border-t border-violet-500/10">
              <div>
                <Label htmlFor="observacao">Observacao (opcional)</Label>
                <Textarea
                  id="observacao"
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Notas sobre o que voce percebeu ou decidiu..."
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Salvando…
                    </>
                  ) : (
                    <>
                      <CheckCheck className="w-4 h-4" />
                      Salvar revisao
                    </>
                  )}
                </Button>
                <Button variant="ghost" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" />
                  Novo plano
                </Button>
              </div>
            </div>
          )}

          {saved && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3">
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Revisao salva
              </div>
              <Button variant="ghost" onClick={handleReset} className="text-xs">
                <RotateCcw className="w-3 h-3" />
                Novo plano
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Quick Mode Panel ───────────────────────────────────────────

function QuickModePanel({ tipo }: { tipo: QuickTipo }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mode = QUICK_MODES.find((m) => m.id === tipo)!;

  async function handleSubmit() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/idle/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, input }),
      });
      if (!res.ok) throw new Error("Falha");
      const data = (await res.json()) as QuickResult;
      setResult(data);
    } catch {
      setError("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const prefix = `[tipo: ${tipo}]\n`;
      await createIdleSession({
        workspaceId: getWorkspaceId(),
        plano: input,
        riscosIA: [],
        perguntasIA: [],
        alternativaIA: "",
        riscosConsiderados: [],
        observacao: prefix + JSON.stringify(result),
      });
      setSaved(true);
    } catch {
      setError("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setInput("");
    setResult(null);
    setSaved(false);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {!result && (
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor={`quick-input-${tipo}`}>{mode.label}</Label>
            <Textarea
              id={`quick-input-${tipo}`}
              rows={5}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode.placeholder}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button onClick={handleSubmit} disabled={loading || !input.trim()}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Analisando…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analisar
              </>
            )}
          </Button>
        </div>
      )}

      {result && result.tipo === "decisao" && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide font-medium mb-2">3 criterios</p>
            <ul className="flex flex-col gap-2">
              {result.criterios.map((c, i) => (
                <li key={i} className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-sm text-fg flex gap-2">
                  <span className="text-violet-400/70 font-mono text-xs mt-0.5">{i + 1}.</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wide font-medium mb-2">Recomendacao</p>
            <div className="rounded-xl border border-violet-500/25 bg-violet-500/8 p-3 text-sm text-fg">
              {result.recomendacao}
            </div>
          </div>
          {result.contexto && (
            <div className="rounded-xl border border-violet-500/10 bg-violet-500/5 p-3 text-xs text-muted">
              {result.contexto}
            </div>
          )}
          <QuickSaveRow saved={saved} saving={saving} error={error} onSave={handleSave} onReset={handleReset} />
        </div>
      )}

      {result && result.tipo === "bug" && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted uppercase tracking-wide font-medium">5 hipoteses por probabilidade</p>
          <div className="flex flex-col gap-2">
            {result.hipoteses.map((h, i) => (
              <div key={i} className="rounded-xl border border-violet-500/15 bg-violet-500/5 p-3 text-sm">
                <div className="flex gap-2 items-start mb-1">
                  <span className="text-violet-400/70 font-mono text-xs mt-0.5 shrink-0">{i + 1}.</span>
                  <span className="text-fg font-medium">{h.hipotese}</span>
                </div>
                <p className="text-xs text-muted pl-5">{h.comoDescartar}</p>
              </div>
            ))}
          </div>
          <QuickSaveRow saved={saved} saving={saving} error={error} onSave={handleSave} onReset={handleReset} />
        </div>
      )}

      {result && result.tipo === "standup" && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide font-medium mb-2">Proximo passo</p>
            <div className="rounded-xl border border-violet-500/25 bg-violet-500/8 p-3 text-sm text-fg">
              {result.proximoPasso}
            </div>
          </div>
          {result.dividasPotenciais.length > 0 && (
            <div>
              <p className="text-xs text-muted uppercase tracking-wide font-medium mb-2">Dividas potenciais</p>
              <ul className="flex flex-col gap-2">
                {result.dividasPotenciais.map((d, i) => (
                  <li key={i} className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3 text-sm text-fg flex gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70 shrink-0 mt-0.5" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <QuickSaveRow saved={saved} saving={saving} error={error} onSave={handleSave} onReset={handleReset} />
        </div>
      )}
    </div>
  );
}

function QuickSaveRow({
  saved,
  saving,
  error,
  onSave,
  onReset,
}: {
  saved: boolean;
  saving: boolean;
  error: string | null;
  onSave: () => void;
  onReset: () => void;
}) {
  if (saved) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3">
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          Salvo
        </div>
        <Button variant="ghost" onClick={onReset} className="text-xs">
          <RotateCcw className="w-3 h-3" />
          Nova consulta
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 pt-1 border-t border-violet-500/10">
      {error && <p className="text-sm text-red-400 flex-1">{error}</p>}
      <Button onClick={onSave} disabled={saving} variant="secondary">
        {saving ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Salvando…
          </>
        ) : (
          <>
            <CheckCheck className="w-4 h-4" />
            Salvar
          </>
        )}
      </Button>
      <Button variant="ghost" onClick={onReset}>
        <RotateCcw className="w-4 h-4" />
        Novo
      </Button>
    </div>
  );
}

// ── Quest Panel ───────────────────────────────────────────────

const QUEST_DURATION_MS = 90 * 1000;

type QuestPhase = "idle" | "loading" | "active" | "answering" | "done";

function QuestPanel() {
  const [phase, setPhase] = useState<QuestPhase>("idle");
  const [quest, setQuest] = useState<QuestResult | null>(null);
  const [resposta, setResposta] = useState("");
  const [feedback, setFeedback] = useState<QuestFeedbackResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUEST_DURATION_MS);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const spent = Date.now() - startTimeRef.current;
      setTimeLeft(Math.max(0, QUEST_DURATION_MS - spent));
      setElapsed(spent);
    }, 100);
  }, [stopTimer]);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  async function generateQuest() {
    setPhase("loading");
    setError(null);
    setQuest(null);
    setResposta("");
    setFeedback(null);
    try {
      const [decisoes, adocoes] = await Promise.all([listAllDecisoes(), listAllAdocoes()]);
      const res = await fetch("/api/idle/quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisoes, adocoes }),
      });
      if (!res.ok) throw new Error("Falha ao gerar quest");
      const data = (await res.json()) as QuestResult;
      setQuest(data);
      setPhase("active");
      setTimeLeft(QUEST_DURATION_MS);
      startTimer();
    } catch {
      setError("Erro ao gerar a quest. Tente novamente.");
      setPhase("idle");
    }
  }

  async function submitAnswer() {
    if (!resposta.trim() || !quest) return;
    stopTimer();
    const duration = elapsed > 0 ? elapsed : QUEST_DURATION_MS - timeLeft;
    setPhase("answering");
    setError(null);
    try {
      const res = await fetch("/api/idle/quest-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pergunta: quest.pergunta,
          resposta,
          contextoOriginal: quest.decisao
            ? `${quest.decisao.contexto}\nDecisao: ${quest.decisao.decisao}`
            : undefined,
        }),
      });
      if (!res.ok) throw new Error("Falha no feedback");
      const fbData = (await res.json()) as QuestFeedbackResult;
      setFeedback(fbData);
      await Promise.allSettled([
        createQuestSession({
          workspaceId: getWorkspaceId(),
          decisaoId: quest.decisao?.id,
          fallback: quest.fallback,
          pergunta: quest.pergunta,
          resposta: resposta.trim(),
          feedback: fbData.feedback,
          score: fbData.score,
          duracaoMs: duration,
        }),
        quest.decisao?.id ? markDecisaoRevisitada(quest.decisao.id, Date.now()) : Promise.resolve(),
      ]);
      setPhase("done");
    } catch {
      setError("Erro ao gerar feedback. Tente novamente.");
      setPhase("active");
      startTimer();
    }
  }

  function resetQuest() {
    stopTimer();
    setPhase("idle");
    setQuest(null);
    setResposta("");
    setFeedback(null);
    setTimeLeft(QUEST_DURATION_MS);
    setElapsed(0);
    setError(null);
  }

  const timerPct = timeLeft / QUEST_DURATION_MS;
  const timerSec = Math.ceil(timeLeft / 1000);
  const timerColor =
    timerPct > 0.5 ? "text-emerald-400" : timerPct > 0.25 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-medium text-fg">Micro-quest 90s</span>
        <span className="text-xs text-muted ml-1">SRS de decisao real</span>
      </div>

      {phase === "idle" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted leading-relaxed">
            Uma decisao que voce tomou ha 30+ dias sera reformulada como uma pergunta de trade-off.
            Voce tem 90 segundos.
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button onClick={generateQuest}>
            <Zap className="w-4 h-4" />
            Gerar quest agora
          </Button>
        </div>
      )}

      {phase === "loading" && (
        <div className="flex items-center gap-3 text-sm text-muted py-4">
          <span className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          Buscando sua decisao mais antiga…
        </div>
      )}

      {(phase === "active" || phase === "answering") && quest && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-100",
                  timerPct > 0.5 ? "bg-emerald-500" : timerPct > 0.25 ? "bg-amber-500" : "bg-red-500",
                )}
                style={{ width: `${timerPct * 100}%` }}
              />
            </div>
            <span className={clsx("text-sm font-mono font-medium w-10 text-right", timerColor)}>
              {timerSec}s
            </span>
          </div>

          {quest.fallback && (
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 px-3 py-2 text-xs text-muted">
              Nenhuma decisao com 30+ dias encontrada — pergunta generica de ERP/backend.
            </div>
          )}
          {quest.contexto && <p className="text-xs text-muted italic">{quest.contexto}</p>}

          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="text-sm text-fg leading-relaxed font-medium">{quest.pergunta}</p>
          </div>

          <div>
            <Label htmlFor="quest-resposta">Sua resposta</Label>
            <Textarea
              id="quest-resposta"
              rows={5}
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              placeholder="Escreva seu raciocinio de trade-off…"
              disabled={phase === "answering"}
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button onClick={submitAnswer} disabled={phase === "answering" || !resposta.trim()}>
            {phase === "answering" ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Avaliando…
              </>
            ) : (
              <>
                <CheckCheck className="w-4 h-4" />
                Enviar resposta
              </>
            )}
          </Button>
        </div>
      )}

      {phase === "done" && feedback && quest && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "flex items-center justify-center w-14 h-14 rounded-xl text-xl font-bold border-2",
                feedback.score >= 80
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : feedback.score >= 60
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : "border-red-500/50 bg-red-500/10 text-red-400",
              )}
            >
              {feedback.score}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-fg">
                <Trophy className="w-4 h-4 text-violet-400" />
                {feedback.score >= 80
                  ? "Raciocinio excelente"
                  : feedback.score >= 60
                    ? "Bom raciocinio"
                    : "Continue praticando"}
              </div>
              {quest.decisao && (
                <p className="text-xs text-muted mt-0.5">
                  Decisao marcada como revisitada em {new Date().toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </div>

          <div className="glass rounded-xl p-4 prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer body={feedback.feedback} />
          </div>

          <details className="text-xs text-muted">
            <summary className="cursor-pointer hover:text-fg transition">Ver pergunta original</summary>
            <div className="mt-2 p-3 rounded-xl border border-violet-500/15 bg-violet-500/5 text-sm text-fg">
              {quest.pergunta}
            </div>
          </details>

          <Button onClick={resetQuest} variant="secondary">
            <RotateCcw className="w-4 h-4" />
            Nova quest
          </Button>
        </div>
      )}
    </div>
  );
}

// ── History Panel ─────────────────────────────────────────────

function HistoryPanel() {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<IdleSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || sessions.length > 0) return;
    setLoading(true);
    listIdleSessions()
      .then((s) => setSessions(s.slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, sessions.length]);

  function tipoLabel(s: IdleSession): string {
    const obs = s.observacao ?? "";
    if (obs.startsWith("[tipo: decisao]")) return "Decisao rapida";
    if (obs.startsWith("[tipo: bug]")) return "Bug detective";
    if (obs.startsWith("[tipo: standup]")) return "Stand-up reverso";
    return "Plano completo";
  }

  function inputPreview(s: IdleSession): string {
    return s.plano.replace(/\n/g, " ").slice(0, 80) + (s.plano.length > 80 ? "…" : "");
  }

  return (
    <div className="glass rounded-2xl border border-violet-500/15">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-sm font-medium text-fg hover:text-violet-300 transition-colors"
      >
        <span>Historico de sessoes</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          {loading && (
            <div className="text-sm text-muted py-2">Carregando…</div>
          )}
          {!loading && sessions.length === 0 && (
            <p className="text-sm text-muted">Nenhuma sessao registrada ainda.</p>
          )}
          {!loading && sessions.length > 0 && (
            <div className="flex flex-col gap-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-violet-500/10 bg-violet-500/5 px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-violet-300">{tipoLabel(s)}</p>
                    <p className="text-xs text-muted truncate mt-0.5">{inputPreview(s)}</p>
                  </div>
                  <span className="text-xs text-muted shrink-0">
                    {new Date(s.criadoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mode selector ─────────────────────────────────────────────

const MODE_ICONS: Record<QuickMode, React.ReactNode> = {
  plano: <FileText className="w-5 h-5" />,
  decisao: <GitBranch className="w-5 h-5" />,
  bug: <Bug className="w-5 h-5" />,
  standup: <MicOff className="w-5 h-5" />,
};

// ── Main View ─────────────────────────────────────────────────

export function IdleView() {
  const [activeMode, setActiveMode] = useState<QuickMode>("plano");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-fg">Enquanto a IA trabalha</h1>
        <p className="text-sm text-muted mt-1">
          Aproveite a janela de 30s–5min para ativar o cerebro. Analise um plano, resolva uma
          decisao ou faca uma micro-quest.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={clsx(
              "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
              activeMode === mode.id
                ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                : "border-violet-500/10 bg-violet-500/5 text-muted hover:border-violet-500/25 hover:text-fg",
            )}
          >
            <span
              className={clsx(
                activeMode === mode.id ? "text-violet-400" : "text-muted",
              )}
            >
              {MODE_ICONS[mode.id]}
            </span>
            <div>
              <p className="text-sm font-medium leading-tight text-inherit">{mode.label}</p>
              <p className="text-xs text-muted mt-0.5 leading-snug">{mode.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="glass rounded-2xl p-6 border border-violet-500/15">
            {activeMode === "plano" && <PlanReviewPanel />}
            {activeMode !== "plano" && <QuickModePanel tipo={activeMode as QuickTipo} />}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-6 border border-violet-500/15">
            <QuestPanel />
          </div>
        </div>
      </div>

      <HistoryPanel />
    </div>
  );
}
