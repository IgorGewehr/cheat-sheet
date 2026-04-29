import { getAllCards } from "@/lib/content";
import { NovoModuloForm } from "./form";

const TIPOS = [
  "core", "auth", "financeiro", "estoque", "vendas", "compras",
  "rh", "fiscal", "relatórios", "admin", "integração", "outro",
];

const RECOMENDACOES_POR_TIPO: Record<string, string[]> = {
  core: ["modular-monolith", "ddd-light-erp", "nest-module-organization", "repository-pattern"],
  auth: ["auth-architecture", "session-strategy", "rbac-vs-abac", "audit-auth", "account-creation-flow"],
  financeiro: [
    "prompt-modulo-financeiro",
    "soft-delete-audit",
    "outbox-pattern",
    "cqrs-lite",
    "audit-api-endpoint",
  ],
  estoque: ["repository-pattern", "outbox-pattern", "n-plus-1", "cqrs-lite"],
  vendas: ["server-actions", "background-jobs", "outbox-pattern"],
  fiscal: ["outbox-pattern", "saga-pattern", "soft-delete-audit"],
  relatórios: ["cqrs-lite", "caching-layers", "n-plus-1", "postgres-erp-checklist"],
  admin: ["rbac-vs-abac", "multi-filial", "audit-api-endpoint"],
  integração: ["outbox-pattern", "saga-pattern", "go-vs-nest-microservices"],
};

export default async function NovoModuloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cards = getAllCards().map((c) => ({ slug: c.slug, title: c.title, excerpt: c.excerpt }));
  return (
    <NovoModuloForm
      projetoId={id}
      tipos={TIPOS}
      cards={cards}
      recomendacoesPorTipo={RECOMENDACOES_POR_TIPO}
    />
  );
}
