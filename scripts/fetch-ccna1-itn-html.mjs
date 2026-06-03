/**
 * Lädt Checkpoint-HTML (roh, unverändert) für alle CCNA1-ITN-Packs.
 * Danach: npm run import:cisco && npm run scrape:cisco-exhibits
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "imports", "cisco", "html");

const PACKS = [
  ["modules-1-3", "https://itexamanswers.net/ccna-1-v7-modules-1-3-basic-network-connectivity-and-communications-exam-answers.html"],
  ["modules-4-7", "https://itexamanswers.net/ccna-1-v7-modules-4-7-ethernet-concepts-exam-answers.html"],
  ["modules-8-10", "https://itexamanswers.net/ccna-1-v7-modules-8-10-communicating-between-networks-exam-answers.html"],
  ["modules-11-13", "https://itexamanswers.net/ccna-1-v7-modules-11-13-ip-addressing-exam-answers-full.html"],
  ["modules-14-15", "https://itexamanswers.net/ccna-1-v7-modules-14-15-network-application-communications-exam-answers.html"],
  ["modules-16-17", "https://itexamanswers.net/ccna-1-v7-modules-16-17-building-and-securing-a-small-network-exam-answers.html"],
  ["practice-final", "https://itexamanswers.net/ccna-1-version-7-00-itnv7-practice-final-exam-answers.html"],
  ["course-final", "https://itexamanswers.net/ccna-1-v7-0-final-exam-answers-full-introduction-to-networks.html"],
  ["system-test", "https://itexamanswers.net/ccnav7-system-test-course-version-1-1-system-test-exam-answers.html"],
  ["pt-skills-final", "https://itexamanswers.net/itn-version-7-00-final-pt-skills-assessment-ptsa-exam-answers.html"],
];

const only = process.argv.find((a) => a.startsWith("--pack="))?.split("=")[1];

mkdirSync(outDir, { recursive: true });

for (const [id, url] of PACKS) {
  if (only && id !== only) continue;
  console.log(`[fetch-ccna1] ${id} …`);
  const res = await fetch(url, {
    headers: { "User-Agent": "LernenSchule-Cisco-Import/1.0 (educational; local import)" },
  });
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const html = await res.text();
  const path = join(outDir, `${id}.html`);
  writeFileSync(path, html, "utf8");
  console.log(`[fetch-ccna1] wrote ${path} (${Math.round(html.length / 1024)} KB raw HTML)`);
  await new Promise((r) => setTimeout(r, 1200));
}

console.log("[fetch-ccna1] done — run: npm run import:cisco && npm run scrape:cisco-exhibits");
