"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { createProject } from "@/lib/db";
import {
  PROJECT_STATUS_LABEL,
  PROJECT_TYPE_LABEL,
  type ProjectStatus,
  type ProjectType,
} from "@/lib/types";

const STACK_PRESETS = [
  "Next.js", "NestJS", "Express", "Firebase", "Firestore", "PostgreSQL",
  "Go", "Drizzle", "Prisma", "Zod", "Redis", "Docker", "Kubernetes",
  "Cloudflare", "Turborepo", "Better-Auth", "TanStack Query", "Vitest",
];

export default function NovoProjetoPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<ProjectType | "">("");
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [repoUrl, setRepoUrl] = useState("");
  const [stack, setStack] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(s: string) {
    setStack((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function salvar() {
    if (!nome.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const p = await createProject({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        stack,
        tipo: tipo || undefined,
        status: status || undefined,
        repoUrl: repoUrl.trim() || undefined,
      });
      router.push(`/projetos/${p.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar projeto.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-semibold">Novo projeto</h1>
      <Card>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex: ServicePro v3" />
          </div>
          <div>
            <Label htmlFor="desc">Descrição</Label>
            <Textarea id="desc" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Para que serve, quem usa, escala esperada…" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as ProjectType | "")}>
                <option value="">— escolher —</option>
                {(Object.entries(PROJECT_TYPE_LABEL) as [ProjectType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus | "")}>
                <option value="">— escolher —</option>
                {(Object.entries(PROJECT_STATUS_LABEL) as [ProjectStatus, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="repo">Repo URL (opcional)</Label>
            <Input id="repo" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/org/repo ou caminho local" />
          </div>
          <div>
            <Label>Stack</Label>
            <div className="flex flex-wrap gap-2">
              {STACK_PRESETS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(s)}
                  className={
                    "px-3 py-1.5 rounded text-xs border transition " +
                    (stack.includes(s)
                      ? "bg-amber-500 text-zinc-950 border-amber-400"
                      : "bg-card text-muted border-line hover:border-line-strong")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => history.back()}>Cancelar</Button>
            <Button onClick={salvar} disabled={!nome.trim() || saving}>
              {saving ? "Salvando…" : "Criar projeto"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
