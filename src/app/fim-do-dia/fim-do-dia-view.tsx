"use client";

import { useEffect, useState } from "react";
import {
  Moon, AlertCircle, Bug, Check, Plus,
  ChevronRight, BookOpen, PartyPopper, Zap,
  Brain, Target, ArrowRight,
} from "lucide-react";
import { clsx } from "clsx";
import { Button, Card, Label, Textarea, Input } from "@/components/ui";
import { listDividas, createErroPersonal } from "@/lib/db";
import type { DividaConhecimento } from "@/lib/types";
import type { FimDoDiaSintese } from "@/app/api/ai/fim-do-dia-sintese/route";
import type { QuickCapturePayload } from "@/components/quick-capture";
import Link from "next/link";

type Step = "dividas" | "erros" | "sintese" | "done";

interface Saved {
  dividas: number;
  erros: number;
}

function todayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function FimDoDiaView() {
  const [step, setStep] = useState<Step>("dividas");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Saved>({ dividas: 0, erros: 0 });

  // Step 1 — today's dividas loaded from Firestore
  const [dividasHoje, setDividasHoje] = useState<DividaConhecimento[]>([]);
  const [loadingDividas, setLoadingDividas] = useState(true);

  // Step 2 — Erros
  const [erroTitulo, setErroTitulo] = useState("");
  const [erroCausa, setErroCausa] = useState("");
  const [errosSalvos, setErrosSalvos] = useState<{ titulo: string; causa: string }[]>([]);

  // Step 3 — Síntese IA
  const [sintese, setSintese] = useState<FimDoDiaSintese | null>(null);
  const [sinteseLoading, setSinteseLoading] = useState(false);
  const [sinteseError, setSinteseError] = useState("");

  // Load today's dividas on mount
  useEffect(() => {
    const start = todayStart();
    listDividas()
      .then((all) => setDividasHoje(all.filter((d) => d.criadoEm >= start)))
      .catch(() => {})
      .finally(() => setLoadingDividas(false));
  }, []);

  // Refresh dividas list after Quick Capture event fires
  useEffect(() => {
    function onCapture() {
      const start = todayStart();
      listDividas()
        .then((all) => setDividasHoje(all.filter((d) => d.criadoEm >= start)))
        .catch(() => {});
    }
    // listen for quick-capture saves by subscribing to the custom event
    window.addEventListener("brain:quick-capture-open", onCapture);
    return () => window.removeEventListener("brain:quick-capture-open", onCapture);
  }, []);

  function openQuickCapture() {
    const ev = new CustomEvent<QuickCapturePayload>("brain:quick-capture-open", {
      detail: { tab: "divida" },
    });
    window.dispatchEvent(ev);
  }

  async function adicionarErro() {
    if (!erroTitulo.trim() || !erroCausa.trim()) return;
    setSaving(true);
    try {
      await createErroPersonal({
        titulo: erroTitulo.trim(),
        descricao: "",
        categorias: ["geral"],
        causaRaiz: erroCausa.trim(),
        comoDetectar: "",
        comoPrevenir: "",
      });
      setErrosSalvos((prev) => [...prev, { titulo: erroTitulo.trim(), causa: erroCausa.trim() }]);
      setErroTitulo("");
      setErroCausa("");
    } finally {
      setSaving(false);
    }
  }

  function avancarParaErros() {
    setSaved((prev) => ({ ...prev, dividas: dividasHoje.length }));
    setStep("erros");
  }

  async function finalizar() {
    setSaved((prev) => ({ ...prev, erros: errosSalvos.length }));
    const temDados = dividasHoje.length > 0 || errosSalvos.length > 0;
    if (!temDados) {
      setStep("done");
      return;
    }
    setStep("sintese");
    setSinteseLoading(true);
    setSinteseError("");
    setSintese(null);
    try {
      const res = await fetch("/api/ai/fim-do-dia-sintese", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dividas: dividasHoje.map((d) => ({ titulo: d.descricao, descricao: d.descricao })),
          erros: errosSalvos.map((e) => ({ titulo: e.titulo, causa: e.causa })),
        }),
      });
      const data = (await res.json()) as FimDoDiaSintese & { error?: string };
      if (data.error) { setSinteseError(data.error); return; }
      setSintese(data);
    } catch {
      setSinteseError("Erro ao gerar síntese.");
    } finally {
      setSinteseLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <Moon className="w-8 h-8 text-amber-500" />
          Ritual de Fim do Dia
        </h1>
        <p className="text-muted">
          5 minutos para capturar o que não pode esperar até a retrospectiva.
        </p>
      </header>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {(["dividas", "erros", "sintese", "done"] as Step[]).map((s, i) => {
          const ALL_STEPS: Step[] = ["dividas", "erros", "sintese", "done"];
          const currentIdx = ALL_STEPS.indexOf(step);
          const stepIdx = ALL_STEPS.indexOf(s);
          return (
            <div key={s} className="flex items-center gap-3">
              <div
                className={clsx(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition",
                  step === s
                    ? "bg-amber-500 border-amber-500 text-zinc-950"
                    : stepIdx < currentIdx
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                    : "border-line text-muted",
                )}
              >
                {stepIdx < currentIdx ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={clsx("text-sm hidden sm:inline", step === s ? "text-fg font-medium" : "text-muted")}>
                {s === "dividas" ? "Dívidas" : s === "erros" ? "Erros" : s === "sintese" ? "Síntese" : "Pronto"}
              </span>
              {i < 3 && <ChevronRight className="w-4 h-4 text-muted shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Dívidas (review mode) ── */}
      {step === "dividas" && (
        <div className="space-y-5">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold">Dívidas de conhecimento — hoje</h2>
              </div>
              {!loadingDividas && (
                <span className="text-xs text-muted">{dividasHoje.length} registrada{dividasHoje.length !== 1 ? "s" : ""}</span>
              )}
            </div>

            {loadingDividas ? (
              <div className="flex items-center gap-2 text-sm text-muted py-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Carregando…
              </div>
            ) : dividasHoje.length > 0 ? (
              <div className="space-y-2">
                {dividasHoje.map((d) => (
                  <div key={d.id} className="flex items-start gap-2 text-sm text-muted">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{d.descricao}</span>
                  </div>
                ))}
                <p className="text-xs text-muted pt-1">
                  Boa! Já capturou {dividasHoje.length} dívida{dividasHoje.length !== 1 ? "s" : ""} hoje.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">
                Nenhuma dívida registrada ainda hoje.
              </p>
            )}

            <Button
              variant="secondary"
              onClick={openQuickCapture}
              className="gap-2"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              Adicionar mais (⌘⇧C)
            </Button>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={avancarParaErros}>
              {dividasHoje.length > 0 ? "Próximo →" : "Pular →"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Erros ── */}
      {step === "erros" && (
        <div className="space-y-5">
          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold">Erros e dificuldades</h2>
            </div>
            <p className="text-sm text-muted">
              Algo deu errado hoje que vale lembrar? Registre enquanto está fresco.
            </p>

            <div className="space-y-3">
              <div>
                <Label>O que deu errado?</Label>
                <Input
                  value={erroTitulo}
                  onChange={(e) => setErroTitulo(e.target.value)}
                  placeholder="Ex: N+1 query causou timeout em produção"
                />
              </div>
              <div>
                <Label>Causa raiz</Label>
                <Textarea
                  rows={2}
                  value={erroCausa}
                  onChange={(e) => setErroCausa(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) adicionarErro(); }}
                  placeholder="Ex: Não percebi que o loop estava gerando queries individuais"
                />
              </div>
              <Button
                variant="secondary"
                onClick={adicionarErro}
                disabled={saving || !erroTitulo.trim() || !erroCausa.trim()}
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Adicionar erro
              </Button>
            </div>

            {errosSalvos.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-line">
                <p className="text-xs text-muted uppercase tracking-wide">Registrados hoje</p>
                {errosSalvos.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{e.titulo}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={finalizar}>
              {errosSalvos.length > 0 ? "Finalizar →" : "Pular →"}
            </Button>
            <button onClick={() => setStep("dividas")} className="text-sm text-muted hover:text-fg transition">
              ← Voltar
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Síntese IA ── */}
      {step === "sintese" && (
        <div className="space-y-5">
          <div className="space-y-1">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-amber-500" />
              Síntese do dia
            </h2>
            <p className="text-sm text-muted">A IA identificou padrões nas suas dívidas e erros de hoje.</p>
          </div>

          {sinteseLoading && (
            <Card className="flex items-center gap-3 text-sm text-muted py-6 justify-center">
              <span className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              Analisando seu dia…
            </Card>
          )}

          {sinteseError && (
            <Card className="space-y-3">
              <p className="text-sm text-red-500">{sinteseError}</p>
            </Card>
          )}

          {sintese && !sinteseLoading && (
            <div className="space-y-4">
              {/* Padrão detectado */}
              <Card className="space-y-2 border-violet-500/30 bg-violet-500/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Padrão detectado
                </p>
                <p className="text-sm leading-relaxed">{sintese.padrao}</p>
              </Card>

              {/* Foco de amanhã */}
              <Card className="space-y-2 border-amber-500/30 bg-amber-500/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Foco de amanhã
                </p>
                <p className="text-sm leading-relaxed">{sintese.foco}</p>
              </Card>

              {/* Próximos passos */}
              <Card className="space-y-3 border-emerald-500/30 bg-emerald-500/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Próximos passos
                </p>
                <ul className="space-y-2">
                  {sintese.proxPassos.map((passo, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {passo}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={() => setStep("done")}
              disabled={sinteseLoading}
            >
              Concluir →
            </Button>
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {step === "done" && (
        <Card className="text-center py-10 space-y-5">
          <PartyPopper className="w-12 h-12 text-amber-500 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Ritual concluído!</h2>
            <p className="text-muted text-sm">
              Amanhã você não vai precisar lembrar — já está anotado.
            </p>
          </div>

          {(saved.dividas > 0 || saved.erros > 0) && (
            <div className="flex items-center justify-center gap-8">
              {saved.dividas > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-500">{saved.dividas}</p>
                  <p className="text-xs text-muted">dívida{saved.dividas > 1 ? "s" : ""}</p>
                </div>
              )}
              {saved.erros > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{saved.erros}</p>
                  <p className="text-xs text-muted">erro{saved.erros > 1 ? "s" : ""}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            {saved.dividas > 0 && (
              <Link
                href="/divida"
                className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:underline"
              >
                <AlertCircle className="w-4 h-4" />
                Ver dívidas →
              </Link>
            )}
            {saved.erros > 0 && (
              <Link
                href="/biblioteca-erros"
                className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                <BookOpen className="w-4 h-4" />
                Ver erros →
              </Link>
            )}
            <Link href="/" className="text-sm text-muted hover:text-fg transition">
              Ir para o dashboard
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
