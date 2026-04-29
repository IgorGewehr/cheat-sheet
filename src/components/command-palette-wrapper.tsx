import { getAllCards } from "@/lib/content";
import { CommandPaletteClient } from "./command-palette-client";

export function CommandPaletteWrapper() {
  const cards = getAllCards().map((c) => ({
    slug: c.slug,
    title: c.title,
    category: c.category,
    excerpt: c.excerpt,
  }));
  return <CommandPaletteClient cards={cards} />;
}
