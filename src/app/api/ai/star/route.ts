import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface STARFormatado {
  respostaFormatada: string;
  tags: string[];
  perguntasAdequadas: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { situacao, tarefa, acao, resultado, titulo } = body as {
      situacao: string;
      tarefa: string;
      acao: string;
      resultado: string;
      titulo: string;
    };

    const completion = await openai.chat.completions.create({
      model: MODELS.star,
      messages: [
        {
          role: "system",
          content: `Você é um coach de carreira especialista em entrevistas de tecnologia. Dado uma experiência profissional no formato STAR bruto, reformule como uma resposta de entrevista polida, em 1ª pessoa, entre 250-350 palavras. Seja específico, use números quando possível, destaque impacto técnico e de negócio. Sugira tags e quais perguntas de entrevista essa história responderia bem. Responda JSON.

Retorne um JSON com esta estrutura exata:
{
  "respostaFormatada": "string — resposta STAR polida em 1ª pessoa, 250-350 palavras",
  "tags": ["string — categorias como refatoração, liderança, decisão técnica, etc"],
  "perguntasAdequadas": ["string — perguntas de entrevista que esta história responde bem"]
}`,
        },
        {
          role: "user",
          content: `Título: ${titulo}

Situação: ${situacao}

Tarefa: ${tarefa}

Ação: ${acao}

Resultado: ${resultado}

Reformule como uma resposta de entrevista STAR polida.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return NextResponse.json(
      JSON.parse(completion.choices[0].message.content ?? "{}") as STARFormatado,
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao formatar experiência STAR." }, { status: 500 });
  }
}
