"use client";

// /debate — consolidates Interrogatório + Mentoria + Revisor into one route.
// Persona is persisted in localStorage under key brain.debate.persona.
// Each mode reuses the existing API routes and DB collections — nothing new is invented.

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  Brain, GraduationCap, Eye, RotateCcw, Send,
  ChevronDown, ChevronUp, Search, ChevronRight,
  CheckCircle2, XCircle, Star, Lightbulb,
  Sparkles, User, Code2, History, AlertCircle,
  MessageSquare, Save, GitFork, X, Zap,
} from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import {
  createRevisorSession,
  deleteRevisorSession,
  listRevisoesCodigo,
} from "@/lib/db";
import type { RevisorSession } from "@/lib/types";
import type { InterrogatorioResposta } from "@/app/api/ai/interrogatorio/route";
import type { MentoriaResposta } from "@/app/api/ai/mentoria/route";
import type { RevisorResult } from "@/app/api/ai/revisor/route";
import type { CardCategory } from "@/lib/types";
import { getActiveProject, setActiveProject, type ActiveProjectContext } from "@/lib/active-project";
import type { QuickCapturePayload } from "@/components/quick-capture";

// ─── Types ────────────────────────────────────────────────────

type Persona = "inquisidor" | "aprendiz" | "revisor";

const PERSONA_KEY = "brain.debate.persona";

interface ConceitoItem {
  slug: string;
  title: string;
  category: CardCategory;
}

interface DebateViewProps {
  conceitos: ConceitoItem[];
}

// ─── Persona selector (segmented control) ────────────────────

interface PersonaControlProps {
  value: Persona;
  onChange: (p: Persona) => void;
}

const PERSONA_META: Record<Persona, { label: string; icon: React.ReactNode; desc: string }> = {
  inquisidor: {
    label: "Inquisidor",
    icon: <Brain className="w-4 h-4" />,
    desc: "IA pergunta até você demonstrar entendimento",
  },
  aprendiz: {
    label: "Aprendiz",
    icon: <GraduationCap className="w-4 h-4" />,
    desc: "Você explica; IA faz perguntas crescentes",
  },
  revisor: {
    label: "Revisor de Código",
    icon: <Eye className="w-4 h-4" />,
    desc: "Você analisa o código; IA compara",
  },
};

function PersonaControl({ value, onChange }: PersonaControlProps) {
  return (
    <div className="flex gap-1 p-1 bg-card border border-line rounded-xl overflow-x-auto">
      {(Object.keys(PERSONA_META) as Persona[]).map((p) => {
        const meta = PERSONA_META[p];
        const active = value === p;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex-1 justify-center",
              active
                ? "bg-amber-500 text-zinc-950 shadow-sm"
                : "text-muted hover:text-fg hover:bg-card-hover",
            )}
          >
            {meta.icon}
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Inquisidor (Interrogatório Socrático) ────────────────────

interface InquisitorMessage {
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

function InquisidorMode() {
  const [acaoUsuario, setAcaoUsuario] = useState("");
  const [tema, setTema] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<InquisitorMessage[]>([]);
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
      if (data.pronto) { setPronto(true); setBriefing(data.briefingSenior ?? null); }
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
    const userMsg: InquisitorMessage = { role: "user", content: trimmed };
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
      if (data.pronto) { setPronto(true); setBriefing(data.briefingSenior ?? null); }
    } catch {
      setError("Erro ao conectar com a API.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
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

  function markDivida() {
    const ev = new CustomEvent<QuickCapturePayload>("brain:quick-capture-open", {
      detail: { tab: "divida", desc: acaoUsuario },
    });
    window.dispatchEvent(ev);
  }

  if (!started) {
    return (
      <div className="space-y-6">
        <p className="text-muted text-sm">
          A IA não vai te ajudar a implementar — vai te interrogar até você demonstrar entendimento real.
        </p>
        <Card className="space-y-4">
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
          <Button onClick={startSession} disabled={loading || !acaoUsuario.trim()} className="w-full justify-center">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Iniciando...</>
            ) : (
              <><Brain className="w-4 h-4" /> Começar interrogatório</>
            )}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-14rem)]">
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Brain className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="font-medium text-sm truncate">{acaoUsuario}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={clsx("inline-block px-2 py-0.5 rounded text-[11px] font-medium", FASE_COLOR[fase])}>
            {FASE_LABEL[fase]}
          </span>
          <Button variant="ghost" onClick={markDivida} className="px-2 py-1.5 text-xs gap-1.5" title="Marcar como dívida">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Dívida
          </Button>
          <Button variant="ghost" onClick={reset} className="px-2 py-1.5 text-xs gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Nova sessão
          </Button>
        </div>
      </div>

      <div className="shrink-0 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Demonstrou compreensão</span>
          <span className="font-medium text-fg">{progresso}%</span>
        </div>
        <div className="h-2 rounded-full bg-card border border-line overflow-hidden">
          <div
            className={clsx("h-full rounded-full transition-all duration-700", progresso >= 80 ? "bg-emerald-500" : progresso >= 50 ? "bg-amber-500" : "bg-zinc-500")}
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {lacunas.length > 0 && (
        <div className="shrink-0 border border-line rounded-xl overflow-hidden">
          <button
            onClick={() => setLacunasOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm bg-card hover:bg-card-hover transition"
          >
            <span className="font-medium">
              Lacunas detectadas
              <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px]">{lacunas.length}</span>
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

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={clsx("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium", msg.role === "assistant" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-zinc-700 text-zinc-200")}>
              {msg.role === "assistant" ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={clsx("max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed", msg.role === "assistant" ? "bg-card border border-line rounded-tl-sm" : "bg-amber-500/10 border border-amber-500/20 rounded-tr-sm text-fg")}>
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

        {pronto && briefing && (
          <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-amber-700 dark:text-amber-300">Parabéns — você demonstrou entendimento suficiente!</span>
            </div>
            <p className="text-sm text-muted">Aqui está o briefing sênior que você mereceu:</p>
            <div className="bg-card rounded-xl border border-amber-500/30 p-4 text-sm leading-relaxed whitespace-pre-wrap text-fg">{briefing}</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="shrink-0 text-sm text-red-500">{error}</p>}

      {!pronto && (
        <div className="shrink-0 flex items-center gap-2 border border-line rounded-xl bg-card px-3 py-2 focus-within:border-amber-500 transition">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
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
          <Button onClick={reset} variant="secondary"><RotateCcw className="w-4 h-4" /> Nova sessão</Button>
        </div>
      )}
    </div>
  );
}

// ─── Aprendiz (Mentoria Invertida) ───────────────────────────

interface MentoriaMsg {
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

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function StarLevel({ nivel }: { nivel: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={clsx("w-3.5 h-3.5", i < nivel ? "fill-amber-500 text-amber-500" : "text-line-strong")} />
      ))}
    </div>
  );
}

function AprendizMode({ conceitos }: { conceitos: ConceitoItem[] }) {
  const [conceito, setConceito] = useState("");
  const [search, setSearch] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<MentoriaMsg[]>([]);
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

  const filtered = conceitos.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

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
    const userMsg: MentoriaMsg = { role: "user", content: trimmed };
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
        body: JSON.stringify({ historico: newMessages.map((m) => ({ role: m.role, content: m.content })), conceito, nivelPergunta: novoNivel }),
      });
      const data = (await res.json()) as MentoriaResposta & { error?: string };
      if (data.error) { setError(data.error); return; }
      setMessages((prev) => [...prev, { role: "assistant", content: data.pergunta, avaliacao: data.avaliacaoResposta, lacuna: data.lacunaNaResposta }]);
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

  if (!started) {
    return (
      <div className="space-y-6">
        <p className="text-muted text-sm">
          Você é o mentor. A IA é o junior fazendo perguntas cada vez mais difíceis.
        </p>
        <Card className="space-y-4">
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
                  <button key={c.slug} onClick={() => { setConceito(c.title); setSearch(""); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-card-hover flex items-center justify-between gap-3 transition">
                    <span className="truncate">{c.title}</span>
                    <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                  </button>
                ))}
                {filtered.length === 0 && <p className="px-4 py-3 text-sm text-muted">Nenhum resultado.</p>}
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={startSession} disabled={loading || !conceito.trim()} className="w-full justify-center">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Preparando junior...</>
            ) : (
              <><GraduationCap className="w-4 h-4" /> Iniciar sessão de mentoria</>
            )}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-14rem)]">
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

      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className="space-y-2">
            <div className={clsx("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold", msg.role === "assistant" ? "bg-sky-500/15 text-sky-700 dark:text-sky-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300")}>
                {msg.role === "assistant" ? "JR" : "ME"}
              </div>
              <div className={clsx("max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed", msg.role === "assistant" ? "bg-card border border-line rounded-tl-sm" : "bg-amber-500/10 border border-amber-500/20 rounded-tr-sm text-fg")}>
                {msg.content}
              </div>
            </div>
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
            <div className="w-8 h-8 rounded-full bg-sky-500/15 flex items-center justify-center shrink-0 text-xs font-bold text-sky-700 dark:text-sky-300">JR</div>
            <div className="bg-card border border-line rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {pronto && avaliacaoFinal && (
          <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-amber-700 dark:text-amber-300">Sessão concluída — avaliação da sua mentoria</span>
              </div>
              <span className={clsx("text-4xl font-bold tabular-nums", scoreColor(avaliacaoFinal.score))}>{avaliacaoFinal.score}</span>
            </div>
            {avaliacaoFinal.pontosFortesExplicacao.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Pontos fortes</p>
                <ul className="space-y-1">
                  {avaliacaoFinal.pontosFortesExplicacao.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-fg"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {avaliacaoFinal.lacunasNaExplicacao.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Lacunas</p>
                <ul className="space-y-1">
                  {avaliacaoFinal.lacunasNaExplicacao.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-fg"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />{l}</li>
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
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendResposta(); } }}
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
          <Button onClick={reset} variant="secondary"><RotateCcw className="w-4 h-4" /> Nova sessão</Button>
        </div>
      )}
    </div>
  );
}

// ─── Revisor de Código ────────────────────────────────────────

type RevisorTab = "nova" | "historico" | "padroes";

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    : score >= 50
    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
    : "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30";
  return (
    <span className={clsx("inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold border", color)}>
      {score}/100
    </span>
  );
}

function RevisorMode() {
  const [tab, setTab] = useState<RevisorTab>("nova");
  const [titulo, setTitulo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [revisaoUsuario, setRevisaoUsuario] = useState("");
  const [cardSlug, setCardSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RevisorResult | null>(null);
  const [revisaoExpanded, setRevisaoExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeProject, setActiveProjectState] = useState<ActiveProjectContext | null>(null);
  const [historico, setHistorico] = useState<RevisorSession[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  useEffect(() => { setActiveProjectState(getActiveProject()); }, []);

  useEffect(() => {
    if (tab === "historico" || tab === "padroes") {
      setLoadingHistorico(true);
      listRevisoesCodigo().then(setHistorico).catch(() => {}).finally(() => setLoadingHistorico(false));
    }
  }, [tab]);

  async function submeter() {
    if (!titulo.trim() || !codigo.trim() || !revisaoUsuario.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);
    try {
      const res = await fetch("/api/ai/revisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: titulo.trim(), codigo: codigo.trim(), revisaoUsuario: revisaoUsuario.trim(), cardSlug: cardSlug.trim() || undefined, projectNome: activeProject?.nome, projectStack: activeProject?.stack }),
      });
      const data = (await res.json()) as RevisorResult & { error?: string };
      if (data.error) { setError(data.error); return; }
      setResult(data);
    } catch {
      setError("Erro ao conectar com a API. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function salvar() {
    if (!result) return;
    setSaving(true);
    try {
      await createRevisorSession({
        titulo: titulo.trim(), codigo: codigo.trim(), revisaoUsuario: revisaoUsuario.trim(),
        cardSlug: cardSlug.trim() || undefined, revisaoIA: result.revisaoCompleta,
        lacunasUsuario: result.lacunas, acertosUsuario: result.acertos,
        scoreRevisao: result.scoreRevisao, status: "avaliado",
      });
      setSaved(true);
    } catch {
      setError("Erro ao salvar sessão.");
    } finally {
      setSaving(false);
    }
  }

  async function deletarSessao(id: string) {
    if (!confirm("Apagar esta revisão?")) return;
    await deleteRevisorSession(id);
    setHistorico((prev) => prev.filter((s) => s.id !== id));
  }

  function resetar() {
    setTitulo(""); setCodigo(""); setRevisaoUsuario(""); setCardSlug("");
    setResult(null); setError(""); setSaved(false); setRevisaoExpanded(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-line">
        {(["nova", "historico", "padroes"] as RevisorTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={clsx("px-4 py-2 text-sm font-medium transition border-b-2 -mb-px", tab === t ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-muted hover:text-fg")}>
            {t === "nova" && <span className="flex items-center gap-1.5"><Code2 className="w-4 h-4" /> Nova Revisão</span>}
            {t === "historico" && <span className="flex items-center gap-1.5"><History className="w-4 h-4" /> Histórico</span>}
            {t === "padroes" && <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Pontos Cegos</span>}
          </button>
        ))}
      </div>

      {tab === "nova" && (
        <div className="space-y-5">
          {activeProject && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <GitFork className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm text-fg flex-1">Contexto: <span className="font-semibold">{activeProject.nome}</span>{activeProject.stack.length > 0 && <span className="text-muted ml-1.5">— {activeProject.stack.join(", ")}</span>}</span>
              <button onClick={() => { setActiveProjectState(null); setActiveProject(null); }} className="text-muted hover:text-fg transition"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Eye className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Escreva sua análise ANTES de ver a revisão da IA.</strong> Este exercício desenvolve o julgamento crítico.
            </p>
          </div>
          {!result && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label htmlFor="d-titulo">Título da revisão</Label><Input id="d-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="ex: UserService.createUser()" /></div>
                <div><Label htmlFor="d-card-slug">Card de referência (opcional)</Label><Input id="d-card-slug" value={cardSlug} onChange={(e) => setCardSlug(e.target.value)} placeholder="ex: n-plus-1" /></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="d-codigo">Código para revisar</Label>
                  <Textarea id="d-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Cole o código aqui…" className="min-h-[300px] font-mono text-xs resize-y" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="d-revisao">Sua revisão</Label>
                  <Textarea id="d-revisao" value={revisaoUsuario} onChange={(e) => setRevisaoUsuario(e.target.value)} placeholder="Quais problemas você consegue identificar?" className="min-h-[300px] resize-y" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button onClick={submeter} disabled={loading || !titulo.trim() || !codigo.trim() || !revisaoUsuario.trim()} className="w-full sm:w-auto">
                {loading ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> Analisando…</> : <><Eye className="w-4 h-4" /> Submeter minha revisão</>}
              </Button>
            </div>
          )}
          {result && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">Resultado: {titulo}</h2>
                  <ScoreBadge score={result.scoreRevisao} />
                </div>
                <Button variant="secondary" onClick={resetar}>Nova revisão</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="w-4 h-4" /> Você acertou ({result.acertos.length})</h3>
                  {result.acertos.length === 0 ? <p className="text-sm text-muted">Nenhum item identificado corretamente.</p> : (
                    <ul className="space-y-2">{result.acertos.map((a, i) => <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>{a}</span></li>)}</ul>
                  )}
                </div>
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-red-700 dark:text-red-300"><XCircle className="w-4 h-4" /> Você perdeu ({result.lacunas.length})</h3>
                  {result.lacunas.length === 0 ? <p className="text-sm text-muted">Nenhum problema importante foi perdido.</p> : (
                    <ul className="space-y-2">{result.lacunas.map((l, i) => <li key={i} className="flex items-start gap-2 text-sm"><XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /><span>{l}</span></li>)}</ul>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-amber-700 dark:text-amber-300"><MessageSquare className="w-4 h-4" /> Feedback da IA</h3>
                <p className="text-sm leading-relaxed">{result.feedbackGeral}</p>
              </div>
              <div className="rounded-xl border border-line overflow-hidden">
                <button onClick={() => setRevisaoExpanded((v) => !v)} className="flex items-center justify-between w-full px-4 py-3 bg-card hover:bg-card-hover transition text-left">
                  <span className="font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-amber-500" /> Revisão completa da IA</span>
                  {revisaoExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                </button>
                {revisaoExpanded && (
                  <div className="px-5 py-4 border-t border-line prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownRenderer body={result.revisaoCompleta} />
                  </div>
                )}
              </div>
              {!saved ? (
                <Card>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-medium text-sm">Salvar revisão no histórico</p>
                      <p className="text-xs text-muted mt-0.5">Guarda código, sua análise, resultado e score.</p>
                    </div>
                    <Button onClick={salvar} disabled={saving}>
                      {saving ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> Salvando…</> : <><Save className="w-4 h-4" /> Salvar</>}
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Revisão salva no histórico.
                </div>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        </div>
      )}

      {tab === "historico" && (
        <div className="space-y-4">
          {loadingHistorico ? (
            <div className="flex items-center gap-2 text-muted py-8"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> Carregando histórico…</div>
          ) : historico.length === 0 ? (
            <Card className="text-center py-12 text-muted">
              <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhuma revisão salva ainda.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {historico.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-line hover:border-line-strong bg-card transition">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{s.titulo}</p>
                      {s.scoreRevisao !== undefined && <ScoreBadge score={s.scoreRevisao} />}
                      <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", s.status === "avaliado" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300")}>
                        {s.status === "avaliado" ? "Avaliado" : "Pendente"}
                      </span>
                    </div>
                    <p className="text-xs text-muted">{new Date(s.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}{s.cardSlug && ` · card: ${s.cardSlug}`}</p>
                  </div>
                  <button onClick={() => deletarSessao(s.id)} className="p-1.5 text-muted hover:text-red-500 transition shrink-0"><AlertCircle className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "padroes" && (
        <div className="space-y-4">
          {loadingHistorico ? (
            <div className="flex items-center gap-2 text-muted py-8"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> Analisando revisões…</div>
          ) : historico.length === 0 ? (
            <Card className="text-center py-12 text-muted">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhuma revisão avaliada ainda.</p>
            </Card>
          ) : (() => {
            const avaliadas = historico.filter((s) => s.lacunasUsuario?.length);
            if (avaliadas.length === 0) return <Card className="text-center py-12 text-muted"><p className="font-medium">Nenhuma lacuna registrada ainda.</p></Card>;
            const freq = new Map<string, number>();
            avaliadas.forEach((s) => s.lacunasUsuario!.forEach((l) => freq.set(l, (freq.get(l) ?? 0) + 1)));
            const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
            const totalLacunas = sorted.reduce((acc, [, c]) => acc + c, 0);
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span>{avaliadas.length} revisão{avaliadas.length > 1 ? "ões" : ""} analisada{avaliadas.length > 1 ? "s" : ""}</span>
                  <span className="w-1 h-1 rounded-full bg-muted/40" />
                  <span className="text-red-600 dark:text-red-400 font-medium">{totalLacunas} lacuna{totalLacunas > 1 ? "s" : ""} no total</span>
                </div>
                <div className="space-y-2">
                  {sorted.map(([lacuna, count], i) => (
                    <div key={i} className={clsx("flex items-start gap-3 p-3.5 rounded-xl border transition", count > 1 ? "border-red-500/30 bg-red-500/5" : "border-line bg-card")}>
                      <XCircle className={clsx("w-4 h-4 shrink-0 mt-0.5", count > 1 ? "text-red-500" : "text-muted")} />
                      <p className="text-sm flex-1 leading-relaxed">{lacuna}</p>
                      {count > 1 && <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400">{count}×</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Main DebateView ──────────────────────────────────────────

export function DebateView({ conceitos }: DebateViewProps) {
  const [persona, setPersona] = useState<Persona>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(PERSONA_KEY);
      if (saved === "inquisidor" || saved === "aprendiz" || saved === "revisor") return saved;
    }
    return "inquisidor";
  });

  function handlePersonaChange(p: Persona) {
    setPersona(p);
    try { localStorage.setItem(PERSONA_KEY, p); } catch { /* ignore */ }
  }

  const meta = PERSONA_META[persona];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          {persona === "inquisidor" && <Brain className="w-8 h-8 text-amber-500" />}
          {persona === "aprendiz" && <GraduationCap className="w-8 h-8 text-amber-500" />}
          {persona === "revisor" && <Eye className="w-8 h-8 text-amber-500" />}
          Modo Debate
        </h1>
        <p className="text-muted text-sm">{meta.desc}</p>
      </header>

      {/* Persona switch */}
      <PersonaControl value={persona} onChange={handlePersonaChange} />

      {/* Mode content */}
      {persona === "inquisidor" && <InquisidorMode />}
      {persona === "aprendiz" && <AprendizMode conceitos={conceitos} />}
      {persona === "revisor" && <RevisorMode />}
    </div>
  );
}
