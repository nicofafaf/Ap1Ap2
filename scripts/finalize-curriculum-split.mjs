import { readFileSync, writeFileSync } from "node:fs";

const regPath = "src/lib/learning/learningRegistry.ts";
const bunPath = "src/lib/learning/curriculumBundle.ts";

let regLines = readFileSync(regPath, "utf8").split("\n");
regLines = regLines.slice(0, 368);
writeFileSync(regPath, regLines.join("\n"));

let bunLines = readFileSync(bunPath, "utf8").split("\n");
const cut = bunLines.findIndex((l) => l.startsWith("function stablePick"));
if (cut < 0) throw new Error("stablePick not found in bundle");
bunLines = bunLines.slice(0, cut);
bunLines.push("");
bunLines.push("for (const ex of Object.values(CURRICULUM_BY_LF).flat()) {");
bunLines.push("  assertMcIntegrity(ex);");
bunLines.push("}");
bunLines.push("");
bunLines.push("for (const lf of Object.keys(CURRICULUM_BY_LF) as LearningField[]) {");
bunLines.push('  const minExercises = lf === "LF5" ? 1 : 5;');
bunLines.push("  if (CURRICULUM_BY_LF[lf].length < minExercises) {");
bunLines.push(
  "    throw new Error(`Curriculum ${lf}: mindestens ${minExercises} Aufgaben erforderlich`);"
);
bunLines.push("  }");
bunLines.push("}");
writeFileSync(bunPath, bunLines.join("\n"));
console.log("done", regLines.length, bunLines.length);
