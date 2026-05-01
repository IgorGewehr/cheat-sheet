import { getAllCards, getCategoriesWithCards } from "@/lib/content";
import { BibliotecaSearch } from "./biblioteca-search";
import { LibraryRadar } from "@/components/library-radar";

function bodySnippet(body: string): string {
  return body.replace(/#{1,6}\s/g, "").replace(/[*`_[\]()]/g, "").slice(0, 400);
}

export default function BibliotecaPage() {
  const allCardsRaw = getAllCards();
  const cards = allCardsRaw.map((c) => ({
    slug: c.slug,
    title: c.title,
    excerpt: c.excerpt,
    stack: c.stack ?? [],
    tags: c.tags ?? [],
    category: c.category,
    bodySnippet: bodySnippet(c.body),
  }));
  const groups = getCategoriesWithCards().map(({ category, cards: cats }) => ({
    category,
    cards: cats.map((c) => ({
      slug: c.slug,
      title: c.title,
      excerpt: c.excerpt,
      stack: c.stack ?? [],
      tags: c.tags ?? [],
      category: c.category,
      bodySnippet: bodySnippet(c.body),
    })),
  }));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Biblioteca</h1>
        <p className="text-muted max-w-2xl">
          Cards estruturados — cada um diz <strong>quando usar</strong>, <strong>quando NÃO usar</strong>,{" "}
          <strong>como pedir pra IA</strong> e <strong>como auditar</strong> o que ela gerou.
        </p>
      </header>

      <LibraryRadar allCards={allCardsRaw} />

      <BibliotecaSearch cards={cards} groups={groups} />
    </div>
  );
}
