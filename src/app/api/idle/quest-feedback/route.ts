import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface QuestFeedbackResult {
  feedback: string;
  score: number;
}

export async function POST(req: NextRequest) {
  try {
    const { pergunta, resposta, contextoOriginal } = (await req.json()) as {
      pergunta: string;
      resposta: string;
      contextoOriginal?: string;
    };

    if (!pergunta?.trim() || !resposta?.trim()) {
      return NextResponse.json(
        { error: "Pergunta e resposta são obrigatórias." },
        { status: 400 },
      );
    }

    const systemPrompt = `Você é um mentor técnico sênior avaliando a reflexão de um desenvolvedor sobre uma decisão arquitetural.

Avalie a resposta considerando:
- Profundidade do raciocínio de trade-off
- Reconhecimento de contexto e limitações
- Pensamento de longo prazo (manutenibilidade, escala)
- Autoconsciência técnica

Responda em JSON:
{
  "feedback": "Feedback construtivo de 2-3 frases. Comece com o que foi bom, depois o que pode aprofundar.",
  "score": número de 0 a 100
}

Critérios de score:
- 80-100: raciocínio profundo, considerou múltiplos ângulos, autocrítico
- 60-79: bom raciocínio mas faltou um ângulo importante
- 40-59: resposta superficial, raciocínio parcial
- 0-39: resposta vaga ou não respondeu a pergunta`;

    const userMessage = `Pergunta feita ao desenvolvedor:
${pergunta}

${contextoOriginal ? `Contexto da decisão original:\n${contextoOriginal}\n\n` : ""}Resposta do desenvolvedor:
${resposta.trim()}`;

    const completion = await openai.chat.completions.create({
      model: MODELS.cardDodia,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const aiResult = JSON.parse(
      completion.choices[0].message.content ?? "{}",
    ) as { feedback: string; score: number };

    const result: QuestFeedbackResult = {
      feedback: aiResult.feedback ?? "Feedback não disponível.",
      score: typeof aiResult.score === "number" ? Math.min(100, Math.max(0, aiResult.score)) : 50,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("idle/quest-feedback error:", err);
    return NextResponse.json({ error: "Falha ao gerar feedback." }, { status: 500 });
  }
}
