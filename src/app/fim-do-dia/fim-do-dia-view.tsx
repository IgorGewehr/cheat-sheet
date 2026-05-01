"use client";

import { useEffect, useState } from "react";
import {
  Moon, AlertCircle, Bug, Check, Plus, Trash2,
  ChevronRight, BookOpen, PartyPopper, Zap,
} from "lucide-react";
import { clsx } from "clsx";
import { Button, Card, Label, Textarea, Input } from "@/components/ui";
import { listDividas, listErrosPersonais, createErroPersonal } from "@/lib/db";
import type { DividaConhecimento, ErroPersonal } from "@/lib/types";
import type { QuickCapturePayload } from "@/components/quick-capture";
import Link from "next/link";

type Step = "dividas" | "erros" | "done";

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
  const [errosSalvos, setErrosSalvos] = useState<string[]>([]);

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
      setErrosSalvos((prev) => [...prev, erroTitulo.trim()]);
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

  function finalizar() {
    setSaved((prev) => ({ ...prev, erros: errosSalvos.length }));
    setStep("done");
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
        {(["dividas", "erros", "done"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={clsx(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition",
                step === s
                  ? "bg-amber-500 border-amber-500 text-zinc-950"
                  : (["dividas", "erros", "done"] as Step[]).indexOf(s) < (["dividas", "erros", "done"] as Step[]).indexOf(step)
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                  : "border-line text-muted",
              )}
            >
              {(["dividas", "erros", "done"] as Step[]).indexOf(s) < (["dividas", "erros", "done"] as Step[]).indexOf(step)
                ? <Check className="w-3.5 h-3.5" />
                : i + 1}
            </div>
            <span className={clsx("text-sm hidden sm:inline", step === s ? "text-fg font-medium" : "text-muted")}>
              {s === "dividas" ? "Dívidas" : s === "erros" ? "Erros" : "Pronto"}
            </span>
            {i < 2 && <ChevronRight className="w-4 h-4 text-muted shrink-0" />}
          </div>
        ))}
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
                    <span className="line-clamp-1">{e}</span>
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
