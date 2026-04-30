"use client";

import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { Trash2, ChevronDown, ChevronUp, AlertTriangle, Sparkles } from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import {
  listSprintsSemIA,
  createSprintSemIA,
  updateSprintSemIA,
  deleteSprintSemIA,
} from "@/lib/db";
import type { SprintSemIA, SprintSemIAStatus } from "@/lib/types";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_BADGE: Record<SprintSemIAStatus, string> = {
  "em-andamento": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  concluido: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

const STATUS_LABEL: Record<SprintSemIAStatus, string> = {
  "em-andamento": "Em andamento",
  concluido: "Concluído",
};

function SprintCard({
  sprint,
  onDelete,
}: {
  sprint: SprintSemIA;
  onDelete: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(sprint.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-line rounded-lg bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="text-sm font-medium text-fg">{sprint.titulo}</span>
          <span className={clsx("text-[11px] px-2 py-0.5 rounded font-medium", STATUS_BADGE[sprint.status])}>
            {STATUS_LABEL[sprint.status]}
          </span>
          <span className="text-xs text-subtle ml-auto mr-2">{formatDate(sprint.criadoEm)}</span>
          {expanded ? (
            <ChevronUp size={14} className="text-muted shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-muted shrink-0" />
          )}
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="ml-2 p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500 transition disabled:opacity-30"
          aria-label="Excluir"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-line px-4 py-4 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Descrição</p>
            <p className="text-sm text-fg whitespace-pre-wrap">{sprint.descricao}</p>
          </div>

          {sprint.codigoProducido && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Seu código</p>
              <pre className="text-xs bg-card-hover border border-line rounded-lg p-3 overflow-auto whitespace-pre-wrap font-mono text-fg">
                {sprint.codigoProducido}
              </pre>
            </div>
          )}

          {sprint.codigoIA && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Versão da IA</p>
              <pre className="text-xs bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 overflow-auto whitespace-pre-wrap font-mono text-fg">
                {sprint.codigoIA}
              </pre>
            </div>
          )}

          {sprint.reflexao && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Reflexão</p>
              <p className="text-sm text-fg whitespace-pre-wrap">{sprint.reflexao}</p>
            </div>
          )}

          {sprint.lacunas && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Lacunas identificadas</p>
              <p className="text-sm text-fg whitespace-pre-wrap">{sprint.lacunas}</p>
            </div>
          )}

          {sprint.concluidoEm && (
            <p className="text-xs text-subtle">
              Concluída em {formatDate(sprint.concluidoEm)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type Step = "define" | "implement" | "reflect";

export function SprintSemIAView() {
  const [tab, setTab] = useState<"nova" | "anteriores">("nova");
  const [sprints, setSprints] = useState<SprintSemIA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // nova sprint
  const [step, setStep] = useState<Step>("define");
  const [activeSprint, setActiveSprint] = useState<SprintSemIA | null>(null);

  // step 1
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  // step 2
  const [codigoProducido, setCodigoProducido] = useState("");
  const [codigoIA, setCodigoIA] = useState("");
  const [generatingIA, setGeneratingIA] = useState(false);
  const [iaError, setIaError] = useState("");

  // step 3
  const [reflexao, setReflexao] = useState("");
  const [lacunas, setLacunas] = useState("");
  const [concluding, setConcluding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSprintsSemIA();
      setSprints(data);
      // check if there's an active sprint
      const active = data.find((s) => s.status === "em-andamento");
      if (active) {
        setActiveSprint(active);
        setCodigoProducido(active.codigoProducido ?? "");
        setCodigoIA(active.codigoIA ?? "");
        setStep("implement");
      }
    } catch {
      setError("Erro ao carregar sprints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!titulo.trim() || !descricao.trim()) {
      setFormError("Preencha título e descrição.");
      return;
    }
    setCreating(true);
    setFormError("");
    try {
      const sprint = await createSprintSemIA({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        status: "em-andamento",
      });
      setSprints((prev) => [sprint, ...prev]);
      setActiveSprint(sprint);
      setStep("implement");
    } catch {
      setFormError("Erro ao criar sprint.");
    } finally {
      setCreating(false);
    }
  }

  async function handleGenerateIA() {
    if (!activeSprint) return;
    setGeneratingIA(true);
    setIaError("");
    try {
      const res = await fetch("/api/ai/sprint-sem-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: activeSprint.descricao }),
      });
      const data = (await res.json()) as { codigoIA?: string; error?: string };
      if (data.error) {
        setIaError(data.error);
        return;
      }
      setCodigoIA(data.codigoIA ?? "");
      await updateSprintSemIA(activeSprint.id, { codigoIA: data.codigoIA });
      setActiveSprint((prev) => prev ? { ...prev, codigoIA: data.codigoIA } : prev);
      setSprints((prev) =>
        prev.map((s) => (s.id === activeSprint.id ? { ...s, codigoIA: data.codigoIA } : s)),
      );
    } catch {
      setIaError("Erro ao chamar IA.");
    } finally {
      setGeneratingIA(false);
    }
  }

  async function handleSaveCode() {
    if (!activeSprint || !codigoProducido.trim()) return;
    await updateSprintSemIA(activeSprint.id, { codigoProducido: codigoProducido.trim() });
    setActiveSprint((prev) => prev ? { ...prev, codigoProducido: codigoProducido.trim() } : prev);
    setStep("reflect");
  }

  async function handleConclude() {
    if (!activeSprint) return;
    setConcluding(true);
    try {
      await updateSprintSemIA(activeSprint.id, {
        status: "concluido",
        codigoProducido: codigoProducido.trim() || undefined,
        codigoIA: codigoIA || undefined,
        reflexao: reflexao.trim() || undefined,
        lacunas: lacunas.trim() || undefined,
        concluidoEm: Date.now(),
      });
      setSprints((prev) =>
        prev.map((s) =>
          s.id === activeSprint.id
            ? {
                ...s,
                status: "concluido" as SprintSemIAStatus,
                codigoProducido: codigoProducido.trim() || undefined,
                codigoIA: codigoIA || undefined,
                reflexao: reflexao.trim() || undefined,
                lacunas: lacunas.trim() || undefined,
                concluidoEm: Date.now(),
              }
            : s,
        ),
      );
      setActiveSprint(null);
      setStep("define");
      setTitulo("");
      setDescricao("");
      setCodigoProducido("");
      setCodigoIA("");
      setReflexao("");
      setLacunas("");
      setTab("anteriores");
    } catch {
      setError("Erro ao concluir sprint.");
    } finally {
      setConcluding(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteSprintSemIA(id);
    setSprints((prev) => prev.filter((s) => s.id !== id));
  }

  const anteriores = sprints.filter((s) => s.status === "concluido");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-fg">Sprint sem IA</h1>
        <p className="text-sm text-muted mt-1">
          Implemente sem IA, depois compare. Meça sua habilidade real.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-card border border-line rounded-lg p-1 w-fit">
        {(["nova", "anteriores"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "px-4 py-1.5 rounded-md text-sm font-medium transition",
              tab === t ? "bg-amber-500 text-zinc-950" : "text-muted hover:text-fg",
            )}
          >
            {t === "nova" ? "Nova Sprint" : "Sprints anteriores"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block text-muted" />
        </div>
      ) : tab === "nova" ? (
        <div>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          {/* Step 1 — Define */}
          {step === "define" && (
            <Card>
              <h2 className="text-sm font-semibold text-fg mb-4">Passo 1 — Definir tarefa</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título da feature/tarefa</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Implementar debounce hook em React"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descreva o que você vai implementar</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Seja específico: linguagem, framework, contexto, constraints..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={5}
                  />
                </div>
                {formError && <p className="text-sm text-red-500">{formError}</p>}
                <Button onClick={handleCreate} disabled={creating || !titulo.trim() || !descricao.trim()}>
                  {creating ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    "Iniciar Sprint"
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2 — Implement */}
          {step === "implement" && activeSprint && (
            <div className="space-y-4">
              <Card className="border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-fg">{activeSprint.titulo}</p>
                    <p className="text-xs text-muted mt-1 leading-relaxed">{activeSprint.descricao}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                      Implemente sem usar IA. Cole seu código aqui quando terminar.
                    </p>
                  </div>
                </div>
              </Card>

              <div>
                <Label htmlFor="codigoProducido">Seu código / sua implementação</Label>
                <Textarea
                  id="codigoProducido"
                  placeholder="Cole aqui seu código implementado sem IA..."
                  value={codigoProducido}
                  onChange={(e) => setCodigoProducido(e.target.value)}
                  rows={12}
                  className="font-mono text-xs resize-y"
                />
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={handleSaveCode}
                  disabled={!codigoProducido.trim()}
                >
                  Avançar para reflexão
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleGenerateIA}
                  disabled={generatingIA}
                >
                  {generatingIA ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Gerar versão da IA
                    </>
                  )}
                </Button>
              </div>

              {iaError && <p className="text-sm text-red-500">{iaError}</p>}

              {codigoIA && (
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted mb-2">Versão da IA</p>
                  <pre className="text-xs bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 overflow-auto whitespace-pre-wrap font-mono text-fg max-h-80">
                    {codigoIA}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Reflect */}
          {step === "reflect" && activeSprint && (
            <div className="space-y-4">
              {codigoProducido && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted mb-2">Seu código</p>
                    <pre className="text-xs bg-card-hover border border-line rounded-lg p-3 overflow-auto whitespace-pre-wrap font-mono text-fg max-h-60">
                      {codigoProducido}
                    </pre>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted mb-2">Versão da IA</p>
                    {codigoIA ? (
                      <pre className="text-xs bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 overflow-auto whitespace-pre-wrap font-mono text-fg max-h-60">
                        {codigoIA}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-20 border border-line rounded-lg text-muted text-xs">
                        Nenhuma versão IA gerada
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="reflexao">
                  Reflexão: o que você esqueceu? O que você fez bem? O que aprendeu?
                </Label>
                <Textarea
                  id="reflexao"
                  placeholder="Seja honesto sobre as diferenças que você notou..."
                  value={reflexao}
                  onChange={(e) => setReflexao(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="lacunas">
                  Lacunas identificadas (habilidades/conhecimentos que precisam de reforço)
                </Label>
                <Textarea
                  id="lacunas"
                  placeholder="Ex: Esqueci de tratar erros async, não sabia usar X pattern..."
                  value={lacunas}
                  onChange={(e) => setLacunas(e.target.value)}
                  rows={3}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button onClick={handleConclude} disabled={concluding}>
                {concluding ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  "Concluir Sprint"
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {anteriores.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted">Nenhuma sprint concluída ainda.</p>
            </div>
          ) : (
            anteriores.map((s) => (
              <SprintCard key={s.id} sprint={s} onDelete={handleDelete} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
