/**
 * Repariert Reihenfolge-/Order-Fragen als Match-Paare (Schritt → First/Second/…).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packsDir = join(root, "src", "cisco", "ccna1-v7", "packs");

const ORDER_Q =
  /correct order of events|place the options in the following order|termination process steps in the order|place the termination|answer order does not matter|identify the steps needed/i;

function stripHtml(s) {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#8211;/g, "–")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseOrderPairs(block) {
  const pairs = [];
  const trRe = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let m;
  while ((m = trRe.exec(block))) {
    const left = stripHtml(m[1]);
    const right = stripHtml(m[2]);
    if (!left || !right || /---/.test(left)) continue;
    if (/^place the options/i.test(left)) continue;
    pairs.push({ left: { en: left, de: null }, right: { en: right, de: null } });
  }
  if (pairs.length >= 2) return pairs;

  for (const line of block.split("\n")) {
    const pipe = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (!pipe) continue;
    const left = pipe[1].replace(/\*\*/g, "").trim();
    const right = pipe[2].replace(/\*\*/g, "").trim();
    if (!left || !right || left.includes("---") || /^place the options/i.test(left)) continue;
    pairs.push({ left: { en: left, de: null }, right: { en: right, de: null } });
  }
  return pairs;
}

function findQuestionChunk(html, num) {
  const re = new RegExp(
    `(?:<p[^>]*>\\s*)?(?:<strong>\\s*)?${num}\\.\\s*[\\s\\S]*?(?=(?:<p[^>]*>\\s*)?(?:<strong>\\s*)?${num + 1}\\.|$)`,
    "i"
  );
  return html.match(re)?.[0] ?? null;
}

function extractOrderPairs(chunkHtml) {
  const placeIdx = chunkHtml.search(/place the options in the following order/i);
  const slice = placeIdx >= 0 ? chunkHtml.slice(placeIdx) : chunkHtml;
  const tableEnd = slice.search(/<div[^>]*class="[^"]*message_box[^"]*success/i);
  const block = tableEnd > 0 ? slice.slice(0, tableEnd) : slice.slice(0, 6000);
  const htmlPairs = parseOrderPairs(block);
  if (htmlPairs.length >= 2) return htmlPairs;
  return parseOrderPairs(block.replace(/<[^>]+>/g, "\n"));
}

async function patchPack(packId) {
  const path = join(packsDir, `${packId}.json`);
  const pack = JSON.parse(readFileSync(path, "utf8"));
  const html = await fetch(pack.sourceUrl, { signal: AbortSignal.timeout(45_000) }).then((r) =>
    r.text()
  );
  let fixed = 0;
  for (const item of pack.items) {
    if (item.type !== "unsupported") continue;
    const q = item.question?.en ?? "";
    if (!ORDER_Q.test(q)) continue;
    const chunk = findQuestionChunk(html, item.number);
    if (!chunk) {
      console.warn(`[patch-order] ${packId} q${item.number}: chunk missing`);
      continue;
    }
    const pairs = extractOrderPairs(chunk);
    if (pairs.length < 2) {
      console.warn(`[patch-order] ${packId} q${item.number}: no order table (${pairs.length})`);
      continue;
    }
    item.type = "match";
    item.matchPairs = pairs;
    delete item.needsManual;
    fixed += 1;
    console.log(`[patch-order] ${packId} q${item.number} → match (${pairs.length} pairs)`);
  }
  if (fixed > 0) writeFileSync(path, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  return fixed;
}

const packIds = readdirSync(packsDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));

let total = 0;
for (const packId of packIds) {
  total += await patchPack(packId);
}
console.log(`[patch-order] done — ${total} item(s)`);
