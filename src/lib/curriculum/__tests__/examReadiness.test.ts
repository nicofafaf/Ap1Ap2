import { describe, expect, it } from "vitest";
import {
  LF02_EXAM_MISSION_IDS,
  buildExamReadinessSnapshot,
  getLf2ExamMissionProgress,
} from "../examReadiness";

describe("examReadiness", () => {
  it("tracks LF2 exam mission progress", () => {
    expect(LF02_EXAM_MISSION_IDS.length).toBe(15);
    const p = getLf2ExamMissionProgress({
      LF2: [LF02_EXAM_MISSION_IDS[0]!, LF02_EXAM_MISSION_IDS[1]!],
    });
    expect(p.solved).toBe(2);
    expect(p.total).toBe(15);
    expect(p.pct).toBe(13);
  });

  it("builds AP1/AP2 split snapshot", () => {
    const snap = buildExamReadinessSnapshot({}, {});
    expect(snap.rows).toHaveLength(12);
    expect(snap.ap1Total).toBeGreaterThan(0);
    expect(snap.ap2Total).toBeGreaterThan(0);
    expect(snap.mentorScore).toBeGreaterThanOrEqual(0);
    expect(snap.mentorScore).toBeLessThanOrEqual(100);
  });
});
