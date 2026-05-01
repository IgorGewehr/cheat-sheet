"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { clsx } from "clsx";
import {
  Hourglass,
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
} from "lucide-react";
import { Button, Card, Label, Textarea } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import {
  createIdleSession,
  createQuestSession,
  listAllDecisoes,
  listAllAdocoes,
  markDecisaoRevisitada,
} from "@/lib/db";
import { getWorkspaceId } from "@/lib/workspace";
import type { ParsePlanResult } from "@/app/api/idle/parse-plan/route";
import type { QuestResult } from "@/app/api/idle/quest/route";
import type { QuestFeedbackResult } from "@/app/api/idle/quest-feedback/route";

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
      if (!res.ok) throw new Error("Falha na análise");
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
      setError("Erro ao salvar sessão.");
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
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <Hourglass className="w-5 h-5 text-amber-500" />
        <h2 className="font-semibold text-fg">Plano em voo</h2>
        <span className="text-xs text-muted ml-1">— analise antes de aprovar</span>
      </div>

      {!result && (
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="plano-input">Cole o plano do agente aqui</Label>
            <Textarea
              id="plano-input"
              rows={10}
              value={plano}
              onChange={(e) => setPlano(e.target.value)}
              placeholder={`Cole o plano markdown do .claude/plans/... ou descreva o que pediu para o Claude/Cursor fazer.\n\nEx:\n## Objetivo\nRefatorar módulo de auth do saas-erp para suportar SSO.\n\n## Passos\n1. Extrair AuthService de UserController\n2. ...`}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button
            onClick={handleParsePlan}
            disabled={loading || !plano.trim()}
          >
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
        <div className="flex flex-col gap-4 overflow-y-auto">
          {/* Riscos */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-fg">3 riscos para revisar</span>
            </div>
            <div className="flex flex-col gap-2">
              {result.riscos.map((risco, i) => (
                <button
                  key={i}
                  onClick={() => toggleRisco(i)}
                  className={clsx(
                    "flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition",
                    riscosConsiderados[i]
                      ? "border-emerald-500/40 bg-emerald-500/10 text-fg"
                      : "border-line bg-card hover:border-amber-500/40 text-fg",
                  )}
                >
                  {riscosConsiderados[i] ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  )}
                  <span>{risco}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Perguntas Pré-mortem */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-medium text-fg">2 perguntas pré-mortem</span>
            </div>
            <ul className="flex flex-col gap-2">
              {result.perguntas.map((p, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-sm text-fg"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Alternativa */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-medium text-fg">1 alternativa não considerada</span>
            </div>
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 text-sm text-fg">
              {result.alternativa}
            </div>
          </div>

          {/* Observação + salvar */}
          {!saved && (
            <div className="flex flex-col gap-3 pt-1 border-t border-line">
              <div>
                <Label htmlFor="observacao">Observação (opcional)</Label>
                <Textarea
                  id="observacao"
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Notas sobre o que você percebeu ou decidiu..."
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
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
                      Salvar revisão
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
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Revisão salva!
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
      // Busca decisões e adoções client-side (Firestore client SDK)
      const [decisoes, adocoes] = await Promise.all([
        listAllDecisoes(),
        listAllAdocoes(),
      ]);

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
            ? `${quest.decisao.contexto}\nDecisão: ${quest.decisao.decisao}`
            : undefined,
        }),
      });
      if (!res.ok) throw new Error("Falha no feedback");
      const fbData = (await res.json()) as QuestFeedbackResult;
      setFeedback(fbData);

      // Salva QuestSession e marca decisão como revisitada (operações client-side paralelas)
      const ts = Date.now();
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
        quest.decisao?.id
          ? markDecisaoRevisitada(quest.decisao.id, ts)
          : Promise.resolve(),
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
    timerPct > 0.5
      ? "text-emerald-500"
      : timerPct > 0.25
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <Timer className="w-5 h-5 text-amber-500" />
        <h2 className="font-semibold text-fg">Micro-quest 90s</h2>
        <span className="text-xs text-muted ml-1">— SRS de decisão real</span>
      </div>

      {phase === "idle" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted leading-relaxed">
            Uma decisão que você tomou há 30+ dias será reformulada como uma pergunta de
            trade-off. Você tem 90 segundos (não bloqueante).
          </p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={generateQuest}>
            <Zap className="w-4 h-4" />
            Gerar quest agora
          </Button>
        </div>
      )}

      {phase === "loading" && (
        <div className="flex items-center gap-3 text-sm text-muted py-4">
          <span className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          Buscando sua decisão mais antiga…
        </div>
      )}

      {(phase === "active" || phase === "answering") && quest && (
        <div className="flex flex-col gap-4">
          {/* Timer */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-100",
                  timerPct > 0.5
                    ? "bg-emerald-500"
                    : timerPct > 0.25
                      ? "bg-amber-500"
                      : "bg-red-500",
                )}
                style={{ width: `${timerPct * 100}%` }}
              />
            </div>
            <span className={clsx("text-sm font-mono font-medium w-10 text-right", timerColor)}>
              {timerSec}s
            </span>
          </div>

          {quest.fallback && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-muted">
              Fallback: nenhuma decisão com 30+ dias encontrada — pergunta genérica de ERP/backend.
            </div>
          )}

          {quest.contexto && (
            <p className="text-xs text-muted italic">{quest.contexto}</p>
          )}

          <div className="rounded-xl border border-line bg-card p-4">
            <p className="text-sm text-fg leading-relaxed font-medium">{quest.pergunta}</p>
          </div>

          <div>
            <Label htmlFor="quest-resposta">Sua resposta</Label>
            <Textarea
              id="quest-resposta"
              rows={5}
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              placeholder="Escreva seu raciocínio de trade-off…"
              disabled={phase === "answering"}
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            onClick={submitAnswer}
            disabled={phase === "answering" || !resposta.trim()}
          >
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
          {/* Score */}
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "flex items-center justify-center w-14 h-14 rounded-xl text-xl font-bold border-2",
                feedback.score >= 80
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                  : feedback.score >= 60
                    ? "border-amber-500 bg-amber-500/10 text-amber-500"
                    : "border-red-500 bg-red-500/10 text-red-500",
              )}
            >
              {feedback.score}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-fg">
                <Trophy className="w-4 h-4 text-amber-500" />
                {feedback.score >= 80
                  ? "Raciocínio excelente!"
                  : feedback.score >= 60
                    ? "Bom raciocínio"
                    : "Continue praticando"}
              </div>
              {quest.decisao && (
                <p className="text-xs text-muted mt-0.5">
                  Decisão marcada como revisitada em{" "}
                  {new Date().toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </div>

          {/* Feedback */}
          <Card className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer body={feedback.feedback} />
          </Card>

          {/* Pergunta que foi feita */}
          <details className="text-xs text-muted">
            <summary className="cursor-pointer hover:text-fg transition">
              Ver pergunta original
            </summary>
            <div className="mt-2 p-3 rounded-lg border border-line bg-card text-sm text-fg">
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

// ── Main View ─────────────────────────────────────────────────

export function IdleView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 shrink-0">
          <Hourglass className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-fg">Enquanto a IA trabalha</h1>
          <p className="text-sm text-muted mt-0.5">
            Aproveite a janela de 30s–5min para ativar o cérebro. Analise um plano ou responda
            uma micro-quest de decisão real.
          </p>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Plan Review — 60% */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <PlanReviewPanel />
          </Card>
        </div>

        {/* Quest — 40% */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <QuestPanel />
          </Card>
        </div>
      </div>
    </div>
  );
}
