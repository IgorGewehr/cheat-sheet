import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import {
  SENTINELA_SYSTEM_PROMPT,
  SENTINELA_DIFF_SYSTEM_PROMPT,
  buildSentinelaUserPrompt,
  type SentinelaModo,
} from "@/lib/sentinela-prompts";
import type { SentinelaVeredito, SentinelaAchado } from "@/lib/sentinela-types";

// CLI-friendly endpoint for Claude Code / shell hooks.
// Anonymous, no workspace persistence (CLI client doesn't have Firebase).
// Returns JSON + a pre-rendered text block ready for terminal display.

const PR_RE = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i;

async function fetchPrDiff(prUrl: string): Promise<{ diff: string; titulo?: string }> {
  const m = prUrl.match(PR_RE);
  if (!m) throw new Error("URL não parece um PR do GitHub.");
  const [, owner, repo, num] = m;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3.diff",
    "User-Agent": "brain-sentinela",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${num}`, { headers });
  if (!res.ok) throw new Error(`Falha GitHub (${res.status}).`);
  return { diff: await res.text() };
}

function renderText(opts: {
  veredito: SentinelaVeredito;
  scoreConfianca: number;
  resumo: string;
  achados: SentinelaAchado[];
  url?: string;
}): string {
  const { veredito, scoreConfianca, resumo, achados, url } = opts;
  const symbol = veredito === "PASS" ? "✓" : veredito === "WARN" ? "⚠" : "✗";
  const lines: string[] = [];
  lines.push(`${symbol} SENTINELA: ${veredito} (score ${scoreConfianca}/100)`);
  lines.push(`  ${resumo}`);
  if (achados.length > 0) {
    lines.push("");
    lines.push(`Achados (${achados.length}):`);
    const order = { critico: 0, alto: 1, medio: 2, baixo: 3 } as const;
    const sorted = [...achados].sort(
      (a, b) => (order[a.severidade] ?? 9) - (order[b.severidade] ?? 9),
    );
    for (const a of sorted.slice(0, 12)) {
      const sev = a.severidade.toUpperCase().padEnd(8);
      const linha = a.linha ? ` L${a.linha}` : "";
      lines.push(`  [${sev}] ${a.categoria}${linha}: ${a.descricao}`);
      if (a.comoCorrigir) lines.push(`           → ${a.comoCorrigir}`);
    }
    if (achados.length > 12) lines.push(`  …+${achados.length - 12} achados`);
  }
  if (url) {
    lines.push("");
    lines.push(`Abrir: ${url}`);
  }
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY não configurada no servidor brain." },
      { status: 500 },
    );
  }

  try {
    const body = (await req.json()) as {
      titulo?: string;
      contexto?: string;
      codigo?: string;
      diff?: string;
      linguagem?: string;
      modo?: SentinelaModo;
      prUrl?: string;
      format?: "json" | "text";
    };

    let { titulo } = body;
    let codigo = body.codigo ?? body.diff;
    let modo: SentinelaModo = body.modo ?? (body.diff ? "diff" : "codigo");

    if (body.prUrl && !codigo) {
      try {
        const { diff } = await fetchPrDiff(body.prUrl);
        codigo = diff;
        modo = "diff";
        if (!titulo) titulo = `PR ${body.prUrl}`;
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Falha ao buscar PR." },
          { status: 400 },
        );
      }
    }

    if (!codigo?.trim()) {
      return NextResponse.json(
        { error: "Forneça `codigo`, `diff` ou `prUrl`." },
        { status: 400 },
      );
    }
    if (!titulo?.trim()) titulo = modo === "diff" ? "Diff (CLI)" : "Código (CLI)";

    const systemPrompt = modo === "diff" ? SENTINELA_DIFF_SYSTEM_PROMPT : SENTINELA_SYSTEM_PROMPT;
    const userMessage = buildSentinelaUserPrompt({
      titulo,
      contexto: body.contexto,
      codigo,
      linguagem: body.linguagem,
      modo,
      prUrl: body.prUrl,
    });

    const completion = await openai.chat.completions.create({
      model: MODELS.review,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      veredito: SentinelaVeredito;
      scoreConfianca: number;
      achados: SentinelaAchado[];
      resumo: string;
    };

    const text = renderText({
      ...parsed,
      url: body.prUrl,
    });

    if (body.format === "text") {
      return new NextResponse(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.json({
      ...parsed,
      modo,
      titulo,
      prUrl: body.prUrl,
      text,
    });
  } catch (err) {
    console.error("[cli/sentinela]", err);
    return NextResponse.json({ error: "Falha ao executar auditoria." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "brain.sentinela",
    description: "POST { titulo, codigo|diff|prUrl, contexto?, linguagem?, modo?, format? }",
    formats: ["json (default)", "text"],
  });
}
