"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Bug, Check, Plus, X, Zap } from "lucide-react";
import { clsx } from "clsx";
import { createDivida, createErroPersonal } from "@/lib/db";
import { Button, Input, Label, Textarea } from "@/components/ui";

type Tab = "divida" | "erro";

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("divida");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [dividaDesc, setDividaDesc] = useState("");
  const [dividaCtx, setDividaCtx] = useState("");

  const [erroTitulo, setErroTitulo] = useState("");
  const [erroCausa, setErroCausa] = useState("");

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setSaved(false);
      setTimeout(() => {
        const el = formRef.current?.querySelector("textarea, input") as HTMLElement | null;
        el?.focus();
      }, 60);
    }
  }, [open, tab]);

  function close() {
    setOpen(false);
    setDividaDesc("");
    setDividaCtx("");
    setErroTitulo("");
    setErroCausa("");
    setSaved(false);
  }

  function switchTab(t: Tab) {
    setTab(t);
    setSaved(false);
  }

  async function submit() {
    setSaving(true);
    try {
      if (tab === "divida" && dividaDesc.trim()) {
        await createDivida({
          descricao: dividaDesc.trim(),
          contexto: dividaCtx.trim() || undefined,
          status: "pendente",
        });
        setDividaDesc("");
        setDividaCtx("");
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          formRef.current?.querySelector("textarea")?.focus();
        }, 1800);
      } else if (tab === "erro" && erroTitulo.trim() && erroCausa.trim()) {
        await createErroPersonal({
          titulo: erroTitulo.trim(),
          descricao: "",
          categorias: ["geral"],
          causaRaiz: erroCausa.trim(),
          comoDetectar: "",
          comoPrevenir: "",
        });
        setErroTitulo("");
        setErroCausa("");
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          formRef.current?.querySelector("input")?.focus();
        }, 1800);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      await submit();
    }
  }

  const canSubmit =
    tab === "divida"
      ? dividaDesc.trim().length > 0
      : erroTitulo.trim().length > 0 && erroCausa.trim().length > 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-card border border-line shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-sm">Captura rápida</span>
            <kbd className="text-[10px] text-muted border border-line rounded px-1 py-0.5 font-mono">⌘⇧C</kbd>
          </div>
          <button onClick={close} className="text-muted hover:text-fg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line px-5">
          <button
            onClick={() => switchTab("divida")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition -mb-px",
              tab === "divida"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            <AlertCircle className="w-3.5 h-3.5" /> Dívida
          </button>
          <button
            onClick={() => switchTab("erro")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition -mb-px",
              tab === "erro"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            <Bug className="w-3.5 h-3.5" /> Erro
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-3" ref={formRef} onKeyDown={handleKeyDown}>
          {tab === "divida" ? (
            <>
              <div>
                <Label>O que você usou sem entender de verdade?</Label>
                <Textarea
                  rows={3}
                  value={dividaDesc}
                  onChange={(e) => setDividaDesc(e.target.value)}
                  placeholder="Ex: Usei JWT sem entender rotação de refresh tokens"
                />
              </div>
              <div>
                <Label>Onde usou? (opcional)</Label>
                <Textarea
                  rows={2}
                  value={dividaCtx}
                  onChange={(e) => setDividaCtx(e.target.value)}
                  placeholder="Ex: Módulo de auth do saas-erp"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label>O que deu errado?</Label>
                <Input
                  value={erroTitulo}
                  onChange={(e) => setErroTitulo(e.target.value)}
                  placeholder="Ex: N+1 query destruiu performance em produção"
                />
              </div>
              <div>
                <Label>Causa raiz</Label>
                <Textarea
                  rows={2}
                  value={erroCausa}
                  onChange={(e) => setErroCausa(e.target.value)}
                  placeholder="Ex: ORM fazia query por item do loop sem que eu percebesse"
                />
              </div>
            </>
          )}

          {saved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4" />
              Salvo! Pode registrar outro ou fechar.
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={submit} disabled={saving || !canSubmit}>
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Salvando…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Salvar {tab === "divida" ? "dívida" : "erro"}
                </>
              )}
            </Button>
            <p className="text-xs text-muted">⌘↵ para salvar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
