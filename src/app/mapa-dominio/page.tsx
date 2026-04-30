import { getAllCards } from "@/lib/content";
import { MapaDominioView } from "./mapa-dominio-view";
import type { Card } from "@/lib/types";

export default function MapaDominioPage() {
  const allCards: Card[] = getAllCards();
  return <MapaDominioView allCards={allCards} />;
}
