"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { clsx } from "clsx";
import Link from "next/link";
import { Trash2, ChevronDown, ChevronUp, Plus, X, Search } from "lucide-react";
import { Button, Card, Input, Label, Textarea, Tag } from "@/components/ui";
import {
  listErrosPersonais,
  createErroPersonal,
  deleteErroPersonal,
} from "@/lib/db";
import type { ErroPersonal } from "@/lib/types";

const CATEGORIAS = [
  "performance",
  "segurança",
  "arquitetura",
  "banco-dados",
  "auth",
  "frontend",
  "backend",
  "infra",
  "testes",
  "multi-tenant",
  "financeiro",
  "outro",
] as const;

type Categoria = (typeof CATEGORIAS)[number];

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ErroCard({
  erro,
  onDelete,
}: {
  erro: ErroPersonal;
  onDelete: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(erro.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-line rounded-lg bg-card overflow-hidden group">
      <div className="flex items-start justify-between px-4 py-3 gap-3">
        <button
          className="flex-1 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-start gap-2 flex-wrap mb-2">
            <span className="text-sm font-medium text-fg leading-snug">{erro.titulo}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {erro.categorias.map((cat) => (
              <Tag key={cat} color="amber">
                {cat}
              </Tag>
            ))}
          </div>
          <p className="text-xs text-muted line-clamp-2">{erro.causaRaiz}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-subtle">{formatDate(erro.criadoEm)}</span>
            {erro.padraoViolado && (
              <Link
                href={`/biblioteca/${erro.padraoViolado}`}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                → {erro.padraoViolado}
              </Link>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded hover:bg-card-hover text-muted transition"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500 disabled:opacity-30"
            aria-label="Excluir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-line px-4 py-4 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted mb-1">O que aconteceu</p>
            <p className="text-sm text-fg whitespace-pre-wrap">{erro.descricao}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Causa raiz</p>
            <p className="text-sm text-fg whitespace-pre-wrap">{erro.causaRaiz}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Como detectar antes</p>
            <p className="text-sm text-fg whitespace-pre-wrap">{erro.comoDetectar}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Como prevenir</p>
            <p className="text-sm text-fg whitespace-pre-wrap">{erro.comoPrevenir}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AddErroForm({
  onAdd,
  onClose,
}: {
  onAdd: (erro: ErroPersonal) => void;
  onClose: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selectedCats, setSelectedCats] = useState<Categoria[]>([]);
  const [padraoViolado, setPadraoViolado] = useState("");
  const [causaRaiz, setCausaRaiz] = useState("");
  const [comoDetectar, setComoDetectar] = useState("");
  const [comoPrevenir, setComoPrevenir] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleCat(cat: Categoria) {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  async function handleSubmit() {
    if (!titulo.trim() || !causaRaiz.trim() || selectedCats.length === 0) {
      setError("Preencha título, causa raiz e ao menos uma categoria.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const novo = await createErroPersonal({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categorias: selectedCats,
        padraoViolado: padraoViolado.trim() || undefined,
        causaRaiz: causaRaiz.trim(),
        comoDetectar: comoDetectar.trim(),
        comoPrevenir: comoPrevenir.trim(),
      });
      onAdd(novo);
      onClose();
    } catch {
      setError("Erro ao registrar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-fg">Registrar novo erro</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-card-hover text-muted transition"
        >
          <X size={14} />
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="titulo">Título do erro *</Label>
          <Input
            id="titulo"
            placeholder="Ex: N+1 query sem perceber no loop de módulos"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="descricao">O que aconteceu?</Label>
          <Textarea
            id="descricao"
            placeholder="Descreva o cenário, contexto e impacto..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <Label>Categorias *</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCat(cat)}
                className={clsx(
                  "px-2.5 py-1 rounded-md text-xs font-medium border transition",
                  selectedCats.includes(cat)
                    ? "bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-line text-muted hover:border-line-strong hover:text-fg",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="padraoViolado">Padrão violado (nome do card)</Label>
          <Input
            id="padraoViolado"
            placeholder="Ex: repository-pattern"
            value={padraoViolado}
            onChange={(e) => setPadraoViolado(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="causaRaiz">Causa raiz *</Label>
          <Textarea
            id="causaRaiz"
            placeholder="Por que realmente aconteceu?"
            value={causaRaiz}
            onChange={(e) => setCausaRaiz(e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="comoDetectar">Como detectar antes</Label>
          <Textarea
            id="comoDetectar"
            placeholder="Sinais de alerta, code review checks, testes..."
            value={comoDetectar}
            onChange={(e) => setComoDetectar(e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="comoPrevenir">Como prevenir</Label>
          <Textarea
            id="comoPrevenir"
            placeholder="Processo, padrão, ferramenta, hábito..."
            value={comoPrevenir}
            onChange={(e) => setComoPrevenir(e.target.value)}
            rows={2}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              "Registrar erro"
            )}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function BibliotecaErrosView() {
  const [erros, setErros] = useState<ErroPersonal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState<Categoria | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listErrosPersonais();
      setErros(data);
    } catch {
      setError("Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    await deleteErroPersonal(id);
    setErros((prev) => prev.filter((e) => e.id !== id));
  }

  function handleAdd(novo: ErroPersonal) {
    setErros((prev) => [novo, ...prev]);
  }

  // Stats
  const catCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of erros) {
      for (const cat of e.categorias) {
        map[cat] = (map[cat] ?? 0) + 1;
      }
    }
    return map;
  }, [erros]);

  const padraoCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of erros) {
      if (e.padraoViolado) {
        map[e.padraoViolado] = (map[e.padraoViolado] ?? 0) + 1;
      }
    }
    return map;
  }, [erros]);

  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topPadrao = Object.entries(padraoCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  const catsWithErrors = CATEGORIAS.filter((c) => (catCount[c] ?? 0) > 0);

  const filtered = useMemo(() => {
    return erros.filter((e) => {
      if (filterCat && !e.categorias.includes(filterCat)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          e.titulo.toLowerCase().includes(q) ||
          e.descricao?.toLowerCase().includes(q) ||
          e.causaRaiz.toLowerCase().includes(q) ||
          e.categorias.some((c) => c.includes(q))
        );
      }
      return true;
    });
  }, [erros, filterCat, search]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Biblioteca de Erros Pessoais</h1>
          <p className="text-sm text-muted mt-1">
            Cada erro que você registra é um erro que não vai repetir.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="shrink-0">
            <Plus size={14} />
            Novo erro
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-card">
          <span className="text-lg font-semibold text-fg">{erros.length}</span>
          <span className="text-xs text-muted">erros registrados</span>
        </div>
        {topCat && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-card">
            <span className="text-xs text-muted">Categoria mais frequente:</span>
            <Tag color="amber">{topCat}</Tag>
          </div>
        )}
        {topPadrao && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-card">
            <span className="text-xs text-muted">Padrão mais violado:</span>
            <span className="text-xs font-medium text-fg">{topPadrao}</span>
          </div>
        )}
      </div>

      {showForm && <AddErroForm onAdd={handleAdd} onClose={() => setShowForm(false)} />}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block text-muted" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar filters */}
          <div className="lg:w-48 shrink-0">
            <p className="text-[11px] uppercase tracking-wide text-muted mb-2">Categorias</p>
            <div className="flex flex-wrap lg:flex-col gap-1.5">
              <button
                onClick={() => setFilterCat(null)}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition text-left",
                  filterCat === null
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    : "text-muted hover:text-fg hover:bg-card-hover",
                )}
              >
                Todas ({erros.length})
              </button>
              {catsWithErrors.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(filterCat === cat ? null : cat)}
                  className={clsx(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition text-left",
                    filterCat === cat
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                      : "text-muted hover:text-fg hover:bg-card-hover",
                  )}
                >
                  {cat} ({catCount[cat] ?? 0})
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                placeholder="Buscar por título, causa, categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 px-6">
                {erros.length === 0 ? (
                  <p className="text-muted text-sm leading-relaxed">
                    Cada erro que você registra aqui é um erro que não vai repetir.
                    <br />
                    Comece pelo mais recente.
                  </p>
                ) : (
                  <p className="text-muted text-sm">Nenhum erro encontrado com esse filtro.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((e) => (
                  <ErroCard key={e.id} erro={e} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
