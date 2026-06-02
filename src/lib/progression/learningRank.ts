import type { LearningField } from "../../data/nexusRegistry";
import {
  getLearningRankDef,
  LEARNING_RANKS,
  type LearningRankDefinition,
  type LearningRankId,
} from "../../data/learningRankRegistry";
import { getLfExerciseTotal, getPlatformExerciseTotal } from "../learning/lfExerciseTotals";

export type LearningRankSnapshot = {
  rankId: LearningRankId;
  rank: LearningRankDefinition;
  lp: number;
  masteryPct: number;
  solved: number;
  total: number;
  nextRank: LearningRankDefinition | null;
  lpToNext: number;
  masteryToNextPct: number;
  progressToNext: number;
};

export const RANKED_LP_CORRECT = 12;
export const RANKED_LP_WRONG = 4;
export const RANKED_LP_MULTIPLIER = 1.5;
export const RANKED_SPRINT_SIZE = 15;

export function countSolvedExercises(
  learningCorrectByLf: Readonly<Partial<Record<LearningField, string[]>>>
): { solved: number; total: number; masteryPct: number } {
  const total = getPlatformExerciseTotal();
  let solved = 0;
  for (let n = 1; n <= 12; n += 1) {
    solved += new Set(learningCorrectByLf[`LF${n}` as LearningField] ?? []).size;
  }
  const masteryPct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;
  return { solved, total, masteryPct };
}

function tierIndexFromLp(lp: number): number {
  let idx = 0;
  for (let i = 0; i < LEARNING_RANKS.length; i += 1) {
    if (lp >= LEARNING_RANKS[i].minLp) idx = i;
  }
  return idx;
}

function tierIndexFromMastery(pct: number): number {
  let idx = 0;
  for (let i = 0; i < LEARNING_RANKS.length; i += 1) {
    if (pct >= LEARNING_RANKS[i].minMasteryPct) idx = i;
  }
  return idx;
}

export function resolveLearningRankId(lp: number, masteryPct: number): LearningRankId {
  const idx = Math.max(tierIndexFromLp(lp), tierIndexFromMastery(masteryPct));
  return LEARNING_RANKS[Math.min(idx, LEARNING_RANKS.length - 1)].id;
}

export function buildLearningRankSnapshot(
  lp: number,
  learningCorrectByLf: Readonly<Partial<Record<LearningField, string[]>>>
): LearningRankSnapshot {
  const { solved, total, masteryPct } = countSolvedExercises(learningCorrectByLf);
  const rankId = resolveLearningRankId(lp, masteryPct);
  const rank = getLearningRankDef(rankId);
  const nextRank = LEARNING_RANKS[rank.order + 1] ?? null;

  let lpToNext = 0;
  let masteryToNextPct = 0;
  let progressToNext = 1;
  if (nextRank) {
    lpToNext = Math.max(0, nextRank.minLp - lp);
    masteryToNextPct = Math.max(0, nextRank.minMasteryPct - masteryPct);
    const lpSpan = Math.max(1, nextRank.minLp - rank.minLp);
    const mastSpan = Math.max(1, nextRank.minMasteryPct - rank.minMasteryPct);
    const lpProg = Math.min(1, (lp - rank.minLp) / lpSpan);
    const mastProg = Math.min(1, (masteryPct - rank.minMasteryPct) / mastSpan);
    progressToNext = Math.round(Math.min(lpProg, mastProg) * 100);
  }

  return {
    rankId,
    rank,
    lp,
    masteryPct,
    solved,
    total,
    nextRank,
    lpToNext,
    masteryToNextPct,
    progressToNext,
  };
}

export function rankLpDelta(wasCorrect: boolean, rankedRun: boolean): number {
  const base = wasCorrect ? RANKED_LP_CORRECT : -RANKED_LP_WRONG;
  const scaled = rankedRun ? Math.round(base * RANKED_LP_MULTIPLIER) : base;
  return wasCorrect ? scaled : scaled;
}
