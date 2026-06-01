import { describe, expect, it } from "vitest";
import {
  isExamPathMission,
  isGrundlagePathMission,
  isLearnPathMission,
  isVertiefungPathMission,
} from "../learnPathFilters";

describe("learnPathFilters", () => {
  it("marks Prüfung and IHK topics as exam-only", () => {
    expect(isExamPathMission({ topic: "Prüfung · LF3" })).toBe(true);
    expect(isExamPathMission({ topic: "IHK WiSo 2026 · Aufgabe 1" })).toBe(true);
    expect(isExamPathMission({ id: "ihk26-wiso-01" })).toBe(true);
    expect(isExamPathMission({ learnPhase: "pruefung" })).toBe(true);
  });

  it("keeps Grundlagen in learn path", () => {
    expect(isGrundlagePathMission({ topic: "Netzwerk-Grundidee", id: "lf3-start", learnPhase: "grundlage" })).toBe(
      true
    );
    expect(isGrundlagePathMission({ topic: "SQL-Grundlagen", learnPhase: "grundlage" })).toBe(true);
  });

  it("routes story and multiverse to vertiefung after grundlage", () => {
    expect(isVertiefungPathMission({ topic: "Multiversum · Star Wars", id: "lf2-sw-raid0" })).toBe(true);
    expect(isVertiefungPathMission({ topic: "Corporate Espionage · Kuat", id: "lf1-mission-kuat" })).toBe(true);
    expect(isVertiefungPathMission({ topic: "CCNA Ethernet Concepts" })).toBe(true);
    expect(isVertiefungPathMission({ learnPhase: "grundlage" })).toBe(false);
  });

  it("learn path is grundlage or vertiefung but not exam", () => {
    expect(isLearnPathMission({ topic: "Prüfung · LF5" })).toBe(false);
    expect(isLearnPathMission({ learnPhase: "grundlage" })).toBe(true);
  });
});
