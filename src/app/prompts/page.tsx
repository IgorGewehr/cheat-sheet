import { getAllCards } from "@/lib/content";
import { PromptBuilder } from "./prompt-builder";

export default function PromptsPage() {
  const promptCards = getAllCards()
    .filter((c) => c.category === "prompts")
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      body: c.body,
      stack: c.stack ?? [],
    }));

  return <PromptBuilder cards={promptCards} />;
}
