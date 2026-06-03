/**
 * AAA-Audit: alle CCNA-Modul-Packs gegen ITExamAnswers HTML + Exhibit-Assets.
 * Usage: node scripts/audit-cisco-modules.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const htmlDir = join(root, "imports/cisco/html");
const packsDir = join(root, "src/cisco/ccna1-v7/packs");
const exhibitRoot = join(root, "assets/cisco/exhibits");

const PACKS = [
  "modules-1-3",
  "modules-4-7",
  "modules-8-10",
  "modules-11-13",
  "modules-14-15",
  "modules-16-17",
];

function checkpointQuestionNums(html) {
  const start = html.search(/<h3[^>]*>\s*Checkpoint Exam/i);
  let body = html.slice(start);
  const end = body.search(/<nav[^>]*class="[^"]*post-navigation/i);
  if (end > 500) body = body.slice(0, end);
  const re = /<p[^>]*>\s*<strong>\s*(\d+)\.\s*([\s\S]*?)<\/strong>(?:[\s\S]*?)<\/p>/gi;
  const seen = new Set();
  const nums = [];
  let m;
  while ((m = re.exec(body))) {
    const n = Number.parseInt(m[1], 10);
    if (seen.has(n)) continue;
    seen.add(n);
    nums.push(n);
  }
  return nums.sort((a, b) => a - b);
}

let failures = 0;

for (const packId of PACKS) {
  const htmlPath = join(htmlDir, `${packId}.html`);
  const packPath = join(packsDir, `${packId}.json`);
  console.log(`\n=== ${packId} ===`);

  if (!existsSync(htmlPath) || !existsSync(packPath)) {
    console.log("  FAIL: missing html or json");
    failures += 1;
    continue;
  }

  const html = readFileSync(htmlPath, "utf8");
  const pack = JSON.parse(readFileSync(packPath, "utf8"));
  const expected = checkpointQuestionNums(html);
  const imported = pack.items.map((i) => i.number).sort((a, b) => a - b);
  const missing = expected.filter((n) => !imported.includes(n));
  const extra = imported.filter((n) => !expected.includes(n));

  if (missing.length || extra.length) {
    console.log(`  FAIL: missing [${missing.join(",")}] extra [${extra.join(",")}]`);
    failures += 1;
  } else {
    console.log(`  OK: ${expected.length} questions match HTML`);
  }

  for (const item of pack.items) {
    if (!/refer to the exhibit/i.test(item.question?.en || "")) continue;
    const hasImage = Boolean(item.illustrationSrc);
    const hasCode = Boolean(item.exhibitCode?.trim());
    if (!hasImage && !hasCode) {
      console.log(`  FAIL: #${item.number} exhibit without illustrationSrc or exhibitCode`);
      failures += 1;
    }
    if (hasImage) {
      const rel = item.illustrationSrc.replace(/^\//, "");
      const disk = join(root, rel);
      if (!existsSync(disk)) {
        console.log(`  FAIL: #${item.number} missing file ${rel}`);
        failures += 1;
      }
    }
  }

  const manifestPath = join(exhibitRoot, packId, "manifest.json");
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    for (const entry of manifest) {
      const item = pack.items.find((i) => i.number === entry.questionNumber);
      if (!item || item.illustrationSrc !== entry.illustrationSrc) {
        console.log(`  FAIL: manifest #${entry.questionNumber} out of sync with pack JSON`);
        failures += 1;
      }
    }
    console.log(`  exhibits: ${manifest.length} in manifest`);
  } else {
    const exhibitRefs = pack.items.filter((i) =>
      /refer to the exhibit/i.test(i.question?.en || "")
    ).length;
    if (exhibitRefs > 0) {
      console.log(`  WARN: ${exhibitRefs} exhibit refs but no manifest`);
    } else {
      console.log("  exhibits: none (expected)");
    }
  }
}

console.log(`\n[audit:cisco-modules] ${failures ? `${failures} failure(s)` : "all packs AAA-ready"}`);
process.exit(failures ? 1 : 0);
