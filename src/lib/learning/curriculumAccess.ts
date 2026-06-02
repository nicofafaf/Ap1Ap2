import type { LearningField } from "../../data/nexusRegistry";
import type { LearningExercise } from "./learningExerciseTypes";

export type CurriculumCache = {
  CURRICULUM_BY_LF: Record<LearningField, LearningExercise[]>;
  GRUNDLAGE_EXERCISES_BY_LF: Record<LearningField, LearningExercise[]>;
  VERTIEFUNG_EXERCISES_BY_LF: Record<LearningField, LearningExercise[]>;
  BEGINNER_EXERCISES_BY_LF: Record<LearningField, LearningExercise[]>;
  EXAM_PATH_EXERCISES_BY_LF: Record<LearningField, LearningExercise[]>;
  BEGINNER_EXERCISE_IDS_BY_LF: Record<LearningField, Set<string>>;
  EXAM_EXERCISE_IDS_BY_LF: Record<LearningField, Set<string>>;
};

let cache: CurriculumCache | null = null;
let loadPromise: Promise<CurriculumCache> | null = null;
let bundleMod: typeof import("./curriculumBundle") | null = null;

async function loadBundle(): Promise<CurriculumCache> {
  bundleMod = await import("./curriculumBundle");
  const m = bundleMod;
  return {
    CURRICULUM_BY_LF: m.CURRICULUM_BY_LF,
    GRUNDLAGE_EXERCISES_BY_LF: m.GRUNDLAGE_EXERCISES_BY_LF,
    VERTIEFUNG_EXERCISES_BY_LF: m.VERTIEFUNG_EXERCISES_BY_LF,
    BEGINNER_EXERCISES_BY_LF: m.BEGINNER_EXERCISES_BY_LF,
    EXAM_PATH_EXERCISES_BY_LF: m.EXAM_PATH_EXERCISES_BY_LF,
    BEGINNER_EXERCISE_IDS_BY_LF: m.BEGINNER_EXERCISE_IDS_BY_LF,
    EXAM_EXERCISE_IDS_BY_LF: m.EXAM_EXERCISE_IDS_BY_LF,
  };
}

export function resolveTerminalBossMode(
  lf: import("../../data/nexusRegistry").LearningField,
  exerciseId: string | undefined
): { isBoss: boolean; epicLine: string | null } {
  if (!bundleMod) return { isBoss: false, epicLine: null };
  return bundleMod.resolveTerminalBossMode(lf, exerciseId);
}

/** Lädt Curriculum + Drills in eigenen Chunk — idempotent */
export async function ensureCurriculumLoaded(): Promise<void> {
  if (cache) return;
  if (!loadPromise) {
    loadPromise = loadBundle().then((c) => {
      cache = c;
      return c;
    });
  }
  await loadPromise;
}

function requireCache(): CurriculumCache {
  if (!cache) {
    throw new Error(
      "Curriculum noch nicht geladen — ensureCurriculumLoaded() vor Zugriff aufrufen"
    );
  }
  return cache;
}

export function isCurriculumLoaded(): boolean {
  return cache !== null;
}

export function getCurriculumByLf(lf: LearningField): LearningExercise[] {
  return requireCache().CURRICULUM_BY_LF[lf] ?? [];
}

export function getCurriculumRecord(): Record<LearningField, LearningExercise[]> {
  return requireCache().CURRICULUM_BY_LF;
}

export function getGrundlageExercisesByLf(lf: LearningField): LearningExercise[] {
  return requireCache().GRUNDLAGE_EXERCISES_BY_LF[lf] ?? [];
}

export function getVertiefungExercisesByLf(lf: LearningField): LearningExercise[] {
  return requireCache().VERTIEFUNG_EXERCISES_BY_LF[lf] ?? [];
}

export function getBeginnerExercisesByLf(lf: LearningField): LearningExercise[] {
  return requireCache().BEGINNER_EXERCISES_BY_LF[lf] ?? [];
}

export function getExamPathExercisesByLf(lf: LearningField): LearningExercise[] {
  return requireCache().EXAM_PATH_EXERCISES_BY_LF[lf] ?? [];
}

export function getBeginnerExerciseIdsByLf(lf: LearningField): Set<string> {
  return requireCache().BEGINNER_EXERCISE_IDS_BY_LF[lf] ?? new Set();
}

export function getExamExerciseIdsByLf(lf: LearningField): Set<string> {
  return requireCache().EXAM_EXERCISE_IDS_BY_LF[lf] ?? new Set();
}

function lfProxyRecord<T>(getter: (lf: LearningField) => T): Record<LearningField, T> {
  return new Proxy({} as Record<LearningField, T>, {
    get(_t, prop: string) {
      if (typeof prop !== "string" || !/^LF\d+$/.test(prop)) return undefined;
      return getter(prop as LearningField);
    },
  });
}

export const GRUNDLAGE_EXERCISES_BY_LF = lfProxyRecord((lf) => getGrundlageExercisesByLf(lf));
export const VERTIEFUNG_EXERCISES_BY_LF = lfProxyRecord((lf) => getVertiefungExercisesByLf(lf));
export const BEGINNER_EXERCISES_BY_LF = lfProxyRecord((lf) => getBeginnerExercisesByLf(lf));
export const EXAM_PATH_EXERCISES_BY_LF = lfProxyRecord((lf) => getExamPathExercisesByLf(lf));
export const BEGINNER_EXERCISE_IDS_BY_LF = lfProxyRecord((lf) => getBeginnerExerciseIdsByLf(lf));
export const EXAM_EXERCISE_IDS_BY_LF = lfProxyRecord((lf) => getExamExerciseIdsByLf(lf));

/** Kompatibilität — nur nach ensureCurriculumLoaded */
export const CURRICULUM_BY_LF: Record<LearningField, LearningExercise[]> = new Proxy(
  {} as Record<LearningField, LearningExercise[]>,
  {
    get(_t, prop: string) {
      if (prop === "then" || typeof prop !== "string") return undefined;
      return getCurriculumByLf(prop as LearningField);
    },
    ownKeys() {
      return Array.from({ length: 12 }, (_, i) => `LF${i + 1}`);
    },
    getOwnPropertyDescriptor(_t, prop) {
      if (typeof prop === "string" && /^LF\d+$/.test(prop)) {
        return { enumerable: true, configurable: true };
      }
      return undefined;
    },
  }
);
