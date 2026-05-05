import Link from "next/link";
import { getAllCards, getCategoriesWithCards } from "@/lib/content";
import { SKILL_AREAS } from "@/lib/skill-trees";
import { BibliotecaSearch } from "./biblioteca-search";
import { LibraryRadar } from "@/components/library-radar";

function bodySnippet(body: string): string {
  return body.replace(/#{1,6}\s/g, "").replace(/[*`_[\]()]/g, "").slice(0, 400);
}

function toCardLite(c: ReturnType<typeof getAllCards>[number]) {
  return {
    slug: c.slug,
    title: c.title,
    excerpt: c.excerpt,
    stack: c.stack ?? [],
    tags: c.tags ?? [],
    category: c.category,
    bodySnippet: bodySnippet(c.body),
  };
}

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ node?: string; area?: string }>;
}) {
  const { node: nodeId, area: areaId } = await searchParams;

  const allCardsRaw = getAllCards();
  const cards = allCardsRaw.map(toCardLite);
  const groups = getCategoriesWithCards().map(({ category, cards: cats }) => ({
    category,
    cards: cats.map(toCardLite),
  }));

  // Filtro por node do skill tracker
  let pinnedSlugs: string[] | undefined;
  let nodeName: string | undefined;
  let nodeAreaName: string | undefined;
  let nodeAreaId: string | undefined;

  if (nodeId && areaId) {
    const area = SKILL_AREAS.find((a) => a.id === areaId);
    const node = area?.nodes.find((n) => n.id === nodeId);
    if (node && area) {
      nodeName = node.name;
      nodeAreaName = area.name;
      nodeAreaId = area.id;
      pinnedSlugs = [
        ...(node.cardSlugs ?? []),
        ...(node.cardSlug && !node.cardSlugs?.includes(node.cardSlug) ? [node.cardSlug] : []),
      ];
    }
  }

  return (
    <div className="space-y-8">
      {pinnedSlugs ? (
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Link
              href={`/skills/${nodeAreaId}`}
              className="hover:text-fg transition"
            >
              ← {nodeAreaName}
            </Link>
            <span>/</span>
            <span className="text-fg font-medium">{nodeName}</span>
          </div>
          <h1 className="text-3xl font-semibold">
            Cards para: {nodeName}
          </h1>
          <p className="text-muted max-w-2xl">
            {pinnedSlugs.length} card{pinnedSlugs.length > 1 ? "s" : ""} vinculado{pinnedSlugs.length > 1 ? "s" : ""} a este tópico.
            Marque todos como <strong>dominado</strong> para que o tópico seja automaticamente concluído na trilha.
          </p>
        </header>
      ) : (
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Biblioteca</h1>
          <p className="text-muted max-w-2xl">
            Cards estruturados — cada um diz <strong>quando usar</strong>, <strong>quando NÃO usar</strong>,{" "}
            <strong>como pedir pra IA</strong> e <strong>como auditar</strong> o que ela gerou.
          </p>
        </header>
      )}

      {!pinnedSlugs && <LibraryRadar allCards={allCardsRaw} />}

      <BibliotecaSearch cards={cards} groups={groups} pinnedSlugs={pinnedSlugs} />
    </div>
  );
}
