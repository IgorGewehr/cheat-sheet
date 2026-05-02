import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { dicaSocraticaSystem, dicaSocraticaUser } from "@/lib/math-quest-prompts";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 });
  }
  try {
    const { enunciado, respostaParcial } = (await req.json()) as {
      enunciado: string;
      respostaParcial: string;
    };

    const completion = await openai.chat.completions.create({
      model: MODELS.cardDodia,
      messages: [
        { role: "system", content: dicaSocraticaSystem },
        { role: "user", content: dicaSocraticaUser({ enunciado, respostaParcial }) },
      ],
    });

    return NextResponse.json({ dica: completion.choices[0].message.content ?? "" });
  } catch (err) {
    console.error("[math-quest/dica]", err);
    return NextResponse.json({ error: "Falha ao gerar dica." }, { status: 500 });
  }
}
