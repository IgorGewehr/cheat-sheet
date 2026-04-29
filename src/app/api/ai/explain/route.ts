import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { cardTitle, cardBody, category } = await req.json() as {
      cardTitle: string;
      cardBody: string;
      category: string;
    };

    if (!cardTitle?.trim()) {
      return NextResponse.json({ error: "Card obrigatório." }, { status: 400 });
    }

    const systemPrompt = `Você é um engenheiro sênior experiente explicando conceitos para um desenvolvedor júnior que está aprendendo a trabalhar com IA generativa.

Sua missão: transformar este card técnico em uma explicação que faça o júnior entender o PORQUÊ, não só o o quê.

Estruture sua resposta em markdown com:

## Por que isso importa (o problema real)
Conte uma situação concreta onde a ausência desse padrão causou problema em produção. Seja específico e visual.

## A intuição por trás (mental model)
Uma analogia ou metáfora que faça o conceito "clicar" na cabeça do júnior.

## O que a IA costuma errar aqui
Os 2-3 erros mais comuns que IA generativa comete ao implementar isso — e como identificar no code review.

## Como verificar se está correto
Pergunta ou teste rápido que qualquer dev pode fazer para saber se implementou certo.

## Próximos passos de aprendizado
2-3 conceitos relacionados para estudar depois de dominar este.

Escreva em português brasileiro. Seja direto, não use linguagem corporativa. Trate o leitor como um colega inteligente que só precisa de mais contexto.`;

    const userMessage = `Card: ${cardTitle} (${category})

Conteúdo:
${cardBody.slice(0, 3000)}

Explique este card para um desenvolvedor júnior que vai usar IA generativa para implementar.`;

    const completion = await openai.chat.completions.create({
      model: MODELS.explain,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    return NextResponse.json({ explanation: completion.choices[0].message.content });
  } catch (err) {
    console.error("AI explain error:", err);
    return NextResponse.json({ error: "Falha ao gerar explicação." }, { status: 500 });
  }
}
