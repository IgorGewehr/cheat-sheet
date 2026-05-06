import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import type { CodingChallenge } from "@/lib/coding-challenge-types";

const FALLBACK = {
  veredito: "PARTIAL" as const,
  score: 50,
  feedback: "Avaliação indisponível. Revise sua solução manualmente.",
  complexidadeAnalisada: "—",
  conceitosCobertos: [] as string[],
  conceitosFaltantes: [] as string[],
};

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 });
  }

  const { challenge, solucao } = (await req.json()) as {
    challenge: CodingChallenge;
    solucao: string;
  };

  if (!solucao?.trim()) {
    return NextResponse.json({ ...FALLBACK, veredito: "FAIL", score: 0, feedback: "Nenhuma solução foi enviada." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.review,
      messages: [
        {
          role: "system",
          content: `Você é um entrevistador técnico sênior avaliando uma solução de live coding.
Seja rigoroso mas justo. Analise: corretude, complexidade de tempo e espaço, legibilidade do TypeScript, tratamento de edge cases.
Veredito: PASS (correto e eficiente), PARTIAL (correto mas pode melhorar significativamente), FAIL (incorreto ou inaceitavelmente ineficiente).
Retorne SOMENTE JSON válido.`,
        },
        {
          role: "user",
          content: `Avalie esta solução de entrevista técnica:

**Problema:** ${challenge.titulo}
**Enunciado:** ${challenge.enunciado}
**Conceitos esperados:** ${challenge.expectedConcepts.join(", ")}
**Complexidade esperada:** ${challenge.complexidadeEsperada}

**Solução enviada:**
\`\`\`typescript
${solucao}
\`\`\`

Retorne JSON exatamente neste formato:
{
  "veredito": "PASS" | "PARTIAL" | "FAIL",
  "score": número de 0 a 100,
  "feedback": "string — feedback detalhado: o que está certo, o que está errado, o que melhorar. Seja específico e educativo.",
  "complexidadeAnalisada": "string — complexidade de tempo e espaço da solução enviada",
  "conceitosCobertos": ["conceito que a solução demonstrou"],
  "conceitosFaltantes": ["conceito que deveria estar mas não está"]
}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    let parsed: typeof FALLBACK;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(FALLBACK);
    }

    return NextResponse.json({
      veredito: parsed.veredito ?? FALLBACK.veredito,
      score: typeof parsed.score === "number" ? Math.min(100, Math.max(0, parsed.score)) : FALLBACK.score,
      feedback: parsed.feedback ?? FALLBACK.feedback,
      complexidadeAnalisada: parsed.complexidadeAnalisada ?? "—",
      conceitosCobertos: Array.isArray(parsed.conceitosCobertos) ? parsed.conceitosCobertos : [],
      conceitosFaltantes: Array.isArray(parsed.conceitosFaltantes) ? parsed.conceitosFaltantes : [],
    });
  } catch (err) {
    console.error("[coding-challenge/avaliar]", err);
    return NextResponse.json(FALLBACK);
  }
}
