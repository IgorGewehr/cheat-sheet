"use client";

import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import Link from "next/link";
import { Trash2, Brain } from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import {
  listDividas,
  createDivida,
  updateDividaStatus,
  deleteDivida,
} from "@/lib/db";
import type { DividaConhecimento, DividaStatus } from "@/lib/types";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isThisWeek(ts: number): boolean {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return ts >= start.getTime();
}

const STATUS_LABEL: Record<DividaStatus, string> = {
  pendente: "Pendente",
  "em-andamento": "Em andamento",
  paga: "Paga",
};

const STATUS_BADGE: Record<DividaStatus, string> = {
  pendente: "bg-red-500/15 text-red-600 dark:text-red-400",
  "em-andamento": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  paga: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

function StatusBadge({ status }: { status: DividaStatus }) {
  return (
    <span
      className={clsx(
        "inline-block px-2 py-0.5 rounded text-[11px] font-medium",
        STATUS_BADGE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function DividaCard({
  divida,
  onUpdate,
  onDelete,
}: {
  divida: DividaConhecimento;
  onUpdate: (id: string, status: DividaStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function handleUpdate(status: DividaStatus) {
    setBusy(true);
    try {
      await onUpdate(
        divida.id,
        status,
        // pass resolvedAt when marking as paid
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(divida.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-line rounded-lg p-4 bg-card hover:border-line-strong transition group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className={clsx(
              "text-sm font-medium text-fg leading-snug",
              divida.status === "paga" && "line-through text-muted",
            )}
          >
            {divida.descricao}
          </p>
          {divida.contexto && (
            <p className="mt-1 text-xs text-muted leading-relaxed">{divida.contexto}</p>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <StatusBadge status={divida.status} />
            <span className="text-[11px] text-subtle">{formatDate(divida.criadoEm)}</span>
            {divida.cardSlug && (
              <Link
                href={`/biblioteca/${divida.cardSlug}`}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
              >
                → {divida.cardSlug}
              </Link>
            )}
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500 disabled:opacity-30"
          aria-label="Excluir"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {(divida.status === "pendente" || divida.status === "em-andamento") && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {divida.status === "pendente" && (
            <Button
              variant="secondary"
              className="text-xs py-1 px-3 h-auto"
              onClick={() => handleUpdate("em-andamento")}
              disabled={busy}
            >
              {busy ? (
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                "Iniciar"
              )}
            </Button>
          )}
          {divida.status === "em-andamento" && (
            <Button
              variant="secondary"
              className="text-xs py-1 px-3 h-auto text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              onClick={() => handleUpdate("paga")}
              disabled={busy}
            >
              {busy ? (
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                "Marcar como paga"
              )}
            </Button>
          )}
          <Link
            href={`/interrogatorio?topic=${encodeURIComponent(divida.descricao)}${divida.cardSlug ? `&slug=${encodeURIComponent(divida.cardSlug)}` : ""}`}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs border border-line bg-card hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 text-muted transition"
          >
            <Brain className="w-3 h-3" />
            Estudar agora
          </Link>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  dividas,
  onUpdate,
  onDelete,
}: {
  title: string;
  dividas: DividaConhecimento[];
  onUpdate: (id: string, status: DividaStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  if (dividas.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="text-xs uppercase tracking-wide text-muted mb-3 font-medium">{title}</h3>
      <div className="flex flex-col gap-2">
        {dividas.map((d) => (
          <DividaCard key={d.id} divida={d} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export function DividaView() {
  const [dividas, setDividas] = useState<DividaConhecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // form
  const [descricao, setDescricao] = useState("");
  const [contexto, setContexto] = useState("");
  const [cardSlug, setCardSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listDividas();
      setDividas(data);
    } catch {
      setError("Erro ao carregar dívidas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!descricao.trim()) {
      setFormError("Descrição obrigatória.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const nova = await createDivida({
        descricao: descricao.trim(),
        contexto: contexto.trim() || undefined,
        cardSlug: cardSlug.trim() || undefined,
        status: "pendente",
      });
      setDividas((prev) => [nova, ...prev]);
      setDescricao("");
      setContexto("");
      setCardSlug("");
    } catch {
      setFormError("Erro ao registrar dívida.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string, status: DividaStatus) {
    const resolvidoEm = status === "paga" ? Date.now() : undefined;
    await updateDividaStatus(id, status, resolvidoEm);
    setDividas((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status, ...(resolvidoEm ? { resolvidoEm } : {}) } : d)),
    );
  }

  async function handleDelete(id: string) {
    await deleteDivida(id);
    setDividas((prev) => prev.filter((d) => d.id !== id));
  }

  const pendentes = dividas.filter((d) => d.status === "pendente");
  const emAndamento = dividas.filter((d) => d.status === "em-andamento");
  const pagas = dividas.filter((d) => d.status === "paga");
  const pagasEssaSemana = pagas.filter((d) => d.resolvidoEm && isThisWeek(d.resolvidoEm));

  const isEmpty = dividas.length === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-fg">Dívida de Conhecimento</h1>
        <p className="text-sm text-muted mt-1">
          Torne visível o que você usou sem entender. Cada dívida registrada é honestidade intelectual.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-card">
          <span className="text-[11px] font-medium bg-red-500/15 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
            {pendentes.length}
          </span>
          <span className="text-xs text-muted">Pendente</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-card">
          <span className="text-[11px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded">
            {emAndamento.length}
          </span>
          <span className="text-xs text-muted">Em andamento</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-card">
          <span className="text-[11px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
            {pagasEssaSemana.length}
          </span>
          <span className="text-xs text-muted">Pagas esta semana</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-card">
          <span className="text-xs text-subtle">{pagas.length} pagas no total</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Add form */}
        <div className="lg:sticky lg:top-6 h-fit">
          <Card>
            <h2 className="text-sm font-semibold text-fg mb-4">Registrar nova dívida</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="descricao">O que você usou sem entender *</Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Promise.allSettled, o padrão de circuit breaker..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div>
                <Label htmlFor="contexto">Contexto: em que situação?</Label>
                <Textarea
                  id="contexto"
                  placeholder="Ex: Ao implementar a fila de notificações, copiei esse padrão sem entender o fallback..."
                  value={contexto}
                  onChange={(e) => setContexto(e.target.value)}
                  rows={3}
                  className="resize-none text-xs"
                />
              </div>
              <div>
                <Label htmlFor="cardSlug">Card relacionado (slug ou nome)</Label>
                <Input
                  id="cardSlug"
                  placeholder="Ex: outbox-pattern"
                  value={cardSlug}
                  onChange={(e) => setCardSlug(e.target.value)}
                />
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={saving || !descricao.trim()}
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  "Registrar dívida"
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* List */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block text-muted" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : isEmpty ? (
            <div className="text-center py-16 px-6">
              <p className="text-muted text-sm leading-relaxed">
                Cada dívida registrada é honestidade intelectual.
                <br />
                Registre quando usar algo sem entender.
              </p>
            </div>
          ) : (
            <>
              <Section title="Pendente" dividas={pendentes} onUpdate={handleUpdate} onDelete={handleDelete} />
              <Section title="Em andamento" dividas={emAndamento} onUpdate={handleUpdate} onDelete={handleDelete} />
              <Section title="Pagas" dividas={pagas} onUpdate={handleUpdate} onDelete={handleDelete} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
