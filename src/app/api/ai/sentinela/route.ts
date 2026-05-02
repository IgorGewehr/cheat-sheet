import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import {
  SENTINELA_SYSTEM_PROMPT,
  SENTINELA_DIFF_SYSTEM_PROMPT,
  buildSentinelaUserPrompt,
  type SentinelaModo,
} from "@/lib/sentinela-prompts";
import type { SentinelaVeredito, SentinelaAchado } from "@/lib/sentinela-types";

export interface SentinelaResult {
  veredito: SentinelaVeredito;
  scoreConfianca: number;
  achados: SentinelaAchado[];
  resumo: string;
  modo?: SentinelaModo;
  prUrl?: string;
}

const PR_RE = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i;

async function fetchPrDiff(prUrl: string): Promise<{ diff: string; titulo?: string }> {
  const m = prUrl.match(PR_RE);
  if (!m) throw new Error("URL não parece um PR do GitHub.");
  const [, owner, repo, num] = m;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3.diff",
    "User-Agent": "brain-sentinela",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const diffRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${num}`, {
    headers,
  });
  if (!diffRes.ok) {
    throw new Error(
      diffRes.status === 404
        ? "PR não encontrado (ou repo privado sem GITHUB_TOKEN)."
        : `Falha ao buscar PR (${diffRes.status}).`,
    );
  }
  const diff = await diffRes.text();

  // Best-effort title fetch (not critical)
  let titulo: string | undefined;
  try {
    const metaHeaders: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "brain-sentinela",
    };
    if (process.env.GITHUB_TOKEN) metaHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${num}`, {
      headers: metaHeaders,
    });
    if (metaRes.ok) {
      const meta = (await metaRes.json()) as { title?: string };
      titulo = meta.title;
    }
  } catch {}

  return { diff, titulo };
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY não configurada. Adicione ao .env.local." },
      { status: 500 },
    );
  }

  try {
    const body = await req.json() as {
      titulo: string;
      contexto?: string;
      codigo?: string;
      linguagem?: string;
      modo?: SentinelaModo;
      prUrl?: string;
    };

    let { titulo, codigo } = body;
    const { contexto, linguagem, prUrl } = body;
    let modo: SentinelaModo = body.modo ?? "codigo";

    // PR URL → fetch diff and switch to diff mode
    if (prUrl && !codigo) {
      try {
        const { diff, titulo: prTitle } = await fetchPrDiff(prUrl);
        codigo = diff;
        modo = "diff";
        if (!titulo && prTitle) titulo = prTitle;
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Falha ao buscar PR." },
          { status: 400 },
        );
      }
    }

    if (!titulo?.trim() || !codigo?.trim()) {
      return NextResponse.json({ error: "Título e código/diff são obrigatórios." }, { status: 400 });
    }

    const systemPrompt = modo === "diff" ? SENTINELA_DIFF_SYSTEM_PROMPT : SENTINELA_SYSTEM_PROMPT;
    const userMessage = buildSentinelaUserPrompt({ titulo, contexto, codigo, linguagem, modo, prUrl });

    const completion = await openai.chat.completions.create({
      model: MODELS.review,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const result = JSON.parse(raw) as SentinelaResult;

    return NextResponse.json({ ...result, modo, prUrl, titulo });
  } catch (err) {
    console.error("[sentinela]", err);
    return NextResponse.json(
      { error: "Falha ao executar auditoria. Tente novamente." },
      { status: 500 },
    );
  }
}
