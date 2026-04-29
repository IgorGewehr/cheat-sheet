"use client";

import { useState } from "react";
import { Sparkles, X, Copy, Check } from "lucide-react";
import { Button, Label, Textarea } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export function AIReviewButton({
  cardTitle,
  stack,
}: {
  cardTitle: string;
  stack: string[];
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function runReview() {
    if (!code.trim() || loading) return;
    setLoading(true);
    setReview("");
    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, patterns: [cardTitle], stack }),
      });
      const data = await res.json() as { review?: string; error?: string };
      setReview(data.review ?? data.error ?? "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function copyReview() {
    await navigator.clipboard.writeText(review);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Sparkles className="w-4 h-4" /> Review com IA
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-line bg-bg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Review com GPT-5.5
            </h2>
            <p className="text-xs text-muted mt-0.5">Padrão verificado: {cardTitle}</p>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded text-muted hover:text-fg hover:bg-card-hover transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!review ? (
            <div className="space-y-3">
              <div>
                <Label>Cole o código ou diff do PR aqui</Label>
                <Textarea
                  rows={12}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// Cole seu código, função, módulo ou diff aqui…"
                  className="font-mono text-xs"
                />
              </div>
              <Button onClick={runReview} disabled={!code.trim() || loading} className="w-full">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Analisando com GPT-5.5…
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Revisar código
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-emerald-500">Revisão completa</p>
                <div className="flex gap-2">
                  <button
                    onClick={copyReview}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-fg transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                  <button
                    onClick={() => setReview("")}
                    className="text-xs text-muted hover:text-fg transition"
                  >
                    Revisar outro
                  </button>
                </div>
              </div>
              <div className="prose-card">
                <MarkdownRenderer body={review} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
