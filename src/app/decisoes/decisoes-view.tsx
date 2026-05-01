"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { AlertTriangle, Clock, CheckCircle2, ChevronRight, RefreshCw, X } from "lucide-react";
import { Card, Button, Textarea } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { listAllDecisoes, addRevisitaDecisao } from "@/lib/db";
import { computeNextReview } from "@/lib/srs";
import type { Decisao, DecisaoUrgencia, RevisitaDecisao } from "@/lib/types";

// ── Urgency helpers ────────────────────────────────────────

const urgenciaColor: Record<DecisaoUrgencia, string> = {
  atrasado: "text-red-500",
  proximo:  "text-amber-500",
  calmo:    "text-emerald-500",
};

const urgenciaBg: Record<DecisaoUrgencia, string> = {
  atrasado: "bg-red-500/10 border-red-500/30",
  proximo:  "bg-amber-500/10 border-amber-500/30",
  calmo:    "bg-emerald-500/10 border-emerald-500/30",
};

const urgenciaLabel: Record<DecisaoUrgencia, string> = {
  atrasado: "Atrasado",
  proximo:  "Próximo",
  calmo:    "Em dia",
};

function UrgenciaIcon({ urgencia }: { urgencia: DecisaoUrgencia }) {
  if (urgencia === "atrasado") return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
  if (urgencia === "proximo")  return <Clock className="w-3.5 h-3.5 text-amber-500" />;
  return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
}

function relativeDays(ms: number): string {
  const days = Math.round((Date.now() - ms) / (1000 * 60 * 60 * 24));
  if (days === 0) return "hoje";
  if (days === 1) return "há 1 dia";
  return `há ${days} dias`;
}

// ── Annotated decisao ─────────────────────────────────────

interface DecisaoComSRS extends Decisao {
  urgencia: DecisaoUrgencia;
  dias: number;
}

function annotate(decisoes: Decisao[]): DecisaoComSRS[] {
  return decisoes.map((d) => {
    const { dias, urgencia } = computeNextReview(d);
    return { ...d, urgencia, dias };
  });
}

// ── Revisita Modal ─────────────────────────────────────────

interface RevisitaModalProps {
  decisao: DecisaoComSRS;
  onClose: () => void;
  onSaved: () => void;
}

function RevisitaModal({ decisao, onClose, onSaved }: RevisitaModalProps) {
  const [pergunta, setPergunta] = useState<string | null>(null);
  const [loadingPergunta, setLoadingPergunta] = useState(true);
  const [resposta, setResposta] = useState<RevisitaDecisao["resposta"] | null>(null);
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoadingPergunta(true);
    fetch("/api/decisoes/pergunta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisao }),
    })
      .then((r) => r.json())
      .then((data: { pergunta?: string }) => {
        setPergunta(data.pergunta ?? "Você ainda tomaria essa mesma decisão hoje?");
      })
      .catch(() => {
        setPergunta("Você ainda tomaria essa mesma decisão hoje?");
      })
      .finally(() => setLoadingPergunta(false));
  }, [decisao.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    if (!resposta) return;
    setSaving(true);
    try {
      const revisita: RevisitaDecisao = {
        data: Date.now(),
        resposta,
        ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
      };
      await addRevisitaDecisao(decisao.id, revisita);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-line">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Revisitar decisão</p>
            <h2 className="text-base font-semibold text-fg leading-snug">{decisao.titulo}</h2>
            <p className="text-xs text-muted mt-1">Tomada {relativeDays(decisao.data)}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fg transition shrink-0 mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question */}
        <div className="p-5 border-b border-line">
          {loadingPergunta ? (
            <div className="h-12 rounded-lg bg-card-hover animate-pulse" />
          ) : (
            <p className="text-sm text-fg leading-relaxed">{pergunta}</p>
          )}
        </div>

        {/* Response buttons */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(["ainda-faria", "depende", "mudaria"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setResposta(r)}
                className={clsx(
                  "px-3 py-3 rounded-xl border text-sm font-medium transition text-center leading-tight",
                  resposta === r
                    ? r === "ainda-faria"
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : r === "mudaria"
                        ? "border-red-500 bg-red-500/15 text-red-600 dark:text-red-400"
                        : "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "border-line bg-card hover:border-line-strong hover:bg-card-hover text-muted",
                )}
              >
                {r === "ainda-faria" ? "Ainda faria" : r === "mudaria" ? "Mudaria" : "Depende"}
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Observação opcional (o que mudou, evidências, novas percepções…)"
            rows={3}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="text-sm text-muted hover:text-fg transition"
            >
              Cancelar
            </button>
            <Button
              onClick={handleSubmit}
              disabled={!resposta || saving}
            >
              {saving ? "Salvando…" : "Salvar revisita"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Decisao Card ───────────────────────────────────────────

function DecisaoCard({
  decisao,
  onRevisitar,
}: {
  decisao: DecisaoComSRS;
  onRevisitar: (d: DecisaoComSRS) => void;
}) {
  const lastRevisita = decisao.revisitas?.length
    ? [...decisao.revisitas].sort((a, b) => b.data - a.data)[0]
    : null;

  const respostaLabel: Record<RevisitaDecisao["resposta"], string> = {
    "ainda-faria": "ainda faria",
    mudaria:       "mudaria",
    depende:       "depende",
  };

  return (
    <div className={clsx(
      "rounded-xl border p-4 transition group",
      decisao.urgencia === "atrasado"
        ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
        : decisao.urgencia === "proximo"
          ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
          : "border-line bg-card hover:border-line-strong",
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className={clsx(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
              urgenciaBg[decisao.urgencia],
            )}>
              <UrgenciaIcon urgencia={decisao.urgencia} />
              <span className={urgenciaColor[decisao.urgencia]}>
                {urgenciaLabel[decisao.urgencia]}
              </span>
            </span>
            <span className="text-xs text-muted">
              Tomada {relativeDays(decisao.data)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-fg leading-snug">{decisao.titulo}</h3>

          {/* Last revisita */}
          {lastRevisita ? (
            <p className="text-xs text-muted">
              Última revisita {relativeDays(lastRevisita.data)}: <span className="text-fg">{respostaLabel[lastRevisita.resposta]}</span>
            </p>
          ) : (
            <p className="text-xs text-muted">Nunca revisitada</p>
          )}

          {/* SRS interval info */}
          {decisao.urgencia !== "atrasado" && (
            <p className="text-xs text-muted">
              {decisao.dias > 0
                ? `Próxima revisão em ${decisao.dias} dias`
                : `Revisão devida há ${Math.abs(decisao.dias)} dia${Math.abs(decisao.dias) !== 1 ? "s" : ""}`}
            </p>
          )}
          {decisao.urgencia === "atrasado" && (
            <p className={clsx("text-xs font-medium", urgenciaColor.atrasado)}>
              Revisão atrasada há {Math.abs(decisao.dias)} dia{Math.abs(decisao.dias) !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => onRevisitar(decisao)}
          className={clsx(
            "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition",
            decisao.urgencia === "atrasado"
              ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
              : decisao.urgencia === "proximo"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                : "border-line bg-card text-muted hover:border-line-strong hover:text-fg",
          )}
        >
          Revisitar
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Main View ──────────────────────────────────────────────

export function DecisoesView() {
  const { signedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [decisoes, setDecisoes] = useState<DecisaoComSRS[]>([]);
  const [revistandoDecisao, setRevistandoDecisao] = useState<DecisaoComSRS | null>(null);
  const [filter, setFilter] = useState<DecisaoUrgencia | "todas">("todas");

  async function load() {
    setLoading(true);
    try {
      const all = await listAllDecisoes();
      setDecisoes(annotate(all));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!signedIn) { setLoading(false); return; }
    load();
  }, [signedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const atrasadas = decisoes.filter((d) => d.urgencia === "atrasado");
  const proximas  = decisoes.filter((d) => d.urgencia === "proximo");
  const calmas    = decisoes.filter((d) => d.urgencia === "calmo");

  const pendingCount = atrasadas.length + proximas.length;

  const filtered =
    filter === "atrasado" ? atrasadas :
    filter === "proximo"  ? proximas :
    filter === "calmo"    ? calmas :
    decisoes;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-fg">Decision Journal</h1>
        <p className="text-sm text-muted mt-1">
          Spaced repetition aplicado a decisões de arquitetura. Revise antes que o contexto se perca.
        </p>
      </div>

      {/* Hero card */}
      {!loading && (
        <Card className={clsx(
          pendingCount > 0
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-emerald-500/30 bg-emerald-500/5",
        )}>
          <div className="flex items-center justify-between gap-4">
            <div>
              {pendingCount > 0 ? (
                <>
                  <p className="text-lg font-bold text-fg">
                    {pendingCount} {pendingCount === 1 ? "decisão" : "decisões"} para revisitar hoje
                  </p>
                  <p className="text-sm text-muted mt-1">
                    {atrasadas.length > 0 && (
                      <span className="text-red-500 font-medium">{atrasadas.length} atrasada{atrasadas.length !== 1 ? "s" : ""}</span>
                    )}
                    {atrasadas.length > 0 && proximas.length > 0 && " · "}
                    {proximas.length > 0 && (
                      <span className="text-amber-500 font-medium">{proximas.length} próxima{proximas.length !== 1 ? "s" : ""}</span>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-fg">Nenhuma decisão precisa de revisão hoje</p>
                  <p className="text-sm text-muted mt-1 text-emerald-600 dark:text-emerald-400">
                    Você está em dia
                  </p>
                </>
              )}
            </div>
            <button
              onClick={load}
              className="p-2 rounded-lg text-muted hover:text-fg hover:bg-card-hover transition"
              title="Recarregar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Filter tabs */}
      {!loading && decisoes.length > 0 && (
        <div className="flex items-center gap-1 p-1 rounded-xl bg-card border border-line w-fit flex-wrap">
          {(["todas", "atrasado", "proximo", "calmo"] as const).map((f) => {
            const count =
              f === "todas"    ? decisoes.length :
              f === "atrasado" ? atrasadas.length :
              f === "proximo"  ? proximas.length :
              calmas.length;

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition",
                  filter === f
                    ? "bg-card-hover text-fg border border-line-strong"
                    : "text-muted hover:text-fg",
                )}
              >
                {f === "todas" ? "Todas" : urgenciaLabel[f]}
                <span className={clsx(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  filter === f ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-card-hover text-muted",
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-card border border-line animate-pulse" />
          ))}
        </div>
      ) : !signedIn ? (
        <Card>
          <p className="text-sm text-muted text-center py-4">
            Faça login para ver suas decisões.
          </p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-muted text-center py-6">
            {filter === "todas"
              ? "Nenhuma decisão registrada ainda. Adicione decisões de arquitetura nos seus projetos."
              : `Nenhuma decisão com status "${filter === "atrasado" ? "atrasada" : filter === "proximo" ? "próxima" : "em dia"}".`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <DecisaoCard
              key={d.id}
              decisao={d}
              onRevisitar={setRevistandoDecisao}
            />
          ))}
        </div>
      )}

      {/* Stats footer */}
      {!loading && decisoes.length > 0 && (
        <div className="flex items-center gap-6 text-xs text-muted border-t border-line pt-4">
          <span>{decisoes.length} decisões no total</span>
          <span className="text-red-500">{atrasadas.length} atrasadas</span>
          <span className="text-amber-500">{proximas.length} próximas</span>
          <span className="text-emerald-500">{calmas.length} em dia</span>
        </div>
      )}

      {/* Revisita Modal */}
      {revistandoDecisao && (
        <RevisitaModal
          decisao={revistandoDecisao}
          onClose={() => setRevistandoDecisao(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
