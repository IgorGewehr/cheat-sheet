"use client";

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { getFirebase, ensureSignedIn } from "./firebase";
import type {
  Squad,
  SquadMember,
  SquadPresence,
  SquadConstraint,
  SquadActivityEvent,
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clean<T extends object>(obj: T): Record<string, any> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const AVATAR_COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#d97706",
  "#dc2626", "#0891b2", "#c026d3", "#65a30d",
];

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// ── Create & Join ─────────────────────────────────────────────

export async function createSquad(params: {
  name: string;
  description?: string;
  ownerDisplayName: string;
  workspaceId: string;
  ownerId: string;
}): Promise<Squad> {
  await ensureSignedIn();
  const { db } = getFirebase();

  const squadId = uuidv4();
  const inviteCode = generateInviteCode();

  const squad: Squad = {
    id: squadId,
    name: params.name,
    description: params.description,
    ownerId: params.ownerId,
    ownerDisplayName: params.ownerDisplayName,
    workspaceId: params.workspaceId,
    inviteCode,
    createdAt: Date.now(),
  };

  const member: SquadMember = {
    userId: params.ownerId,
    displayName: params.ownerDisplayName,
    role: "owner",
    joinedAt: Date.now(),
    avatarColor: randomAvatarColor(),
  };

  await Promise.all([
    setDoc(doc(db, "squads", squadId), clean(squad) as DocumentData),
    setDoc(doc(db, "squads", squadId, "members", params.ownerId), clean(member) as DocumentData),
    setDoc(doc(db, "squadInvites", inviteCode), {
      squadId,
      squadName: params.name,
      ownerDisplayName: params.ownerDisplayName,
      createdAt: Date.now(),
    } as DocumentData),
    setDoc(doc(db, "squadPublic", squadId), {
      id: squadId,
      name: params.name,
      description: params.description ?? "",
      constraints: [],
      memberCount: 1,
      updatedAt: Date.now(),
    } as DocumentData),
  ]);

  if (typeof window !== "undefined") {
    localStorage.setItem("brain.squadId", squadId);
  }

  return squad;
}

export async function lookupInviteCode(inviteCode: string): Promise<{
  squadId: string;
  squadName: string;
  ownerDisplayName: string;
} | null> {
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, "squadInvites", inviteCode.toUpperCase().trim()));
  if (!snap.exists()) return null;
  return snap.data() as { squadId: string; squadName: string; ownerDisplayName: string };
}

export async function joinSquad(params: {
  squadId: string;
  userId: string;
  displayName: string;
}): Promise<void> {
  await ensureSignedIn();
  const { db } = getFirebase();

  const squadSnap = await getDoc(doc(db, "squads", params.squadId));
  if (!squadSnap.exists()) throw new Error("Squad não encontrado.");
  const squad = squadSnap.data() as Squad;

  const member: SquadMember = {
    userId: params.userId,
    displayName: params.displayName,
    role: "editor",
    joinedAt: Date.now(),
    avatarColor: randomAvatarColor(),
  };

  await setDoc(
    doc(db, "squads", params.squadId, "members", params.userId),
    clean(member) as DocumentData,
  );

  if (typeof window !== "undefined") {
    localStorage.setItem("brain.squadId", params.squadId);
    const { setWorkspaceId } = await import("./workspace");
    setWorkspaceId(squad.workspaceId, true);
  }
}

export async function leaveSquad(squadId: string, userId: string): Promise<void> {
  await ensureSignedIn();
  const { db } = getFirebase();
  await Promise.all([
    deleteDoc(doc(db, "squads", squadId, "members", userId)),
    deleteDoc(doc(db, "squads", squadId, "presence", userId)),
  ]);
  if (typeof window !== "undefined") {
    localStorage.removeItem("brain.squadId");
  }
}

// ── Squad reads ───────────────────────────────────────────────

export async function getSquad(squadId: string): Promise<Squad | null> {
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, "squads", squadId));
  return snap.exists() ? (snap.data() as Squad) : null;
}

// ── Real-time subscriptions ───────────────────────────────────

export function subscribeSquadMembers(
  squadId: string,
  callback: (members: SquadMember[]) => void,
): Unsubscribe {
  const { db } = getFirebase();
  return onSnapshot(collection(db, "squads", squadId, "members"), (snap) => {
    callback(snap.docs.map((d) => d.data() as SquadMember));
  });
}

export function subscribeSquadPresence(
  squadId: string,
  callback: (presence: SquadPresence[]) => void,
): Unsubscribe {
  const { db } = getFirebase();
  return onSnapshot(collection(db, "squads", squadId, "presence"), (snap) => {
    const now = Date.now();
    const active = snap.docs
      .map((d) => d.data() as SquadPresence)
      .filter((p) => now - p.lastSeen < 5 * 60 * 1000);
    callback(active);
  });
}

export function subscribeSquadActivity(
  squadId: string,
  callback: (events: SquadActivityEvent[]) => void,
): Unsubscribe {
  const { db } = getFirebase();
  const q = query(
    collection(db, "squads", squadId, "activity"),
    orderBy("timestamp", "desc"),
    limit(30),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as SquadActivityEvent));
  });
}

export function subscribeSquadConstraints(
  squadId: string,
  callback: (constraints: SquadConstraint[]) => void,
): Unsubscribe {
  const { db } = getFirebase();
  const q = query(
    collection(db, "squads", squadId, "constraints"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as SquadConstraint));
  });
}

// ── Constraints ───────────────────────────────────────────────

export async function addSquadConstraint(
  squadId: string,
  input: Omit<SquadConstraint, "id" | "createdAt" | "active">,
): Promise<SquadConstraint> {
  await ensureSignedIn();
  const { db } = getFirebase();

  const constraint: SquadConstraint = {
    ...input,
    id: uuidv4(),
    createdAt: Date.now(),
    active: true,
  };

  await setDoc(
    doc(db, "squads", squadId, "constraints", constraint.id),
    clean(constraint) as DocumentData,
  );

  await syncSquadPublic(squadId);
  return constraint;
}

export async function deleteSquadConstraint(
  squadId: string,
  constraintId: string,
): Promise<void> {
  await ensureSignedIn();
  const { db } = getFirebase();
  await deleteDoc(doc(db, "squads", squadId, "constraints", constraintId));
  await syncSquadPublic(squadId);
}

// ── Presence ──────────────────────────────────────────────────

export async function updateSquadPresence(
  squadId: string,
  userId: string,
  data: Omit<SquadPresence, "userId">,
): Promise<void> {
  const { db } = getFirebase();
  await setDoc(
    doc(db, "squads", squadId, "presence", userId),
    clean({ userId, ...data }) as DocumentData,
  );
}

export async function clearSquadPresence(squadId: string, userId: string): Promise<void> {
  const { db } = getFirebase();
  await deleteDoc(doc(db, "squads", squadId, "presence", userId));
}

// ── Activity ──────────────────────────────────────────────────

export async function logSquadActivity(
  squadId: string,
  event: Omit<SquadActivityEvent, "id" | "timestamp">,
): Promise<void> {
  const { db } = getFirebase();
  const id = uuidv4();
  await setDoc(
    doc(db, "squads", squadId, "activity", id),
    clean({ ...event, id, timestamp: Date.now() }) as DocumentData,
  );
}

// ── Public summary sync (for CLI reads without auth) ──────────

async function syncSquadPublic(squadId: string): Promise<void> {
  const { db } = getFirebase();

  const [squadSnap, constraintsSnap, membersSnap] = await Promise.all([
    getDoc(doc(db, "squads", squadId)),
    getDocs(collection(db, "squads", squadId, "constraints")),
    getDocs(collection(db, "squads", squadId, "members")),
  ]);

  if (!squadSnap.exists()) return;
  const squad = squadSnap.data() as Squad;

  const constraints = constraintsSnap.docs
    .map((d) => d.data() as SquadConstraint)
    .filter((c) => c.active)
    .map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      category: c.category,
      description: c.description,
      examples: c.examples ?? [],
    }));

  await setDoc(
    doc(db, "squadPublic", squadId),
    {
      id: squadId,
      name: squad.name,
      description: squad.description ?? "",
      constraints,
      memberCount: membersSnap.size,
      updatedAt: Date.now(),
    } as DocumentData,
    { merge: true },
  );
}
