import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface WarGameFeedback {
  scoreDecisao: number;
  pontosFortesDecisao: string[];
  pontosFrageisDecisao: string[];
  decisaoAlternativa: string;
  riscosPrincipais: string[];
  licao: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cenario, restricoes = [], decisao, justificativa, tempoGasto } = body as {
      cenario: string;
      restricoes?: string[];
      decisao: string;
      justificativa: string;
      tempoGasto: number;
    };

    const completion = await openai.chat.completions.create({
      model: MODELS.warGame,
      messages: [
        {
          role: "system",
          content: `Você é um CTO sênior avaliando a qualidade da TOMADA DE DECISÃO de um dev, não se a decisão foi 'certa' (não existe resposta certa). Avalie: identificou os stakeholders?, considerou os riscos?, priorizou corretamente?, tem um plano de comunicação?, é executável com as restrições dadas? Score: 0-100 baseado na qualidade do raciocínio. Responda JSON.

Retorne um JSON com esta estrutura exata:
{
  "scoreDecisao": number (0-100),
  "pontosFortesDecisao": ["string"],
  "pontosFrageisDecisao": ["string"],
  "decisaoAlternativa": "string — o que um sênior faria diferente",
  "riscosPrincipais": ["string — riscos que o dev não considerou"],
  "licao": "string — lição principal deste cenário (2-3 frases)"
}`,
        },
        {
          role: "user",
          content: `Cenário: ${cenario}

Restrições: ${restricoes.join(", ")}

Tempo gasto para decidir: ${Math.floor(tempoGasto / 60)}min ${tempoGasto % 60}s

Decisão do dev:
${decisao}

Justificativa:
${justificativa}

Avalie a qualidade desta tomada de decisão.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return NextResponse.json(
      JSON.parse(completion.choices[0].message.content ?? "{}") as WarGameFeedback,
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao processar war game." }, { status: 500 });
  }
}
