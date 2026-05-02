import { Suspense } from "react";
import { TrilhaEntryClient } from "./trilha-entry-client";

export const metadata = {
  title: "Trilha Entry — Brain",
  description: "Trilha de entrada para fundamentos por track: fullstack, data-science, ai-engineer, ai-agents.",
};

export default function TrilhaEntryPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-12 px-4 text-sm text-muted font-mono">Carregando trilha...</div>}>
      <TrilhaEntryClient />
    </Suspense>
  );
}
