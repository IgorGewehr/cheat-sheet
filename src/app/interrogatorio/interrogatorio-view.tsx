"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { Send, RotateCcw, ChevronDown, ChevronUp, Brain, User, Sparkles } from "lucide-react";
import { Button, Card, Input, Label, Tag } from "@/components/ui";
import type { InterrogatorioResposta } from "@/app/api/ai/interrogatorio/route";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const FASE_LABEL: Record<InterrogatorioResposta["fase"], string> = {
  exploracao: "Exploração",
  aprofundamento: "Aprofundamento",
  sintese: "Síntese",
  conclusao: "Conclusão",
};

const FASE_COLOR: Record<InterrogatorioResposta["fase"], string> = {
  exploracao: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  aprofundamento: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  sintese: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  conclusao: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

export function InterrogatorioView() {
  const [acaoUsuario, setAcaoUsuario] = useState("");
  const [tema, setTema] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progresso, setProgresso] = useState(0);
  const [fase, setFase] = useState<InterrogatorioResposta["fase"]>("exploracao");
  const [lacunas, setLacunas] = useState<string[]>([]);
  const [lacunasOpen, setLacunasOpen] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function startSession() {
    if (!acaoUsuario.trim()) return;
    setStarted(true);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/interrogatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historico: [], tema: tema || acaoUsuario, acaoUsuario }),
      });
      const data = (await res.json()) as InterrogatorioResposta & { error?: string };
      if (data.error) { setError(data.error); setStarted(false); return; }
      setMessages([{ role: "assistant", content: data.pergunta }]);
      setProgresso(data.progresso);
      setFase(data.fase);
      setLacunas(data.lacunasDetectadas);
      if (data.pronto) {
        setPronto(true);
        setBriefing(data.briefingSenior ?? null);
      }
    } catch {
      setError("Erro ao conectar com a API.");
      setStarted(false);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading || pronto) return;
    const userMsg: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/interrogatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historico: newMessages, tema: tema || acaoUsuario, acaoUsuario }),
      });
      const data = (await res.json()) as InterrogatorioResposta & { error?: string };
      if (data.error) { setError(data.error); return; }
      setMessages((prev) => [...prev, { role: "assistant", content: data.pergunta }]);
      setProgresso(data.progresso);
      setFase(data.fase);
      setLacunas(data.lacunasDetectadas);
      if (data.pronto) {
        setPronto(true);
        setBriefing(data.briefingSenior ?? null);
      }
    } catch {
      setError("Erro ao conectar com a API.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function reset() {
    setStarted(false);
    setMessages([]);
    setInput("");
    setProgresso(0);
    setFase("exploracao");
    setLacunas([]);
    setLacunasOpen(false);
    setPronto(false);
    setBriefing(null);
    setError("");
    setAcaoUsuario("");
    setTema("");
  }

  // Landing screen
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <Brain className="w-8 h-8 text-amber-500" />
            Interrogatório Socrático
          </h1>
          <p className="text-muted">
            A IA não vai te ajudar a implementar — vai te interrogar até você demonstrar entendimento real.
            Só então revela o briefing sênior.
          </p>
        </header>

        <Card className="space-y-5">
          <div>
            <Label>O que você vai construir ou aprender?</Label>
            <Input
              value={acaoUsuario}
              onChange={(e) => setAcaoUsuario(e.target.value)}
              placeholder="Ex: Sistema de autenticação com JWT e refresh tokens"
              onKeyDown={(e) => e.key === "Enter" && startSession()}
              autoFocus
            />
          </div>
          <div>
            <Label>Tema / contexto técnico (opcional)</Label>
            <Input
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex: NestJS, PostgreSQL, multi-tenant SaaS"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            onClick={startSession}
            disabled={loading || !acaoUsuario.trim()}
            className="w-full justify-center"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" /> Começar interrogatório
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
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Brain className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="font-medium text-sm truncate">{acaoUsuario}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={clsx("inline-block px-2 py-0.5 rounded text-[11px] font-medium", FASE_COLOR[fase])}>
            {FASE_LABEL[fase]}
          </span>
          <Button variant="ghost" onClick={reset} className="px-2 py-1.5 text-xs gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Nova sessão
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="shrink-0 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Demonstrou compreensão</span>
          <span className="font-medium text-fg">{progresso}%</span>
        </div>
        <div className="h-2 rounded-full bg-card border border-line overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-700",
              progresso >= 80 ? "bg-emerald-500" : progresso >= 50 ? "bg-amber-500" : "bg-zinc-500",
            )}
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Lacunas detectadas */}
      {lacunas.length > 0 && (
        <div className="shrink-0 border border-line rounded-xl overflow-hidden">
          <button
            onClick={() => setLacunasOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm bg-card hover:bg-card-hover transition"
          >
            <span className="font-medium">
              Lacunas detectadas
              <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px]">
                {lacunas.length}
              </span>
            </span>
            {lacunasOpen ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
          </button>
          {lacunasOpen && (
            <ul className="px-4 pb-3 pt-1 space-y-1.5 bg-card">
              {lacunas.map((l, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  {l}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={clsx("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
          >
            <div
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium",
                msg.role === "assistant"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "bg-zinc-700 text-zinc-200",
              )}
            >
              {msg.role === "assistant" ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
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
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="bg-card border border-line rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* Pronto — briefing sênior */}
        {pronto && briefing && (
          <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-amber-700 dark:text-amber-300">
                Parabéns — você demonstrou entendimento suficiente!
              </span>
            </div>
            <p className="text-sm text-muted">Aqui está o briefing sênior que você mereceu:</p>
            <div className="bg-card rounded-xl border border-amber-500/30 p-4 text-sm leading-relaxed whitespace-pre-wrap text-fg">
              {briefing}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <p className="shrink-0 text-sm text-red-500">{error}</p>}

      {/* Input area */}
      {!pronto && (
        <div className="shrink-0 flex items-center gap-2 border border-line rounded-xl bg-card px-3 py-2 focus-within:border-amber-500 transition">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sua resposta..."
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition text-zinc-950"
          >
            <Send className="w-4 h-4" />
          </button>
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
