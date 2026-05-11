import { describe, expect, it } from "vitest";
import {
  applyLeitnerReview,
  defaultLeitnerState,
  estimatedRetention,
} from "../../learning/leitnerEngine";

describe("Ebbinghaus / Leitner — estimatedRetention", () => {
  it("gibt bei elapsed=0 Wert nahe 1 zurück", () => {
    const r = estimatedRetention(0, 1, 2.5);
    expect(r).toBeGreaterThan(0.99);
    expect(r).toBeLessThanOrEqual(1);
  });

  it("fällt monoton mit der Zeit (exponentielle Vergessenskurve)", () => {
    const interval = 3;
    const ease = 2.2;
    const r0 = estimatedRetention(0, interval, ease);
    const r1 = estimatedRetention(2, interval, ease);
    const r2 = estimatedRetention(5, interval, ease);
    expect(r0).toBeGreaterThan(r1);
    expect(r1).toBeGreaterThan(r2);
    expect(r2).toBeGreaterThan(0);
    expect(r2).toBeLessThan(1);
  });

  it("skaliert Stärke mit Intervall × ease — längeres Intervall → höhere Retention bei gleichem elapsed", () => {
    const elapsed = 2;
    const ease = 2.2;
    const rShort = estimatedRetention(elapsed, 1, ease);
    const rLong = estimatedRetention(elapsed, 8, ease);
    expect(rLong).toBeGreaterThan(rShort);
  });

  it("stärkerer easeFactor erhöht die effektive Stärke (langsamerer Verfall)", () => {
    const elapsed = 4;
    const interval = 3;
    const rLowEase = estimatedRetention(elapsed, interval, 1.4);
    const rHighEase = estimatedRetention(elapsed, interval, 2.5);
    expect(rHighEase).toBeGreaterThan(rLowEase);
  });

  it("bleibt im Bereich (0, 1]", () => {
    for (const elapsed of [0, 0.5, 3, 30]) {
      const r = estimatedRetention(elapsed, 2, 2.5);
      expect(r).toBeGreaterThan(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });
});

describe("Leitner-Intervalle — applyLeitnerReview", () => {
  const t0 = 1_700_000_000_000;

  it("bei falsch: Fach 1, Intervall 0, easeFactor sinkt", () => {
    const prev = { ...defaultLeitnerState(), box: 4, easeFactor: 2.4, intervalDays: 14 };
    const next = applyLeitnerReview(prev, false, t0);
    expect(next.box).toBe(1);
    expect(next.intervalDays).toBe(0);
    expect(next.repetitions).toBe(0);
    expect(next.easeFactor).toBeLessThan(prev.easeFactor);
    expect(next.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("bei richtig: erste Wiederholung setzt Intervall auf 1 Tag", () => {
    const prev = defaultLeitnerState();
    const next = applyLeitnerReview(prev, true, t0);
    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBeGreaterThanOrEqual(1);
    expect(next.box).toBe(2);
    expect(next.nextDueAt).toBe(t0 + next.intervalDays * 86400000);
  });

  it("bei richtig: zweite Wiederholung nutzt SM-2-Staffel (6 Tage)", () => {
    let s = applyLeitnerReview(defaultLeitnerState(), true, t0);
    s = applyLeitnerReview(s, true, t0 + 1000);
    expect(s.repetitions).toBe(2);
    expect(s.intervalDays).toBe(6);
  });

  it("skaliert Intervall multiplikativ nach mehreren Treffern (ease × vorheriges Intervall)", () => {
    let s = defaultLeitnerState();
    const times = [t0, t0 + 1e6, t0 + 2e6, t0 + 3e6];
    const intervals: number[] = [];
    for (let i = 0; i < times.length; i += 1) {
      s = applyLeitnerReview(s, true, times[i]!);
      intervals.push(s.intervalDays);
    }
    for (let i = 1; i < intervals.length; i += 1) {
      expect(intervals[i]!).toBeGreaterThanOrEqual(1);
    }
    expect(intervals[intervals.length - 1]!).toBeGreaterThanOrEqual(intervals[1]!);
  });
});
