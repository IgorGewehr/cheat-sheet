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
import { ensureSignedIn, getFirebase } from "./firebase";
import { getWorkspaceId } from "./workspace";
import type { JobTrackProgress } from "./jobs-types";

function col() {
  const { db } = getFirebase();
  return collection(db, "workspaces", getWorkspaceId(), "jobTrackProgress");
}

function docRef(trackSlug: string) {
  const { db } = getFirebase();
  return doc(db, "workspaces", getWorkspaceId(), "jobTrackProgress", trackSlug);
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

export async function getProgress(
  trackSlug: string,
): Promise<JobTrackProgress | null> {
  await ready();
  const snap = await getDoc(docRef(trackSlug));
  return snap.exists() ? (snap.data() as JobTrackProgress) : null;
}

export async function markMilestone(
  trackSlug: string,
  milestoneId: string,
): Promise<void> {
  await ready();
  const ref = docRef(trackSlug);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, {
      marcosConcluidos: arrayUnion(milestoneId),
      ultimaAtualizacao: Date.now(),
    });
  } else {
    const progress: JobTrackProgress = {
      trackSlug,
      marcosConcluidos: [milestoneId],
      iniciadoEm: Date.now(),
      ultimaAtualizacao: Date.now(),
    };
    await setDoc(ref, clean(progress));
  }
}

export async function unmarkMilestone(
  trackSlug: string,
  milestoneId: string,
): Promise<void> {
  await ready();
  const ref = docRef(trackSlug);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, {
    marcosConcluidos: arrayRemove(milestoneId),
    ultimaAtualizacao: Date.now(),
  });
}

export async function listAllProgress(): Promise<JobTrackProgress[]> {
  await ready();
  const snap = await getDocs(
    query(col(), orderBy("ultimaAtualizacao", "desc")),
  );
  return snap.docs.map((d) => d.data() as JobTrackProgress);
}
