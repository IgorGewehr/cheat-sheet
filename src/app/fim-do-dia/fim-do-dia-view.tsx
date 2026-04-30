"use client";

import { useState } from "react";
import {
  Moon, AlertCircle, Bug, Check, Plus, Trash2,
  ChevronRight, BookOpen, PartyPopper,
} from "lucide-react";
import { clsx } from "clsx";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { createDivida, createErroPersonal } from "@/lib/db";
import Link from "next/link";

type Step = "dividas" | "erros" | "done";

interface DividaEntry { desc: string; ctx: string }
interface ErroEntry   { titulo: string; causa: string }

interface Saved {
  dividas: number;
  erros: number;
}

export function FimDoDiaView() {
  const [step, setStep] = useState<Step>("dividas");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Saved>({ dividas: 0, erros: 0 });

  // Step 1 — Dívidas
  const [dividaDesc, setDividaDesc] = useState("");
  const [dividaCtx, setDividaCtx] = useState("");
  const [dividasSalvas, setDividasSalvas] = useState<string[]>([]);

  // Step 2 — Erros
  const [erroTitulo, setErroTitulo] = useState("");
  const [erroCausa, setErroCausa] = useState("");
  const [errosSalvos, setErrosSalvos] = useState<string[]>([]);

  async function adicionarDivida() {
    if (!dividaDesc.trim()) return;
    setSaving(true);
    try {
      await createDivida({
        descricao: dividaDesc.trim(),
        contexto: dividaCtx.trim() || undefined,
        status: "pendente",
      });
      setDividasSalvas((prev) => [...prev, dividaDesc.trim()]);
      setDividaDesc("");
      setDividaCtx("");
    } finally {
      setSaving(false);
    }
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
    setSaved((prev) => ({ ...prev, dividas: dividasSalvas.length }));
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

      {/* ── Step 1: Dívidas ── */}
      {step === "dividas" && (
        <div className="space-y-5">
          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold">Dívidas de conhecimento</h2>
            </div>
            <p className="text-sm text-muted">
              Hoje você usou algo que não entende de verdade? Anote antes de esquecer.
            </p>

            <div className="space-y-3">
              <div>
                <Label>O que você usou sem entender?</Label>
                <Textarea
                  rows={2}
                  value={dividaDesc}
                  onChange={(e) => setDividaDesc(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) adicionarDivida(); }}
                  placeholder="Ex: Usei Promise.all sem saber o comportamento quando uma falha…"
                />
              </div>
              <div>
                <Label>Contexto (opcional)</Label>
                <Input
                  value={dividaCtx}
                  onChange={(e) => setDividaCtx(e.target.value)}
                  placeholder="Ex: Módulo de pagamentos do saas-erp"
                />
              </div>
              <Button
                variant="secondary"
                onClick={adicionarDivida}
                disabled={saving || !dividaDesc.trim()}
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Adicionar dívida
              </Button>
            </div>

            {dividasSalvas.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-line">
                <p className="text-xs text-muted uppercase tracking-wide">Registradas hoje</p>
                {dividasSalvas.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{d}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={avancarParaErros}>
              {dividasSalvas.length > 0 ? "Próximo →" : "Pular →"}
            </Button>
            {dividasSalvas.length > 0 && (
              <span className="text-sm text-muted">
                {dividasSalvas.length} dívida{dividasSalvas.length > 1 ? "s" : ""} registrada{dividasSalvas.length > 1 ? "s" : ""}
              </span>
            )}
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
