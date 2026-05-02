import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { SENTINELA_SYSTEM_PROMPT, buildSentinelaUserPrompt } from "@/lib/sentinela-prompts";
import type { SentinelaVeredito, SentinelaAchado } from "@/lib/sentinela-types";

export interface SentinelaResult {
  veredito: SentinelaVeredito;
  scoreConfianca: number;
  achados: SentinelaAchado[];
  resumo: string;
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY não configurada. Adicione ao .env.local." },
      { status: 500 },
    );
  }

  try {
    const body = await req.json() as {
      titulo: string;
      contexto?: string;
      codigo: string;
      linguagem?: string;
    };

    const userMessage = buildSentinelaUserPrompt(body);

    const completion = await openai.chat.completions.create({
      model: MODELS.review,
      messages: [
        { role: "system", content: SENTINELA_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const result = JSON.parse(raw) as SentinelaResult;

    return NextResponse.json(result);
  } catch (err) {
    console.error("[sentinela]", err);
    return NextResponse.json(
      { error: "Falha ao executar auditoria. Tente novamente." },
      { status: 500 },
    );
  }
}
