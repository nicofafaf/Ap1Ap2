import { describe, expect, it } from "vitest";
import { CCNA1_ITN_17_MODULES, CCNA1_ITN_PACKS } from "../../../cisco/ccna1-v7/examCatalog";
import {
  ensureCiscoPacksLoaded,
  getAllCiscoPacks,
  totalCiscoMcCount,
  totalCiscoQuizCount,
} from "../../../cisco/ccna1-v7/loadPacks";
import { ciscoQuestionToLearningExercise } from "../../../cisco/ccna1-v7/ciscoToLearningExercise";

describe("CCNA1 ITN packs", () => {
  it("covers all 17 curriculum modules via six checkpoint packs", () => {
    expect(CCNA1_ITN_17_MODULES).toHaveLength(17);
    expect(CCNA1_ITN_PACKS.filter((p) => p.id.startsWith("modules-"))).toHaveLength(6);
    const mods = new Set(CCNA1_ITN_17_MODULES.map((m) => m.module));
    expect(mods.size).toBe(17);
  });

  it("loads imported JSON with substantial MC bank", async () => {
    await ensureCiscoPacksLoaded();
    const packs = getAllCiscoPacks();
    expect(packs.length).toBeGreaterThanOrEqual(8);
    const mcTotal = totalCiscoMcCount();
    expect(mcTotal).toBeGreaterThan(300);
    expect(totalCiscoQuizCount()).toBeGreaterThan(mcTotal);
    const matchItem = packs
      .flatMap((p) => p.items)
      .find((i) => i.type === "match");
    if (matchItem) {
      const ex = ciscoQuestionToLearningExercise(matchItem);
      expect(ex?.mcSelectMode).toBe("match");
      expect(ex?.matchPairs?.length).toBeGreaterThanOrEqual(2);
    }
    for (const pack of packs) {
      if (!pack.id.startsWith("modules-")) continue;
      expect(pack.itemCount).toBeGreaterThan(40);
      for (const item of pack.items) {
        if (item.type === "single" || item.type === "multi") {
          expect(item.question.en.length).toBeGreaterThan(10);
          expect(item.options?.length).toBeGreaterThanOrEqual(2);
          expect(item.verbatim).toBe(true);
        }
      }
    }
  });
});
