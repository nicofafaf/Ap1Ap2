import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const git = execSync("git show HEAD:src/lib/learning/learningRegistry.ts", {
  encoding: "utf8",
}).split("\n");
const tail = git.slice(1238, 1261).join("\n");

let b = readFileSync("src/lib/learning/curriculumBundle.ts", "utf8");
if (b.includes("export const CURRICULUM_BY_LF")) {
  console.log("already has CURRICULUM export");
  process.exit(0);
}
b = b.replace(
  /\nfor \(const ex of Object\.values\(CURRICULUM_BY_LF\)/,
  `\n${tail}\n\nfor (const ex of Object.values(CURRICULUM_BY_LF)`
);
if (!b.includes("export const CURRICULUM_BY_LF")) {
  throw new Error("append failed");
}
writeFileSync("src/lib/learning/curriculumBundle.ts", b);
console.log("fixed tail");
