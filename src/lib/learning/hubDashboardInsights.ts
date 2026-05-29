import type { LearningField } from "../../data/nexusRegistry";
import type { CombatLearningEvent } from "../../store/useGameStore";
import { computeLfErrorHeatmap } from "../math/learningAnalytics";
import type { LeitnerCardState } from "./leitnerEngine";
import { CURRICULUM_BY_LF } from "./learningRegistry";
import { getAllLfCourseMeta } from "./lfCourseCatalog";

export type HubPlatformStats = {
  totalExercises: number;
  learningFieldCount: number;
  practiceToolCount: number;
  examTrackCount: number;
};

export type HubContinueTarget = {
  lf: number;
  title: string;
  exerciseId: string;
  solved: number;
  total: number;
  pct: number;
};

export type HubLearningTip = {
  lf: number;
  lfTitle: string;
  message: string;
  examReadyPct: number;
};

function parseLfFromExerciseId(exerciseId: string): number | null {
  const m = /LF(\d{1,2})/i.exec(exerciseId);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 12 ? n : null;
}

export function getHubPlatformStats(): HubPlatformStats {
  let totalExercises = 0;
  for (let lf = 1; lf <= 12; lf += 1) {
    totalExercises += CURRICULUM_BY_LF[`LF${lf}` as LearningField]?.length ?? 0;
  }
  const practiceToolCount = getAllLfCourseMeta().reduce((acc, m) => acc + m.tools.length, 0);
  return {
    totalExercises,
    learningFieldCount: 12,
    practiceToolCount: Math.max(6, practiceToolCount),
    examTrackCount: 2,
  };
}

function findLfForExerciseId(exerciseId: string): number | null {
  const fromId = parseLfFromExerciseId(exerciseId);
  if (fromId) return fromId;
  for (let lf = 1; lf <= 12; lf += 1) {
    const key = `LF${lf}` as LearningField;
    if ((CURRICULUM_BY_LF[key] ?? []).some((e) => e.id === exerciseId)) return lf;
  }
  return null;
}

export function getHubContinueTarget(
  lastEvent: CombatLearningEvent | undefined,
  learningCorrectByLf: Readonly<Partial<Record<LearningField, string[]>>>,
): HubContinueTarget | null {
  if (!lastEvent?.exerciseId) return null;
  const lf = findLfForExerciseId(lastEvent.exerciseId) ?? 1;
  const lfKey = `LF${lf}` as LearningField;
  const total = CURRICULUM_BY_LF[lfKey]?.length ?? 0;
  const solved = new Set(learningCorrectByLf[lfKey] ?? []).size;
  const title = lastEvent.title?.trim() || lastEvent.exerciseId;
  const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;
  return { lf, title, exerciseId: lastEvent.exerciseId, solved, total, pct };
}

export function getHubLearningTip(
  leitner: Readonly<Record<string, LeitnerCardState>>,
  learningCorrectByLf: Readonly<Partial<Record<LearningField, string[]>>>,
  now = Date.now(),
): HubLearningTip {
  const heat = computeLfErrorHeatmap(leitner, now);
  const weakest = [...heat].sort((a, b) => b.strain - a.strain)[0];
  const lf = weakest?.lf ?? 1;
  const meta = getAllLfCourseMeta().find((m) => m.lf === lf);
  const lfTitle = meta?.title ?? `LF${lf}`;

  let totalEx = 0;
  let mastered = 0;
  for (let i = 1; i <= 12; i += 1) {
    const key = `LF${i}` as LearningField;
    const bag = CURRICULUM_BY_LF[key] ?? [];
    const have = new Set(learningCorrectByLf[key] ?? []);
    totalEx += bag.length;
    mastered += bag.filter((e) => have.has(e.id)).length;
  }
  const examReadyPct =
    totalEx > 0 ? Math.min(100, Math.round((mastered / totalEx) * 100)) : 0;

  const strain = weakest?.strain ?? 0;
  const message =
    strain > 0.35
      ? `Hier hakt es noch am meisten: ${lfTitle}. Nimm dir heute 15 Minuten nur für LF${lf} — kurze Wiederholung bringt mehr als stundenlanges Durchklicken`
      : examReadyPct < 25
        ? `Guter Start! Wähle ein Lernfeld auf der Karte und schließe die ersten Übungen ab — so siehst du sofort, wo du stehst`
        : `Du bist auf Kurs (${examReadyPct}% der Übungen mindestens einmal richtig). Als Nächstes lohnt sich LF${lf}: ${lfTitle}`;

  return { lf, lfTitle, message, examReadyPct };
}
