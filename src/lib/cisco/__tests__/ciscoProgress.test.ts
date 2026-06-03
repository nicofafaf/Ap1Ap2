import { describe, expect, it } from "vitest";
import { defaultLeitnerState } from "../../learning/leitnerEngine";
import {
  buildCiscoWeaknessExerciseIds,
  ciscoPackIdFromExerciseId,
  ciscoPackProgress,
  isCiscoExerciseId,
  rankCiscoModuleWeaknesses,
} from "../ciscoProgress";

describe("ciscoProgress", () => {
  it("detects Cisco exercise ids", () => {
    expect(isCiscoExerciseId("modules-8-10-q001")).toBe(true);
    expect(isCiscoExerciseId("LF5-sql-001")).toBe(false);
    expect(ciscoPackIdFromExerciseId("modules-8-10-q042")).toBe("modules-8-10");
  });

  it("computes pack progress from Leitner", () => {
    const leitner = {
      "modules-1-3-q001": { ...defaultLeitnerState(), repetitions: 2, box: 4 },
      "modules-1-3-q002": { ...defaultLeitnerState(), repetitions: 0, box: 1 },
    };
    const p = ciscoPackProgress(leitner, "modules-1-3", 75);
    expect(p.solved).toBe(1);
    expect(p.total).toBe(75);
  });

  it("ranks module weaknesses by leitner strain", () => {
    const now = Date.now();
    const leitner = {
      "modules-8-10-q001": {
        ...defaultLeitnerState(),
        box: 1,
        lastReviewedAt: now - 86400000 * 10,
        nextDueAt: now - 86400000,
      },
      "modules-1-3-q001": {
        ...defaultLeitnerState(),
        box: 5,
        lastReviewedAt: now,
        nextDueAt: now + 86400000 * 14,
      },
    };
    const ranked = rankCiscoModuleWeaknesses(leitner, 2);
    expect(ranked[0]?.module).toBe(8);
  });

  it("builds weakness queue sorted by strain", () => {
    const now = Date.now();
    const leitner = {
      "modules-8-10-q001": {
        ...defaultLeitnerState(),
        box: 1,
        lastReviewedAt: now - 86400000 * 5,
        nextDueAt: now - 1000,
      },
      "modules-8-10-q002": {
        ...defaultLeitnerState(),
        box: 5,
        lastReviewedAt: now,
        nextDueAt: now + 86400000 * 7,
      },
    };
    const q = buildCiscoWeaknessExerciseIds(leitner, "modules-8-10", 10);
    expect(q[0]).toBe("modules-8-10-q001");
  });
});
