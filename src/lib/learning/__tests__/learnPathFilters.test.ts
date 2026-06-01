import { describe, expect, it } from "vitest";
import { isExamPathMission, isLearnPathMission } from "../learnPathFilters";

describe("learnPathFilters", () => {
  it("marks Prüfung and IHK topics as exam-only", () => {
    expect(isExamPathMission({ topic: "Prüfung · LF3" })).toBe(true);
    expect(isExamPathMission({ topic: "IHK WiSo 2026 · Aufgabe 1" })).toBe(true);
    expect(isExamPathMission({ id: "ihk26-wiso-01" })).toBe(true);
    expect(isExamPathMission({ learnPhase: "pruefung" })).toBe(true);
  });

  it("keeps Grundlagen in learn path", () => {
    expect(isLearnPathMission({ topic: "Netzwerk-Grundidee", id: "lf3-start" })).toBe(true);
    expect(isLearnPathMission({ topic: "CCNA Ethernet Concepts" })).toBe(true);
  });
});
