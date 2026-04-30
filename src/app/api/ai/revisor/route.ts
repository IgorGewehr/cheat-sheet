import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface RevisorResult {
  revisaoCompleta: string;
  lacunas: string[];
  acertos: string[];
  scoreRevisao: number;
  feedbackGeral: string;
}

export async function POST(req: NextRequest) {
  try {
    const { titulo, codigo, revisaoUsuario, cardSlug } = await req.json();

    const completion = await openai.chat.completions.create({
      model: MODELS.revisor,
      messages: [
        {
          role: "system",
          content: `Você é um tech lead sênior revisando código. Analise o código fornecido e compare com a revisão que o desenvolvedor fez.
Sua análise deve cobrir: segurança, performance, manutenibilidade, padrões arquiteturais, edge cases.
Compare o que o dev identificou vs o que existe no código.
Seja específico e construtivo. Responda em JSON.`,
        },
        {
          role: "user",
          content: `Título da revisão: ${titulo}${cardSlug ? `\nCard de referência: ${cardSlug}` : ""}

Código para revisar:
\`\`\`
${codigo}
\`\`\`

Revisão do desenvolvedor:
${revisaoUsuario}

Retorne um JSON com:
{
  "revisaoCompleta": "string com revisão profissional completa em markdown cobrindo segurança, performance, manutenibilidade, padrões arquiteturais e edge cases",
  "lacunas": ["array de problemas específicos que o dev NÃO identificou mas existem no código"],
  "acertos": ["array de problemas que o dev identificou corretamente"],
  "scoreRevisao": "número 0-100 representando a qualidade da revisão do dev",
  "feedbackGeral": "2-3 frases sobre a qualidade da revisão do desenvolvedor"
}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(
      completion.choices[0].message.content ?? "{}",
    ) as RevisorResult;

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao processar revisão." }, { status: 500 });
  }
}
