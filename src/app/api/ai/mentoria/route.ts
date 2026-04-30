import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface MentoriaResposta {
  pergunta: string;
  tipo: "basica" | "contexto" | "edge-case" | "alternativa" | "profunda";
  nivel: number;
  avaliacaoResposta?: string;
  lacunaNaResposta?: string;
  pronto: boolean;
  avaliacaoFinal?: {
    score: number;
    pontosFortesExplicacao: string[];
    lacunasNaExplicacao: string[];
    recomendacoes: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { historico, conceito, nivelPergunta } = body as {
      historico: { role: "user" | "assistant"; content: string }[];
      conceito: string;
      nivelPergunta: number;
    };

    const completion = await openai.chat.completions.create({
      model: MODELS.mentoria,
      messages: [
        {
          role: "system",
          content: `Você é um dev junior curioso e bem-intencionado. Seu mentor está explicando um conceito técnico. Faça perguntas genuínas, começando pelo básico e evoluindo para questões mais profundas. NÍVEL 1-2: perguntas básicas de compreensão. NÍVEL 3-4: pedidos de contexto, quando usar, quando não usar. NÍVEL 5: edge cases, alternativas, tradeoffs. Avalie brevemente cada resposta do mentor. Após 8-10 exchanges, marque pronto=true e faça uma avaliação final. Responda JSON.

Retorne um JSON com esta estrutura exata:
{
  "pergunta": "string — próxima pergunta do junior",
  "tipo": "basica" | "contexto" | "edge-case" | "alternativa" | "profunda",
  "nivel": number (1-5),
  "avaliacaoResposta": "string opcional — avaliação breve da última resposta do mentor",
  "lacunaNaResposta": "string opcional — gap específico na última resposta",
  "pronto": boolean,
  "avaliacaoFinal": {
    "score": number (0-100),
    "pontosFortesExplicacao": ["string"],
    "lacunasNaExplicacao": ["string"],
    "recomendacoes": "string"
  } (apenas quando pronto=true)
}`,
        },
        {
          role: "user",
          content: `O mentor vai explicar: ${conceito}
Nível atual da conversa: ${nivelPergunta}/5
Número de exchanges: ${Math.floor(historico.length / 2)}

Histórico:
${historico.map((m) => `${m.role === "user" ? "Mentor" : "Junior"}: ${m.content}`).join("\n\n")}

${historico.length === 0 ? "Faça a primeira pergunta básica sobre este conceito." : `Faça a próxima pergunta no nível ${nivelPergunta}. Se já houve 8+ exchanges, marque pronto=true e avalie.`}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return NextResponse.json(
      JSON.parse(completion.choices[0].message.content ?? "{}") as MentoriaResposta,
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao processar mentoria." }, { status: 500 });
  }
}
