import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import type { AwakeningSession } from "@/lib/awakening-types";

const TRACK_NAMES: Record<string, string> = {
  fullstack: "Full Stack",
  "data-science": "Data Science",
  "ai-engineer": "AI Engineer",
  "ai-agents": "AI Agents",
};

export async function POST(req: NextRequest) {
  try {
    const session = (await req.json()) as AwakeningSession;
    const totalQuestions = session.respostas.length;
    const correct = session.respostas.filter((r) => r.correta).length;
    const trackName = TRACK_NAMES[session.track] ?? session.track;
    const pct = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    const weakSpotsText = session.pontosFracos.length > 0
      ? session.pontosFracos.join(", ")
      : "nenhum ponto fraco identificado";

    const completion = await openai.chat.completions.create({
      model: MODELS.suggest,
      messages: [
        {
          role: "system",
          content:
            "Você é um mentor técnico sênior que avalia diagnósticos de desenvolvedores. Seja direto, honesto e encorajador sem ser superficial. Responda sempre em português.",
        },
        {
          role: "user",
          content: `Um desenvolvedor completou o diagnóstico Awakening para a trilha ${trackName}.
Resultado: ${correct}/${totalQuestions} corretas (${pct}%) — Rank ${session.rankAtribuido}
Pontos fracos identificados: ${weakSpotsText}

Escreva exatamente 2 parágrafos:
1. Avalie o desempenho de forma honesta — o que o resultado revela sobre o nível atual
2. Recomendação concreta sobre o que priorizar primeiro na trilha de entrada, baseado nos pontos fracos identificados`,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const feedback = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("[awakening-feedback]", err);
    return NextResponse.json({ error: "Falha ao gerar feedback." }, { status: 500 });
  }
}
