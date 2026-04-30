"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  AlertTriangle, CheckCircle2, XCircle, RefreshCw, Zap, Trophy,
} from "lucide-react";
import { Button, Card, Label, Select, Tag, Textarea } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import type { AntiPatternChallenge, AntiPatternFeedback } from "@/app/api/ai/anti-pattern/route";

type Dificuldade = "facil" | "medio" | "dificil";
type Fase = "landing" | "gerando" | "desafio" | "feedback";

interface ContadorDia {
  data: string; // YYYY-MM-DD
  total: number;
  acertos: number;
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function lerContador(): ContadorDia {
  try {
    const raw = localStorage.getItem("anti-pattern-contador");
    if (!raw) return { data: hoje(), total: 0, acertos: 0 };
    const c = JSON.parse(raw) as ContadorDia;
    if (c.data !== hoje()) return { data: hoje(), total: 0, acertos: 0 };
    return c;
  } catch {
    return { data: hoje(), total: 0, acertos: 0 };
  }
}

function salvarContador(c: ContadorDia) {
  try {
    localStorage.setItem("anti-pattern-contador", JSON.stringify(c));
  } catch {
    // ignore
  }
}

const DIFICULDADE_LABEL: Record<Dificuldade, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};

const DIFICULDADE_COLOR: Record<Dificuldade, string> = {
  facil: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  medio: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  dificil: "bg-red-500/15 text-red-700 dark:text-red-300",
};

export function AntiPatternView() {
  const [fase, setFase] = useState<Fase>("landing");
  const [dificuldade, setDificuldade] = useState<Dificuldade>("medio");
  const [desafio, setDesafio] = useState<AntiPatternChallenge | null>(null);
  const [identificacao, setIdentificacao] = useState("");
  const [nomeAntiPattern, setNomeAntiPattern] = useState("");
  const [feedback, setFeedback] = useState<AntiPatternFeedback | null>(null);
  const [error, setError] = useState("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [contador, setContador] = useState<ContadorDia>({ data: hoje(), total: 0, acertos: 0 });

  useEffect(() => {
    setContador(lerContador());
  }, []);

  async function gerarDesafio() {
    setFase("gerando");
    setError("");
    setIdentificacao("");
    setNomeAntiPattern("");
    setFeedback(null);
    try {
      const res = await fetch("/api/ai/anti-pattern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", dificuldade }),
      });
      const data = (await res.json()) as AntiPatternChallenge & { error?: string };
      if (data.error) {
        setError(data.error);
        setFase("landing");
        return;
      }
      setDesafio(data);
      setFase("desafio");
    } catch {
      setError("Erro ao gerar desafio. Tente novamente.");
      setFase("landing");
    }
  }

  async function verResposta() {
    if (!desafio || !identificacao.trim()) return;
    setLoadingFeedback(true);
    setError("");
    try {
      const res = await fetch("/api/ai/anti-pattern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          codigo: desafio.codigo,
          identificacao: identificacao.trim(),
          nomeAntiPattern: nomeAntiPattern.trim() || "não informado",
        }),
      });
      const data = (await res.json()) as AntiPatternFeedback & { error?: string };
      if (data.error) {
        setError(data.error);
        return;
      }
      setFeedback(data);
      setFase("feedback");

      // Atualiza contador
      const c = lerContador();
      const novo: ContadorDia = {
        data: hoje(),
        total: c.total + 1,
        acertos: c.acertos + (data.acertou ? 1 : 0),
      };
      salvarContador(novo);
      setContador(novo);
    } catch {
      setError("Erro ao avaliar resposta. Tente novamente.");
    } finally {
      setLoadingFeedback(false);
    }
  }

  function novoDesafio() {
    setFase("landing");
    setDesafio(null);
    setFeedback(null);
    setIdentificacao("");
    setNomeAntiPattern("");
    setError("");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
          Anti-Pattern
        </h1>
        <p className="text-muted max-w-2xl">
          Você recebe código com um problema embutido e deve identificá-lo <strong>sem dicas</strong>.
          Treina o reconhecimento de padrões que evita bugs em produção.
        </p>
      </header>

      {/* Contador */}
      <div className="flex items-center gap-3 text-sm text-muted">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span>
          Hoje: <strong className="text-fg">{contador.total}</strong> desafio{contador.total !== 1 ? "s" : ""},
          {" "}
          <strong className={clsx(
            contador.acertos > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-fg",
          )}>
            {contador.acertos}
          </strong>{" "}
          acerto{contador.acertos !== 1 ? "s" : ""}
          {contador.total > 0 && (
            <span className="text-subtle ml-1">
              ({Math.round((contador.acertos / contador.total) * 100)}% de aproveitamento)
            </span>
          )}
        </span>
      </div>

      {/* ─── Fase: Landing ─── */}
      {(fase === "landing" || fase === "gerando") && (
        <Card className="max-w-lg space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="dificuldade">Dificuldade</Label>
              <Select
                id="dificuldade"
                value={dificuldade}
                onChange={(e) => setDificuldade(e.target.value as Dificuldade)}
              >
                <option value="facil">Fácil — problemas óbvios</option>
                <option value="medio">Médio — padrões comuns de produção</option>
                <option value="dificil">Difícil — anti-patterns sutis</option>
              </Select>
            </div>

            <div className="rounded-lg bg-card-hover p-4 space-y-2 text-sm">
              <p className="font-medium">Como funciona:</p>
              <ol className="space-y-1 text-muted list-decimal list-inside">
                <li>A IA gera um trecho de código com um problema embutido</li>
                <li>Você descreve o que está errado (sem ver a resposta)</li>
                <li>A IA avalia sua identificação e explica o anti-pattern</li>
              </ol>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button onClick={gerarDesafio} disabled={fase === "gerando"} className="w-full">
            {fase === "gerando" ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                Gerando desafio…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Gerar Desafio
              </>
            )}
          </Button>
        </Card>
      )}

      {/* ─── Fase: Desafio ─── */}
      {fase === "desafio" && desafio && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className={clsx("text-xs font-semibold px-2.5 py-1 rounded-full", DIFICULDADE_COLOR[desafio.dificuldade as Dificuldade] ?? DIFICULDADE_COLOR.medio)}>
                {DIFICULDADE_LABEL[desafio.dificuldade as Dificuldade] ?? desafio.dificuldade}
              </span>
              <Tag color="zinc">{desafio.linguagem}</Tag>
            </div>
            <button
              onClick={novoDesafio}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-fg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Outro desafio
            </button>
          </div>

          {/* Código */}
          <div className="rounded-xl border border-line overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border-b border-zinc-700">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <span className="ml-2 text-xs font-mono text-zinc-400">{desafio.linguagem}</span>
            </div>
            <pre className="bg-zinc-950 text-zinc-100 px-5 py-4 overflow-x-auto text-sm leading-relaxed font-mono whitespace-pre">
              <code>{desafio.codigo}</code>
            </pre>
          </div>

          {/* Resposta do usuário */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome-anti-pattern">Nome do anti-pattern (opcional)</Label>
              <input
                id="nome-anti-pattern"
                type="text"
                value={nomeAntiPattern}
                onChange={(e) => setNomeAntiPattern(e.target.value)}
                placeholder="ex: N+1 Query, God Object, Magic Numbers…"
                className="w-full rounded-md bg-card border border-line px-3 py-2 text-sm text-fg outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="identificacao">O que está errado neste código?</Label>
              <Textarea
                id="identificacao"
                value={identificacao}
                onChange={(e) => setIdentificacao(e.target.value)}
                placeholder="Descreva o problema em suas palavras. Seja específico: qual parte do código, qual o risco, qual o impacto…"
                className="min-h-[140px] resize-y"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              onClick={verResposta}
              disabled={loadingFeedback || !identificacao.trim()}
              className="w-full sm:w-auto"
            >
              {loadingFeedback ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  Avaliando…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Ver resposta
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Fase: Feedback ─── */}
      {fase === "feedback" && feedback && desafio && (
        <div className="space-y-5">
          {/* Resultado */}
          <div
            className={clsx(
              "flex items-center gap-3 p-4 rounded-xl border text-lg font-bold",
              feedback.acertou
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300",
            )}
          >
            {feedback.acertou ? (
              <>
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                Acertou!
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 shrink-0" />
                Não identificou
              </>
            )}
            <span className="ml-auto text-base font-semibold text-fg">{feedback.nomeAntiPattern}</span>
          </div>

          {/* Código novamente */}
          <div className="rounded-xl border border-line overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border-b border-zinc-700">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <span className="ml-2 text-xs font-mono text-zinc-400">{desafio.linguagem}</span>
            </div>
            <pre className="bg-zinc-950 text-zinc-100 px-5 py-4 overflow-x-auto text-sm leading-relaxed font-mono whitespace-pre">
              <code>{desafio.codigo}</code>
            </pre>
          </div>

          {/* Explicação */}
          <Card className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              O que é: {feedback.nomeAntiPattern}
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownRenderer body={feedback.explicacao} />
            </div>
          </Card>

          {/* Como corrigir */}
          <Card className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Como corrigir
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownRenderer body={feedback.comoCorrigir} />
            </div>
          </Card>

          {/* Código corrigido */}
          {feedback.codigoCorrigido && (
            <div className="rounded-xl border border-emerald-500/30 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border-b border-zinc-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
                <span className="ml-2 text-xs font-mono text-zinc-400">versão corrigida</span>
              </div>
              <pre className="bg-zinc-950 text-zinc-100 px-5 py-4 overflow-x-auto text-sm leading-relaxed font-mono whitespace-pre">
                <code>{feedback.codigoCorrigido}</code>
              </pre>
            </div>
          )}

          {/* Dicas que estavam no código */}
          {feedback.dicas.length > 0 && (
            <Card className="space-y-3">
              <h3 className="font-semibold text-sm text-muted">Pistas que estavam no código</h3>
              <ul className="space-y-1.5">
                {feedback.dicas.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Novo desafio */}
          <Button onClick={novoDesafio} className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4" />
            Novo desafio
          </Button>
        </div>
      )}
    </div>
  );
}
