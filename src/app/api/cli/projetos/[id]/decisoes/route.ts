import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/server-auth";
import { adminDb } from "@/lib/admin";
import { v4 as uuidv4 } from "uuid";
import type { Decisao } from "@/lib/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await verifyToken(req);
    const { id: projetoId } = await params;
    const db = adminDb();
    const snap = await db.collection("workspaces").doc(workspaceId)
      .collection("decisoes").where("projetoId", "==", projetoId).orderBy("data", "desc").get();
    return NextResponse.json(snap.docs.map((d) => d.data() as Decisao));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await verifyToken(req);
    const { id: projetoId } = await params;
    const body = (await req.json()) as Omit<Decisao, "id" | "data" | "projetoId">;
    if (!body.titulo?.trim() || !body.decisao?.trim()) {
      return NextResponse.json({ error: "titulo e decisao obrigatórios" }, { status: 400 });
    }

    const decisao: Decisao = {
      id: uuidv4(),
      projetoId,
      titulo: body.titulo.trim(),
      contexto: body.contexto ?? "",
      decisao: body.decisao.trim(),
      consequencias: body.consequencias ?? "",
      status: body.status ?? "aceita",
      data: Date.now(),
      ...(body.cardSlugs?.length ? { cardSlugs: body.cardSlugs } : {}),
    };

    await adminDb().collection("workspaces").doc(workspaceId)
      .collection("decisoes").doc(decisao.id).set(decisao);
    return NextResponse.json(decisao, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 400 });
  }
}
