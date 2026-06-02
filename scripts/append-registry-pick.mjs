import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { execSync } from "node:child_process";

const head = execSync("git show HEAD:src/lib/learning/learningRegistry.ts", { encoding: "utf8" });
const lines = head.split("\n");
const pickStart = lines.findIndex((l) => l.startsWith("export function pickLearningExercise("));
const pickEnd = lines.findIndex((l) => l.startsWith("export function assertMcIntegrity("));
if (pickStart < 0 || pickEnd < 0) throw new Error("pick markers");
let pick = lines.slice(pickStart, pickEnd).join("\n");

pick = pick
  .replaceAll("CURRICULUM_BY_LF[lf]", "getCurriculumByLf(lf)")
  .replaceAll("BEGINNER_EXERCISE_IDS_BY_LF[lf]", "getBeginnerExerciseIdsByLf(lf)")
  .replaceAll("EXAM_EXERCISE_IDS_BY_LF[lf]", "getExamExerciseIdsByLf(lf)")
  .replaceAll("GRUNDLAGE_EXERCISES_BY_LF[lf]", "getGrundlageExercisesByLf(lf)")
  .replaceAll("VERTIEFUNG_EXERCISES_BY_LF[lf]", "getVertiefungExercisesByLf(lf)");

const imports = `
import {
  getCurriculumByLf,
  getBeginnerExerciseIdsByLf,
  getExamExerciseIdsByLf,
  getGrundlageExercisesByLf,
  getVertiefungExercisesByLf,
  getBeginnerExercisesByLf,
  ensureCurriculumLoaded,
  isCurriculumLoaded,
} from "./curriculumAccess";
`;

const helpers = `
function getPendingInLearnPath(
  path: LearningExercise[],
  leitner?: Readonly<Record<string, LeitnerCardState>>,
  ctx?: EdtechExercisePickContext | null
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

function getPendingBeginnerExercise(
  lf: LearningField,
  leitner?: Readonly<Record<string, LeitnerCardState>>,
  ctx?: EdtechExercisePickContext | null
): LearningExercise | null {
  const grundlage = getGrundlageExercisesByLf(lf);
  const pendingGrund = getPendingInLearnPath(grundlage, leitner, ctx);
  if (pendingGrund) return pendingGrund;
  const vertiefung = getVertiefungExercisesByLf(lf);
  return getPendingInLearnPath(vertiefung, leitner, ctx);
}

function filterExercisePool<T extends { id: string }>(
  pool: T[],
  ctx?: EdtechExercisePickContext | null
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

export function getBeginnerExerciseForLf(lf: LearningField): LearningExercise | null {
  if (!isCurriculumLoaded()) return null;
  return getGrundlageExercisesByLf(lf)[0] ?? getBeginnerExercisesByLf(lf)[0] ?? null;
}

export function getNextLearnExerciseForLf(
  lf: LearningField,
  leitner?: Readonly<Record<string, LeitnerCardState>>,
  solvedExerciseIds?: readonly string[]
): LearningExercise | null {
  if (!isCurriculumLoaded()) return null;
  return getPendingBeginnerExercise(lf, leitner, { solvedExerciseIds });
}

export type EdtechExercisePickContext = {
  excludeExerciseId?: string | null;
  recentExerciseIds?: readonly string[];
  solvedExerciseIds?: readonly string[];
};

export async function getLearningExerciseById(
  lf: LearningField,
  exerciseId: string
): Promise<LearningExercise | null> {
  await ensureCurriculumLoaded();
  const bag = getCurriculumByLf(lf);
  return bag.find((ex) => ex.id === exerciseId) ?? null;
}

export function getLearningExerciseByIdSync(
  lf: LearningField,
  exerciseId: string
): LearningExercise | null {
  if (!isCurriculumLoaded()) return null;
  const bag = getCurriculumByLf(lf);
  return bag.find((ex) => ex.id === exerciseId) ?? null;
}
`;

let reg = readFileSync("src/lib/learning/learningRegistry.ts", "utf8");
reg = reg.replace(
  /import \{[\s\S]*?\} from "\.\/lernfelderContentIndex";\n\n/,
  ""
);
reg = reg.replace(
  /import \{[\s\S]*?\} from "\.\/expandedCurriculum";\n/,
  ""
);
reg = reg.replace(/import \{ REFERENCE_EXERCISES_BY_LF \} from "\.\/buildReferenceExercises";\n/, "");
reg = reg.replace(/import \{ LF_DRILL_PACKS \} from "\.\/lfDrillPacks";\n/, "");

if (!reg.includes("export function buildBeginnerPathFromJson")) {
  reg = reg.replace(
    "function buildBeginnerPathFromJson",
    "export function buildBeginnerPathFromJson"
  );
  reg = reg.replace("function buildLf5FromJson", "export function buildLf5FromJson");
  reg = reg.replace(
    "function buildLearnAndExamPathsFromJson",
    "export function buildLearnAndExamPathsFromJson"
  );
  reg = reg.replace(
    "function buildOptionalBossCodeExercise",
    "export function buildOptionalBossCodeExercise"
  );
  reg = reg.replace(
    "function buildOptionalBossMcExercise",
    "export function buildOptionalBossMcExercise"
  );
}

reg = reg.replace(
  "/** LF5-Fallback wenn JSON-Milestones fehlen \\(minimal, kein Duplikat-Set mehr\\) \\*/\n/** LF5-Fallback wenn JSON-Milestones fehlen \\(minimal\\) \\*/",
  "/** LF5-Fallback wenn JSON-Milestones fehlen (minimal) */"
);

reg += "\n" + imports + helpers + "\n" + pick + "\n";

reg += `
export {
  ensureCurriculumLoaded,
  isCurriculumLoaded,
  CURRICULUM_BY_LF,
  GRUNDLAGE_EXERCISES_BY_LF,
  VERTIEFUNG_EXERCISES_BY_LF,
  BEGINNER_EXERCISES_BY_LF,
  EXAM_PATH_EXERCISES_BY_LF,
  BEGINNER_EXERCISE_IDS_BY_LF,
  EXAM_EXERCISE_IDS_BY_LF,
} from "./curriculumAccess";
export { resolveTerminalBossMode } from "./curriculumBundle";
`;

writeFileSync("src/lib/learning/learningRegistry.ts", reg);
console.log("registry updated");
