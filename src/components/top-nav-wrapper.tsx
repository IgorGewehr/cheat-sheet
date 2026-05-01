import { getAllCards } from "@/lib/content";
import { TopNavClient } from "./top-nav-client";

export function TopNavWrapper() {
  const cards = getAllCards().map((c) => ({
    slug: c.slug,
    title: c.title,
    category: c.category,
    excerpt: c.excerpt,
  }));
  return <TopNavClient cards={cards} />;
}
