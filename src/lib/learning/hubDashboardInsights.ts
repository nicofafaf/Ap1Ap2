import type { LearningField } from "../../data/nexusRegistry";
import type { CombatLearningEvent } from "../../store/useGameStore";
import type { LeitnerCardState } from "./leitnerEngine";
import { getAllLfCourseMeta, getLfCourseMeta } from "./lfCourseCatalog";
import { getPlatformExerciseTotal } from "./lfExerciseTotals";

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
  const practiceToolCount = getAllLfCourseMeta().reduce((acc, m) => acc + m.tools.length, 0);
  return {
    totalExercises: getPlatformExerciseTotal(),
    learningFieldCount: 12,
    practiceToolCount: Math.max(6, practiceToolCount),
    examTrackCount: 2,
  };
}

function findLfForExerciseId(exerciseId: string): number | null {
  const fromId = parseLfFromExerciseId(exerciseId);
  if (fromId) return fromId;
  for (const meta of getAllLfCourseMeta()) {
    if (meta.missions.some((m) => m.id === exerciseId)) return meta.lf;
  }
  return null;
}

export function getHubContinueTarget(
  lastEvent: CombatLearningEvent | undefined,
  learningCorrectByLf: Readonly<Partial<Record<LearningField, string[]>>>,
): HubContinueTarget | null {
  if (!lastEvent?.exerciseId) return null;
  const lf = findLfForExerciseId(lastEvent.exerciseId) ?? 1;
  const meta = getLfCourseMeta(lf);
  const total = meta?.totalExercises ?? 0;
  const solved = new Set(learningCorrectByLf[`LF${lf}` as LearningField] ?? []).size;
  const title = lastEvent.title?.trim() || lastEvent.exerciseId;
  const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;
  return { lf, title, exerciseId: lastEvent.exerciseId, solved, total, pct };
}

export function getHubLearningTip(
  _leitner: Readonly<Record<string, LeitnerCardState>>,
  learningCorrectByLf: Readonly<Partial<Record<LearningField, string[]>>>,
): HubLearningTip {
  let weakestLf = 1;
  let weakestRatio = 1;
  let totalEx = 0;
  let mastered = 0;

  for (const meta of getAllLfCourseMeta()) {
    const solved = new Set(learningCorrectByLf[meta.lfKey] ?? []).size;
    const total = meta.totalExercises;
    totalEx += total;
    mastered += Math.min(solved, total);
    const ratio = total > 0 ? solved / total : 0;
    if (ratio < weakestRatio) {
      weakestRatio = ratio;
      weakestLf = meta.lf;
    }
  }

  const meta = getLfCourseMeta(weakestLf);
  const lfTitle = meta?.title ?? `LF${weakestLf}`;
  const examReadyPct =
    totalEx > 0 ? Math.min(100, Math.round((mastered / totalEx) * 100)) : 0;

  const message =
    weakestRatio < 0.2
      ? `Hier kannst du starten: ${lfTitle}. Nimm dir heute 15 Minuten für LF${weakestLf} — kurz lesen, Fragen beantworten, weiter`
      : examReadyPct < 25
        ? `Guter Start! Wähle ein Lernfeld auf der Karte und schließe die ersten Übungen ab — so siehst du sofort, wo du stehst`
        : `Du bist auf Kurs (${examReadyPct}% der Übungen mindestens einmal richtig). Als Nächstes lohnt sich LF${weakestLf}: ${lfTitle}`;

  return { lf: weakestLf, lfTitle, message, examReadyPct };
}
