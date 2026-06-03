import type { CiscoExamPack, CiscoPackId } from "../../cisco/types";

export const CCNA_MODULE_PACK_IDS = [
  "modules-1-3",
  "modules-4-7",
  "modules-8-10",
  "modules-11-13",
  "modules-14-15",
  "modules-16-17",
] as const satisfies readonly CiscoPackId[];

export type CcnaModulePackId = (typeof CCNA_MODULE_PACK_IDS)[number];

/** Golden checkpoint counts (verified vs ITExamAnswers HTML locally). */
export const CCNA_MODULE_PACK_GOLDEN: Record<CcnaModulePackId, { questionCount: number }> = {
  "modules-1-3": { questionCount: 75 },
  "modules-4-7": { questionCount: 70 },
  "modules-8-10": { questionCount: 76 },
  "modules-11-13": { questionCount: 71 },
  "modules-14-15": { questionCount: 61 },
  "modules-16-17": { questionCount: 67 },
};

export type ExhibitManifestEntry = {
  questionNumber: number;
  questionId: string;
  illustrationSrc: string;
  sourceUrl?: string;
};

/** Nummerierte Checkpoint-Fragen aus ITExamAnswers WordPress HTML. */
export function checkpointQuestionNums(html: string): number[] {
  const startCandidates = [
    html.search(/<h3[^>]*>\s*Checkpoint Exam/i),
    html.search(/<h2[^>]*>[\s\S]{0,400}Practice Final/i),
    html.search(/<h3[^>]*>[\s\S]{0,200}Course Final Exam/i),
    html.search(/<h3[^>]*>\s*System Test/i),
  ].filter((i) => i >= 0);
  let body = startCandidates.length ? html.slice(Math.min(...startCandidates)) : html;
  const end = body.search(/<nav[^>]*class="[^"]*post-navigation/i);
  if (end > 500) body = body.slice(0, end);
  const patterns = [
    /<p[^>]*>\s*<strong>\s*(\d{1,3})\.(?!\d)\s*([\s\S]*?)<\/strong>/gi,
    /<p[^>]*>[\s\S]{0,4000}?<strong>\s*(\d{1,3})\.(?!\d)\s*([\s\S]*?)<\/strong>/gi,
  ];
  const seen = new Set<number>();
  const nums: number[] = [];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      const n = Number.parseInt(m[1], 10);
      if (n < 1 || n > 200 || seen.has(n)) continue;
      seen.add(n);
      nums.push(n);
    }
  }
  return nums.sort((a, b) => a - b);
}

export function assertPackQuestionInventory(pack: CiscoExamPack, expectedCount: number): void {
  const nums = pack.items.map((i) => i.number).sort((a, b) => a - b);
  if (nums.length !== expectedCount) {
    throw new Error(`${pack.id}: expected ${expectedCount} questions, got ${nums.length}`);
  }
  const seen = new Set<number>();
  for (const n of nums) {
    if (n < 1) {
      throw new Error(`${pack.id}: invalid question number ${n}`);
    }
    if (seen.has(n)) {
      throw new Error(`${pack.id}: duplicate question number ${n}`);
    }
    seen.add(n);
  }
}

export function assertPackMatchesHtml(pack: CiscoExamPack, html: string): void {
  const expected = checkpointQuestionNums(html);
  const imported = pack.items.map((i) => i.number).sort((a, b) => a - b);
  if (JSON.stringify(imported) !== JSON.stringify(expected)) {
    const missing = expected.filter((n) => !imported.includes(n));
    const extra = imported.filter((n) => !expected.includes(n));
    throw new Error(
      `${pack.id}: import mismatch — missing [${missing.join(",")}] extra [${extra.join(",")}]`
    );
  }
}

/** Prüft Exhibit-Metadaten im JSON (Datei-Existenz nur in Node-Audit/Tests). */
export function assertExhibitCoverage(pack: CiscoExamPack): void {
  for (const item of pack.items) {
    if (!/refer to the exhibit/i.test(item.question.en)) continue;
    const hasImage = Boolean(item.illustrationSrc);
    const hasCode = Boolean(item.exhibitCode?.trim());
    if (!hasImage && !hasCode) {
      throw new Error(
        `${pack.id} #${item.number}: exhibit question without illustrationSrc or exhibitCode`
      );
    }
    if (hasImage) {
      const expectedPath = new RegExp(
        `^/assets/cisco/exhibits/${pack.id}/q${String(item.number).padStart(3, "0")}\\.`
      );
      if (!expectedPath.test(item.illustrationSrc!)) {
        throw new Error(
          `${pack.id} #${item.number}: unexpected illustrationSrc ${item.illustrationSrc}`
        );
      }
    }
  }
}

export function assertManifestSync(pack: CiscoExamPack, manifest: ExhibitManifestEntry[]): void {
  for (const entry of manifest) {
    const item = pack.items.find((i) => i.number === entry.questionNumber);
    if (!item?.illustrationSrc) {
      throw new Error(
        `${pack.id} manifest #${entry.questionNumber}: no matching illustrationSrc in pack JSON`
      );
    }
    if (item.illustrationSrc !== entry.illustrationSrc) {
      throw new Error(
        `${pack.id} #${entry.questionNumber}: manifest/json illustrationSrc mismatch`
      );
    }
  }
}
