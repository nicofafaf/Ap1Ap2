import wisoExamPath from "../../lernfelder/sommer2026/wisoExamPath.json";
import ga1ExamPath from "../../lernfelder/sommer2026/ga1ExamPath.json";
import ga2ExamPath from "../../lernfelder/sommer2026/ga2ExamPath.json";
import type { LearningField } from "../../data/nexusRegistry";

export type Sommer2026PackId = "wiso" | "ga1" | "ga2";

export type Sommer2026ExamPack = {
  id: Sommer2026PackId;
  /** Anzeige im Hub */
  title: string;
  subtitle: string;
  examDate: string;
  durationMinutes: number;
  taskCount: number;
  points: number;
  primaryLf: number;
  primaryLfKey: LearningField;
  missionIds: readonly string[];
};

const missionIdsFrom = (raw: Array<{ id?: string }>): string[] =>
  raw.map((m) => m.id?.trim() || "").filter(Boolean);

export const SOMMER2026_WISO_MS = 60 * 60 * 1000;
export const SOMMER2026_GA_MS = 90 * 60 * 1000;

export const SOMMER2026_EXAM_PACKS: Record<Sommer2026PackId, Sommer2026ExamPack> = {
  wiso: {
    id: "wiso",
    title: "WiSo · Teil 2",
    subtitle: "Wirtschafts- und Sozialkunde · CBA-IT-Service GmbH",
    examDate: "29.04.2026",
    durationMinutes: 60,
    taskCount: 30,
    points: 100,
    primaryLf: 1,
    primaryLfKey: "LF1",
    missionIds: missionIdsFrom(wisoExamPath),
  },
  ga1: {
    id: "ga1",
    title: "GA1 · Konzeption & Administration",
    subtitle: "Liebig GmbH · Webserver & IT-Systeme",
    examDate: "29.04.2026",
    durationMinutes: 90,
    taskCount: 4,
    points: 100,
    primaryLf: 2,
    primaryLfKey: "LF2",
    missionIds: missionIdsFrom(ga1ExamPath),
  },
  ga2: {
    id: "ga2",
    title: "GA2 · Netzwerke",
    subtitle: "IHK-BookWorm GmbH · RZ Köln & Filialen",
    examDate: "29.04.2026",
    durationMinutes: 90,
    taskCount: 4,
    points: 100,
    primaryLf: 10,
    primaryLfKey: "LF10",
    missionIds: missionIdsFrom(ga2ExamPath),
  },
};

export function getSommer2026Pack(id: Sommer2026PackId): Sommer2026ExamPack {
  return SOMMER2026_EXAM_PACKS[id];
}

export function getSommer2026DurationMs(id: Sommer2026PackId): number {
  return id === "wiso" ? SOMMER2026_WISO_MS : SOMMER2026_GA_MS;
}

export function buildSommer2026Queue(id: Sommer2026PackId): string[] {
  return [...getSommer2026Pack(id).missionIds];
}

export function getSommer2026PackProgress(
  packId: Sommer2026PackId,
  learningCorrectByLf: Readonly<Partial<Record<LearningField, string[]>>>
): { solved: number; total: number; pct: number } {
  const pack = getSommer2026Pack(packId);
  const correct = new Set([
    ...(learningCorrectByLf[pack.primaryLfKey] ?? []),
    ...(packId === "wiso" ? [] : []),
  ]);
  const solved = pack.missionIds.filter((mid) => correct.has(mid)).length;
  const total = pack.missionIds.length;
  const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;
  return { solved, total, pct };
}
