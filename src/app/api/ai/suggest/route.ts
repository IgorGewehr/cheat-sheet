import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { description, stack, availableSlugs } = await req.json() as {
      description: string;
      stack: string[];
      availableSlugs: { slug: string; title: string; category: string; excerpt: string }[];
    };

    if (!description?.trim()) {
      return NextResponse.json({ slugs: [] });
    }

    const systemPrompt = `Você é um arquiteto sênior de software. Dado um projeto e sua stack, selecione quais padrões da biblioteca devem ser adotados PRIMEIRO.

Retorne um JSON com a chave "slugs" contendo um array com no máximo 6 slugs dos padrões mais críticos para este projeto, em ordem de prioridade.
Responda APENAS com o JSON, sem markdown, sem explicação.`;

    const userMessage = `Projeto: ${description}
Stack: ${stack.join(", ")}

Padrões disponíveis:
${availableSlugs.map((c) => `- ${c.slug}: ${c.title} (${c.category}) — ${c.excerpt}`).join("\n")}

Quais 6 padrões são mais críticos para adotar primeiro?`;

    const completion = await openai.chat.completions.create({
      model: MODELS.suggest,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message.content ?? "{}") as { slugs?: string[] };
    return NextResponse.json({ slugs: parsed.slugs ?? [] });
  } catch (err) {
    console.error("AI suggest error:", err);
    return NextResponse.json({ slugs: [] });
  }
}
