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
  CardDoDiaProgresso,
  ChecklistSession,
  CustomCard,
  Decisao,
  DividaConhecimento,
  DividaStatus,
  ErroPersonal,
  ExperienciaSTAR,
  Modulo,
  ModuloStatus,
  MockInterviewSession,
  Project,
  RFCSession,
  Retrospectiva,
  RevisorSession,
  SavedComparison,
  SprintSemIA,
  SystemDesignSession,
  TrilhaProgresso,
  WarGameSession,
} from "./types";

type ColName =
  | "projetos" | "modulos" | "adocoes" | "decisoes"
  | "checklistSessions" | "customCards" | "comparacoes"
  | "cardDoDia" | "dividas" | "retrospectivas" | "sprintsSemIA"
  | "errosPersonais" | "experienciasSTAR" | "systemDesigns"
  | "mockInterviews" | "rfcSessions" | "warGames" | "revisoesCodigo"
  | "trilhaProgresso";

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

export function subscribeDecisoes(
  projetoId: string,
  callback: (decisoes: Decisao[]) => void,
): Unsubscribe {
  const { auth } = getFirebase();
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }
  const q = query(
    col("decisoes"),
    where("projetoId", "==", projetoId),
    orderBy("data", "desc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Decisao));
  });
}

// ───── Extração de módulo como microsserviço ─────────────────

export async function extractModuloAsProject(params: {
  sourceProjectId: string;
  sourceProjectNome: string;
  moduloId: string;
  moduloNome: string;
  moduloAdocoes: Adocao[];
  newProject: { nome: string; descricao?: string; stack: string[] };
  createADR: boolean;
}): Promise<Project> {
  await ready();
  const { db } = getFirebase();
  const {
    sourceProjectId, sourceProjectNome,
    moduloId, moduloNome, moduloAdocoes,
    newProject: newProjInput, createADR,
  } = params;

  const project: Project = {
    ...newProjInput,
    id: uuidv4(),
    tipo: "microsservico",
    status: "planejando",
    criadoEm: Date.now(),
    origemModulo: {
      projetoId: sourceProjectId,
      projetoNome: sourceProjectNome,
      moduloId,
      moduloNome,
    },
  };

  const coreModulo: Modulo = {
    id: uuidv4(),
    projetoId: project.id,
    nome: "Core",
    tipo: "core",
    status: "planejando",
    criadoEm: Date.now() + 1,
  };

  type SetOp = { kind: "set"; col: ColName; id: string; data: object };
  type UpdateOp = { kind: "update"; col: ColName; id: string; data: object };
  const ops: (SetOp | UpdateOp)[] = [
    { kind: "set", col: "projetos", id: project.id, data: clean(project) },
    { kind: "set", col: "modulos", id: coreModulo.id, data: clean(coreModulo) },
  ];

  for (const a of moduloAdocoes) {
    const copy: Adocao = {
      id: uuidv4(),
      projetoId: project.id,
      moduloId: coreModulo.id,
      cardSlug: a.cardSlug,
      status: a.status ?? "adotado",
      notas: a.notas,
      dataDecisao: Date.now(),
    };
    ops.push({ kind: "set", col: "adocoes", id: copy.id, data: clean(copy) });
  }

  if (createADR) {
    const adr: Decisao = {
      id: uuidv4(),
      projetoId: sourceProjectId,
      titulo: `Extrair módulo "${moduloNome}" como microsserviço "${newProjInput.nome}"`,
      contexto: `O módulo "${moduloNome}" cresceu em responsabilidades a ponto de justificar extração como serviço independente, com deploy, escala e ciclo de vida próprios.`,
      decisao: `Criar o projeto "${newProjInput.nome}" como microsserviço separado, migrando os padrões e responsabilidades do módulo "${moduloNome}". O módulo original permanece no projeto atual marcado como "extraído" para rastreabilidade.`,
      consequencias: `Melhor isolamento, escalabilidade e deployabilidade independente. Adicionada complexidade de comunicação entre serviços (contratos de API, autenticação service-to-service, eventual consistency).`,
      status: "aceita",
      data: Date.now(),
    };
    ops.push({ kind: "set", col: "decisoes", id: adr.id, data: clean(adr) });
  }

  ops.push({
    kind: "update",
    col: "modulos",
    id: moduloId,
    data: { status: "extraido", projetoExtraidoId: project.id },
  });

  for (let i = 0; i < ops.length; i += 500) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + 500)) {
      const ref = docRef(op.col, op.id);
      if (op.kind === "update") {
        batch.update(ref, op.data as DocumentData);
      } else {
        batch.set(ref, op.data as DocumentData);
      }
    }
    await batch.commit();
  }

  return project;
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

// ───── Card do Dia ───────────────────────────────────────────

export async function getCardDoDiaProgresso(data: string): Promise<CardDoDiaProgresso | null> {
  await ready();
  const snap = await getDocs(query(col("cardDoDia"), where("data", "==", data)));
  if (snap.empty) return null;
  return snap.docs[0].data() as CardDoDiaProgresso;
}

export async function listCardDoDiaProgresso(): Promise<CardDoDiaProgresso[]> {
  await ready();
  const snap = await getDocs(query(col("cardDoDia"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as CardDoDiaProgresso);
}

export async function saveCardDoDiaProgresso(
  input: Omit<CardDoDiaProgresso, "id" | "criadoEm">,
): Promise<CardDoDiaProgresso> {
  await ready();
  const p: CardDoDiaProgresso = { ...input, id: uuidv4(), criadoEm: Date.now() };
  await setDoc(docRef("cardDoDia", p.id), clean(p) as DocumentData);
  return p;
}

// ───── Trilha de Senioridade ─────────────────────────────────

export async function listTrilhaProgresso(): Promise<TrilhaProgresso[]> {
  await ready();
  const snap = await getDocs(col("trilhaProgresso"));
  return snap.docs.map((d) => d.data() as TrilhaProgresso);
}

export async function saveTrilhaProgresso(
  cardSlug: string,
  update: Partial<Omit<TrilhaProgresso, "cardSlug">>,
): Promise<void> {
  await ready();
  const existing = await getDoc(docRef("trilhaProgresso", cardSlug));
  const current: TrilhaProgresso = existing.exists()
    ? (existing.data() as TrilhaProgresso)
    : { cardSlug, dominado: false, tentativas: 0, melhorScore: 0 };
  await setDoc(
    docRef("trilhaProgresso", cardSlug),
    clean({ ...current, ...update }) as DocumentData,
  );
}

// ───── Dívida de Conhecimento ────────────────────────────────

export async function listDividas(): Promise<DividaConhecimento[]> {
  await ready();
  const snap = await getDocs(query(col("dividas"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as DividaConhecimento);
}

export async function createDivida(
  input: Omit<DividaConhecimento, "id" | "criadoEm">,
): Promise<DividaConhecimento> {
  await ready();
  const d: DividaConhecimento = { ...input, id: uuidv4(), criadoEm: Date.now() };
  await setDoc(docRef("dividas", d.id), clean(d) as DocumentData);
  return d;
}

export async function updateDividaStatus(id: string, status: DividaStatus, resolvidoEm?: number): Promise<void> {
  await ready();
  await setDoc(docRef("dividas", id), { status, ...(resolvidoEm ? { resolvidoEm } : {}) }, { merge: true });
}

export async function deleteDivida(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("dividas", id));
}

// ───── Retrospectiva Semanal ─────────────────────────────────

export async function listRetrospectivas(): Promise<Retrospectiva[]> {
  await ready();
  const snap = await getDocs(query(col("retrospectivas"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as Retrospectiva);
}

export async function getRetrospectivaByWeek(semana: string): Promise<Retrospectiva | null> {
  await ready();
  const snap = await getDocs(query(col("retrospectivas"), where("semana", "==", semana)));
  if (snap.empty) return null;
  return snap.docs[0].data() as Retrospectiva;
}

export async function saveRetrospectiva(
  input: Omit<Retrospectiva, "id" | "criadoEm">,
): Promise<Retrospectiva> {
  await ready();
  const r: Retrospectiva = { ...input, id: uuidv4(), criadoEm: Date.now() };
  await setDoc(docRef("retrospectivas", r.id), clean(r) as DocumentData);
  return r;
}

// ───── Sprint sem IA ─────────────────────────────────────────

export async function listSprintsSemIA(): Promise<SprintSemIA[]> {
  await ready();
  const snap = await getDocs(query(col("sprintsSemIA"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as SprintSemIA);
}

export async function createSprintSemIA(
  input: Omit<SprintSemIA, "id" | "criadoEm">,
): Promise<SprintSemIA> {
  await ready();
  const s: SprintSemIA = { ...input, id: uuidv4(), criadoEm: Date.now() };
  await setDoc(docRef("sprintsSemIA", s.id), clean(s) as DocumentData);
  return s;
}

export async function updateSprintSemIA(id: string, updates: Partial<SprintSemIA>): Promise<void> {
  await ready();
  await setDoc(docRef("sprintsSemIA", id), clean(updates), { merge: true });
}

export async function deleteSprintSemIA(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("sprintsSemIA", id));
}

// ───── Biblioteca de Erros Pessoais ──────────────────────────

export async function listErrosPersonais(): Promise<ErroPersonal[]> {
  await ready();
  const snap = await getDocs(query(col("errosPersonais"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as ErroPersonal);
}

export async function createErroPersonal(
  input: Omit<ErroPersonal, "id" | "criadoEm">,
): Promise<ErroPersonal> {
  await ready();
  const e: ErroPersonal = { ...input, id: uuidv4(), criadoEm: Date.now() };
  await setDoc(docRef("errosPersonais", e.id), clean(e) as DocumentData);
  return e;
}

export async function deleteErroPersonal(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("errosPersonais", id));
}

// ───── Banco de Experiências STAR ────────────────────────────

export async function listExperienciasSTAR(): Promise<ExperienciaSTAR[]> {
  await ready();
  const snap = await getDocs(query(col("experienciasSTAR"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as ExperienciaSTAR);
}

export async function createExperienciaSTAR(
  input: Omit<ExperienciaSTAR, "id" | "criadoEm">,
): Promise<ExperienciaSTAR> {
  await ready();
  const e: ExperienciaSTAR = { ...input, id: uuidv4(), criadoEm: Date.now() };
  await setDoc(docRef("experienciasSTAR", e.id), clean(e) as DocumentData);
  return e;
}

export async function updateExperienciaSTAR(id: string, updates: Partial<ExperienciaSTAR>): Promise<void> {
  await ready();
  await setDoc(docRef("experienciasSTAR", id), clean(updates), { merge: true });
}

export async function deleteExperienciaSTAR(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("experienciasSTAR", id));
}

// ───── System Design ─────────────────────────────────────────

export async function listSystemDesigns(): Promise<SystemDesignSession[]> {
  await ready();
  const snap = await getDocs(query(col("systemDesigns"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as SystemDesignSession);
}

export async function createSystemDesign(
  input: Omit<SystemDesignSession, "id" | "criadoEm">,
): Promise<SystemDesignSession> {
  await ready();
  const s: SystemDesignSession = { ...input, id: uuidv4(), criadoEm: Date.now() };
  await setDoc(docRef("systemDesigns", s.id), clean(s) as DocumentData);
  return s;
}

export async function updateSystemDesign(id: string, updates: Partial<SystemDesignSession>): Promise<void> {
  await ready();
  await setDoc(docRef("systemDesigns", id), clean(updates), { merge: true });
}

export async function deleteSystemDesign(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("systemDesigns", id));
}

// ───── Mock Interview ────────────────────────────────────────

export async function listMockInterviews(): Promise<MockInterviewSession[]> {
  await ready();
  const snap = await getDocs(query(col("mockInterviews"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as MockInterviewSession);
}

export async function createMockInterview(
  input: Omit<MockInterviewSession, "id" | "criadoEm">,
): Promise<MockInterviewSession> {
  await ready();
  const s: MockInterviewSession = { ...input, id: uuidv4(), criadoEm: Date.now() };
  await setDoc(docRef("mockInterviews", s.id), clean(s) as DocumentData);
  return s;
}

export async function updateMockInterview(id: string, updates: Partial<MockInterviewSession>): Promise<void> {
  await ready();
  await setDoc(docRef("mockInterviews", id), clean(updates), { merge: true });
}

export async function deleteMockInterview(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("mockInterviews", id));
}

// ───── RFC Writing ───────────────────────────────────────────

export async function listRFCSessions(): Promise<RFCSession[]> {
  await ready();
  const snap = await getDocs(query(col("rfcSessions"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as RFCSession);
}

export async function createRFCSession(
  input: Omit<RFCSession, "id" | "criadoEm">,
): Promise<RFCSession> {
  await ready();
  const r: RFCSession = { ...input, id: uuidv4(), criadoEm: Date.now() };
  await setDoc(docRef("rfcSessions", r.id), clean(r) as DocumentData);
  return r;
}

export async function updateRFCSession(id: string, updates: Partial<RFCSession>): Promise<void> {
  await ready();
  await setDoc(docRef("rfcSessions", id), clean(updates), { merge: true });
}

export async function deleteRFCSession(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("rfcSessions", id));
}

// ───── War Game ───────────────────────────────────────────────

export async function listWarGames(): Promise<WarGameSession[]> {
  await ready();
  const snap = await getDocs(query(col("warGames"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as WarGameSession);
}

export async function createWarGame(
  input: Omit<WarGameSession, "id" | "criadoEm">,
): Promise<WarGameSession> {
  await ready();
  const w: WarGameSession = { ...input, id: uuidv4(), criadoEm: Date.now() };
  await setDoc(docRef("warGames", w.id), clean(w) as DocumentData);
  return w;
}

export async function deleteWarGame(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("warGames", id));
}

// ───── Revisor de Código ─────────────────────────────────────

export async function listRevisoesCodigo(): Promise<RevisorSession[]> {
  await ready();
  const snap = await getDocs(query(col("revisoesCodigo"), orderBy("criadoEm", "desc")));
  return snap.docs.map((d) => d.data() as RevisorSession);
}

export async function createRevisorSession(
  input: Omit<RevisorSession, "id" | "criadoEm">,
): Promise<RevisorSession> {
  await ready();
  const r: RevisorSession = { ...input, id: uuidv4(), criadoEm: Date.now() };
  await setDoc(docRef("revisoesCodigo", r.id), clean(r) as DocumentData);
  return r;
}

export async function updateRevisorSession(id: string, updates: Partial<RevisorSession>): Promise<void> {
  await ready();
  await setDoc(docRef("revisoesCodigo", id), clean(updates), { merge: true });
}

export async function deleteRevisorSession(id: string): Promise<void> {
  await ready();
  await deleteDoc(docRef("revisoesCodigo", id));
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
