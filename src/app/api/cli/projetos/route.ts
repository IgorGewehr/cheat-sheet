import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/server-auth";
import { adminDb } from "@/lib/admin";
import { v4 as uuidv4 } from "uuid";
import type { Project, Modulo } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const { workspaceId } = await verifyToken(req);
    const db = adminDb();
    const ws = db.collection("workspaces").doc(workspaceId);

    const [projSnap, modSnap, decSnap] = await Promise.all([
      ws.collection("projetos").orderBy("criadoEm", "desc").get(),
      ws.collection("modulos").get(),
      ws.collection("decisoes").get(),
    ]);

    const modulosCount = new Map<string, number>();
    for (const d of modSnap.docs) modulosCount.set(d.data().projetoId, (modulosCount.get(d.data().projetoId) ?? 0) + 1);
    const decisoesCount = new Map<string, number>();
    for (const d of decSnap.docs) decisoesCount.set(d.data().projetoId, (decisoesCount.get(d.data().projetoId) ?? 0) + 1);

    const projects = projSnap.docs.map((d) => {
      const p = d.data() as Project;
      return { id: p.id, nome: p.nome, descricao: p.descricao, stack: p.stack, tipo: p.tipo, status: p.status, repoUrl: p.repoUrl, modulosCount: modulosCount.get(p.id) ?? 0, decisoesCount: decisoesCount.get(p.id) ?? 0 };
    });

    return NextResponse.json(projects);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspaceId } = await verifyToken(req);
    const body = (await req.json()) as Omit<Project, "id" | "criadoEm">;
    if (!body.nome?.trim()) return NextResponse.json({ error: "nome obrigatório" }, { status: 400 });

    const db = adminDb();
    const ws = db.collection("workspaces").doc(workspaceId);
    const project: Project = { ...body, id: uuidv4(), criadoEm: Date.now() };
    const core: Modulo = { id: uuidv4(), projetoId: project.id, nome: "Core", tipo: "core", status: "planejando", criadoEm: Date.now() + 1 };

    const batch = db.batch();
    batch.set(ws.collection("projetos").doc(project.id), project);
    batch.set(ws.collection("modulos").doc(core.id), core);
    await batch.commit();

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 400 });
  }
}
