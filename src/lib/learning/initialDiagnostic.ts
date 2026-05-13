import type { LearningField } from "../../data/nexusRegistry";
import type { LearningExercise } from "./learningExerciseTypes";
import { CURRICULUM_BY_LF } from "./learningRegistry";

/** Erste Curriculum-Übung je LF für den Kurz-Diagnose-Scan */
export function getFirstDiagnosticExercise(lf: LearningField): LearningExercise | null {
  const bag = CURRICULUM_BY_LF[lf];
  if (!bag?.length) return null;
  return bag[0] ?? null;
}
