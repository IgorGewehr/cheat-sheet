export interface ActiveProjectContext {
  id: string;
  nome: string;
  stack: string[];
  tipo?: string;
}

export function getActiveProject(): ActiveProjectContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("brain.activeProject");
    return raw ? (JSON.parse(raw) as ActiveProjectContext) : null;
  } catch {
    return null;
  }
}

export function setActiveProject(p: ActiveProjectContext | null) {
  if (p) {
    localStorage.setItem("brain.activeProject", JSON.stringify(p));
  } else {
    localStorage.removeItem("brain.activeProject");
  }
}

// Maps project stack/tipo to card categories most relevant to study
export type CardCategory =
  | "arquiteturas" | "auth" | "padroes-frontend" | "padroes-backend"
  | "banco" | "stack-guides" | "infra" | "testes" | "armadilhas-ia"
  | "craft" | "agentes-ia" | "data-science";

export function getRelevantCategories(stack: string[], tipo?: string): CardCategory[] {
  const cats = new Set<CardCategory>();
  const s = stack.map((t) => t.toLowerCase());

  if (s.some((t) => ["react", "next", "nextjs", "vue", "angular", "svelte"].includes(t))) cats.add("padroes-frontend");
  if (s.some((t) => ["nestjs", "express", "fastify", "go", "fiber", "chi", "gin", "node", "hono", "fastapi"].includes(t))) cats.add("padroes-backend");
  if (s.some((t) => ["postgres", "mysql", "mongodb", "prisma", "firebase", "firestore", "redis", "sqlite"].includes(t))) cats.add("banco");
  if (s.some((t) => ["docker", "k8s", "kubernetes", "nginx", "traefik", "aws", "gcp"].includes(t))) cats.add("infra");
  if (s.some((t) => ["jwt", "auth", "nextauth", "keycloak", "oauth"].includes(t))) cats.add("auth");
  if (s.some((t) => ["jest", "vitest", "testing", "cypress", "playwright"].includes(t))) cats.add("testes");
  if (s.some((t) => ["python", "pandas", "numpy", "sklearn", "scikit", "pytorch", "tensorflow", "jupyter", "mlflow", "lightgbm", "xgboost"].includes(t))) cats.add("data-science");
  if (s.some((t) => ["langchain", "langgraph", "openai", "anthropic", "llm", "rag"].includes(t))) cats.add("agentes-ia");

  if (tipo === "frontend") cats.add("padroes-frontend");
  if (tipo === "backend" || tipo === "microsservico") { cats.add("padroes-backend"); cats.add("banco"); }
  if (tipo === "fullstack") { cats.add("padroes-frontend"); cats.add("padroes-backend"); }

  cats.add("craft");
  cats.add("armadilhas-ia");

  return Array.from(cats);
}
