"use client";

/**
 * Sincronização bidirecional entre:
 *  - skillProgress/{areaId}.nodes  (Skill Tracker)
 *  - trilhaProgresso/{cardSlug}     (Trilha Sênior, Mapa de Domínio)
 *
 * A bridge usa writes diretos no Firestore (sem passar pelas funções de alto
 * nível de db.ts / skill-tree-db.ts) para evitar recursão infinita.
 */

import { doc, getDoc, setDoc, type DocumentData } from "firebase/firestore";
import { getFirebase } from "./firebase";
import { getWorkspaceId } from "./workspace";
import { SKILL_AREAS } from "./skill-trees";
import type { PersistedLevel, SkillAreaProgress } from "./skill-tree-types";
import type { TrilhaProgresso } from "./types";

// ─── Lookup: cardSlug → [(areaId, nodeId)] ───────────────────────────────────

type NodeRef = { areaId: string; nodeId: string };

const CARD_TO_NODES: Map<string, NodeRef[]> = new Map();

for (const area of SKILL_AREAS) {
  for (const node of area.nodes) {
    if (!node.cardSlug) continue;
    const list = CARD_TO_NODES.get(node.cardSlug) ?? [];
    list.push({ areaId: area.id, nodeId: node.id });
    CARD_TO_NODES.set(node.cardSlug, list);
  }
}

// ─── Lookup: (areaId, nodeId) → cardSlug ─────────────────────────────────────

const NODE_TO_CARD: Map<string, string> = new Map(); // key = `${areaId}:${nodeId}`

for (const area of SKILL_AREAS) {
  for (const node of area.nodes) {
    if (node.cardSlug) {
      NODE_TO_CARD.set(`${area.id}:${node.id}`, node.cardSlug);
    }
  }
}

export function getCardSlugForNode(areaId: string, nodeId: string): string | undefined {
  return NODE_TO_CARD.get(`${areaId}:${nodeId}`);
}

export function getNodesForCard(cardSlug: string): NodeRef[] {
  return CARD_TO_NODES.get(cardSlug) ?? [];
}

// ─── Low-level writes (não disparam o sync, evitam recursão) ─────────────────

async function rawWriteSkillNode(
  areaId: string,
  nodeId: string,
  level: PersistedLevel | null,
): Promise<void> {
  const { db } = getFirebase();
  const ref = doc(db, "workspaces", getWorkspaceId(), "skillProgress", areaId);
  const snap = await getDoc(ref);
  const current = snap.exists() ? ((snap.data()?.nodes ?? {}) as SkillAreaProgress) : {};

  if (level === null) {
    const { [nodeId]: _r, ...rest } = current;
    await setDoc(ref, { nodes: rest, updatedAt: Date.now() } as DocumentData);
  } else {
    await setDoc(ref, { nodes: { ...current, [nodeId]: level }, updatedAt: Date.now() } as DocumentData);
  }
}

async function rawWriteTrilhaCard(
  cardSlug: string,
  dominado: boolean,
): Promise<void> {
  const { db } = getFirebase();
  const ref = doc(db, "workspaces", getWorkspaceId(), "trilhaProgresso", cardSlug);
  const snap = await getDoc(ref);
  const current: TrilhaProgresso = snap.exists()
    ? (snap.data() as TrilhaProgresso)
    : { cardSlug, dominado: false, tentativas: 0, melhorScore: 0 };
  await setDoc(ref, { ...current, dominado, cardSlug } as DocumentData);
}

// ─── Sync: Skill Tracker → Trilha ────────────────────────────────────────────

/**
 * Chamado por setNodeLevel() após escrever no skillProgress.
 * Se o node tem cardSlug, sincroniza o estado dominado no trilhaProgresso.
 */
export async function syncNodeToTrilha(
  areaId: string,
  nodeId: string,
  level: PersistedLevel | null,
): Promise<void> {
  const cardSlug = getCardSlugForNode(areaId, nodeId);
  if (!cardSlug) return;
  const dominado = level === "mastered";
  try {
    await rawWriteTrilhaCard(cardSlug, dominado);
  } catch {
    // Silencia erros de sync — não bloqueia a ação principal
  }
}

// ─── Sync: Trilha → Skill Tracker ────────────────────────────────────────────

/**
 * Chamado por saveTrilhaProgresso() após escrever no trilhaProgresso.
 * Marca os skill nodes correspondentes como mastered (ou os remove).
 */
export async function syncTrilhaToNodes(
  cardSlug: string,
  dominado: boolean,
): Promise<void> {
  const nodes = getNodesForCard(cardSlug);
  if (nodes.length === 0) return;

  const level: PersistedLevel | null = dominado ? "mastered" : null;

  await Promise.all(
    nodes.map(({ areaId, nodeId }) =>
      rawWriteSkillNode(areaId, nodeId, level).catch(() => {
        // Silencia erros de sync por node individual
      }),
    ),
  );
}
