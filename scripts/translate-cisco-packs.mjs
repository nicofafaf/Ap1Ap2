/**
 * Füllt fehlende `de`-Felder in Cisco-Pack-JSONs (EN → DE via MyMemory).
 * Ergebnisse werden in scripts/.cisco-translate-cache.json gecacht.
 *
 * Usage:
 *   node scripts/translate-cisco-packs.mjs --pack=system-test
 *   node scripts/translate-cisco-packs.mjs --all
 *   node scripts/translate-cisco-packs.mjs --pack=modules-1-3 --limit=20
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packsDir = join(root, "src", "cisco", "ccna1-v7", "packs");
const cachePath = join(root, "scripts", ".cisco-translate-cache.json");
const MAX_CHARS = 480;
const DELAY_MS = 1500;

function readCache() {
  if (!existsSync(cachePath)) return {};
  try {
    return JSON.parse(readFileSync(cachePath, "utf8"));
  } catch {
    return {};
  }
}

function writeCache() {
  writeFileSync(cachePath, `${JSON.stringify(cacheMap, null, 2)}\n`, "utf8");
}

function cacheKey(text) {
  return `en>de:${text.slice(0, 160)}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateEnToDe(text) {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const key = cacheKey(trimmed);
  if (cacheMap[key]) return cacheMap[key];

  const chunk = trimmed.length > MAX_CHARS ? `${trimmed.slice(0, MAX_CHARS)}…` : trimmed;
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", chunk);
  url.searchParams.set("langpair", "en|de");

  let lastErr;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(25_000) });
      if (res.status === 429) {
        const wait = 8_000 * (attempt + 1);
        console.warn(`[translate-cisco] rate limit — wait ${wait / 1000}s`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const out = data?.responseData?.translatedText?.trim();
      if (!out) return text;

      cacheMap[key] = out;
      writeCache();
      return trimmed.length > MAX_CHARS ? `${out}…` : out;
    } catch (err) {
      lastErr = err;
      const wait = 4_000 * (attempt + 1);
      console.warn(`[translate-cisco] retry in ${wait / 1000}s — ${err.message}`);
      await sleep(wait);
    }
  }
  throw lastErr ?? new Error("translate failed");
}

async function translateEnToDeSafe(text) {
  try {
    return await translateEnToDe(text);
  } catch (err) {
    console.warn(`[translate-cisco] skip field — ${err.message}`);
    return null;
  }
}

async function fillLocaleBlock(block) {
  if (!block?.en?.trim() || block.de?.trim()) return false;
  const de = await translateEnToDeSafe(block.en);
  if (!de) return false;
  block.de = de;
  await sleep(DELAY_MS);
  return true;
}

async function translateItem(item) {
  let n = 0;
  if (await fillLocaleBlock(item.question)) n += 1;
  if (item.explanation && (await fillLocaleBlock(item.explanation))) n += 1;
  for (const opt of item.options ?? []) {
    if (await fillLocaleBlock(opt.text)) n += 1;
  }
  for (const pair of item.matchPairs ?? []) {
    if (await fillLocaleBlock(pair.left)) n += 1;
    if (await fillLocaleBlock(pair.right)) n += 1;
  }
  return n;
}

function savePack(path, pack) {
  writeFileSync(path, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
}

async function translatePack(packId, { limit = 0, dryRun = false } = {}) {
  const path = join(packsDir, `${packId}.json`);
  if (!existsSync(path)) {
    console.warn(`[translate-cisco] skip ${packId} — missing JSON`);
    return 0;
  }
  const pack = JSON.parse(readFileSync(path, "utf8"));
  let fields = 0;
  let items = 0;
  for (const item of pack.items) {
    if (limit > 0 && items >= limit) break;
    if (item.type === "pt-lab") {
      const n = await fillLocaleBlock(item.question);
      if (n) fields += 1;
      items += 1;
      if (!dryRun && n) savePack(path, pack);
      continue;
    }
    if (item.type === "unsupported") continue;
    const n = await translateItem(item);
    if (n) {
      fields += n;
      if (!dryRun) savePack(path, pack);
    }
    items += 1;
  }
  console.log(`[translate-cisco] ${packId}: ${fields} DE-Feld(er)${dryRun ? " (dry-run)" : ""}`);
  return fields;
}

const args = process.argv.slice(2);
const all = args.includes("--all");
const dryRun = args.includes("--dry-run");
const packArg = args.find((a) => a.startsWith("--pack="))?.split("=")[1];
const limitArg = Number.parseInt(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "0", 10);
const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : 0;

const packIds = all
  ? readdirSync(packsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""))
  : packArg
    ? [packArg]
    : [];

if (!packIds.length) {
  console.log(`Usage:
  node scripts/translate-cisco-packs.mjs --pack=system-test
  node scripts/translate-cisco-packs.mjs --all
  node scripts/translate-cisco-packs.mjs --pack=modules-1-3 --limit=20 [--dry-run]`);
  process.exit(1);
}

let cacheMap = readCache();

let total = 0;
for (const packId of packIds) {
  total += await translatePack(packId, { limit, dryRun });
}
console.log(`[translate-cisco] done — ${total} fields total`);
