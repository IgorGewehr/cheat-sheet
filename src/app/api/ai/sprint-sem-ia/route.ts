import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { descricao: string };
    const { descricao } = body;

    const completion = await openai.chat.completions.create({
      model: MODELS.suggest,
      messages: [
        {
          role: "system",
          content:
            "Você é um dev sênior. Dado uma descrição de tarefa de programação, gere uma implementação profissional em TypeScript/JavaScript/o-stack-adequado. Inclua: código completo, tratamento de erro, tipos TypeScript, comentários onde necessário. Retorne JSON com campo codigoIA.",
        },
        {
          role: "user",
          content: `Gere uma implementação profissional para a seguinte tarefa:\n\n${descricao}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content ?? "{}") as { codigoIA: string };
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao gerar código." }, { status: 500 });
  }
}
