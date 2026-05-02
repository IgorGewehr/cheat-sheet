import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

interface ParsePlanResult {
  riscos: string[];
  perguntas: string[];
  alternativa: string;
}

function renderText(r: ParsePlanResult): string {
  const lines: string[] = [];
  lines.push("=== IDLE: o que pensar enquanto a IA gera ===");
  if (r.riscos.length > 0) {
    lines.push("");
    lines.push("3 riscos:");
    r.riscos.forEach((x, i) => lines.push(`  ${i + 1}. ${x}`));
  }
  if (r.perguntas.length > 0) {
    lines.push("");
    lines.push("2 perguntas pré-mortem:");
    r.perguntas.forEach((x, i) => lines.push(`  ${i + 1}. ${x}`));
  }
  if (r.alternativa) {
    lines.push("");
    lines.push("1 alternativa não considerada:");
    lines.push(`  ${r.alternativa}`);
  }
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY ausente." }, { status: 500 });
  }
  try {
    const body = (await req.json()) as { plano: string; format?: "json" | "text" };
    if (!body.plano?.trim()) {
      return NextResponse.json({ error: "plano obrigatório." }, { status: 400 });
    }

    const systemPrompt = `Você é um engenheiro sênior crítico. Dado o plano de um agente de IA, retorne JSON estrito:
{"riscos":["...","...","..."],"perguntas":["...","..."],"alternativa":"..."}

- riscos: exatamente 3 riscos específicos do plano (não genéricos)
- perguntas: exatamente 2 perguntas pré-mortem que fariam o autor revisar
- alternativa: 1 abordagem provavelmente não considerada
Português, direto.`;

    const completion = await openai.chat.completions.create({
      model: MODELS.briefing,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: body.plano },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content ?? "{}") as ParsePlanResult;
    if (body.format === "text") {
      return new NextResponse(renderText(result), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.json({ ...result, text: renderText(result) });
  } catch (err) {
    console.error("[cli/idle]", err);
    return NextResponse.json({ error: "Falha." }, { status: 500 });
  }
}
