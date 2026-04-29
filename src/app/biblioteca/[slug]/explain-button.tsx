"use client";

import { useState } from "react";
import { GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export function ExplainButton({
  cardTitle,
  cardBody,
  category,
}: {
  cardTitle: string;
  cardBody: string;
  category: string;
}) {
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  async function explain() {
    setOpen(true);
    if (explanation) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardTitle, cardBody, category }),
      });
      const data = await res.json() as { explanation?: string; error?: string };
      setExplanation(data.explanation ?? data.error ?? "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={explain}>
        <GraduationCap className="w-4 h-4" /> Explique-me
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-line bg-bg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-500" /> Explicação para júniors
            </h2>
            <p className="text-xs text-muted mt-0.5">{cardTitle} — gerado por GPT-5.4</p>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded text-muted hover:text-fg hover:bg-card-hover transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center gap-3 text-muted py-8 justify-center">
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Gerando explicação com GPT-5.4…
            </div>
          ) : (
            <div className="prose-card">
              <MarkdownRenderer body={explanation} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
