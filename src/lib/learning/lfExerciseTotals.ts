import type { LearningField } from "../../data/nexusRegistry";

/**
 * Übungsanzahl je LF — für Hub/Karte ohne das volle Curriculum-Bundle zu laden.
 * Bei Curriculum-Änderungen: `npm run audit:curriculum` und Werte anpassen.
 */
export const LF_EXERCISE_TOTAL: Record<LearningField, number> = {
  LF1: 77,
  LF2: 69,
  LF3: 50,
  LF4: 47,
  LF5: 39,
  LF6: 36,
  LF7: 38,
  LF8: 38,
  LF9: 42,
  LF10: 42,
  LF11: 31,
  LF12: 30,
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
