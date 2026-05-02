"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { ChevronDown, ChevronUp, ShieldAlert, Code, GitPullRequest, FileCode, Target, X, ExternalLink } from "lucide-react";
import { Button, Card, Input, Label, Select, Tag, Textarea } from "@/components/ui";
import {
  saveSentinelaSession,
  listSentinelaSessions,
  updateSentinelaDecisao,
  updateSentinelaSession,
} from "@/lib/sentinela-db";
import { SENTINELA_CHECKLIST } from "@/lib/sentinela-checklist";
import { getActiveTask, attachSentinelaSession, type ActiveTask } from "@/lib/active-task";
import { getActiveProject, type ActiveProjectContext } from "@/lib/active-project";
import { createDecisao } from "@/lib/db";
import type {
  SentinelaSession,
  SentinelaVeredito,
  SentinelaCategoria,
  SentinelaAchado,
  SentinelaModo,
} from "@/lib/sentinela-types";
import type { SentinelaResult } from "@/app/api/ai/sentinela/route";

type Step = "form" | "loading" | "verdict" | "checklist" | "saved";
type InputMode = "codigo" | "diff" | "pr";

type ChecklistResposta = "sim" | "nao" | "nao-sei";
type DecisaoFinal = "aceito" | "rejeitado" | "corrigir";

const VEREDITO_STYLE: Record<SentinelaVeredito, { border: string; text: string; bg: string; label: string }> = {
  PASS: { border: "border-violet-500", text: "text-violet-400", bg: "bg-violet-500/5", label: "PASS" },
  WARN: { border: "border-amber-500", text: "text-amber-400", bg: "bg-amber-500/5", label: "WARN" },
  DENY: { border: "border-red-500", text: "text-red-400", bg: "bg-red-500/5", label: "DENY" },
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

function looksLikeDiff(s: string): boolean {
  const lines = s.split("\n").slice(0, 50);
  return lines.some((l) => /^(diff --git|@@ |\+\+\+ |--- )/.test(l)) ||
         lines.filter((l) => l.startsWith("+") || l.startsWith("-")).length >= 3;
}

function looksLikeCode(s: string): boolean {
  return s.length > 30 && /[{};()=]|function |class |def |import |const /.test(s);
}

function VeredictoBanner({ veredito }: { veredito: SentinelaVeredito }) {
  const s = VEREDITO_STYLE[veredito];
  return (
    <div className={clsx("rounded-lg border-l-4 p-4", s.border, s.bg)}>
      <p className="text-xs text-muted mb-1">Veredito</p>
      <p className={clsx("text-3xl font-bold", s.text)}>{s.label}</p>
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
              {s.modo === "diff" && <Tag color="violet">diff</Tag>}
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

function ModeTab({ mode, current, onClick, icon: Icon, label, hint }: {
  mode: InputMode;
  current: InputMode;
  onClick: (m: InputMode) => void;
  icon: typeof Code;
  label: string;
  hint: string;
}) {
  const active = mode === current;
  return (
    <button
      type="button"
      onClick={() => onClick(mode)}
      className={clsx(
        "flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition flex-1 sm:flex-none",
        active
          ? "border-violet-500 bg-violet-500/10 text-violet-400"
          : "border-line bg-card text-muted hover:text-fg hover:border-line-strong",
      )}
      title={hint}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function ActiveTaskBanner({ task, onUseContext }: { task: ActiveTask; onUseContext: () => void }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-violet-500/30 bg-violet-500/5 mb-4">
      <Target className="w-4 h-4 text-violet-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted">Tarefa atual</p>
        <p className="text-sm text-fg truncate font-medium">{task.titulo}</p>
      </div>
      <Button variant="ghost" onClick={onUseContext} className="text-xs px-2 py-1">
        Pré-preencher
      </Button>
    </div>
  );
}

function SentinelaInner() {
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("form");
  const [inputMode, setInputMode] = useState<InputMode>("codigo");

  const [titulo, setTitulo] = useState("");
  const [contexto, setContexto] = useState("");
  const [linguagem, setLinguagem] = useState("typescript");
  const [codigo, setCodigo] = useState("");
  const [prUrl, setPrUrl] = useState("");

  const [activeTask, setActiveTaskState] = useState<ActiveTask | null>(null);
  const [activeProject, setActiveProjectState] = useState<ActiveProjectContext | null>(null);

  const [result, setResult] = useState<SentinelaResult | null>(null);
  const [error, setError] = useState("");

  const [checklistMap, setChecklistMap] = useState<Record<string, ChecklistResposta>>({});
  const [decisao, setDecisao] = useState<DecisaoFinal>("corrigir");
  const [reflexao, setReflexao] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSession, setSavedSession] = useState<SentinelaSession | null>(null);
  const [adrCreatedId, setAdrCreatedId] = useState<string | null>(null);

  const obrigatoriosOk = SENTINELA_CHECKLIST.filter((i) => i.obrigatorio).every(
    (i) => checklistMap[i.id] === "sim",
  );

  // Load active task / project + handle ?from=clipboard / ?pr=<url>
  useEffect(() => {
    setActiveTaskState(getActiveTask());
    setActiveProjectState(getActiveProject());

    const fromClipboard = params.get("from") === "clipboard";
    const prParam = params.get("pr");

    if (prParam) {
      setInputMode("pr");
      setPrUrl(prParam);
    } else if (fromClipboard && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.readText().then((text) => {
        if (!text || text.length < 30) return;
        if (looksLikeDiff(text)) {
          setInputMode("diff");
          setCodigo(text);
        } else if (looksLikeCode(text)) {
          setInputMode("codigo");
          setCodigo(text);
        }
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyTaskContext() {
    if (!activeTask) return;
    if (!titulo.trim()) setTitulo(activeTask.titulo);
    if (!contexto.trim()) {
      const parts: string[] = [];
      if (activeTask.dominios.length) parts.push(`Domínios: ${activeTask.dominios.join(", ")}`);
      if (activeTask.stack) parts.push(`Stack: ${activeTask.stack}`);
      if (activeTask.briefing?.systemPrompt) {
        parts.push(`Briefing resumido: ${activeTask.briefing.systemPrompt.slice(0, 400)}…`);
      }
      setContexto(parts.join("\n"));
    }
  }

  async function invocar() {
    const hasInput =
      inputMode === "pr" ? prUrl.trim().length > 0 : codigo.trim().length > 0;
    const needsTitleClient = inputMode !== "pr"; // PR mode autofills title
    if ((needsTitleClient && !titulo.trim()) || !hasInput) return;
    setStep("loading");
    setError("");
    setResult(null);
    try {
      const payload: Record<string, unknown> = {
        titulo,
        contexto: contexto || undefined,
        linguagem,
      };
      if (inputMode === "pr") {
        payload.prUrl = prUrl.trim();
      } else {
        payload.codigo = codigo;
        payload.modo = inputMode === "diff" ? "diff" : "codigo";
      }
      const res = await fetch("/api/ai/sentinela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as SentinelaResult & { error?: string; titulo?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Erro desconhecido.");
        setStep("form");
        return;
      }
      // PR mode may have filled title server-side
      if (data.titulo && !titulo.trim()) setTitulo(data.titulo);
      // PR mode returns the diff inline so we save it
      if (inputMode === "pr") {
        // server-fetched diff is not returned to keep response small;
        // store the URL in the session and a placeholder note
        setCodigo(prUrl.trim());
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
      const sentinelaModo: SentinelaModo =
        inputMode === "diff" || inputMode === "pr" ? "diff" : "codigo";
      const session = await saveSentinelaSession({
        titulo,
        contexto: contexto || undefined,
        codigo,
        linguagem,
        modo: sentinelaModo,
        prUrl: inputMode === "pr" ? prUrl.trim() : undefined,
        taskId: activeTask?.id,
        veredito: result.veredito,
        scoreConfianca: result.scoreConfianca,
        achados: result.achados,
        checklistRespondido,
        decisaoFinal: decisao,
        reflexao: reflexao || undefined,
      });
      await updateSentinelaDecisao(session.id, decisao, reflexao || undefined);

      // Auto-link to active task
      if (activeTask) attachSentinelaSession(session.id);

      // DENY → auto-create ADR draft if there's a project
      let adrId: string | undefined;
      if (result.veredito === "DENY" && activeProject?.id) {
        try {
          const findingsTxt = result.achados
            .slice(0, 8)
            .map((a) => `- [${a.severidade}] ${CATEGORIA_LABEL[a.categoria]}: ${a.descricao}`)
            .join("\n");
          const adr = await createDecisao({
            projetoId: activeProject.id,
            titulo: `[Sentinela DENY] ${titulo}`,
            contexto: contexto?.trim() ||
              `Auditoria Sentinela retornou DENY (score ${result.scoreConfianca}/100). ${result.resumo}`,
            decisao:
              decisao === "aceito"
                ? "Aceito apesar do DENY. Justificativa abaixo."
                : decisao === "rejeitado"
                ? "Rejeitado conforme veredito."
                : "A corrigir antes de aceitar.",
            consequencias: `Achados:\n${findingsTxt}\n\nReflexão: ${reflexao || "—"}`,
            status: decisao === "aceito" ? "aceita" : "proposta",
            cardSlugs: [],
          });
          adrId = adr.id;
          setAdrCreatedId(adr.id);
          await updateSentinelaSession(session.id, { adrId: adr.id });
        } catch (e) {
          console.warn("[sentinela] ADR auto-draft falhou", e);
        }
      }

      setSavedSession({ ...session, adrId });
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
    setPrUrl("");
    setResult(null);
    setError("");
    setChecklistMap({});
    setDecisao("corrigir");
    setReflexao("");
    setSavedSession(null);
    setAdrCreatedId(null);
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

  const inputReady =
    inputMode === "pr"
      ? prUrl.trim().length > 0
      : titulo.trim().length > 0 && codigo.trim().length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-violet-500" />
          <h1 className="text-xl font-bold text-fg">Sentinela</h1>
        </div>
        <p className="text-sm text-muted mt-0.5">
          Cole código, diff ou link do PR. Receba um veredito adversarial antes de aceitar.
        </p>
      </div>

      {activeTask && step === "form" && (
        <ActiveTaskBanner task={activeTask} onUseContext={applyTaskContext} />
      )}

      <HistoricoSection />

      {step === "form" && (
        <Card className="space-y-4">
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
              {error}
            </div>
          )}

          {/* Mode tabs */}
          <div>
            <Label>Modo de entrada</Label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
              <ModeTab mode="codigo" current={inputMode} onClick={setInputMode} icon={FileCode} label="Código" hint="Cole o arquivo/função inteiro" />
              <ModeTab mode="diff" current={inputMode} onClick={setInputMode} icon={Code} label="Diff" hint="Patch unified-diff (git/PR)" />
              <ModeTab mode="pr" current={inputMode} onClick={setInputMode} icon={GitPullRequest} label="PR URL" hint="Link de pull request público no GitHub" />
            </div>
          </div>

          {inputMode !== "pr" && (
            <div>
              <Label htmlFor="titulo">Título da revisão *</Label>
              <Input
                id="titulo"
                placeholder={
                  inputMode === "diff"
                    ? "ex: diff do PR #312 — refator de auth"
                    : "ex: função de autenticação JWT gerada pelo Copilot"
                }
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
          )}

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

          {inputMode !== "pr" && (
            <div>
              <Label htmlFor="linguagem">Linguagem</Label>
              <Select id="linguagem" value={linguagem} onChange={(e) => setLinguagem(e.target.value)}>
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="java">Java</option>
                <option value="sql">SQL</option>
                <option value="diff">Diff (multi-arquivo)</option>
                <option value="outro">Outro</option>
              </Select>
            </div>
          )}

          {inputMode === "pr" && (
            <div>
              <Label htmlFor="prUrl">URL do Pull Request *</Label>
              <Input
                id="prUrl"
                placeholder="https://github.com/owner/repo/pull/123"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
              />
              <p className="text-[11px] text-muted mt-1.5">
                Repos públicos funcionam direto. Privados precisam de <code className="font-mono text-violet-400">GITHUB_TOKEN</code> em <code className="font-mono">.env.local</code>.
              </p>
            </div>
          )}

          {inputMode !== "pr" && (
            <div>
              <Label htmlFor="codigo">{inputMode === "diff" ? "Diff *" : "Código *"}</Label>
              <textarea
                id="codigo"
                rows={inputMode === "diff" ? 16 : 18}
                placeholder={
                  inputMode === "diff"
                    ? "diff --git a/src/auth.ts b/src/auth.ts\n@@ -10,3 +10,8 @@\n+ const token = req.headers.token;\n…"
                    : "Cole aqui o código gerado pela IA..."
                }
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full rounded-md bg-card border border-line px-3 py-2 text-sm font-mono text-fg outline-none focus:border-violet-500/60 resize-y"
              />
              {inputMode === "diff" && codigo && !looksLikeDiff(codigo) && (
                <p className="text-[11px] text-amber-400 mt-1.5">
                  Não parece um diff unified. Esperando linhas com <code className="font-mono">@@</code> ou <code className="font-mono">+/-</code>.
                </p>
              )}
            </div>
          )}

          <Button
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm py-3"
            disabled={!inputReady}
            onClick={invocar}
          >
            Invocar Sentinela
          </Button>
        </Card>
      )}

      {step === "loading" && (
        <Card className="py-16 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">
            {inputMode === "pr" ? "Buscando PR e auditando…" : "Auditoria em andamento…"}
          </p>
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
              {result.prUrl && (
                <a
                  href={result.prUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:underline mt-1"
                >
                  <GitPullRequest className="w-3 h-3" /> {result.prUrl} <ExternalLink className="w-3 h-3" />
                </a>
              )}
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

            {result.veredito === "DENY" && activeProject && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 mb-4">
                <p className="text-xs text-amber-400">
                  ⚠ Veredito DENY: ao salvar, vou criar um <strong>ADR draft</strong> em{" "}
                  <code className="font-mono">/decisoes</code> ligado ao projeto{" "}
                  <strong>{activeProject.nome}</strong>.
                </p>
              </div>
            )}
            {result.veredito === "DENY" && !activeProject && (
              <div className="rounded-md border border-zinc-500/30 bg-zinc-500/5 px-3 py-2 mb-4">
                <p className="text-xs text-muted">
                  Veredito DENY — defina um projeto ativo no topo para gerar ADR draft automático.
                </p>
              </div>
            )}

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
          {adrCreatedId && (
            <Link
              href={`/decisoes`}
              className="text-xs text-amber-400 hover:underline"
            >
              ADR draft criado em /decisoes →
            </Link>
          )}
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

export function SentinelaClient() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-8 text-sm text-muted">Carregando…</div>}>
      <SentinelaInner />
    </Suspense>
  );
}
