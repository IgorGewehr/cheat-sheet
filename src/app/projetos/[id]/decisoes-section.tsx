"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ChevronDown, ChevronUp, BookOpen, Wand2, Sparkles } from "lucide-react";
import { Button, Card, Input, Label, Tag, Textarea } from "@/components/ui";
import {
  createDecisao,
  deleteDecisao,
  subscribeDecisoes,
  updateDecisaoStatus,
} from "@/lib/db";
import type { Decisao } from "@/lib/types";

const STATUS_LABEL: Record<Decisao["status"], string> = {
  proposta: "Proposta",
  aceita: "Aceita",
  depreciada: "Depreciada",
};

const STATUS_COLOR: Record<Decisao["status"], string> = {
  proposta: "amber",
  aceita: "emerald",
  depreciada: "zinc",
} as const;

const STATUS_CYCLE: Decisao["status"][] = ["proposta", "aceita", "depreciada"];

type TagColor = "zinc" | "amber" | "emerald" | "sky" | "violet";
type CardLite = { slug: string; title: string };

const emptyForm = {
  titulo: "",
  contexto: "",
  decisao: "",
  consequencias: "",
  status: "proposta" as Decisao["status"],
  cardSlugs: [] as string[],
};

export function DecisoesSection({
  projetoId,
  cards = [],
  projetoStack = [],
}: {
  projetoId: string;
  cards?: CardLite[];
  projetoStack?: string[];
}) {
  const [decisoes, setDecisoes] = useState<Decisao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cardSearch, setCardSearch] = useState("");

  // AI ADR generation
  const [aiProblema, setAiProblema] = useState("");
  const [aiContexto, setAiContexto] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeDecisoes(projetoId, (d) => {
      setDecisoes(d);
      setLoading(false);
    });
    return () => unsub();
  }, [projetoId]);

  async function salvar() {
    if (!form.titulo.trim() || !form.decisao.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createDecisao({ ...form, projetoId });
      setForm(emptyForm);
      setCardSearch("");
      setShowForm(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar decisão.");
    } finally {
      setSaving(false);
    }
  }

  async function gerarADR() {
    if (!aiProblema.trim() || generating) return;
    setGenerating(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/generate-adr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problema: aiProblema,
          stack: projetoStack.length > 0 ? projetoStack : undefined,
          contextoAdicional: aiContexto || undefined,
        }),
      });
      const data = await res.json() as {
        titulo?: string;
        contexto?: string;
        decisao?: string;
        consequencias?: string;
        error?: string;
      };
      if (data.error) {
        setAiError(data.error);
        return;
      }
      setForm((f) => ({
        ...f,
        titulo: data.titulo ?? f.titulo,
        contexto: data.contexto ?? f.contexto,
        decisao: data.decisao ?? f.decisao,
        consequencias: data.consequencias ?? f.consequencias,
      }));
      setShowAI(false);
      setAiProblema("");
      setAiContexto("");
    } finally {
      setGenerating(false);
    }
  }

  async function cycleStatus(d: Decisao) {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(d.status) + 1) % STATUS_CYCLE.length];
    // Optimistic update — subscription will confirm
    setDecisoes((prev) => prev.map((x) => (x.id === d.id ? { ...x, status: next } : x)));
    await updateDecisaoStatus(d.id, next);
  }

  async function remover(id: string) {
    if (!confirm("Apagar esta decisão?")) return;
    await deleteDecisao(id);
  }

  function toggleCardSlug(slug: string) {
    setForm((f) => {
      const exists = f.cardSlugs.includes(slug);
      return {
        ...f,
        cardSlugs: exists ? f.cardSlugs.filter((s) => s !== slug) : [...f.cardSlugs, slug],
      };
    });
  }

  const filteredCards = cards.filter(
    (c) =>
      cardSearch.trim() === "" ||
      c.title.toLowerCase().includes(cardSearch.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
          Decisões (ADR) · {decisoes.length}
        </p>
        <Button variant="ghost" className="text-xs h-7 px-2" onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-3.5 h-3.5" /> Nova decisão
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="space-y-3">

            {/* AI ADR Generator toggle */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <button
                onClick={() => setShowAI((v) => !v)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  Gerar rascunho com GPT-5.4
                </span>
                <span className="text-xs text-muted">{showAI ? "fechar" : "expandir"}</span>
              </button>

              {showAI && (
                <div className="mt-3 space-y-2.5 border-t border-amber-500/20 pt-3">
                  <div>
                    <Label>Descreva o problema técnico</Label>
                    <Textarea
                      rows={2}
                      value={aiProblema}
                      onChange={(e) => setAiProblema(e.target.value)}
                      placeholder={`Ex: "Preciso decidir entre usar JWT stateless ou sessions com Redis para auth. Temos ~50k usuários e precisamos de revogação imediata de tokens"`}
                    />
                  </div>
                  <div>
                    <Label>Contexto adicional (opcional)</Label>
                    <Input
                      value={aiContexto}
                      onChange={(e) => setAiContexto(e.target.value)}
                      placeholder="Ex: Time pequeno, deploy na Vercel, sem Redis disponível"
                    />
                  </div>
                  {aiError && <p className="text-xs text-red-500">{aiError}</p>}
                  <Button
                    onClick={gerarADR}
                    disabled={!aiProblema.trim() || generating}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Gerando ADR…
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" /> Gerar rascunho
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label>Título</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="ex: Usar Drizzle em vez de Prisma"
              />
            </div>
            <div>
              <Label>Contexto / Problema</Label>
              <Textarea
                rows={2}
                value={form.contexto}
                onChange={(e) => setForm((f) => ({ ...f, contexto: e.target.value }))}
                placeholder="Por que essa decisão precisou ser tomada?"
              />
            </div>
            <div>
              <Label>Decisão</Label>
              <Textarea
                rows={2}
                value={form.decisao}
                onChange={(e) => setForm((f) => ({ ...f, decisao: e.target.value }))}
                placeholder="O que foi decidido e por quê."
              />
            </div>
            <div>
              <Label>Consequências</Label>
              <Textarea
                rows={2}
                value={form.consequencias}
                onChange={(e) => setForm((f) => ({ ...f, consequencias: e.target.value }))}
                placeholder="Impactos positivos e negativos esperados."
              />
            </div>

            {/* Card linking */}
            {cards.length > 0 && (
              <div>
                <Label>Padrões relacionados (opcional)</Label>
                <Input
                  value={cardSearch}
                  onChange={(e) => setCardSearch(e.target.value)}
                  placeholder="Filtrar padrões…"
                  className="mb-2"
                />
                <div className="max-h-36 overflow-y-auto space-y-1 rounded-md border border-line p-2">
                  {filteredCards.slice(0, 30).map((c) => {
                    const selected = form.cardSlugs.includes(c.slug);
                    return (
                      <label key={c.slug} className="flex items-center gap-2 cursor-pointer hover:text-fg">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleCardSlug(c.slug)}
                          className="accent-amber-500"
                        />
                        <span className="text-xs text-muted">{c.title}</span>
                      </label>
                    );
                  })}
                </div>
                {form.cardSlugs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {form.cardSlugs.map((slug) => {
                      const c = cards.find((x) => x.slug === slug);
                      return c ? (
                        <Tag key={slug} color="amber">{c.title}</Tag>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Status inicial</Label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Decisao["status"] }))}
                className="w-full rounded-md bg-card border border-line px-3 py-2 text-sm text-fg outline-none focus:border-amber-500"
              >
                {STATUS_CYCLE.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => { setShowForm(false); setForm(emptyForm); setCardSearch(""); setSaveError(null); }}>
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={!form.titulo.trim() || !form.decisao.trim() || saving}>
                {saving ? "Salvando…" : "Registrar"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted py-4">Carregando…</p>
      ) : decisoes.length === 0 ? (
        <Card>
          <p className="text-sm text-muted mb-2">
            Nenhuma decisão registrada ainda.
          </p>
          <p className="text-xs text-subtle">
            Use ADRs para documentar escolhas arquiteturais — ORM, estratégia de auth, multi-tenancy, etc.
            Linke a padrões da biblioteca para manter o contexto conectado.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {decisoes.map((d) => (
            <div key={d.id} className="rounded-lg border border-line bg-card overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => cycleStatus(d)}
                  title={`${STATUS_LABEL[d.status]} — clique pra avançar status`}
                  className="shrink-0"
                >
                  <Tag color={STATUS_COLOR[d.status] as TagColor}>{STATUS_LABEL[d.status]}</Tag>
                </button>
                <span className="flex-1 text-sm font-medium">{d.titulo}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-subtle hidden sm:block">
                    {new Date(d.data).toLocaleDateString("pt-BR")}
                  </span>
                  <button
                    onClick={() => setExpanded((prev) => (prev === d.id ? null : d.id))}
                    className="p-1 rounded text-muted hover:text-fg transition"
                    title="Expandir"
                  >
                    {expanded === d.id
                      ? <ChevronUp className="w-3.5 h-3.5" />
                      : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => remover(d.id)}
                    className="p-1 rounded text-muted hover:text-red-500 hover:bg-red-500/10 transition"
                    title="Apagar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {expanded === d.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-line pt-3 text-sm">
                  {d.contexto && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Contexto</p>
                      <p className="text-muted">{d.contexto}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Decisão</p>
                    <p>{d.decisao}</p>
                  </div>
                  {d.consequencias && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Consequências</p>
                      <p className="text-muted">{d.consequencias}</p>
                    </div>
                  )}
                  {d.cardSlugs && d.cardSlugs.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Padrões relacionados
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {d.cardSlugs.map((slug) => {
                          const c = cards.find((x) => x.slug === slug);
                          return c ? (
                            <Link
                              key={slug}
                              href={`/biblioteca/${slug}`}
                              className="px-2.5 py-1 rounded-md text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition"
                            >
                              {c.title}
                            </Link>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
