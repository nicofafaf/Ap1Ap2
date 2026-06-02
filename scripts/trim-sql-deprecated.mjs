import { readFileSync, writeFileSync } from "node:fs";

const p = "src/lib/learning/learningRegistry.ts";
let s = readFileSync(p, "utf8");
const start = s.indexOf("const SQL_EXAM_LF5_FALLBACK");
const end = s.indexOf("type Lf5WorkbenchMilestone", start);
if (start < 0 || end < 0) throw new Error("markers not found");

const fallback =
  "/** LF5-Fallback wenn JSON-Milestones fehlen (minimal) */\n" +
  "const SQL_EXAM_LF5_FALLBACK: LearningExercise[] = [];\n\n";

s = s.slice(0, start) + fallback + s.slice(end);
s = s.replaceAll("SQL_EXAM_LF5_DEPRECATED", "SQL_EXAM_LF5_FALLBACK");
s = s.replace(
  "const SQL_EXAM_LF5 = mergeFullCurriculum(\"LF5\", [\n  ...LF5_NON_BOSS,\n  ...SQL_EXAM_LF5_FALLBACK,\n  ...(LF5_BOSS ? [LF5_BOSS] : []),\n]);",
  "const SQL_EXAM_LF5 = mergeFullCurriculum(\"LF5\", LF5_JSON_CORE);"
);
writeFileSync(p, s);
console.log("trimmed", p);
