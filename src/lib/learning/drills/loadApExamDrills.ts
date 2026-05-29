import type { LearningField } from "../../../data/nexusRegistry";
import type { LearningExercise } from "../learningExerciseTypes";
import { drillsForLf, type CompactDrill } from "../drillFactory";
import { AP_EXAM_DRILLS_BY_LF } from "./apExamDrillData";

const LF_NUM: Record<LearningField, number> = {
  LF1: 1,
  LF2: 2,
  LF3: 3,
  LF4: 4,
  LF5: 5,
  LF6: 6,
  LF7: 7,
  LF8: 8,
  LF9: 9,
  LF10: 10,
  LF11: 11,
  LF12: 12,
};

const LF_KEYS = Object.keys(LF_NUM) as LearningField[];

/** Pro LF: kuratierte Prüfungs-Drills statt ~50 generischer Karten */
const MAX_AP_DRILLS_PER_LF = 28;
const MIN_DRILL_QUESTION_CHARS = 12;

function pickCuratedApDrills(items: CompactDrill[]): CompactDrill[] {
  const seenQuestions = new Set<string>();
  const out: CompactDrill[] = [];
  for (const drill of items) {
    const q = drill.question.trim();
    if (q.length < MIN_DRILL_QUESTION_CHARS) continue;
    if (seenQuestions.has(q)) continue;
    seenQuestions.add(q);
    out.push(drill);
    if (out.length >= MAX_AP_DRILLS_PER_LF) break;
  }
  return out;
}

/** AP1/AP2-Drills als LearningExercise (IDs: lf{n}-drill-…). */
export function loadApExamDrills(): Record<LearningField, LearningExercise[]> {
  const out = {} as Record<LearningField, LearningExercise[]>;
  for (const lf of LF_KEYS) {
    const n = LF_NUM[lf];
    const raw = (AP_EXAM_DRILLS_BY_LF[lf] ?? []) as CompactDrill[];
    out[lf] = drillsForLf(n, pickCuratedApDrills(raw));
  }
  return out;
}
