import { getAllCards } from "@/lib/content";
import { DebateView } from "./debate-view";

export const metadata = {
  title: "Debate — brain",
  description: "Modo Debate: Inquisidor Socrático, Aprendiz (Mentoria Invertida) e Revisor de Código.",
};

export default function DebatePage() {
  const cards = getAllCards();
  const conceitos = cards.map((c) => ({ slug: c.slug, title: c.title, category: c.category }));
  return <DebateView conceitos={conceitos} />;
}
