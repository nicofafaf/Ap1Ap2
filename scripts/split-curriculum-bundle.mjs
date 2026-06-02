import { readFileSync, writeFileSync } from "node:fs";

const path = "src/lib/learning/learningRegistry.ts";
const lines = readFileSync(path, "utf8").split("\n");

const headEnd = 42; // through export applyLeitnerReview
const buildEnd = 367; // through buildLearnAndExamPathsFromJson closing brace
const dataStart = 368; // const lf02WithExam ...

const head = lines.slice(0, headEnd).join("\n");
const buildPart = lines.slice(headEnd, buildEnd + 1).join("\n");
const dataPart = lines.slice(dataStart).join("\n");

const bundleHeader = `/**
 * Curriculum-Daten (JSON, Drills, expanded) — eigener Chunk, lazy via curriculumAccess.
 */
import type { LearningField } from "../../data/nexusRegistry";
import type { LearningExercise, LearningMcOption } from "./learningExerciseTypes";
import {
  LF10_PROJEKT_AGIL,
  LF11_INFO_SICHERHEIT,
  LF12_AGILE_PM,
  LF1_WIRTSCHAFT,
  LF2_IT_GRUNDLAGEN,
  LF3_NETZWERK,
  LF4_NETZ_HARDWARE,
  LF8_DATENMODELL,
  LF9_DIENSTE_PROTOKOLLE,
} from "./expandedCurriculum";
import { REFERENCE_EXERCISES_BY_LF } from "./buildReferenceExercises";
import { LF_DRILL_PACKS } from "./lfDrillPacks";
import {
  isExamPathMission,
  isGrundlagePathMission,
  isVertiefungPathMission,
} from "./learnPathFilters";
import {
  BEGINNER_CONTENT_BY_LF,
  lf01Content,
  lf03Content,
  lf05Content,
  lf08Content,
  lf10Content,
  lf11Content,
} from "./lernfelderContentIndex";
import {
  buildBeginnerPathFromJson,
  buildLf5FromJson,
  buildLearnAndExamPathsFromJson,
  buildOptionalBossCodeExercise,
  buildOptionalBossMcExercise,
  normalizeLearningField,
  resolveTerminalBossMode,
  assertMcIntegrity,
  type BeginnerContentShape,
  type Lf5ContentShape,
} from "./learningRegistry";

`;

const registryTail = `
${buildPart}

// —— Pick / adaptive (schlank, kein JSON-Bulk) ——

import {
  getCurriculumByLf,
  getBeginnerExercisesByLf,
  getGrundlageExercisesByLf,
  getVertiefungExercisesByLf,
  getExamPathExercisesByLf,
  getBeginnerExerciseIdsByLf,
  getExamExerciseIdsByLf,
} from "./curriculumAccess";

export function getBeginnerExerciseForLf(lf: LearningField): LearningExercise | null {
  return getGrundlageExercisesByLf(lf)[0] ?? getBeginnerExercisesByLf(lf)[0] ?? null;
}

export function getNextLearnExerciseForLf(
  lf: LearningField,
  leitner?: Readonly<Record<string, LeitnerCardState>>,
  solvedExerciseIds?: readonly string[]
): LearningExercise | null {
  return getPendingBeginnerExercise(lf, leitner, { solvedExerciseIds });
}

function getPendingBeginnerExercise(
  lf: LearningField,
  leitner?: Readonly<Record<string, LeitnerCardState>>,
  ctx?: import("./learningRegistry").EdtechExercisePickContext | null
): LearningExercise | null {
  const grundlage = getGrundlageExercisesByLf(lf) ?? [];
  const pendingGrund = getPendingInLearnPath(grundlage, leitner, ctx);
  if (pendingGrund) return pendingGrund;
  const vertiefung = getVertiefungExercisesByLf(lf) ?? [];
  return getPendingInLearnPath(vertiefung, leitner, ctx);
}

function getPendingInLearnPath(
  path: LearningExercise[],
  leitner?: Readonly<Record<string, LeitnerCardState>>,
  ctx?: import("./learningRegistry").EdtechExercisePickContext | null
): LearningExercise | null {
  if (!path.length) return null;
  const solved = new Set(ctx?.solvedExerciseIds ?? []);
  const exclude = ctx?.excludeExerciseId;
  for (const ex of path) {
    if (exclude && ex.id === exclude) continue;
    if (solved.has(ex.id)) continue;
    const state = leitner?.[ex.id];
    if (!state || state.repetitions < 1) return ex;
  }
  return null;
}

function filterExercisePool<T extends { id: string }>(
  pool: T[],
  ctx?: import("./learningRegistry").EdtechExercisePickContext | null
): T[] {
  if (!pool.length) return pool;
  const exclude = ctx?.excludeExerciseId;
  const recent = new Set(ctx?.recentExerciseIds ?? []);
  let out = pool.filter((ex) => ex.id !== exclude && !recent.has(ex.id));
  if (out.length) return out;
  out = pool.filter((ex) => ex.id !== exclude);
  if (out.length) return out;
  if (recent.size) {
    out = pool.filter((ex) => !recent.has(ex.id));
    if (out.length) return out;
  }
  return pool;
}

function stablePick<T>(arr: T[], seed: number, salt: number): T {
  if (arr.length === 0) throw new Error("empty registry");
  const idx = Math.abs((seed * 1103515245 + salt) % arr.length);
  return arr[idx]!;
}

export function pickLearningExercise(
  lf: LearningField,
  _semantic: "HardwareNetworking" | "SecurityCryptography" | "DatabaseLogic",
  seed: number
): LearningExercise | null {
  const bag = getCurriculumByLf(lf);
  if (!bag?.length) return null;
  const beginner = getPendingBeginnerExercise(lf);
  if (beginner) return beginner;
  const n = Number.parseInt(lf.replace("LF", ""), 10);
  const salt = Number.isFinite(n) ? n * 131 : 0;
  return stablePick(bag, seed, salt);
}

export function pickLearningExerciseFromLfAdaptive(
  lf: LearningField,
  rng: () => number,
  leitner: Readonly<Record<string, LeitnerCardState>>,
  now: number,
  ctx?: import("./learningRegistry").EdtechExercisePickContext | null
): LearningExercise | null {
  const bag = getCurriculumByLf(lf);
  if (!bag?.length) return null;
  const pending = getPendingBeginnerExercise(lf, leitner, ctx);
  if (pending) return pending;
  const pool = filterExercisePool(bag, ctx);
  const weights = pool.map((ex) => leitnerPickWeight(leitner[ex.id], now));
  return pickWeightedExercise(pool, weights, rng);
}

export function pickRandomLf(rng: () => number): LearningField {
  const n = 1 + Math.floor(rng() * 12);
  return \`LF\${n}\` as LearningField;
}

export function pickFinalExamExercise(
  rng: () => number,
  leitner: Readonly<Record<string, LeitnerCardState>>,
  now: number
): { exercise: LearningExercise; lf: LearningField } | null {
  const lf = pickRandomLf(rng);
  const exercise = pickLearningExerciseFromLfAdaptive(lf, rng, leitner, now, null);
  if (!exercise) return null;
  return { exercise, lf };
}

export { resolveTerminalBossMode, assertMcIntegrity };
export type { EdtechExercisePickContext } from "./learningRegistryTypes";
`;

writeFileSync("scripts/_split-error.txt", "use manual approach");
console.log("script placeholder - doing manual file creation");
