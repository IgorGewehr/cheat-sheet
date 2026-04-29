"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ExternalLink, Boxes } from "lucide-react";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { extractModuloAsProject } from "@/lib/db";
import type { Adocao, Modulo, Project } from "@/lib/types";

const STACK_PRESETS = [
  "Next.js", "NestJS", "Express", "Firebase", "Firestore", "PostgreSQL",
  "Go", "Drizzle", "Prisma", "Zod", "Redis", "Docker", "Kubernetes",
  "Cloudflare", "Turborepo", "Better-Auth", "TanStack Query", "Vitest",
];

export function ExtractModal({
  projeto,
  modulo,
  adocoes,
  onClose,
}: {
  projeto: Project;
  modulo: Modulo;
  adocoes: Adocao[];
  onClose: () => void;
}) {
  const [nome, setNome] = useState(modulo.nome);
  const [descricao, setDescricao] = useState(modulo.descricao ?? "");
  const [stack, setStack] = useState<string[]>([...projeto.stack]);
  const [createADR, setCreateADR] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; nome: string } | null>(null);

  // Merge presets + project stack, project stack first
  const allStack = [
    ...projeto.stack,
    ...STACK_PRESETS.filter((s) => !projeto.stack.includes(s)),
  ];

  function toggleStack(s: string) {
    setStack((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  async function extrair() {
    if (!nome.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const newProject = await extractModuloAsProject({
        sourceProjectId: projeto.id,
        sourceProjectNome: projeto.nome,
        moduloId: modulo.id,
        moduloNome: modulo.nome,
        moduloAdocoes: adocoes,
        newProject: { nome: nome.trim(), descricao: descricao.trim() || undefined, stack },
        createADR,
      });
      setResult({ id: newProject.id, nome: newProject.nome });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao extrair módulo.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-card border border-line rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line shrink-0">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <Boxes className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Extrair como microsserviço</h2>
            <p className="text-xs text-muted">Módulo: <span className="text-fg">{modulo.nome}</span></p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-md text-muted hover:text-fg hover:bg-card-hover transition"
          >
            ✕
          </button>
        </div>

        {result ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold text-fg">{result.nome}</p>
              <p className="text-sm text-muted mt-1">
                Microsserviço criado com {adocoes.length} padrão{adocoes.length !== 1 ? "s" : ""} copiado{adocoes.length !== 1 ? "s" : ""}.
              </p>
              <p className="text-sm text-muted">
                O módulo <span className="text-fg">{modulo.nome}</span> está marcado como extraído neste projeto.
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="ghost" onClick={onClose}>Fechar</Button>
              <Link
                href={`/projetos/${result.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-violet-600 hover:bg-violet-500 text-white font-medium transition"
                onClick={onClose}
              >
                Ver microsserviço <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* ── Form state ── */
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            <div>
              <Label htmlFor="ex-nome">Nome do novo projeto</Label>
              <Input
                id="ex-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="ex: saas-erp-financeiro"
              />
            </div>

            <div>
              <Label htmlFor="ex-desc">Descrição (opcional)</Label>
              <Textarea
                id="ex-desc"
                rows={2}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Responsabilidade principal deste microsserviço…"
              />
            </div>

            <div>
              <Label>Stack do microsserviço</Label>
              <p className="text-[11px] text-subtle mb-2">
                Herdada do projeto pai. Desmarque o que não se aplica ou adicione techs específicas.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allStack.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStack(s)}
                    className={
                      "px-2.5 py-1 rounded text-xs border transition " +
                      (stack.includes(s)
                        ? "bg-violet-500/20 text-violet-300 border-violet-500/50"
                        : "bg-card text-muted border-line hover:border-line-strong")
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-line bg-card hover:border-line-strong transition">
              <input
                type="checkbox"
                checked={createADR}
                onChange={(e) => setCreateADR(e.target.checked)}
                className="mt-0.5 accent-violet-500"
              />
              <div>
                <p className="text-sm font-medium">Registrar ADR de extração</p>
                <p className="text-xs text-muted">
                  Cria uma decisão em <span className="text-fg">{projeto.nome}</span> documentando por que o módulo foi extraído e quais trade-offs foram aceitos.
                </p>
              </div>
            </label>

            {adocoes.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/5 border border-violet-500/20 text-xs text-violet-400">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                {adocoes.length} padrão{adocoes.length !== 1 ? "s" : ""} adotado{adocoes.length !== 1 ? "s" : ""} será{adocoes.length !== 1 ? "ão" : ""} copiado{adocoes.length !== 1 ? "s" : ""} pro novo projeto.
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}

        {!result && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-line shrink-0">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button
              onClick={extrair}
              disabled={!nome.trim() || saving}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Extraindo…
                </>
              ) : (
                <>
                  <Boxes className="w-4 h-4" /> Extrair como microsserviço
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
