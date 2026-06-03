/**
 * Repariert „Open the PT Activity“-Fragen: Follow-up-MC aus ITExamAnswers nachladen.
 * Erhält vorhandene `de`-Felder in Pack-JSONs.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packsDir = join(root, "src", "cisco", "ccna1-v7", "packs");

function stripHtml(s) {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#8211;/g, "–")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseWordPressOptions(blockHtml) {
  const section = blockHtml.split(/<div[^>]*class="[^"]*message_box[^"]*success/i)[0] ?? blockHtml;
  const ulMatch = section.match(/<ul[^>]*>[\s\S]*?<\/ul>/i);
  if (!ulMatch) return [];
  const options = [];
  const ids = "abcdefgh";
  let idx = 0;
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = liRe.exec(ulMatch[0]))) {
    const correct = /#ff0000/i.test(m[1]) || /color:\s*#f{2}0000/i.test(m[1]);
    const text = stripHtml(m[1]);
    if (!text || text.length < 2) continue;
    options.push({ id: ids[idx] ?? `o${idx + 1}`, text: { en: text, de: null }, correct });
    idx += 1;
  }
  return options;
}

function extractPtIllustration(chunkHtml) {
  return (
    chunkHtml.match(/<img[^>]+src=["']([^"']+wp-content\/uploads[^"']+)["']/i)?.[1] ??
    chunkHtml.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ??
    null
  );
}

async function savePtIllustration(packId, num, imgUrl) {
  if (!imgUrl || !/^https?:\/\//i.test(imgUrl)) return undefined;
  const outDir = join(root, "assets", "cisco", "exhibits", packId);
  mkdirSync(outDir, { recursive: true });
  const ext = imgUrl.match(/\.(png|jpe?g|gif|webp)(\?|$)/i)?.[1]?.replace("jpeg", "jpg") ?? "jpg";
  const fileName = `q${String(num).padStart(3, "0")}.${ext}`;
  const dest = join(outDir, fileName);
  if (!existsSync(dest)) {
    const res = await fetch(imgUrl, {
      headers: { "User-Agent": "LernenSchule-Cisco-Import/1.0" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return undefined;
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  }
  return `/assets/cisco/exhibits/${packId}/${fileName}`;
}

function updateManifest(packId, num, illustrationSrc, sourceUrl) {
  const manifestPath = join(root, "assets", "cisco", "exhibits", packId, "manifest.json");
  let manifest = [];
  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch {
      manifest = [];
    }
  }
  const questionId = `${packId}-q${String(num).padStart(3, "0")}`;
  const existing = manifest.find((m) => m.questionNumber === num);
  if (existing) {
    existing.illustrationSrc = illustrationSrc;
    existing.sourceUrl = sourceUrl;
  } else {
    manifest.push({ questionNumber: num, questionId, illustrationSrc, sourceUrl });
  }
  manifest.sort((a, b) => a.questionNumber - b.questionNumber);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function extractPtFollowUp(chunkHtml) {
  const subQM =
    chunkHtml.match(
      /<p>\s*<strong>\s*((?:What|Which|How|Where|Refer|Match)[^<]+?\?(?:\s*\([^)]+\))?)\s*<\/strong>\s*<\/p>/i
    ) ??
    chunkHtml.match(
      /<strong>\s*((?:What|Which|How|Where|Refer|Match)[^<]+?\?(?:\s*\([^)]+\))?)\s*<\/strong>/i
    );
  if (!subQM) return null;
  const subQ = stripHtml(subQM[1]);
  const afterSub = chunkHtml.slice(chunkHtml.indexOf(subQM[0]) + subQM[0].length);
  const options = parseWordPressOptions(afterSub);
  if (options.length < 2) return null;

  const chooseN = /choose\s+(two|three|four)/i.test(subQ);
  let type = chooseN || options.filter((o) => o.correct).length > 1 ? "multi" : "single";

  if (type === "single") {
    const correct = options.filter((o) => o.correct);
    if (correct.length !== 1) {
      const first = options.findIndex((o) => o.correct);
      options.forEach((o, i) => {
        o.correct = i === (first >= 0 ? first : 0);
      });
    }
  } else if (options.filter((o) => o.correct).length < 2) {
    type = "single";
    options.forEach((o, i) => {
      o.correct = i === 0;
    });
  }

  return {
    type,
    question: { en: `PT Activity — ${subQ}`, de: null },
    options,
    illustrationSrc: extractPtIllustration(chunkHtml),
  };
}

function mergeLocaleBlock(existing, incoming) {
  if (!existing) return incoming;
  return {
    en: incoming.en ?? existing.en,
    de: existing.de?.trim() ? existing.de : incoming.de,
  };
}

function mergeOptions(existingOpts, newOpts) {
  return newOpts.map((opt, i) => ({
    ...opt,
    text: mergeLocaleBlock(existingOpts?.[i]?.text, opt.text),
  }));
}

function findQuestionChunk(html, num) {
  const re = new RegExp(
    `(?:<p[^>]*>\\s*)?(?:<strong>\\s*)?${num}\\.\\s*Open the PT Activity[\\s\\S]*?(?=(?:<p[^>]*>\\s*)?(?:<strong>\\s*)?${num + 1}\\.|$)`,
    "i"
  );
  const m = html.match(re);
  return m?.[0] ?? null;
}

async function patchPack(packId) {
  const path = join(packsDir, `${packId}.json`);
  const pack = JSON.parse(readFileSync(path, "utf8"));
  const html = await fetch(pack.sourceUrl, { signal: AbortSignal.timeout(45_000) }).then((r) =>
    r.text()
  );

  let fixed = 0;
  for (const item of pack.items) {
    const isPtUnsupported =
      item.type === "unsupported" && /open the pt activity/i.test(item.question?.en ?? "");
    const needsIllustrationFix =
      /PT Activity —/i.test(item.question?.en ?? "") &&
      /^https?:\/\//i.test(item.illustrationSrc ?? "");

    if (!isPtUnsupported && !needsIllustrationFix) continue;

    const chunkHtml = findQuestionChunk(html, item.number);
    if (!chunkHtml) {
      console.warn(`[patch-pt] ${packId} q${item.number}: chunk not found`);
      continue;
    }

    if (isPtUnsupported) {
      const followUp = extractPtFollowUp(chunkHtml);
      if (!followUp) {
        console.warn(`[patch-pt] ${packId} q${item.number}: no follow-up MC`);
        continue;
      }
      item.type = followUp.type;
      item.question = mergeLocaleBlock(item.question, followUp.question);
      item.options = mergeOptions(item.options, followUp.options);
      delete item.needsManual;
      fixed += 1;
      console.log(`[patch-pt] ${packId} q${item.number} → ${followUp.type}`);
    }

    const imgUrl = extractPtIllustration(chunkHtml);
    if (imgUrl) {
      const localSrc = await savePtIllustration(packId, item.number, imgUrl);
      if (localSrc) {
        item.illustrationSrc = localSrc;
        updateManifest(packId, item.number, localSrc, imgUrl);
        if (!isPtUnsupported) console.log(`[patch-pt] ${packId} q${item.number}: local exhibit`);
      }
    }
  }

  if (fixed > 0 || pack.items.some((i) => /PT Activity —/i.test(i.question?.en ?? ""))) {
    writeFileSync(path, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  }
  return fixed;
}

const packIds = ["modules-1-3", "modules-4-7", "modules-11-13", "modules-16-17"];

let total = 0;
for (const packId of packIds) {
  total += await patchPack(packId);
}
console.log(`[patch-pt] done — ${total} PT activity item(s) fixed`);
