import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MODELS = {
  // gpt-5.5 — raciocínio profundo
  review: "gpt-5.5",
  briefing: "gpt-5.5",
  compare: "gpt-5.5",
  revisor: "gpt-5.5",
  warGame: "gpt-5.5",
  systemDesign: "gpt-5.5",
  mockInterview: "gpt-5.5",
  rfc: "gpt-5.5",
  refatoracao: "gpt-5.5",
  interrogatorio: "gpt-5.5",
  goExam: "gpt-5.5",
  // gpt-5.4 — geração de conteúdo
  enhance: "gpt-5.4",
  explain: "gpt-5.4",
  adr: "gpt-5.4",
  card: "gpt-5.4",
  cardDodia: "gpt-5.4",
  mentoria: "gpt-5.4",
  antiPattern: "gpt-5.4",
  retrospectiva: "gpt-5.4",
  star: "gpt-5.4",
  // gpt-5.4-mini — tarefas rápidas
  suggest: "gpt-5.4-mini",
} as const;
