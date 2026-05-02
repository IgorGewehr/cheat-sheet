"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  Sigma,
  Triangle,
  Spline,
  Dices,
  GitGraph,
  Compass,
  Brackets,
  Hash,
  Cog,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui";
import { pickQuestForRun, listAllProblems } from "@/lib/math-quest-bank";
import { saveMathQuestRun, listMathQuestRuns } from "@/lib/math-quest-db";
import type {
  MathArea,
  MathQuestAnswer,
  MathQuestProblem,
  MathQuestRun,
  QuestRank,
  QuestVerdict,
} from "@/lib/math-quest-types";

const AREAS: { id: MathArea; label: string; Icon: React.ElementType }[] = [
  { id: "calculo",       label: "Cálculo",       Icon: Sigma },
  { id: "algebra",       label: "Álgebra",        Icon: Triangle },
  { id: "analise",       label: "Análise",        Icon: Spline },
  { id: "probabilidade", label: "Probabilidade",  Icon: Dices },
  { id: "discreta",      label: "Discreta",       Icon: GitGraph },
  { id: "geometria",     label: "Geometria",      Icon: Compass },
  { id: "logica",        label: "Lógica",         Icon: Brackets },
  { id: "numeros",       label: "Números",        Icon: Hash },
  { id: "aplicada",      label: "Aplicada",       Icon: Cog },
];

const RANKS: QuestRank[] = ["E", "D", "C", "B", "A", "S"];

const RANK_LABEL: Record<QuestRank, string> = {
  E: "Iniciante",
  D: "Básico",
  C: "Intermediário",
  B: "Avançado",
  A: "Especialista",
  S: "Mestre",
};

type ViewState = "home" | "running" | "finished";

interface VerifyResult {
  veredito: QuestVerdict;
  score: number;
  feedback: string;
  conceitosCobertos: string[];
  conceitosFaltantes: string[];
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-red-500 bg-red-950/80 px-4 py-2 text-sm text-red-300 shadow-lg">
      {msg}
    </div>
  );
}

export function MathQuestClient() {
  const router = useRouter();

  const [view, setView] = useState<ViewState>("home");
  const [selectedArea, setSelectedArea] = useState<MathArea>("calculo");
  const [selectedRank, setSelectedRank] = useState<QuestRank>("C");

  const [problems, setProblems] = useState<MathQuestProblem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<MathQuestAnswer[]>([]);
  const [resposta, setResposta] = useState("");
  const [dica, setDica] = useState<string | null>(null);
  const [dicaOpen, setDicaOpen] = useState(false);
  const [dicasUsadas, setDicasUsadas] = useState(0);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState<"dica" | "verificar" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [runId] = useState(() => uuidv4());
  const [startedAt] = useState(() => Date.now());

  const [historyOpen, setHistoryOpen] = useState(false);
  const [prevRuns, setPrevRuns] = useState<MathQuestRun[]>([]);

  const savedRef = useRef(false);

  useEffect(() => {
    if (view === "home") {
      listMathQuestRuns()
        .then((runs) => setPrevRuns(runs.slice(0, 5)))
        .catch(() => {});
    }
  }, [view]);

  function startRun() {
    const picked = pickQuestForRun(selectedArea, selectedRank);
    setProblems(picked);
    setCurrentIdx(0);
    setAnswers([]);
    setResposta("");
    setDica(null);
    setDicaOpen(false);
    setDicasUsadas(0);
    setVerifyResult(null);
    setView("running");
  }

  const currentProblem = problems[currentIdx];

  async function handleDica() {
    if (!currentProblem) return;
    setDicasUsadas((p) => p + 1);
    setLoading("dica");
    try {
      const res = await fetch("/api/ai/math-quest/dica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enunciado: currentProblem.enunciado, respostaParcial: resposta }),
      });
      const data = await res.json() as { dica?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao buscar dica");
      setDica(data.dica ?? null);
      setDicaOpen(true);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erro ao buscar dica.");
    } finally {
      setLoading(null);
    }
  }

  async function handleVerificar() {
    if (!currentProblem || !resposta.trim()) {
      setToast("Escreva sua resposta antes de verificar.");
      return;
    }
    setLoading("verificar");
    try {
      const res = await fetch("/api/ai/math-quest/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enunciado: currentProblem.enunciado,
          resposta,
          expectedConcepts: currentProblem.expectedConcepts,
        }),
      });
      const data = await res.json() as VerifyResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao verificar");
      setVerifyResult(data);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erro ao verificar resposta.");
    } finally {
      setLoading(null);
    }
  }

  function handleNext() {
    if (!verifyResult || !currentProblem) return;
    const answer: MathQuestAnswer = {
      problemId: currentProblem.id,
      resposta,
      veredito: verifyResult.veredito,
      scoreAvaliacao: verifyResult.score,
      feedback: verifyResult.feedback,
      conceitosCobertos: verifyResult.conceitosCobertos,
      conceitosFaltantes: verifyResult.conceitosFaltantes,
      dicasUsadas,
      mpFinal: 0,
    };
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentIdx >= problems.length - 1) {
      const totalScore = Math.round(newAnswers.reduce((s, a) => s + a.scoreAvaliacao, 0) / newAnswers.length);
      const xpGanho = Math.round(newAnswers.reduce((s, a) => s + a.scoreAvaliacao, 0) / 5);
      const run: MathQuestRun = {
        id: runId,
        area: selectedArea,
        rank: selectedRank,
        problemas: problems,
        respostas: newAnswers,
        xpGanho,
        status: totalScore >= 40 ? "concluido" : "concluido",
        iniciadoEm: startedAt,
        concluidoEm: Date.now(),
      };
      setView("finished");
      if (!savedRef.current) {
        savedRef.current = true;
        saveMathQuestRun(run).catch(() => {});
      }
    } else {
      setCurrentIdx((i) => i + 1);
      setResposta("");
      setDica(null);
      setDicaOpen(false);
      setVerifyResult(null);
    }
  }

  const totalScore = answers.length > 0
    ? Math.round(answers.reduce((s, a) => s + a.scoreAvaliacao, 0) / answers.length)
    : 0;
  const xpGanho = Math.round(answers.reduce((s, a) => s + a.scoreAvaliacao, 0) / 5);

  if (view === "home") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

        <Card className="p-5 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-fg">Treinar Matemática</h1>
            <p className="text-sm text-muted mt-0.5">Resolva problemas guiados por IA, com dicas socráticas.</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted font-medium">Área</p>
            <div className="grid grid-cols-3 gap-2">
              {AREAS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedArea(id)}
                  className={clsx(
                    "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs transition-all",
                    selectedArea === id
                      ? "border-violet-500 bg-violet-500/10 text-violet-300"
                      : "border-line bg-card-hover text-muted hover:border-violet-500/30 hover:text-fg",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted font-medium">Dificuldade</p>
            <div className="flex gap-2 flex-wrap">
              {RANKS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRank(r)}
                  className={clsx(
                    "px-3 py-1 rounded text-xs font-medium border transition-all",
                    selectedRank === r
                      ? "border-violet-500 bg-violet-500/15 text-violet-300"
                      : "border-line bg-card-hover text-muted hover:border-violet-500/30",
                  )}
                >
                  {RANK_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startRun}
            className="w-full rounded-lg border border-violet-500/40 bg-violet-500/10 py-3 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/20"
          >
            Iniciar Sessão
          </button>
        </Card>

        <Card className="overflow-hidden">
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-xs text-muted hover:text-fg transition"
          >
            <span>Sessões anteriores</span>
            {historyOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {historyOpen && (
            <div className="px-4 pb-3 space-y-2 border-t border-line pt-3">
              {prevRuns.length === 0 && (
                <p className="text-xs text-muted">Nenhuma sessão anterior.</p>
              )}
              {prevRuns.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs text-muted border-b border-line pb-2 last:border-0 last:pb-0">
                  <span>{AREAS.find((a) => a.id === r.area)?.label ?? r.area} · {RANK_LABEL[r.rank]}</span>
                  <span>{new Date(r.iniciadoEm).toLocaleDateString("pt-BR")} · +{r.xpGanho} XP</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (view === "running" && currentProblem) {
    const verdictColor =
      verifyResult?.veredito === "PASS"    ? "border-violet-500 bg-violet-500/5 text-violet-300" :
      verifyResult?.veredito === "PARTIAL" ? "border-amber-500 bg-amber-500/5 text-amber-300" :
      verifyResult?.veredito === "FAIL"    ? "border-red-500 bg-red-500/5 text-red-300" :
      "";

    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-fg">
              {currentIdx + 1} / {problems.length}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-card-hover overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500 transition-all"
                style={{ width: `${((currentIdx + 1) / problems.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">
              {AREAS.find((a) => a.id === selectedArea)?.label} · {RANK_LABEL[selectedRank]}
            </span>
            {currentProblem.isBoss && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-violet-500/15 border border-violet-500/30 text-violet-300">
                Desafio
              </span>
            )}
          </div>
          <pre className="text-sm text-fg whitespace-pre-wrap leading-relaxed">
            {currentProblem.enunciado}
          </pre>
        </Card>

        <div className="space-y-2">
          <label className="text-xs text-muted font-medium">Sua resposta</label>
          <textarea
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            rows={8}
            placeholder="Escreva sua solução aqui..."
            className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-violet-500/60 focus:outline-none resize-y"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDica}
            disabled={loading !== null}
            className="rounded border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-500/20 disabled:opacity-50 transition"
          >
            {loading === "dica" ? "..." : "Dica"}
          </button>
          <button
            onClick={handleVerificar}
            disabled={loading !== null || !resposta.trim()}
            className="rounded border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/25 disabled:opacity-50 transition"
          >
            {loading === "verificar" ? "Verificando..." : "Verificar"}
          </button>
          <button
            onClick={handleNext}
            disabled={!verifyResult}
            className="rounded border border-line bg-card-hover px-3 py-1.5 text-xs text-fg hover:bg-card-hover disabled:opacity-50 transition"
          >
            {currentIdx >= problems.length - 1 ? "Finalizar" : "Próximo →"}
          </button>
        </div>

        {dica && (
          <Card className="overflow-hidden">
            <button
              onClick={() => setDicaOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-2 text-xs text-muted hover:text-fg transition"
            >
              <span>Dica socrática</span>
              {dicaOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {dicaOpen && (
              <p className="px-4 pb-3 text-sm text-fg leading-relaxed border-t border-line pt-2">
                {dica}
              </p>
            )}
          </Card>
        )}

        {verifyResult && (
          <div className={clsx("rounded-lg border p-4 space-y-3", verdictColor)}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">
                {verifyResult.veredito === "PASS" ? "Correto" : verifyResult.veredito === "PARTIAL" ? "Parcialmente correto" : "Incorreto"}
              </span>
              <span className="text-xs font-medium ml-auto text-muted">
                {verifyResult.score}/100
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {verifyResult.feedback}
            </p>
            {verifyResult.conceitosCobertos.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {verifyResult.conceitosCobertos.map((c) => (
                  <span key={c} className="px-1.5 py-0.5 rounded text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    {c}
                  </span>
                ))}
              </div>
            )}
            {verifyResult.conceitosFaltantes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {verifyResult.conceitosFaltantes.map((c) => (
                  <span key={c} className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (view === "finished") {
    const passed = totalScore >= 50;
    return (
      <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

        <Card className="p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-fg">
              {passed ? "Sessão concluída" : "Sessão incompleta"}
            </h2>
            <p className="text-sm text-muted mt-0.5">
              {passed ? "Bom desempenho nesta sessão." : "Continue praticando para melhorar."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Score Total", value: `${totalScore}/100` },
              { label: "Problemas", value: `${answers.length}/${problems.length}` },
              { label: "Dicas usadas", value: String(dicasUsadas) },
              { label: "XP MAT", value: `+${xpGanho} XP` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded border border-line bg-card-hover p-2">
                <p className="text-[10px] text-muted mb-0.5">{label}</p>
                <p className="text-base font-semibold text-fg">{value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {answers.map((a, i) => (
              <div key={a.problemId} className="flex items-center justify-between text-xs">
                <span className="text-muted">#{i + 1}</span>
                <span className={clsx(
                  "font-medium",
                  a.veredito === "PASS" ? "text-violet-400" :
                  a.veredito === "PARTIAL" ? "text-amber-400" : "text-red-400",
                )}>
                  {a.veredito === "PASS" ? "Correto" : a.veredito === "PARTIAL" ? "Parcial" : "Incorreto"} · {a.scoreAvaliacao}pts
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <button
            onClick={() => {
              savedRef.current = false;
              setView("home");
            }}
            className="flex-1 rounded border border-violet-500/40 bg-violet-500/10 py-2.5 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition"
          >
            Nova Sessão
          </button>
          <button
            onClick={() => router.push("/matematica")}
            className="flex-1 rounded border border-line bg-card-hover py-2.5 text-xs font-medium text-muted hover:text-fg transition"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return null;
}
