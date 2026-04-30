"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { clsx } from "clsx";
import {
  Swords, Clock, ChevronLeft, Trophy, AlertTriangle,
  CheckCircle2, XCircle, Lightbulb, Save, RotateCcw, History,
} from "lucide-react";
import { Button, Card, Label, Tag, Textarea } from "@/components/ui";
import { createWarGame, listWarGames } from "@/lib/db";
import type { WarGameFeedback } from "@/app/api/ai/war-game/route";
import type { WarGameSession } from "@/lib/types";

interface Cenario {
  titulo: string;
  cenario: string;
  restricoes: string[];
  categoria: "incidente" | "arquitetura" | "performance" | "segurança" | "decisão";
}

const CENARIOS: Cenario[] = [
  {
    titulo: "Auth quebrada em produção",
    cenario: "São 14h de sexta. O sistema de autenticação do seu ERP está com latência de 8s (normal: 200ms). 500 usuários ativos. Você não sabe a causa ainda.",
    restricoes: ["Time: sprint acaba segunda", "Recursos: você + 1 junior", "Contexto: cliente VIP apresentando o sistema amanhã"],
    categoria: "incidente",
  },
  {
    titulo: "Arquivo com 6000 linhas",
    cenario: "Você herda um arquivo de 6000 linhas com toda a lógica de negócio misturada. Precisa adicionar uma nova feature urgente e há bugs relacionados.",
    restricoes: ["Prazo: 3 dias", "Sem testes", "2 outros devs dependem desse arquivo"],
    categoria: "arquitetura",
  },
  {
    titulo: "Banco de dados lento sob carga",
    cenario: "Após lançamento, o banco PostgreSQL está com queries de 4-5s. Usuários reclamando. Você tem acesso ao query plan mas não pode fazer deploy imediato.",
    restricoes: ["Horário de pico: não pode reiniciar serviços", "DBA não disponível até segunda", "CEO quer resposta em 1h"],
    categoria: "performance",
  },
  {
    titulo: "Migração de arquitetura monolítica",
    cenario: "Monolito de 3 anos, 200k linhas, precisa ser migrado. Time novo quer microsserviços. CTO quer modular monolith. Você deve decidir e apresentar um plano.",
    restricoes: ["Budget: 6 meses de dev time", "Sem downtime aceitável", "Time de 5 devs, 2 são juniores"],
    categoria: "arquitetura",
  },
  {
    titulo: "Leak de dados descoberto",
    cenario: "Você descobre que uma query está retornando dados de outros tenants devido a um bug de isolamento multi-tenant. Isso está em produção há 2 semanas.",
    restricoes: ["LGPD implica notificação obrigatória", "CEO não sabe ainda", "Fix pode causar downtime de 2h"],
    categoria: "segurança",
  },
  {
    titulo: "Dependência crítica descontinuada",
    cenario: "Biblioteca principal do seu sistema (gerencia todos os pagamentos) anunciou EOL em 90 dias. Alternativas existem mas com APIs diferentes.",
    restricoes: ["90 dias", "Módulo de pagamentos: 15k linhas", "Equipe sem experiência com as alternativas"],
    categoria: "arquitetura",
  },
  {
    titulo: "Junior commitou secrets no git",
    cenario: "Um dev junior commitou credenciais de produção (AWS keys, DB password) no repositório GitHub público. Você descobriu 30 minutos depois.",
    restricoes: ["GitHub já indexou", "Não sabemos se foi acessado", "Junior em pânico"],
    categoria: "segurança",
  },
  {
    titulo: "Feature crítica vs débito técnico",
    cenario: "PM quer uma feature que levaria 1 semana limpa. Mas para implementar bem você precisaria refatorar uma parte crítica antes (+2 semanas). Ou implementar com gambiarra (-3 dias).",
    restricoes: ["Demo com investidores em 2 semanas", "Time pressiona pela gambiarra", "Você é o tech lead"],
    categoria: "decisão",
  },
  {
    titulo: "N+1 em produção com alta carga",
    cenario: "Monitoramento mostra 800+ queries por request em um endpoint crítico. Está em produção. Fix requer mudança de ORM para query manual + cache.",
    restricoes: ["1000 RPM nesse endpoint", "Dev que escreveu está de férias", "Semana de pico de vendas"],
    categoria: "performance",
  },
  {
    titulo: "Multi-tenancy: isolamento insuficiente",
    cenario: "Ao auditar o código, você percebe que o isolamento de tenants usa apenas filtros de WHERE, sem RLS no banco. Uma SQL injection exporia dados de todos os tenants.",
    restricoes: ["Nenhum incidente ainda", "200 empresas no sistema", "Fix requer migração de schema"],
    categoria: "segurança",
  },
];

const CATEGORIA_COLOR: Record<Cenario["categoria"], string> = {
  incidente: "bg-red-500/15 text-red-700 dark:text-red-300",
  arquitetura: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  performance: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  segurança: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  decisão: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

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

type Screen = "list" | "scenario" | "feedback" | "history";

export function WarGameView() {
  const [screen, setScreen] = useState<Screen>("list");
  const [selectedCenario, setSelectedCenario] = useState<Cenario | null>(null);
  const [decisao, setDecisao] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<WarGameFeedback | null>(null);
  const [tempoGasto, setTempoGasto] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<WarGameSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  function startScenario(c: Cenario) {
    setSelectedCenario(c);
    setDecisao("");
    setJustificativa("");
    setElapsed(0);
    setFeedback(null);
    setSaved(false);
    setError("");
    setScreen("scenario");
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }

  async function submitDecisao() {
    if (!decisao.trim() || !justificativa.trim() || !selectedCenario) return;
    stopTimer();
    const tempo = elapsed;
    setTempoGasto(tempo);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/war-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cenario: selectedCenario.cenario,
          restricoes: selectedCenario.restricoes,
          decisao,
          justificativa,
          tempoGasto: tempo,
        }),
      });
      const data = (await res.json()) as WarGameFeedback & { error?: string };
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
    if (!feedback || !selectedCenario || saved) return;
    setSaving(true);
    try {
      await createWarGame({
        cenario: selectedCenario.titulo + ": " + selectedCenario.cenario,
        restricoes: selectedCenario.restricoes,
        decisao,
        justificativa,
        feedbackIA: JSON.stringify(feedback),
        scoreDecisao: feedback.scoreDecisao,
        tempoGasto,
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
      const list = await listWarGames();
      setHistory(list);
      setScreen("history");
    } catch {
      setError("Erro ao carregar histórico.");
    } finally {
      setHistoryLoading(false);
    }
  }

  // LIST screen
  if (screen === "list") {
    return (
      <div className="space-y-8 max-w-4xl">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Swords className="w-8 h-8 text-amber-500" />
              War Game
            </h1>
            <p className="text-muted max-w-xl">
              Cenários de pressão real. Decida e justifique com restrições impostas.
              A IA avalia a qualidade do seu raciocínio — não se você acertou.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={loadHistory}
            disabled={historyLoading}
            className="shrink-0"
          >
            {historyLoading
              ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <History className="w-4 h-4" />}
            Histórico
          </Button>
        </header>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CENARIOS.map((c, i) => (
            <button
              key={i}
              onClick={() => startScenario(c)}
              className="text-left rounded-xl border border-line bg-card p-5 hover:border-amber-500/50 hover:bg-amber-500/5 transition space-y-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  {c.titulo}
                </span>
                <span className={clsx("inline-block px-2 py-0.5 rounded text-[11px] font-medium shrink-0", CATEGORIA_COLOR[c.categoria])}>
                  {c.categoria}
                </span>
              </div>
              <p className="text-xs text-muted line-clamp-2">{c.cenario}</p>
              <div className="flex flex-wrap gap-1.5">
                {c.restricoes.map((r, j) => (
                  <span key={j} className="px-2 py-0.5 rounded text-[10px] bg-card-hover text-subtle border border-line">
                    {r}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // SCENARIO screen
  if (screen === "scenario" && selectedCenario) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { stopTimer(); setScreen("list"); }}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-fg transition"
          >
            <ChevronLeft className="w-4 h-4" /> Cenários
          </button>
          <div className={clsx(
            "flex items-center gap-2 font-mono text-sm font-medium px-3 py-1.5 rounded-lg border",
            elapsed > 300
              ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
              : elapsed > 120
                ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "border-line bg-card text-fg",
          )}>
            <Clock className="w-4 h-4" />
            {formatTime(elapsed)}
          </div>
        </div>

        <Card className="space-y-4">
          <div className="flex items-start gap-3">
            <span className={clsx("inline-block px-2 py-0.5 rounded text-[11px] font-medium shrink-0 mt-0.5", CATEGORIA_COLOR[selectedCenario.categoria])}>
              {selectedCenario.categoria}
            </span>
            <h2 className="text-xl font-semibold">{selectedCenario.titulo}</h2>
          </div>
          <p className="text-sm leading-relaxed text-fg">{selectedCenario.cenario}</p>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted font-medium">Restrições</p>
            <div className="flex flex-wrap gap-2">
              {selectedCenario.restricoes.map((r, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div>
            <Label>Sua decisão — o que você vai fazer?</Label>
            <Textarea
              rows={4}
              value={decisao}
              onChange={(e) => setDecisao(e.target.value)}
              placeholder="Seja específico: quais ações, em qual ordem, quem comunica o quê..."
            />
          </div>
          <div>
            <Label>Sua justificativa — por que essa decisão?</Label>
            <Textarea
              rows={5}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Pense em voz alta: tradeoffs considerados, riscos identificados, stakeholders envolvidos, alternativas descartadas..."
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          onClick={submitDecisao}
          disabled={loading || !decisao.trim() || !justificativa.trim()}
          className="w-full justify-center"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Avaliando decisão...
            </>
          ) : (
            <>
              <Swords className="w-4 h-4" /> Submeter decisão
            </>
          )}
        </Button>
      </div>
    );
  }

  // FEEDBACK screen
  if (screen === "feedback" && feedback && selectedCenario) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-500" />
            <span className="font-semibold">{selectedCenario.titulo}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock className="w-4 h-4" />
            {formatTime(tempoGasto)}
          </div>
        </div>

        {/* Score */}
        <Card className="flex items-center gap-6">
          <div className="text-center shrink-0">
            <span className={clsx("text-6xl font-bold tabular-nums", scoreColor(feedback.scoreDecisao))}>
              {feedback.scoreDecisao}
            </span>
            <p className="text-xs text-muted mt-1">/ 100</p>
          </div>
          <div>
            <p className="font-semibold text-lg">
              {feedback.scoreDecisao >= 75 ? "Decisão sólida" : feedback.scoreDecisao >= 50 ? "Decisão razoável" : "Precisou de mais foco"}
            </p>
            <p className="text-sm text-muted mt-1">
              Baseado na qualidade do raciocínio, não na decisão em si.
            </p>
          </div>
        </Card>

        {/* Pontos fortes */}
        {feedback.pontosFortesDecisao.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Pontos fortes
            </p>
            <ul className="space-y-1.5">
              {feedback.pontosFortesDecisao.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pontos frágeis */}
        {feedback.pontosFrageisDecisao.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" /> Pontos frágeis
            </p>
            <ul className="space-y-1.5">
              {feedback.pontosFrageisDecisao.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Decisão alternativa */}
        <Card className="space-y-2 border-violet-500/30">
          <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
            O que um sênior faria diferente
          </p>
          <p className="text-sm leading-relaxed">{feedback.decisaoAlternativa}</p>
        </Card>

        {/* Riscos */}
        {feedback.riscosPrincipais.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="w-4 h-4" /> Riscos que você não considerou
            </p>
            <ul className="space-y-1.5">
              {feedback.riscosPrincipais.map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-fg rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lição */}
        <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4 space-y-1.5">
          <p className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Lightbulb className="w-4 h-4" /> Lição principal
          </p>
          <p className="text-sm leading-relaxed">{feedback.licao}</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={saveSession}
            disabled={saving || saved}
            className="gap-2"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <Save className="w-4 h-4" />}
            {saved ? "Salvo!" : "Salvar"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setScreen("list")}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Novo cenário
          </Button>
        </div>
      </div>
    );
  }

  // HISTORY screen
  if (screen === "history") {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen("list")}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-fg transition"
          >
            <ChevronLeft className="w-4 h-4" /> Cenários
          </button>
          <h2 className="text-xl font-semibold">Histórico</h2>
        </div>

        {history.length === 0 ? (
          <p className="text-muted text-sm">Nenhuma sessão salva ainda.</p>
        ) : (
          <div className="space-y-3">
            {history.map((s) => (
              <Card key={s.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-snug line-clamp-2">{s.cenario}</p>
                  {s.scoreDecisao != null && (
                    <span className={clsx("text-2xl font-bold tabular-nums shrink-0", scoreColor(s.scoreDecisao))}>
                      {s.scoreDecisao}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  {s.tempoGasto != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(s.tempoGasto)}
                    </span>
                  )}
                  <span>{new Date(s.criadoEm).toLocaleDateString("pt-BR")}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
