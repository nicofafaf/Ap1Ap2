import { describe, expect, it } from "vitest";
import { CURRICULUM_BY_LF } from "../learningRegistry";
import { LF_EXERCISE_TOTAL } from "../lfExerciseTotals";

describe("curriculum exercise totals", () => {
  it("LF_EXERCISE_TOTAL matches actual bag sizes", () => {
    const mismatches: string[] = [];
    for (const lf of Object.keys(CURRICULUM_BY_LF) as (keyof typeof CURRICULUM_BY_LF)[]) {
      const declared = LF_EXERCISE_TOTAL[lf];
      const actual = CURRICULUM_BY_LF[lf].length;
      if (declared !== actual) {
        mismatches.push(`${lf}: declared ${declared}, actual ${actual}`);
      }
    }
    expect(mismatches, mismatches.join("\n")).toEqual([]);
  });

  it("has no duplicate exercise ids per LF", () => {
    const dupes: string[] = [];
    for (const lf of Object.keys(CURRICULUM_BY_LF) as (keyof typeof CURRICULUM_BY_LF)[]) {
      const ids = CURRICULUM_BY_LF[lf].map((e) => e.id);
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) dupes.push(`${lf}: duplicate ${id}`);
        seen.add(id);
      }
    }
    expect(dupes, dupes.join("\n")).toEqual([]);
  });
});
