import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface RetrospectivaGerada {
  melhorias: string;
  scoreAprendizado: number;
  insights: string;
  proximoFoco: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      dividas: string;
      acertos: string;
      aprendizados: string;
      weekActivity?: {
        cardsStudied: Array<{ slug: string; score: number }>;
        errosRegistrados: Array<{ titulo: string; causaRaiz: string }>;
        dividasNovas: Array<{ descricao: string }>;
      };
    };
    const { dividas, acertos, aprendizados, weekActivity } = body;

    const completion = await openai.chat.completions.create({
      model: MODELS.retrospectiva,
      messages: [
        {
          role: "system",
          content:
            "Você é um coach de engenharia de software. Analise a retrospectiva semanal de um desenvolvedor e gere: melhorias específicas para a próxima semana, score de aprendizado (1=sem aprendizado real, 5=aprendizado profundo), insights sobre padrões comportamentais, e foco recomendado para a próxima semana. Seja direto e construtivo. Responda JSON.",
        },
        {
          role: "user",
          content: `Retrospectiva semanal:

Aprendizados desta semana:
${aprendizados || "(não informado)"}

Dívidas acumuladas (usei sem entender):
${dividas || "(nenhuma)"}

O que fiz bem:
${acertos || "(não informado)"}
${weekActivity ? `
Atividade objetiva da semana (dados automáticos do sistema):
- Cards estudados: ${weekActivity.cardsStudied.length > 0 ? weekActivity.cardsStudied.map((c) => `${c.slug} (${c.score}%)`).join(", ") : "nenhum"}
- Erros registrados: ${weekActivity.errosRegistrados.length > 0 ? weekActivity.errosRegistrados.map((e) => `${e.titulo} — ${e.causaRaiz}`).join("; ") : "nenhum"}
- Novas dívidas de conhecimento: ${weekActivity.dividasNovas.length > 0 ? weekActivity.dividasNovas.map((d) => d.descricao).join("; ") : "nenhuma"}
` : ""}

Retorne JSON com os campos: melhorias (string, melhorias específicas para a próxima semana), scoreAprendizado (número inteiro de 1 a 5), insights (2-3 frases sobre padrões comportamentais identificados), proximoFoco (string, foco recomendado para a próxima semana).`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content ?? "{}") as RetrospectivaGerada;
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao gerar retrospectiva." }, { status: 500 });
  }
}
