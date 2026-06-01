import type { LearningField } from "../../data/nexusRegistry";

/**
 * Übungsanzahl je LF — für Hub/Karte ohne das volle Curriculum-Bundle zu laden.
 * Bei Curriculum-Änderungen: `npm run audit:curriculum` und Werte anpassen.
 */
export const LF_EXERCISE_TOTAL: Record<LearningField, number> = {
  LF1: 41,
  LF2: 56,
  LF3: 40,
  LF4: 40,
  LF5: 38,
  LF6: 30,
  LF7: 25,
  LF8: 31,
  LF9: 35,
  LF10: 24,
  LF11: 24,
  LF12: 23,
};

export function getLfExerciseTotal(lf: LearningField): number {
  return LF_EXERCISE_TOTAL[lf] ?? 0;
}

export function getPlatformExerciseTotal(): number {
  let sum = 0;
  for (let n = 1; n <= 12; n += 1) {
    sum += LF_EXERCISE_TOTAL[`LF${n}` as LearningField] ?? 0;
  }
  return sum;
}
