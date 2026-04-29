import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MODELS = {
  // gpt-5.5 — raciocínio profundo: code review, comparação de arquiteturas, briefings de sessão
  review: "gpt-5.5",
  briefing: "gpt-5.5",
  compare: "gpt-5.5",
  // gpt-5.4 — geração de conteúdo: prompt enhance, explicações, ADRs, cards
  enhance: "gpt-5.4",
  explain: "gpt-5.4",
  adr: "gpt-5.4",
  card: "gpt-5.4",
  // gpt-5.4-mini — tarefas rápidas: sugestões, classificação
  suggest: "gpt-5.4-mini",
} as const;
