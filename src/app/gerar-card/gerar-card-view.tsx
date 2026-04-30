"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  Sparkles, ChevronDown, ChevronUp, Save, Check,
  BookOpen, Scale, Plus, Wand2,
} from "lucide-react";
import { Button, Card, Label, Select, Tag, Textarea } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { createCustomCard } from "@/lib/db";
import { CATEGORY_LABEL, type CardCategory } from "@/lib/types";
import { getActiveProject } from "@/lib/active-project";
import type { CardGerado } from "@/app/api/ai/gerar-card/route";
import Link from "next/link";

const STACK_PRESETS = [
  "Python", "Pandas", "Scikit-learn", "PyTorch", "TensorFlow",
  "Next.js", "NestJS", "PostgreSQL", "FastAPI", "Docker",
  "Go", "Firebase", "LangChain", "LangGraph",
];

const GERABLE_CATEGORIES: CardCategory[] = [
  "arquiteturas", "padroes-frontend", "padroes-backend", "banco",
  "infra", "testes", "craft", "agentes-ia", "data-science",
];

interface CardState {
  card: CardGerado;
  saving: boolean;
  savedId: string | null;
}

export function GerarCardView() {
  const [contexto, setContexto] = useState("");
  const [categoria, setCategoria] = useState<CardCategory | "">("");
  const [stack, setStack] = useState<string[]>([]);
  const [quantidade, setQuantidade] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cards, setCards] = useState<CardState[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [savedAny, setSavedAny] = useState(false);

  function toggleStack(s: string) {
    setStack((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  async function gerar() {
    if (!contexto.trim()) return;
    setLoading(true);
    setError("");
    setCards([]);
    setSavedAny(false);
    try {
      const activeProject = getActiveProject();
      const res = await fetch("/api/ai/gerar-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contexto: contexto.trim(),
          categoria: categoria || undefined,
          stack: stack.length ? stack : activeProject?.stack,
          quantidade,
        }),
      });
      const data = await res.json() as { cards?: CardGerado[]; error?: string };
      if (data.error || !data.cards?.length) {
        setError(data.error ?? "Nenhum card gerado.");
        return;
      }
      setCards(data.cards.map((c) => ({ card: c, saving: false, savedId: null })));
      setExpanded(0);
    } catch {
      setError("Erro ao conectar com a API.");
    } finally {
      setLoading(false);
    }
  }

  async function salvar(index: number) {
    const state = cards[index];
    if (state.saving || state.savedId) return;
    setCards((prev) => prev.map((s, i) => i === index ? { ...s, saving: true } : s));
    try {
      const saved = await createCustomCard({
        title: state.card.title,
        category: state.card.category,
        stack: state.card.stack,
        tags: state.card.tags,
        excerpt: state.card.excerpt,
        body: state.card.body,
      });
      setCards((prev) => prev.map((s, i) => i === index ? { ...s, saving: false, savedId: saved.id } : s));
      setSavedAny(true);
    } catch {
      setCards((prev) => prev.map((s, i) => i === index ? { ...s, saving: false } : s));
    }
  }

  const savedIds = cards.filter((c) => c.savedId).map((c) => c.savedId!);

  return (
    <div className="max-w-4xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-amber-500" />
          Gerar Cards com IA
        </h1>
        <p className="text-muted max-w-2xl">
          Descreva um problema, feature ou dúvida. A IA gera cards de conhecimento com as abordagens disponíveis — cada uma com trade-offs, implementação e armadilhas. Salve os que fazem sentido na sua biblioteca.
        </p>
      </header>

      {/* Form */}
      <Card className="space-y-5">
        <div>
          <Label>Descreva o contexto ou problema</Label>
          <Textarea
            rows={4}
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            placeholder="Ex: Quero implementar uma lista de clientes com busca e paginação. Temos ~50k registros. Stack: Next.js + PostgreSQL. Quais as melhores abordagens?"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Categoria (opcional)</Label>
            <Select value={categoria} onChange={(e) => setCategoria(e.target.value as CardCategory | "")}>
              <option value="">— IA decide —</option>
              {GERABLE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Quantidade de cards</Label>
            <Select value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))}>
              <option value={2}>2 abordagens</option>
              <option value={3}>3 abordagens</option>
              <option value={4}>4 abordagens</option>
            </Select>
          </div>
        </div>

        <div>
          <Label>Stack (opcional)</Label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {STACK_PRESETS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleStack(s)}
                className={clsx(
                  "px-2.5 py-1 rounded text-xs border transition",
                  stack.includes(s)
                    ? "bg-amber-500 text-zinc-950 border-amber-400"
                    : "bg-card text-muted border-line hover:border-line-strong",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          onClick={gerar}
          disabled={loading || !contexto.trim()}
          className="w-full justify-center"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Gerando {quantidade} abordagens…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Gerar Cards
            </>
          )}
        </Button>
      </Card>

      {/* Generated cards */}
      {cards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {cards.length} abordagens geradas
            </h2>
            {savedAny && savedIds.length >= 2 && (
              <Link
                href={`/comparar`}
                className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:underline"
              >
                <Scale className="w-4 h-4" />
                Comparar na biblioteca →
              </Link>
            )}
          </div>

          {cards.map((state, i) => {
            const { card, saving, savedId } = state;
            const isExpanded = expanded === i;
            return (
              <Card key={i} className={clsx("p-0 overflow-hidden", savedId && "border-amber-500/40")}>
                {/* Card header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : i)}
                  className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-card-hover transition"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-fg">{card.title}</span>
                      {savedId && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag color="amber">{CATEGORY_LABEL[card.category] ?? card.category}</Tag>
                      {card.stack.slice(0, 3).map((s) => (
                        <span key={s} className="text-[11px] text-muted border border-line rounded px-1.5 py-0.5">{s}</span>
                      ))}
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{card.excerpt}</p>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-muted shrink-0 mt-1" />
                    : <ChevronDown className="w-4 h-4 text-muted shrink-0 mt-1" />}
                </button>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="border-t border-line">
                    <div className="px-5 py-4 prose prose-sm dark:prose-invert max-w-none max-h-[500px] overflow-y-auto">
                      <MarkdownRenderer body={card.body} />
                    </div>
                    <div className="px-5 py-3 border-t border-line flex items-center gap-3 bg-card-hover/50">
                      {savedId ? (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                          <Check className="w-4 h-4" />
                          Salvo na biblioteca
                          <Link href={`/biblioteca/${savedId}`} className="text-amber-600 dark:text-amber-400 hover:underline ml-1">
                            ver card →
                          </Link>
                        </div>
                      ) : (
                        <Button variant="secondary" onClick={() => salvar(i)} disabled={saving}>
                          {saving ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><Save className="w-4 h-4" /> Salvar na biblioteca</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {savedAny && (
            <div className="flex items-center gap-4 pt-2">
              <Link
                href="/biblioteca"
                className="flex items-center gap-1.5 text-sm text-muted hover:text-fg transition"
              >
                <BookOpen className="w-4 h-4" />
                Ver biblioteca com cards salvos →
              </Link>
              <button
                onClick={() => { setCards([]); setContexto(""); setSavedAny(false); }}
                className="flex items-center gap-1.5 text-sm text-muted hover:text-fg transition"
              >
                <Plus className="w-4 h-4" />
                Gerar novos cards
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
