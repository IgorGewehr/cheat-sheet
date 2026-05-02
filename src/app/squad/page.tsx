"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  createSquad,
  joinSquad,
  getSquad,
  lookupInviteCode,
  subscribeSquadMembers,
  subscribeSquadPresence,
  subscribeSquadActivity,
  subscribeSquadConstraints,
  subscribeSquadAudits,
  addSquadConstraint,
  deleteSquadConstraint,
  leaveSquad,
} from "@/lib/squad-db";
import type {
  Squad,
  SquadMember,
  SquadPresence,
  SquadActivityEvent,
  SquadConstraint,
  SquadAudit,
  ConstraintType,
} from "@/lib/types";
import { CONSTRAINT_TYPE_LABEL, CONSTRAINT_TYPE_COLOR } from "@/lib/types";
import {
  Users, Plus, Copy, Check, Trash2, Shield, Activity,
  LogOut, Terminal, AlertTriangle, Zap, CheckCircle,
  ChevronDown, ChevronUp, Info, ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

const CONSTRAINT_CATEGORIES = [
  "auth", "banco", "infra", "frontend", "backend",
  "testes", "segurança", "arquitetura", "geral",
];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

function Avatar({ name, color, size = 8 }: { name: string; color: string; size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function ConstraintBadge({ type }: { type: ConstraintType }) {
  return (
    <span className={clsx("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border", CONSTRAINT_TYPE_COLOR[type])}>
      {CONSTRAINT_TYPE_LABEL[type]}
    </span>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {label && <span>{copied ? "Copiado!" : label}</span>}
    </button>
  );
}

// ── No Squad view ─────────────────────────────────────────────

function NoSquadView({
  onCreated,
  onJoined,
}: {
  onCreated: (id: string) => void;
  onJoined: (id: string) => void;
}) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!user || !name.trim() || !displayName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const squad = await createSquad({
        name: name.trim(),
        description: description.trim() || undefined,
        ownerDisplayName: displayName.trim(),
        workspaceId: user.uid,
        ownerId: user.uid,
      });
      onCreated(squad.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar squad.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!user || !inviteCode.trim() || !displayName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const info = await lookupInviteCode(inviteCode.trim());
      if (!info) {
        setError("Código inválido ou expirado.");
        return;
      }
      await joinSquad({
        squadId: info.squadId,
        userId: user.uid,
        displayName: displayName.trim(),
      });
      onJoined(info.squadId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao entrar no squad.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Squad de Engenharia</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Trabalhem juntos com governança real: constraints de arquitetura, presença em tempo real
          e integração direta com o Claude Code.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="flex border-b border-zinc-800">
          {(["create", "join"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "flex-1 py-3 text-sm font-medium transition-colors",
                tab === t ? "text-violet-400 bg-violet-500/10" : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {t === "create" ? "Criar Squad" : "Entrar com Código"}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1.5">
              Seu nome no squad
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Igor"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {tab === "create" ? (
            <>
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                  Nome do squad
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Equipe Backend"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                  Descrição <span className="text-zinc-600">(opcional)</span>
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: ERP multi-tenant — NestJS + PostgreSQL"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={loading || !name.trim() || !displayName.trim()}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
              >
                {loading ? "Criando..." : "Criar Squad"}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                  Código de convite
                </label>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ABCD-1234"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 font-mono tracking-widest"
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={loading || !inviteCode.trim() || !displayName.trim()}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
              >
                {loading ? "Entrando..." : "Entrar no Squad"}
              </button>
            </>
          )}

          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Constraint Form ───────────────────────────────────────

function AddConstraintForm({
  squadId,
  userId,
  displayName,
  onAdd,
}: {
  squadId: string;
  userId: string;
  displayName: string;
  onAdd: () => void;
}) {
  const [type, setType] = useState<ConstraintType>("must");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("geral");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await addSquadConstraint(squadId, {
        title: title.trim(),
        description: description.trim(),
        type,
        category,
        createdBy: displayName,
      });
      setTitle("");
      setDescription("");
      onAdd();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <div className="flex gap-2">
        {(["must", "should", "never", "pattern"] as ConstraintType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={clsx(
              "text-[10px] font-mono font-bold px-2 py-1 rounded border transition-all",
              type === t ? CONSTRAINT_TYPE_COLOR[t] : "border-zinc-700 text-zinc-500 hover:border-zinc-600",
            )}
          >
            {CONSTRAINT_TYPE_LABEL[t]}
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ex: JWT para autenticação, nunca sessions server-side"
        required
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Contexto e justificativa (opcional)"
        rows={2}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
      />
      <div className="flex items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
        >
          {CONSTRAINT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {loading ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
    </form>
  );
}

// ── CLI Setup Section ─────────────────────────────────────────

function CliSetup({
  squadId,
  userId,
  apiUrl,
}: {
  squadId: string;
  userId: string;
  apiUrl: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const envVars = `# Adicione ao seu ~/.zshrc ou ~/.bashrc:
export BRAIN_API_URL="${apiUrl}"
export BRAIN_SQUAD_ID="${squadId}"
export BRAIN_USER_ID="${userId}"
export BRAIN_USER_NAME="Seu Nome"`;

  const aliases = `# Aliases para o terminal:
alias brain-brief='curl -s "$BRAIN_API_URL/api/cli/squad-brief?squadId=$BRAIN_SQUAD_ID&userId=$BRAIN_USER_ID&format=text" | cat'
alias brain-check-in='f(){ curl -s -X POST "$BRAIN_API_URL/api/squad/check-in" -H "Content-Type: application/json" -d "{\\"squadId\\":\\"$BRAIN_SQUAD_ID\\",\\"userId\\":\\"$BRAIN_USER_ID\\",\\"displayName\\":\\"$BRAIN_USER_NAME\\",\\"currentPage\\":\\"CLI\\",\\"currentTask\\":\\"$1\\"}" > /dev/null && echo "✓ Presença atualizada: $1"; }; f'
alias brain-guard='f(){ curl -s -X POST "$BRAIN_API_URL/api/squad/guard" -H "Content-Type: application/json" -d "{\\"squadId\\":\\"$BRAIN_SQUAD_ID\\",\\"code\\":\\"$1\\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('"'"'text'"'"', d))"; }; f'`;

  const claudeHook = `# ~/.claude/settings.json — adicione para integração automática:
{
  "env": {
    "BRAIN_API_URL": "${apiUrl}",
    "BRAIN_SQUAD_ID": "${squadId}",
    "BRAIN_USER_ID": "${userId}",
    "BRAIN_USER_NAME": "Seu Nome"
  }
}`;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Terminal className="w-4 h-4 text-violet-400" />
          Configuração CLI + Claude Code
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-800">
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">1. Variáveis de ambiente</span>
              <CopyButton text={envVars} label="Copiar" />
            </div>
            <pre className="text-xs text-zinc-300 bg-zinc-950 rounded-lg p-3 overflow-x-auto leading-relaxed">
              {envVars}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">2. Aliases</span>
              <CopyButton text={aliases} label="Copiar" />
            </div>
            <pre className="text-xs text-zinc-300 bg-zinc-950 rounded-lg p-3 overflow-x-auto leading-relaxed">
              {aliases}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">3. Claude Code — integração</span>
              <CopyButton text={claudeHook} label="Copiar" />
            </div>
            <pre className="text-xs text-zinc-300 bg-zinc-950 rounded-lg p-3 overflow-x-auto leading-relaxed">
              {claudeHook}
            </pre>
          </div>

          <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3 space-y-2">
            <p className="text-xs text-violet-300 font-medium">Como usar com Claude Code</p>
            <div className="space-y-1">
              {[
                { cmd: "brain-brief", desc: "Injeta constraints + presença + atividade no contexto do Claude Code" },
                { cmd: "brain-check-in 'auth module'", desc: "Atualiza presença — visível no dashboard pelo squad" },
                { cmd: "brain-guard 'código aqui'", desc: "Valida o código contra as constraints do squad" },
              ].map(({ cmd, desc }) => (
                <div key={cmd} className="flex items-start gap-2">
                  <code className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                    {cmd}
                  </code>
                  <span className="text-[11px] text-zinc-400 leading-relaxed">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Squad Audit Row ───────────────────────────────────────────

const AUDIT_VEREDITO: Record<string, string> = {
  PASS: "text-violet-400 border-violet-500/40 bg-violet-500/5",
  WARN: "text-amber-400 border-amber-500/40 bg-amber-500/5",
  DENY: "text-red-400 border-red-500/40 bg-red-500/5",
};

function SquadAuditRow({ audit }: { audit: SquadAudit }) {
  return (
    <Link
      href={`/sentinela/${audit.id}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors"
    >
      <span className={clsx("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0", AUDIT_VEREDITO[audit.veredito])}>
        {audit.veredito}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-200 truncate font-medium">{audit.titulo}</p>
        <p className="text-[10px] text-zinc-500">
          {audit.sharedByName} · {audit.scoreConfianca}/100 · {audit.achadosCount} achados
        </p>
      </div>
      <span className="text-[10px] text-zinc-600 shrink-0">{timeAgo(audit.sharedAt)}</span>
    </Link>
  );
}

// ── Main Dashboard ────────────────────────────────────────────

export default function SquadPage() {
  const { user } = useAuth();
  const [squadId, setSquadId] = useState<string | null>(null);
  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [presence, setPresence] = useState<SquadPresence[]>([]);
  const [activity, setActivity] = useState<SquadActivityEvent[]>([]);
  const [constraints, setConstraints] = useState<SquadConstraint[]>([]);
  const [audits, setAudits] = useState<SquadAudit[]>([]);
  const [view, setView] = useState<"loading" | "no-squad" | "dashboard">("loading");
  const [showAddConstraint, setShowAddConstraint] = useState(false);
  const [copied, setCopied] = useState(false);
  const unsubs = useRef<Array<() => void>>([]);

  // Load squad ID from localStorage
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("brain.squadId") : null;
    if (saved) {
      setSquadId(saved);
    } else {
      setView("no-squad");
    }
  }, []);

  // Load squad data
  useEffect(() => {
    if (!squadId || !user) return;

    getSquad(squadId).then((s) => {
      if (!s) {
        setView("no-squad");
        return;
      }
      setSquad(s);
      setView("dashboard");
    });

    const u1 = subscribeSquadMembers(squadId, setMembers);
    const u2 = subscribeSquadPresence(squadId, setPresence);
    const u3 = subscribeSquadActivity(squadId, setActivity);
    const u4 = subscribeSquadConstraints(squadId, setConstraints);
    const u5 = subscribeSquadAudits(squadId, setAudits);

    unsubs.current = [u1, u2, u3, u4, u5];
    return () => {
      unsubs.current.forEach((u) => u());
    };
  }, [squadId, user]);

  function handleSquadCreated(id: string) {
    setSquadId(id);
    setView("loading");
  }

  function handleLeave() {
    if (!squadId || !user) return;
    if (!confirm("Sair do squad? Você perderá acesso ao workspace compartilhado.")) return;
    leaveSquad(squadId, user.uid).then(() => {
      setSquadId(null);
      setSquad(null);
      setView("no-squad");
    });
  }

  function copyInviteCode() {
    if (!squad) return;
    navigator.clipboard.writeText(squad.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const myMember = members.find((m) => m.userId === user?.uid);
  const isOwner = squad?.ownerId === user?.uid;

  if (!user) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-zinc-400 text-center">Faça login para usar o Squad.</p>
      </main>
    );
  }

  if (view === "loading") {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-zinc-500 text-sm text-center">Carregando squad...</div>
      </main>
    );
  }

  if (view === "no-squad") {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <NoSquadView
          onCreated={handleSquadCreated}
          onJoined={handleSquadCreated}
        />
      </main>
    );
  }

  const apiUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">{squad?.name}</h1>
              {squad?.description && (
                <p className="text-sm text-zinc-500">{squad.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Invite code */}
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
            <span className="text-xs text-zinc-500">Código:</span>
            <code className="text-sm font-mono font-bold text-violet-400 tracking-widest">
              {squad?.inviteCode}
            </code>
            <button
              onClick={copyInviteCode}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-2"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Presence + Activity */}
        <div className="lg:col-span-2 space-y-5">
          {/* Online Now */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online agora ({presence.length})
            </h2>
            {presence.length === 0 ? (
              <p className="text-xs text-zinc-600">Ninguém online agora.</p>
            ) : (
              <div className="space-y-2">
                {presence.map((p) => (
                  <div key={p.userId} className="flex items-center gap-2.5">
                    <div className="relative">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: members.find((m) => m.userId === p.userId)?.avatarColor ?? "#7c3aed" }}
                      >
                        {p.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-zinc-900" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{p.displayName}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{p.currentTask ?? p.currentPage}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All members */}
            {members.filter((m) => !presence.find((p) => p.userId === m.userId)).length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <p className="text-[10px] text-zinc-600 mb-2">Outros membros</p>
                <div className="flex flex-wrap gap-2">
                  {members
                    .filter((m) => !presence.find((p) => p.userId === m.userId))
                    .map((m) => (
                      <div key={m.userId} className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold opacity-40"
                          style={{ backgroundColor: m.avatarColor }}
                        >
                          {m.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[10px] text-zinc-600">{m.displayName}</span>
                        {m.role === "owner" && <span className="text-[9px] text-violet-500">owner</span>}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </section>

          {/* Activity Feed */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              Atividade recente
            </h2>
            {activity.length === 0 ? (
              <p className="text-xs text-zinc-600">Nenhuma atividade ainda.</p>
            ) : (
              <div className="space-y-2.5">
                {activity.slice(0, 15).map((ev) => (
                  <div key={ev.id} className="flex items-start gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold mt-0.5 flex-shrink-0"
                      style={{ backgroundColor: members.find((m) => m.userId === ev.userId)?.avatarColor ?? "#7c3aed" }}
                    >
                      {ev.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        <span className="font-medium">{ev.displayName}</span>
                        {" "}{ev.verb}{" "}
                        <span className="text-zinc-400">{ev.entityType}</span>
                        {": "}
                        {ev.url ? (
                          <a href={ev.url} className="text-violet-400 hover:underline truncate">{ev.entityTitle}</a>
                        ) : (
                          <span className="text-zinc-300">{ev.entityTitle}</span>
                        )}
                      </p>
                      <p className="text-[10px] text-zinc-600">{timeAgo(ev.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: Constraints */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              Architecture Constraints
              <span className="text-xs text-zinc-600 font-normal">
                ({constraints.filter((c) => c.active).length} ativas)
              </span>
            </h2>
            <button
              onClick={() => setShowAddConstraint(!showAddConstraint)}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>

          {showAddConstraint && (
            <AddConstraintForm
              squadId={squadId!}
              userId={user.uid}
              displayName={myMember?.displayName ?? user.displayName ?? "Dev"}
              onAdd={() => setShowAddConstraint(false)}
            />
          )}

          {constraints.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
              <Shield className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 mb-1">Nenhuma constraint ainda.</p>
              <p className="text-xs text-zinc-600">
                Defina regras de arquitetura que todos devem seguir —
                o Claude Code vai consultá-las automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {constraints.filter((c) => c.active).map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 group"
                >
                  <div className="flex items-start gap-2.5">
                    <ConstraintBadge type={c.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">{c.title}</p>
                      {c.description && (
                        <p className="text-xs text-zinc-500 mt-0.5">{c.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
                          {c.category}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          por {c.createdBy}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSquadConstraint(squadId!, c.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 p-3">
            <p className="text-[10px] font-medium text-zinc-500 mb-2 flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              Como o Claude Code usa as constraints
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {(["must", "should", "never", "pattern"] as ConstraintType[]).map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <ConstraintBadge type={t} />
                  <span className="text-[10px] text-zinc-600">
                    {t === "must" && "Obrigatório em todo código"}
                    {t === "should" && "Preferência forte do squad"}
                    {t === "never" && "Proibido — nunca faça"}
                    {t === "pattern" && "Template/padrão a copiar"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CLI Setup */}
      <CliSetup squadId={squadId!} userId={user.uid} apiUrl={apiUrl} />

      {/* Shared Audits */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
          Auditorias do Squad
          <span className="text-zinc-600 font-normal text-[10px]">({audits.length})</span>
        </h2>
        {audits.length === 0 ? (
          <p className="text-xs text-zinc-600">
            Nenhuma auditoria compartilhada ainda. Use{" "}
            <Link href="/sentinela" className="text-violet-400 hover:underline">Sentinela</Link>
            {" "}e clique em "Compartilhar com Squad" após o veredicto.
          </p>
        ) : (
          <div className="space-y-2">
            {audits.map((a) => <SquadAuditRow key={a.id} audit={a} />)}
          </div>
        )}
      </section>
    </main>
  );
}
