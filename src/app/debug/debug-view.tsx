"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Bug, ChevronDown, ChevronUp, BookOpen, AlertTriangle, ShieldAlert, Zap } from "lucide-react";
import { Button, Card, Label, Textarea, Input } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import type { DebugDiagnosis } from "@/app/api/ai/debug/route";

const SEV_STYLE: Record<string, { border: string; text: string; bg: string; label: string }> = {
  critica: { border: "border-red-500", text: "text-red-400", bg: "bg-red-500/5", label: "Crítica" },
  alta:    { border: "border-orange-500", text: "text-orange-400", bg: "bg-orange-500/5", label: "Alta" },
  media:   { border: "border-amber-500", text: "text-amber-400", bg: "bg-amber-500/5", label: "Média" },
  baixa:   { border: "border-zinc-500", text: "text-zinc-400", bg: "bg-zinc-500/5", label: "Baixa" },
};

const SEV_ICON: Record<string, React.ReactNode> = {
  critica: <ShieldAlert className="w-4 h-4" />,
  alta:    <AlertTriangle className="w-4 h-4" />,
  media:   <AlertTriangle className="w-4 h-4" />,
  baixa:   <Zap className="w-4 h-4" />,
};

function SectionToggle({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-line rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left hover:bg-card-hover transition"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-line">{children}</div>}
    </div>
  );
}

export function DebugView() {
  const [erro, setErro] = useState("");
  const [stackTrace, setStackTrace] = useState("");
  const [codigo, setCodigo] = useState("");
  const [contexto, setContexto] = useState("");
  const [ambiente, setAmbiente] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebugDiagnosis | null>(null);
  const [apiError, setApiError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function diagnosticar() {
    if (!erro.trim()) return;
    setLoading(true);
    setResult(null);
    setApiError("");
    try {
      const res = await fetch("/api/ai/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ erro, stackTrace, codigo, contexto, ambiente }),
      });
      const data = await res.json() as DebugDiagnosis & { error?: string };
      if (data.error) { setApiError(data.error); return; }
      setResult(data);
    } catch {
      setApiError("Erro ao conectar com a API.");
    } finally {
      setLoading(false);
    }
  }

  const sev = result ? (SEV_STYLE[result.severidade] ?? SEV_STYLE.media) : null;

  return (
    <div className="max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <Bug className="w-8 h-8 text-red-500" />
          Debug Assistido
        </h1>
        <p className="text-muted text-sm max-w-2xl">
          Cole o erro e o stack trace. A IA identifica a causa raiz, explica o mecanismo e entrega o fix — não apenas "tente isso".
        </p>
      </header>

      <Card className="space-y-5">
        {/* Erro principal */}
        <div>
          <Label>Mensagem de erro <span className="text-red-400">*</span></Label>
          <Textarea
            rows={3}
            value={erro}
            onChange={e => setErro(e.target.value)}
            placeholder="TypeError: Cannot read properties of undefined (reading 'map')&#10;ou&#10;Error: ECONNREFUSED 127.0.0.1:5432"
            className="font-mono text-sm"
          />
        </div>

        {/* Stack trace */}
        <div>
          <Label>Stack trace <span className="text-muted">(opcional, mas recomendado)</span></Label>
          <Textarea
            rows={5}
            value={stackTrace}
            onChange={e => setStackTrace(e.target.value)}
            placeholder="at Object.<anonymous> (/app/src/service.ts:42:18)&#10;at Module._compile (node:internal/modules/cjs/loader:1364:14)&#10;..."
            className="font-mono text-xs"
          />
        </div>

        {/* Toggle avançado */}
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="text-xs text-muted hover:text-fg flex items-center gap-1 transition"
        >
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showAdvanced ? "Ocultar contexto adicional" : "Adicionar contexto adicional (código, ambiente)"}
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-1">
            <div>
              <Label>Trecho de código relevante</Label>
              <Textarea
                rows={6}
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="function processarPagamento(dados) {&#10;  return dados.itens.map(item => item.valor)&#10;}"
                className="font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>O que você estava tentando fazer</Label>
                <Input
                  value={contexto}
                  onChange={e => setContexto(e.target.value)}
                  placeholder="Ex: processar lista de pagamentos do batch"
                />
              </div>
              <div>
                <Label>Ambiente</Label>
                <Input
                  value={ambiente}
                  onChange={e => setAmbiente(e.target.value)}
                  placeholder="Ex: Node 22, NestJS 10, TypeORM 0.3"
                />
              </div>
            </div>
          </div>
        )}

        {apiError && <p className="text-sm text-red-500">{apiError}</p>}

        <Button
          onClick={diagnosticar}
          disabled={loading || !erro.trim()}
          className="w-full justify-center"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Diagnosticando…
            </>
          ) : (
            <>
              <Bug className="w-4 h-4" />
              Diagnosticar
            </>
          )}
        </Button>
      </Card>

      {/* Resultado */}
      {result && sev && (
        <div className="space-y-4">
          {/* Header do diagnóstico */}
          <div className={clsx("rounded-xl border p-5 space-y-3", sev.border, sev.bg)}>
            <div className="flex items-center gap-3">
              <span className={clsx("flex items-center gap-1.5 text-sm font-bold", sev.text)}>
                {SEV_ICON[result.severidade]}
                Severidade {sev.label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-card-hover text-muted border border-line font-mono">
                {result.categoriaBug}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-1">Causa raiz</p>
              <p className="text-base font-semibold leading-snug">{result.causaRaiz}</p>
            </div>
          </div>

          {/* Explicação */}
          <SectionToggle title="Por que isso acontece">
            <div className="pt-3 text-sm text-muted leading-relaxed prose prose-sm dark:prose-invert max-w-none">
              <MarkdownRenderer body={result.explicacao} />
            </div>
          </SectionToggle>

          {/* Fix */}
          <SectionToggle title="Como corrigir">
            <div className="pt-3 space-y-3">
              <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                <MarkdownRenderer body={result.fix} />
              </div>
              {result.fixCodigo && (
                <pre className="text-xs bg-card-hover border border-line rounded-lg p-4 overflow-x-auto leading-relaxed">
                  <code>{result.fixCodigo}</code>
                </pre>
              )}
            </div>
          </SectionToggle>

          {/* Como evitar */}
          <SectionToggle title="Como evitar no futuro" defaultOpen={false}>
            <div className="pt-3 text-sm text-muted leading-relaxed prose prose-sm dark:prose-invert max-w-none">
              <MarkdownRenderer body={result.comoEvitar} />
            </div>
          </SectionToggle>

          {/* Cards sugeridos */}
          {result.cardsSugeridos && result.cardsSugeridos.length > 0 && (
            <div className="rounded-xl border border-line bg-card p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Cards relacionados na biblioteca
              </p>
              <div className="flex flex-wrap gap-2">
                {result.cardsSugeridos.map(slug => (
                  <Link
                    key={slug}
                    href={`/biblioteca/${slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition"
                  >
                    {slug}
                    <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Nova análise */}
          <Button
            variant="secondary"
            onClick={() => { setResult(null); setErro(""); setStackTrace(""); setCodigo(""); setContexto(""); setAmbiente(""); }}
          >
            Novo diagnóstico
          </Button>
        </div>
      )}
    </div>
  );
}
