"use client";

import { useState } from "react";
import { Copy, Check, ClipboardPaste, AlertTriangle, ShieldAlert, FileWarning, Star, ChevronUp, ChevronDown } from "lucide-react";
import { Button, Card, Label, Textarea } from "@/components/ui";

const AUDIT_PROMPT = `Você receberá acesso a um projeto de software. Analise-o de ponta a ponta e me retorne um relatório estruturado de arquitetura no seguinte formato JSON:

{
  "resumoExecutivo": "3-5 frases descrevendo o projeto, stack e estado geral da arquitetura",
  "scoreArquitetura": {
    "geral": 0,
    "escalabilidade": 0,
    "manutenibilidade": 0,
    "seguranca": 0,
    "testabilidade": 0,
    "observabilidade": 0
  },
  "estruturaDiretorio": "descrição da estrutura de pastas e o que cada parte faz",
  "padroesDentectados": [
    { "nome": "nome do padrão", "onde": "onde está sendo usado", "implementadoCorretamente": true }
  ],
  "violacoesArquiteturais": [
    { "problema": "descrição", "arquivo": "caminho", "impacto": "alto/medio/baixo", "correcao": "como corrigir" }
  ],
  "debitosRecnicos": [
    { "descricao": "descrição", "arquivo": "caminho", "esforcoEstimado": "horas" }
  ],
  "riscosDeSeg": [
    { "vulnerabilidade": "descrição", "criticidade": "critica/alta/media/baixa", "correcao": "como corrigir" }
  ],
  "arquivosProblematicos": [
    { "arquivo": "caminho", "problema": "por que é problemático", "linhas": 0, "sugestao": "o que fazer" }
  ],
  "recomendacoesPriorizadas": [
    { "prioridade": 1, "acao": "o que fazer", "impacto": "qual o impacto", "esforco": "horas/dias" }
  ],
  "pontoPositivos": ["o que está bem feito"],
  "proximosPassos": "plano de 30/60/90 dias para melhorar a arquitetura"
}

Seja específico e técnico. Referencie arquivos reais do projeto. Foque em problemas concretos, não genéricos.`;

interface ScoreArquitetura {
  geral: number;
  escalabilidade: number;
  manutenibilidade: number;
  seguranca: number;
  testabilidade: number;
  observabilidade: number;
}

interface PadraoDetectado {
  nome: string;
  onde: string;
  implementadoCorretamente: boolean;
}

interface ViolacaoArquitetural {
  problema: string;
  arquivo: string;
  impacto: "alto" | "medio" | "baixo";
  correcao: string;
}

interface DebitoTecnico {
  descricao: string;
  arquivo: string;
  esforcoEstimado: string;
}

interface RiscoSeg {
  vulnerabilidade: string;
  criticidade: "critica" | "alta" | "media" | "baixa";
  correcao: string;
}

interface ArquivoProblematico {
  arquivo: string;
  problema: string;
  linhas: number;
  sugestao: string;
}

interface RecomendacaoPriorizada {
  prioridade: number;
  acao: string;
  impacto: string;
  esforco: string;
}

interface AuditResult {
  resumoExecutivo: string;
  scoreArquitetura: ScoreArquitetura;
  estruturaDiretorio: string;
  padroesDentectados: PadraoDetectado[];
  violacoesArquiteturais: ViolacaoArquitetural[];
  debitosRecnicos: DebitoTecnico[];
  riscosDeSeg: RiscoSeg[];
  arquivosProblematicos: ArquivoProblematico[];
  recomendacoesPriorizadas: RecomendacaoPriorizada[];
  pontoPositivos: string[];
  proximosPassos: string;
}

const SCORE_LABELS: (keyof ScoreArquitetura)[] = [
  "geral",
  "escalabilidade",
  "manutenibilidade",
  "seguranca",
  "testabilidade",
  "observabilidade",
];

const SCORE_PT: Record<keyof ScoreArquitetura, string> = {
  geral: "Geral",
  escalabilidade: "Escalabilidade",
  manutenibilidade: "Manutenibilidade",
  seguranca: "Segurança",
  testabilidade: "Testabilidade",
  observabilidade: "Observabilidade",
};

function scoreColor(score: number) {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-amber-500";
  if (score >= 4) return "bg-orange-500";
  return "bg-red-500";
}

function scoreTextColor(score: number) {
  if (score >= 8) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 6) return "text-amber-600 dark:text-amber-400";
  if (score >= 4) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

const IMPACTO_ORDER = { alto: 0, medio: 1, baixo: 2 };
const CRITICIDADE_ORDER = { critica: 0, alta: 1, media: 2, baixa: 3 };

const IMPACTO_COLOR: Record<string, string> = {
  alto: "bg-red-500/15 text-red-700 dark:text-red-300",
  medio: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  baixo: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
};

const CRITICIDADE_COLOR: Record<string, string> = {
  critica: "bg-red-500/15 text-red-700 dark:text-red-300",
  alta: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  media: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  baixa: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
};

export default function ArchitectureAuditPage() {
  const [promptCopied, setPromptCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [parseError, setParseError] = useState("");

  async function copyPrompt() {
    await navigator.clipboard.writeText(AUDIT_PROMPT);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }

  function analyzeResult() {
    setParseError("");
    setResult(null);
    try {
      const cleaned = jsonInput.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(cleaned) as AuditResult;
      if (!parsed.scoreArquitetura || !parsed.resumoExecutivo) {
        setParseError("JSON inválido: campos obrigatórios ausentes (scoreArquitetura, resumoExecutivo).");
        return;
      }
      setResult(parsed);
    } catch (e) {
      setParseError(`JSON inválido: ${e instanceof Error ? e.message : "erro de parse"}. Verifique se você colou o JSON completo.`);
    }
  }

  const sortedViolacoes = result
    ? [...(result.violacoesArquiteturais ?? [])].sort(
        (a, b) => (IMPACTO_ORDER[a.impacto] ?? 3) - (IMPACTO_ORDER[b.impacto] ?? 3),
      )
    : [];

  const sortedRiscos = result
    ? [...(result.riscosDeSeg ?? [])].sort(
        (a, b) => (CRITICIDADE_ORDER[a.criticidade] ?? 4) - (CRITICIDADE_ORDER[b.criticidade] ?? 4),
      )
    : [];

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-amber-500" />
          Architecture Audit
        </h1>
        <p className="text-muted max-w-2xl">
          Gere um prompt para o Claude Code auditar seu projeto do zero, cole os resultados aqui e visualize um relatório estruturado de arquitetura.
        </p>
      </header>

      {/* Step 1 */}
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center text-sm font-semibold shrink-0">
            1
          </span>
          <div>
            <p className="font-medium">Copie o prompt abaixo</p>
            <p className="text-sm text-muted">Cole no Claude Code (sem contexto) dentro do seu projeto</p>
          </div>
        </div>

        <div className="relative">
          <pre className="bg-zinc-900 dark:bg-zinc-950 text-emerald-400 font-mono text-xs p-4 rounded-xl overflow-auto max-h-64 whitespace-pre-wrap break-words border border-zinc-700">
            {AUDIT_PROMPT}
          </pre>
          <Button
            variant="secondary"
            onClick={copyPrompt}
            className="absolute top-3 right-3"
          >
            {promptCopied
              ? <><Check className="w-4 h-4 text-emerald-500" /> Copiado!</>
              : <><Copy className="w-4 h-4" /> Copiar</>}
          </Button>
        </div>
      </Card>

      {/* Step 2 */}
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center text-sm font-semibold shrink-0">
            2
          </span>
          <div>
            <p className="font-medium">Cole o JSON retornado pelo Claude Code</p>
            <p className="text-sm text-muted">Cole a resposta completa — JSON ou com code block</p>
          </div>
        </div>

        <div>
          <Label>Resultado do Claude Code</Label>
          <Textarea
            rows={10}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={'{\n  "resumoExecutivo": "...",\n  "scoreArquitetura": { ... },\n  ...\n}'}
            className="font-mono text-xs"
          />
        </div>

        {parseError && (
          <p className="text-sm text-red-500 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {parseError}
          </p>
        )}

        <Button
          onClick={analyzeResult}
          disabled={!jsonInput.trim()}
          className="w-full justify-center"
        >
          <ClipboardPaste className="w-4 h-4" /> Analisar resultado
        </Button>
      </Card>

      {/* Step 3: Results */}
      {result && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-sm font-semibold shrink-0">
              3
            </span>
            <p className="font-medium">Relatório de Arquitetura</p>
          </div>

          {/* Resumo executivo */}
          <Card>
            <p className="text-sm font-semibold mb-2 text-muted uppercase tracking-wide text-xs">Resumo Executivo</p>
            <p className="text-sm leading-relaxed">{result.resumoExecutivo}</p>
          </Card>

          {/* Score cards */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Scores de Arquitetura</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SCORE_LABELS.map((key) => {
                const score = result.scoreArquitetura?.[key] ?? 0;
                return (
                  <div key={key} className="rounded-xl border border-line bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">{SCORE_PT[key]}</span>
                      <span className={`text-lg font-bold ${scoreTextColor(score)}`}>{score}<span className="text-xs font-normal text-muted">/10</span></span>
                    </div>
                    <div className="h-1.5 rounded-full bg-line overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${scoreColor(score)}`}
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Estrutura de diretório */}
          {result.estruturaDiretorio && (
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Estrutura de Diretório</p>
              <p className="text-sm leading-relaxed text-muted">{result.estruturaDiretorio}</p>
            </Card>
          )}

          {/* Padrões detectados */}
          {result.padroesDentectados?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Padrões Detectados</p>
              <div className="space-y-2">
                {result.padroesDentectados.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-line bg-card">
                    <span className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${p.implementadoCorretamente ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-red-500/15 text-red-600 dark:text-red-400"}`}>
                      {p.implementadoCorretamente ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{p.nome}</p>
                      <p className="text-xs text-muted mt-0.5">{p.onde}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Violações arquiteturais */}
          {sortedViolacoes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Violações Arquiteturais ({sortedViolacoes.length})
              </p>
              <div className="space-y-3">
                {sortedViolacoes.map((v, i) => (
                  <div key={i} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{v.problema}</p>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${IMPACTO_COLOR[v.impacto] ?? ""}`}>
                        {v.impacto}
                      </span>
                    </div>
                    <p className="text-xs text-muted font-mono">{v.arquivo}</p>
                    <p className="text-xs text-muted border-t border-red-500/10 pt-2">{v.correcao}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Débitos técnicos */}
          {result.debitosRecnicos?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3 flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-amber-500" />
                Débitos Técnicos ({result.debitosRecnicos.length})
              </p>
              <div className="space-y-2">
                {result.debitosRecnicos.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-line bg-card">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{d.descricao}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted font-mono">{d.arquivo}</span>
                        <span className="text-xs text-amber-600 dark:text-amber-400">{d.esforcoEstimado}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Riscos de segurança */}
          {sortedRiscos.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Riscos de Segurança ({sortedRiscos.length})
              </p>
              <div className="space-y-3">
                {sortedRiscos.map((r, i) => (
                  <div key={i} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{r.vulnerabilidade}</p>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${CRITICIDADE_COLOR[r.criticidade] ?? ""}`}>
                        {r.criticidade}
                      </span>
                    </div>
                    <p className="text-xs text-muted border-t border-red-500/10 pt-2">{r.correcao}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Arquivos problemáticos */}
          {result.arquivosProblematicos?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Arquivos Problemáticos</p>
              <div className="rounded-xl border border-line overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-card-hover">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted">Arquivo</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted">Problema</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted hidden md:table-cell">Linhas</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted hidden md:table-cell">Sugestão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.arquivosProblematicos.map((a, i) => (
                      <tr key={i} className={`border-b border-line last:border-0 ${i % 2 === 0 ? "bg-card" : "bg-card-hover/50"}`}>
                        <td className="px-4 py-3 font-mono text-xs text-muted">{a.arquivo}</td>
                        <td className="px-4 py-3 text-xs">{a.problema}</td>
                        <td className="px-4 py-3 text-xs text-muted hidden md:table-cell">{a.linhas > 0 ? a.linhas : "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted hidden md:table-cell">{a.sugestao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recomendações priorizadas */}
          {result.recomendacoesPriorizadas?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Recomendações Priorizadas</p>
              <div className="space-y-3">
                {result.recomendacoesPriorizadas.map((r, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-line bg-card">
                    <span className="text-2xl font-bold text-amber-500/40 w-8 shrink-0 text-right leading-none mt-0.5">
                      {r.prioridade}
                    </span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium">{r.acao}</p>
                      <p className="text-xs text-muted">{r.impacto}</p>
                      <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-card-hover text-muted">{r.esforco}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pontos positivos */}
          {result.pontoPositivos?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-500" />
                Pontos Positivos
              </p>
              <div className="space-y-2">
                {result.pontoPositivos.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Próximos passos */}
          {result.proximosPassos && (
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Plano 30/60/90 dias</p>
              <p className="text-sm leading-relaxed">{result.proximosPassos}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
