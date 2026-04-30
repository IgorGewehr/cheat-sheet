import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface RFCFeedback {
  scoreClarez: number;
  scoreCompletude: number;
  scoreRaciocinio: number;
  scoreGeral: number;
  pontosFortes: string[];
  pontosFrageis: string[];
  alternativasNaoConsideradas: string[];
  perguntasNaoRespondidas: string[];
  sugestoesEstrutura: string[];
  feedbackGeral: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { titulo, problema, rfc } = body as {
      titulo: string;
      problema: string;
      rfc: string;
    };

    const completion = await openai.chat.completions.create({
      model: MODELS.rfc,
      messages: [
        {
          role: "system",
          content: `Você é um Staff Engineer revisando uma proposta técnica (RFC) de um dev sênior. Avalie: clareza do problema, qualidade das alternativas consideradas, solidez do raciocínio, identificação de riscos, clareza da recomendação. Seja construtivo mas rigoroso — como um verdadeiro peer review técnico. Responda JSON.

Retorne um JSON com esta estrutura exata:
{
  "scoreClarez": number (0-10),
  "scoreCompletude": number (0-10),
  "scoreRaciocinio": number (0-10),
  "scoreGeral": number (0-100),
  "pontosFortes": ["string"],
  "pontosFrageis": ["string"],
  "alternativasNaoConsideradas": ["string"],
  "perguntasNaoRespondidas": ["string — perguntas que leitores fariam"],
  "sugestoesEstrutura": ["string"],
  "feedbackGeral": "string — avaliação geral em 3-5 frases"
}`,
        },
        {
          role: "user",
          content: `Título do RFC: ${titulo}

Descrição do problema:
${problema}

RFC completo:
${rfc}

Revise este RFC como um Staff Engineer.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return NextResponse.json(
      JSON.parse(completion.choices[0].message.content ?? "{}") as RFCFeedback,
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao avaliar RFC." }, { status: 500 });
  }
}
