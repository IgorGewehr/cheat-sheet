"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, Loader2, Sparkles, XCircle } from "lucide-react";
import type { ExamTier } from "@/lib/go-exam-questions";
import type { ExamEvaluation } from "@/app/api/ai/go-exam/route";
import { saveGoExamSession, getLatestGoExamSession, type GoExamSession } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

interface Props {
  exam: ExamTier;
}

type Phase = "intro" | "answering" | "submitting" | "result";

export function ExamView({ exam }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluation, setEvaluation] = useState<ExamEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previous, setPrevious] = useState<GoExamSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    getLatestGoExamSession(exam.tier).then(setPrevious).catch(() => {});
  }, [exam.tier]);

  useEffect(() => {
    if (phase !== "answering" || startedAt === null) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase, startedAt]);

  const totalQuestions = exam.questions.length;
  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length;

  function handleStart() {
    setPhase("answering");
    setStartedAt(Date.now());
    setElapsed(0);
  }

  async function handleSubmit() {
    if (answeredCount < totalQuestions) {
      const proceed = confirm(
        `Você só respondeu ${answeredCount} de ${totalQuestions} questões. Em branco vira FAIL na avaliação. Tem certeza?`,
      );
      if (!proceed) return;
    }

    setPhase("submitting");
    setError(null);

    try {
      const payload = {
        tier: exam.tier,
        answers: exam.questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? "" })),
      };

      const res = await fetch("/api/ai/go-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const evalResult = (await res.json()) as ExamEvaluation;
      setEvaluation(evalResult);

      // Persiste sessão
      const session: GoExamSession = {
        id: uuidv4(),
        tier: exam.tier,
        finalScore: evalResult.finalScore,
        passed: evalResult.passed,
        threshold: evalResult.threshold,
        recommendation: evalResult.recommendation,
        feedbackGeral: evalResult.feedbackGeral,
        pontosFortes: evalResult.pontosFortes ?? [],
        areasDesenvolvimento: evalResult.areasDesenvolvimento ?? [],
        questoes: evalResult.questoes ?? [],
        answers: payload.answers,
        criadoEm: Date.now(),
      };
      await saveGoExamSession(session).catch(console.error);

      setPhase("result");
    } catch (err) {
      console.error(err);
      setError("Erro ao avaliar. Tente novamente.");
      setPhase("answering");
    }
  }

  function handleRetry() {
    setAnswers({});
    setEvaluation(null);
    setPhase("intro");
    setStartedAt(null);
    setElapsed(0);
  }

  // ─── Intro ───────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-10 max-w-3xl mx-auto" style={{ background: "#09090b", color: "#e4e4e7" }}>
        <Link href="/skills/go-enterprise" className="inline-flex items-center gap-1.5 text-sm text-cyan-400/80 hover:text-cyan-300 mb-6">
          <ArrowLeft size={14} />
          Voltar para Go-Enterprise
        </Link>

        <div className="rounded-xl p-5 sm:p-8 mb-5" style={{ background: "rgba(15,15,18,0.78)", border: "1px solid rgba(6,182,212,0.5)" }}>
          <div className="text-xs uppercase tracking-wide text-cyan-400/80 mb-2">Tier {exam.tier} · Exame</div>
          <h1 className="text-xl sm:text-2xl font-bold mb-3 leading-tight">{exam.title}</h1>
          <p className="text-sm leading-relaxed text-zinc-300 mb-6">{exam.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 text-sm">
            <div className="rounded-lg p-3" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.3)" }}>
              <div className="text-xs text-cyan-400/70 uppercase tracking-wide">Questões</div>
              <div className="text-lg font-bold text-cyan-300 tabular-nums">{totalQuestions}</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.3)" }}>
              <div className="text-xs text-cyan-400/70 uppercase tracking-wide">Aprovação</div>
              <div className="text-lg font-bold text-cyan-300 tabular-nums">≥ {exam.passThreshold}</div>
            </div>
            <div className="rounded-lg p-3 col-span-2 sm:col-span-1" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.3)" }}>
              <div className="text-xs text-cyan-400/70 uppercase tracking-wide">Modelo</div>
              <div className="text-lg font-bold text-cyan-300">GPT-5.5</div>
            </div>
          </div>

          {previous && (
            <div className="rounded-lg p-3 mb-5 text-xs" style={{ background: "rgba(15,15,18,0.6)", border: "1px solid rgba(63,63,70,0.5)" }}>
              <div className="text-zinc-400 mb-1">Última tentativa:</div>
              <div className="flex items-center gap-2">
                {previous.passed ? (
                  <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                    <CheckCircle2 size={14} /> Aprovado · {previous.finalScore}
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium inline-flex items-center gap-1">
                    <AlertCircle size={14} /> Reprovado · {previous.finalScore}
                  </span>
                )}
                <span className="text-zinc-500">{new Date(previous.criadoEm).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          )}

          <ul className="text-sm space-y-1.5 text-zinc-400 mb-6 list-disc list-inside">
            <li>Questões mistas: code review, multiple choice e short answer.</li>
            <li>Não há limite de tempo, mas timer registra duração.</li>
            <li>Respostas em branco viram FAIL.</li>
            <li>Avaliação por IA com rubrica técnica — sem floreio.</li>
            <li>Resultado salvo no seu workspace.</li>
          </ul>

          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-5 py-3 rounded-lg font-semibold text-sm transition hover:opacity-90"
            style={{ background: "rgba(6,182,212,0.18)", border: "1px solid rgba(6,182,212,0.6)", color: "#67e8f9" }}
          >
            <Sparkles size={14} className="inline mr-2" />
            Começar exame Tier {exam.tier}
          </button>
        </div>
      </div>
    );
  }

  // ─── Answering ───────────────────────────────────────────
  if (phase === "answering" || phase === "submitting") {
    return (
      <div className="min-h-screen px-4 sm:px-6 py-4 sm:py-6 max-w-3xl mx-auto" style={{ background: "#09090b", color: "#e4e4e7" }}>
        <div
          className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-5 flex items-center justify-between gap-3"
          style={{ background: "rgba(9,9,11,0.93)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(6,182,212,0.4)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-cyan-300 truncate">Tier {exam.tier}</span>
            <span className="text-zinc-600 hidden sm:inline">·</span>
            <span className="text-xs text-zinc-400 hidden sm:inline">{answeredCount}/{totalQuestions} respondidas</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm tabular-nums text-zinc-400 inline-flex items-center gap-1">
              <Clock size={12} />
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
            </span>
            <button
              onClick={handleSubmit}
              disabled={phase === "submitting"}
              className="px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition disabled:opacity-50"
              style={{ background: "rgba(6,182,212,0.18)", border: "1px solid rgba(6,182,212,0.6)", color: "#67e8f9" }}
            >
              {phase === "submitting" ? (
                <>
                  <Loader2 size={12} className="inline mr-1 animate-spin" />
                  Avaliando...
                </>
              ) : (
                "Submeter"
              )}
            </button>
          </div>
        </div>

        {phase === "answering" && (
          <div className="text-xs text-zinc-500 mb-4 sm:hidden">
            {answeredCount}/{totalQuestions} respondidas
          </div>
        )}

        {error && (
          <div className="rounded-lg p-3 mb-4 text-sm" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.4)", color: "#fda4af" }}>
            {error}
          </div>
        )}

        <div className="space-y-5">
          {exam.questions.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-xl p-4 sm:p-5"
              style={{ background: "rgba(15,15,18,0.78)", border: "1px solid rgba(63,63,70,0.6)" }}
            >
              <div className="flex items-start gap-2 mb-3">
                <span
                  className="text-xs font-bold tabular-nums px-2 py-1 rounded shrink-0"
                  style={{ background: "rgba(6,182,212,0.18)", color: "#67e8f9" }}
                >
                  {idx + 1}/{totalQuestions}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-zinc-500 mt-1.5">{q.type}</span>
              </div>

              <p className="text-sm leading-relaxed mb-3 text-zinc-200 whitespace-pre-wrap">{q.prompt}</p>

              {q.code && (
                <pre
                  className="rounded-md p-3 mb-3 overflow-x-auto text-xs"
                  style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(63,63,70,0.4)", color: "#e4e4e7" }}
                >
                  <code>{q.code}</code>
                </pre>
              )}

              {q.choices && (
                <div className="text-xs text-zinc-400 mb-3 space-y-1">
                  {q.choices.map((c) => (
                    <div key={c}>{c}</div>
                  ))}
                </div>
              )}

              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder={q.type === "multiple-choice" ? "Letra + justificativa (ex: B porque...)" : "Sua resposta..."}
                disabled={phase === "submitting"}
                rows={q.type === "multiple-choice" ? 3 : 6}
                className="w-full text-sm rounded-md p-3 font-mono resize-y disabled:opacity-60"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(63,63,70,0.5)", color: "#e4e4e7" }}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 pb-8">
          <span className="text-xs text-zinc-500">{answeredCount}/{totalQuestions} respondidas</span>
          <button
            onClick={handleSubmit}
            disabled={phase === "submitting"}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-50"
            style={{ background: "rgba(6,182,212,0.18)", border: "1px solid rgba(6,182,212,0.6)", color: "#67e8f9" }}
          >
            {phase === "submitting" ? (
              <>
                <Loader2 size={14} className="inline mr-1.5 animate-spin" />
                Avaliando com GPT-5.5...
              </>
            ) : (
              "Submeter exame"
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── Result ──────────────────────────────────────────────
  if (phase === "result" && evaluation) {
    const verdictColors = {
      PASS: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.5)", text: "#6ee7b7" },
      REVIEW: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.5)", text: "#fde68a" },
      FAIL: { bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.5)", text: "#fda4af" },
    } as const;

    return (
      <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-10 max-w-3xl mx-auto" style={{ background: "#09090b", color: "#e4e4e7" }}>
        <Link href="/skills/go-enterprise" className="inline-flex items-center gap-1.5 text-sm text-cyan-400/80 hover:text-cyan-300 mb-6">
          <ArrowLeft size={14} />
          Voltar para Go-Enterprise
        </Link>

        <div
          className="rounded-xl p-5 sm:p-8 mb-5"
          style={{
            background: evaluation.passed ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
            border: `1px solid ${evaluation.passed ? "rgba(16,185,129,0.5)" : "rgba(245,158,11,0.5)"}`,
          }}
        >
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <div
              className="rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-bold tabular-nums shrink-0"
              style={{
                width: 64,
                height: 64,
                background: evaluation.passed ? "rgba(16,185,129,0.18)" : "rgba(245,158,11,0.18)",
                color: evaluation.passed ? "#6ee7b7" : "#fde68a",
                border: `1px solid ${evaluation.passed ? "rgba(16,185,129,0.5)" : "rgba(245,158,11,0.5)"}`,
              }}
            >
              {evaluation.finalScore}
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Tier {evaluation.tier} · Resultado</div>
              <div className="text-lg sm:text-xl font-bold" style={{ color: evaluation.passed ? "#6ee7b7" : "#fde68a" }}>
                {evaluation.passed ? "Aprovado" : "Reprovado"}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Threshold: {evaluation.threshold} · Recomendação: {evaluation.recommendation.replace(/-/g, " ")}
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-zinc-300">{evaluation.feedbackGeral}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {evaluation.pontosFortes?.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <div className="text-xs uppercase tracking-wide text-emerald-400/80 mb-2">Pontos fortes</div>
              <ul className="text-sm text-zinc-300 space-y-1.5 list-disc list-inside">
                {evaluation.pontosFortes.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
          {evaluation.areasDesenvolvimento?.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <div className="text-xs uppercase tracking-wide text-amber-400/80 mb-2">A desenvolver</div>
              <ul className="text-sm text-zinc-300 space-y-1.5 list-disc list-inside">
                {evaluation.areasDesenvolvimento.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
        </div>

        <h2 className="text-base font-semibold mb-3 text-cyan-300">Avaliação por questão</h2>
        <div className="space-y-3 mb-8">
          {evaluation.questoes?.map((qe) => {
            const cols = verdictColors[qe.verdict];
            const verdictIcon =
              qe.verdict === "PASS" ? <CheckCircle2 size={14} /> : qe.verdict === "REVIEW" ? <AlertCircle size={14} /> : <XCircle size={14} />;
            return (
              <div
                key={qe.questionId}
                className="rounded-xl p-4"
                style={{ background: "rgba(15,15,18,0.78)", border: `1px solid ${cols.border}` }}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-mono text-zinc-500">{qe.questionId}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded inline-flex items-center gap-1"
                    style={{ background: cols.bg, color: cols.text }}
                  >
                    {verdictIcon}
                    {qe.verdict}
                  </span>
                  <span className="text-xs tabular-nums text-zinc-400">{qe.score}/10</span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-300">{qe.feedback}</p>
                {qe.expectedPoints?.length > 0 && (
                  <div className="mt-3 text-xs">
                    <div className="text-zinc-500 mb-1">Pontos que faltaram:</div>
                    <ul className="text-zinc-400 space-y-1 list-disc list-inside">
                      {qe.expectedPoints.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <button
            onClick={handleRetry}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:opacity-90"
            style={{ background: "rgba(6,182,212,0.18)", border: "1px solid rgba(6,182,212,0.6)", color: "#67e8f9" }}
          >
            Refazer exame
          </button>
          <Link
            href="/skills/go-enterprise"
            className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:opacity-90 text-center"
            style={{ border: "1px solid rgba(63,63,70,0.6)", color: "#a1a1aa" }}
          >
            Voltar para árvore
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
