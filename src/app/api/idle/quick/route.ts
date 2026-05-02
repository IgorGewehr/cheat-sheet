import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { getAllCards } from "@/lib/content";

export type QuickTipo = "decisao" | "bug" | "standup";

export interface QuickDecisaoResult {
  tipo: "decisao";
  criterios: string[];
  recomendacao: string;
  contexto?: string;
}

export interface QuickBugResult {
  tipo: "bug";
  hipoteses: Array<{ hipotese: string; comoDescartar: string }>;
}

export interface QuickStandupResult {
  tipo: "standup";
  proximoPasso: string;
  dividasPotenciais: string[];
}

export type QuickResult = QuickDecisaoResult | QuickBugResult | QuickStandupResult;

function buildDecisaoPrompt(input: string, cardsContext: string): { system: string; user: string } {
  return {
    system: `Você é um Staff Engineer ajudando a decidir entre opções técnicas.
Responda em JSON estrito:
{
  "criterios": ["critério 1", "critério 2", "critério 3"],
  "recomendacao": "Recomendação direta em 1-2 frases com justificativa.",
  "contexto": "Contexto adicional relevante dos seus projetos (opcional, pode ser string vazia)"
}
Regras:
- criterios: exatamente 3, concretos e aplicáveis à decisão
- recomendacao: direta, sem "depende" vago — assuma o contexto dado
- contexto: use os cards do brain fornecidos se forem relevantes, senão deixe vazio
- Responda APENAS JSON válido`,
    user: `Decisão a tomar: ${input.trim()}

Cards relevantes do brain do desenvolvedor:
${cardsContext || "nenhum"}`,
  };
}

function buildBugPrompt(input: string): { system: string; user: string } {
  return {
    system: `Você é um Staff Engineer experiente em debug de sistemas backend/ERP.
Responda em JSON estrito:
{
  "hipoteses": [
    { "hipotese": "Hipótese 1 (mais provável)", "comoDescartar": "Como verificar/descartar" },
    { "hipotese": "Hipótese 2", "comoDescartar": "Como verificar/descartar" },
    { "hipotese": "Hipótese 3", "comoDescartar": "Como verificar/descartar" },
    { "hipotese": "Hipótese 4", "comoDescartar": "Como verificar/descartar" },
    { "hipotese": "Hipótese 5 (menos provável)", "comoDescartar": "Como verificar/descartar" }
  ]
}
Regras:
- exatamente 5 hipóteses, ordenadas por probabilidade decrescente
- comoDescartar: ação concreta (log, query, teste específico)
- foco em Node.js/TypeScript/PostgreSQL/Firebase quando aplicável
- Responda APENAS JSON válido`,
    user: `Bug relatado: ${input.trim()}`,
  };
}

function buildStandupPrompt(input: string): { system: string; user: string } {
  return {
    system: `Você é um tech lead acompanhando o progresso de um desenvolvedor sênior de ERP.
Responda em JSON estrito:
{
  "proximoPasso": "Próximo passo concreto e específico em 1-2 frases.",
  "dividasPotenciais": ["dívida técnica ou risco 1", "dívida técnica ou risco 2"]
}
Regras:
- proximoPasso: acionável, não genérico — diga exatamente o que fazer
- dividasPotenciais: 2 a 3 itens, foco em o que pode virar problema mais tarde
- Responda APENAS JSON válido`,
    user: `O que foi feito hoje / próximo passo: ${input.trim()}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { tipo, input } = (await req.json()) as { tipo: QuickTipo; input: string };

    if (!tipo || !input?.trim()) {
      return NextResponse.json({ error: "tipo e input são obrigatórios." }, { status: 400 });
    }

    let system: string;
    let user: string;

    if (tipo === "decisao") {
      const cards = getAllCards();
      const relevant = cards
        .filter((c) =>
          c.title.toLowerCase().includes(input.toLowerCase().slice(0, 20)) ||
          (c.tags ?? []).some((t) => input.toLowerCase().includes(t.toLowerCase())),
        )
        .slice(0, 3);
      const cardsContext = relevant.map((c) => `- ${c.title}: ${c.excerpt}`).join("\n");
      ({ system, user } = buildDecisaoPrompt(input, cardsContext));
    } else if (tipo === "bug") {
      ({ system, user } = buildBugPrompt(input));
    } else if (tipo === "standup") {
      ({ system, user } = buildStandupPrompt(input));
    } else {
      return NextResponse.json({ error: "tipo inválido." }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: MODELS.cardDodia,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    const raw = JSON.parse(completion.choices[0].message.content ?? "{}") as Record<string, unknown>;

    let result: QuickResult;

    if (tipo === "decisao") {
      result = {
        tipo: "decisao",
        criterios: Array.isArray(raw.criterios) ? (raw.criterios as string[]) : [],
        recomendacao: typeof raw.recomendacao === "string" ? raw.recomendacao : "",
        contexto: typeof raw.contexto === "string" ? raw.contexto : undefined,
      };
    } else if (tipo === "bug") {
      const hipoteses = Array.isArray(raw.hipoteses)
        ? (raw.hipoteses as Array<{ hipotese: string; comoDescartar: string }>)
        : [];
      result = { tipo: "bug", hipoteses };
    } else {
      result = {
        tipo: "standup",
        proximoPasso: typeof raw.proximoPasso === "string" ? raw.proximoPasso : "",
        dividasPotenciais: Array.isArray(raw.dividasPotenciais)
          ? (raw.dividasPotenciais as string[])
          : [],
      };
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("idle/quick error:", err);
    return NextResponse.json({ error: "Falha ao processar modo rápido." }, { status: 500 });
  }
}
