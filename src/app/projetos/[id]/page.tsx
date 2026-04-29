import { getAllCards } from "@/lib/content";
import { ProjetoView } from "./projeto-view";

export default async function ProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cards = getAllCards().map((c) => ({
    slug: c.slug,
    title: c.title,
    excerpt: c.excerpt,
    stack: c.stack ?? [],
  }));
  return <ProjetoView projetoId={id} cards={cards} />;
}
