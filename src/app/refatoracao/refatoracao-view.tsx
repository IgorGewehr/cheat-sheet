"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { Send, RotateCcw, Code2, Brain, User, Sparkles, Lightbulb } from "lucide-react";
import { Button, Card, Label, Textarea } from "@/components/ui";
import type { RefatoracaoResposta } from "@/app/api/ai/refatoracao/route";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ETAPA_LABEL: Record<RefatoracaoResposta["etapa"], string> = {
  diagnostico: "Diagnóstico",
  planejamento: "Planejamento",
  implementacao: "Implementação",
  validacao: "Validação",
};

const ETAPA_COLOR: Record<RefatoracaoResposta["etapa"], string> = {
  diagnostico: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  planejamento: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  implementacao: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  validacao: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

export function RefatoracaoView() {
  const [codigo, setCodigo] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progresso, setProgresso] = useState(0);
  const [etapa, setEtapa] = useState<RefatoracaoResposta["etapa"]>("diagnostico");
  const [hints, setHints] = useState<string[]>([]);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [resumoFinal, setResumoFinal] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function startSession() {
    if (!codigo.trim()) return;
    setStarted(true);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/refatoracao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, historico: [], etapa: "diagnostico" }),
      });
      const data = (await res.json()) as RefatoracaoResposta & { error?: string };
      if (data.error) { setError(data.error); setStarted(false); return; }
      setMessages([{ role: "assistant", content: data.mensagem }]);
      setProgresso(data.progresso);
      setEtapa(data.etapa);
      setHints(data.hints ?? []);
      if (data.concluido) {
        setConcluido(true);
        setResumoFinal(data.resumoFinal ?? null);
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
    if (!trimmed || loading || concluido) return;
    const userMsg: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/refatoracao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, historico: newMessages, etapa }),
      });
      const data = (await res.json()) as RefatoracaoResposta & { error?: string };
      if (data.error) { setError(data.error); return; }
      setMessages((prev) => [...prev, { role: "assistant", content: data.mensagem }]);
      setProgresso(data.progresso);
      setEtapa(data.etapa);
      setHints(data.hints ?? []);
      if (data.concluido) {
        setConcluido(true);
        setResumoFinal(data.resumoFinal ?? null);
      }
    } catch {
      setError("Erro ao conectar com a API.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function reset() {
    setStarted(false);
    setCodigo("");
    setMessages([]);
    setInput("");
    setProgresso(0);
    setEtapa("diagnostico");
    setHints([]);
    setHintsOpen(false);
    setConcluido(false);
    setResumoFinal(null);
    setError("");
  }

  // Landing screen
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <Code2 className="w-8 h-8 text-amber-500" />
            Refatoração Guiada
          </h1>
          <p className="text-muted">
            Cole seu código e o tutor socrático vai te guiar através de perguntas.
            Você descobre os problemas e propõe as soluções — o tutor nunca entrega o código pronto.
          </p>
        </header>

        <Card className="space-y-5">
          <div>
            <Label>Cole o código que você quer refatorar</Label>
            <Textarea
              rows={12}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="// Cole aqui o código que precisa de refatoração..."
              className="font-mono text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            onClick={startSession}
            disabled={loading || !codigo.trim()}
            className="w-full justify-center"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Iniciando sessão...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" /> Iniciar sessão de refatoração
              </>
            )}
          </Button>
        </Card>
      </div>
    );
  }

  // Split view
  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="font-medium text-sm">Sessão de Refatoração</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={clsx("inline-block px-2 py-0.5 rounded text-[11px] font-medium", ETAPA_COLOR[etapa])}>
            Fase: {ETAPA_LABEL[etapa]}
          </span>
          <Button variant="ghost" onClick={reset} className="px-2 py-1.5 text-xs gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Nova sessão
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="shrink-0 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{progresso}% completo — Fase: {ETAPA_LABEL[etapa]}</span>
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

      {/* Hints */}
      {hints.length > 0 && (
        <div className="shrink-0 border border-line rounded-xl overflow-hidden">
          <button
            onClick={() => setHintsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm bg-card hover:bg-card-hover transition"
          >
            <span className="font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Dicas disponíveis
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px]">
                {hints.length}
              </span>
            </span>
            <span className="text-muted text-xs">{hintsOpen ? "fechar" : "ver dicas"}</span>
          </button>
          {hintsOpen && (
            <ul className="px-4 pb-3 pt-1 space-y-1.5 bg-card">
              {hints.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Main split area */}
      <div className="flex-1 flex gap-4 min-h-0 flex-col lg:flex-row">
        {/* Left: code display */}
        <div className="lg:w-1/2 flex flex-col min-h-0">
          <p className="text-xs font-medium text-muted mb-2 shrink-0">Código em análise</p>
          <div className="flex-1 bg-zinc-900 dark:bg-zinc-950 text-emerald-400 font-mono text-sm p-4 rounded-xl overflow-auto border border-zinc-700">
            <pre className="whitespace-pre-wrap break-words">{codigo}</pre>
          </div>
        </div>

        {/* Right: chat */}
        <div className="lg:w-1/2 flex flex-col min-h-0 gap-3">
          <p className="text-xs font-medium text-muted shrink-0">Tutor socrático</p>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={clsx("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                <div
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === "assistant"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-zinc-700 text-zinc-200",
                  )}
                >
                  {msg.role === "assistant" ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div
                  className={clsx(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
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

            {/* Conclusao */}
            {concluido && resumoFinal && (
              <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                    Parabéns — refatoração concluída!
                  </span>
                </div>
                <p className="text-sm text-muted">O que você aprendeu nesta sessão:</p>
                <div className="bg-card rounded-xl border border-amber-500/30 p-4 text-sm leading-relaxed text-fg whitespace-pre-wrap">
                  {resumoFinal}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && <p className="shrink-0 text-sm text-red-500">{error}</p>}

          {/* Input */}
          {!concluido && (
            <div className="shrink-0 flex gap-2 border border-line rounded-xl bg-card px-3 py-2 focus-within:border-amber-500 transition">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Sua resposta... (Enter para enviar, Shift+Enter para nova linha)"
                disabled={loading}
                rows={2}
                className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted disabled:opacity-50 resize-none"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition text-zinc-950 self-end"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          {concluido && (
            <div className="shrink-0 flex justify-center">
              <Button onClick={reset} variant="secondary">
                <RotateCcw className="w-4 h-4" /> Nova sessão
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
