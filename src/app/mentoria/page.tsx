import { getAllCards } from "@/lib/content";
import { MentoriaView } from "./mentoria-view";

export default function MentoriaPage() {
  const cards = getAllCards();
  const conceitos = cards.map((c) => ({ slug: c.slug, title: c.title, category: c.category }));
  return <MentoriaView conceitos={conceitos} />;
}
