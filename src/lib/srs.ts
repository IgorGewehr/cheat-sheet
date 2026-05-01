// Half-Life Regression (HLR) — inspired by Duolingo paper
// Reference: Settles & Meeder (2016) "A Trainable Spaced Repetition Model for Language Learning"
//
// Core idea: each decision has a "half-life" h (in days).
// After h days, probability of recall drops to 0.5.
// We use revisit outcomes to update h over time.

import type { Decisao } from "./types";

// Base half-life: 30 days — configurable constant
export const BASE_HALF_LIFE = 30;

export type DecisaoUrgencia = "calmo" | "proximo" | "atrasado";

export interface NextReviewResult {
  dias: number;
  urgencia: DecisaoUrgencia;
}

/**
 * Compute half-life for a decisao based on its revisit history.
 * - Each "ainda-faria" multiplies h by 1.5 (reinforces memory)
 * - Each "mudaria" resets h to base (decision changed — need to re-anchor)
 * - Each "depende" is neutral (no change)
 * Returns h in days.
 */
export function computeHalfLife(decisao: Decisao): number {
  const revisitas = decisao.revisitas ?? [];

  let h = BASE_HALF_LIFE;

  // Process revisits chronologically (oldest first)
  const sorted = [...revisitas].sort((a, b) => a.data - b.data);

  for (const r of sorted) {
    if (r.resposta === "ainda-faria") {
      // Reinforcement: extend half-life by 50%
      h = h * 1.5;
    } else if (r.resposta === "mudaria") {
      // Reset: decision changed, reset to base
      h = BASE_HALF_LIFE;
    }
    // "depende" = neutral, h stays the same
  }

  // Cap max half-life at 365 days (1 year max interval)
  return Math.min(h, 365);
}

/**
 * Compute next review date and urgency for a decisao.
 * - Returns dias = days until next review (negative = overdue)
 * - urgencia: "atrasado" if 2*h overdue, "proximo" if within 7 days, "calmo" otherwise
 */
export function computeNextReview(decisao: Decisao): NextReviewResult {
  const h = computeHalfLife(decisao);
  const revisitas = decisao.revisitas ?? [];

  // Last activity: last revisit or the original decision date
  const lastActivity = revisitas.length > 0
    ? Math.max(...revisitas.map((r) => r.data))
    : decisao.data;

  const nowMs = Date.now();
  const daysSinceActivity = (nowMs - lastActivity) / (1000 * 60 * 60 * 24);

  // Days until next review (negative = already past)
  const diasAtePróxima = h - daysSinceActivity;
  const dias = Math.round(diasAtePróxima);

  // Urgency thresholds:
  // - "atrasado": more than 2*h days since last activity (severely overdue)
  // - "proximo": within 7 days of review window
  // - "calmo": plenty of time remaining
  let urgencia: DecisaoUrgencia;
  if (daysSinceActivity > 2 * h) {
    urgencia = "atrasado";
  } else if (diasAtePróxima <= 7) {
    urgencia = "proximo";
  } else {
    urgencia = "calmo";
  }

  return { dias, urgencia };
}

/**
 * Compute skill decay penalty for a decisao.
 * Returns a penalty factor (0 to -30%) as a negative number between -0.30 and 0.
 * - >30 days inactive: -10%
 * - >60 days inactive: -20%
 * - >2*h days inactive (overdue): -30%
 */
export function computeDecay(decisao: Decisao): number {
  const h = computeHalfLife(decisao);
  const revisitas = decisao.revisitas ?? [];

  const lastActivity = revisitas.length > 0
    ? Math.max(...revisitas.map((r) => r.data))
    : decisao.data;

  const nowMs = Date.now();
  const daysSince = (nowMs - lastActivity) / (1000 * 60 * 60 * 24);

  // Tiered decay penalties
  if (daysSince > 2 * h) return -0.30; // severely stale
  if (daysSince > 60)     return -0.20; // moderately stale
  if (daysSince > 30)     return -0.10; // slightly stale
  return 0;
}

export type QuestionType = "trade-off" | "alternativa" | "ainda-faria";

/**
 * Pick the best question type for a given decisao based on its history.
 * - New decisions (no revisits): "ainda-faria" (anchor the decision)
 * - Recent "mudaria" revisits: "alternativa" (explore alternatives)
 * - Otherwise: "trade-off" (probe the reasoning)
 */
export function pickQuestionFor(decisao: Decisao): { tipo: QuestionType } {
  const revisitas = decisao.revisitas ?? [];

  if (revisitas.length === 0) {
    // No revisits yet — start with the simplest: "would you still do this?"
    return { tipo: "ainda-faria" };
  }

  // Check most recent revisita
  const last = [...revisitas].sort((a, b) => b.data - a.data)[0];

  if (last.resposta === "mudaria") {
    // They changed their mind — explore alternatives
    return { tipo: "alternativa" };
  }

  if (last.resposta === "ainda-faria" && revisitas.length >= 2) {
    // Confident so far — probe the trade-offs more deeply
    return { tipo: "trade-off" };
  }

  return { tipo: "ainda-faria" };
}
