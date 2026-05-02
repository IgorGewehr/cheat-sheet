import { NextRequest, NextResponse } from "next/server";
import { fsGet } from "@/lib/squad-rest";
import { openai, MODELS } from "@/lib/openai";
import type { SquadConstraint } from "@/lib/types";

// Validates code/diff against squad architecture constraints.
// Reads constraints from squadPublic (open) — no auth needed.

interface GuardBody {
  squadId: string;
  code?: string;
  diff?: string;
  context?: string;
  format?: "json" | "text";
}

interface Violation {
  constraintId: string;
  constraintTitle: string;
  type: string;
  severity: "blocker" | "warning";
  description: string;
  line?: number;
  suggestion: string;
}

function renderText(params: {
  verdict: "PASS" | "WARN" | "BLOCK";
  violations: Violation[];
  summary: string;
  constraints: SquadConstraint[];
}): string {
  const { verdict, violations, summary, constraints } = params;
  const icons = { PASS: "✓", WARN: "⚠", BLOCK: "✗" };
  const lines: string[] = [];

  lines.push(`${icons[verdict]} SQUAD GUARD: ${verdict}`);
  lines.push(`  ${summary}`);
  lines.push(`  Constraints verificadas: ${constraints.length}`);

  if (violations.length > 0) {
    lines.push("");
    lines.push(`Violações (${violations.length}):`);
    for (const v of violations) {
      const sev = v.severity === "blocker" ? "BLOCK" : "WARN ";
      const line = v.line ? ` L${v.line}` : "";
      lines.push(`  [${sev}] ${v.constraintTitle}${line}`);
      lines.push(`         ${v.description}`);
      lines.push(`         → ${v.suggestion}`);
    }
  }

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 });
  }

  try {
    const body = (await req.json()) as GuardBody;

    if (!body.squadId) {
      return NextResponse.json({ error: "squadId obrigatório." }, { status: 400 });
    }

    const code = body.code ?? body.diff;
    if (!code?.trim()) {
      return NextResponse.json({ error: "Forneça code ou diff." }, { status: 400 });
    }

    // Fetch squad public constraints (no auth)
    const publicDoc = await fsGet(`squadPublic/${body.squadId}`);
    if (!publicDoc) {
      return NextResponse.json({ error: "Squad não encontrado." }, { status: 404 });
    }

    const constraints = (publicDoc.constraints ?? []) as SquadConstraint[];
    if (constraints.length === 0) {
      const result = {
        verdict: "PASS" as const,
        violations: [],
        summary: "Nenhuma constraint definida para este squad.",
        constraints: [],
      };
      if (body.format === "text") {
        return new NextResponse(renderText(result), {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      return NextResponse.json({ ...result, text: renderText(result) });
    }

    const constraintList = constraints
      .map((c, i) => `${i + 1}. [${c.type.toUpperCase()}] ${c.title}${c.description ? " — " + c.description : ""}`)
      .join("\n");

    const systemPrompt = `Você é um guardião de arquitetura. Analise o código/diff e verifique se viola alguma constraint da squad.

Constraints do squad:
${constraintList}

Retorne JSON estrito:
{
  "verdict": "PASS" | "WARN" | "BLOCK",
  "summary": "resumo em 1 linha",
  "violations": [
    {
      "constraintId": "id da constraint (use o número: 1, 2, ...)",
      "constraintTitle": "título da constraint",
      "type": "must|should|never|pattern",
      "severity": "blocker" (se NEVER ou MUST violado) ou "warning" (se SHOULD),
      "description": "descrição do problema encontrado no código",
      "line": número da linha (opcional),
      "suggestion": "como corrigir"
    }
  ]
}

Regras:
- BLOCK = se qualquer violação for blocker (NEVER/MUST violados)
- WARN = se há warnings mas sem blockers
- PASS = nenhuma violação
- Seja preciso: só reporte violações reais, não suspeitas`;

    const completion = await openai.chat.completions.create({
      model: MODELS.review,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `${body.context ? `Contexto: ${body.context}\n\n` : ""}Código/diff:\n\`\`\`\n${code}\n\`\`\``,
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message.content ?? "{}") as {
      verdict: "PASS" | "WARN" | "BLOCK";
      summary: string;
      violations: Violation[];
    };

    const result = {
      verdict: parsed.verdict,
      summary: parsed.summary,
      violations: parsed.violations ?? [],
      constraints,
      squadId: body.squadId,
    };

    const text = renderText(result);

    if (body.format === "text") {
      return new NextResponse(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.json({ ...result, text });
  } catch (err) {
    console.error("[squad/guard]", err);
    return NextResponse.json({ error: "Falha ao executar guard." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "brain.squad-guard",
    description: "POST { squadId, code|diff, context?, format? }",
    usage: 'curl -X POST "$BRAIN_API_URL/api/squad/guard" -H "Content-Type: application/json" -d \'{"squadId":"...","diff":"...","format":"text"}\'',
  });
}
