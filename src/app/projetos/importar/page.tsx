"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { importArchitecture, type ArchitectureJSON } from "@/lib/db";
import { addSquadConstraint } from "@/lib/squad-db";
import {
  Upload, FileJson, CheckCircle, AlertCircle, ChevronRight,
  Boxes, GitBranch, CheckSquare, Shield, Loader2, Terminal,
  Info, X,
} from "lucide-react";
import { clsx } from "clsx";
import type { ConstraintType } from "@/lib/types";
import { CONSTRAINT_TYPE_COLOR, CONSTRAINT_TYPE_LABEL } from "@/lib/types";

type ParseState = "idle" | "valid" | "error";

function ModuloStatusDot({ status }: { status?: string }) {
  const colors: Record<string, string> = {
    "em-desenvolvimento": "bg-amber-400",
    "concluido": "bg-emerald-400",
    "planejando": "bg-zinc-500",
    "extraido": "bg-violet-400",
  };
  return (
    <span className={clsx("w-1.5 h-1.5 rounded-full inline-block", colors[status ?? ""] ?? "bg-zinc-500")} />
  );
}

function Section({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.ElementType;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
        <Icon className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-medium text-zinc-300">{title}</span>
        <span className="ml-auto text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function ImportarPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<ArchitectureJSON | null>(null);
  const [parseState, setParseState] = useState<ParseState>("idle");
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ projectId: string; moduloCount: number; decisaoCount: number; adocaoCount: number } | null>(null);
  const [importConstraints, setImportConstraints] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const squadId = typeof window !== "undefined" ? localStorage.getItem("brain.squadId") : null;

  function parseJSON(text: string) {
    if (!text.trim()) {
      setParseState("idle");
      setParsed(null);
      return;
    }
    try {
      const obj = JSON.parse(text) as ArchitectureJSON;
      if (!obj.project?.nome) throw new Error("Campo 'project.nome' obrigatório.");
      if (!Array.isArray(obj.project?.stack)) throw new Error("Campo 'project.stack' deve ser array.");
      setParsed(obj);
      setParseState("valid");
      setParseError("");
    } catch (e) {
      setParseState("error");
      setParseError(e instanceof Error ? e.message : "JSON inválido.");
      setParsed(null);
    }
  }

  function handleTextChange(value: string) {
    setRaw(value);
    parseJSON(value);
  }

  async function handleFileUpload(file: File) {
    const text = await file.text();
    setRaw(text);
    parseJSON(text);
  }

  async function handleImport() {
    if (!parsed || !user) return;
    setImporting(true);
    try {
      const result = await importArchitecture(parsed);

      // Import squad constraints if applicable
      if (importConstraints && squadId && parsed.squadConstraints?.length) {
        const displayName = user.displayName ?? "Dev";
        await Promise.all(
          parsed.squadConstraints.map((c) =>
            addSquadConstraint(squadId, {
              title: c.title,
              description: c.description ?? "",
              type: c.type as ConstraintType,
              category: c.category ?? "geral",
              createdBy: displayName,
            }),
          ),
        );
      }

      setImportResult(result);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Falha ao importar.");
    } finally {
      setImporting(false);
    }
  }

  if (importResult) {
    return (
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-xl font-bold text-zinc-100 mb-2">Arquitetura importada!</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Projeto criado com {importResult.moduloCount} módulos,
          {" "}{importResult.decisaoCount} decisões e
          {" "}{importResult.adocaoCount} adoções.
          {importConstraints && squadId && parsed?.squadConstraints?.length
            ? ` +${parsed.squadConstraints.length} constraints no squad.`
            : ""}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push(`/projetos/${importResult.projectId}`)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Abrir projeto
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setImportResult(null);
              setRaw("");
              setParsed(null);
              setParseState("idle");
            }}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
          >
            Importar outro
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <FileJson className="w-4.5 h-4.5 text-violet-400" />
          </div>
          Importar Arquitetura de Projeto
        </h1>
        <p className="text-sm text-zinc-500 mt-1 ml-12">
          Cole o JSON gerado pelo <code className="text-violet-400">brain-scan</code>,
          {" "}faça upload de um arquivo, ou escreva manualmente.
        </p>
      </div>

      {/* CLI hint */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-violet-400" />
          Gerar o JSON via CLI (opcional)
        </p>
        <pre className="text-xs text-zinc-400 bg-zinc-950 rounded-lg p-3 overflow-x-auto leading-relaxed">
{`# Scan básico (use descrição e stack):
curl -s -X POST "$BRAIN_API_URL/api/cli/scan-project" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"meu-projeto","stack":["NestJS","PostgreSQL"],"description":"ERP multi-tenant"}' \\
  | jq . > architecture.json

# Scan com package.json + árvore de arquivos:
curl -s -X POST "$BRAIN_API_URL/api/cli/scan-project" \\
  -H "Content-Type: application/json" \\
  -d "{\"name\":\"meu-projeto\",\"packageJson\":$(cat package.json | jq -c .),\"fileTree\":\"$(find src -type f -name '*.ts' | head -60 | tr '\\n' '|')\"}" \\
  | jq . > architecture.json

cat architecture.json  # revise e cole abaixo`}
        </pre>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">JSON de arquitetura</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload .json
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              {raw && (
                <button
                  onClick={() => { setRaw(""); setParsed(null); setParseState("idle"); }}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={raw}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`{\n  "version": "1",\n  "project": {\n    "nome": "meu-projeto",\n    "stack": ["NestJS", "PostgreSQL"],\n    "descricao": "..."\n  },\n  "modulos": [...],\n  "decisoes": [...]\n}`}
              rows={22}
              className={clsx(
                "w-full bg-zinc-950 border rounded-xl px-4 py-3 text-xs font-mono text-zinc-300 placeholder:text-zinc-700 focus:outline-none resize-none transition-colors",
                parseState === "valid" && "border-emerald-500/40",
                parseState === "error" && "border-red-500/40",
                parseState === "idle" && "border-zinc-800 focus:border-violet-500/50",
              )}
            />
            {parseState === "valid" && (
              <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                JSON válido
              </div>
            )}
            {parseState === "error" && (
              <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-red-400 max-w-[140px] text-right leading-tight">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {parseError}
              </div>
            )}
          </div>

          {/* Schema hint */}
          <details className="group">
            <summary className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1.5 transition-colors">
              <Info className="w-3.5 h-3.5" />
              Ver schema completo
            </summary>
            <pre className="mt-2 text-[10px] text-zinc-600 bg-zinc-950 rounded-lg p-3 overflow-x-auto leading-relaxed">
{`{
  "version": "1",
  "source": "https://github.com/org/repo",
  "project": {
    "nome": "string (obrigatório)",
    "descricao": "string",
    "stack": ["string"] (obrigatório),
    "tipo": "frontend|backend|fullstack|microsservico",
    "status": "planejando|em-desenvolvimento|concluido|manutencao",
    "repoUrl": "string"
  },
  "modulos": [{
    "nome": "string",
    "tipo": "core|auth|api|feature|...",
    "status": "planejando|em-desenvolvimento|...",
    "descricao": "string"
  }],
  "decisoes": [{
    "titulo": "string",
    "contexto": "string",
    "decisao": "string",
    "consequencias": "string",
    "status": "proposta|aceita|depreciada",
    "cardSlugs": ["slug-do-card"]
  }],
  "adocoes": [{
    "cardSlug": "slug-do-card",
    "moduloNome": "NomeDoModulo",
    "status": "adotado|revisar|...",
    "notas": "string"
  }],
  "squadConstraints": [{
    "title": "string",
    "description": "string",
    "type": "must|should|never|pattern",
    "category": "auth|banco|infra|..."
  }]
}`}
            </pre>
          </details>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <span className="text-sm font-medium text-zinc-300">Preview do que será criado</span>

          {!parsed && (
            <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
              <FileJson className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-600">Cole o JSON à esquerda para ver o preview.</p>
            </div>
          )}

          {parsed && (
            <div className="space-y-3">
              {/* Project */}
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-zinc-100">{parsed.project.nome}</h3>
                    {parsed.project.descricao && (
                      <p className="text-xs text-zinc-500 mt-0.5">{parsed.project.descricao}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded flex-shrink-0">
                    {parsed.project.tipo ?? "projeto"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.project.stack.map((s) => (
                    <span key={s} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
                {parsed.project.repoUrl && (
                  <p className="text-[10px] text-zinc-600 mt-2 truncate">{parsed.project.repoUrl}</p>
                )}
              </div>

              {/* Modules */}
              <Section icon={Boxes} title="Módulos" count={(parsed.modulos?.length ?? 0) + (parsed.modulos?.some(m => m.nome.toLowerCase() === 'core') ? 0 : 1)}>
                <div className="space-y-1.5">
                  {/* Core always first */}
                  {!parsed.modulos?.some((m) => m.nome.toLowerCase() === "core") && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <ModuloStatusDot status="em-desenvolvimento" />
                      <span className="font-medium text-zinc-300">Core</span>
                      <span className="text-zinc-600">— adicionado automaticamente</span>
                    </div>
                  )}
                  {(parsed.modulos ?? []).map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                      <ModuloStatusDot status={m.status} />
                      <span className="font-medium text-zinc-300">{m.nome}</span>
                      <span className="text-zinc-600 text-[10px]">{m.tipo}</span>
                      {m.descricao && (
                        <span className="text-zinc-600 truncate">— {m.descricao}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Section>

              {/* Decisions */}
              <Section icon={GitBranch} title="Decisões (ADRs)" count={parsed.decisoes?.length ?? 0}>
                <div className="space-y-2">
                  {parsed.decisoes?.map((d, i) => (
                    <div key={i} className="text-xs">
                      <p className="font-medium text-zinc-300">{d.titulo}</p>
                      <p className="text-zinc-600 truncate">{d.decisao}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Adoptions */}
              <Section icon={CheckSquare} title="Adoções de padrões" count={parsed.adocoes?.length ?? 0}>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.adocoes?.map((a, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono"
                    >
                      {a.cardSlug}
                    </span>
                  ))}
                </div>
              </Section>

              {/* Squad Constraints */}
              {(parsed.squadConstraints?.length ?? 0) > 0 && (
                <Section icon={Shield} title="Constraints do squad" count={parsed.squadConstraints?.length ?? 0}>
                  <div className="space-y-1.5">
                    {parsed.squadConstraints?.map((c, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={clsx(
                          "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border mt-0.5 flex-shrink-0",
                          CONSTRAINT_TYPE_COLOR[c.type as ConstraintType],
                        )}>
                          {CONSTRAINT_TYPE_LABEL[c.type as ConstraintType]}
                        </span>
                        <span className="text-xs text-zinc-400">{c.title}</span>
                      </div>
                    ))}
                  </div>

                  {squadId ? (
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importConstraints}
                        onChange={(e) => setImportConstraints(e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-violet-500"
                      />
                      <span className="text-xs text-zinc-400">
                        Importar constraints para o squad atual
                      </span>
                    </label>
                  ) : (
                    <p className="text-[10px] text-zinc-600 mt-2 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Entre em um squad para importar as constraints.
                    </p>
                  )}
                </Section>
              )}

              {/* Import button */}
              <button
                onClick={handleImport}
                disabled={importing || !user}
                className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Importar arquitetura
                  </>
                )}
              </button>

              {!user && (
                <p className="text-xs text-zinc-500 text-center">Faça login para importar.</p>
              )}

              {parseError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {parseError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
