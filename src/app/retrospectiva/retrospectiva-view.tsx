"use client";

import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { Star, Sparkles, Save, ChevronDown, ChevronUp } from "lucide-react";
import { Button, Card, Label, Textarea } from "@/components/ui";
import {
  listRetrospectivas,
  getRetrospectivaByWeek,
  saveRetrospectiva,
  listCardDoDiaProgresso,
  listErrosPersonais,
  listDividas,
} from "@/lib/db";
import type { Retrospectiva } from "@/lib/types";
import type { RetrospectivaGerada } from "@/app/api/ai/retrospectiva/route";

function getCurrentWeek(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7,
  );
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function formatWeekLabel(semana: string): string {
  // semana format: YYYY-Www
  const [year, wPart] = semana.split("-W");
  const weekNum = parseInt(wPart, 10);
  // Get Monday of that week
  const jan1 = new Date(parseInt(year, 10), 0, 1);
  const dayOfWeek = jan1.getDay() || 7;
  const monday = new Date(jan1);
  monday.setDate(jan1.getDate() + (weekNum - 1) * 7 - (dayOfWeek - 1));
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return `Semana ${weekNum} — ${monthNames[monday.getMonth()]} ${monday.getFullYear()}`;
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHovered(i)}
          onMouseLeave={() => onChange && setHovered(0)}
          disabled={!onChange}
          className={clsx(
            "transition",
            onChange ? "cursor-pointer" : "cursor-default",
          )}
        >
          <Star
            size={20}
            className={clsx(
              (hovered || value) >= i
                ? "fill-amber-400 text-amber-400"
                : "text-line fill-transparent",
              "transition",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function HistoricoItem({ retro }: { retro: Retrospectiva }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-line rounded-lg bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-card-hover transition text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-fg">{formatWeekLabel(retro.semana)}</span>
          <StarRating value={retro.scoreAprendizado} />
          {retro.geradaPorIA && (
            <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
              IA
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-muted shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-muted shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-line space-y-3 pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Aprendizados</p>
            <p className="text-sm text-fg whitespace-pre-wrap">{retro.aprendizados || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Dívidas</p>
            <p className="text-sm text-fg whitespace-pre-wrap">{retro.dividas || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Acertos</p>
            <p className="text-sm text-fg whitespace-pre-wrap">{retro.acertos || "—"}</p>
          </div>
          {retro.melhorias && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Melhorias (IA)</p>
              <p className="text-sm text-fg whitespace-pre-wrap">{retro.melhorias}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RetrospectivaView() {
  const [tab, setTab] = useState<"semana" | "historico">("semana");
  const [currentWeek] = useState(getCurrentWeek);
  const [saved, setSaved] = useState<Retrospectiva | null>(null);
  const [historico, setHistorico] = useState<Retrospectiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);

  // form fields
  const [aprendizados, setAprendizados] = useState("");
  const [dividas, setDividas] = useState("");
  const [acertos, setAcertos] = useState("");
  const [score, setScore] = useState(0);
  const [melhorias, setMelhorias] = useState("");
  const [insights, setInsights] = useState("");
  const [proximoFoco, setProximoFoco] = useState("");
  const [geradaPorIA, setGeradaPorIA] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [existing, all] = await Promise.all([
        getRetrospectivaByWeek(currentWeek),
        listRetrospectivas(),
      ]);
      if (existing) {
        setSaved(existing);
        setAprendizados(existing.aprendizados);
        setDividas(existing.dividas);
        setAcertos(existing.acertos);
        setScore(existing.scoreAprendizado);
        setMelhorias(existing.melhorias);
      }
      setHistorico(all.filter((r) => r.semana !== currentWeek));
    } catch {
      setError("Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [currentWeek]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!aprendizados.trim()) {
      setError("Preencha pelo menos os aprendizados.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const retro = await saveRetrospectiva({
        semana: currentWeek,
        aprendizados: aprendizados.trim(),
        dividas: dividas.trim(),
        acertos: acertos.trim(),
        melhorias: melhorias.trim(),
        scoreAprendizado: score || 1,
        geradaPorIA,
      });
      setSaved(retro);
      setEditMode(false);
      setHistorico((prev) => [retro, ...prev.filter((r) => r.id !== retro.id)]);
    } catch {
      setError("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!aprendizados.trim() && !dividas.trim() && !acertos.trim()) {
      setError("Preencha ao menos um campo antes de gerar com IA.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      // Fetch week activity data to enrich the AI prompt
      const weekStart = (() => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay());
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })();

      const [cardProgress, erros, debitList] = await Promise.all([
        listCardDoDiaProgresso(),
        listErrosPersonais(),
        listDividas(),
      ]);

      const weekActivity = {
        cardsStudied: cardProgress
          .filter((c) => c.completado && c.criadoEm >= weekStart)
          .map((c) => ({ slug: c.cardSlug, score: c.totalQuiz > 0 ? Math.round((c.acertosQuiz / c.totalQuiz) * 100) : 0 })),
        errosRegistrados: erros
          .filter((e) => e.criadoEm >= weekStart)
          .map((e) => ({ titulo: e.titulo, causaRaiz: e.causaRaiz })),
        dividasNovas: debitList
          .filter((d) => d.criadoEm >= weekStart)
          .map((d) => ({ descricao: d.descricao })),
      };

      const res = await fetch("/api/ai/retrospectiva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dividas, acertos, aprendizados, weekActivity }),
      });
      const data = (await res.json()) as RetrospectivaGerada & { error?: string };
      if (data.error) {
        setError(data.error);
        return;
      }
      setMelhorias(data.melhorias ?? "");
      setInsights(data.insights ?? "");
      setProximoFoco(data.proximoFoco ?? "");
      if (data.scoreAprendizado) setScore(data.scoreAprendizado);
      setGeradaPorIA(true);
    } catch {
      setError("Erro ao chamar IA.");
    } finally {
      setGenerating(false);
    }
  }

  const showForm = !saved || editMode;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-fg">Retrospectiva Semanal</h1>
        <p className="text-sm text-muted mt-1">
          Reflexão estruturada. Converta experiência em sabedoria.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-card border border-line rounded-lg p-1 w-fit">
        {(["semana", "historico"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "px-4 py-1.5 rounded-md text-sm font-medium transition",
              tab === t
                ? "bg-amber-500 text-zinc-950"
                : "text-muted hover:text-fg",
            )}
          >
            {t === "semana" ? "Esta semana" : "Histórico"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block text-muted" />
        </div>
      ) : tab === "semana" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-fg">{formatWeekLabel(currentWeek)}</h2>
            {saved && !editMode && (
              <Button variant="ghost" className="text-xs" onClick={() => setEditMode(true)}>
                Editar
              </Button>
            )}
          </div>

          {showForm ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="aprendizados">O que aprendi esta semana</Label>
                <Textarea
                  id="aprendizados"
                  placeholder="Descreva os aprendizados concretos desta semana..."
                  value={aprendizados}
                  onChange={(e) => setAprendizados(e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="dividas">Dívidas que acumulei (usei sem entender)</Label>
                <Textarea
                  id="dividas"
                  placeholder="O que você copiou/usou sem entender de verdade?"
                  value={dividas}
                  onChange={(e) => setDividas(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="acertos">O que fiz bem</Label>
                <Textarea
                  id="acertos"
                  placeholder="Decisões boas, código bem feito, problemas bem resolvidos..."
                  value={acertos}
                  onChange={(e) => setAcertos(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Score de aprendizado</Label>
                <div className="flex items-center gap-3 mt-1">
                  <StarRating value={score} onChange={setScore} />
                  <span className="text-xs text-muted">
                    {score === 0 && "Selecione"}
                    {score === 1 && "Sem aprendizado real"}
                    {score === 2 && "Pouco aprendizado"}
                    {score === 3 && "Aprendizado moderado"}
                    {score === 4 && "Bom aprendizado"}
                    {score === 5 && "Aprendizado profundo"}
                  </span>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3 flex-wrap">
                <Button onClick={handleSave} disabled={saving || !aprendizados.trim()}>
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <>
                      <Save size={14} />
                      Salvar reflexão
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Gerar com IA
                    </>
                  )}
                </Button>
              </div>

              {/* AI results */}
              {(melhorias || insights || proximoFoco) && (
                <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                      Análise da IA
                    </span>
                  </div>
                  {melhorias && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Melhorias para próxima semana</p>
                      <p className="text-sm text-fg whitespace-pre-wrap">{melhorias}</p>
                    </div>
                  )}
                  {insights && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Insights comportamentais</p>
                      <p className="text-sm text-fg whitespace-pre-wrap">{insights}</p>
                    </div>
                  )}
                  {proximoFoco && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Próximo foco</p>
                      <p className="text-sm font-medium text-fg">{proximoFoco}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            saved && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <StarRating value={saved.scoreAprendizado} />
                  {saved.geradaPorIA && (
                    <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                      IA
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Aprendizados</p>
                  <p className="text-sm text-fg whitespace-pre-wrap">{saved.aprendizados || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Dívidas</p>
                  <p className="text-sm text-fg whitespace-pre-wrap">{saved.dividas || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Acertos</p>
                  <p className="text-sm text-fg whitespace-pre-wrap">{saved.acertos || "—"}</p>
                </div>
                {saved.melhorias && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Melhorias (IA)</p>
                    <p className="text-sm text-fg whitespace-pre-wrap">{saved.melhorias}</p>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {historico.length === 0 ? (
            <p className="text-sm text-muted text-center py-12">
              Nenhuma retrospectiva anterior registrada.
            </p>
          ) : (
            historico.map((r) => <HistoricoItem key={r.id} retro={r} />)
          )}
        </div>
      )}
    </div>
  );
}
