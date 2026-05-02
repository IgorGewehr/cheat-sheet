import { NextRequest, NextResponse } from "next/server";
import { fsGet, fsQuery } from "@/lib/squad-rest";
import type { SquadConstraint, SquadPresence, SquadActivityEvent } from "@/lib/types";

// CLI endpoint: returns squad context ready to inject into Claude Code.
// Reads from open Firestore collections (squadPublic, presence, activity).
// No authentication required — squadId is the implicit credential.

function formatText(params: {
  squadName: string;
  description: string;
  constraints: SquadConstraint[];
  presence: SquadPresence[];
  activity: SquadActivityEvent[];
}): string {
  const { squadName, description, constraints, presence, activity } = params;
  const lines: string[] = [];

  lines.push(`╔═══════════════════════════════════════╗`);
  lines.push(`║  BRAIN SQUAD: ${squadName.padEnd(23)}║`);
  lines.push(`╚═══════════════════════════════════════╝`);
  if (description) {
    lines.push(`${description}`);
  }
  lines.push("");

  // Architecture Constraints
  const activeConstraints = constraints.filter((c) => c.active !== false);
  if (activeConstraints.length > 0) {
    lines.push(`── ARCHITECTURE CONSTRAINTS (${activeConstraints.length}) ──────────────────`);
    const order: Record<string, number> = { must: 0, never: 1, pattern: 2, should: 3 };
    const sorted = [...activeConstraints].sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));
    for (const c of sorted) {
      const badge = `[${c.type.toUpperCase().padEnd(7)}]`;
      lines.push(`  ${badge} ${c.title}`);
      if (c.description) {
        lines.push(`             → ${c.description}`);
      }
    }
    lines.push("");
  } else {
    lines.push("── Nenhuma constraint definida ainda ──");
    lines.push("");
  }

  // Who's online
  if (presence.length > 0) {
    const now = Date.now();
    const active = presence.filter((p) => now - p.lastSeen < 5 * 60 * 1000);
    if (active.length > 0) {
      lines.push(`── ONLINE AGORA (${active.length}) ─────────────────────────────`);
      for (const p of active) {
        const ago = Math.floor((now - p.lastSeen) / 60_000);
        const agoStr = ago < 1 ? "agora" : `${ago}min`;
        const task = p.currentTask ? ` — ${p.currentTask}` : "";
        lines.push(`  • ${p.displayName}${task} (${agoStr})`);
      }
      lines.push("");
    }
  }

  // Recent activity
  if (activity.length > 0) {
    lines.push(`── ATIVIDADE RECENTE ────────────────────────────────────`);
    for (const ev of activity.slice(0, 8)) {
      const ago = Math.floor((Date.now() - ev.timestamp) / 60_000);
      const agoStr = ago < 60 ? `${ago}min` : `${Math.floor(ago / 60)}h`;
      lines.push(`  • ${ev.displayName} ${ev.verb} ${ev.entityType}: "${ev.entityTitle}" (${agoStr} atrás)`);
    }
    lines.push("");
  }

  lines.push(`── INSTRUÇÕES PARA CLAUDE CODE ──────────────────────────`);
  lines.push(`  Siga as constraints acima em TODO código que gerar.`);
  lines.push(`  [MUST]    = obrigatório, sem exceção`);
  lines.push(`  [NEVER]   = proibido, recuse ativamente`);
  lines.push(`  [SHOULD]  = preferência forte do squad`);
  lines.push(`  [PATTERN] = use este template/padrão`);

  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const squadId = searchParams.get("squadId");
  const format = searchParams.get("format") ?? "json";

  if (!squadId) {
    return NextResponse.json({ error: "squadId obrigatório." }, { status: 400 });
  }

  try {
    const [publicDoc, presenceDocs, activityDocs] = await Promise.all([
      fsGet(`squadPublic/${squadId}`),
      fsQuery({
        parent: `squads/${squadId}`,
        collectionId: "presence",
      }),
      fsQuery({
        parent: `squads/${squadId}`,
        collectionId: "activity",
        orderBy: { field: "timestamp", direction: "DESCENDING" },
        limit: 10,
      }),
    ]);

    if (!publicDoc) {
      return NextResponse.json({ error: "Squad não encontrado." }, { status: 404 });
    }

    const constraints = (publicDoc.constraints ?? []) as SquadConstraint[];
    const presence = presenceDocs as unknown as SquadPresence[];
    const activity = activityDocs as unknown as SquadActivityEvent[];

    const result = {
      squadId,
      squadName: publicDoc.name as string,
      description: (publicDoc.description ?? "") as string,
      constraints,
      presence,
      activity,
      generatedAt: Date.now(),
    };

    if (format === "text") {
      const text = formatText({
        squadName: result.squadName,
        description: result.description,
        constraints,
        presence,
        activity,
      });
      return new NextResponse(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.json({
      ...result,
      text: formatText({
        squadName: result.squadName,
        description: result.description,
        constraints,
        presence,
        activity,
      }),
    });
  } catch (err) {
    console.error("[cli/squad-brief]", err);
    return NextResponse.json({ error: "Falha ao carregar squad." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Also support POST with body for flexibility
  const body = (await req.json()) as {
    squadId: string;
    userId?: string;
    format?: "json" | "text";
  };

  const url = new URL(req.url);
  url.searchParams.set("squadId", body.squadId);
  if (body.format) url.searchParams.set("format", body.format);

  return GET(new NextRequest(url.toString()));
}

export async function OPTIONS() {
  return NextResponse.json({
    name: "brain.squad-brief",
    description: "GET/POST ?squadId=X&format=text — Squad context for Claude Code",
    usage: 'curl "$BRAIN_API_URL/api/cli/squad-brief?squadId=$BRAIN_SQUAD_ID&format=text"',
  });
}
