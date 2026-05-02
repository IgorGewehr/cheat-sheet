"use client";

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { ensureSignedIn, getFirebase } from "./firebase";
import { getWorkspaceId } from "./workspace";
import type { AwakeningSession, AwakeningTrack, EntryTrailProgress } from "./awakening-types";

function col(name: "awakeningSessions" | "entryTrailProgress") {
  const { db } = getFirebase();
  return collection(db, "workspaces", getWorkspaceId(), name);
}

function docRef(name: "awakeningSessions" | "entryTrailProgress", id: string) {
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

export async function saveAwakeningSession(
  input: Omit<AwakeningSession, "id" | "criadoEm">,
): Promise<AwakeningSession> {
  await ready();
  const session: AwakeningSession = {
    ...input,
    id: uuidv4(),
    criadoEm: Date.now(),
  };
  await setDoc(docRef("awakeningSessions", session.id), clean(session));
  return session;
}

export async function listAwakeningSessions(): Promise<AwakeningSession[]> {
  await ready();
  const snap = await getDocs(
    query(col("awakeningSessions"), orderBy("criadoEm", "desc")),
  );
  return snap.docs.map((d) => d.data() as AwakeningSession);
}

export async function getEntryTrailProgress(
  track: AwakeningTrack,
): Promise<EntryTrailProgress | null> {
  await ready();
  const snap = await getDoc(docRef("entryTrailProgress", track));
  return snap.exists() ? (snap.data() as EntryTrailProgress) : null;
}

export async function markEntryTrailStep(
  track: AwakeningTrack,
  stepId: string,
): Promise<void> {
  await ready();
  const ref = docRef("entryTrailProgress", track);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, {
      etapasCompletas: arrayUnion(stepId),
      ultimaAtualizacao: Date.now(),
    });
  } else {
    const progress: EntryTrailProgress = {
      id: track,
      track,
      etapasCompletas: [stepId],
      iniciadoEm: Date.now(),
      ultimaAtualizacao: Date.now(),
    };
    await setDoc(ref, clean(progress));
  }
}

export async function unmarkEntryTrailStep(
  track: AwakeningTrack,
  stepId: string,
): Promise<void> {
  await ready();
  const ref = docRef("entryTrailProgress", track);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, {
    etapasCompletas: arrayRemove(stepId),
    ultimaAtualizacao: Date.now(),
  });
}
