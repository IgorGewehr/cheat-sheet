import Link from "next/link";
import { getAllCards, getCategoriesWithCards } from "@/lib/content";
import { Card, Tag } from "@/components/ui";
import { CATEGORY_LABEL } from "@/lib/types";
import { DashboardStats } from "./dashboard-stats";
import { ChevronDown } from "lucide-react";

export default function Page() {
  const all = getAllCards();
  const groups = getCategoriesWithCards();

  return (
    <div className="space-y-10">
      <DashboardStats totalCards={all.length} />

      <LibrarySection groups={groups} />
    </div>
  );
}

// ─── Collapsible library section ────────────────────────────
// Rendered server-side; collapse toggle handled client-side via
// the native <details> element so no JS bundle cost.

function LibrarySection({
  groups,
}: {
  groups: Array<{ category: string; cards: Array<{ slug: string; title: string }> }>;
}) {
  return (
    <details className="group">
      <summary className="flex items-center gap-2 cursor-pointer list-none select-none mb-4">
        <h2 className="text-lg font-semibold">Biblioteca por categoria</h2>
        <ChevronDown className="w-4 h-4 text-muted transition-transform group-open:rotate-180" />
        <span className="ml-auto text-xs text-muted">
          {groups.reduce((acc, g) => acc + g.cards.length, 0)} cards
        </span>
      </summary>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(({ category, cards }) => (
          <Card key={category}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">
                {CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL] ?? category}
              </h3>
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
    </details>
  );
}
