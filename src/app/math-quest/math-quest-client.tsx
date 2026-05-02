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
import { SystemWindow } from "@/components/system-window";
import { ManaBar, consumeMana } from "@/components/mana-bar";
import { BossFightBanner } from "@/components/boss-fight-banner";
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

const RANK_COLOR: Record<QuestRank, string> = {
  E: "bg-zinc-700 text-zinc-300",
  D: "bg-emerald-900 text-emerald-300",
  C: "bg-cyan-900 text-cyan-300",
  B: "bg-violet-900 text-violet-300",
  A: "bg-fuchsia-900 text-fuchsia-300",
  S: "bg-amber-900 text-amber-300",
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
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-red-500 bg-red-950/80 px-4 py-2 text-sm text-red-300 font-mono shadow-lg">
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
  const [mpUsado, setMpUsado] = useState(0);
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
    setMpUsado(0);
    setVerifyResult(null);
    setView("running");
  }

  const currentProblem = problems[currentIdx];

  async function handleDica() {
    if (!currentProblem) return;
    const ok = consumeMana(10);
    if (!ok) {
      setToast("MP insuficiente para pedir dica.");
      return;
    }
    setMpUsado((p) => p + 10);
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
      mpFinal: mpUsado,
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

        <SystemWindow label="[SYSTEM] · MATH GATE">
          <div className="space-y-5">
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Selecione a área</p>
            <div className="grid grid-cols-3 gap-2">
              {AREAS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedArea(id)}
                  className={clsx(
                    "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-mono transition-all",
                    selectedArea === id
                      ? "border-cyan-500 bg-cyan-950/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>

            <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Selecione o rank</p>
            <div className="flex gap-2 flex-wrap">
              {RANKS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRank(r)}
                  className={clsx(
                    "px-3 py-1 rounded text-xs font-mono font-bold border transition-all",
                    selectedRank === r
                      ? "border-violet-500 bg-violet-950/60 text-violet-200 shadow-[0_0_8px_rgba(139,92,246,0.4)]"
                      : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={startRun}
              className="w-full rounded-lg border border-cyan-500 bg-cyan-950/30 py-3 text-sm font-mono font-bold uppercase tracking-widest text-cyan-300 transition-all hover:bg-cyan-950/60 hover:shadow-[0_0_16px_rgba(6,182,212,0.4)]"
            >
              INICIAR GATE
            </button>
          </div>
        </SystemWindow>

        <div className="rounded-lg border border-zinc-700 bg-zinc-900/40">
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-xs font-mono text-zinc-400 uppercase tracking-widest"
          >
            <span>Quests anteriores</span>
            {historyOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {historyOpen && (
            <div className="px-4 pb-3 space-y-2">
              {prevRuns.length === 0 && (
                <p className="text-xs text-zinc-500 font-mono">Nenhuma run anterior.</p>
              )}
              {prevRuns.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs font-mono text-zinc-400 border-t border-zinc-800 pt-2">
                  <span>{AREAS.find((a) => a.id === r.area)?.label ?? r.area} · Rank {r.rank}</span>
                  <span className="text-zinc-500">{new Date(r.iniciadoEm).toLocaleDateString("pt-BR")} · XP {r.xpGanho}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "running" && currentProblem) {
    const verdictColor =
      verifyResult?.veredito === "PASS"    ? "border-cyan-500 bg-cyan-950/30 text-cyan-300" :
      verifyResult?.veredito === "PARTIAL" ? "border-amber-500 bg-amber-950/30 text-amber-300" :
      verifyResult?.veredito === "FAIL"    ? "border-red-500 bg-red-950/30 text-red-300" :
      "";

    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

        <div className="space-y-2">
          <ManaBar variant="full" />
          <div className="flex items-center gap-1.5 text-base">
            {problems.map((p, i) => (
              <span
                key={p.id}
                className={clsx(
                  "font-mono text-lg select-none",
                  p.isBoss
                    ? i <= currentIdx && answers[i] ? "text-fuchsia-400" : i === currentIdx ? "text-fuchsia-500 animate-pulse" : "text-fuchsia-900"
                    : i < currentIdx ? "text-cyan-400" : i === currentIdx ? "text-cyan-500" : "text-zinc-700",
                )}
              >
                {p.isBoss ? "✦" : "◇"}
              </span>
            ))}
            <span className="ml-2 text-xs font-mono text-zinc-500">
              {currentIdx + 1}/{problems.length}
            </span>
          </div>
        </div>

        {currentProblem.isBoss && (
          <BossFightBanner
            headline="BOSS FIGHT"
            subtitle={`Área ${AREAS.find((a) => a.id === selectedArea)?.label} — Rank ${currentProblem.rank}`}
          />
        )}

        <SystemWindow
          variant={currentProblem.isBoss ? "alert" : "default"}
          label={`[PROBLEMA ${currentIdx + 1}]`}
          subtitle={`Área: ${AREAS.find((a) => a.id === selectedArea)?.label} · Rank: ${currentProblem.rank}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className={clsx("px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase", RANK_COLOR[currentProblem.rank])}>
              RANK {currentProblem.rank}
            </span>
            {currentProblem.isBoss && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-fuchsia-900 text-fuchsia-300">
                BOSS
              </span>
            )}
          </div>
          <pre className="text-sm text-zinc-100 font-mono whitespace-pre-wrap leading-relaxed">
            {currentProblem.enunciado}
          </pre>
        </SystemWindow>

        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Sua resposta</label>
          <textarea
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            rows={8}
            placeholder="Escreva sua solução aqui..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none resize-y"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDica}
            disabled={loading !== null}
            className="rounded border border-violet-600 bg-violet-950/40 px-3 py-1.5 text-xs font-mono text-violet-300 hover:bg-violet-950/70 disabled:opacity-50 transition-all"
          >
            {loading === "dica" ? "..." : "DICA (−10 MP)"}
          </button>
          <button
            onClick={handleVerificar}
            disabled={loading !== null || !resposta.trim()}
            className="rounded border border-cyan-600 bg-cyan-950/40 px-3 py-1.5 text-xs font-mono text-cyan-300 hover:bg-cyan-950/70 disabled:opacity-50 transition-all"
          >
            {loading === "verificar" ? "VERIFICANDO..." : "VERIFICAR"}
          </button>
          <button
            onClick={handleNext}
            disabled={!verifyResult}
            className="rounded border border-emerald-600 bg-emerald-950/40 px-3 py-1.5 text-xs font-mono text-emerald-300 hover:bg-emerald-950/70 disabled:opacity-50 transition-all"
          >
            {currentIdx >= problems.length - 1 ? "FINALIZAR" : "PRÓXIMO →"}
          </button>
        </div>

        {dica && (
          <div className="rounded-lg border border-cyan-700/50 bg-cyan-950/20">
            <button
              onClick={() => setDicaOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-cyan-400"
            >
              <span>Dica socrática</span>
              {dicaOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {dicaOpen && (
              <p className="px-4 pb-3 text-sm font-mono text-cyan-200 leading-relaxed border-t border-cyan-700/30 pt-2">
                {dica}
              </p>
            )}
          </div>
        )}

        {verifyResult && (
          <div className={clsx("rounded-lg border p-4 space-y-3", verdictColor)}>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                VEREDITO: {verifyResult.veredito}
              </span>
              <span className="text-xs font-mono font-bold ml-auto">
                {verifyResult.score}/100
              </span>
            </div>
            <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
              {verifyResult.feedback}
            </p>
            {verifyResult.conceitosCobertos.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {verifyResult.conceitosCobertos.map((c) => (
                  <span key={c} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-900/50 text-cyan-400 border border-cyan-700/40">
                    {c}
                  </span>
                ))}
              </div>
            )}
            {verifyResult.conceitosFaltantes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {verifyResult.conceitosFaltantes.map((c) => (
                  <span key={c} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-900/50 text-red-400 border border-red-700/40">
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

        <SystemWindow
          variant={passed ? "success" : "alert"}
          label={passed ? "[SYSTEM] · DUNGEON CLEARED" : "[SYSTEM] · DUNGEON FAILED"}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Score Total", value: `${totalScore}/100` },
                { label: "Problemas", value: `${answers.length}/${problems.length}` },
                { label: "MP Usado", value: `${mpUsado} MP` },
                { label: "Dicas", value: String(dicasUsadas) },
                { label: "XP MAT", value: `+${xpGanho} XP` },
                { label: "Rank", value: selectedRank },
              ].map(({ label, value }) => (
                <div key={label} className="rounded border border-zinc-700 bg-zinc-900/60 p-2">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-0.5">{label}</p>
                  <p className="text-base font-mono font-bold text-zinc-100">{value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {answers.map((a, i) => (
                <div key={a.problemId} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">#{i + 1} {a.problemId}</span>
                  <span className={clsx(
                    "font-bold",
                    a.veredito === "PASS" ? "text-cyan-400" :
                    a.veredito === "PARTIAL" ? "text-amber-400" : "text-red-400",
                  )}>
                    {a.veredito} · {a.scoreAvaliacao}pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SystemWindow>

        <div className="flex gap-3">
          <button
            onClick={() => {
              savedRef.current = false;
              setView("home");
            }}
            className="flex-1 rounded border border-cyan-600 bg-cyan-950/30 py-2.5 text-xs font-mono font-bold uppercase tracking-widest text-cyan-300 hover:bg-cyan-950/60 transition-all"
          >
            NOVO GATE
          </button>
          <button
            onClick={() => router.push("/matematica")}
            className="flex-1 rounded border border-zinc-600 bg-zinc-900/40 py-2.5 text-xs font-mono font-bold uppercase tracking-widest text-zinc-300 hover:bg-zinc-800/60 transition-all"
          >
            VOLTAR
          </button>
        </div>
      </div>
    );
  }

  return null;
}
