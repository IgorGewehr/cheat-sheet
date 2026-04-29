"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RotateCcw, Save, Clock, Trash2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";
import {
  createChecklistSession,
  deleteChecklistSession,
  listChecklistSessions,
  updateChecklistSession,
} from "@/lib/db";
import type { ChecklistSession } from "@/lib/types";

function countCheckboxes(body: string) {
  return (body.match(/^- \[[ xX]\]/gm) ?? []).length;
}

export function ChecklistView({
  body,
  slug,
  cardTitle,
}: {
  body: string;
  slug: string;
  cardTitle: string;
}) {
  const total = countCheckboxes(body);
  const [checked, setChecked] = useState<boolean[]>(() => Array(total).fill(false));
  const idxRef = useRef(0);

  // Session state
  const [sessions, setSessions] = useState<ChecklistSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [saveForm, setSaveForm] = useState({ titulo: "", prUrl: "" });
  const [saving, setSaving] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [slug]); // eslint-disable-line

  async function loadSessions() {
    setLoadingSessions(true);
    try {
      setSessions(await listChecklistSessions(slug));
    } finally {
      setLoadingSessions(false);
    }
  }

  async function saveSession() {
    if (!saveForm.titulo.trim() || saving) return;
    setSaving(true);
    try {
      const session = await createChecklistSession({
        cardSlug: slug,
        cardTitle,
        titulo: saveForm.titulo,
        prUrl: saveForm.prUrl || undefined,
        checked,
        total,
      });
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setSaveForm({ titulo: "", prUrl: "" });
      setShowSaveForm(false);
    } finally {
      setSaving(false);
    }
  }

  const autosaveSession = useCallback(
    async (newChecked: boolean[]) => {
      if (!activeSessionId) return;
      await updateChecklistSession(activeSessionId, { checked: newChecked });
    },
    [activeSessionId],
  );

  function toggle(idx: number, val: boolean) {
    setChecked((prev) => {
      const next = [...prev];
      next[idx] = val;
      autosaveSession(next);
      return next;
    });
  }

  function reset() {
    setChecked(Array(total).fill(false));
    setActiveSessionId(null);
  }

  function loadSession(s: ChecklistSession) {
    const loaded = s.checked.length === total ? s.checked : Array(total).fill(false);
    setChecked(loaded);
    setActiveSessionId(s.id);
    setShowSessions(false);
  }

  async function removeSession(id: string) {
    await deleteChecklistSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setChecked(Array(total).fill(false));
    }
  }

  const done = checked.filter(Boolean).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  idxRef.current = 0;

  return (
    <div className="space-y-4">
      {/* Progress bar + actions */}
      <div className="flex items-center gap-4 p-4 rounded-lg border border-line bg-card">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-muted mb-1.5">
            <span>
              {done} / {total} verificados
              {activeSessionId && <span className="ml-2 text-emerald-500">● sessão ativa</span>}
            </span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-line overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#f59e0b" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowSessions((v) => !v)}
            title="Histórico de sessões"
            className="p-1.5 rounded text-muted hover:text-fg hover:bg-card-hover transition"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSaveForm((v) => !v)}
            title="Salvar sessão"
            className="p-1.5 rounded text-muted hover:text-amber-500 hover:bg-amber-500/10 transition"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={reset}
            title="Resetar checklist"
            className="p-1.5 rounded text-muted hover:text-red-500 hover:bg-red-500/10 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Save session form */}
      {showSaveForm && (
        <Card>
          <p className="text-sm font-medium mb-3">Salvar sessão de checklist</p>
          <div className="space-y-3">
            <div>
              <Label>Nome da sessão</Label>
              <Input
                value={saveForm.titulo}
                onChange={(e) => setSaveForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="ex: PR #145 — módulo de auth"
              />
            </div>
            <div>
              <Label>URL do PR (opcional)</Label>
              <Input
                value={saveForm.prUrl}
                onChange={(e) => setSaveForm((f) => ({ ...f, prUrl: e.target.value }))}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowSaveForm(false)}>Cancelar</Button>
              <Button onClick={saveSession} disabled={!saveForm.titulo.trim() || saving}>
                {saving ? "Salvando…" : "Salvar sessão"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Session history */}
      {showSessions && (
        <Card>
          <button
            className="flex items-center justify-between w-full mb-3"
            onClick={() => setShowSessions(false)}
          >
            <p className="text-sm font-medium">Sessões anteriores</p>
            <ChevronUp className="w-4 h-4 text-muted" />
          </button>
          {loadingSessions ? (
            <p className="text-sm text-muted">Carregando…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma sessão salva ainda.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => {
                const sDone = s.checked.filter(Boolean).length;
                const sPct = s.total > 0 ? Math.round((sDone / s.total) * 100) : 0;
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-line hover:border-amber-500/50 transition"
                  >
                    <button onClick={() => loadSession(s)} className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">{s.titulo}</p>
                      <p className="text-[11px] text-muted">
                        {new Date(s.criadoEm).toLocaleDateString("pt-BR")} · {sDone}/{s.total} ({sPct}%)
                      </p>
                    </button>
                    {s.prUrl && (
                      <a
                        href={s.prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-muted hover:text-sky-400 transition"
                        title="Abrir PR"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => removeSession(s.id)}
                      className="p-1 text-muted hover:text-red-500 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Checklist body */}
      <div className="prose-card">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            input({ type, ...props }) {
              if (type !== "checkbox") return <input type={type} {...props} />;
              const idx = idxRef.current++;
              return (
                <input
                  type="checkbox"
                  checked={checked[idx] ?? false}
                  onChange={(e) => toggle(idx, e.target.checked)}
                  className="mr-2 mt-0.5 accent-amber-500 cursor-pointer"
                />
              );
            },
          }}
        >
          {body}
        </ReactMarkdown>
      </div>
    </div>
  );
}
