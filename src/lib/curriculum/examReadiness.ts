import type { LearningField } from "../../data/nexusRegistry";
import { buildNeuralMentorReport } from "../math/learningAnalytics";
import type { LeitnerCardState } from "../learning/leitnerEngine";
import { getAllLfCourseMeta } from "../learning/lfCourseCatalog";
import lf02ExamPath from "../../lernfelder/lf02/examPath.json";

export const LF02_EXAM_MISSION_IDS: readonly string[] = lf02ExamPath.map(
  (m) => m.id?.trim() || ""
).filter(Boolean);

export type LfReadinessRow = {
  lf: number;
  lfKey: LearningField;
  title: string;
  ap: string;
  solved: number;
  total: number;
  pct: number;
  /** Anteil gelöster Prüfungs-Missionen (nur LF mit examPath) */
  examMissionPct?: number;
  examMissionSolved?: number;
  examMissionTotal?: number;
};

export type ExamReadinessSnapshot = {
  overallPct: number;
  mentorScore: number;
  ap1Pct: number;
  ap2Pct: number;
  ap1Solved: number;
  ap1Total: number;
  ap2Solved: number;
  ap2Total: number;
  focusLf: number;
  rows: LfReadinessRow[];
};

function sumProgress(rows: LfReadinessRow[]): { solved: number; total: number; pct: number } {
  let solved = 0;
  let total = 0;
  for (const r of rows) {
    solved += r.solved;
    total += r.total;
  }
  const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;
  return { solved, total, pct };
}

export function getLf2ExamMissionProgress(
  learningCorrectByLf: Readonly<Partial<Record<LearningField, string[]>>>
): { solved: number; total: number; pct: number } {
  const correct = new Set(learningCorrectByLf.LF2 ?? []);
  const solved = LF02_EXAM_MISSION_IDS.filter((id) => correct.has(id)).length;
  const total = LF02_EXAM_MISSION_IDS.length;
  const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;
  return { solved, total, pct };
}

export function buildExamReadinessSnapshot(
  leitner: Readonly<Record<string, LeitnerCardState>>,
  learningCorrectByLf: Readonly<Partial<Record<LearningField, string[]>>>
): ExamReadinessSnapshot {
  const mentor = buildNeuralMentorReport(leitner, learningCorrectByLf);
  const lf2Exam = getLf2ExamMissionProgress(learningCorrectByLf);

  const rows: LfReadinessRow[] = getAllLfCourseMeta().map((meta) => {
    const solved = new Set(learningCorrectByLf[meta.lfKey] ?? []).size;
    const total = meta.totalExercises;
    const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;
    const row: LfReadinessRow = {
      lf: meta.lf,
      lfKey: meta.lfKey,
      title: meta.title,
      ap: meta.ap,
      solved,
      total,
      pct,
    };
    if (meta.lf === 2) {
      row.examMissionSolved = lf2Exam.solved;
      row.examMissionTotal = lf2Exam.total;
      row.examMissionPct = lf2Exam.pct;
    }
    return row;
  });

  const ap1Rows = rows.filter((r) => r.lf <= 6);
  const ap2Rows = rows.filter((r) => r.lf > 6);
  const ap1 = sumProgress(ap1Rows);
  const ap2 = sumProgress(ap2Rows);
  const overall = sumProgress(rows);

  let focusLf = 1;
  let minRatio = Number.POSITIVE_INFINITY;
  for (const r of rows) {
    const ratio = r.total > 0 ? r.solved / r.total : 0;
    if (ratio < minRatio) {
      minRatio = ratio;
      focusLf = r.lf;
    }
  }

  return {
    overallPct: overall.pct,
    mentorScore: mentor.examReadyScore,
    ap1Pct: ap1.pct,
    ap2Pct: ap2.pct,
    ap1Solved: ap1.solved,
    ap1Total: ap1.total,
    ap2Solved: ap2.solved,
    ap2Total: ap2.total,
    focusLf,
    rows,
  };
}
