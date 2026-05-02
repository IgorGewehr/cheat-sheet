"use client";

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  orderBy,
  query,
  type DocumentData,
} from "firebase/firestore";
import { ensureSignedIn, getFirebase } from "./firebase";
import { getWorkspaceId } from "./workspace";
import type { MathQuestRun } from "./math-quest-types";

function col() {
  const { db } = getFirebase();
  return collection(db, "workspaces", getWorkspaceId(), "mathQuestRuns");
}

function docRef(id: string) {
  const { db } = getFirebase();
  return doc(db, "workspaces", getWorkspaceId(), "mathQuestRuns", id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clean<T extends object>(obj: T): Record<string, any> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export async function saveMathQuestRun(run: MathQuestRun): Promise<void> {
  await ensureSignedIn();
  await setDoc(docRef(run.id), clean(run) as DocumentData);
}

export async function listMathQuestRuns(): Promise<MathQuestRun[]> {
  await ensureSignedIn();
  const snap = await getDocs(query(col(), orderBy("iniciadoEm", "desc")));
  return snap.docs.map((d) => d.data() as MathQuestRun);
}

export async function getMathQuestRun(id: string): Promise<MathQuestRun | null> {
  await ensureSignedIn();
  const snap = await getDoc(docRef(id));
  return snap.exists() ? (snap.data() as MathQuestRun) : null;
}
