"use client";

import { useEffect, useState } from "react";
import { Button, Card, Label, Select, Textarea } from "@/components/ui";
import { createAdocao, listModulos, listProjects } from "@/lib/db";
import type { Modulo, Project } from "@/lib/types";

export function AdotarButton({ slug, title }: { slug: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [projetoId, setProjetoId] = useState("");
  const [moduloId, setModuloId] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open && projects.length === 0) {
      listProjects().then(setProjects).catch(console.error);
    }
  }, [open, projects.length]);

  useEffect(() => {
    if (projetoId) {
      listModulos(projetoId).then(setModulos).catch(console.error);
    } else {
      setModulos([]);
    }
    setModuloId("");
  }, [projetoId]);

  async function salvar() {
    if (!projetoId) return;
    setSaving(true);
    try {
      await createAdocao({
        projetoId,
        moduloId: moduloId || null,
        cardSlug: slug,
        notas: notas.trim() || undefined,
      });
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setNotas("");
      }, 1200);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Marcar como adotado</Button>;
  }

  return (
    <Card className="w-full max-w-md">
      <p className="text-sm text-muted mb-4">
        Registrar que você usou <strong className="text-fg">{title}</strong>.
      </p>
      {projects.length === 0 ? (
        <p className="text-sm text-muted">
          Nenhum projeto ainda.{" "}
          <a href="/projetos" className="text-amber-600 dark:text-amber-400 hover:underline">
            Crie um em Projetos
          </a>{" "}
          primeiro.
        </p>
      ) : (
        <div className="space-y-3">
          <div>
            <Label>Projeto</Label>
            <Select value={projetoId} onChange={(e) => setProjetoId(e.target.value)}>
              <option value="">Selecione…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </Select>
          </div>
          {modulos.length > 0 && (
            <div>
              <Label>Módulo (opcional)</Label>
              <Select value={moduloId} onChange={(e) => setModuloId(e.target.value)}>
                <option value="">— sem módulo (decisão de projeto) —</option>
                {modulos.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <Label>Notas</Label>
            <Textarea
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Por que escolhi, como foi adaptado, ressalvas…"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={!projetoId || saving}>
              {done ? "Salvo!" : saving ? "Salvando…" : "Salvar adoção"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
