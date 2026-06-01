import type { LearningField } from "../../data/nexusRegistry";

/**
 * Übungsanzahl je LF — für Hub/Karte ohne das volle Curriculum-Bundle zu laden.
 * Bei Curriculum-Änderungen: `npm run audit:curriculum` und Werte anpassen.
 */
export const LF_EXERCISE_TOTAL: Record<LearningField, number> = {
  LF1: 74,
  LF2: 65,
  LF3: 46,
  LF4: 45,
  LF5: 49,
  LF6: 35,
  LF7: 30,
  LF8: 36,
  LF9: 40,
  LF10: 38,
  LF11: 29,
  LF12: 28,
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
