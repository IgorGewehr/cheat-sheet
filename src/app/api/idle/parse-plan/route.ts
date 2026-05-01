import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface ParsePlanResult {
  riscos: string[];
  perguntas: string[];
  alternativa: string;
}

export async function POST(req: NextRequest) {
  try {
    const { plano } = (await req.json()) as { plano: string };

    if (!plano?.trim()) {
      return NextResponse.json({ error: "Informe o plano a ser analisado." }, { status: 400 });
    }

    const systemPrompt = `Você é um Staff Engineer revisando um plano que será executado por um agente de IA (Claude Code, Cursor, etc.).
Seu trabalho é ativar o pensamento crítico do desenvolvedor ANTES de aprovar a execução.

Analise o plano e responda em JSON estrito:
{
  "riscos": [
    "Risco técnico ou arquitetural específico 1",
    "Risco técnico ou arquitetural específico 2",
    "Risco técnico ou arquitetural específico 3"
  ],
  "perguntas": [
    "Pergunta pré-mortem 1: o que pode dar errado com X?",
    "Pergunta pré-mortem 2: e se Y falhar?"
  ],
  "alternativa": "Uma abordagem alternativa não considerada no plano, em 1 linha."
}

Regras:
- riscos: exatamente 3, específicos ao plano (não genéricos), focados em side-effects, acoplamento, rollback, segurança ou performance
- perguntas: exatamente 2, no formato "O que acontece se [cenário de falha específico]?"
- alternativa: 1 frase curta, pragmática, diferente da abordagem do plano
- Responda APENAS JSON válido, sem markdown ao redor`;

    const completion = await openai.chat.completions.create({
      model: MODELS.review,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Plano para análise:\n\n${plano.trim()}` },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(
      completion.choices[0].message.content ?? "{}",
    ) as ParsePlanResult;

    return NextResponse.json(result);
  } catch (err) {
    console.error("idle/parse-plan error:", err);
    return NextResponse.json({ error: "Falha ao analisar o plano." }, { status: 500 });
  }
}
