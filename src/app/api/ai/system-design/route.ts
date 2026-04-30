import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface SystemDesignFeedback {
  scoreGeral: number;
  dimensoes: {
    escalabilidade: number;
    confiabilidade: number;
    performance: number;
    seguranca: number;
    manutenibilidade: number;
    custo: number;
  };
  pontosFortesDesign: string[];
  pontosFracos: string[];
  componentesFaltando: string[];
  oversized: string[];
  alternativasNaoConsideradas: string[];
  recomendacaoFinal: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enunciado, resposta, titulo } = body as {
      enunciado: string;
      resposta: string;
      titulo: string;
    };

    const completion = await openai.chat.completions.create({
      model: MODELS.systemDesign,
      messages: [
        {
          role: "system",
          content: `Você é um Staff Engineer entrevistando candidatos para posição sênior. Avalie o system design proposto considerando: escalabilidade, confiabilidade, performance, segurança, manutenibilidade e custo. Seja rigoroso mas justo. Identifique o que está bom, o que está faltando e o que está over-engineered. Responda JSON.

Retorne um JSON com esta estrutura exata:
{
  "scoreGeral": number (0-100),
  "dimensoes": {
    "escalabilidade": number (0-10),
    "confiabilidade": number (0-10),
    "performance": number (0-10),
    "seguranca": number (0-10),
    "manutenibilidade": number (0-10),
    "custo": number (0-10)
  },
  "pontosFortesDesign": ["string"],
  "pontosFracos": ["string"],
  "componentesFaltando": ["string — componentes importantes não mencionados"],
  "oversized": ["string — partes over-engineered"],
  "alternativasNaoConsideradas": ["string"],
  "recomendacaoFinal": "string — avaliação geral em 3-5 frases"
}`,
        },
        {
          role: "user",
          content: `Desafio: ${titulo}

Enunciado:
${enunciado}

Design proposto pelo candidato:
${resposta}

Avalie este system design.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return NextResponse.json(
      JSON.parse(completion.choices[0].message.content ?? "{}") as SystemDesignFeedback,
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao avaliar system design." }, { status: 500 });
  }
}
