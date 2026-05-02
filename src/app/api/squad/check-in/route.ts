import { NextRequest, NextResponse } from "next/server";
import { fsSet, fsCreate } from "@/lib/squad-rest";
import { v4 as uuidv4 } from "uuid";

// CLI/webhook: update presence and optionally log activity.
// Uses open Firestore rules (presence/activity allow write: if true).
// Auth: workspaceId or squadId acts as implicit credential.

interface CheckInBody {
  squadId: string;
  userId: string;
  displayName: string;
  currentPage?: string;
  currentTask?: string;
  sessionId?: string;
  // Optional: log an activity event
  activity?: {
    verb: string;
    entityType: string;
    entityId: string;
    entityTitle: string;
    url?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckInBody;

    if (!body.squadId || !body.userId || !body.displayName) {
      return NextResponse.json(
        { error: "squadId, userId, displayName são obrigatórios." },
        { status: 400 },
      );
    }

    const sessionId = body.sessionId ?? uuidv4();
    const now = Date.now();

    // Update presence (PATCH = upsert)
    const presencePath = `squads/${body.squadId}/presence/${body.userId}`;
    await fsSet(presencePath, {
      userId: body.userId,
      displayName: body.displayName,
      currentPage: body.currentPage ?? "CLI",
      currentTask: body.currentTask ?? null,
      lastSeen: now,
      sessionId,
    });

    // Log activity if provided
    if (body.activity) {
      const eventId = uuidv4();
      await fsCreate(`squads/${body.squadId}/activity`, eventId, {
        id: eventId,
        userId: body.userId,
        displayName: body.displayName,
        verb: body.activity.verb,
        entityType: body.activity.entityType,
        entityId: body.activity.entityId,
        entityTitle: body.activity.entityTitle,
        url: body.activity.url ?? null,
        timestamp: now,
      });
    }

    return NextResponse.json({
      ok: true,
      message: `✓ ${body.displayName} está online${body.currentTask ? ` — ${body.currentTask}` : ""}`,
      userId: body.userId,
      sessionId,
      timestamp: now,
    });
  } catch (err) {
    console.error("[squad/check-in]", err);
    return NextResponse.json({ error: "Falha ao registrar presença." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "brain.squad-check-in",
    description: "POST { squadId, userId, displayName, currentPage?, currentTask?, activity? }",
    usage: 'curl -X POST "$BRAIN_API_URL/api/squad/check-in" -H "Content-Type: application/json" -d \'{"squadId":"...","userId":"...","displayName":"Igor","currentTask":"auth module"}\'',
  });
}
