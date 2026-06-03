/**
 * Lädt Exhibit-Bilder aus ITExamAnswers HTML und verknüpft sie mit Frage-Nummern.
 * Ausgabe: assets/cisco/exhibits/{packId}/ + manifest.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const htmlDir = join(root, "imports", "cisco", "html");
const outRoot = join(root, "assets", "cisco", "exhibits");
const packsDir = join(root, "src", "cisco", "ccna1-v7", "packs");

const PACK_URLS = {
  "modules-1-3":
    "https://itexamanswers.net/ccna-1-v7-modules-1-3-basic-network-connectivity-and-communications-exam-answers.html",
  "modules-4-7":
    "https://itexamanswers.net/ccna-1-v7-modules-4-7-ethernet-concepts-exam-answers.html",
  "modules-8-10":
    "https://itexamanswers.net/ccna-1-v7-modules-8-10-communicating-between-networks-exam-answers.html",
  "modules-11-13":
    "https://itexamanswers.net/ccna-1-v7-modules-11-13-ip-addressing-exam-answers-full.html",
  "modules-14-15":
    "https://itexamanswers.net/ccna-1-v7-modules-14-15-network-application-communications-exam-answers.html",
  "modules-16-17":
    "https://itexamanswers.net/ccna-1-v7-modules-16-17-building-and-securing-a-small-network-exam-answers.html",
  "practice-final":
    "https://itexamanswers.net/ccna-1-version-7-00-itnv7-practice-final-exam-answers.html",
  "course-final":
    "https://itexamanswers.net/ccna-1-v7-0-final-exam-answers-full-introduction-to-networks.html",
  "system-test":
    "https://itexamanswers.net/ccnav7-system-test-course-version-1-1-system-test-exam-answers.html",
};

function decodeHtml(s) {
  return s
    .replace(/&#8211;/g, "–")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

/** Extrahiert Frage-Blöcke mit zugehörigen Bildern aus Roh-HTML */
function extractQuestionImages(html) {
  const entries = [];
  const markers = [];
  const blockRe = /<p[^>]*>\s*<strong>\s*(\d+)\.\s*([\s\S]*?)<\/strong>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = blockRe.exec(html))) {
    markers.push({
      num: Number.parseInt(m[1], 10),
      index: m.index,
      end: m.index + m[0].length,
      qText: decodeHtml(m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()),
      inner: m[3],
    });
  }
  for (let i = 0; i < markers.length; i += 1) {
    const cur = markers[i];
    if (!/refer to the exhibit/i.test(cur.qText)) continue;
    const next = markers[i + 1];
    const sliceEnd = next ? next.index : cur.end + 8000;
    const window = html.slice(cur.index, sliceEnd);
    const imgs = [...window.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)]
      .map((x) => decodeHtml(x[1]))
      .filter((u) => !/logo|avatar|gravatar|\/ads\/|banner-ad|itexam-1\.png/i.test(u));
    if (imgs.length === 0) continue;
    entries.push({ num: cur.num, qText: cur.qText, imgs: [...new Set(imgs)] });
  }
  return entries;
}

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": "LernenSchule-Cisco-Import/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

async function processPack(packId, html) {
    const entries = extractQuestionImages(html);
  const packOut = join(outRoot, packId);
  mkdirSync(packOut, { recursive: true });
  const manifest = [];

  for (const entry of entries) {
    const imgUrl = entry.imgs[0];
    const ext = imgUrl.match(/\.(png|jpe?g|gif|webp)(\?|$)/i)?.[1] ?? "png";
    const fileName = `q${String(entry.num).padStart(3, "0")}.${ext.replace("jpeg", "jpg")}`;
    const dest = join(packOut, fileName);
    if (!existsSync(dest)) {
      try {
        await downloadImage(imgUrl, dest);
        console.log(`  [img] ${packId} #${entry.num} ← ${imgUrl}`);
      } catch (e) {
        console.warn(`  [skip] ${packId} #${entry.num}: ${e.message}`);
        continue;
      }
    }
    manifest.push({
      questionNumber: entry.num,
      questionId: `${packId}-q${String(entry.num).padStart(3, "0")}`,
      illustrationSrc: `/assets/cisco/exhibits/${packId}/${fileName}`,
      sourceUrl: imgUrl,
    });
  }

  for (const name of readdirSync(packOut)) {
    const m = name.match(/^q(\d{3})\.(png|jpe?g|gif|webp)$/i);
    if (!m) continue;
    const num = Number.parseInt(m[1], 10);
    const questionId = `${packId}-q${m[1]}`;
    if (manifest.some((x) => x.questionNumber === num)) continue;
    manifest.push({
      questionNumber: num,
      questionId,
      illustrationSrc: `/assets/cisco/exhibits/${packId}/${name}`,
      sourceUrl: "",
    });
  }
  manifest.sort((a, b) => a.questionNumber - b.questionNumber);
  writeFileSync(join(packOut, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest.length;
}

function patchPackJson(packId, manifest) {
  const packPath = join(packsDir, `${packId}.json`);
  if (!existsSync(packPath)) return;
  const pack = JSON.parse(readFileSync(packPath, "utf8"));
  const byNum = new Map(manifest.map((m) => [m.questionNumber, m.illustrationSrc]));
  let patched = 0;
  for (const item of pack.items) {
    const src = byNum.get(item.number);
    if (src) {
      item.illustrationSrc = src;
      patched += 1;
    }
  }
  writeFileSync(packPath, `${JSON.stringify(pack, null, 2)}\n`);
  console.log(`  [json] ${packId}: ${patched} illustrationSrc gesetzt`);
}

async function main() {
  mkdirSync(outRoot, { recursive: true });
  let total = 0;
  for (const [packId, url] of Object.entries(PACK_URLS)) {
    console.log(`[scrape] ${packId}`);
    const res = await fetch(url, { headers: { "User-Agent": "LernenSchule/1.0" } });
    const html = await res.text();
    const manifestPath = join(outRoot, packId, "manifest.json");
    let manifest = [];
    const n = await processPack(packId, html);
    total += n;
    if (existsSync(manifestPath)) {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    }
    patchPackJson(packId, manifest);
    await new Promise((r) => setTimeout(r, 800));
  }
  console.log(`[scrape] ${total} Exhibit-Bilder gesamt`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
