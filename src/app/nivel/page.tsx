import { getAllCards } from "@/lib/content";
import { NivelClient } from "./nivel-client";

export default function NivelPage() {
  const allCards = getAllCards();
  return <NivelClient allCards={allCards} />;
}
