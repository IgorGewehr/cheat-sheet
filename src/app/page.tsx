import Link from "next/link";
import { getAllCards, getCategoriesWithCards } from "@/lib/content";
import { Card, Tag } from "@/components/ui";
import { CATEGORY_LABEL } from "@/lib/types";
import { DashboardStats } from "./dashboard-stats";
import { ChevronRight, Zap, Scale } from "lucide-react";

export default function Page() {
  const all = getAllCards();
  const groups = getCategoriesWithCards();

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted max-w-2xl">
          Antes de começar um módulo novo ou pedir um pedaço grande pra IA, abre essa página. Aqui
          você vê o que já adotou, o que falta, e tem atalho pros padrões mais usados no stack.
        </p>
      </header>

      {/* New features callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link href="/sessao">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm flex items-center gap-1.5">
                Sessão com IA <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500 text-zinc-950">novo</span>
              </p>
              <p className="text-xs text-muted mt-0.5">Gere um briefing sênior antes de abrir o Cursor ou Claude</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted shrink-0 ml-auto" />
          </div>
        </Link>
        <Link href="/comparar">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-violet-500/40 bg-violet-500/5 hover:bg-violet-500/10 transition">
            <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm flex items-center gap-1.5">
                Comparar Arquiteturas <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500 text-white">novo</span>
              </p>
              <p className="text-xs text-muted mt-0.5">Compare 2 a 4 opções — tabela de trade-offs gerada por GPT-5.5</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted shrink-0 ml-auto" />
          </div>
        </Link>
      </div>

      <DashboardStats totalCards={all.length} />

      <section>
        <h2 className="text-xl font-semibold mb-4">Por onde começar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickStart
            href="/biblioteca/modular-monolith"
            title="Vou começar um projeto novo"
            desc="Modular Monolith é o ponto de partida certo pra ERP. Microsserviços só depois que doer."
          />
          <QuickStart
            href="/biblioteca/auth-architecture"
            title="Vou implementar autenticação"
            desc="Separe identity, profile e tenant membership. Não bote tudo no mesmo lugar."
          />
          <QuickStart
            href="/biblioteca/multi-filial"
            title="Empresa com filiais / multi-loja"
            desc="Modelagem de organização → empresa → filial → departamento, e como permissões cascateiam."
          />
          <QuickStart
            href="/biblioteca/multi-tenant-strategies"
            title="ERP multi-tenant"
            desc="Pool, silo, bridge — cada um com tradeoff real. Escolha antes de codar."
          />
          <QuickStart
            href="/biblioteca/audit-api-endpoint"
            title="A IA me gerou um endpoint"
            desc="Checklist obrigatório antes de fazer merge. Auth, validação, logs, N+1, tudo."
          />
          <QuickStart
            href="/biblioteca/prompt-modulo-financeiro"
            title="Vou pedir um módulo financeiro"
            desc="Prompt template que cobre regras de negócio, auditoria, e edge cases."
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Biblioteca por categoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(({ category, cards }) => (
            <Card key={category}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{CATEGORY_LABEL[category]}</h3>
                <Tag>{cards.length}</Tag>
              </div>
              <ul className="space-y-1.5">
                {cards.slice(0, 6).map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/biblioteca/${c.slug}`}
                      className="text-sm text-muted hover:text-amber-600 dark:hover:text-amber-300 transition"
                    >
                      {c.title}
                    </Link>
                  </li>
                ))}
                {cards.length > 6 && (
                  <li>
                    <Link
                      href={`/biblioteca?category=${category}`}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      + {cards.length - 6} mais →
                    </Link>
                  </li>
                )}
              </ul>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickStart({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href}>
      <Card className="h-full hover:bg-card-hover group">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-fg">{title}</h3>
          <ChevronRight className="w-4 h-4 text-muted shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition" />
        </div>
        <p className="text-sm text-muted">{desc}</p>
      </Card>
    </Link>
  );
}
