import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import modules13 from "../../../cisco/ccna1-v7/packs/modules-1-3.json";
import modules47 from "../../../cisco/ccna1-v7/packs/modules-4-7.json";
import modules810 from "../../../cisco/ccna1-v7/packs/modules-8-10.json";
import modules1113 from "../../../cisco/ccna1-v7/packs/modules-11-13.json";
import modules1415 from "../../../cisco/ccna1-v7/packs/modules-14-15.json";
import modules1617 from "../../../cisco/ccna1-v7/packs/modules-16-17.json";
import type { CiscoExamPack } from "../../../cisco/types";
import {
  assertExhibitCoverage,
  assertManifestSync,
  assertPackMatchesHtml,
  type CcnaModulePackId,
  type ExhibitManifestEntry,
} from "../ciscoPackFaithfulness";

function loadModulePackHtml(packId: CcnaModulePackId): string {
  const htmlPath = join(process.cwd(), "imports", "cisco", "html", `${packId}.html`);
  return readFileSync(htmlPath, "utf8");
}

function loadExhibitManifest(packId: CcnaModulePackId): ExhibitManifestEntry[] {
  const manifestPath = join(
    process.cwd(),
    "assets",
    "cisco",
    "exhibits",
    packId,
    "manifest.json"
  );
  if (!existsSync(manifestPath)) return [];
  return JSON.parse(readFileSync(manifestPath, "utf8")) as ExhibitManifestEntry[];
}

function assertExhibitFilesOnDisk(pack: CiscoExamPack, manifest: ExhibitManifestEntry[]): void {
  for (const item of pack.items) {
    if (!item.illustrationSrc) continue;
    const rel = item.illustrationSrc.replace(/^\//, "");
    const diskPath = join(process.cwd(), rel);
    if (!existsSync(diskPath)) {
      throw new Error(`${pack.id} #${item.number}: missing file ${diskPath}`);
    }
  }
  for (const entry of manifest) {
    const rel = entry.illustrationSrc.replace(/^\//, "");
    const diskPath = join(process.cwd(), rel);
    if (!existsSync(diskPath)) {
      throw new Error(`${pack.id} manifest #${entry.questionNumber}: missing file ${diskPath}`);
    }
  }
}

type PackSpotCheck = {
  pack: CiscoExamPack;
  minQuestions: number;
  q1: { type: "single" | "multi"; optionCount: number; correctEn: string };
  imageExhibits?: number[];
  codeExhibits?: { num: number; snippet: string; correctAnswer?: string }[];
};

const PACKS: Record<CcnaModulePackId, PackSpotCheck> = {
  "modules-1-3": {
    pack: modules13 as CiscoExamPack,
    minQuestions: 70,
    q1: { type: "single", optionCount: 4, correctEn: "spyware" },
    imageExhibits: [18, 43, 54],
  },
  "modules-4-7": {
    pack: modules47 as CiscoExamPack,
    minQuestions: 65,
    q1: {
      type: "single",
      optionCount: 4,
      correctEn: "transmitting bits across the local media",
    },
    imageExhibits: [30, 45, 46],
  },
  "modules-8-10": {
    pack: modules810 as CiscoExamPack,
    minQuestions: 75,
    q1: { type: "single", optionCount: 4, correctEn: "destination IP address" },
    imageExhibits: [15, 25, 28, 40, 43],
    codeExhibits: [
      { num: 53, snippet: "Payroll LAN", correctAnswer: "10.27.14.148" },
      { num: 76, snippet: "Medical LAN", correctAnswer: "192.168.201.200" },
    ],
  },
  "modules-11-13": {
    pack: modules1113 as CiscoExamPack,
    minQuestions: 65,
    q1: { type: "single", optionCount: 4, correctEn: "/27" },
    imageExhibits: [12, 14, 17, 28, 40],
  },
  "modules-14-15": {
    pack: modules1415 as CiscoExamPack,
    minQuestions: 55,
    q1: {
      type: "single",
      optionCount: 4,
      correctEn: "The client randomly selects a source port number.",
    },
  },
  "modules-16-17": {
    pack: modules1617 as CiscoExamPack,
    minQuestions: 60,
    q1: { type: "single", optionCount: 5, correctEn: "firewall" },
    imageExhibits: [23, 38, 39],
  },
};

for (const [packId, cfg] of Object.entries(PACKS) as [CcnaModulePackId, PackSpotCheck][]) {
  describe(`${packId} faithfulness vs itexamanswers.net`, () => {
    it("imports every numbered checkpoint question from the HTML export", () => {
      const html = loadModulePackHtml(packId);
      expect(() => assertPackMatchesHtml(cfg.pack, html)).not.toThrow();
      expect(cfg.pack.items.length).toBeGreaterThanOrEqual(cfg.minQuestions);
    });

    it("keeps question 1 options isolated (no bleed from later questions)", () => {
      const q1 = cfg.pack.items.find((i) => i.number === 1);
      expect(q1?.type).toBe(cfg.q1.type);
      expect(q1?.options?.length).toBe(cfg.q1.optionCount);
      const correct = q1?.options?.filter((o) => o.correct) ?? [];
      expect(correct).toHaveLength(1);
      expect(correct[0]?.text.en).toBe(cfg.q1.correctEn);
    });

    it("covers all exhibit questions with local assets or CLI blocks", () => {
      expect(() => assertExhibitCoverage(cfg.pack)).not.toThrow();
    });

    it("syncs exhibit manifest with pack JSON and on-disk files", () => {
      const manifest = loadExhibitManifest(packId);
      if (manifest.length === 0) {
        expect(cfg.imageExhibits ?? []).toHaveLength(0);
        return;
      }
      expect(() => assertManifestSync(cfg.pack, manifest)).not.toThrow();
      expect(() => assertExhibitFilesOnDisk(cfg.pack, manifest)).not.toThrow();
      expect(manifest.map((m) => m.questionNumber).sort((a, b) => a - b)).toEqual(
        [...(cfg.imageExhibits ?? [])].sort((a, b) => a - b)
      );
    });

    if (cfg.imageExhibits?.length) {
      it("links image exhibit questions to local assets", () => {
        for (const num of cfg.imageExhibits) {
          const item = cfg.pack.items.find((i) => i.number === num);
          expect(item?.question.en.toLowerCase()).toContain("refer to the exhibit");
          expect(item?.illustrationSrc).toMatch(
            new RegExp(
              `^/assets/cisco/exhibits/${packId}/q${String(num).padStart(3, "0")}\\.`
            )
          );
        }
      });
    }

    if (cfg.codeExhibits?.length) {
      it("imports CLI config exhibits for default-gateway questions", () => {
        for (const spot of cfg.codeExhibits) {
          const item = cfg.pack.items.find((i) => i.number === spot.num);
          expect(item?.exhibitCode).toContain(spot.snippet);
          if (spot.correctAnswer) {
            expect(
              item?.options?.some((o) => o.correct && o.text.en === spot.correctAnswer)
            ).toBe(true);
          }
        }
      });
    }
  });
}
