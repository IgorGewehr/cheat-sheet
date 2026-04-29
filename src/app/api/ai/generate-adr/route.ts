import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

const SYSTEM_PROMPT = `Você é um arquiteto sênior de software especialista em documentação de decisões arquiteturais (ADR — Architecture Decision Record).

Dado um problema técnico descrito pelo usuário, gere um ADR completo em JSON:

{
  "titulo": "Título da decisão no formato 'Usar X em vez de Y' ou 'Adotar X para Z'",
  "contexto": "Descrição do problema técnico, restrições e forças envolvidas (2-4 parágrafos)",
  "decisao": "A decisão tomada e a justificativa técnica detalhada (2-3 parágrafos)",
  "consequencias": "Consequências positivas e negativas. Liste claramente os trade-offs aceitos (2-3 parágrafos)"
}

Regras:
- Escreva em português brasileiro
- O título deve ser específico e acionável (não genérico)
- O contexto deve descrever o problema real, não a solução
- A decisão deve incluir a justificativa técnica e comparação com alternativas consideradas
- As consequências devem mencionar tanto benefícios quanto custos e riscos aceitos
- Seja técnico e direto. ADRs são para engenheiros, não para gerentes
- Responda APENAS com o JSON válido, sem markdown ao redor`;

export async function POST(req: NextRequest) {
  try {
    const { problema, stack, contextoAdicional } = await req.json() as {
      problema: string;
      stack?: string[];
      contextoAdicional?: string;
    };

    if (!problema?.trim()) {
      return NextResponse.json({ error: "Descrição do problema obrigatória." }, { status: 400 });
    }

    const userMessage = `Problema técnico: ${problema}

${stack?.length ? `Stack do projeto: ${stack.join(", ")}` : ""}
${contextoAdicional ? `Contexto adicional: ${contextoAdicional}` : ""}

Gere o ADR completo.`;

    const completion = await openai.chat.completions.create({
      model: MODELS.adr,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      titulo?: string;
      contexto?: string;
      decisao?: string;
      consequencias?: string;
    };

    return NextResponse.json({
      titulo: parsed.titulo ?? "",
      contexto: parsed.contexto ?? "",
      decisao: parsed.decisao ?? "",
      consequencias: parsed.consequencias ?? "",
    });
  } catch (err) {
    console.error("AI generate-adr error:", err);
    return NextResponse.json({ error: "Falha ao gerar ADR." }, { status: 500 });
  }
}
