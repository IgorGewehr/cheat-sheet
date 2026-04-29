import { getAllCards } from "@/lib/content";
import { ComparadorView } from "./comparador-view";

const COMPARAVEL_CATEGORIES = [
  "arquiteturas",
  "padroes-backend",
  "padroes-frontend",
  "infra",
  "stack-guides",
  "banco",
  "auth",
];

export default function CompararPage() {
  const cards = getAllCards()
    .filter((c) => COMPARAVEL_CATEGORIES.includes(c.category))
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      category: c.category,
      excerpt: c.excerpt,
    }));

  return <ComparadorView cards={cards} />;
}
