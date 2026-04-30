import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface QuizPergunta {
  pergunta: string;
  opcoes: string[]; // 4 options
  respostaCorreta: number; // index 0-3
  explicacao: string;
}

export interface QuizResult {
  perguntas: QuizPergunta[];
}

export async function POST(req: NextRequest) {
  try {
    const { cardSlug, cardTitle, cardBody } = await req.json() as {
      cardSlug: string;
      cardTitle: string;
      cardBody: string;
    };

    const completion = await openai.chat.completions.create({
      model: MODELS.cardDodia,
      messages: [
        {
          role: "system",
          content:
            "Você é um instrutor técnico sênior. Dado um card de conhecimento de engenharia de software, crie 3 perguntas de múltipla escolha que testem COMPREENSÃO REAL (não memorização). Cada pergunta deve ter 4 opções. Uma correta, três plausíveis mas erradas. Foque em 'por que' e 'quando', não em definições. Responda JSON.",
        },
        {
          role: "user",
          content: `Card: "${cardTitle}" (slug: ${cardSlug})\n\n${cardBody}\n\nCrie 3 perguntas de múltipla escolha sobre este card. Responda SOMENTE com JSON no formato:\n{\n  "perguntas": [\n    {\n      "pergunta": "...",\n      "opcoes": ["A...", "B...", "C...", "D..."],\n      "respostaCorreta": 0,\n      "explicacao": "Por que esta é a resposta correta..."\n    }\n  ]\n}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(
      completion.choices[0].message.content ?? "{}",
    ) as QuizResult;

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao processar." }, { status: 500 });
  }
}
