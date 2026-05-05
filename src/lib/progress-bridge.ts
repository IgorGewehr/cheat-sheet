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

// ─── Lookup: (areaId, nodeId) → cardSlugs[] ──────────────────────────────────

const NODE_TO_CARDS: Map<string, string[]> = new Map(); // key = `${areaId}:${nodeId}`

for (const area of SKILL_AREAS) {
  for (const node of area.nodes) {
    const slugs = [
      ...(node.cardSlugs ?? []),
      ...(node.cardSlug && !node.cardSlugs?.includes(node.cardSlug) ? [node.cardSlug] : []),
    ];
    if (slugs.length === 0) continue;
    NODE_TO_CARDS.set(`${area.id}:${node.id}`, slugs);
    for (const slug of slugs) {
      const list = CARD_TO_NODES.get(slug) ?? [];
      if (!list.some((r) => r.areaId === area.id && r.nodeId === node.id)) {
        list.push({ areaId: area.id, nodeId: node.id });
      }
      CARD_TO_NODES.set(slug, list);
    }
  }
}

export function getCardSlugsForNode(areaId: string, nodeId: string): string[] {
  return NODE_TO_CARDS.get(`${areaId}:${nodeId}`) ?? [];
}

/** @deprecated use getCardSlugsForNode */
export function getCardSlugForNode(areaId: string, nodeId: string): string | undefined {
  return getCardSlugsForNode(areaId, nodeId)[0];
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
 * Sincroniza o estado dominado em TODOS os cards vinculados ao node.
 */
export async function syncNodeToTrilha(
  areaId: string,
  nodeId: string,
  level: PersistedLevel | null,
): Promise<void> {
  const slugs = getCardSlugsForNode(areaId, nodeId);
  if (slugs.length === 0) return;
  const dominado = level === "mastered";
  await Promise.all(
    slugs.map((slug) => rawWriteTrilhaCard(slug, dominado).catch(() => {})),
  );
}

// ─── Sync: Trilha → Skill Tracker ────────────────────────────────────────────

/**
 * Chamado por saveTrilhaProgresso() após escrever no trilhaProgresso.
 * Para nodes com múltiplos cards: marca mastered só quando TODOS estão dominados.
 * Para nodes com card único: comportamento anterior (1:1 sync).
 */
export async function syncTrilhaToNodes(
  cardSlug: string,
  dominado: boolean,
): Promise<void> {
  const nodes = getNodesForCard(cardSlug);
  if (nodes.length === 0) return;

  await Promise.all(
    nodes.map(async ({ areaId, nodeId }) => {
      const allSlugs = getCardSlugsForNode(areaId, nodeId);

      if (allSlugs.length <= 1) {
        // Comportamento anterior — sync direto 1:1
        const level: PersistedLevel | null = dominado ? "mastered" : null;
        return rawWriteSkillNode(areaId, nodeId, level).catch(() => {});
      }

      // Node com múltiplos cards — verifica se TODOS estão dominados
      const { db } = getFirebase();
      const wid = getWorkspaceId();
      const checks = await Promise.all(
        allSlugs.map(async (slug) => {
          if (slug === cardSlug) return dominado;
          const ref = doc(db, "workspaces", wid, "trilhaProgresso", slug);
          const snap = await getDoc(ref);
          return snap.exists() ? !!(snap.data() as TrilhaProgresso).dominado : false;
        }),
      );

      const allDone = checks.every(Boolean);
      const anyDone = checks.some(Boolean);
      const level: PersistedLevel | null = allDone ? "mastered" : anyDone ? "learning" : null;
      return rawWriteSkillNode(areaId, nodeId, level).catch(() => {});
    }),
  );
}
