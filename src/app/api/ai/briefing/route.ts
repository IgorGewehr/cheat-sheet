import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { getAllCards } from "@/lib/content";

export interface BriefingResult {
  systemPrompt: string;
  selectedPatterns: { slug: string; title: string; reason: string }[];
  armadilhas: { slug: string; title: string; warning: string }[];
  checklist: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { task, domains, stack, adoptedSlugs = [] } = await req.json() as {
      task: string;
      domains: string[];
      stack?: string;
      adoptedSlugs?: string[];
    };

    if (!task?.trim()) {
      return NextResponse.json({ error: "Descreva o que você vai construir." }, { status: 400 });
    }

    const allCards = getAllCards();

    const libraryCards = allCards
      .filter((c) => !["checklists", "prompts", "armadilhas-ia"].includes(c.category))
      .map((c) => `[${c.slug}] ${c.title} (${c.category}): ${c.excerpt}`);

    const armadilhaCards = allCards
      .filter((c) => c.category === "armadilhas-ia")
      .map((c) => `[${c.slug}] ${c.title}: ${c.excerpt}`);

    const systemPrompt = `Você é um arquiteto sênior de software preparando um dev júnior para uma sessão de codificação com IA generativa.

Dado uma tarefa e domínios envolvidos, você deve:
1. Selecionar os padrões mais críticos da biblioteca para essa tarefa específica
2. Identificar as armadilhas de IA mais relevantes para esse domínio
3. Gerar um system prompt profissional para usar no Cursor/Claude/Copilot
4. Criar um checklist de aceite pós-codificação

Retorne JSON estrito:
{
  "systemPrompt": "System prompt completo em português para colar no Cursor/Claude. Inclua: papel do assistente, stack técnica, padrões obrigatórios, o que NÃO fazer, formato esperado de output. Mínimo 3 parágrafos.",
  "selectedPatterns": [
    { "slug": "slug-do-card", "title": "Título do padrão", "reason": "Por que é crítico para ESTA tarefa específica (1 frase)" }
  ],
  "armadilhas": [
    { "slug": "slug-do-card", "title": "Título da armadilha", "warning": "O que especificamente verificar nesta tarefa (1 frase)" }
  ],
  "checklist": [
    "Item verificável e específico para esta tarefa 1",
    "Item verificável e específico para esta tarefa 2"
  ]
}

Regras:
- selectedPatterns: 4-6 padrões, em ordem de criticidade para ESTA tarefa
- armadilhas: 3-5, as mais relevantes para os domínios envolvidos
- checklist: 6-10 itens verificáveis e específicos (não genéricos)
- systemPrompt: profissional, direto, pronto para uso imediato
- Responda APENAS JSON válido, sem markdown ao redor`;

    const userMessage = `Tarefa: ${task}
Domínios envolvidos: ${domains.join(", ")}
${stack ? `Stack do projeto: ${stack}` : ""}
${adoptedSlugs.length ? `Padrões já adotados no projeto: ${adoptedSlugs.join(", ")}` : ""}

Padrões disponíveis na biblioteca:
${libraryCards.join("\n")}

Armadilhas comuns de IA:
${armadilhaCards.join("\n")}

Gere o briefing sênior completo.`;

    const completion = await openai.chat.completions.create({
      model: MODELS.briefing,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content ?? "{}") as BriefingResult;
    return NextResponse.json(result);
  } catch (err) {
    console.error("AI briefing error:", err);
    return NextResponse.json({ error: "Falha ao gerar briefing." }, { status: 500 });
  }
}
