"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Copy, Check, ChevronRight, Wand2, Plus } from "lucide-react";
import { Button, Card, Input, Label, Tag, Textarea } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import Link from "next/link";

type CardLite = { slug: string; title: string; body: string; stack: string[] };
type VarMap = Record<string, string>;

function extractVars(template: string): string[] {
  const matches = template.match(/\{\{([^}]+)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "").trim()))];
}

function fillTemplate(template: string, vars: VarMap): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => vars[key.trim()] || `{{${key.trim()}}}`);
}

export function PromptBuilder({ cards }: { cards: CardLite[] }) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(cards[0]?.slug ?? null);
  const [vars, setVars] = useState<VarMap>({});
  const [filled, setFilled] = useState("");
  const [enhanced, setEnhanced] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [copied, setCopied] = useState<"filled" | "enhanced" | null>(null);
  const [projectContext, setProjectContext] = useState({ projectName: "", stack: "", module: "" });
  const [showRaw, setShowRaw] = useState(false);

  const selected = useMemo(() => cards.find((c) => c.slug === selectedSlug), [cards, selectedSlug]);
  const variables = useMemo(() => (selected ? extractVars(selected.body) : []), [selected]);

  useEffect(() => {
    if (!selected) return;
    const newVars: VarMap = {};
    for (const v of extractVars(selected.body)) newVars[v] = "";
    setVars(newVars);
    setFilled("");
    setEnhanced("");
  }, [selectedSlug]); // eslint-disable-line

  function generateFilled() {
    if (!selected) return;
    setFilled(fillTemplate(selected.body, vars));
    setEnhanced("");
  }

  async function enhanceWithAI() {
    if (!filled || enhancing) return;
    setEnhancing(true);
    try {
      const res = await fetch("/api/ai/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: filled,
          context: {
            projectName: projectContext.projectName || undefined,
            stack: projectContext.stack ? projectContext.stack.split(",").map((s) => s.trim()) : undefined,
            module: projectContext.module || undefined,
          },
        }),
      });
      const data = await res.json() as { enhanced?: string; error?: string };
      setEnhanced(data.enhanced ?? data.error ?? "Erro inesperado.");
    } finally {
      setEnhancing(false);
    }
  }

  async function copy(text: string, type: "filled" | "enhanced") {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-amber-500" />
          Prompt Builder
        </h1>
        <p className="text-muted max-w-2xl">
          Selecione um template, preencha as variáveis e deixe o GPT-5.4 turbinar o prompt
          com edge cases, contexto técnico e critérios de aceite.
        </p>
      </header>

      {cards.length === 0 ? (
        <Card>
          <p className="text-muted mb-3">Nenhum template de prompt encontrado na Biblioteca.</p>
          <p className="text-xs text-subtle mb-4">
            Adicione cards com categoria <code>prompts</code> na pasta <code>src/content/prompts/</code>
            ou crie cards próprios.
          </p>
          <Link href="/cards/novo" className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:underline">
            <Plus className="w-4 h-4" /> Criar card de prompt
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <aside className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-2 px-1">
              Templates ({cards.length})
            </p>
            {cards.map((c) => (
              <button
                key={c.slug}
                onClick={() => setSelectedSlug(c.slug)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition flex items-center justify-between gap-2 text-sm border ${
                  c.slug === selectedSlug
                    ? "border-amber-500/50 bg-amber-500/10 text-fg"
                    : "border-transparent text-muted hover:bg-card-hover hover:text-fg"
                }`}
              >
                <span className="truncate">{c.title}</span>
                {c.slug === selectedSlug && <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />}
              </button>
            ))}
            <Link
              href="/cards/novo"
              className="flex items-center gap-1.5 text-xs text-muted hover:text-amber-500 transition px-3 py-2 mt-1"
            >
              <Plus className="w-3 h-3" /> Adicionar template
            </Link>
          </aside>

          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {!selected ? (
              <Card><p className="text-muted text-sm">Selecione um template à esquerda.</p></Card>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{selected.title}</h2>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selected.stack.map((s) => <Tag key={s} color="sky">{s}</Tag>)}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRaw((v) => !v)}
                    className="text-xs text-muted hover:text-fg transition shrink-0"
                  >
                    {showRaw ? "Ocultar raw" : "Ver template raw"}
                  </button>
                </div>

                {showRaw && (
                  <div className="rounded-xl border border-line bg-card p-4 max-h-60 overflow-y-auto">
                    <pre className="text-xs text-muted whitespace-pre-wrap">{selected.body}</pre>
                  </div>
                )}

                {/* Context */}
                <Card>
                  <p className="text-sm font-medium mb-3">Contexto do projeto (opcional)</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Projeto</Label>
                      <Input
                        value={projectContext.projectName}
                        onChange={(e) => setProjectContext((p) => ({ ...p, projectName: e.target.value }))}
                        placeholder="ERP Contábil"
                      />
                    </div>
                    <div>
                      <Label>Stack</Label>
                      <Input
                        value={projectContext.stack}
                        onChange={(e) => setProjectContext((p) => ({ ...p, stack: e.target.value }))}
                        placeholder="Next.js, NestJS, PostgreSQL"
                      />
                    </div>
                    <div>
                      <Label>Módulo</Label>
                      <Input
                        value={projectContext.module}
                        onChange={(e) => setProjectContext((p) => ({ ...p, module: e.target.value }))}
                        placeholder="módulo financeiro"
                      />
                    </div>
                  </div>
                </Card>

                {/* Variables */}
                {variables.length > 0 ? (
                  <Card>
                    <p className="text-sm font-medium mb-3">
                      Variáveis do template ({variables.length})
                    </p>
                    <div className="space-y-3">
                      {variables.map((v) => (
                        <div key={v}>
                          <Label>{`{{${v}}}`}</Label>
                          <Textarea
                            rows={2}
                            value={vars[v] ?? ""}
                            onChange={(e) => setVars((prev) => ({ ...prev, [v]: e.target.value }))}
                            placeholder={`Valor para ${v}…`}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <p className="text-xs text-muted">
                    Nenhuma variável <code>{"{{variavel}}"}</code> encontrada neste template.
                  </p>
                )}

                <div className="flex gap-3 flex-wrap">
                  <Button onClick={generateFilled}>
                    Gerar prompt preenchido
                  </Button>
                  {filled && (
                    <Button
                      variant="secondary"
                      onClick={enhanceWithAI}
                      disabled={enhancing}
                    >
                      {enhancing ? (
                        <>
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Turbinando com GPT-5.4…
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" /> Turbinar com GPT-5.4
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {filled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Prompt preenchido</p>
                      <button
                        onClick={() => copy(filled, "filled")}
                        className="flex items-center gap-1.5 text-xs text-muted hover:text-fg transition"
                      >
                        {copied === "filled" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === "filled" ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                    <div className="rounded-xl border border-line bg-card p-4 prose-card max-h-80 overflow-y-auto">
                      <MarkdownRenderer body={filled} />
                    </div>
                  </div>
                )}

                {enhanced && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" /> Prompt turbinado pelo GPT-5.4
                      </p>
                      <button
                        onClick={() => copy(enhanced, "enhanced")}
                        className="flex items-center gap-1.5 text-xs text-muted hover:text-fg transition"
                      >
                        {copied === "enhanced" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === "enhanced" ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 prose-card max-h-[500px] overflow-y-auto">
                      <MarkdownRenderer body={enhanced} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
