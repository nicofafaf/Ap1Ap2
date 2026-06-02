import { describe, expect, it } from "vitest";
import {
  SOMMER2026_EXAM_PACKS,
  SOMMER2026_GA_MS,
  SOMMER2026_WISO_MS,
  buildSommer2026Queue,
  getSommer2026DurationMs,
  getSommer2026Pack,
} from "../sommer2026Exams";

describe("IHK Sommer 2026 exam packs", () => {
  it("WiSo queue has 31 missions including bonus multi-select", () => {
    const pack = getSommer2026Pack("wiso");
    const queue = buildSommer2026Queue("wiso");
    expect(queue.length).toBe(31);
    expect(pack.missionIds.length).toBe(31);
    expect(queue).toContain("ihk26-wiso-31");
    expect(pack.taskCount).toBe(31);
  });

  it("GA1 and GA2 queues match mission id lists", () => {
    for (const id of ["ga1", "ga2"] as const) {
      const pack = getSommer2026Pack(id);
      const queue = buildSommer2026Queue(id);
      expect(queue.length).toBe(pack.missionIds.length);
      expect(queue.length).toBeGreaterThanOrEqual(10);
    }
  });

  it("exam durations are 60 or 90 minutes", () => {
    expect(getSommer2026DurationMs("wiso")).toBe(SOMMER2026_WISO_MS);
    expect(getSommer2026DurationMs("ga1")).toBe(SOMMER2026_GA_MS);
    expect(getSommer2026DurationMs("ga2")).toBe(SOMMER2026_GA_MS);
    expect(SOMMER2026_WISO_MS).toBe(60 * 60 * 1000);
    expect(SOMMER2026_GA_MS).toBe(90 * 60 * 1000);
  });

  it("primary LF keys match LF1 LF2 LF10", () => {
    expect(SOMMER2026_EXAM_PACKS.wiso.primaryLfKey).toBe("LF1");
    expect(SOMMER2026_EXAM_PACKS.ga1.primaryLfKey).toBe("LF2");
    expect(SOMMER2026_EXAM_PACKS.ga2.primaryLfKey).toBe("LF10");
  });
});
