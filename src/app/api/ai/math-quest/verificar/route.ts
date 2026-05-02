import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { verificacaoSystem, verificacaoUser } from "@/lib/math-quest-prompts";

const FALLBACK = {
  veredito: "PARTIAL" as const,
  score: 50,
  feedback: "Avaliação automática indisponível, revise manualmente.",
  conceitosCobertos: [] as string[],
  conceitosFaltantes: [] as string[],
};

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 });
  }
  try {
    const { enunciado, resposta, expectedConcepts } = (await req.json()) as {
      enunciado: string;
      resposta: string;
      expectedConcepts: string[];
    };

    const completion = await openai.chat.completions.create({
      model: MODELS.review,
      messages: [
        { role: "system", content: verificacaoSystem },
        { role: "user", content: verificacaoUser({ enunciado, resposta, expectedConcepts }) },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    let parsed: typeof FALLBACK;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(FALLBACK);
    }

    return NextResponse.json({
      veredito: parsed.veredito ?? FALLBACK.veredito,
      score: typeof parsed.score === "number" ? parsed.score : FALLBACK.score,
      feedback: parsed.feedback ?? FALLBACK.feedback,
      conceitosCobertos: Array.isArray(parsed.conceitosCobertos) ? parsed.conceitosCobertos : [],
      conceitosFaltantes: Array.isArray(parsed.conceitosFaltantes) ? parsed.conceitosFaltantes : [],
    });
  } catch (err) {
    console.error("[math-quest/verificar]", err);
    return NextResponse.json(FALLBACK);
  }
}
