import type { LearningRankId } from "../../data/learningRankRegistry";
import { getLearningRankDef, LEARNING_RANKS } from "../../data/learningRankRegistry";
import { resolveLearningRankId } from "./learningRank";

const LP_KEY = "nexus.learningRankLp.v1";
const LAST_RANK_KEY = "nexus.learningRankLastId.v1";

export function loadLearningRankLp(): number {
  try {
    const raw = localStorage.getItem(LP_KEY);
    if (!raw) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveLearningRankLp(lp: number) {
  try {
    localStorage.setItem(LP_KEY, String(Math.max(0, Math.floor(lp))));
  } catch {
    // no-op
  }
}

export function loadLastLearningRankId(): LearningRankId | null {
  try {
    const raw = localStorage.getItem(LAST_RANK_KEY);
    if (!raw) return null;
    if (LEARNING_RANKS.some((r) => r.id === raw)) return raw as LearningRankId;
    return null;
  } catch {
    return null;
  }
}

export function saveLastLearningRankId(rankId: LearningRankId) {
  try {
    localStorage.setItem(LAST_RANK_KEY, rankId);
  } catch {
    // no-op
  }
}

export function applyLearningRankLpDelta(delta: number): number {
  const next = Math.max(0, loadLearningRankLp() + delta);
  saveLearningRankLp(next);
  return next;
}

/** Erkennt Aufstieg; persistiert neuen Rang wenn höher */
export function promoteLearningRankIfHigher(
  lp: number,
  masteryPct: number
): LearningRankId | null {
  const nextId = resolveLearningRankId(lp, masteryPct);
  const prevId = loadLastLearningRankId();
  if (!prevId) {
    saveLastLearningRankId(nextId);
    return null;
  }
  const nextOrder = getLearningRankDef(nextId).order;
  const prevOrder = getLearningRankDef(prevId).order;
  saveLastLearningRankId(nextId);
  if (nextOrder > prevOrder) return nextId;
  return null;
}

/** Erststart: gespeicherten Rang setzen ohne Celebration */
export function syncLastLearningRankWithoutCelebration(
  lp: number,
  masteryPct: number
): void {
  saveLastLearningRankId(resolveLearningRankId(lp, masteryPct));
}
