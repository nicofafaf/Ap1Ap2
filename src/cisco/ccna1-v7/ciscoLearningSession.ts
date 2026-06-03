import type { LearningExercise } from "../../lib/learning/learningExerciseTypes";
import { ciscoQuestionToLearningExercise } from "./ciscoToLearningExercise";
import { getCiscoPack, getQuizItemsForPack } from "./loadPacks";
import type { CiscoPackId } from "../types";

/** LF10 als Carrier-Sektor für Cisco-Quiz (kein AP1-Inhalt überschrieben) */
export const CISCO_CARRIER_LF = 10;

export function buildCiscoMcQueue(packId: CiscoPackId, shuffle = true): string[] {
  const ids = getMcItemsForPack(packId).map((q) => q.id);
  if (!shuffle) return ids;
  const copy = [...ids];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getCiscoLearningExerciseById(exerciseId: string): LearningExercise | null {
  const packPrefix = exerciseId.split("-q")[0] as CiscoPackId;
  const pack = getCiscoPack(packPrefix);
  if (!pack) return null;
  const q = pack.items.find((i) => i.id === exerciseId);
  if (!q) return null;
  return ciscoQuestionToLearningExercise(q);
}

export function getCiscoPackMcCount(packId: CiscoPackId): number {
  return getQuizItemsForPack(packId).length;
}
