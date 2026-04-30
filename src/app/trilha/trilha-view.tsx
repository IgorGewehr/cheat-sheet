"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { GraduationCap, ChevronRight, ExternalLink } from "lucide-react";
import { Card, Tag } from "@/components/ui";
import Link from "next/link";
import { type Card as CardType, type NivelTrilha, type TrilhaProgresso } from "@/lib/types";
import { listTrilhaProgresso } from "@/lib/db";

// ─── Seniority track mapping ──────────────────────────────────────────────────
const NIVEL_CARDS: Record<NivelTrilha, string[]> = {
  junior: [
    "dto-validation",
    "repository-pattern",
    "session-cookie-vs-jwt",
    "rbac-vs-abac",
    "n-plus-1",
    "decimal-money",
    "soft-delete-audit",
    "migrations-zero-downtime",
    "docker-compose-dev",
    "server-components",
    "server-actions",
    "app-router",
    "account-creation-flow",
    "llm-fundamentos",
    "prompt-engineering-avancado",
    "tool-use-function-calling",
  ],
  pleno: [
    "modular-monolith",
    "clean-architecture",
    "hexagonal",
    "ddd-light-erp",
    "auth-architecture",
    "session-strategy",
    "token-encryption-at-rest",
    "nest-module-organization",
    "use-cases",
    "drizzle-vs-prisma-2026",
    "firestore-cost-optimization",
    "docker-multistage",
    "monorepo-turborepo",
    "background-jobs",
    "caching-layers",
    "rate-limit-distribuido",
    "streaming-suspense",
    "observability",
    "langchain-fundamentos",
    "langchain-agents",
    "rag-fundamentos",
    "vector-databases",
    "anthropic-sdk-patterns",
    "claude-tool-use",
    "langsmith-observabilidade",
  ],
  senior: [
    "cqrs-lite",
    "event-driven",
    "outbox-pattern",
    "saga-pattern",
    "gateway-compliance",
    "multi-tenant-strategies",
    "firestore-multi-tenant",
    "microservices-quando-usar",
    "golang-microservices",
    "golang-grpc",
    "go-vs-nest-microservices",
    "audit-api-endpoint",
    "audit-auth",
    "audit-migration",
    "certificado-digital-a1",
    "sefaz-integration-br",
    "langgraph-fundamentos",
    "langgraph-patterns",
    "rag-avancado",
    "graph-rag",
    "mcp-protocol",
    "agent-memory-patterns",
    "multi-agent-orchestration",
    "human-in-the-loop",
  ],
  staff: [
    "multi-filial",
    "omnichannel-conversations",
    "golang-chi-gin-fiber",
    "monorepo-turborepo",
    "postgres-erp-checklist",
    "prompt-modulo-crud-nest",
    "prompt-modulo-financeiro",
    "como-auditar-codigo-ia",
    "quando-nao-usar-ia",
    "agent-evaluation",
    "agent-security",
    "agent-observabilidade-producao",
    "agent-deployment",
    "claude-code-sdk",
    "agente-financeiro-erp",
    "ai-agent-architecture",
  ],
};

const NIVEL_META: Record<NivelTrilha, { label: string; color: string; textColor: string; description: string }> = {
  junior: {
    label: "Júnior",
    color: "bg-sky-500",
    textColor: "text-sky-600 dark:text-sky-400",
    description: "Fundamentos sólidos: validação, repositórios, auth básica, banco, containers + fundamentos de LLMs e prompt engineering",
  },
  pleno: {
    label: "Pleno",
    color: "bg-emerald-500",
    textColor: "text-emerald-600 dark:text-emerald-400",
    description: "Arquitetura aplicada: monólito modular, DDD leve, clean arch, infra avançada + agentes com LangChain, RAG e observabilidade",
  },
  senior: {
    label: "Sênior",
    color: "bg-amber-500",
    textColor: "text-amber-600 dark:text-amber-400",
    description: "Sistemas distribuídos: CQRS, Event-Driven, microsserviços, multi-tenant, compliance + LangGraph, RAG avançado, MCP e orquestração multi-agente",
  },
  staff: {
    label: "Staff",
    color: "bg-violet-500",
    textColor: "text-violet-600 dark:text-violet-400",
    description: "Liderança técnica: multi-filial, IA com auditoria, design de plataformas complexas + avaliação, segurança e deploy de agentes em produção",
  },
};

const NIVEL_ORDER: NivelTrilha[] = ["junior", "pleno", "senior", "staff"];

export function TrilhaView({ allCards }: { allCards: CardType[] }) {
  const [progresso, setProgresso] = useState<TrilhaProgresso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cardBySlug = new Map(allCards.map((c) => [c.slug, c]));

  useEffect(() => {
    listTrilhaProgresso()
      .then(setProgresso)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const progressBySlug = new Map(progresso.map((p) => [p.cardSlug, p]));

  // Aggregate totals
  const allSlugs = NIVEL_ORDER.flatMap((n) => NIVEL_CARDS[n]);
  const uniqueSlugs = [...new Set(allSlugs)];
  const totalDominados = uniqueSlugs.filter((s) => progressBySlug.get(s)?.dominado).length;
  const totalEmProgresso = uniqueSlugs.filter(
    (s) => !progressBySlug.get(s)?.dominado && (progressBySlug.get(s)?.tentativas ?? 0) > 0,
  ).length;
  const totalNaoIniciados = uniqueSlugs.length - totalDominados - totalEmProgresso;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-amber-500" />
          Trilha de Senioridade
        </h1>
        <p className="text-muted max-w-2xl">
          Mapa de conhecimentos organizados por nível. Pratique os cards e marque como dominados
          para acompanhar sua evolução.
        </p>
      </header>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Overall stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total de conceitos" value={String(uniqueSlugs.length)} color="text-fg" />
        <StatCard label="Dominados" value={String(totalDominados)} color="text-emerald-500" />
        <StatCard label="Em progresso" value={String(totalEmProgresso)} color="text-amber-500" />
        <StatCard label="Não iniciados" value={String(totalNaoIniciados)} color="text-muted" />
      </div>

      {/* Global progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted">
          <span>Progresso geral</span>
          <span>{totalDominados}/{uniqueSlugs.length} dominados</span>
        </div>
        <div className="h-2.5 rounded-full bg-card border border-line overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.round((totalDominados / uniqueSlugs.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* Levels */}
      {NIVEL_ORDER.map((nivel) => {
        const slugs = NIVEL_CARDS[nivel];
        const meta = NIVEL_META[nivel];
        const dominados = slugs.filter((s) => progressBySlug.get(s)?.dominado).length;
        const emProgresso = slugs.filter(
          (s) => !progressBySlug.get(s)?.dominado && (progressBySlug.get(s)?.tentativas ?? 0) > 0,
        ).length;
        const pct = Math.round((dominados / slugs.length) * 100);

        return (
          <Card key={nivel} className="space-y-5">
            {/* Level header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={clsx("text-lg font-semibold", meta.textColor)}>{meta.label}</span>
                  <Tag color={nivel === "junior" ? "sky" : nivel === "pleno" ? "emerald" : nivel === "senior" ? "amber" : "violet"}>
                    {dominados}/{slugs.length} dominados
                  </Tag>
                  {emProgresso > 0 && (
                    <Tag color="zinc">{emProgresso} em progresso</Tag>
                  )}
                </div>
                <p className="text-xs text-muted">{meta.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-semibold">{pct}%</span>
              </div>
            </div>

            {/* Level progress bar */}
            <div className="h-1.5 rounded-full bg-card border border-line overflow-hidden">
              <div
                className={clsx("h-full rounded-full transition-all duration-700", meta.color)}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Cards chips */}
            <div className="flex flex-wrap gap-2">
              {slugs.map((slug) => {
                const p = progressBySlug.get(slug);
                const card = cardBySlug.get(slug);
                const isDominado = p?.dominado ?? false;
                const isEmProgresso = !isDominado && (p?.tentativas ?? 0) > 0;

                return (
                  <div key={slug} className="flex items-center gap-1">
                    <Link
                      href={`/biblioteca/${slug}`}
                      className={clsx(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition group",
                        isDominado
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:border-emerald-500"
                          : isEmProgresso
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:border-amber-500"
                          : "border-line bg-card text-muted hover:border-line-strong hover:text-fg",
                      )}
                      title={card?.title ?? slug}
                    >
                      {isDominado ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      ) : isEmProgresso ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                      )}
                      {card?.title ?? slug}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition" />
                    </Link>
                    <Link
                      href={`/card-do-dia?card=${slug}`}
                      title="Praticar este card"
                      className="inline-flex items-center px-1.5 py-1.5 rounded-full border border-line text-muted hover:border-amber-500/60 hover:text-amber-500 transition text-[10px]"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Per-level score distribution if any progress */}
            {(dominados > 0 || emProgresso > 0) && (
              <div className="pt-2 border-t border-line flex items-center gap-4 text-xs text-muted">
                {dominados > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {dominados} dominados
                  </span>
                )}
                {emProgresso > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {emProgresso} em progresso
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-400" />
                  {slugs.length - dominados - emProgresso} não iniciados
                </span>
              </div>
            )}
          </Card>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Dominado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Em progresso
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-zinc-400" />
          Não iniciado
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3" /> Praticar via Card do Dia
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="text-center py-4 space-y-1">
      <div className={clsx("text-3xl font-semibold", color)}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </Card>
  );
}
