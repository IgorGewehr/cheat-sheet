"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Wand2, Sparkles } from "lucide-react";
import { Button, Card, Input, Label, Tag, Textarea } from "@/components/ui";
import { createCustomCard } from "@/lib/db";
import type { CardCategory } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/types";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as CardCategory[];

const emptyForm = {
  title: "",
  category: "padroes-backend" as CardCategory,
  stack: "",
  tags: "",
  excerpt: "",
  body: "",
};

export default function NovoCardPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // AI generation state
  const [aiDescription, setAiDescription] = useState("");
  const [aiStack, setAiStack] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [generated, setGenerated] = useState(false);

  async function gerarComIA() {
    if (!aiDescription.trim() || generating) return;
    setGenerating(true);
    setAiError("");
    setGenerated(false);
    try {
      const res = await fetch("/api/ai/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: aiDescription,
          stack: aiStack || undefined,
        }),
      });
      const data = await res.json() as {
        title?: string;
        category?: string;
        stack?: string;
        tags?: string;
        excerpt?: string;
        body?: string;
        error?: string;
      };
      if (data.error) {
        setAiError(data.error);
        return;
      }
      setForm({
        title: data.title ?? "",
        category: (data.category as CardCategory) ?? "padroes-backend",
        stack: data.stack ?? "",
        tags: data.tags ?? "",
        excerpt: data.excerpt ?? "",
        body: data.body ?? "",
      });
      setGenerated(true);
    } catch {
      setAiError("Falha na conexão com a IA.");
    } finally {
      setGenerating(false);
    }
  }

  async function salvar() {
    if (!form.title.trim() || !form.body.trim()) {
      setError("Título e conteúdo são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const card = await createCustomCard({
        title: form.title.trim(),
        category: form.category,
        stack: form.stack.split(",").map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        excerpt: form.excerpt.trim(),
        body: form.body.trim(),
      });
      router.push(`/cards/${card.id}`);
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/biblioteca" className="text-xs text-muted hover:text-fg flex items-center gap-1 mb-2 transition">
          <ChevronRight className="w-3 h-3 rotate-180" /> biblioteca
        </Link>
        <h1 className="text-2xl font-semibold">Novo card próprio</h1>
        <p className="text-sm text-muted mt-1">
          Preencha manualmente ou deixe o GPT-5.4 gerar o card completo a partir de uma descrição.
        </p>
      </div>

      {/* AI Generator */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Gerar com GPT-5.4</p>
          <span className="text-xs text-muted ml-auto">Preenche todos os campos automaticamente</span>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Descreva o padrão que precisa</Label>
            <Textarea
              rows={3}
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder={`Ex: "Padrão de módulo financeiro com auditoria completa no NestJS — como estruturar entidades, transações, conciliação e logs de mudança de saldo"`}
            />
          </div>
          <div>
            <Label>Stack do projeto (opcional)</Label>
            <Input
              value={aiStack}
              onChange={(e) => setAiStack(e.target.value)}
              placeholder="Next.js, NestJS, PostgreSQL, Drizzle ORM"
            />
          </div>

          {aiError && <p className="text-sm text-red-500">{aiError}</p>}

          {generated && (
            <p className="text-xs text-emerald-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Card gerado! Revise e edite os campos abaixo antes de salvar.
            </p>
          )}

          <Button
            onClick={gerarComIA}
            disabled={!aiDescription.trim() || generating}
            className="w-full"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Gerando card completo…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                {generated ? "Gerar novamente" : "Gerar card com IA"}
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Manual form */}
      <Card>
        <p className="text-xs uppercase tracking-widest text-muted font-semibold mb-4">
          {generated ? "Card gerado — revise antes de salvar" : "Preencher manualmente"}
        </p>

        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="ex: Padrão de Módulo Contábil"
            />
          </div>

          <div>
            <Label>Categoria</Label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as CardCategory }))}
              className="w-full rounded-md bg-card border border-line px-3 py-2 text-sm text-fg outline-none focus:border-amber-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Stack (separado por vírgula)</Label>
              <Input
                value={form.stack}
                onChange={(e) => setForm((f) => ({ ...f, stack: e.target.value }))}
                placeholder="Next.js, NestJS"
              />
            </div>
            <div>
              <Label>Tags (separado por vírgula)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="erp, financeiro, audit"
              />
            </div>
          </div>

          <div>
            <Label>Resumo / Excerpt</Label>
            <Input
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              placeholder="Uma linha descrevendo este padrão…"
            />
          </div>

          <div>
            <Label>Conteúdo (Markdown) *</Label>
            <Textarea
              rows={18}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder={`## Quando usar\n\n...\n\n## Quando NÃO usar\n\n...\n\n## Como pedir pra IA\n\n...\n\n## Como auditar o que a IA gerou\n\n- [ ] Item 1\n- [ ] Item 2`}
              className="font-mono text-xs"
            />
          </div>

          {(form.stack || form.tags) && (
            <div className="flex flex-wrap gap-1.5">
              {form.stack.split(",").filter(Boolean).map((s) => (
                <Tag key={s} color="sky">{s.trim()}</Tag>
              ))}
              {form.tags.split(",").filter(Boolean).map((t) => (
                <Tag key={t}>{t.trim()}</Tag>
              ))}
              <Tag color="violet">custom</Tag>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={() => router.push("/biblioteca")}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={!form.title.trim() || !form.body.trim() || saving}>
              {saving ? "Salvando…" : "Salvar card"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
