import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const full = execSync("git show HEAD:src/lib/learning/learningRegistry.ts", { encoding: "utf8" });
const lines = full.split("\n");

// After trim-sql script HEAD may still have deprecated - use current registry builders + HEAD data tail
const currentReg = readFileSync("src/lib/learning/learningRegistry.ts", "utf8");
const currentLines = currentReg.split("\n");

// Find data start in HEAD (const lf02WithExam)
const dataStart = lines.findIndex((l) => l.startsWith("const lf02WithExam"));
if (dataStart < 0) throw new Error("dataStart");
let dataLines = lines.slice(dataStart);

// Apply SQL fix on data lines
const sqlMergeIdx = dataLines.findIndex((l) =>
  l.includes("const SQL_EXAM_LF5 = mergeFullCurriculum")
);
if (sqlMergeIdx >= 0) {
  // find end of SQL_EXAM_LF5 statement
  let end = sqlMergeIdx;
  while (end < dataLines.length && !dataLines[end].endsWith("]);") && !dataLines[end].includes("LF5_JSON_CORE")) {
    end++;
  }
  if (dataLines[sqlMergeIdx].includes("LF5_NON_BOSS")) {
    dataLines[sqlMergeIdx] = 'const SQL_EXAM_LF5 = mergeFullCurriculum("LF5", LF5_JSON_CORE);';
    // remove continuation lines until ];
    let j = sqlMergeIdx + 1;
    while (j < dataLines.length && dataLines[j] !== "]);") j++;
    dataLines.splice(sqlMergeIdx + 1, j - sqlMergeIdx);
  }
}

// Cut at stablePick
const stableIdx = dataLines.findIndex((l) => l.startsWith("function stablePick"));
if (stableIdx < 0) throw new Error("stablePick");
dataLines = dataLines.slice(0, stableIdx);

const header = `/**
 * Curriculum-Daten — separater Chunk (lazy via curriculumAccess).
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
  assertMcIntegrity,
  type BeginnerContentShape,
  type Lf5ContentShape,
} from "./learningRegistry";

`;

const footer = `
for (const ex of Object.values(CURRICULUM_BY_LF).flat()) {
  assertMcIntegrity(ex);
}

for (const lf of Object.keys(CURRICULUM_BY_LF) as LearningField[]) {
  const minExercises = lf === "LF5" ? 1 : 5;
  if (CURRICULUM_BY_LF[lf].length < minExercises) {
    throw new Error(\`Curriculum \${lf}: mindestens \${minExercises} Aufgaben erforderlich\`);
  }
}
`;

writeFileSync(
  "src/lib/learning/curriculumBundle.ts",
  header + dataLines.join("\n") + footer,
  "utf8"
);
console.log("rebuilt bundle", dataLines.length, "lines");
