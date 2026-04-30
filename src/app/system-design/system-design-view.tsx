"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { clsx } from "clsx";
import {
  Server, Clock, ChevronLeft, CheckCircle2, XCircle,
  AlertTriangle, Save, RotateCcw, History, Zap, ChevronDown,
  ChevronUp, PenLine,
} from "lucide-react";
import { Button, Card, Label, Tag, Textarea } from "@/components/ui";
import { createSystemDesign, listSystemDesigns } from "@/lib/db";
import type { SystemDesignFeedback } from "@/app/api/ai/system-design/route";
import type { SystemDesignSession } from "@/lib/types";

interface Desafio {
  id: string;
  titulo: string;
  enunciado: string;
}

const DESAFIOS: Desafio[] = [
  { id: "1", titulo: "Sistema de Notificações", enunciado: "Projete um sistema de notificações para um ERP B2B com 50k empresas. Suporte a: email, in-app, webhook. SLA: 99.9% entregabilidade. Latência: email<5min, in-app<1s. Picos de 100k notificações/hora." },
  { id: "2", titulo: "Rate Limiter Distribuído", enunciado: "Projete um rate limiter distribuído para uma API pública com 1M RPD. Suporte a: por usuário, por IP, por endpoint. Janela deslizante. Tolerante a falhas de um dos nós." },
  { id: "3", titulo: "Sistema de Upload de Arquivos", enunciado: "Projete o sistema de upload e processamento de arquivos para um ERP. Tipos: XML NF-e, PDF boleto, XLSX relatório. Tamanho: até 100MB. Processamento assíncrono. Multi-tenant." },
  { id: "4", titulo: "Cache em Multi-tenant SaaS", enunciado: "Projete a estratégia de cache para um SaaS multi-tenant com 10k tenants. Isolamento de dados crítico. Mix de dados compartilhados (catálogos) e por-tenant (transações). Invalidação consistente." },
  { id: "5", titulo: "Job Scheduler", enunciado: "Projete um scheduler de jobs para processar 500k tarefas/dia (relatórios, integrações, cobranças). Retry automático, dead letter queue, observabilidade, prioridades." },
  { id: "6", titulo: "Autenticação Multi-tenant", enunciado: "Projete o sistema de autenticação para um SaaS multi-tenant. SSO com SAML/OIDC, MFA, session management, refresh tokens. Isolamento entre tenants. LGPD compliance." },
  { id: "7", titulo: "Busca Full-text em ERP", enunciado: "Projete busca global em um ERP com 20 entidades (produtos, clientes, pedidos, NFs...). 50M registros total. Busca em tempo real (<200ms). Filtros por tenant, data, tipo." },
  { id: "8", titulo: "Auditoria e Compliance", enunciado: "Projete o sistema de auditoria para um ERP financeiro. Rastreabilidade de todas as mutações de dados. Imutabilidade garantida. Relatórios regulatórios. LGPD. 10M eventos/dia." },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function DimensaoBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 10) * 100;
  const color = value >= 7 ? "bg-emerald-500" : value >= 5 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-medium tabular-nums">{value}/10</span>
      </div>
      <div className="h-1.5 rounded-full bg-card-hover overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

type Screen = "challenges" | "workspace" | "feedback" | "history";
type Tab = "praticar" | "historico";

export function SystemDesignView() {
  const [tab, setTab] = useState<Tab>("praticar");
  const [screen, setScreen] = useState<Screen>("challenges");
  const [selectedDesafio, setSelectedDesafio] = useState<Desafio | null>(null);
  const [customEnunciado, setCustomEnunciado] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [resposta, setResposta] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<SystemDesignFeedback | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<SystemDesignSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  function startDesafio(d: Desafio) {
    setSelectedDesafio(d);
    setResposta("");
    setElapsed(0);
    setFeedback(null);
    setSaved(false);
    setError("");
    setScreen("workspace");
    stopTimer();
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  }

  function startCustom() {
    if (!customEnunciado.trim()) return;
    const custom: Desafio = { id: "custom", titulo: "Desafio próprio", enunciado: customEnunciado };
    startDesafio(custom);
  }

  async function submitDesign() {
    if (!resposta.trim() || !selectedDesafio) return;
    stopTimer();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/system-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: selectedDesafio.titulo,
          enunciado: selectedDesafio.enunciado,
          resposta,
        }),
      });
      const data = (await res.json()) as SystemDesignFeedback & { error?: string };
      if (data.error) { setError(data.error); return; }
      setFeedback(data);
      setScreen("feedback");
    } catch {
      setError("Erro ao conectar com a API.");
    } finally {
      setLoading(false);
    }
  }

  async function saveSession() {
    if (!feedback || !selectedDesafio || saved) return;
    setSaving(true);
    try {
      await createSystemDesign({
        titulo: selectedDesafio.titulo,
        enunciado: selectedDesafio.enunciado,
        resposta,
        feedbackIA: JSON.stringify(feedback),
        scoreGeral: feedback.scoreGeral,
        pontosFracos: feedback.pontosFracos,
        status: "avaliado",
      });
      setSaved(true);
    } catch {
      setError("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const list = await listSystemDesigns();
      setHistory(list);
    } catch {
      setError("Erro ao carregar histórico.");
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "historico") loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <Server className="w-8 h-8 text-amber-500" />
          System Design
        </h1>
        <p className="text-muted max-w-xl">
          Pratique design de sistemas reais. Escreva seu design e receba avaliação de um Staff Engineer.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line">
        {(["praticar", "historico"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === "praticar") setScreen("challenges"); }}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition capitalize",
              tab === t
                ? "border-amber-500 text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            {t === "praticar" ? "Praticar" : "Histórico"}
          </button>
        ))}
      </div>

      {tab === "historico" && (
        <div className="space-y-4">
          {historyLoading ? (
            <div className="flex items-center gap-2 text-muted text-sm">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Carregando...
            </div>
          ) : history.length === 0 ? (
            <p className="text-muted text-sm">Nenhuma sessão salva ainda.</p>
          ) : (
            history.map((s) => (
              <Card key={s.id} className="space-y-3">
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedHistory(expandedHistory === s.id ? null : s.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{s.titulo}</p>
                      <p className="text-xs text-muted">{new Date(s.criadoEm).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {s.scoreGeral != null && (
                        <span className={clsx("text-2xl font-bold tabular-nums", scoreColor(s.scoreGeral))}>
                          {s.scoreGeral}
                        </span>
                      )}
                      <Tag color={s.status === "avaliado" ? "emerald" : "zinc"}>
                        {s.status === "avaliado" ? "Avaliado" : "Rascunho"}
                      </Tag>
                      {expandedHistory === s.id
                        ? <ChevronUp className="w-4 h-4 text-muted" />
                        : <ChevronDown className="w-4 h-4 text-muted" />}
                    </div>
                  </div>
                </button>
                {expandedHistory === s.id && (
                  <div className="space-y-3 pt-2 border-t border-line">
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide mb-1">Enunciado</p>
                      <p className="text-sm text-fg">{s.enunciado}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide mb-1">Sua resposta</p>
                      <p className="text-sm text-fg whitespace-pre-wrap">{s.resposta}</p>
                    </div>
                    {s.pontosFracos && s.pontosFracos.length > 0 && (
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide mb-1">Pontos fracos</p>
                        <ul className="space-y-1">
                          {s.pontosFracos.map((p, i) => (
                            <li key={i} className="text-sm text-fg flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "praticar" && screen === "challenges" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DESAFIOS.map((d) => (
              <button
                key={d.id}
                onClick={() => startDesafio(d)}
                className="text-left rounded-xl border border-line bg-card p-5 hover:border-amber-500/50 hover:bg-amber-500/5 transition space-y-2 group"
              >
                <p className="font-semibold text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  {d.titulo}
                </p>
                <p className="text-xs text-muted line-clamp-3">{d.enunciado}</p>
              </button>
            ))}

            {/* Custom challenge */}
            <div className="rounded-xl border border-dashed border-line bg-card p-5 space-y-3">
              <button
                onClick={() => setShowCustom((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-muted hover:text-fg transition"
              >
                <PenLine className="w-4 h-4" />
                Escrever desafio próprio
              </button>
              {showCustom && (
                <div className="space-y-2">
                  <Textarea
                    rows={4}
                    value={customEnunciado}
                    onChange={(e) => setCustomEnunciado(e.target.value)}
                    placeholder="Descreva o sistema a ser projetado, requisitos, escala esperada..."
                  />
                  <Button
                    onClick={startCustom}
                    disabled={!customEnunciado.trim()}
                    className="w-full justify-center"
                  >
                    Iniciar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "praticar" && screen === "workspace" && selectedDesafio && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { stopTimer(); setScreen("challenges"); }}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-fg transition"
            >
              <ChevronLeft className="w-4 h-4" /> Desafios
            </button>
            <div className={clsx(
              "flex items-center gap-2 font-mono text-sm font-medium px-3 py-1.5 rounded-lg border",
              elapsed > 1800
                ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                : elapsed > 900
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-line bg-card text-fg",
            )}>
              <Clock className="w-4 h-4" />
              {formatTime(elapsed)}
            </div>
          </div>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">{selectedDesafio.titulo}</h2>
            <p className="text-sm leading-relaxed text-fg">{selectedDesafio.enunciado}</p>
          </Card>

          <div className="rounded-lg border border-line bg-amber-500/5 px-4 py-3">
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              Inclua: componentes principais, fluxo de dados, tecnologias escolhidas, como lida com falhas, estimativa de escala
            </p>
          </div>

          <div>
            <Label>Seu design</Label>
            <Textarea
              rows={20}
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              placeholder="Comece descrevendo os componentes principais e como eles interagem..."
              className="min-h-[400px]"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            onClick={submitDesign}
            disabled={loading || !resposta.trim()}
            className="w-full justify-center"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Avaliando design...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Enviar para avaliação
              </>
            )}
          </Button>
        </div>
      )}

      {tab === "praticar" && screen === "feedback" && feedback && selectedDesafio && (
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-amber-500" />
              <span className="font-semibold">{selectedDesafio.titulo}</span>
            </div>
          </div>

          {/* Score geral */}
          <Card className="flex items-center gap-6">
            <div className="text-center shrink-0">
              <span className={clsx("text-6xl font-bold tabular-nums", scoreColor(feedback.scoreGeral))}>
                {feedback.scoreGeral}
              </span>
              <p className="text-xs text-muted mt-1">/ 100</p>
            </div>
            <div>
              <p className="font-semibold text-lg">
                {feedback.scoreGeral >= 75 ? "Design sólido" : feedback.scoreGeral >= 50 ? "Design razoável" : "Precisa de mais desenvolvimento"}
              </p>
              <p className="text-sm text-muted mt-1">Avaliado como Staff Engineer</p>
            </div>
          </Card>

          {/* Dimensões */}
          <Card className="space-y-4">
            <p className="text-sm font-semibold text-muted uppercase tracking-wide">Dimensões</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DimensaoBar label="Escalabilidade" value={feedback.dimensoes.escalabilidade} />
              <DimensaoBar label="Confiabilidade" value={feedback.dimensoes.confiabilidade} />
              <DimensaoBar label="Performance" value={feedback.dimensoes.performance} />
              <DimensaoBar label="Segurança" value={feedback.dimensoes.seguranca} />
              <DimensaoBar label="Manutenibilidade" value={feedback.dimensoes.manutenibilidade} />
              <DimensaoBar label="Custo" value={feedback.dimensoes.custo} />
            </div>
          </Card>

          {/* Pontos fortes */}
          {feedback.pontosFortesDesign.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Pontos fortes
              </p>
              <ul className="space-y-1.5">
                {feedback.pontosFortesDesign.map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pontos fracos */}
          {feedback.pontosFracos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" /> Pontos fracos
              </p>
              <ul className="space-y-1.5">
                {feedback.pontosFracos.map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Componentes faltando */}
          {feedback.componentesFaltando.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="w-4 h-4" /> Componentes faltando
              </p>
              <ul className="space-y-1.5">
                {feedback.componentesFaltando.map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Over-engineered */}
          {feedback.oversized.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2 text-violet-600 dark:text-violet-400">
                <Zap className="w-4 h-4" /> Over-engineered
              </p>
              <ul className="space-y-1.5">
                {feedback.oversized.map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternativas */}
          {feedback.alternativasNaoConsideradas.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2 text-sky-600 dark:text-sky-400">
                Alternativas não consideradas
              </p>
              <ul className="space-y-1.5">
                {feedback.alternativasNaoConsideradas.map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recomendação final */}
          <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4 space-y-1.5">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Recomendação final</p>
            <p className="text-sm leading-relaxed">{feedback.recomendacaoFinal}</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={saveSession}
              disabled={saving || saved}
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Save className="w-4 h-4" />}
              {saved ? "Salvo!" : "Salvar"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setScreen("challenges")}
            >
              <RotateCcw className="w-4 h-4" /> Novo desafio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
