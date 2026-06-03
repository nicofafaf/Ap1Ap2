import type { CiscoPackId } from "../../cisco/types";
import { CCNA1_ITN_17_MODULES, CCNA1_ITN_PACKS } from "../../cisco/ccna1-v7/examCatalog";
import {
  defaultLeitnerState,
  leitnerPickWeight,
  type LeitnerCardState,
} from "../learning/leitnerEngine";

const CISCO_EXERCISE_ID =
  /^(modules-\d+-\d+|practice-final|course-final|system-test|pt-skills-final|pt-skills-practice)-q\d{3}$/;

export function isCiscoExerciseId(id: string): boolean {
  return CISCO_EXERCISE_ID.test(id);
}

export function ciscoPackIdFromExerciseId(id: string): CiscoPackId | null {
  const m = id.match(
    /^(modules-\d+-\d+|practice-final|course-final|system-test|pt-skills-final|pt-skills-practice)/
  );
  return (m?.[1] as CiscoPackId) ?? null;
}

export type CiscoPackProgress = {
  solved: number;
  due: number;
  total: number;
  pct: number;
};

export function ciscoPackProgress(
  leitner: Readonly<Record<string, LeitnerCardState>>,
  packId: CiscoPackId,
  totalItems: number
): CiscoPackProgress {
  const prefix = `${packId}-q`;
  let solved = 0;
  let due = 0;
  const now = Date.now();
  for (const [id, card] of Object.entries(leitner)) {
    if (!id.startsWith(prefix)) continue;
    if (card.repetitions >= 1) solved += 1;
    if (card.nextDueAt <= now || card.box <= 2) due += 1;
  }
  return {
    solved,
    due,
    total: totalItems,
    pct: totalItems > 0 ? Math.round((solved / totalItems) * 100) : 0,
  };
}

export type CiscoModuleWeakness = {
  module: number;
  strain: number;
  packId: CiscoPackId;
};

/** Höchste strain = schwächstes Modul (mehr Leitner-Gewicht). */
export function rankCiscoModuleWeaknesses(
  leitner: Readonly<Record<string, LeitnerCardState>>,
  limit = 3
): CiscoModuleWeakness[] {
  const byModule = new Map<number, { strain: number; packId: CiscoPackId }>();
  const now = Date.now();

  for (const [id, card] of Object.entries(leitner)) {
    if (!isCiscoExerciseId(id)) continue;
    const packId = ciscoPackIdFromExerciseId(id);
    if (!packId) continue;
    const def = CCNA1_ITN_17_MODULES.find((m) => m.packId === packId);
    if (!def) continue;
    const w = leitnerPickWeight(id, leitner, now);
    const cur = byModule.get(def.module) ?? { strain: 0, packId };
    cur.strain += w;
    byModule.set(def.module, cur);
  }

  return [...byModule.entries()]
    .map(([module, { strain, packId }]) => ({ module, strain, packId }))
    .sort((a, b) => b.strain - a.strain)
    .slice(0, limit);
}

export function pickWeakestCiscoModule(
  leitner: Readonly<Record<string, LeitnerCardState>>
): CiscoModuleWeakness | null {
  return rankCiscoModuleWeaknesses(leitner, 1)[0] ?? null;
}

/** Übung-IDs nach Leitner-Schwäche (höchstes Gewicht zuerst). */
export function buildCiscoWeaknessExerciseIds(
  leitner: Readonly<Record<string, LeitnerCardState>>,
  packId?: CiscoPackId,
  count = 24
): string[] {
  const now = Date.now();
  const ids = Object.keys(leitner).filter((id) => {
    if (!isCiscoExerciseId(id)) return false;
    if (packId && ciscoPackIdFromExerciseId(id) !== packId) return false;
    return true;
  });
  if (!ids.length && packId) return [];

  ids.sort(
    (a, b) =>
      leitnerPickWeight(b, leitner, now) - leitnerPickWeight(a, leitner, now)
  );
  return ids.slice(0, count);
}

export const CISCO_EXAM_PACK_IDS: readonly CiscoPackId[] = [
  "practice-final",
  "course-final",
  "system-test",
] as const;

const EXAM_DURATION_MS: Partial<Record<CiscoPackId, number>> = {
  "course-final": 90 * 60 * 1000,
  "practice-final": 60 * 60 * 1000,
  "system-test": 30 * 60 * 1000,
};

const MODULE_PACK_DURATION_MS = 45 * 60 * 1000;

export function getCiscoExamDurationMs(packId: CiscoPackId): number {
  return EXAM_DURATION_MS[packId] ?? MODULE_PACK_DURATION_MS;
}

export function ciscoPackTitle(packId: CiscoPackId, locale: "de" | "en"): string {
  const meta = CCNA1_ITN_PACKS.find((p) => p.id === packId);
  if (!meta) return packId;
  return locale === "de" ? meta.titleDe : meta.titleEn;
}

export function hasCiscoLeitnerData(leitner: Readonly<Record<string, LeitnerCardState>>): boolean {
  return Object.keys(leitner).some(isCiscoExerciseId);
}

/** Fallback wenn noch keine Leitner-Daten: ungeübte IDs aus Pack. */
export function mergeWeaknessQueueWithPack(
  weaknessIds: string[],
  packIds: string[],
  count: number
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of weaknessIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= count) return out;
  }
  for (const id of packIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= count) return out;
  }
  return out;
}

export function defaultStrainForNewLearner(module: number): CiscoModuleWeakness {
  const def = CCNA1_ITN_17_MODULES.find((m) => m.module === module);
  return {
    module,
    strain: 1,
    packId: def?.packId ?? "modules-1-3",
  };
}

export function leitnerCardOrDefault(
  leitner: Readonly<Record<string, LeitnerCardState>>,
  id: string
): LeitnerCardState {
  return leitner[id] ?? defaultLeitnerState();
}
