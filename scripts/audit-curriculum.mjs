import { CURRICULUM_BY_LF } from "../src/lib/learning/learningRegistry.ts";
import { REFERENCE_EXERCISES_BY_LF } from "../src/lib/learning/buildReferenceExercises.ts";

const all = Object.values(CURRICULUM_BY_LF).flat();
const byQ = new Map();
const byTitle = new Map();
const issues = [];

for (const [lf, bag] of Object.entries(CURRICULUM_BY_LF)) {
  console.log(`${lf}: ${bag.length} exercises`);
  for (const ex of bag) {
    const q = ex.mcQuestion?.trim() ?? "";
    byQ.set(q, (byQ.get(q) ?? 0) + 1);
    byTitle.set(ex.title, (byTitle.get(ex.title) ?? 0) + 1);

    if (ex.id.includes("-ref-") && ex.title.startsWith("Codex ·")) {
      const generic = [
        "Was beschreibt dieser Code am besten?",
        "Was koppeln JOIN und ON",
        "Wozu dient GROUP BY",
        "Was bewirkt der Filter",
        "Was macht SELECT in dieser Abfrage?",
      ].some((g) => ex.mcQuestion?.includes(g));
      if (generic) issues.push(`${lf} ${ex.id}: generic ref MC`);
    }
    if (ex.problem?.includes("Lies den Code im Codex")) {
      issues.push(`${lf} ${ex.id}: vague codex problem`);
    }
    if ((ex.mcQuestion?.length ?? 0) < 8) issues.push(`${lf} ${ex.id}: tiny question`);
  }
}

const refCount = Object.values(REFERENCE_EXERCISES_BY_LF).flat().length;
const dupQ = [...byQ.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);
const dupT = [...byTitle.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);

console.log("\nTotal:", all.length, "| Reference:", refCount);
console.log("Duplicate mcQuestions:", dupQ.length);
dupQ.slice(0, 12).forEach(([q, c]) => console.log(`  ${c}x`, q.slice(0, 72)));
console.log("Duplicate titles:", dupT.length);
dupT.slice(0, 8).forEach(([t, c]) => console.log(`  ${c}x`, t.slice(0, 60)));
console.log("\nGeneric ref / vague issues:", issues.length);
issues.slice(0, 25).forEach((i) => console.log(" ", i));
