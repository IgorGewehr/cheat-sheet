"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Flame,
  Trophy,
  ChevronRight,
  RefreshCw,
  Sparkles,
  GitFork,
} from "lucide-react";
import { Button, Card, Tag } from "@/components/ui";
import { CATEGORY_LABEL, type Card as CardType, type CardDoDiaProgresso } from "@/lib/types";
import {
  listCardDoDiaProgresso,
  saveCardDoDiaProgresso,
  listDividas,
} from "@/lib/db";
import type { QuizResult, QuizPergunta } from "@/app/api/ai/card-do-dia/route";
import { getActiveProject, getRelevantCategories } from "@/lib/active-project";

type Phase =
  | { kind: "loading" }
  | { kind: "reading"; card: CardType }
  | { kind: "quizzing"; card: CardType; perguntas: QuizPergunta[]; questionIndex: number; answers: (number | null)[] }
  | { kind: "done"; card: CardType; perguntas: QuizPergunta[]; answers: number[]; acertos: number; progresso: CardDoDiaProgresso }
  | { kind: "already-done"; progresso: CardDoDiaProgresso; streak: number }
  | { kind: "error"; message: string };

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function calcStreak(list: CardDoDiaProgresso[]): number {
  const sorted = [...list]
    .filter((p) => p.completado)
    .sort((a, b) => b.data.localeCompare(a.data));
  if (sorted.length === 0) return 0;
  let streak = 0;
  const today = getTodayString();
  let expected = today;
  for (const p of sorted) {
    if (p.data === expected) {
      streak++;
      const d = new Date(expected);
      d.setDate(d.getDate() - 1);
      expected = d.toISOString().split("T")[0];
    } else {
      break;
    }
  }
  return streak;
}

// Spaced repetition: 0 = struggling (<50%), 1 = needs review or never tried, 2 = solid (≥80%)
function quizPriority(slug: string, progressList: CardDoDiaProgresso[]): number {
  const done = progressList.filter((p) => p.cardSlug === slug && p.completado && p.totalQuiz > 0);
  if (done.length === 0) return 1;
  const best = Math.max(...done.map((h) => (h.acertosQuiz / h.totalQuiz) * 100));
  if (best < 50) return 0;
  if (best < 80) return 1;
  return 2;
}

function selectCard(
  allCards: CardType[],
  progressList: CardDoDiaProgresso[],
  projectStack?: string[],
  projectTipo?: string,
  debtSlugs?: Set<string>,
): CardType {
  const today = getTodayString();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 65);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const dayNum = Math.floor(new Date(today).getTime() / 86400000);

  const recentSlugs = new Set(
    progressList.filter((p) => p.data >= cutoffStr).map((p) => p.cardSlug),
  );

  const available = allCards.filter((c) => !recentSlugs.has(c.slug));

  if (available.length > 0) {
    // Pending debts with a linked card get the highest priority (-1)
    const priorityMap = new Map(available.map((c) => [
      c.slug,
      (debtSlugs?.has(c.slug) ? -1 : quizPriority(c.slug, progressList)),
    ]));
    const sorted = [...available].sort((a, b) => priorityMap.get(a.slug)! - priorityMap.get(b.slug)!);
    const bestPriority = priorityMap.get(sorted[0].slug)!;
    let pool = sorted.filter((c) => priorityMap.get(c.slug) === bestPriority);

    if (projectStack && projectStack.length > 0) {
      const relevantCats = new Set<string>(getRelevantCategories(projectStack, projectTipo));
      const relevantPool = pool.filter((c) => relevantCats.has(c.category as string));
      if (relevantPool.length > 0) pool = relevantPool;
    }

    return pool[dayNum % pool.length];
  }

  // All done in last 65 days: pick least recently done, still biased by project
  const bySlug = new Map<string, string>();
  for (const p of progressList) {
    const existing = bySlug.get(p.cardSlug);
    if (!existing || p.data > existing) bySlug.set(p.cardSlug, p.data);
  }
  const sorted = [...allCards].sort((a, b) => {
    const da = bySlug.get(a.slug) ?? "0000-00-00";
    const db2 = bySlug.get(b.slug) ?? "0000-00-00";
    return da.localeCompare(db2);
  });

  if (projectStack && projectStack.length > 0) {
    const relevantCats = new Set<string>(getRelevantCategories(projectStack, projectTipo));
    const relevant = sorted.filter((c) => relevantCats.has(c.category as string));
    if (relevant.length > 0) return relevant[0];
  }

  return sorted[0];
}

export function CardDoDiaView({ allCards }: { allCards: CardType[] }) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [projectContext, setProjectContext] = useState<{ nome: string } | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const activeProject = getActiveProject();
        if (activeProject) setProjectContext({ nome: activeProject.nome });

        const [list, debitList] = await Promise.all([
          listCardDoDiaProgresso(),
          listDividas(),
        ]);
        const today = getTodayString();
        const todayEntry = list.find((p) => p.data === today && p.completado);

        if (todayEntry) {
          const streak = calcStreak(list);
          setPhase({ kind: "already-done", progresso: todayEntry, streak });
          return;
        }

        const debtSlugs = new Set(
          debitList
            .filter((d) => d.status === "pendente" && d.cardSlug)
            .map((d) => d.cardSlug as string),
        );

        const card = selectCard(
          allCards,
          list,
          activeProject?.stack,
          activeProject?.tipo,
          debtSlugs,
        );
        setPhase({ kind: "reading", card });
      } catch (e) {
        setPhase({ kind: "error", message: String(e) });
      }
    }
    init();
  }, [allCards]);

  async function startQuiz() {
    if (phase.kind !== "reading") return;
    const { card } = phase;
    setGeneratingQuiz(true);
    try {
      const res = await fetch("/api/ai/card-do-dia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardSlug: card.slug,
          cardTitle: card.title,
          cardBody: card.body.slice(0, 3000),
        }),
      });
      const data = (await res.json()) as QuizResult & { error?: string };
      if (data.error || !data.perguntas?.length) {
        setPhase({ kind: "error", message: data.error ?? "Resposta inválida da API." });
        return;
      }
      setPhase({
        kind: "quizzing",
        card,
        perguntas: data.perguntas,
        questionIndex: 0,
        answers: new Array(data.perguntas.length).fill(null),
      });
    } catch (e) {
      setPhase({ kind: "error", message: String(e) });
    } finally {
      setGeneratingQuiz(false);
    }
  }

  function handleAnswer(optionIndex: number) {
    if (phase.kind !== "quizzing") return;
    const { perguntas, questionIndex, answers, card } = phase;
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;

    if (questionIndex < perguntas.length - 1) {
      setPhase({ ...phase, questionIndex: questionIndex + 1, answers: newAnswers });
    } else {
      // Finished — save progress
      const finalAnswers = newAnswers as number[];
      const acertos = finalAnswers.filter((a, i) => a === perguntas[i].respostaCorreta).length;
      const today = getTodayString();

      saveCardDoDiaProgresso({
        cardSlug: card.slug,
        data: today,
        acertosQuiz: acertos,
        totalQuiz: perguntas.length,
        completado: true,
      }).then((progresso) => {
        setPhase({
          kind: "done",
          card,
          perguntas,
          answers: finalAnswers,
          acertos,
          progresso,
        });
      });
    }
  }

  // ─── Render phases ────────────────────────────────────────────────────

  if (phase.kind === "loading") {
    return (
      <div className="flex items-center justify-center min-h-64">
        <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <div className="space-y-8 max-w-3xl">
        <PageHeader />
        <p className="text-sm text-red-500">{phase.message}</p>
      </div>
    );
  }

  if (phase.kind === "already-done") {
    const { progresso, streak } = phase;
    const pct = Math.round((progresso.acertosQuiz / progresso.totalQuiz) * 100);
    return (
      <div className="space-y-8 max-w-3xl">
        <PageHeader />
        <Card className="space-y-5 text-center py-10">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-semibold">Você já completou o card de hoje!</h2>
          <p className="text-muted text-sm">
            Card: <span className="text-fg font-medium">{progresso.cardSlug}</span>
          </p>
          <div className="flex items-center justify-center gap-8 pt-2">
            <Stat label="Acertos" value={`${progresso.acertosQuiz}/${progresso.totalQuiz}`} />
            <Stat label="Score" value={`${pct}%`} />
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-amber-500">
                <Flame className="w-5 h-5" />
                <span className="text-2xl font-semibold">{streak}</span>
              </div>
              <span className="text-xs text-muted uppercase tracking-wide">
                {streak === 1 ? "dia seguido" : "dias seguidos"}
              </span>
            </div>
          </div>
          <p className="text-xs text-subtle pt-2">Volte amanhã para um novo card!</p>
        </Card>
      </div>
    );
  }

  if (phase.kind === "reading") {
    const { card } = phase;
    return (
      <div className="space-y-8 max-w-3xl">
        <PageHeader />

        {projectContext && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
            <GitFork className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-sm text-muted">
              Card selecionado com base no seu projeto{" "}
              <span className="font-semibold text-fg">{projectContext.nome}</span>
            </span>
          </div>
        )}

        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <Tag color="amber">{CATEGORY_LABEL[card.category]}</Tag>
              <h2 className="text-xl font-semibold">{card.title}</h2>
              <p className="text-sm text-muted">{card.excerpt}</p>
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <div className="rounded-lg bg-card border border-line overflow-auto max-h-[420px] p-4">
              <pre className="text-sm text-fg whitespace-pre-wrap leading-relaxed font-mono">
                {card.body}
              </pre>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-subtle">Leia o card com atenção antes de começar o quiz.</p>
            <Button onClick={startQuiz} disabled={generatingQuiz}>
              {generatingQuiz ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Gerando perguntas…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Fazer Quiz
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase.kind === "quizzing") {
    const { perguntas, questionIndex } = phase;
    const pergunta = perguntas[questionIndex];
    const total = perguntas.length;
    const pct = Math.round(((questionIndex) / total) * 100);

    return (
      <div className="space-y-8 max-w-3xl">
        <PageHeader />

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted">
            <span>Pergunta {questionIndex + 1} de {total}</span>
            <span>{pct}% concluído</span>
          </div>
          <div className="h-2 rounded-full bg-card border border-line overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <Card className="space-y-6">
          <p className="text-base font-medium leading-relaxed">{pergunta.pergunta}</p>

          <div className="space-y-2.5">
            {pergunta.opcoes.map((opcao, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="w-full text-left px-4 py-3 rounded-lg border border-line bg-card hover:border-amber-500/60 hover:bg-amber-500/5 transition text-sm"
              >
                <span className="font-medium text-amber-500 mr-2">
                  {["A", "B", "C", "D"][i]}.
                </span>
                {opcao}
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (phase.kind === "done") {
    const { card, perguntas, answers, acertos } = phase;
    const total = perguntas.length;
    const pct = Math.round((acertos / total) * 100);
    const isPerfect = acertos === total;

    return (
      <div className="space-y-8 max-w-3xl">
        <PageHeader />

        {/* Score banner */}
        <Card className={clsx(
          "text-center py-8 space-y-3",
          isPerfect
            ? "border-amber-500/40 bg-amber-500/5"
            : acertos >= total / 2
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-red-500/20 bg-red-500/5",
        )}>
          {isPerfect ? (
            <Trophy className="w-10 h-10 text-amber-500 mx-auto" />
          ) : (
            <CheckCircle2 className={clsx("w-10 h-10 mx-auto", acertos >= total / 2 ? "text-emerald-500" : "text-red-400")} />
          )}
          <h2 className="text-2xl font-semibold">
            {isPerfect ? "Perfeito! 🎉" : `${acertos} de ${total} acertos`}
          </h2>
          <p className="text-muted text-sm">{pct}% de aproveitamento</p>
          {isPerfect && (
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              Você dominou este card!
            </p>
          )}
        </Card>

        {/* Per-question breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">Gabarito</h3>
          {perguntas.map((p, i) => {
            const chosen = answers[i];
            const correct = p.respostaCorreta;
            const isRight = chosen === correct;
            return (
              <Card key={i} className={clsx("space-y-3", isRight ? "" : "border-red-500/25")}>
                <div className="flex items-start gap-2">
                  {isRight ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm font-medium">{p.pergunta}</p>
                </div>

                <div className="space-y-1.5 pl-7">
                  {p.opcoes.map((opcao, j) => (
                    <div
                      key={j}
                      className={clsx(
                        "px-3 py-2 rounded-lg text-sm border",
                        j === correct
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : j === chosen && !isRight
                          ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 line-through opacity-70"
                          : "border-transparent text-muted",
                      )}
                    >
                      <span className="font-medium mr-1.5">{["A", "B", "C", "D"][j]}.</span>
                      {opcao}
                      {j === correct && (
                        <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ correta
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pl-7 pt-1">
                  <p className="text-xs text-muted leading-relaxed">
                    <span className="font-semibold text-fg">Explicação:</span> {p.explicacao}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => {
              setPhase({ kind: "reading", card });
            }}
          >
            <BookOpen className="w-4 h-4" />
            Reler o card
          </Button>
          <p className="text-xs text-subtle ml-auto">Volte amanhã para um novo desafio!</p>
        </div>
      </div>
    );
  }

  return null;
}

function PageHeader() {
  return (
    <header className="space-y-2">
      <h1 className="text-3xl font-semibold flex items-center gap-3">
        <BookOpen className="w-8 h-8 text-amber-500" />
        Card do Dia
      </h1>
      <p className="text-muted max-w-2xl">
        Um card de conhecimento por dia. Leia, entenda e responda o quiz para consolidar o aprendizado.
      </p>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl font-semibold">{value}</span>
      <span className="text-xs text-muted uppercase tracking-wide">{label}</span>
    </div>
  );
}
