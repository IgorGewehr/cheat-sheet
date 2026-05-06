"use client";

import { collection, doc, setDoc, getDocs, query, orderBy, type DocumentData } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { ensureSignedIn, getFirebase } from "./firebase";
import { getWorkspaceId } from "./workspace";
import type { ChallengeRun } from "./coding-challenge-types";

function col() {
  const { db } = getFirebase();
  return collection(db, "workspaces", getWorkspaceId(), "codingChallengeRuns");
}

function docRef(id: string) {
  const { db } = getFirebase();
  return doc(db, "workspaces", getWorkspaceId(), "codingChallengeRuns", id);
}

export function newRunId() {
  return uuidv4();
}

export async function saveChallengeRun(run: ChallengeRun): Promise<void> {
  await ensureSignedIn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await setDoc(docRef(run.id), run as unknown as DocumentData);
}

export async function listChallengeRuns(): Promise<ChallengeRun[]> {
  await ensureSignedIn();
  const snap = await getDocs(query(col(), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => d.data() as ChallengeRun);
}
