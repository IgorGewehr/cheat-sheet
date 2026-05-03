"use client";

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  type DocumentData,
} from "firebase/firestore";
import { ensureSignedIn, getFirebase } from "./firebase";
import { getWorkspaceId } from "./workspace";
import type { SkillAreaProgress, PersistedLevel } from "./skill-tree-types";

function areaRef(areaId: string) {
  const { db } = getFirebase();
  return doc(db, "workspaces", getWorkspaceId(), "skillProgress", areaId);
}

function progressCol() {
  const { db } = getFirebase();
  return collection(db, "workspaces", getWorkspaceId(), "skillProgress");
}

export async function getAreaProgress(areaId: string): Promise<SkillAreaProgress> {
  await ensureSignedIn();
  const snap = await getDoc(areaRef(areaId));
  if (!snap.exists()) return {};
  return (snap.data()?.nodes ?? {}) as SkillAreaProgress;
}

export async function setNodeLevel(
  areaId: string,
  nodeId: string,
  level: PersistedLevel | null, // null = remove (reset to available/locked)
): Promise<void> {
  await ensureSignedIn();
  const ref = areaRef(areaId);
  const snap = await getDoc(ref);
  const current = snap.exists() ? ((snap.data()?.nodes ?? {}) as SkillAreaProgress) : {};

  if (level === null) {
    const { [nodeId]: _removed, ...rest } = current;
    await setDoc(ref, { nodes: rest, updatedAt: Date.now() } as DocumentData);
  } else {
    await setDoc(
      ref,
      { nodes: { ...current, [nodeId]: level }, updatedAt: Date.now() } as DocumentData,
    );
  }
}

export async function getAllProgress(): Promise<Record<string, SkillAreaProgress>> {
  await ensureSignedIn();
  const snap = await getDocs(progressCol());
  const result: Record<string, SkillAreaProgress> = {};
  snap.forEach((d) => {
    result[d.id] = (d.data()?.nodes ?? {}) as SkillAreaProgress;
  });
  return result;
}
