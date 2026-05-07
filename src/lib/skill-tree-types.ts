export type SkillLevel = "locked" | "available" | "learning" | "mastered";

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  tier: number; // 0 = foundation, higher = more advanced
  prerequisites: string[]; // node ids
  cardSlug?: string; // link to /biblioteca/{slug} — legado, prefer cardSlugs
  cardSlugs?: string[]; // múltiplos cards na biblioteca para este node
  routeHref?: string; // link to internal tool
  tags?: string[];
}

export type SkillAreaId =
  | "matematica"
  | "software"
  | "go-enterprise"
  | "data-science"
  | "ia-llm"
  | "security"
  | "devops"
  | "govtech";

export interface AreaColors {
  primary: string;
  glow: string;
  bgLight: string;
  bgMedium: string;
  text: string;
  textMuted: string;
  border: string;
  borderMastered: string;
}

export interface SkillArea {
  id: SkillAreaId;
  name: string;
  emoji: string;
  colors: AreaColors;
  description: string;
  tierNames: string[];
  nodes: SkillNode[];
}

// Stored in Firestore — only "learning" and "mastered" are persisted
// "locked" and "available" are derived from the prerequisite graph
export type PersistedLevel = "learning" | "mastered";
export type SkillAreaProgress = Record<string, PersistedLevel>;

export interface MasterProgress {
  [areaId: string]: SkillAreaProgress;
}
