import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { code, patterns, stack } = await req.json() as {
      code: string;
      patterns: string[];
      stack: string[];
    };

    if (!code?.trim()) {
      return NextResponse.json({ error: "Código obrigatório." }, { status: 400 });
    }

    const systemPrompt = `Você é um engenheiro sênior especialista em ${stack.length ? stack.join(", ") : "desenvolvimento de software"}.
Sua função é fazer code review rigoroso verificando se o código segue os padrões arquiteturais adotados pelo projeto.

Você deve:
1. Identificar violações de cada padrão listado
2. Apontar problemas de segurança (N+1, injeção, auth faltando, logs insuficientes)
3. Sugerir melhorias concretas com exemplos de código
4. Dar uma nota de 0-10 para cada padrão verificado
5. Dar uma nota geral com justificativa

Seja direto e específico. Aponte linha por linha quando relevante.
Responda sempre em português brasileiro.
Formato: use markdown com cabeçalhos, listas e blocos de código.`;

    const userMessage = `## Padrões adotados no projeto
${patterns.length ? patterns.map((p) => `- ${p}`).join("\n") : "- Nenhum padrão específico selecionado (faça uma revisão geral)"}

## Código para revisar
\`\`\`
${code}
\`\`\`

Faça a revisão completa verificando cada padrão adotado.`;

    const completion = await openai.chat.completions.create({
      model: MODELS.review,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    return NextResponse.json({ review: completion.choices[0].message.content });
  } catch (err) {
    console.error("AI review error:", err);
    return NextResponse.json({ error: "Falha ao processar revisão." }, { status: 500 });
  }
}
