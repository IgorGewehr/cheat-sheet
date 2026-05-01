import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import type { Decisao } from "@/lib/types";
import { pickQuestionFor } from "@/lib/srs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { decisao: Decisao };
    const { decisao } = body;

    if (!decisao) {
      return NextResponse.json({ error: "decisao is required" }, { status: 400 });
    }

    const { tipo } = pickQuestionFor(decisao);

    const daysAgo = Math.round((Date.now() - decisao.data) / (1000 * 60 * 60 * 24));
    const daysLabel = daysAgo === 1 ? "1 dia" : `${daysAgo} dias`;

    let questionDirective: string;
    if (tipo === "ainda-faria") {
      questionDirective = `Formule uma pergunta direta: dado o contexto atual, o usuário ainda tomaria essa mesma decisão? Mencione brevemente o contexto original.`;
    } else if (tipo === "alternativa") {
      questionDirective = `Formule uma pergunta explorando alternativas: o que mudou desde então que poderia justificar uma abordagem diferente? Mencione 1 alternativa específica relevante ao domínio.`;
    } else {
      questionDirective = `Formule uma pergunta aprofundando os trade-offs: quais foram as consequências reais e se os trade-offs assumidos se confirmaram na prática.`;
    }

    const prompt = `Você é um coach técnico sênior. O engenheiro tomou a seguinte decisão de arquitetura há ${daysLabel}:

Título: ${decisao.titulo}
Contexto: ${decisao.contexto}
Decisão: ${decisao.decisao}
Consequências esperadas: ${decisao.consequencias}

${questionDirective}

Regras:
- A pergunta deve ser específica, não genérica
- Máximo 2 frases
- Tom direto, sem enrolação
- Não use "você" mais de uma vez
- Não comece com "Olá" ou cumprimentos
- Termine com um "?" implícito na reflexão

Responda apenas com a pergunta, sem preâmbulo.`;

    const completion = await openai.chat.completions.create({
      model: MODELS.cardDodia,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    const pergunta = completion.choices[0]?.message?.content?.trim() ?? "Você ainda tomaria essa mesma decisão hoje?";

    return NextResponse.json({ pergunta });
  } catch (err) {
    console.error("[api/decisoes/pergunta]", err);
    return NextResponse.json({ error: "Erro ao gerar pergunta" }, { status: 500 });
  }
}
