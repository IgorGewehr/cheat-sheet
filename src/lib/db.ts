"use client";

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  onSnapshot,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { ensureSignedIn, getFirebase } from "./firebase";
import { getWorkspaceId } from "./workspace";
import type {
  Adocao,
  AdocaoStatus,
  ChecklistSession,
  CustomCard,
  Decisao,
  Modulo,
  ModuloStatus,
  Project,
  SavedComparison,
} from "./types";

type ColName = "projetos" | "modulos" | "adocoes" | "decisoes" | "checklistSessions" | "customCards" | "comparacoes";

function col(name: ColName) {
  const { db } = getFirebase();
  return collection(db, "workspaces", getWorkspaceId(), name);
}

function docRef(name: ColName, id: string) {
  const { db } = getFirebase();
  return doc(db, "workspaces", getWorkspaceId(), name, id);
}

async function ready() {
  await ensureSignedIn();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clean<T extends object>(obj: T): Record<string, any> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

// ───── Projetos ─────────────────────────────────────────────

export async function listProjects(): Promise<Project[]> {
  await ready();
  const snap = await getDocs(query(col("projetos"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as Project);
}

export async function getProject(id: string): Promise<Project | null> {
  await ready();
  const snap = await getDoc(docRef("projetos", id));
  return snap.exists() ? (snap.data() as Project) : null;
}

export async function createProject(
  input: Omit<Project, "id" | "criadoEm">,
): Promise<Project> {
  await ready();
  const { db } = getFirebase();
  const project: Project = { ...input, id: uuidv4(), criadoEm: Date.now() };
  const core: Modulo = {
    id: uuidv4(),
    projetoId: project.id,
    nome: "Core",
    tipo: "core",
    status: "planejando",
    criadoEm: Date.now() + 1,
  };
  const batch = writeBatch(db);
  batch.set(docRef("projetos", project.id), clean(project) as DocumentData);
  batch.set(docRef("modulos", core.id), clean(core) as DocumentData);
  await batch.commit();
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  await ready();
  const { db } = getFirebase();
  const [modulos, adocoes, decisoes, sessions] = await Promise.all([
    getDocs(query(col("modulos"), where("projetoId", "==", id))),
    getDocs(query(col("adocoes"), where("projetoId", "==", id))),
    getDocs(query(col("decisoes"), where("projetoId", "==", id))),
    getDocs(query(col("checklistSessions"), where("projetoId", "==", id))),
  ]);
  const batch = writeBatch(db);
  for (const d of modulos.docs) batch.delete(d.ref);
  for (const d of adocoes.docs) batch.delete(d.ref);
  for (const d of decisoes.docs) batch.delete(d.ref);
  for (const d of sessions.docs) batch.delete(d.ref);
  batch.delete(docRef("projetos", id));
  await batch.commit();
}

// ───── Projetos — Real-time subscriptions ───────────────────

export function subscribeProjects(callback: (projects: Project[]) => void): Unsubscribe {
  const { auth } = getFirebase();
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }
  const q = query(col("projetos"), orderBy("criadoEm", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Project));
  });
}

// ───── Módulos ──────────────────────────────────────────────

export async function listModulos(projetoId: string): Promise<Modulo[]> {
  await ready();
  const snap = await getDocs(
    query(col("modulos"), where("projetoId", "==", projetoId), orderBy("criadoEm", "desc")),
  );
  return snap.docs.map((d) => d.data() as Modulo);
}

export async function createModulo(
  input: Omit<Modulo, "id" | "criadoEm">,
): Promise<Modulo> {
  await ready();
  const modulo: Modulo = {
    ...input,
    id: uuidv4(),
    criadoEm: Date.now(),
  };
  await setDoc(docRef("modulos", modulo.id), clean(modulo) as DocumentData);
  return modulo;
}

export async function updateModuloStatus(id: string, status: ModuloStatus): Promise<void> {
  await ready();
  await setDoc(docRef("modulos", id), { status }, { merge: true });
}

export async function deleteModulo(id: string): Promise<void> {
  await ready();
  const { db } = getFirebase();
  const adocoes = await getDocs(query(col("adocoes"), where("moduloId", "==", id)));
  const batch = writeBatch(db);
  for (const d of adocoes.docs) batch.delete(d.ref);
  batch.delete(docRef("modulos", id));
  await batch.commit();
}

export function subscribeModulos(
  projetoId: string,
  callback: (modulos: Modulo[]) => void,
): Unsubscribe {
  const { auth } = getFirebase();
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }
  const q = query(
    col("modulos"),
    where("projetoId", "==", projetoId),
    orderBy("criadoEm", "desc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Modulo));
  });
}

// ───── Adoções ──────────────────────────────────────────────

export async function listAdocoesByProject(projetoId: string): Promise<Adocao[]> {
  await ready();
  const snap = await getDocs(query(col("adocoes"), where("projetoId", "==", projetoId)));
  return snap.docs.map((d) => d.data() as Adocao);
}

export async function listAllAdocoes(): Promise<Adocao[]> {
  await ready();
  const snap = await getDocs(col("adocoes"));
  return snap.docs.map((d) => d.data() as Adocao);
}

export async function listProjectsByCardSlug(slugs: string[]): Promise<Map<string, Project[]>> {
  await ready();
  const result = new Map<string, Project[]>();
  if (!slugs.length) return result;
  const [adocoesSnap, projectsSnap] = await Promise.all([
    getDocs(col("adocoes")),
    getDocs(col("projetos")),
  ]);
  const projectsById = new Map<string, Project>();
  for (const d of projectsSnap.docs) {
    const p = d.data() as Project;
    projectsById.set(p.id, p);
  }
  const set = new Set(slugs);
  for (const d of adocoesSnap.docs) {
    const a = d.data() as Adocao;
    if (!set.has(a.cardSlug)) continue;
    const p = projectsById.get(a.projetoId);
    if (!p) continue;
    const arr = result.get(a.cardSlug) ?? [];
    if (!arr.find((x) => x.id === p.id)) arr.push(p);
    result.set(a.cardSlug, arr);
  }
  return result;
}

export async function createAdocao(input: Omit<Adocao, "id" | "dataDecisao">): Promise<Adocao> {
  await ready();
  const adocao: Adocao = { status: "adotado", ...input, id: uuidv4(), dataDecisao: Date.now() };
  await setDoc(docRef("adocoes", adocao.id), clean(adocao) as DocumentData);
  return adocao;
}

export async function updateAdocaoStatus(id: string, status: AdocaoStatus): Promise<void> {
  await ready();
  const ref = docRef("adocoes", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await setDoc(ref, { ...snap.data(), status }, { merge: true });
}

export async function updateAdocaoNotas(id: string, notas: string): Promise<void> {
  await ready();
  const ref = docRef("adocoes", id);
  await setDoc(ref, { notas }, { merge: true });
}

export async function deleteAdocao(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("adocoes", id));
}

export function subscribeAdocoes(
  projetoId: string,
  callback: (adocoes: Adocao[]) => void,
): Unsubscribe {
  const { auth } = getFirebase();
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }
  const q = query(col("adocoes"), where("projetoId", "==", projetoId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Adocao));
  });
}

// ───── Decisões / ADRs ──────────────────────────────────────

export async function listDecisoes(projetoId: string): Promise<Decisao[]> {
  await ready();
  const snap = await getDocs(
    query(col("decisoes"), where("projetoId", "==", projetoId), orderBy("data", "desc")),
  );
  return snap.docs.map((d) => d.data() as Decisao);
}

export async function createDecisao(input: Omit<Decisao, "id" | "data">): Promise<Decisao> {
  await ready();
  const decisao: Decisao = { ...input, id: uuidv4(), data: Date.now() };
  await setDoc(docRef("decisoes", decisao.id), clean(decisao) as DocumentData);
  return decisao;
}

export async function updateDecisaoStatus(id: string, status: Decisao["status"]): Promise<void> {
  await ready();
  await setDoc(docRef("decisoes", id), { status }, { merge: true });
}

export async function deleteDecisao(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("decisoes", id));
}

// ───── Checklist Sessions ────────────────────────────────────

export async function listChecklistSessions(cardSlug: string): Promise<ChecklistSession[]> {
  await ready();
  const snap = await getDocs(
    query(col("checklistSessions"), where("cardSlug", "==", cardSlug), orderBy("criadoEm", "desc")),
  );
  return snap.docs.map((d) => d.data() as ChecklistSession);
}

export async function createChecklistSession(
  input: Omit<ChecklistSession, "id" | "criadoEm">,
): Promise<ChecklistSession> {
  await ready();
  const session: ChecklistSession = { ...input, id: uuidv4(), criadoEm: Date.now() };
  await setDoc(docRef("checklistSessions", session.id), clean(session) as DocumentData);
  return session;
}

export async function updateChecklistSession(
  id: string,
  updates: Partial<Pick<ChecklistSession, "checked" | "titulo" | "prUrl">>,
): Promise<void> {
  await ready();
  await setDoc(docRef("checklistSessions", id), updates, { merge: true });
}

export async function deleteChecklistSession(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("checklistSessions", id));
}

// ───── Custom Cards ──────────────────────────────────────────

export async function listCustomCards(): Promise<CustomCard[]> {
  await ready();
  const snap = await getDocs(query(col("customCards"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as CustomCard);
}

export async function createCustomCard(
  input: Omit<CustomCard, "id" | "criadoEm" | "isCustom">,
): Promise<CustomCard> {
  await ready();
  const card: CustomCard = { ...input, id: uuidv4(), isCustom: true, criadoEm: Date.now() };
  await setDoc(docRef("customCards", card.id), clean(card) as DocumentData);
  return card;
}

export async function deleteCustomCard(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("customCards", id));
}

// ───── Comparações salvas ───────────────────────────────────

export async function listComparacoes(): Promise<SavedComparison[]> {
  await ready();
  const snap = await getDocs(query(col("comparacoes"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as SavedComparison);
}

export async function createComparacao(
  input: Omit<SavedComparison, "id" | "criadoEm">,
): Promise<SavedComparison> {
  await ready();
  const c: SavedComparison = { ...input, id: uuidv4(), criadoEm: Date.now() };
  await setDoc(docRef("comparacoes", c.id), clean(c) as DocumentData);
  return c;
}

export async function deleteComparacao(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("comparacoes", id));
}

// ───── Export / Import ──────────────────────────────────────

export async function exportWorkspace(): Promise<{
  projetos: Project[];
  modulos: Modulo[];
  adocoes: Adocao[];
  decisoes: Decisao[];
  exportedAt: number;
}> {
  await ready();
  const [projetos, modulosSnap, adocoesSnap, decisoesSnap] = await Promise.all([
    listProjects(),
    getDocs(col("modulos")),
    getDocs(col("adocoes")),
    getDocs(col("decisoes")),
  ]);
  return {
    projetos,
    modulos: modulosSnap.docs.map((d) => d.data() as Modulo),
    adocoes: adocoesSnap.docs.map((d) => d.data() as Adocao),
    decisoes: decisoesSnap.docs.map((d) => d.data() as Decisao),
    exportedAt: Date.now(),
  };
}

export async function importWorkspace(payload: {
  projetos?: Project[];
  modulos?: Modulo[];
  adocoes?: Adocao[];
  decisoes?: Decisao[];
}): Promise<void> {
  await ready();
  const { db } = getFirebase();
  type Entry = [ColName, string, object];
  const entries: Entry[] = [
    ...(payload.projetos ?? []).map((p): Entry => ["projetos", p.id, clean(p)]),
    ...(payload.modulos ?? []).map((m): Entry => ["modulos", m.id, clean(m)]),
    ...(payload.adocoes ?? []).map((a): Entry => ["adocoes", a.id, clean(a)]),
    ...(payload.decisoes ?? []).map((d): Entry => ["decisoes", d.id, clean(d)]),
  ];
  // Firestore batches are limited to 500 ops
  for (let i = 0; i < entries.length; i += 500) {
    const batch = writeBatch(db);
    for (const [col, id, data] of entries.slice(i, i + 500)) {
      batch.set(docRef(col, id), data as DocumentData);
    }
    await batch.commit();
  }
}
