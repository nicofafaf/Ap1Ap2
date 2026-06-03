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

export type ExhibitManifestEntry = {
  questionNumber: number;
  questionId: string;
  illustrationSrc: string;
  sourceUrl?: string;
};

/** Nummerierte Checkpoint-Fragen aus ITExamAnswers WordPress HTML. */
export function checkpointQuestionNums(html: string): number[] {
  const start = html.search(/<h3[^>]*>\s*Checkpoint Exam/i);
  let body = html.slice(start);
  const end = body.search(/<nav[^>]*class="[^"]*post-navigation/i);
  if (end > 500) body = body.slice(0, end);
  const re = /<p[^>]*>\s*<strong>\s*(\d+)\.\s*([\s\S]*?)<\/strong>(?:[\s\S]*?)<\/p>/gi;
  const seen = new Set<number>();
  const nums: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const n = Number.parseInt(m[1], 10);
    if (seen.has(n)) continue;
    seen.add(n);
    nums.push(n);
  }
  return nums.sort((a, b) => a - b);
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
