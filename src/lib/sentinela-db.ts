"use client";

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { ensureSignedIn, getFirebase } from "./firebase";
import { getWorkspaceId } from "./workspace";
import type { SentinelaSession } from "./sentinela-types";

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
  return collection(db, "workspaces", getWorkspaceId(), "sentinelaSessions");
}

function docRef(id: string) {
  const { db } = getFirebase();
  return doc(db, "workspaces", getWorkspaceId(), "sentinelaSessions", id);
}

export async function saveSentinelaSession(
  input: Omit<SentinelaSession, "id" | "criadoEm">,
): Promise<SentinelaSession> {
  await ensureSignedIn();
  const session: SentinelaSession = {
    ...input,
    id: uuidv4(),
    criadoEm: Date.now(),
  };
  await setDoc(docRef(session.id), clean(session));
  return session;
}

export async function listSentinelaSessions(max = 20): Promise<SentinelaSession[]> {
  await ensureSignedIn();
  const snap = await getDocs(
    query(col(), orderBy("criadoEm", "desc"), limit(max)),
  );
  return snap.docs.map((d) => d.data() as SentinelaSession);
}

export async function getSentinelaSession(id: string): Promise<SentinelaSession | null> {
  await ensureSignedIn();
  const snap = await getDoc(docRef(id));
  return snap.exists() ? (snap.data() as SentinelaSession) : null;
}

export async function updateSentinelaDecisao(
  id: string,
  decisao: SentinelaSession["decisaoFinal"],
  reflexao?: string,
): Promise<void> {
  await ensureSignedIn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = { decisaoFinal: decisao };
  if (reflexao !== undefined) update.reflexao = reflexao;
  await updateDoc(docRef(id), update);
}
