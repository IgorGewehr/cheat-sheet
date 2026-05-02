"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { Button, Card, Input, Label, Select, Tag, Textarea } from "@/components/ui";
import {
  saveSentinelaSession,
  listSentinelaSessions,
  updateSentinelaDecisao,
} from "@/lib/sentinela-db";
import { SENTINELA_CHECKLIST } from "@/lib/sentinela-checklist";
import type {
  SentinelaSession,
  SentinelaVeredito,
  SentinelaCategoria,
  SentinelaAchado,
} from "@/lib/sentinela-types";
import type { SentinelaResult } from "@/app/api/ai/sentinela/route";

type Step = "form" | "loading" | "verdict" | "checklist" | "saved";

type ChecklistResposta = "sim" | "nao" | "nao-sei";
type DecisaoFinal = "aceito" | "rejeitado" | "corrigir";

const VEREDITO_STYLE: Record<SentinelaVeredito, { border: string; text: string; bg: string; label: string }> = {
  PASS: {
    border: "border-violet-500",
    text: "text-violet-400",
    bg: "bg-violet-500/5",
    label: "PASS",
  },
  WARN: {
    border: "border-amber-500",
    text: "text-amber-400",
    bg: "bg-amber-500/5",
    label: "WARN",
  },
  DENY: {
    border: "border-red-500",
    text: "text-red-400",
    bg: "bg-red-500/5",
    label: "DENY",
  },
};

const SEVERIDADE_COLOR: Record<string, string> = {
  critico: "bg-red-500/20 text-red-400 border border-red-500/40",
  alto: "bg-orange-500/20 text-orange-400 border border-orange-500/40",
  medio: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
  baixo: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/40",
};

const CATEGORIA_LABEL: Record<SentinelaCategoria, string> = {
  seguranca: "Segurança",
  validacao: "Validação",
  performance: "Performance",
  manutenibilidade: "Manutenibilidade",
  testes: "Testes",
  compatibilidade: "Compatibilidade",
  alucinacao: "Alucinação",
  convencoes: "Convenções",
};

function VeredictoBanner({ veredito }: { veredito: SentinelaVeredito }) {
  const s = VEREDITO_STYLE[veredito];
  return (
    <div className={clsx("rounded-lg border-l-4 p-4", s.border, s.bg)}>
      <p className="text-xs text-muted mb-1">Veredito</p>
      <p className={clsx("text-3xl font-bold", s.text)}>
        {s.label}
      </p>
    </div>
  );
}

function SeveridadePill({ severidade }: { severidade: string }) {
  return (
    <span className={clsx("inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider", SEVERIDADE_COLOR[severidade] ?? SEVERIDADE_COLOR.baixo)}>
      {severidade}
    </span>
  );
}

function AchadoCard({ achado }: { achado: SentinelaAchado }) {
  const [open, setOpen] = useState(achado.severidade === "critico" || achado.severidade === "alto");
  return (
    <div className="border border-line rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-card hover:bg-card-hover transition text-left"
      >
        <span className="flex items-center gap-2 flex-wrap">
          <SeveridadePill severidade={achado.severidade} />
          <Tag color="zinc">{CATEGORIA_LABEL[achado.categoria]}</Tag>
          {achado.linha != null && (
            <span className="font-mono text-[10px] text-muted">linha {achado.linha}</span>
          )}
          <span className="text-xs text-fg truncate max-w-[320px]">{achado.descricao}</span>
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />}
      </button>
      {open && (
        <div className="px-3 py-3 bg-card border-t border-line space-y-2">
          {achado.trecho && (
            <pre className="text-[11px] font-mono bg-zinc-950/60 border border-line rounded p-2 overflow-x-auto text-zinc-300 whitespace-pre-wrap">
              {achado.trecho}
            </pre>
          )}
          <p className="text-xs text-fg">{achado.descricao}</p>
          <div className="border-l-2 border-violet-500/50 pl-3">
            <p className="text-xs text-muted mb-0.5 font-medium">Como corrigir</p>
            <p className="text-xs text-fg">{achado.comoCorrigir}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function VeredictoBadge({ veredito }: { veredito: SentinelaVeredito }) {
  const s = VEREDITO_STYLE[veredito];
  return (
    <span className={clsx("inline-block px-2 py-0.5 rounded text-[10px] font-medium border", s.border, s.text, s.bg)}>
      {s.label}
    </span>
  );
}

function HistoricoSection() {
  const [sessions, setSessions] = useState<SentinelaSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listSentinelaSessions(5)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && sessions.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-muted hover:text-fg transition mb-2"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {sessions.length} sessão(ões) recentes
      </button>
      {open && (
        <div className="space-y-1.5">
          {loading && (
            <p className="text-xs text-muted font-mono animate-pulse">carregando...</p>
          )}
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/sentinela/${s.id}`}
              className="flex items-center gap-3 px-3 py-2 rounded border border-line bg-card hover:bg-card-hover transition"
            >
              <VeredictoBadge veredito={s.veredito} />
              <span className="text-xs text-fg truncate flex-1">{s.titulo}</span>
              <span className="text-[10px] text-muted font-mono shrink-0">
                {new Date(s.criadoEm).toLocaleDateString("pt-BR")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function SentinelaClient() {
  const [step, setStep] = useState<Step>("form");

  const [titulo, setTitulo] = useState("");
  const [contexto, setContexto] = useState("");
  const [linguagem, setLinguagem] = useState("typescript");
  const [codigo, setCodigo] = useState("");

  const [result, setResult] = useState<SentinelaResult | null>(null);
  const [error, setError] = useState("");

  const [checklistMap, setChecklistMap] = useState<Record<string, ChecklistResposta>>({});
  const [decisao, setDecisao] = useState<DecisaoFinal>("corrigir");
  const [reflexao, setReflexao] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSession, setSavedSession] = useState<SentinelaSession | null>(null);

  const obrigatoriosOk = SENTINELA_CHECKLIST.filter((i) => i.obrigatorio).every(
    (i) => checklistMap[i.id] === "sim",
  );

  async function invocar() {
    if (!titulo.trim() || !codigo.trim()) return;
    setStep("loading");
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/ai/sentinela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, contexto: contexto || undefined, codigo, linguagem }),
      });
      const data = await res.json() as SentinelaResult & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Erro desconhecido.");
        setStep("form");
        return;
      }
      setResult(data);
      setStep("verdict");
    } catch {
      setError("Falha de rede. Tente novamente.");
      setStep("form");
    }
  }

  async function salvar() {
    if (!result) return;
    setSaving(true);
    try {
      const checklistRespondido = SENTINELA_CHECKLIST.map((i) => ({
        itemId: i.id,
        resposta: checklistMap[i.id] ?? "nao-sei",
      }));
      const session = await saveSentinelaSession({
        titulo,
        contexto: contexto || undefined,
        codigo,
        linguagem,
        veredito: result.veredito,
        scoreConfianca: result.scoreConfianca,
        achados: result.achados,
        checklistRespondido,
        decisaoFinal: decisao,
        reflexao: reflexao || undefined,
      });
      await updateSentinelaDecisao(session.id, decisao, reflexao || undefined);
      setSavedSession(session);
      setStep("saved");
    } catch {
      setError("Erro ao salvar sessão.");
    } finally {
      setSaving(false);
    }
  }

  function reiniciar() {
    setStep("form");
    setTitulo("");
    setContexto("");
    setCodigo("");
    setResult(null);
    setError("");
    setChecklistMap({});
    setDecisao("corrigir");
    setReflexao("");
    setSavedSession(null);
  }

  const achadosPorCategoria = result
    ? (Object.keys(CATEGORIA_LABEL) as SentinelaCategoria[]).reduce<
        Record<SentinelaCategoria, SentinelaAchado[]>
      >(
        (acc, cat) => {
          acc[cat] = result.achados.filter((a) => a.categoria === cat);
          return acc;
        },
        {} as Record<SentinelaCategoria, SentinelaAchado[]>,
      )
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-violet-500" />
          <h1 className="text-xl font-bold text-fg">Sentinela</h1>
        </div>
        <p className="text-sm text-muted mt-0.5">
          Cole o código gerado por IA. Receba um veredito adversarial antes de aceitar.
        </p>
      </div>

      <HistoricoSection />

      {step === "form" && (
        <Card className="space-y-4">
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="titulo">Título da revisão *</Label>
            <Input
              id="titulo"
              placeholder="ex: função de autenticação JWT gerada pelo Copilot"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="contexto">Contexto (o que você pediu à IA)</Label>
            <Textarea
              id="contexto"
              rows={2}
              placeholder="Descreva o que você pediu para a IA gerar — opcional mas melhora a auditoria."
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="linguagem">Linguagem</Label>
            <Select
              id="linguagem"
              value={linguagem}
              onChange={(e) => setLinguagem(e.target.value)}
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="sql">SQL</option>
              <option value="outro">Outro</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="codigo">Código *</Label>
            <textarea
              id="codigo"
              rows={18}
              placeholder="Cole aqui o código gerado pela IA..."
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full rounded-md bg-card border border-line px-3 py-2 text-sm font-mono text-fg outline-none focus:border-violet-500/60 resize-y"
            />
          </div>
          <Button
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm py-3"
            disabled={!titulo.trim() || !codigo.trim()}
            onClick={invocar}
          >
            Invocar Sentinela
          </Button>
        </Card>
      )}

      {step === "loading" && (
        <Card className="py-16 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">Auditoria em andamento...</p>
        </Card>
      )}

      {step === "verdict" && result && (
        <div className="space-y-4">
          <VeredictoBanner veredito={result.veredito} />

          <div className="flex items-center gap-4 px-1">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Score de confiança</p>
              <p className={clsx(
                "font-mono text-2xl font-black",
                result.scoreConfianca >= 70 ? "text-cyan-400" : result.scoreConfianca >= 40 ? "text-amber-400" : "text-red-400",
              )}>
                {result.scoreConfianca}<span className="text-base text-muted">/100</span>
              </p>
            </div>
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Resumo</p>
              <p className="text-sm text-fg">{result.resumo}</p>
            </div>
          </div>

          {result.achados.length === 0 ? (
            <Card>
              <p className="text-sm text-cyan-400 font-mono text-center py-4">
                Nenhum achado registrado.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                [{result.achados.length}] Achados
              </p>
              {(Object.keys(CATEGORIA_LABEL) as SentinelaCategoria[]).map((cat) => {
                const items = achadosPorCategoria?.[cat] ?? [];
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1.5 px-1">
                      {CATEGORIA_LABEL[cat]}
                    </p>
                    <div className="space-y-1.5">
                      {items.map((a, i) => (
                        <AchadoCard key={i} achado={a} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={reiniciar} className="flex-1">
              Nova auditoria
            </Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold"
              onClick={() => setStep("checklist")}
            >
              Prosseguir para checklist
            </Button>
          </div>
        </div>
      )}

      {step === "checklist" && result && (
        <div className="space-y-4">
          <Card>
            <p className="text-xs font-semibold text-muted border-b border-line pb-2 mb-4">
              Confirmação obrigatória
            </p>
            <div className="space-y-3">
              {SENTINELA_CHECKLIST.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="flex gap-1.5 shrink-0 mt-0.5">
                    {(["sim", "nao", "nao-sei"] as ChecklistResposta[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() =>
                          setChecklistMap((prev) => ({ ...prev, [item.id]: r }))
                        }
                        className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-mono border transition",
                          checklistMap[item.id] === r
                            ? r === "sim"
                              ? "bg-violet-500/20 border-violet-500 text-violet-400"
                              : r === "nao"
                              ? "bg-red-500/20 border-red-500 text-red-400"
                              : "bg-zinc-500/20 border-zinc-500 text-zinc-400"
                            : "bg-transparent border-line text-muted hover:border-line-strong",
                        )}
                      >
                        {r === "nao-sei" ? "?" : r}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-fg leading-relaxed">
                      {item.pergunta}
                      {item.obrigatorio && (
                        <span className="ml-1.5 text-[9px] font-mono text-red-400 uppercase">obrigatório</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-muted border-b border-line pb-2 mb-4">
              Decisão final
            </p>
            <div className="space-y-2 mb-4">
              {([
                { value: "aceito", label: "Aceitar — código aprovado para produção" },
                { value: "rejeitado", label: "Rejeitar — código não será usado" },
                { value: "corrigir", label: "Corrigir antes — precisa de ajustes" },
              ] as { value: DecisaoFinal; label: string }[]).map((opt) => (
                <label
                  key={opt.value}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded border cursor-pointer transition",
                    decisao === opt.value
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-line bg-card hover:bg-card-hover",
                  )}
                >
                  <input
                    type="radio"
                    name="decisao"
                    value={opt.value}
                    checked={decisao === opt.value}
                    onChange={() => setDecisao(opt.value)}
                    className="accent-violet-500"
                  />
                  <span className="text-sm text-fg">{opt.label}</span>
                </label>
              ))}
            </div>
            <div>
              <Label htmlFor="reflexao">Reflexão (opcional)</Label>
              <Textarea
                id="reflexao"
                rows={3}
                placeholder="O que você aprendeu com esta auditoria? O que mudaria no prompt?"
                value={reflexao}
                onChange={(e) => setReflexao(e.target.value)}
              />
            </div>
          </Card>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep("verdict")} className="flex-1">
              Voltar
            </Button>
            <Button
              className={clsx(
                "flex-1 font-semibold",
                obrigatoriosOk
                  ? "bg-violet-600 hover:bg-violet-500 text-white"
                  : "bg-card-hover text-muted cursor-not-allowed",
              )}
              disabled={!obrigatoriosOk || saving}
              onClick={salvar}
            >
              {saving ? "Salvando..." : "Registrar decisão"}
            </Button>
          </div>
          {!obrigatoriosOk && (
            <p className="text-[11px] text-amber-400 font-mono text-center">
              Responda &quot;sim&quot; em todos os itens obrigatórios antes de prosseguir.
            </p>
          )}
        </div>
      )}

      {step === "saved" && savedSession && (
        <Card className="py-8 flex flex-col items-center gap-4 text-center">
          <p className="text-xs text-muted">Sessão registrada</p>
          <VeredictoBadge veredito={savedSession.veredito} />
          <p className="text-sm text-fg max-w-sm">
            Auditoria de <strong>{savedSession.titulo}</strong> salva com decisão{" "}
            <strong>{savedSession.decisaoFinal}</strong>.
          </p>
          <div className="flex gap-3">
            <Link
              href={`/sentinela/${savedSession.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 transition"
            >
              Ver sessão
            </Link>
            <Button variant="secondary" onClick={reiniciar}>
              Nova auditoria
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
