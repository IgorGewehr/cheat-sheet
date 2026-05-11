import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/server-auth";
import { adminDb } from "@/lib/admin";
import { v4 as uuidv4 } from "uuid";
import type { Project, Modulo, Decisao, Adocao } from "@/lib/types";

// Accepts the ArchitectureJSON format from /api/cli/scan-project
// and bulk-creates the project + modules + decisions + adoptions.
interface ArchitectureJSON {
  version: string;
  source?: string;
  project: { nome: string; descricao?: string; stack: string[]; tipo?: Project["tipo"]; status?: Project["status"]; repoUrl?: string };
  modulos?: { nome: string; tipo: string; status?: Modulo["status"]; descricao?: string }[];
  decisoes?: { titulo: string; contexto: string; decisao: string; consequencias: string; status?: Decisao["status"]; cardSlugs?: string[] }[];
  adocoes?: { cardSlug: string; moduloNome?: string; status?: Adocao["status"]; notas?: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const { workspaceId } = await verifyToken(req);
    const body = (await req.json()) as ArchitectureJSON;
    if (!body.project?.nome?.trim()) return NextResponse.json({ error: "project.nome obrigatório" }, { status: 400 });

    const db = adminDb();
    const ws = db.collection("workspaces").doc(workspaceId);
    const batch = db.batch();
    const now = Date.now();

    const project: Project = { id: uuidv4(), criadoEm: now, nome: body.project.nome.trim(), stack: body.project.stack ?? [], descricao: body.project.descricao, tipo: body.project.tipo, status: body.project.status ?? "planejando", repoUrl: body.project.repoUrl };
    batch.set(ws.collection("projetos").doc(project.id), project);

    const modulosByName = new Map<string, string>();
    const core: Modulo = { id: uuidv4(), projetoId: project.id, nome: "Core", tipo: "core", status: "planejando", criadoEm: now + 1 };
    batch.set(ws.collection("modulos").doc(core.id), core);
    modulosByName.set("Core", core.id);

    for (const m of body.modulos ?? []) {
      if (m.nome === "Core") continue;
      const modulo: Modulo = { id: uuidv4(), projetoId: project.id, nome: m.nome, tipo: m.tipo ?? "feature", status: m.status ?? "planejando", criadoEm: now + 2, ...(m.descricao ? { descricao: m.descricao } : {}) };
      batch.set(ws.collection("modulos").doc(modulo.id), modulo);
      modulosByName.set(m.nome, modulo.id);
    }

    for (const d of body.decisoes ?? []) {
      const decisao: Decisao = { id: uuidv4(), projetoId: project.id, titulo: d.titulo, contexto: d.contexto ?? "", decisao: d.decisao, consequencias: d.consequencias ?? "", status: d.status ?? "aceita", data: now, ...(d.cardSlugs?.length ? { cardSlugs: d.cardSlugs } : {}) };
      batch.set(ws.collection("decisoes").doc(decisao.id), decisao);
    }

    for (const a of body.adocoes ?? []) {
      const moduloId = a.moduloNome ? (modulosByName.get(a.moduloNome) ?? null) : null;
      const adocao: Adocao = { id: uuidv4(), projetoId: project.id, moduloId, cardSlug: a.cardSlug, status: a.status ?? "adotado", dataDecisao: now, ...(a.notas ? { notas: a.notas } : {}) };
      batch.set(ws.collection("adocoes").doc(adocao.id), adocao);
    }

    await batch.commit();
    return NextResponse.json({ projectId: project.id, nome: project.nome, modulosCount: modulosByName.size, decisoesCount: body.decisoes?.length ?? 0 }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 400 });
  }
}
