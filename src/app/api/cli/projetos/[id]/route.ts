import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/server-auth";
import { adminDb } from "@/lib/admin";
import type { Project, Modulo, Decisao } from "@/lib/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await verifyToken(req);
    const { id } = await params;
    const db = adminDb();
    const ws = db.collection("workspaces").doc(workspaceId);

    const [projSnap, modulosSnap, decisoesSnap] = await Promise.all([
      ws.collection("projetos").doc(id).get(),
      ws.collection("modulos").where("projetoId", "==", id).orderBy("criadoEm", "asc").get(),
      ws.collection("decisoes").where("projetoId", "==", id).orderBy("data", "desc").get(),
    ]);

    if (!projSnap.exists) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

    return NextResponse.json({
      projeto: projSnap.data() as Project,
      modulos: modulosSnap.docs.map((d) => d.data() as Modulo),
      decisoes: decisoesSnap.docs.map((d) => {
        const dec = d.data() as Decisao;
        return { id: dec.id, titulo: dec.titulo, status: dec.status, data: dec.data, contexto: dec.contexto, decisao: dec.decisao, consequencias: dec.consequencias, cardSlugs: dec.cardSlugs };
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await verifyToken(req);
    const { id } = await params;
    const body = (await req.json()) as Partial<Project>;
    const db = adminDb();
    const ref = db.collection("workspaces").doc(workspaceId).collection("projetos").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

    const allowed = ["nome", "descricao", "stack", "tipo", "status", "repoUrl"] as const;
    const update: Partial<Project> = {};
    for (const k of allowed) if (body[k] !== undefined) (update as Record<string, unknown>)[k] = body[k];

    await ref.update(update as Record<string, unknown>);
    return NextResponse.json({ ...snap.data(), ...update });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 400 });
  }
}
