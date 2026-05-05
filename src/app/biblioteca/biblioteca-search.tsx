"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import { Search, Plus } from "lucide-react";
import { Card, Tag } from "@/components/ui";
import type { CardCategory } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/types";

type CardLite = {
  slug: string;
  title: string;
  excerpt: string;
  stack: string[];
  tags: string[];
  category: CardCategory;
  bodySnippet?: string;
  isCustom?: boolean;
};

export function BibliotecaSearch({
  cards,
  groups,
  pinnedSlugs,
}: {
  cards: CardLite[];
  groups: { category: CardCategory; cards: CardLite[] }[];
  pinnedSlugs?: string[];
}) {
  const [q, setQ] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(cards, {
        keys: [
          { name: "title", weight: 3 },
          { name: "excerpt", weight: 1.5 },
          { name: "tags", weight: 0.8 },
          { name: "stack", weight: 0.8 },
          { name: "bodySnippet", weight: 0.4 },
        ],
        threshold: 0.35,
        includeScore: true,
      }),
    [cards],
  );

  // Modo filtrado pela trilha: mostra só os cards pinados
  if (pinnedSlugs) {
    const slugSet = new Set(pinnedSlugs);
    const pinned = pinnedSlugs
      .map((slug) => cards.find((c) => c.slug === slug))
      .filter((c): c is CardLite => Boolean(c));

    const results = q.trim().length > 1
      ? fuse.search(q).map((r) => r.item).filter((c) => slugSet.has(c.slug))
      : pinned;

    return (
      <div className="space-y-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar neste tópico…"
              className="w-full rounded-xl border border-line bg-card pl-9 pr-4 py-2.5 text-sm text-fg outline-none focus:border-amber-500 transition"
            />
          </div>
          <Link
            href="/biblioteca"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-line bg-card text-sm text-muted hover:text-fg hover:border-amber-500 transition"
          >
            Ver tudo
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((c) => (
            <CardLink key={c.slug} card={c} showDominarBadge />
          ))}
        </div>
      </div>
    );
  }

  const results = q.trim().length > 1 ? fuse.search(q).map((r) => r.item) : null;

  return (
    <div className="space-y-8">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, tag, stack, conteúdo…"
            className="w-full rounded-xl border border-line bg-card pl-9 pr-4 py-2.5 text-sm text-fg outline-none focus:border-amber-500 transition"
          />
        </div>
        <Link
          href="/cards/novo"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-line bg-card text-sm text-muted hover:text-fg hover:border-amber-500 transition"
        >
          <Plus className="w-4 h-4" /> Card próprio
        </Link>
      </div>

      {results !== null ? (
        <section className="space-y-3">
          <p className="text-sm text-muted">
            {results.length === 0
              ? "Nenhum resultado para esta busca."
              : `${results.length} resultado${results.length > 1 ? "s" : ""}`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((c) => (
              <CardLink key={`${c.isCustom ? "custom-" : ""}${c.slug}`} card={c} />
            ))}
          </div>
        </section>
      ) : (
        groups.map(({ category, cards: cats }) => (
          <section key={category} className="space-y-3">
            <h2 className="text-xl font-semibold">{CATEGORY_LABEL[category]}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cats.map((c) => (
                <CardLink key={`${c.isCustom ? "custom-" : ""}${c.slug}`} card={c} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function CardLink({ card, showDominarBadge }: { card: CardLite; showDominarBadge?: boolean }) {
  const href = card.isCustom ? `/cards/${card.slug}` : `/biblioteca/${card.slug}`;
  return (
    <Link href={href}>
      <Card className="h-full hover:bg-card-hover">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-fg">{card.title}</h3>
          {card.isCustom && <Tag color="violet">custom</Tag>}
        </div>
        <p className="text-sm text-muted mb-3">{card.excerpt}</p>
        <div className="flex flex-wrap gap-1.5">
          {card.stack?.map((s) => (
            <Tag key={s} color="sky">
              {s}
            </Tag>
          ))}
          {card.tags?.slice(0, 3).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
          {showDominarBadge && (
            <Tag color="amber">marcar dominado →</Tag>
          )}
        </div>
      </Card>
    </Link>
  );
}
