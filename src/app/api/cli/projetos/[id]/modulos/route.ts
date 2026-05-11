import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/server-auth";
import { adminDb } from "@/lib/admin";
import { v4 as uuidv4 } from "uuid";
import type { Modulo } from "@/lib/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await verifyToken(req);
    const { id: projetoId } = await params;
    const body = (await req.json()) as Partial<Modulo> & { nome: string; tipo: string };
    if (!body.nome?.trim()) return NextResponse.json({ error: "nome obrigatório" }, { status: 400 });

    const db = adminDb();
    const ws = db.collection("workspaces").doc(workspaceId);

    // If moduleId provided, update existing
    if (body.id) {
      const ref = ws.collection("modulos").doc(body.id);
      const snap = await ref.get();
      if (!snap.exists) return NextResponse.json({ error: "Módulo não encontrado" }, { status: 404 });
      const allowed = ["nome", "tipo", "status", "descricao"] as const;
      const update: Partial<Modulo> = {};
      for (const k of allowed) if (body[k] !== undefined) (update as Record<string, unknown>)[k] = body[k];
      await ref.update(update as Record<string, unknown>);
      return NextResponse.json({ ...snap.data(), ...update });
    }

    // Create new
    const modulo: Modulo = {
      id: uuidv4(),
      projetoId,
      nome: body.nome.trim(),
      tipo: body.tipo ?? "feature",
      status: body.status ?? "planejando",
      criadoEm: Date.now(),
      ...(body.descricao ? { descricao: body.descricao } : {}),
    };
    await ws.collection("modulos").doc(modulo.id).set(modulo);
    return NextResponse.json(modulo, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 400 });
  }
}
