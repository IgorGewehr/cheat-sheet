import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { getAllCards } from "@/lib/content";

interface BriefingResult {
  systemPrompt: string;
  selectedPatterns: { slug: string; title: string; reason: string }[];
  armadilhas: { slug: string; title: string; warning: string }[];
  checklist: string[];
}

function renderText(b: BriefingResult): string {
  const lines: string[] = [];
  lines.push("=== BRIEFING SÊNIOR ===");
  lines.push("");
  lines.push(b.systemPrompt);
  if (b.selectedPatterns.length > 0) {
    lines.push("");
    lines.push("Padrões a seguir:");
    for (const p of b.selectedPatterns) lines.push(`  • ${p.title} — ${p.reason}`);
  }
  if (b.armadilhas.length > 0) {
    lines.push("");
    lines.push("⚠ Armadilhas no domínio:");
    for (const a of b.armadilhas) lines.push(`  • ${a.title} — ${a.warning}`);
  }
  if (b.checklist.length > 0) {
    lines.push("");
    lines.push("Checklist pós-codificação:");
    for (const c of b.checklist) lines.push(`  [ ] ${c}`);
  }
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY ausente." }, { status: 500 });
  }
  try {
    const body = (await req.json()) as {
      task: string;
      domains?: string[];
      stack?: string;
      projectName?: string;
      format?: "json" | "text";
    };
    if (!body.task?.trim()) {
      return NextResponse.json({ error: "task obrigatório." }, { status: 400 });
    }

    const allCards = getAllCards();
    const libraryCards = allCards
      .filter((c) => !["checklists", "prompts", "armadilhas-ia"].includes(c.category))
      .map((c) => `[${c.slug}] ${c.title} (${c.category}): ${c.excerpt}`);
    const armadilhaCards = allCards
      .filter((c) => c.category === "armadilhas-ia")
      .map((c) => `[${c.slug}] ${c.title}: ${c.excerpt}`);

    const systemPrompt = `Você é um arquiteto sênior preparando uma sessão com IA generativa.
Dado uma tarefa e domínios, gere JSON estrito:
{"systemPrompt":"...","selectedPatterns":[{"slug":"","title":"","reason":""}],"armadilhas":[{"slug":"","title":"","warning":""}],"checklist":["..."]}

Regras:
- selectedPatterns: 4-6 itens em ordem de criticidade
- armadilhas: 3-5 mais relevantes
- checklist: 6-10 itens verificáveis e específicos
- systemPrompt: pronto pra colar no Cursor/Claude/Copilot, em português, mínimo 3 parágrafos`;

    const userMessage = `Tarefa: ${body.task}
Domínios: ${(body.domains ?? ["geral"]).join(", ")}
${body.projectName ? `Projeto: ${body.projectName}` : ""}
${body.stack ? `Stack: ${body.stack}` : ""}

Padrões disponíveis:
${libraryCards.join("\n")}

Armadilhas:
${armadilhaCards.join("\n")}`;

    const completion = await openai.chat.completions.create({
      model: MODELS.briefing,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content ?? "{}") as BriefingResult;

    if (body.format === "text") {
      return new NextResponse(renderText(result), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.json({ ...result, text: renderText(result) });
  } catch (err) {
    console.error("[cli/brief]", err);
    return NextResponse.json({ error: "Falha." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "brain.brief",
    description: "POST { task, domains?, stack?, projectName?, format? }",
  });
}
