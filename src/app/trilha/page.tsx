import { getAllCards } from "@/lib/content";
import { TrilhaView } from "./trilha-view";
import type { Card } from "@/lib/types";

export default function TrilhaPage() {
  const allCards: Card[] = getAllCards();
  return <TrilhaView allCards={allCards} />;
}
