/**
 * Parst ITExamAnswers-ähnliches HTML/Markdown → CiscoExamPack JSON (verbatim EN).
 * Usage:
 *   node scripts/import-cisco-html.mjs --pack modules-8-10 --in path/to/page.html
 *   node scripts/import-cisco-html.mjs --all   (alle HTML in imports/cisco/html/)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packsDir = join(root, "src", "cisco", "ccna1-v7", "packs");
const htmlDir = join(root, "imports", "cisco", "html");

const PACK_META = {
  /** Checkpoint-Prüfungen Module 1–17 */
  "modules-1-3": {
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-modules-1-3-basic-network-connectivity-and-communications-exam-answers.html",
    moduleRange: [1, 3],
    titleEn: "Modules 1–3: Basic Network Connectivity and Communications",
    titleDe: "Module 1–3: Netzwerkgrundlagen und Kommunikation",
  },
  "modules-4-7": {
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-modules-4-7-ethernet-concepts-exam-answers.html",
    moduleRange: [4, 7],
    titleEn: "Modules 4–7: Ethernet Concepts",
    titleDe: "Module 4–7: Ethernet-Konzepte",
  },
  "modules-8-10": {
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-modules-8-10-communicating-between-networks-exam-answers.html",
    moduleRange: [8, 10],
    titleEn: "Modules 8–10: Communicating Between Networks",
    titleDe: "Module 8–10: Kommunikation zwischen Netzwerken – Prüfungsantworten",
  },
  "modules-11-13": {
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-modules-11-13-ip-addressing-exam-answers-full.html",
    moduleRange: [11, 13],
    titleEn: "Modules 11–13: IP Addressing",
    titleDe: "Module 11–13: IP-Adressierung",
  },
  "modules-14-15": {
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-modules-14-15-network-application-communications-exam-answers.html",
    moduleRange: [14, 15],
    titleEn: "Modules 14–15: Network Application Communications",
    titleDe: "Module 14–15: Anwendungen im Netzwerk",
  },
  "modules-16-17": {
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-modules-16-17-building-and-securing-a-small-network-exam-answers.html",
    moduleRange: [16, 17],
    titleEn: "Modules 16–17: Building and Securing a Small Network",
    titleDe: "Module 16–17: Kleines Netzwerk aufbauen und absichern",
  },
  "practice-final": {
    sourceUrl:
      "https://itexamanswers.net/ccna-1-version-7-00-itnv7-practice-final-exam-answers.html",
    moduleRange: [1, 17],
    titleEn: "ITNv7 Practice Final Exam",
    titleDe: "Übungs-Abschlussprüfung ITN",
  },
  "course-final": {
    sourceUrl:
      "https://itexamanswers.net/ccna-1-v7-0-final-exam-answers-full-introduction-to-networks.html",
    moduleRange: [1, 17],
    titleEn: "CCNA 1 v7 Course Final Exam",
    titleDe: "Kurs-Abschlussprüfung CCNA 1",
  },
  "system-test": {
    sourceUrl:
      "https://itexamanswers.net/ccnav7-system-test-course-version-1-1-system-test-exam-answers.html",
    moduleRange: [1, 17],
    titleEn: "ITNv7 System Test Exam",
    titleDe: "System-Test",
  },
  "pt-skills-final": {
    sourceUrl:
      "https://itexamanswers.net/itn-version-7-00-final-pt-skills-assessment-ptsa-exam-answers.html",
    moduleRange: [1, 17],
    titleEn: "ITN Final PT Skills Assessment (PTSA)",
    titleDe: "Abschluss-PT-Fähigkeitenbeurteilung (PTSA)",
  },
};

function stripMd(s) {
  return s
    .replace(/\*\*/g, "")
    .replace(/\\_/g, "_")
    .replace(/​/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function modulesForRange([a, b]) {
  const m = [];
  for (let i = a; i <= b; i += 1) m.push(i);
  return m;
}

function parseOptions(block) {
  const lines = block.split("\n");
  const options = [];
  let optIdx = 0;
  const ids = "abcdef";
  for (const line of lines) {
    const bullet = line.match(/^\*+\s*(.*)$/);
    if (bullet) {
      let raw = bullet[1].trim();
      const correct = /\*\*[^*]+\*\*/.test(raw) || /^\*\*[^*]+\*\*$/.test(line.trim());
      raw = raw.replace(/\*\*/g, "").trim();
      if (!raw) continue;
      options.push({
        id: ids[optIdx] ?? `o${optIdx + 1}`,
        text: { en: stripMd(raw), de: null },
        correct,
      });
      optIdx += 1;
      continue;
    }
    const plain = line.trim();
    if (!plain || /^Explanation:/i.test(plain) || /^Place the options/i.test(plain)) continue;
    if (/^\|/.test(plain)) continue;
    const correct = /\*\*[^*]+\*\*/.test(plain);
    const raw = plain.replace(/\*\*/g, "").trim();
    if (raw.length < 2) continue;
    options.push({
      id: ids[optIdx] ?? `o${optIdx + 1}`,
      text: { en: stripMd(raw), de: null },
      correct,
    });
    optIdx += 1;
  }
  return options;
}

function parseHtmlMatchTable(block) {
  const pairs = [];
  const trRe = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let m;
  while ((m = trRe.exec(block))) {
    const left = stripHtml(m[1]);
    const right = stripHtml(m[2]);
    if (!left || !right || /place the options/i.test(left)) continue;
    pairs.push({ left: { en: left, de: null }, right: { en: right, de: null } });
  }
  return pairs;
}

function parseMatchTable(block) {
  const html = parseHtmlMatchTable(block);
  if (html.length >= 2) return html;
  const pairs = [];
  for (const line of block.split("\n")) {
    const m = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (!m) continue;
    const left = stripMd(m[1]);
    const right = stripMd(m[2]);
    if (!left || !right || left.includes("---") || left === "Place the options") continue;
    if (/^[-:]+$/.test(left)) continue;
    pairs.push({ left: { en: left, de: null }, right: { en: right, de: null } });
  }
  return pairs;
}

function parsePipeMatchPairs(text) {
  if (!text.includes("|")) return [];
  const parts = text
    .split("|")
    .map((s) => stripMd(s))
    .filter(Boolean);
  if (parts.length < 3) return [];
  const pairs = [];
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const left = parts[i];
    const right = parts[i + 1];
    if (!left || !right || /^place the options/i.test(left)) continue;
    pairs.push({ left: { en: left, de: null }, right: { en: right, de: null } });
  }
  return pairs;
}

function detectType(questionText, block, options) {
  const q = questionText.toLowerCase();
  if (/open the pt activity/i.test(q)) return "unsupported";
  if (/place the options|match the/i.test(q)) return "match";
  if (/choose two|choose three|\(choose two\)|\(choose three\)/i.test(q)) return "multi";
  const correctCount = options.filter((o) => o.correct).length;
  if (correctCount > 1) return "multi";
  if (options.length >= 2) return "single";
  if (parseMatchTable(block).length >= 2) return "match";
  return "unsupported";
}

function normalizeExamText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\*\*(\d+)\.\s+/g, "\n\n**$1\\. ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\*\*\*+/g, "\n* ")
    .replace(/\n\*\s*\*\*Explanation/g, "\n\n**Explanation")
    .replace(/([^\n])\*\*Explanation:\*\*/gi, "$1\n\n**Explanation:**")
    .replace(/([^\n])Explanation:\s*Topic/gi, "$1\n\nExplanation: Topic");
}

function sliceExamBody(text) {
  const markers = [
    "### Checkpoint Exam:",
    "Checkpoint Exam:",
  ];
  let start = -1;
  for (const m of markers) {
    const idx = text.indexOf(m);
    if (idx >= 0 && (start < 0 || idx < start)) start = idx;
  }
  const endMarkers = [
    "## Post navigation",
    "## Related Posts",
    "### Related Posts",
    "ITExamAnswers.net Copyright",
    "Related Posts",
    "CCNA v7.0 Exam Answers",
  ];
  let body = start >= 0 ? text.slice(start) : text;
  for (const em of endMarkers) {
    const idx = body.indexOf(em);
    if (idx > 200) body = body.slice(0, idx);
  }
  return body;
}

function splitQuestions(body) {
  const mdParts = body.split(/\*\*(\d+)\\.\s+/);
  if (mdParts.length > 3) return { mode: "md", parts: mdParts };

  const plain = [];
  const re = /(?:^|\n)(\d+)\.\s+/g;
  let match;
  const indices = [];
  while ((match = re.exec(body))) {
    indices.push({ num: Number.parseInt(match[1], 10), index: match.index + match[0].length });
  }
  if (indices.length < 3) return { mode: "md", parts: mdParts };

  const chunks = [];
  for (let i = 0; i < indices.length; i += 1) {
    const start = indices[i].index;
    const end = i + 1 < indices.length ? indices[i + 1].index - String(indices[i + 1].num).length - 2 : body.length;
    chunks.push({ num: indices[i].num, text: body.slice(start, end) });
  }
  return { mode: "plain", chunks };
}

function stripHtml(s) {
  return decodeHtml(
    s
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function decodeHtml(s) {
  return s
    .replace(/&#8211;/g, "–")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
}

function parseWordPressOptions(blockHtml) {
  const section = blockHtml.split(/<div[^>]*class="[^"]*message_box[^"]*success/i)[0] ?? blockHtml;
  const ulMatch = section.match(/<ul[^>]*>[\s\S]*?<\/ul>/i);
  if (!ulMatch) return [];
  const options = [];
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const ids = "abcdef";
  let m;
  let idx = 0;
  while ((m = liRe.exec(ulMatch[0]))) {
    const inner = m[1];
    const correct = /#ff0000/i.test(inner) || /color:\s*#f{2}0000/i.test(inner);
    const text = stripHtml(inner);
    if (!text || text.length < 2) continue;
    options.push({
      id: ids[idx] ?? `o${idx + 1}`,
      text: { en: text, de: null },
      correct,
    });
    idx += 1;
  }
  return options;
}

function sliceWordPressExamBody(text) {
  const startCandidates = [
    text.search(/<h3[^>]*>\s*Checkpoint Exam/i),
    text.search(/<h2[^>]*>[\s\S]{0,400}Practice Final/i),
    text.search(/<h3[^>]*>[\s\S]{0,200}Course Final Exam/i),
    text.search(/<h3[^>]*>\s*System Test/i),
    text.search(/<h3[^>]*>\s*ITN Final Skills Exam/i),
  ].filter((i) => i >= 0);
  let body = startCandidates.length ? text.slice(Math.min(...startCandidates)) : text;
  const endMarkers = [
    /<nav[^>]*class="[^"]*post-navigation/i,
    /<!-- Start Related Posts -->/i,
    /<h3[^>]*>\s*Search/i,
    /## Post navigation/i,
  ];
  for (const em of endMarkers) {
    const idx = body.search(em);
    if (idx > 500) body = body.slice(0, idx);
  }
  return body;
}

/** Findet nummerierte Checkpoint-Fragen inkl. Exhibit-<p> mit <br> und Bildern. */
function parseExhibitPre(chunk) {
  const m = chunk.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (!m) return undefined;
  return decodeHtml(m[1])
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "")
    .trim();
}

function findWordPressQuestionHits(body) {
  const patterns = [
    /<p[^>]*>\s*<strong>\s*(\d{1,3})\.(?!\d)\s*([\s\S]*?)<\/strong>/gi,
    /<p[^>]*>[\s\S]{0,4000}?<strong>\s*(\d{1,3})\.(?!\d)\s*([\s\S]*?)<\/strong>/gi,
  ];
  const hits = [];
  const seen = new Set();
  for (const qRe of patterns) {
    let m;
    while ((m = qRe.exec(body))) {
      const num = Number.parseInt(m[1], 10);
      if (num < 1 || num > 200 || seen.has(num)) continue;
      seen.add(num);
      hits.push({
        num,
        index: m.index,
        qEnd: m.index + m[0].length,
        qText: m[2],
      });
    }
  }
  hits.sort((a, b) => a.num - b.num);
  return hits;
}

/** ITExamAnswers WordPress HTML (2024+) — verbatim aus <p><strong>N. … */
function parsePtSkillsPack(text, packId, meta) {
  const modules = modulesForRange(meta.moduleRange);
  const scenarioRe =
    /<h3>Answers Key(?:\s*-\s*100% Score)?<\/h3>([\s\S]*?)(?=<h3>Answers Key|<h3>Download PDF|$)/gi;
  const items = [];
  let m;
  let num = 0;
  while ((m = scenarioRe.exec(text))) {
    num += 1;
    const chunk = m[1];
    const topo =
      chunk.match(/<img[^>]+src=["']([^"']+153921[^"']+)["']/i)?.[1] ??
      chunk.match(/<img[^>]+src=["']([^"']+wp-content[^"']+)["']/i)?.[1];
    const routerPre = chunk.match(
      /Router R1 configuration script[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/i
    )?.[1];
    const switchPre = chunk.match(
      /Switch S1 configuration script[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/i
    )?.[1];
    const idTag = chunk.match(/ID:\s*(\d+)/i)?.[1] ?? String(num).padStart(3, "0");
    const exhibitParts = [];
    if (routerPre) exhibitParts.push(parseExhibitPre(`<pre>${routerPre}</pre>`) ?? stripHtml(routerPre));
    if (switchPre) exhibitParts.push(parseExhibitPre(`<pre>${switchPre}</pre>`) ?? stripHtml(switchPre));
    items.push({
      id: `${packId}-q${String(num).padStart(3, "0")}`,
      packId,
      modules,
      number: num,
      type: "unsupported",
      verbatim: true,
      sourceUrl: meta.sourceUrl,
      needsManual: true,
      question: {
        en: `ITN Final PTSA — Scenario ID ${idTag} (Packet Tracer lab — see exhibit for R1/S1 config)`,
        de: null,
      },
      exhibitCode: exhibitParts.filter(Boolean).join("\n\n---\n\n") || undefined,
      illustrationSrc: topo
        ? `/assets/cisco/exhibits/${packId}/q${String(num).padStart(3, "0")}.jpg`
        : undefined,
    });
  }
  if (items.length === 0) {
    items.push({
      id: `${packId}-q001`,
      packId,
      modules,
      number: 1,
      type: "unsupported",
      verbatim: true,
      sourceUrl: meta.sourceUrl,
      needsManual: true,
      question: {
        en: "ITN Final PT Skills Assessment — open source page for full lab guide",
        de: null,
      },
    });
  }
  return {
    id: packId,
    course: "ccna1-itn-v7",
    title: { en: meta.titleEn, de: meta.titleDe },
    moduleRange: meta.moduleRange,
    sourceUrl: meta.sourceUrl,
    itemCount: items.length,
    items,
  };
}

function parseWordPressHtmlBody(text, packId, meta) {
  const body = sliceWordPressExamBody(text);
  const hits = findWordPressQuestionHits(body);
  const modules = modulesForRange(meta.moduleRange);
  const items = [];
  for (let i = 0; i < hits.length; i += 1) {
    const cur = hits[i];
    const nextStart = i + 1 < hits.length ? hits[i + 1].index : body.length;
    const chunk = body.slice(cur.qEnd, nextStart);
    let questionRaw = stripHtml(cur.qText);
    if (!questionRaw || questionRaw.length < 8) {
      const altM = chunk.match(
        /<p[^>]*>\s*<strong>(?!\s*\d+\.\s)([\s\S]*?)<\/strong>/i
      );
      if (altM) questionRaw = stripHtml(altM[1]);
    }
    if (!questionRaw || questionRaw.length < 8) continue;
    const explM = chunk.match(
      /<div[^>]*class="[^"]*message_box[^"]*success[^"]*"[^>]*>[\s\S]*?<strong>Explanation:<\/strong>\s*([\s\S]*?)<\/p>/i
    );
    const topicM = chunk.match(/Topic\s+([\d.]+)/i);
    const optHtml = chunk.replace(/<div[^>]*class="[^"]*message_box[\s\S]*?<\/div>/gi, "");
    const options = parseWordPressOptions(optHtml);
    let type = detectType(questionRaw, optHtml, options);
    const item = {
      id: `${packId}-q${String(cur.num).padStart(3, "0")}`,
      packId,
      modules,
      number: cur.num,
      type,
      verbatim: true,
      sourceUrl: meta.sourceUrl,
      topic:
        topicM?.[1] ??
        (explM ? stripHtml(explM[1]).match(/Topic\s+([\d.]+)/i)?.[1] : undefined),
      question: { en: questionRaw, de: null },
    };
    if (explM) {
      const expl = stripHtml(explM[1]);
      if (expl) item.explanation = { en: expl, de: null };
    }
    if (/refer to the exhibit/i.test(questionRaw)) {
      const pre = parseExhibitPre(chunk);
      if (pre) item.exhibitCode = pre;
    }
    if (type === "match") {
      item.matchPairs = parseMatchTable(chunk) ;
      if (!item.matchPairs?.length) item.type = "unsupported";
    } else if (type === "single" || type === "multi") {
      if (options.length < 2) {
        item.type = "unsupported";
        item.needsManual = true;
      } else {
        item.options = options;
        if (type === "single") {
          const correct = options.filter((o) => o.correct);
          if (correct.length !== 1) {
            const first = options.findIndex((o) => o.correct);
            options.forEach((o, idx) => {
              o.correct = idx === (first >= 0 ? first : 0);
            });
          }
        }
      }
    } else {
      item.needsManual = true;
    }
    items.push(item);
  }
  return {
    id: packId,
    course: "ccna1-itn-v7",
    title: { en: meta.titleEn, de: meta.titleDe },
    moduleRange: meta.moduleRange,
    sourceUrl: meta.sourceUrl,
    itemCount: items.length,
    items,
  };
}

function parseHtmlBody(text, packId, meta) {
  if (packId === "pt-skills-final") {
    return parsePtSkillsPack(text, packId, meta);
  }
  if (/<p[^>]*>[\s\S]*?<strong>\s*\d{1,3}\.(?!\d)/i.test(text)) {
    return parseWordPressHtmlBody(text, packId, meta);
  }
  const body = normalizeExamText(sliceExamBody(text));
  const split = splitQuestions(body);
  const items = [];
  const modules = modulesForRange(meta.moduleRange);

  const iterate = (num, chunk) => {
    if (!Number.isFinite(num)) return;
    const lines = chunk.split("\n");
    const qLines = [];
    let li = 0;
    for (; li < lines.length; li += 1) {
      const line = lines[li].trim();
      if (!line) continue;
      if (line.startsWith("* ") || line.startsWith("*")) break;
      if (/^Explanation:/i.test(line) || line.startsWith("**Explanation")) break;
      if (line.startsWith("Place the options")) {
        qLines.push(line);
        break;
      }
      qLines.push(line);
    }
    const questionRaw = qLines.join(" ").replace(/\*\*/g, "").trim();
    if (!questionRaw || questionRaw.length < 8) {
      items.push({
        id: `${packId}-q${String(num).padStart(3, "0")}`,
        packId,
        modules,
        number: num,
        type: "unsupported",
        verbatim: true,
        sourceUrl: meta.sourceUrl,
        needsManual: true,
        question: { en: `Item ${num} (image/PT — manual)`, de: null },
      });
      return;
    }

    const rest = lines.slice(li).join("\n");
    const explIdx = Math.min(
      rest.search(/\*\*Explanation:\*\*/i) >= 0 ? rest.search(/\*\*Explanation:\*\*/i) : Infinity,
      rest.search(/^Explanation:/im) >= 0 ? rest.search(/^Explanation:/im) : Infinity
    );
    const optBlock = Number.isFinite(explIdx) && explIdx < Infinity ? rest.slice(0, explIdx) : rest;
    const explBlock = Number.isFinite(explIdx) && explIdx < Infinity ? rest.slice(explIdx) : "";

    const options = parseOptions(optBlock);
    const matchPairs = parseMatchTable(optBlock + "\n" + chunk);
    let type = detectType(questionRaw, optBlock, options);

    let topic;
    const topicM = explBlock.match(/Topic\s+([\d.]+)/i);
    if (topicM) topic = topicM[1];

    const item = {
      id: `${packId}-q${String(num).padStart(3, "0")}`,
      packId,
      modules,
      number: num,
      type,
      verbatim: true,
      sourceUrl: meta.sourceUrl,
      topic,
      question: { en: stripMd(questionRaw), de: null },
      explanation: undefined,
    };

    if (explBlock) {
      const expl = stripMd(
        explBlock.replace(/^\*\*Explanation:\*\*/i, "").replace(/^Explanation:\s*/i, "")
      );
      if (expl) item.explanation = { en: expl, de: null };
    }

    if (type === "match") {
      let pairs = matchPairs;
      if (pairs.length < 2) pairs = parsePipeMatchPairs(questionRaw);
      if (pairs.length < 2) pairs = parsePipeMatchPairs(optBlock);
      if (pairs.length >= 2) {
        item.matchPairs = pairs;
        item.question = { en: stripMd(questionRaw.split("|")[0] ?? questionRaw), de: null };
      } else {
        item.type = "unsupported";
        item.needsManual = true;
      }
    } else if (type === "single" || type === "multi") {
      if (options.length < 2) {
        item.type = "unsupported";
        item.needsManual = true;
      } else {
        item.options = options;
        if (type === "single") {
          const correct = options.filter((o) => o.correct);
          if (correct.length !== 1) {
            const first = options.findIndex((o) => o.correct);
            options.forEach((o, idx) => {
              o.correct = idx === (first >= 0 ? first : 0);
            });
          }
        }
        if (type === "multi") {
          const correct = options.filter((o) => o.correct);
          if (correct.length < 2) item.type = "single";
        }
      }
    } else if (type === "unsupported") {
      item.needsManual = true;
    }

    items.push(item);
  };

  if (split.mode === "md") {
    for (let i = 1; i < split.parts.length; i += 2) {
      const num = Number.parseInt(split.parts[i], 10);
      if (!Number.isFinite(num)) continue;
      iterate(num, split.parts[i + 1] ?? "");
    }
  } else {
    for (const { num, text } of split.chunks) {
      iterate(num, text);
    }
  }

  return {
    id: packId,
    course: "ccna1-itn-v7",
    title: { en: meta.titleEn, de: meta.titleDe },
    moduleRange: meta.moduleRange,
    sourceUrl: meta.sourceUrl,
    itemCount: items.length,
    items,
  };
}

function writePack(pack) {
  mkdirSync(packsDir, { recursive: true });
  const out = join(packsDir, `${pack.id}.json`);
  writeFileSync(out, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  const mc = pack.items.filter((i) => i.type === "single" || i.type === "multi").length;
  const match = pack.items.filter((i) => i.type === "match").length;
  const bad = pack.items.filter((i) => i.type === "unsupported").length;
  console.log(`[import-cisco] ${pack.id}: ${pack.itemCount} items (MC ${mc}, match ${match}, manual ${bad}) → ${out}`);
}

function main() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const packArg =
    args.find((a) => a.startsWith("--pack="))?.split("=")[1] ??
    (args.indexOf("--pack") >= 0 ? args[args.indexOf("--pack") + 1] : undefined);
  const inArg =
    args.find((a) => a.startsWith("--in="))?.split("=")[1] ??
    (args.indexOf("--in") >= 0 ? args[args.indexOf("--in") + 1] : undefined);

  if (packArg && inArg) {
    const meta = PACK_META[packArg];
    if (!meta) throw new Error(`Unknown pack: ${packArg}`);
    const text = readFileSync(inArg, "utf8");
    writePack(parseHtmlBody(text, packArg, meta));
    return;
  }

  if (all) {
    for (const [packId, meta] of Object.entries(PACK_META)) {
      const htmlPath = join(htmlDir, `${packId}.html`);
      if (!existsSync(htmlPath)) {
        console.warn(`[import-cisco] skip ${packId} — missing ${htmlPath}`);
        continue;
      }
      const text = readFileSync(htmlPath, "utf8");
      writePack(parseHtmlBody(text, packId, meta));
    }
    return;
  }

  console.log(`Usage:
  node scripts/import-cisco-html.mjs --pack=modules-8-10 --in=path/to/file.html
  node scripts/import-cisco-html.mjs --all`);
}

main();
