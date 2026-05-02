import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface FimDoDiaSintese {
  padrao: string;
  foco: string;
  proxPassos: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dividas = [], erros = [] } = body as {
      dividas: { titulo: string; descricao?: string }[];
      erros: { titulo: string; causa?: string }[];
    };

    const completion = await openai.chat.completions.create({
      model: MODELS.mentoria,
      messages: [
        {
          role: "system",
          content: `Você é um mentor técnico sênior. Recebe as dívidas de conhecimento e erros do dia de um dev e identifica padrões para ajudá-lo a crescer. Seja direto, prático e encorajador. Responda JSON.

Retorne um JSON com esta estrutura exata:
{
  "padrao": "string — 1 padrão comum ou tema recorrente identificado nas dívidas e erros do dia (2-3 frases)",
  "foco": "string — 1 área de foco prioritária para amanhã, com justificativa objetiva (1-2 frases)",
  "proxPassos": ["string", "string", "string"] — exatamente 3 próximos passos concretos e acionáveis
}`,
        },
        {
          role: "user",
          content: `Dívidas de conhecimento registradas hoje:
${dividas.length > 0
  ? dividas.map((d) => `- ${d.titulo}${d.descricao ? `: ${d.descricao}` : ""}`).join("\n")
  : "Nenhuma"}

Erros e dificuldades do dia:
${erros.length > 0
  ? erros.map((e) => `- ${e.titulo}${e.causa ? ` (causa: ${e.causa})` : ""}`).join("\n")
  : "Nenhum"}

Identifique o padrão, o foco prioritário para amanhã e 3 próximos passos concretos.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return NextResponse.json(
      JSON.parse(completion.choices[0].message.content ?? "{}") as FimDoDiaSintese,
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao gerar síntese." }, { status: 500 });
  }
}
