"use client";

import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  type DocumentData,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { ensureSignedIn, getFirebase } from "./firebase";
import { getWorkspaceId } from "./workspace";
import type { Disciplina } from "./matematica-types";
import { SEED_DISCIPLINAS } from "./matematica-seed";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clean<T extends object>(obj: T): Record<string, any> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function col() {
  const { db } = getFirebase();
  return collection(db, "workspaces", getWorkspaceId(), "disciplinasMat");
}

function docRef(id: string) {
  const { db } = getFirebase();
  return doc(db, "workspaces", getWorkspaceId(), "disciplinasMat", id);
}

export async function listDisciplinas(): Promise<Disciplina[]> {
  await ensureSignedIn();
  const snap = await getDocs(query(col(), orderBy("atualizadoEm", "asc")));
  return snap.docs.map((d) => d.data() as Disciplina);
}

export async function upsertDisciplina(d: Disciplina): Promise<void> {
  await ensureSignedIn();
  await setDoc(docRef(d.id), clean(d) as DocumentData);
}

export async function deleteDisciplina(id: string): Promise<void> {
  await ensureSignedIn();
  await deleteDoc(docRef(id));
}

export async function seedDisciplinasIfEmpty(): Promise<void> {
  await ensureSignedIn();
  const snap = await getDocs(col());
  if (!snap.empty) return;

  const { db } = getFirebase();
  const batch = writeBatch(db);
  const now = Date.now();

  for (const seed of SEED_DISCIPLINAS) {
    const id = uuidv4();
    const disciplina: Disciplina = { ...seed, id, atualizadoEm: now };
    batch.set(docRef(id), clean(disciplina) as DocumentData);
  }

  await batch.commit();
}
