import { getAllCards } from "@/lib/content";
import { CardDoDiaView } from "./card-do-dia-view";
import type { Card } from "@/lib/types";

export default function CardDoDiaPage() {
  const allCards: Card[] = getAllCards();
  return <CardDoDiaView allCards={allCards} />;
}
