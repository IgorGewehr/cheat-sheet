import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface WarGameGerado {
  titulo: string;
  cenario: string;
  restricoes: string[];
  categoria: "incidente" | "arquitetura" | "performance" | "segurança" | "decisão";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contexto = "",
      area = "decisão",
      nivel = "senior",
    } = body as {
      contexto?: string;
      area?: string;
      nivel?: "pleno" | "senior" | "staff";
    };

    const completion = await openai.chat.completions.create({
      model: MODELS.warGame,
      messages: [
        {
          role: "system",
          content: `Você é um arquiteto de software sênior criando cenários de War Game realistas para treinar devs. Dado um contexto de projeto/stack/momento de carreira, crie um cenário de pressão real com 3-4 restrições plausíveis. O cenário deve ser específico, situacional e desafiador para o nível informado.

Retorne um JSON com esta estrutura exata:
{
  "titulo": "string — título curto e direto do cenário (máx 8 palavras)",
  "cenario": "string — situação de pressão em 2-4 frases. Seja específico com contexto, hora, impacto.",
  "restricoes": ["string — 3 a 4 restrições realistas que complicam a decisão"],
  "categoria": "incidente" | "arquitetura" | "performance" | "segurança" | "decisão"
}`,
        },
        {
          role: "user",
          content: `Contexto do projeto: ${contexto || "projeto backend genérico"}
Área do cenário: ${area}
Nível do dev: ${nivel}

Crie um cenário de War Game personalizado e realista para este contexto.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return NextResponse.json(
      JSON.parse(completion.choices[0].message.content ?? "{}") as WarGameGerado,
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao gerar cenário." }, { status: 500 });
  }
}
