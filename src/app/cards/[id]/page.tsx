"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteCustomCard, listCustomCards } from "@/lib/db";
import { Button, Tag } from "@/components/ui";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ChecklistView } from "@/app/biblioteca/[slug]/checklist-view";
import { CATEGORY_LABEL } from "@/lib/types";
import type { CustomCard } from "@/lib/types";

export default function CustomCardPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [card, setCard] = useState<CustomCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCustomCards().then((cards) => {
      setCard(cards.find((c) => c.id === id) ?? null);
      setLoading(false);
    });
  }, [id]);

  async function apagar() {
    if (!card || !confirm(`Apagar o card "${card.title}"?`)) return;
    await deleteCustomCard(card.id);
    router.push("/biblioteca");
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted text-sm">Carregando…</div>;
  }
  if (!card) {
    return (
      <div className="space-y-4">
        <Link href="/biblioteca" className="text-sm text-amber-600 dark:text-amber-400">← biblioteca</Link>
        <p className="text-muted">Card não encontrado.</p>
      </div>
    );
  }

  return (
    <article className="space-y-6 max-w-3xl">
      <div>
        <Link href="/biblioteca" className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300">
          ← biblioteca
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Tag color="violet">custom</Tag>
          <Tag color="amber">{CATEGORY_LABEL[card.category]}</Tag>
          {card.stack?.map((s) => <Tag key={s} color="sky">{s}</Tag>)}
          {card.tags?.map((t) => <Tag key={t}>{t}</Tag>)}
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold">{card.title}</h1>
          <Button variant="danger" onClick={apagar} className="shrink-0">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        {card.excerpt && <p className="text-muted">{card.excerpt}</p>}
      </header>

      {card.category === "checklists" ? (
        <ChecklistView body={card.body} slug={`custom-${card.id}`} cardTitle={card.title} />
      ) : (
        <div className="prose-card">
          <MarkdownRenderer body={card.body} />
        </div>
      )}
    </article>
  );
}
