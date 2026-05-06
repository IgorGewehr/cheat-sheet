"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { clsx } from "clsx";
import { Code2, Zap, ChevronDown, ChevronRight, Trophy, RotateCcw, Lightbulb, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui";
import { saveChallengeRun, listChallengeRuns } from "@/lib/coding-challenge-db";
import type { ChallengeArea, ChallengeRank, ChallengeVerdict, CodingChallenge, ChallengeRun } from "@/lib/coding-challenge-types";

// ─── Config ──────────────────────────────────────────────────────────────────

const AREAS: { id: ChallengeArea; label: string; desc: string }[] = [
  { id: "arrays-strings",  label: "Arrays & Strings",   desc: "Two pointers, sliding window" },
  { id: "hashmaps",        label: "Hash Maps",           desc: "Frequência, prefix sum" },
  { id: "trees-graphs",    label: "Árvores & Grafos",    desc: "BFS, DFS, componentes" },
  { id: "dp",              label: "Dynamic Programming", desc: "Memoização, subproblemas" },
  { id: "nestjs-design",   label: "NestJS Design",       desc: "Módulos, padrões, API" },
];

const RANKS: { id: ChallengeRank; label: string; color: string }[] = [
  { id: "E", label: "E — Warm-up",  color: "border-emerald-500/50 text-emerald-400" },
  { id: "D", label: "D — Pleno",    color: "border-sky-500/50 text-sky-400" },
  { id: "C", label: "C — Sênior",   color: "border-violet-500/50 text-violet-400" },
  { id: "B", label: "B — Staff",    color: "border-amber-500/50 text-amber-400" },
];

const VERDICT_CONFIG: Record<ChallengeVerdict, { label: string; color: string; bg: string }> = {
  PASS:    { label: "PASS",    color: "text-emerald-400", bg: "border-emerald-500/40 bg-emerald-500/5" },
  PARTIAL: { label: "PARTIAL", color: "text-amber-400",   bg: "border-amber-500/40 bg-amber-500/5" },
  FAIL:    { label: "FAIL",    color: "text-red-400",     bg: "border-red-500/40 bg-red-500/5" },
  PENDING: { label: "—",       color: "text-muted",       bg: "" },
};

// ─── Main ─────────────────────────────────────────────────────────────────────

type View = "home" | "challenge" | "result";

interface EvalResult {
  veredito: ChallengeVerdict;
  score: number;
  feedback: string;
  complexidadeAnalisada: string;
  conceitosCobertos: string[];
  conceitosFaltantes: string[];
}

export function CodingChallengeClient() {
  const [view, setView] = useState<View>("home");
  const [area, setArea] = useState<ChallengeArea>("arrays-strings");
  const [rank, setRank] = useState<ChallengeRank>("D");
  const [challenge, setChallenge] = useState<CodingChallenge | null>(null);
  const [solucao, setSolucao] = useState("");
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [runs, setRuns] = useState<ChallengeRun[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    listChallengeRuns().then(setRuns).catch(() => {});
  }, []);

  async function gerarDesafio() {
    setLoading(true);
    setChallenge(null);
    setEvalResult(null);
    setSolucao("");
    setShowHint(false);
    setHintIndex(0);
    try {
      const res = await fetch("/api/ai/coding-challenge/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, rank }),
      });
      const data: CodingChallenge = await res.json();
      setChallenge(data);
      setView("challenge");
    } finally {
      setLoading(false);
    }
  }

  async function avaliarSolucao() {
    if (!challenge || !solucao.trim()) return;
    setEvaluating(true);
    try {
      const res = await fetch("/api/ai/coding-challenge/avaliar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge, solucao }),
      });
      const result: EvalResult = await res.json();
      setEvalResult(result);
      setView("result");

      const run: ChallengeRun = {
        id: uuidv4(),
        challenge,
        solucao,
        veredito: result.veredito,
        score: result.score,
        feedback: result.feedback,
        complexidadeAnalisada: result.complexidadeAnalisada,
        conceitosCobertos: result.conceitosCobertos,
        conceitosFaltantes: result.conceitosFaltantes,
        createdAt: Date.now(),
      };
      await saveChallengeRun(run).catch(() => {});
      setRuns((prev) => [run, ...prev]);
    } finally {
      setEvaluating(false);
    }
  }

  // ── Home ──────────────────────────────────────────────────────────────────

  if (view === "home") return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
      <div className="flex items-center gap-3">
        <Code2 className="w-6 h-6 text-violet-400" />
        <div>
          <h1 className="text-xl font-bold text-fg">Coding Challenge</h1>
          <p className="text-sm text-muted">Desafios de entrevista gerados por IA, avaliados com feedback real</p>
        </div>
      </div>

      <Card className="p-5 space-y-5">
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Área</p>
          <div className="grid grid-cols-1 gap-2">
            {AREAS.map((a) => (
              <button
                key={a.id}
                onClick={() => setArea(a.id)}
                className={clsx(
                  "text-left px-4 py-3 rounded-lg border text-sm transition",
                  area === a.id
                    ? "border-violet-500/70 bg-violet-500/10 text-fg"
                    : "border-line bg-card text-muted hover:border-line-strong hover:text-fg"
                )}
              >
                <span className="font-medium">{a.label}</span>
                <span className="text-xs ml-2 opacity-70">{a.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Dificuldade</p>
          <div className="grid grid-cols-4 gap-2">
            {RANKS.map((r) => (
              <button
                key={r.id}
                onClick={() => setRank(r.id)}
                className={clsx(
                  "py-2 rounded-lg border text-xs font-bold transition",
                  rank === r.id ? `${r.color} bg-current/5` : "border-line text-muted hover:border-line-strong"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={gerarDesafio}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {loading ? "Gerando desafio..." : "Gerar Desafio"}
        </button>
      </Card>

      {runs.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-muted hover:text-fg transition mb-2"
          >
            {showHistory ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Histórico ({runs.length} runs)
          </button>
          {showHistory && (
            <div className="space-y-2">
              {runs.slice(0, 10).map((r) => {
                const v = VERDICT_CONFIG[r.veredito];
                return (
                  <div key={r.id} className={clsx("px-4 py-3 rounded-lg border text-sm", v.bg)}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-fg truncate">{r.challenge.titulo}</span>
                      <span className={clsx("font-bold ml-2 shrink-0", v.color)}>{v.label} {r.score}</span>
                    </div>
                    <p className="text-xs text-muted mt-1">{r.challenge.area} · {r.challenge.rank} · {new Date(r.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Challenge ─────────────────────────────────────────────────────────────

  if (view === "challenge" && challenge) return (
    <div className="max-w-3xl mx-auto space-y-4 py-6 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-violet-400" />
          <h2 className="font-bold text-fg">{challenge.titulo}</h2>
          <span className="text-xs px-2 py-0.5 rounded border border-line text-muted">{challenge.rank}</span>
        </div>
        <button onClick={() => setView("home")} className="text-xs text-muted hover:text-fg flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> Novo
        </button>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Problema</p>
          <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{challenge.enunciado}</p>
        </div>

        {challenge.exemplos.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Exemplos</p>
            <div className="space-y-2">
              {challenge.exemplos.map((ex, i) => (
                <div key={i} className="rounded-lg bg-zinc-900 border border-line p-3 text-xs font-mono">
                  <p><span className="text-muted">Input:</span>  <span className="text-fg">{ex.input}</span></p>
                  <p><span className="text-muted">Output:</span> <span className="text-emerald-400">{ex.output}</span></p>
                  {ex.explicacao && <p className="text-muted mt-1">{ex.explicacao}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-1">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Complexidade esperada</p>
          <p className="text-xs text-violet-300 font-mono">{challenge.complexidadeEsperada}</p>
        </div>
      </Card>

      {/* Hints */}
      {challenge.dicas.length > 0 && (
        <div>
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition"
          >
            {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showHint ? "Esconder dica" : "Ver dica"}
          </button>
          {showHint && (
            <div className="mt-2 space-y-2">
              {challenge.dicas.slice(0, hintIndex + 1).map((dica, i) => (
                <div key={i} className="flex gap-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-sm text-amber-200">
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>{dica}</span>
                </div>
              ))}
              {hintIndex < challenge.dicas.length - 1 && (
                <button
                  onClick={() => setHintIndex(hintIndex + 1)}
                  className="text-xs text-amber-400/70 hover:text-amber-400"
                >
                  + próxima dica
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Solution editor */}
      <Card className="p-4 space-y-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">Sua solução (TypeScript)</p>
        <textarea
          value={solucao}
          onChange={(e) => setSolucao(e.target.value)}
          className="w-full h-64 bg-zinc-900 border border-line rounded-lg p-3 text-sm font-mono text-fg resize-y focus:outline-none focus:border-violet-500/50 placeholder:text-zinc-600"
          placeholder={"function solution(...) {\n  // sua solução aqui\n}"}
          spellCheck={false}
        />
        <button
          onClick={avaliarSolucao}
          disabled={evaluating || !solucao.trim()}
          className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {evaluating ? "Avaliando..." : "Avaliar Solução"}
        </button>
      </Card>
    </div>
  );

  // ── Result ────────────────────────────────────────────────────────────────

  if (view === "result" && evalResult && challenge) {
    const v = VERDICT_CONFIG[evalResult.veredito];
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-violet-400" />
            <h2 className="font-bold text-fg">Resultado</h2>
          </div>
          <button onClick={() => setView("home")} className="text-xs text-muted hover:text-fg flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Novo desafio
          </button>
        </div>

        <Card className={clsx("p-5 border", v.bg)}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted mb-1">{challenge.titulo}</p>
              <span className={clsx("text-3xl font-black", v.color)}>{v.label}</span>
            </div>
            <div className="text-right">
              <span className={clsx("text-4xl font-black", v.color)}>{evalResult.score}</span>
              <p className="text-xs text-muted">/ 100</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Complexidade analisada</p>
              <p className="text-xs font-mono text-violet-300">{evalResult.complexidadeAnalisada}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Feedback</p>
              <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{evalResult.feedback}</p>
            </div>

            {evalResult.conceitosCobertos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Conceitos demonstrados</p>
                <div className="flex flex-wrap gap-1.5">
                  {evalResult.conceitosCobertos.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {evalResult.conceitosFaltantes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Pontos a melhorar</p>
                <div className="flex flex-wrap gap-1.5">
                  {evalResult.conceitosFaltantes.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Sua solução</p>
          <pre className="text-xs font-mono text-fg bg-zinc-900 rounded p-3 overflow-x-auto whitespace-pre-wrap">{solucao}</pre>
        </Card>

        <div className="flex gap-3">
          <button
            onClick={() => { setView("challenge"); setEvalResult(null); setSolucao(""); setShowHint(false); setHintIndex(0); }}
            className="flex-1 py-2.5 rounded-lg border border-line text-sm text-muted hover:text-fg hover:border-line-strong transition"
          >
            Tentar novamente
          </button>
          <button
            onClick={gerarDesafio}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition"
          >
            {loading ? "Gerando..." : "Próximo desafio"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
