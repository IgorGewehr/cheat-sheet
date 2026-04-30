"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { GraduationCap, Star, RotateCcw, Send, ChevronRight, CheckCircle2, XCircle, Lightbulb, Search } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";
import type { MentoriaResposta } from "@/app/api/ai/mentoria/route";
import type { CardCategory } from "@/lib/types";

interface ConceitoItem {
  slug: string;
  title: string;
  category: CardCategory;
}

interface MentoriaViewProps {
  conceitos: ConceitoItem[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  avaliacao?: string;
  lacuna?: string;
}

const TIPO_COLOR: Record<MentoriaResposta["tipo"], string> = {
  basica: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  contexto: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "edge-case": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  alternativa: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  profunda: "bg-red-500/15 text-red-700 dark:text-red-300",
};

const TIPO_LABEL: Record<MentoriaResposta["tipo"], string> = {
  basica: "Básica",
  contexto: "Contexto",
  "edge-case": "Edge case",
  alternativa: "Alternativa",
  profunda: "Profunda",
};

function StarLevel({ nivel }: { nivel: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={clsx(
            "w-3.5 h-3.5",
            i < nivel ? "fill-amber-500 text-amber-500" : "text-line-strong",
          )}
        />
      ))}
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

export function MentoriaView({ conceitos }: MentoriaViewProps) {
  const [conceito, setConceito] = useState("");
  const [search, setSearch] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nivelPergunta, setNivelPergunta] = useState(1);
  const [perguntaCount, setPerguntaCount] = useState(0);
  const [ultimoTipo, setUltimoTipo] = useState<MentoriaResposta["tipo"]>("basica");
  const [pronto, setPronto] = useState(false);
  const [avaliacaoFinal, setAvaliacaoFinal] = useState<MentoriaResposta["avaliacaoFinal"] | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const filtered = conceitos.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  // Build API historico: user messages = mentor answers, assistant messages = junior questions
  function buildHistorico(msgs: Message[]) {
    // In the chat UI: "assistant" = junior (AI), "user" = mentor (Igor)
    // In the API prompt: "user" = mentor, "assistant" = junior
    return msgs.map((m) => ({ role: m.role, content: m.content }));
  }

  async function startSession() {
    if (!conceito.trim()) return;
    setStarted(true);
    setLoading(true);
    setError("");
    setPerguntaCount(0);
    setNivelPergunta(1);
    try {
      const res = await fetch("/api/ai/mentoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historico: [], conceito, nivelPergunta: 1 }),
      });
      const data = (await res.json()) as MentoriaResposta & { error?: string };
      if (data.error) { setError(data.error); setStarted(false); return; }
      setMessages([{ role: "assistant", content: data.pergunta }]);
      setUltimoTipo(data.tipo);
      setPerguntaCount(1);
      if (data.pronto) { setPronto(true); setAvaliacaoFinal(data.avaliacaoFinal ?? null); }
    } catch {
      setError("Erro ao conectar com a API.");
      setStarted(false);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }

  async function sendResposta() {
    const trimmed = resposta.trim();
    if (!trimmed || loading || pronto) return;
    const userMsg: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setResposta("");
    setLoading(true);
    setError("");

    const novoNivel = Math.min(5, Math.ceil((perguntaCount + 1) / 2));

    try {
      const res = await fetch("/api/ai/mentoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          historico: buildHistorico(newMessages),
          conceito,
          nivelPergunta: novoNivel,
        }),
      });
      const data = (await res.json()) as MentoriaResposta & { error?: string };
      if (data.error) { setError(data.error); return; }

      const asstMsg: Message = {
        role: "assistant",
        content: data.pergunta,
        avaliacao: data.avaliacaoResposta,
        lacuna: data.lacunaNaResposta,
      };
      setMessages((prev) => [...prev, asstMsg]);
      setUltimoTipo(data.tipo);
      setNivelPergunta(data.nivel ?? novoNivel);
      setPerguntaCount((c) => c + 1);
      if (data.pronto) { setPronto(true); setAvaliacaoFinal(data.avaliacaoFinal ?? null); }
    } catch {
      setError("Erro ao conectar com a API.");
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendResposta();
    }
  }

  function reset() {
    setStarted(false);
    setMessages([]);
    setResposta("");
    setNivelPergunta(1);
    setPerguntaCount(0);
    setPronto(false);
    setAvaliacaoFinal(null);
    setError("");
    setConceito("");
    setSearch("");
  }

  // Concept selection
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-amber-500" />
            Mentoria Invertida
          </h1>
          <p className="text-muted">
            Você é o mentor. A IA é o junior fazendo perguntas cada vez mais difíceis.
            Explique até ele ficar satisfeito — e receba uma avaliação da sua didática.
          </p>
        </header>

        <Card className="space-y-5">
          <div>
            <Label>Conceito que você vai explicar</Label>
            <Input
              value={conceito}
              onChange={(e) => setConceito(e.target.value)}
              placeholder="Ex: JWT e refresh tokens, índices de banco, event sourcing..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && startSession()}
            />
          </div>

          <div>
            <Label>Ou escolha um card da biblioteca</Label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-md bg-card border border-line pl-9 pr-3 py-2 text-sm text-fg outline-none focus:border-amber-500"
              />
            </div>
            {search && (
              <div className="border border-line rounded-xl overflow-hidden divide-y divide-line max-h-48 overflow-y-auto">
                {filtered.slice(0, 8).map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => { setConceito(c.title); setSearch(""); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-card-hover flex items-center justify-between gap-3 transition"
                  >
                    <span className="truncate">{c.title}</span>
                    <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="px-4 py-3 text-sm text-muted">Nenhum resultado.</p>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            onClick={startSession}
            disabled={loading || !conceito.trim()}
            className="w-full justify-center"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Preparando junior...
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4" /> Iniciar sessão de mentoria
              </>
            )}
          </Button>
        </Card>
      </div>
    );
  }

  // Chat screen
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <GraduationCap className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="font-medium text-sm truncate">{conceito}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            <StarLevel nivel={nivelPergunta} />
            <span>Nível {nivelPergunta}</span>
          </div>
          <span className="text-xs text-muted">Pergunta {perguntaCount}~/10</span>
          <Button variant="ghost" onClick={reset} className="px-2 py-1.5 text-xs gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Nova sessão
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className="space-y-2">
            <div className={clsx("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                  msg.role === "assistant"
                    ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                )}
              >
                {msg.role === "assistant" ? "JR" : "ME"}
              </div>
              <div
                className={clsx(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "assistant"
                    ? "bg-card border border-line rounded-tl-sm"
                    : "bg-amber-500/10 border border-amber-500/20 rounded-tr-sm text-fg",
                )}
              >
                {msg.content}
              </div>
            </div>
            {/* Evaluation badge under junior message */}
            {msg.role === "assistant" && (msg.avaliacao || msg.lacuna) && (
              <div className="ml-11 space-y-1.5">
                {msg.avaliacao && (
                  <div className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {msg.avaliacao}
                  </div>
                )}
                {msg.lacuna && (
                  <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                    <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {msg.lacuna}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-500/15 flex items-center justify-center shrink-0 text-xs font-bold text-sky-700 dark:text-sky-300">
              JR
            </div>
            <div className="bg-card border border-line rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* Final evaluation */}
        {pronto && avaliacaoFinal && (
          <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-amber-700 dark:text-amber-300">
                  Sessão concluída — avaliação da sua mentoria
                </span>
              </div>
              <span className={clsx("text-4xl font-bold tabular-nums", scoreColor(avaliacaoFinal.score))}>
                {avaliacaoFinal.score}
              </span>
            </div>

            {avaliacaoFinal.pontosFortesExplicacao.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pontos fortes da explicação
                </p>
                <ul className="space-y-1">
                  {avaliacaoFinal.pontosFortesExplicacao.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-fg">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {avaliacaoFinal.lacunasNaExplicacao.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Lacunas na explicação
                </p>
                <ul className="space-y-1">
                  {avaliacaoFinal.lacunasNaExplicacao.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-fg">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-card rounded-xl border border-line p-3">
              <p className="text-xs font-semibold text-muted mb-1">Recomendações</p>
              <p className="text-sm leading-relaxed">{avaliacaoFinal.recomendacoes}</p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <p className="shrink-0 text-sm text-red-500">{error}</p>}

      {/* Input */}
      {!pronto && (
        <div className="shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className={clsx("inline-block px-2 py-0.5 rounded text-[11px] font-medium", TIPO_COLOR[ultimoTipo])}>
              {TIPO_LABEL[ultimoTipo]}
            </span>
            <span className="text-xs text-muted">⌘+Enter para responder</span>
          </div>
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={3}
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Sua explicação para o junior..."
              disabled={loading}
              className="flex-1 rounded-md bg-card border border-line px-3 py-2 text-sm text-fg outline-none focus:border-amber-500 disabled:opacity-50 resize-none"
            />
            <button
              onClick={sendResposta}
              disabled={loading || !resposta.trim()}
              className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition text-zinc-950 shrink-0 mb-0.5"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {pronto && (
        <div className="shrink-0 flex justify-center">
          <Button onClick={reset} variant="secondary">
            <RotateCcw className="w-4 h-4" /> Nova sessão
          </Button>
        </div>
      )}
    </div>
  );
}
