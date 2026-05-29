import type { LearningField } from "../../data/nexusRegistry";
import { computeLfErrorHeatmap } from "../math/learningAnalytics";
import type { LeitnerCardState } from "./leitnerEngine";
import { CURRICULUM_BY_LF } from "./learningRegistry";

export const BLITZ_QUESTION_COUNT = 10;
export const EXAM_SESSION_MS = 20 * 60 * 1000;

export function pickWeakestLf(
  leitner: Readonly<Record<string, LeitnerCardState>>,
  learningCorrectByLf: Readonly<Partial<Record<LearningField, string[]>>>,
): number {
  const heat = computeLfErrorHeatmap(leitner);
  const sorted = [...heat].sort((a, b) => b.strain - a.strain);
  return sorted[0]?.lf ?? 1;
}

export function buildBlitzQueue(lf: number, count = BLITZ_QUESTION_COUNT): string[] {
  const key = `LF${lf}` as LearningField;
  const bag = [...(CURRICULUM_BY_LF[key] ?? [])];
  if (bag.length === 0) return [];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  const take = Math.min(count, bag.length);
  return bag.slice(0, take).map((e) => e.id);
}

export const STREAK_MILESTONES = [3, 7, 14, 30] as const;

export function streakMilestoneFor(value: number): number | null {
  return STREAK_MILESTONES.includes(value as (typeof STREAK_MILESTONES)[number]) ? value : null;
}
