import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllCards, getCard } from "@/lib/content";
import { CATEGORY_LABEL } from "@/lib/types";
import { LinkButton, Tag } from "@/components/ui";
import { AdotarButton } from "./adotar-button";
import { DominarButton } from "./dominar-button";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ChecklistView } from "./checklist-view";
import { AIReviewButton } from "./ai-review-button";
import { ExplainButton } from "./explain-button";
import { AlertTriangle, ExternalLink } from "lucide-react";
import type { CardCategory } from "@/lib/types";

export function generateStaticParams() {
  return getAllCards().map((c) => ({ slug: c.slug }));
}

const CATEGORY_COLORS: Partial<Record<CardCategory, string>> = {
  "arquiteturas":      "amber",
  "auth":              "violet",
  "padroes-frontend":  "emerald",
  "padroes-backend":   "sky",
  "banco":             "sky",
  "stack-guides":      "zinc",
  "infra":             "violet",
  "testes":            "emerald",
  "prompts":           "amber",
  "checklists":        "zinc",
  "armadilhas-ia":     "amber",
  "craft":             "amber",
};

export default async function CardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = getCard(slug);
  if (!card) notFound();

  const related = (card.related ?? [])
    .map((s) => getCard(s))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const isArmadilha = card.category === "armadilhas-ia";
  const isCraft = card.category === "craft";
  const isChecklist = card.category === "checklists";
  const isPrompt = card.category === "prompts";

  return (
    <article className="space-y-6 max-w-3xl">
      <div>
        <Link href="/biblioteca" className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300">
          ← biblioteca
        </Link>
      </div>

      <header className="space-y-3">
        {/* Category + stack tags */}
        <div className="flex flex-wrap gap-2 items-center">
          <Tag color={(CATEGORY_COLORS[card.category] as "amber" | "violet" | "emerald" | "sky" | "zinc") ?? "zinc"}>
            {CATEGORY_LABEL[card.category]}
          </Tag>
          {isArmadilha && (
            <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" /> Armadilha da IA
            </span>
          )}
          {card.stack?.map((s) => (
            <Tag key={s} color="sky">{s}</Tag>
          ))}
          {card.tags?.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
          {card.updated && <Tag color="emerald">atualizado {card.updated}</Tag>}
        </div>
        <h1 className="text-3xl font-semibold">{card.title}</h1>
        {card.excerpt && <p className="text-muted">{card.excerpt}</p>}
      </header>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        <DominarButton slug={card.slug} />
        <AdotarButton slug={card.slug} title={card.title} />
        {!isChecklist && !isArmadilha && (
          <div title="Cole código gerado pela IA e receba uma revisão técnica baseada neste padrão">
            <AIReviewButton cardTitle={card.title} stack={card.stack ?? []} />
          </div>
        )}
        {!isChecklist && !isPrompt && (
          <div title="Explica o porquê deste padrão para devs em aprendizado, com exemplos e o que a IA costuma errar">
            <ExplainButton cardTitle={card.title} cardBody={card.body} category={card.category} />
          </div>
        )}
      </div>

      {/* Content */}
      {isChecklist ? (
        <ChecklistView body={card.body} slug={card.slug} cardTitle={card.title} />
      ) : (
        <div className={`prose-card ${isArmadilha ? "border-l-2 border-red-500/40 pl-5" : ""}`}>
          <MarkdownRenderer body={card.body} />
        </div>
      )}

      {/* Related cards — visual grid */}
      {related.length > 0 && (
        <section className="border-t border-line pt-6 space-y-3">
          <h2 className="text-lg font-semibold">Relacionado</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/biblioteca/${r.slug}`}
                className="group flex flex-col gap-1.5 p-4 rounded-xl border border-line bg-card hover:border-amber-500/50 hover:bg-card-hover transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                    {r.title}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-subtle shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <Tag color={(CATEGORY_COLORS[r.category] as "amber" | "violet" | "emerald" | "sky" | "zinc") ?? "zinc"}>
                  {CATEGORY_LABEL[r.category]}
                </Tag>
                {r.excerpt && (
                  <p className="text-xs text-muted leading-snug line-clamp-2">{r.excerpt}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
