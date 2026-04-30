"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  BookOpen, CheckCircle2, Copy, Trash2, ChevronDown, ChevronUp,
  Search, Sparkles, Save, X,
} from "lucide-react";
import { Button, Card, Input, Label, Tag, Textarea } from "@/components/ui";
import { createExperienciaSTAR, deleteExperienciaSTAR, listExperienciasSTAR, updateExperienciaSTAR } from "@/lib/db";
import type { STARFormatado } from "@/app/api/ai/star/route";
import type { ExperienciaSTAR } from "@/lib/types";

function ReadinessBadge({ count }: { count: number }) {
  if (count >= 5) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
      <CheckCircle2 className="w-3.5 h-3.5" /> Pronto para entrevista
    </span>
  );
  if (count >= 2) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
      Quase lá — adicione mais experiências
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30">
      <X className="w-3.5 h-3.5" /> Banco ainda vazio
    </span>
  );
}

export function BancoSTARView() {
  // Form state
  const [titulo, setTitulo] = useState("");
  const [situacao, setSituacao] = useState("");
  const [tarefa, setTarefa] = useState("");
  const [acao, setAcao] = useState("");
  const [resultado, setResultado] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // AI result
  const [formatado, setFormatado] = useState<STARFormatado | null>(null);
  const [formatting, setFormatting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState("");

  // List state
  const [experiencias, setExperiencias] = useState<ExperienciaSTAR[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [listError, setListError] = useState("");

  async function loadList() {
    setListLoading(true);
    try {
      const list = await listExperienciasSTAR();
      setExperiencias(list);
    } catch {
      setListError("Erro ao carregar experiências.");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => { loadList(); }, []);

  function resetForm() {
    setTitulo("");
    setSituacao("");
    setTarefa("");
    setAcao("");
    setResultado("");
    setTagsInput("");
    setFormatado(null);
    setSaved(false);
    setFormError("");
  }

  async function formatarComIA() {
    if (!titulo.trim() || !situacao.trim() || !tarefa.trim() || !acao.trim() || !resultado.trim()) {
      setFormError("Preencha todos os campos antes de formatar.");
      return;
    }
    setFormatting(true);
    setFormError("");
    setFormatado(null);
    try {
      const res = await fetch("/api/ai/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, situacao, tarefa, acao, resultado }),
      });
      const data = (await res.json()) as STARFormatado & { error?: string };
      if (data.error) { setFormError(data.error); return; }
      setFormatado(data);
      // auto-fill tags if empty
      if (!tagsInput.trim() && data.tags.length > 0) {
        setTagsInput(data.tags.join(", "));
      }
    } catch {
      setFormError("Erro ao conectar com a API.");
    } finally {
      setFormatting(false);
    }
  }

  async function salvar() {
    if (!titulo.trim() || !situacao.trim() || !tarefa.trim() || !acao.trim() || !resultado.trim()) {
      setFormError("Preencha todos os campos.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const nova = await createExperienciaSTAR({
        titulo,
        situacao,
        tarefa,
        acao,
        resultado,
        tags,
        respostaFormatada: formatado?.respostaFormatada,
      });
      setExperiencias((prev) => [nova, ...prev]);
      setSaved(true);
      resetForm();
    } catch {
      setFormError("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function excluir(id: string) {
    setDeleting(id);
    try {
      await deleteExperienciaSTAR(id);
      setExperiencias((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setListError("Erro ao excluir.");
    } finally {
      setDeleting(null);
    }
  }

  async function copyText(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  // Filter
  const allTags = Array.from(new Set(experiencias.flatMap((e) => e.tags)));
  const filtered = experiencias.filter((e) => {
    const matchSearch =
      !search ||
      e.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (e.respostaFormatada ?? "").toLowerCase().includes(search.toLowerCase()) ||
      e.situacao.toLowerCase().includes(search.toLowerCase());
    const matchTag = !filterTag || e.tags.includes(filterTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-amber-500" />
          Banco de Experiências STAR
        </h1>
        <p className="text-muted max-w-xl">
          Registre histórias de trabalho reais. A IA formata como respostas de entrevista STAR polidas.
        </p>
      </header>

      {/* Stats */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm text-muted">
          <span className="font-semibold text-fg">{experiencias.length}</span> experiências
        </span>
        {allTags.length > 0 && (
          <span className="text-sm text-muted">
            <span className="font-semibold text-fg">{allTags.length}</span> categorias cobertas
          </span>
        )}
        <ReadinessBadge count={experiencias.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Form */}
        <div className="space-y-5">
          <Card className="space-y-4">
            <h2 className="text-base font-semibold">Adicionar experiência</h2>

            <div className="space-y-1.5">
              <Label htmlFor="titulo">Título da experiência</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Refatorei módulo de 6000 linhas"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="situacao">Situação — qual era o contexto?</Label>
              <Textarea
                id="situacao"
                rows={3}
                value={situacao}
                onChange={(e) => setSituacao(e.target.value)}
                placeholder="Descreva o contexto, o problema existente, por que era importante..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tarefa">Tarefa — o que você precisava fazer?</Label>
              <Textarea
                id="tarefa"
                rows={2}
                value={tarefa}
                onChange={(e) => setTarefa(e.target.value)}
                placeholder="Qual era sua responsabilidade específica?"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acao">Ação — o que você fez especificamente?</Label>
              <Textarea
                id="acao"
                rows={4}
                value={acao}
                onChange={(e) => setAcao(e.target.value)}
                placeholder="Quais decisões você tomou? Quais passos executou? Seja específico..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resultado">Resultado — qual foi o impacto?</Label>
              <Textarea
                id="resultado"
                rows={2}
                value={resultado}
                onChange={(e) => setResultado(e.target.value)}
                placeholder="Use números quando possível: reduziu X%, economizou Y horas..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="refatoração, decisão técnica, liderança..."
              />
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}

            {/* Resposta formatada pela IA */}
            {formatado && (
              <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Resposta formatada pela IA</p>
                </div>
                <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{formatado.respostaFormatada}</p>
                {formatado.perguntasAdequadas.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted font-medium">Perguntas que esta história responde:</p>
                    <ul className="space-y-1">
                      {formatado.perguntasAdequadas.map((q, i) => (
                        <li key={i} className="text-xs text-muted flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-muted mt-1.5 shrink-0" />
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={formatarComIA}
                disabled={formatting}
              >
                {formatting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Formatando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Formatar com IA
                  </>
                )}
              </Button>
              <Button
                onClick={salvar}
                disabled={saving || saved}
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saved ? "Salvo!" : "Salvar"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: List */}
        <div className="space-y-4">
          {/* Search & filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar experiências..."
                className="pl-9"
              />
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                    className={clsx(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition",
                      filterTag === tag
                        ? "bg-amber-500 text-zinc-950"
                        : "bg-card-hover text-muted hover:text-fg",
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {listLoading ? (
            <div className="flex items-center gap-2 text-muted text-sm">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Carregando...
            </div>
          ) : listError ? (
            <p className="text-sm text-red-500">{listError}</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted text-sm">{experiencias.length === 0 ? "Nenhuma experiência ainda. Adicione a primeira!" : "Nenhum resultado."}</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((e) => (
                <Card key={e.id} className="space-y-3">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-sm truncate">{e.titulo}</p>
                      <p className="text-xs text-muted">{new Date(e.criadoEm).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => copyText(e.id, e.respostaFormatada ?? e.situacao)}
                        className="p-1.5 rounded text-muted hover:text-fg hover:bg-card-hover transition"
                        title="Copiar resposta"
                      >
                        {copied === e.id ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => excluir(e.id)}
                        disabled={deleting === e.id}
                        className="p-1.5 rounded text-muted hover:text-red-500 hover:bg-red-500/10 transition"
                        title="Excluir"
                      >
                        {deleting === e.id ? (
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                        className="p-1.5 rounded text-muted hover:text-fg hover:bg-card-hover transition"
                      >
                        {expanded === e.id
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Tags */}
                  {e.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {e.tags.map((tag) => (
                        <Tag key={tag} color="zinc">{tag}</Tag>
                      ))}
                    </div>
                  )}

                  {/* Preview */}
                  {expanded !== e.id && (
                    <p className="text-xs text-muted line-clamp-2">
                      {e.respostaFormatada
                        ? e.respostaFormatada.slice(0, 120) + (e.respostaFormatada.length > 120 ? "..." : "")
                        : e.situacao.slice(0, 120) + (e.situacao.length > 120 ? "..." : "")}
                    </p>
                  )}

                  {/* Expanded */}
                  {expanded === e.id && (
                    <div className="space-y-4 pt-2 border-t border-line">
                      {e.respostaFormatada && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted uppercase tracking-wide font-medium">Resposta formatada</p>
                          <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{e.respostaFormatada}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Situação</p>
                          <p className="text-sm text-fg">{e.situacao}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wide">Tarefa</p>
                          <p className="text-sm text-fg">{e.tarefa}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wide">Ação</p>
                          <p className="text-sm text-fg">{e.acao}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Resultado</p>
                          <p className="text-sm text-fg">{e.resultado}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
