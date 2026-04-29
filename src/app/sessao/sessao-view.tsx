"use client";

import { useState } from "react";
import {
  Zap, Copy, Check, ChevronRight, AlertTriangle,
  BookOpen, ListChecks, Sparkles, ExternalLink
} from "lucide-react";
import { Button, Card, Input, Label, Tag, Textarea } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import Link from "next/link";
import type { BriefingResult } from "@/app/api/ai/briefing/route";

const DOMAINS = [
  { id: "auth",         label: "Auth & Permissões",    color: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30" },
  { id: "banco",        label: "Banco & Persistência", color: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30" },
  { id: "api",          label: "API & Endpoints",       color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { id: "frontend",     label: "Frontend & UI",         color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { id: "infra",        label: "Infra & Deploy",        color: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30" },
  { id: "multi-tenant", label: "Multi-tenant",          color: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30" },
  { id: "filas",        label: "Filas & Background",    color: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30" },
  { id: "financeiro",   label: "Financeiro & Contábil", color: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30" },
];

export function SessaoView() {
  const [task, setTask] = useState("");
  const [stack, setStack] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BriefingResult | null>(null);
  const [error, setError] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<"prompt" | "patterns" | "checklist">("prompt");

  function toggleDomain(id: string) {
    setSelectedDomains((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  async function generate() {
    if (!task.trim() || selectedDomains.length === 0) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/ai/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, domains: selectedDomains, stack: stack || undefined }),
      });
      const data = await res.json() as BriefingResult & { error?: string };
      if (data.error) { setError(data.error); return; }
      setResult(data);
      setActiveTab("prompt");
    } catch {
      setError("Erro ao conectar com a API. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPrompt() {
    if (!result) return;
    await navigator.clipboard.writeText(result.systemPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  }

  const canGenerate = task.trim().length > 0 && selectedDomains.length > 0;

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <Zap className="w-8 h-8 text-amber-500" />
          Sessão com IA
        </h1>
        <p className="text-muted max-w-2xl">
          Preencha o que você vai construir e o brain gera um{" "}
          <strong>briefing sênior</strong> — instruções para o Cursor, Claude ou Copilot
          que encoda padrões, armadilhas e critérios de aceite do zero.
        </p>
      </header>

      {/* Form */}
      <Card className="space-y-5">
        <div>
          <Label>O que você vai pedir pra IA implementar?</Label>
          <Textarea
            rows={3}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Ex: Módulo de pagamentos com Stripe — webhook de confirmação, endpoint de reembolso e histórico de transações por cliente"
          />
        </div>

        <div>
          <Label>Stack do projeto (opcional)</Label>
          <Input
            value={stack}
            onChange={(e) => setStack(e.target.value)}
            placeholder="Ex: NestJS, PostgreSQL, Prisma, Next.js 15"
          />
        </div>

        <div>
          <Label>Quais domínios essa tarefa envolve?</Label>
          <p className="text-xs text-subtle mb-2">Selecione ao menos um para habilitar a geração</p>
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                onClick={() => toggleDomain(d.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  selectedDomains.includes(d.id)
                    ? d.color + " border-current"
                    : "border-line text-muted hover:border-line-strong hover:text-fg"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={generate}
          disabled={loading || !canGenerate}
          className="w-full justify-center"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Gerando briefing com GPT-5.5…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Gerar Briefing Sênior
            </>
          )}
        </Button>

        {!canGenerate && !loading && (
          <p className="text-xs text-subtle text-center">
            {!task.trim() ? "Descreva a tarefa" : "Selecione ao menos um domínio"} para continuar
          </p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </Card>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-line">
            {(["prompt", "patterns", "checklist"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                  activeTab === tab
                    ? "border-amber-500 text-fg"
                    : "border-transparent text-muted hover:text-fg"
                }`}
              >
                {tab === "prompt"    && <><Sparkles className="inline w-3.5 h-3.5 mr-1.5" />Instruções para IA</>}
                {tab === "patterns"  && <><BookOpen className="inline w-3.5 h-3.5 mr-1.5" />Padrões ({result.selectedPatterns.length})</>}
                {tab === "checklist" && <><ListChecks className="inline w-3.5 h-3.5 mr-1.5" />Checklist ({result.checklist.length})</>}
              </button>
            ))}
          </div>

          {/* System Prompt Tab */}
          {activeTab === "prompt" && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Instruções para colar na sua IA</p>
                  <p className="text-xs text-muted mt-1">
                    Cursor: abra <kbd className="px-1 py-0.5 rounded border border-line text-[10px]">⌘,</kbd> → Rules for AI &nbsp;·&nbsp;
                    Claude: cole no início do chat &nbsp;·&nbsp;
                    Copilot: <code className="text-[10px]">.github/copilot-instructions.md</code>
                  </p>
                </div>
                <Button variant="secondary" onClick={copyPrompt} className="shrink-0">
                  {copiedPrompt
                    ? <><Check className="w-4 h-4 text-emerald-500" /> Copiado!</>
                    : <><Copy className="w-4 h-4" /> Copiar</>}
                </Button>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 prose-card max-h-[500px] overflow-y-auto">
                <MarkdownRenderer body={result.systemPrompt} />
              </div>

              {/* Armadilhas inline */}
              {result.armadilhas.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4" /> Armadilhas neste domínio — verifique após a IA codificar
                  </p>
                  {result.armadilhas.map((a) => (
                    <div key={a.slug} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                      <div className="min-w-0">
                        <Link
                          href={`/biblioteca/${a.slug}`}
                          className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                        >
                          {a.title} <ExternalLink className="w-3 h-3" />
                        </Link>
                        <p className="text-xs text-muted mt-0.5">{a.warning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Patterns Tab */}
          {activeTab === "patterns" && (
            <div className="space-y-3">
              <p className="text-sm text-muted">Padrões críticos para esta tarefa — clique para ler o card completo:</p>
              {result.selectedPatterns.map((p, i) => (
                <div key={p.slug} className="flex items-start gap-4 p-4 rounded-xl border border-line bg-card hover:border-amber-500/40 transition">
                  <span className="text-2xl font-semibold text-subtle/40 w-8 shrink-0 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/biblioteca/${p.slug}`}
                      className="font-medium hover:text-amber-600 dark:hover:text-amber-400 transition flex items-center gap-1.5"
                    >
                      {p.title} <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <p className="text-sm text-muted mt-1">{p.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Checklist Tab */}
          {activeTab === "checklist" && (
            <div className="space-y-3">
              <p className="text-sm text-muted">Após a IA gerar o código, marque cada item antes de fazer merge:</p>
              <div className="space-y-2">
                {result.checklist.map((item, i) => (
                  <ChecklistItem key={i} text={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <button
      onClick={() => setChecked((v) => !v)}
      className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition ${
        checked
          ? "border-emerald-500/30 bg-emerald-500/5 text-muted line-through"
          : "border-line bg-card hover:border-line-strong"
      }`}
    >
      <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
        checked ? "border-emerald-500 bg-emerald-500" : "border-line-strong"
      }`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </span>
      <span className="text-sm">{text}</span>
    </button>
  );
}
