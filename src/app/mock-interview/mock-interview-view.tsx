"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { clsx } from "clsx";
import {
  Mic, Clock, ChevronLeft, CheckCircle2, XCircle,
  AlertTriangle, Save, RotateCcw, ChevronDown, ChevronUp,
  User, MessageSquare,
} from "lucide-react";
import { Button, Card, Label, Select, Tag, Textarea } from "@/components/ui";
import { createMockInterview, listMockInterviews } from "@/lib/db";
import type { ProximaPergunta, AvaliacaoFinal } from "@/app/api/ai/mock-interview/route";
import type { MockInterviewSession, MockInterviewTipo } from "@/lib/types";

interface PerguntaComResposta {
  pergunta: string;
  tipo: ProximaPergunta["tipo"];
  dica?: string;
  resposta: string;
}

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

const RECOMENDACAO_CONFIG = {
  "forte-sim": { label: "Forte Sim", bg: "bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500/30" },
  "sim": { label: "Sim", bg: "bg-sky-500/15", text: "text-sky-700 dark:text-sky-300", border: "border-sky-500/30" },
  "talvez": { label: "Talvez", bg: "bg-amber-500/15", text: "text-amber-700 dark:text-amber-300", border: "border-amber-500/30" },
  "nao": { label: "Não", bg: "bg-red-500/15", text: "text-red-700 dark:text-red-300", border: "border-red-500/30" },
};

const TIPO_LABEL: Record<MockInterviewTipo, string> = {
  tecnica: "Técnica",
  comportamental: "Comportamental",
  misto: "Misto",
};

const NIVEL_LABEL = {
  pleno: "Pleno",
  senior: "Sênior",
  staff: "Staff",
};

type Tab = "nova" | "anteriores";
type Screen = "config" | "interview" | "evaluating" | "result";

export function MockInterviewView() {
  const [tab, setTab] = useState<Tab>("nova");
  const [screen, setScreen] = useState<Screen>("config");

  // Config
  const [tipo, setTipo] = useState<MockInterviewTipo>("misto");
  const [nivel, setNivel] = useState<"pleno" | "senior" | "staff">("senior");

  // Interview state
  const [perguntas, setPerguntas] = useState<PerguntaComResposta[]>([]);
  const [currentPergunta, setCurrentPergunta] = useState<ProximaPergunta | null>(null);
  const [currentResposta, setCurrentResposta] = useState("");
  const [showDica, setShowDica] = useState(false);
  const [expandedPrev, setExpandedPrev] = useState<number | null>(null);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Loading/error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Result
  const [avaliacao, setAvaliacao] = useState<AvaliacaoFinal | null>(null);
  const [expandedPerguntaFeedback, setExpandedPerguntaFeedback] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // History
  const [history, setHistory] = useState<MockInterviewSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  async function startInterview() {
    setLoading(true);
    setError("");
    setPerguntas([]);
    setElapsed(0);
    try {
      const res = await fetch("/api/ai/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "next-question", tipo, nivel, historico: [] }),
      });
      const data = (await res.json()) as ProximaPergunta & { error?: string };
      if (data.error) { setError(data.error); return; }
      setCurrentPergunta(data);
      setCurrentResposta("");
      setShowDica(false);
      setScreen("interview");
      stopTimer();
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } catch {
      setError("Erro ao conectar com a API.");
    } finally {
      setLoading(false);
    }
  }

  async function submitResposta() {
    if (!currentResposta.trim() || !currentPergunta) return;
    const newPergunta: PerguntaComResposta = {
      pergunta: currentPergunta.pergunta,
      tipo: currentPergunta.tipo,
      dica: currentPergunta.dica,
      resposta: currentResposta,
    };
    const newPerguntas = [...perguntas, newPergunta];
    setPerguntas(newPerguntas);
    setShowDica(false);

    if (currentPergunta.concluido) {
      stopTimer();
      setScreen("evaluating");
      await evaluate(newPerguntas);
      return;
    }

    setLoading(true);
    setError("");
    setCurrentResposta("");
    try {
      const res = await fetch("/api/ai/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "next-question",
          tipo,
          nivel,
          historico: newPerguntas.map((p) => ({ pergunta: p.pergunta, resposta: p.resposta })),
        }),
      });
      const data = (await res.json()) as ProximaPergunta & { error?: string };
      if (data.error) { setError(data.error); return; }
      setCurrentPergunta(data);
      setCurrentResposta("");

      if (data.concluido) {
        stopTimer();
        setScreen("evaluating");
        const finalPerguntas = [...newPerguntas];
        await evaluate(finalPerguntas);
      }
    } catch {
      setError("Erro ao obter próxima pergunta.");
    } finally {
      setLoading(false);
    }
  }

  async function evaluate(perguntasList: PerguntaComResposta[]) {
    setError("");
    try {
      const res = await fetch("/api/ai/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          tipo,
          nivel,
          perguntas: perguntasList.map((p) => ({ pergunta: p.pergunta, resposta: p.resposta })),
        }),
      });
      const data = (await res.json()) as AvaliacaoFinal & { error?: string };
      if (data.error) { setError(data.error); return; }
      setAvaliacao(data);
      setScreen("result");
    } catch {
      setError("Erro ao avaliar entrevista.");
    }
  }

  async function saveSession() {
    if (!avaliacao || saved) return;
    setSaving(true);
    try {
      await createMockInterview({
        tipo,
        nivel,
        perguntas: perguntas.map((p) => ({
          pergunta: p.pergunta,
          resposta: p.resposta,
          feedback: avaliacao.feedbackDetalhadoPorPergunta.find((f) => f.pergunta === p.pergunta)?.avaliacao,
          score: avaliacao.feedbackDetalhadoPorPergunta.find((f) => f.pergunta === p.pergunta)?.score,
        })),
        scoreGeral: avaliacao.scoreGeral,
        feedbackGeral: avaliacao.feedbackGeral,
        status: "concluido",
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
      const list = await listMockInterviews();
      setHistory(list);
    } catch {
      setError("Erro ao carregar histórico.");
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "anteriores") loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function resetInterview() {
    setScreen("config");
    setPerguntas([]);
    setCurrentPergunta(null);
    setCurrentResposta("");
    setAvaliacao(null);
    setSaved(false);
    setError("");
    stopTimer();
    setElapsed(0);
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <Mic className="w-8 h-8 text-amber-500" />
          Mock Interview
        </h1>
        <p className="text-muted max-w-xl">
          Entrevista simulada com IA. Perguntas progressivas, avaliação real como um entrevistador sênior.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line">
        {(["nova", "anteriores"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); }}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition",
              tab === t ? "border-amber-500 text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {t === "nova" ? "Nova Entrevista" : "Entrevistas Anteriores"}
          </button>
        ))}
      </div>

      {/* ANTERIORES */}
      {tab === "anteriores" && (
        <div className="space-y-4">
          {historyLoading ? (
            <div className="flex items-center gap-2 text-muted text-sm">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Carregando...
            </div>
          ) : history.length === 0 ? (
            <p className="text-muted text-sm">Nenhuma entrevista salva ainda.</p>
          ) : (
            history.map((s) => {
              const rec = s.feedbackGeral;
              return (
                <Card key={s.id} className="space-y-3">
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedHistory(expandedHistory === s.id ? null : s.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag color="zinc">{TIPO_LABEL[s.tipo]}</Tag>
                          <Tag color="amber">{NIVEL_LABEL[s.nivel]}</Tag>
                          <Tag color={s.status === "concluido" ? "emerald" : "zinc"}>
                            {s.status === "concluido" ? "Concluído" : "Em andamento"}
                          </Tag>
                        </div>
                        <p className="text-xs text-muted">{new Date(s.criadoEm).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {s.scoreGeral != null && (
                          <span className={clsx("text-2xl font-bold tabular-nums", scoreColor(s.scoreGeral))}>
                            {s.scoreGeral}
                          </span>
                        )}
                        {expandedHistory === s.id
                          ? <ChevronUp className="w-4 h-4 text-muted" />
                          : <ChevronDown className="w-4 h-4 text-muted" />}
                      </div>
                    </div>
                  </button>
                  {expandedHistory === s.id && (
                    <div className="space-y-3 pt-2 border-t border-line">
                      {rec && (
                        <div>
                          <p className="text-xs text-muted uppercase tracking-wide mb-1">Feedback geral</p>
                          <p className="text-sm text-fg">{rec}</p>
                        </div>
                      )}
                      {s.perguntas.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted uppercase tracking-wide">Perguntas</p>
                          {s.perguntas.map((p, i) => (
                            <div key={i} className="rounded-lg border border-line bg-card-hover p-3 space-y-1">
                              <p className="text-sm font-medium">{p.pergunta}</p>
                              <p className="text-xs text-muted">{p.resposta}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* CONFIG */}
      {tab === "nova" && screen === "config" && (
        <Card className="max-w-md space-y-5">
          <h2 className="text-lg font-semibold">Configurar entrevista</h2>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as MockInterviewTipo)}
            >
              <option value="tecnica">Técnica</option>
              <option value="comportamental">Comportamental</option>
              <option value="misto">Misto (técnica + comportamental)</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nivel">Nível</Label>
            <Select
              id="nivel"
              value={nivel}
              onChange={(e) => setNivel(e.target.value as "pleno" | "senior" | "staff")}
            >
              <option value="pleno">Pleno</option>
              <option value="senior">Sênior</option>
              <option value="staff">Staff</option>
            </Select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            onClick={startInterview}
            disabled={loading}
            className="w-full justify-center"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" /> Iniciar entrevista
              </>
            )}
          </Button>
        </Card>
      )}

      {/* INTERVIEW */}
      {tab === "nova" && screen === "interview" && currentPergunta && (
        <div className="space-y-6 max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <User className="w-4 h-4" />
              <span>Entrevista em andamento — Pergunta {perguntas.length + 1}</span>
              <span className="text-subtle">· ~10 perguntas</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-sm font-medium px-3 py-1.5 rounded-lg border border-line bg-card text-fg">
              <Clock className="w-4 h-4" />
              {formatTime(elapsed)}
            </div>
          </div>

          {/* Progress */}
          <div className="w-full bg-card-hover rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min((perguntas.length / 10) * 100, 100)}%` }}
            />
          </div>

          {/* Pergunta atual */}
          <Card className="space-y-2 border-amber-500/30">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                {currentPergunta.tipo}
              </span>
            </div>
            <p className="text-base font-medium leading-relaxed">{currentPergunta.pergunta}</p>
          </Card>

          {/* Resposta */}
          <div className="space-y-2">
            <Label>Sua resposta</Label>
            <Textarea
              rows={6}
              value={currentResposta}
              onChange={(e) => setCurrentResposta(e.target.value)}
              placeholder="Responda com clareza e detalhes..."
              className="min-h-[150px]"
            />
          </div>

          {/* Dica */}
          {currentPergunta.dica && (
            <button
              onClick={() => setShowDica((v) => !v)}
              className="text-xs text-muted hover:text-fg transition flex items-center gap-1"
            >
              {showDica ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showDica ? "Ocultar dica" : "Ver dica"}
            </button>
          )}
          {showDica && currentPergunta.dica && (
            <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2">
              <p className="text-xs text-sky-600 dark:text-sky-400">{currentPergunta.dica}</p>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            onClick={submitResposta}
            disabled={loading || !currentResposta.trim()}
            className="w-full justify-center"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processando...
              </>
            ) : "Responder →"}
          </Button>

          {/* Histórico de Q&As */}
          {perguntas.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-line">
              <p className="text-xs text-muted uppercase tracking-wide font-medium">Perguntas anteriores</p>
              {perguntas.map((p, i) => (
                <div key={i} className="rounded-lg border border-line bg-card overflow-hidden">
                  <button
                    className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
                    onClick={() => setExpandedPrev(expandedPrev === i ? null : i)}
                  >
                    <p className="text-sm font-medium text-fg">{p.pergunta}</p>
                    {expandedPrev === i
                      ? <ChevronUp className="w-4 h-4 text-muted shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-muted shrink-0" />}
                  </button>
                  {expandedPrev === i && (
                    <div className="px-4 pb-3 border-t border-line space-y-2">
                      <p className="text-xs text-muted uppercase tracking-wide mt-2">Sua resposta</p>
                      <p className="text-sm text-fg whitespace-pre-wrap">{p.resposta}</p>
                      {p.dica && (
                        <div className="rounded border border-sky-500/20 bg-sky-500/5 px-2 py-1.5">
                          <p className="text-xs text-sky-600 dark:text-sky-400">{p.dica}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EVALUATING */}
      {tab === "nova" && screen === "evaluating" && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted text-sm">Avaliando sua entrevista...</p>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}

      {/* RESULT */}
      {tab === "nova" && screen === "result" && avaliacao && (
        <div className="space-y-6 max-w-3xl">
          {/* Header */}
          <div className="text-center space-y-2 pb-4 border-b border-line">
            <h2 className="text-2xl font-bold">Entrevista concluída!</h2>
            <div className="flex items-center justify-center gap-3">
              <Tag color="zinc">{TIPO_LABEL[tipo]}</Tag>
              <Tag color="amber">{NIVEL_LABEL[nivel]}</Tag>
            </div>
          </div>

          {/* Score + Recomendação */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Card className="flex-1 flex items-center gap-6">
              <div className="text-center shrink-0">
                <span className={clsx("text-6xl font-bold tabular-nums", scoreColor(avaliacao.scoreGeral))}>
                  {avaliacao.scoreGeral}
                </span>
                <p className="text-xs text-muted mt-1">/ 100</p>
              </div>
              <div>
                <p className="font-semibold">Score geral</p>
                <p className="text-xs text-muted mt-1">{perguntas.length} perguntas respondidas</p>
              </div>
            </Card>
            {(() => {
              const cfg = RECOMENDACAO_CONFIG[avaliacao.recomendacaoContratacao];
              return (
                <Card className={clsx("flex-1 flex items-center justify-center border-2", cfg.border)}>
                  <div className="text-center space-y-1">
                    <p className="text-xs text-muted uppercase tracking-wide">Recomendação</p>
                    <p className={clsx("text-3xl font-bold", cfg.text)}>{cfg.label}</p>
                  </div>
                </Card>
              );
            })()}
          </div>

          {/* Dimensões */}
          <Card className="space-y-4">
            <p className="text-sm font-semibold text-muted uppercase tracking-wide">Dimensões</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DimensaoBar label="Conhecimento Técnico" value={avaliacao.dimensoes.conhecimentoTecnico} />
              <DimensaoBar label="Comunicação" value={avaliacao.dimensoes.comunicacao} />
              <DimensaoBar label="Resolução de Problemas" value={avaliacao.dimensoes.resolucaoProblemas} />
              <DimensaoBar label="Liderança" value={avaliacao.dimensoes.lideranca} />
              <DimensaoBar label="Cultura" value={avaliacao.dimensoes.cultura} />
            </div>
          </Card>

          {/* Pontos fortes */}
          {avaliacao.pontosFortes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Pontos fortes
              </p>
              <ul className="space-y-1.5">
                {avaliacao.pontosFortes.map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Áreas de desenvolvimento */}
          {avaliacao.areasDesenvolvimento.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" /> Áreas de desenvolvimento
              </p>
              <ul className="space-y-1.5">
                {avaliacao.areasDesenvolvimento.map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback por pergunta */}
          {avaliacao.feedbackDetalhadoPorPergunta.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted uppercase tracking-wide">Feedback por pergunta</p>
              {avaliacao.feedbackDetalhadoPorPergunta.map((f, i) => (
                <div key={i} className="rounded-lg border border-line bg-card overflow-hidden">
                  <button
                    className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
                    onClick={() => setExpandedPerguntaFeedback(expandedPerguntaFeedback === i ? null : i)}
                  >
                    <p className="text-sm font-medium">{f.pergunta}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={clsx("text-lg font-bold tabular-nums", scoreColor(f.score * 10))}>
                        {f.score}/10
                      </span>
                      {expandedPerguntaFeedback === i
                        ? <ChevronUp className="w-4 h-4 text-muted" />
                        : <ChevronDown className="w-4 h-4 text-muted" />}
                    </div>
                  </button>
                  {expandedPerguntaFeedback === i && (
                    <div className="px-4 pb-3 border-t border-line">
                      <p className="text-sm text-fg mt-2">{f.avaliacao}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Feedback geral */}
          <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4 space-y-1.5">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Feedback geral</p>
            <p className="text-sm leading-relaxed">{avaliacao.feedbackGeral}</p>
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
            <Button variant="secondary" onClick={resetInterview}>
              <RotateCcw className="w-4 h-4" /> Nova entrevista
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
