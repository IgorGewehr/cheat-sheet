"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { pickQuestions, assignRank, identifyWeakSpots, pickNextQuestion } from "@/lib/awakening-engine";
import { saveAwakeningSession } from "@/lib/awakening-db";
import { isAuthRequiredError } from "@/lib/firebase";
import type { AwakeningTrack, AwakeningQuestion, HunterRankCode, AwakeningSession } from "@/lib/awakening-types";

const TRACK_LABELS: Record<AwakeningTrack, string> = {
  fullstack: "Full Stack",
  "data-science": "Data Science",
  "ai-engineer": "AI Engineer",
  "ai-agents": "AI Agents",
};

const TRACK_DESCRIPTIONS: Record<AwakeningTrack, string> = {
  fullstack: "HTTP, SQL, async/await, Git, testes e deploy. A base que sustenta tudo.",
  "data-science": "Dados, pandas, modelos, métricas. Análise real sem ilusão de acurácia.",
  "ai-engineer": "Tokens, prompts, RAG, eval. Coloque LLMs em produção com confiança.",
  "ai-agents": "Tool use, ReAct, memória, observabilidade. Agentes que não travam em loop.",
};

const RANK_LABELS: Record<HunterRankCode, { label: string; color: string; desc: string }> = {
  E: { label: "Rank E", color: "text-zinc-400", desc: "Fundamentos a construir. Cada passo da trilha vale muito." },
  D: { label: "Rank D", color: "text-emerald-400", desc: "Base formando-se. Consistência vai acelerar o crescimento." },
  C: { label: "Rank C", color: "text-sky-400", desc: "Meio do caminho. Lacunas identificadas — hora de fechar." },
  B: { label: "Rank B", color: "text-violet-400", desc: "Acima da média. Afine os pontos fracos para avançar." },
  A: { label: "Rank A", color: "text-amber-400", desc: "Forte. Poucos pontos cegos — trilha vai polir o restante." },
  S: { label: "Rank S", color: "text-cyan-400", desc: "Domínio completo para este nível. Hora da trilha sênior." },
};

type Step = "track-pick" | "quiz" | "result";

interface QuizAnswer {
  questionId: string;
  resposta: number;
  correta: boolean;
  difficulty: number;
}

export function AwakeningClient() {
  const [step, setStep] = useState<Step>("track-pick");
  const [track, setTrack] = useState<AwakeningTrack | null>(null);
  const [questions, setQuestions] = useState<AwakeningQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [rank, setRank] = useState<HunterRankCode | null>(null);
  const [weakSpots, setWeakSpots] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const startQuiz = useCallback((t: AwakeningTrack) => {
    setTrack(t);
    setQuestions(pickQuestions(t, 10));
    setCurrentIdx(0);
    setAnswers([]);
    setSelected(null);
    setRevealed(false);
    setStep("quiz");
  }, []);

  const handleSelect = useCallback(
    (optionIdx: number) => {
      if (revealed) return;
      setSelected(optionIdx);
      setRevealed(true);
    },
    [revealed],
  );

  const handleNext = useCallback(async () => {
    if (selected === null || !track) return;

    const q = questions[currentIdx];
    const newAnswer: QuizAnswer = {
      questionId: q.id,
      resposta: selected,
      correta: selected === q.correta,
      difficulty: q.difficulty,
    };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    const nextQ = pickNextQuestion(track, newAnswers, questions);
    const nextIdx = nextQ ? questions.findIndex((qq) => qq.id === nextQ.id) : -1;

    if (nextIdx === -1 || newAnswers.length >= 10) {
      // build session shape for rank calculation
      const sessionForRank = {
        id: "",
        track,
        respostas: newAnswers,
        rankAtribuido: "E" as HunterRankCode,
        trilhaSugerida: `/trilha-entry?track=${track}`,
        pontosFracos: [],
        criadoEm: 0,
      };
      const computedRank = assignRank(sessionForRank);
      const spots = identifyWeakSpots(sessionForRank, questions);

      setRank(computedRank);
      setWeakSpots(spots);
      setStep("result");

      setSaving(true);
      setSaveError(null);
      try {
        await saveAwakeningSession({
          track,
          respostas: newAnswers,
          rankAtribuido: computedRank,
          trilhaSugerida: `/trilha-entry?track=${track}`,
          pontosFracos: spots,
        });

        // fire-and-forget feedback
        const savedSession: AwakeningSession = {
          id: "tmp",
          track,
          respostas: newAnswers,
          rankAtribuido: computedRank,
          trilhaSugerida: `/trilha-entry?track=${track}`,
          pontosFracos: spots,
          criadoEm: Date.now(),
        };
        fetch("/api/ai/awakening-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savedSession),
        }).catch(() => null);
      } catch (err) {
        if (isAuthRequiredError(err)) {
          setSaveError("Faça login para salvar seu resultado.");
        } else {
          setSaveError("Erro ao salvar sessão — seu rank foi calculado localmente.");
        }
      } finally {
        setSaving(false);
      }
    } else {
      setCurrentIdx(nextIdx);
      setSelected(null);
      setRevealed(false);
    }
  }, [selected, track, questions, currentIdx, answers]);

  if (step === "track-pick") {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider font-mono text-cyan-500">[SYSTEM] · AWAKENING</p>
          <h1 className="text-2xl font-semibold text-fg">Diagnóstico Adaptativo</h1>
          <p className="text-sm text-muted">
            10 perguntas. Dificuldade adaptativa. Seu rank é atribuído ao final.
            Escolha a trilha que quer avaliar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.keys(TRACK_LABELS) as AwakeningTrack[]).map((t) => (
            <button
              key={t}
              onClick={() => startQuiz(t)}
              className="text-left rounded-xl border border-cyan-500/30 bg-card p-5 transition hover:border-cyan-500/60 hover:shadow-[0_0_20px_rgba(0,212,255,0.15)] space-y-2"
            >
              <p className="text-xs uppercase tracking-wider font-mono text-cyan-500">{t}</p>
              <p className="font-semibold text-fg">{TRACK_LABELS[t]}</p>
              <p className="text-sm text-muted">{TRACK_DESCRIPTIONS[t]}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "quiz" && track) {
    const q = questions[currentIdx];
    const progress = answers.length;
    const total = 10;

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider font-mono text-cyan-500">
            [SYSTEM] · {TRACK_LABELS[track]} · Q{progress + 1}/{total}
          </p>
          <span className="text-xs font-mono text-muted">difficulty {q.difficulty}/5</span>
        </div>

        <div className="w-full h-1 rounded-full bg-line">
          <div
            className="h-1 rounded-full bg-cyan-500 transition-all"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-card p-6 shadow-[0_0_20px_rgba(0,212,255,0.10)] space-y-5">
          <p className="text-base font-medium text-fg leading-relaxed">{q.pergunta}</p>

          <div className="space-y-2">
            {q.opcoes.map((opt, i) => {
              let cls =
                "w-full text-left rounded-lg border px-4 py-3 text-sm transition ";
              if (!revealed) {
                cls += "border-line bg-card hover:border-cyan-500/50 hover:bg-card-hover text-fg cursor-pointer";
              } else if (i === q.correta) {
                cls += "border-emerald-500 bg-emerald-500/10 text-emerald-300";
              } else if (i === selected && i !== q.correta) {
                cls += "border-red-500 bg-red-500/10 text-red-300";
              } else {
                cls += "border-line bg-card text-muted cursor-default";
              }

              return (
                <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={revealed}>
                  <span className="font-mono text-xs mr-3 text-muted">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {revealed && (
            <div className="rounded-lg border border-line bg-card-hover p-4 text-sm text-muted leading-relaxed">
              <span className="text-xs uppercase tracking-wider font-mono text-cyan-500 block mb-1">Explicacao</span>
              {q.explicacao}
            </div>
          )}
        </div>

        {revealed && (
          <Button onClick={handleNext} className="w-full">
            {answers.length + 1 >= total ? "Ver Resultado" : "Proxima"}
          </Button>
        )}
      </div>
    );
  }

  if (step === "result" && rank && track) {
    const rankInfo = RANK_LABELS[rank];
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider font-mono text-cyan-500">[SYSTEM] · RANK ASSIGNED</p>
          <h1 className="text-2xl font-semibold text-fg">Diagnostico Concluido</h1>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-card p-6 shadow-[0_0_20px_rgba(0,212,255,0.15)] space-y-4 text-center">
          <p className={`text-5xl font-bold font-mono ${rankInfo.color}`}>{rank}</p>
          <p className={`text-lg font-semibold ${rankInfo.color}`}>{rankInfo.label}</p>
          <p className="text-sm text-muted">{rankInfo.desc}</p>
        </div>

        {weakSpots.length > 0 && (
          <div className="rounded-xl border border-line bg-card p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider font-mono text-cyan-500">Pontos Fracos Detectados</p>
            <ul className="space-y-1">
              {weakSpots.map((w) => (
                <li key={w} className="text-sm text-fg flex items-start gap-2">
                  <span className="text-red-400 font-mono">!</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {saveError && (
          <p className="text-sm text-amber-400 border border-amber-500/30 rounded-lg px-4 py-3">{saveError}</p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href={`/trilha-entry?track=${track}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-zinc-950 transition"
          >
            Iniciar Trilha de {TRACK_LABELS[track]}
          </Link>
          <button
            onClick={() => {
              setStep("track-pick");
              setTrack(null);
              setAnswers([]);
              setSelected(null);
              setRevealed(false);
              setRank(null);
              setWeakSpots([]);
            }}
            className="text-sm text-muted hover:text-fg transition text-center"
          >
            Tentar outra trilha
          </button>
        </div>

        {saving && (
          <p className="text-xs text-muted font-mono text-center">Salvando sessao...</p>
        )}
      </div>
    );
  }

  return null;
}
