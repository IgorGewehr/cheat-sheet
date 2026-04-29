import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { getCard } from "@/lib/content";

export interface CompareCriterion {
  key: string;
  label: string;
  description: string;
  weight: number;
  scores: Record<string, number>; // slug -> 0..10
  rationale: Record<string, string>;
  riskFlag: Record<string, boolean>;
}

export interface CompareRecommendation {
  slug: string;
  title: string;
  useWhen: string[];
  avoid: string[];
  migrationFromOthers?: string;
}

export interface CompareResult {
  summary: string;
  criteria: CompareCriterion[];
  totalScores: Record<string, number>;
  ranking: { slug: string; title: string; total: number; percent: number }[];
  recommendations: CompareRecommendation[];
  forYourCase: {
    pick: string;
    pickTitle: string;
    why: string;
    risks: string[];
    nextSteps: string[];
  };
  verdict: string;
}

export interface CompareContext {
  scale?: "mvp" | "scale" | "enterprise";
  team?: "solo" | "small" | "medium" | "large";
  deadline?: "fast" | "normal" | "long";
  priority?: "speed" | "cost" | "quality" | "security";
  currentStack?: string[];
  notes?: string;
}

const DEFAULT_CRITERIA = [
  { key: "complexity", label: "Complexidade de implementação", description: "Quão difícil é montar e manter a infra" },
  { key: "scale", label: "Escala horizontal", description: "Quão bem cresce com tráfego/dados" },
  { key: "latency", label: "Latência percebida", description: "Tempo de resposta visto pelo usuário" },
  { key: "maintainability", label: "Manutenibilidade", description: "Facilidade de evoluir a longo prazo" },
  { key: "team_fit", label: "Fit com equipe pequena", description: "Quão produtiva equipe pequena é nisso" },
  { key: "infra_cost", label: "Custo operacional", description: "$$ de infra mensal em escala" },
  { key: "testability", label: "Testabilidade", description: "Quão fácil é cobrir com testes" },
  { key: "time_to_prod", label: "Tempo até produção", description: "Quanto tempo até primeiro deploy útil" },
  { key: "tech_risk", label: "Risco técnico", description: "Probabilidade de surpresa ruim em produção" },
  { key: "security", label: "Segurança nativa", description: "O que vem fácil/grátis pra segurança" },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      slugs: string[];
      context?: CompareContext;
      weights?: Record<string, number>;
    };
    const { slugs, context = {}, weights = {} } = body;

    if (!slugs || slugs.length < 2) {
      return NextResponse.json({ error: "Selecione ao menos 2 arquiteturas para comparar." }, { status: 400 });
    }
    if (slugs.length > 4) {
      return NextResponse.json({ error: "Máximo de 4 arquiteturas por comparação." }, { status: 400 });
    }

    const cards = slugs.map((s) => getCard(s)).filter((c): c is NonNullable<typeof c> => Boolean(c));
    if (cards.length < 2) {
      return NextResponse.json({ error: "Cards não encontrados." }, { status: 400 });
    }

    const ctxLines: string[] = [];
    if (context.scale) ctxLines.push(`- Escala alvo: ${labelScale(context.scale)}`);
    if (context.team) ctxLines.push(`- Equipe: ${labelTeam(context.team)}`);
    if (context.deadline) ctxLines.push(`- Prazo: ${labelDeadline(context.deadline)}`);
    if (context.priority) ctxLines.push(`- Prioridade: ${labelPriority(context.priority)}`);
    if (context.currentStack?.length) ctxLines.push(`- Stack atual: ${context.currentStack.join(", ")}`);
    if (context.notes?.trim()) ctxLines.push(`- Contexto extra: ${context.notes.trim()}`);
    const contextBlock = ctxLines.length
      ? `\n\nContexto do usuário (use isso pra calibrar a recomendação final):\n${ctxLines.join("\n")}`
      : "";

    const criteriaForPrompt = DEFAULT_CRITERIA.map((c) => ({
      key: c.key,
      label: c.label,
      description: c.description,
      weight: weights[c.key] ?? 1,
    }));

    const systemPrompt = `Você é um arquiteto sênior de software com 15+ anos. Compare opções com avaliação numérica honesta + recomendação contextual.

Critérios fornecidos (cada um com peso de 0 a 3):
${criteriaForPrompt.map((c) => `- ${c.key} ("${c.label}", peso ${c.weight}) — ${c.description}`).join("\n")}

Regras:
1. Pra cada critério, dê NOTA 0-10 pra cada opção, com rationale curto (1 frase concreta).
2. Marque riskFlag=true quando aquela opção é especialmente fraca naquele critério (nota ≤ 4).
3. Calcule totalScores = sum(score * weight) por opção.
4. Ranking ordenado pelo total, com percent = (total / maxPossível) * 100.
5. forYourCase usa o contexto do usuário pra escolher 1 opção específica entre as comparadas — não a "melhor abstrata", a melhor PRA ELE.
6. Se possível, em recommendations.migrationFromOthers descreva caminho de migração de uma opção pras outras.
7. Sem "depende do contexto" sem explicar. Seja objetivo.

Retorne JSON estrito (sem markdown, sem texto extra):
{
  "summary": "3-4 frases resumindo as diferenças mais importantes",
  "criteria": [
    {
      "key": "complexity",
      "label": "Complexidade de implementação",
      "description": "...",
      "weight": 1,
      "scores": { "slug-1": 7, "slug-2": 4 },
      "rationale": { "slug-1": "1 frase concreta", "slug-2": "..." },
      "riskFlag": { "slug-1": false, "slug-2": true }
    }
  ],
  "totalScores": { "slug-1": 56, "slug-2": 71 },
  "ranking": [
    { "slug": "slug-2", "title": "Título", "total": 71, "percent": 71 },
    { "slug": "slug-1", "title": "Título", "total": 56, "percent": 56 }
  ],
  "recommendations": [
    {
      "slug": "slug-1", "title": "...",
      "useWhen": ["situação concreta 1", "situação 2"],
      "avoid": ["quando NÃO usar 1", "quando NÃO usar 2"],
      "migrationFromOthers": "Se você está em <outra-opção> e quer ir pra esta: <passos curtos>. Opcional."
    }
  ],
  "forYourCase": {
    "pick": "slug-da-opcao-recomendada",
    "pickTitle": "Título",
    "why": "1 parágrafo explicando por que ESTA é a melhor pra ele dado o contexto",
    "risks": ["risco específico 1 que ele deve mitigar", "risco 2"],
    "nextSteps": ["primeiro passo concreto", "segundo passo", "terceiro"]
  },
  "verdict": "Recomendação direta e honesta — qual escolher e em qual contexto"
}`;

    const cardsContent = cards
      .map(
        (c) => `=== ${c.title} [${c.slug}] ===
Categoria: ${c.category}
${c.excerpt}

${c.body.slice(0, 2500)}`
      )
      .join("\n\n---\n\n");

    const completion = await openai.chat.completions.create({
      model: MODELS.compare,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Compare estas opções:\n\n${cardsContent}${contextBlock}` },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message.content ?? "{}") as CompareResult;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("AI compare error:", err);
    return NextResponse.json({ error: "Falha ao gerar comparação." }, { status: 500 });
  }
}

function labelScale(s: NonNullable<CompareContext["scale"]>) {
  return ({
    mvp: "MVP / poucos usuários",
    scale: "produto em crescimento (milhares de usuários)",
    enterprise: "enterprise (alta carga, SLAs)",
  })[s];
}
function labelTeam(t: NonNullable<CompareContext["team"]>) {
  return ({
    solo: "1 dev",
    small: "2-5 devs",
    medium: "6-15 devs",
    large: "15+ devs",
  })[t];
}
function labelDeadline(d: NonNullable<CompareContext["deadline"]>) {
  return ({
    fast: "agressivo (semanas)",
    normal: "normal (1-3 meses)",
    long: "longo (6+ meses)",
  })[d];
}
function labelPriority(p: NonNullable<CompareContext["priority"]>) {
  return ({
    speed: "velocidade de entrega",
    cost: "custo operacional baixo",
    quality: "qualidade/manutenibilidade",
    security: "segurança e compliance",
  })[p];
}
