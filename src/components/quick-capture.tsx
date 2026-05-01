"use client";

// Decision — aba "Insight":
// Textos que começam ou terminam com "?" são gravados como DividaConhecimento (mesma coleção
// já existente), pois a dúvida/questão é semanticamente uma dívida de conhecimento.
// Textos livres são gravados como ErroPersonal com categorias: ["insight"] e causaRaiz = texto,
// reaproveitando a coleção já existente sem criar coleção nova.  Essa abordagem evita nova
// coleção Firestore e nenhuma migração de schema é necessária.

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Bug, Check, Lightbulb, Plus, X, Zap } from "lucide-react";
import { clsx } from "clsx";
import { createDivida, createErroPersonal } from "@/lib/db";
import { Button, Input, Label, Textarea } from "@/components/ui";

type Tab = "divida" | "erro" | "insight";

export interface QuickCapturePayload {
  tab?: Tab;
  desc?: string;
}

declare global {
  interface WindowEventMap {
    "brain:quick-capture-open": CustomEvent<QuickCapturePayload>;
  }
}

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("divida");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [dividaDesc, setDividaDesc] = useState("");
  const [dividaCtx, setDividaCtx] = useState("");

  const [erroTitulo, setErroTitulo] = useState("");
  const [erroCausa, setErroCausa] = useState("");

  const [insightText, setInsightText] = useState("");

  const formRef = useRef<HTMLDivElement>(null);

  // Global event listener — accepts payload to pre-fill and open
  useEffect(() => {
    function onOpen(e: CustomEvent<QuickCapturePayload>) {
      const { tab: requestedTab, desc } = e.detail ?? {};
      if (requestedTab) setTab(requestedTab);
      if (desc) {
        if (requestedTab === "divida" || !requestedTab) setDividaDesc(desc);
        else if (requestedTab === "erro") setErroTitulo(desc);
        else if (requestedTab === "insight") setInsightText(desc);
      }
      setOpen(true);
    }
    window.addEventListener("brain:quick-capture-open", onOpen);
    return () => window.removeEventListener("brain:quick-capture-open", onOpen);
  }, []);

  // Keyboard shortcut Cmd⇧C
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

  // Auto-focus first field when drawer opens
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
    setInsightText("");
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
      } else if (tab === "insight" && insightText.trim()) {
        const text = insightText.trim();
        const isQuestion = text.startsWith("?") || text.endsWith("?");
        if (isQuestion) {
          // Question-form insight → DividaConhecimento
          await createDivida({
            descricao: text,
            status: "pendente",
          });
        } else {
          // Free-form insight → ErroPersonal com categoria "insight"
          await createErroPersonal({
            titulo: text.slice(0, 80),
            descricao: text,
            categorias: ["insight"],
            causaRaiz: text,
            comoDetectar: "",
            comoPrevenir: "",
          });
        }
        setInsightText("");
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          formRef.current?.querySelector("textarea")?.focus();
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
      : tab === "erro"
      ? erroTitulo.trim().length > 0 && erroCausa.trim().length > 0
      : insightText.trim().length > 0;

  const saveLabel =
    tab === "divida" ? "dívida" : tab === "erro" ? "erro" : "insight";

  if (!open) return null;

  return (
    <>
      {/* Invisible click-outside overlay — no backdrop-blur, no color */}
      <div
        className="fixed inset-0 z-40"
        onClick={close}
        aria-hidden="true"
      />

      {/* Inline drawer — slides in from right, does not block content */}
      <div
        className={clsx(
          "fixed bottom-4 right-4 z-50 w-[380px] rounded-2xl bg-card border border-line shadow-2xl",
          "animate-in slide-in-from-right-4 duration-200",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
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
        <div className="flex border-b border-line px-4">
          <button
            onClick={() => switchTab("divida")}
            className={clsx(
              "flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium border-b-2 transition -mb-px",
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
              "flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium border-b-2 transition -mb-px",
              tab === "erro"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            <Bug className="w-3.5 h-3.5" /> Erro
          </button>
          <button
            onClick={() => switchTab("insight")}
            className={clsx(
              "flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium border-b-2 transition -mb-px",
              tab === "insight"
                ? "border-violet-500 text-violet-600 dark:text-violet-400"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            <Lightbulb className="w-3.5 h-3.5" /> Insight
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-2.5" ref={formRef} onKeyDown={handleKeyDown}>
          {tab === "divida" && (
            <>
              <div>
                <Label>O que você usou sem entender de verdade?</Label>
                <Textarea
                  rows={2}
                  value={dividaDesc}
                  onChange={(e) => setDividaDesc(e.target.value)}
                  placeholder="Ex: Usei JWT sem entender rotação de refresh tokens"
                />
              </div>
              <div>
                <Label>Onde usou? (opcional)</Label>
                <Input
                  value={dividaCtx}
                  onChange={(e) => setDividaCtx(e.target.value)}
                  placeholder="Ex: Módulo de auth do saas-erp"
                />
              </div>
            </>
          )}

          {tab === "erro" && (
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
                  placeholder="Ex: ORM fazia query por item do loop"
                />
              </div>
            </>
          )}

          {tab === "insight" && (
            <div>
              <Label>Pensamento livre</Label>
              <Textarea
                rows={3}
                value={insightText}
                onChange={(e) => setInsightText(e.target.value)}
                placeholder={'Comece/termine com "?" para gravar como dívida. Texto livre vira nota.'}
              />
              <p className="mt-1 text-[10px] text-muted">
                {insightText.trim().startsWith("?") || insightText.trim().endsWith("?")
                  ? "→ Será gravado como dívida de conhecimento"
                  : insightText.trim()
                  ? "→ Será gravado como nota de insight"
                  : "Comece ou termine com ? para gravar como dívida"}
              </p>
            </div>
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
                  Salvar {saveLabel}
                </>
              )}
            </Button>
            <p className="text-xs text-muted">⌘↵ para salvar</p>
          </div>
        </div>
      </div>
    </>
  );
}
