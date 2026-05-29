import type { LearningExercise, LearningMcOption } from "./learningExerciseTypes";

export type CompactDrill = {
  id: string;
  title: string;
  problem: string;
  solution: string;
  question: string;
  correct: string;
  wrong: [string, string, string];
  hints?: [string, string, string];
  lang?: LearningExercise["lang"];
};

export function compactToExercise(lf: number, drill: CompactDrill): LearningExercise {
  const prefix = `lf${lf}-drill-`;
  const id = drill.id.startsWith(prefix) ? drill.id : `${prefix}${drill.id}`;
  const hints = drill.hints ?? [
    "Das trifft den Kern der Frage nicht",
    "Prüfungsklassiker — andere Antwort passt besser",
    "Typische Verwechslung — lies die Aufgabe noch einmal",
  ];
  const mcOptions: LearningMcOption[] = [
    { id: "a", text: drill.correct, isCorrect: true },
    { id: "b", text: drill.wrong[0], isCorrect: false, whyWrongHint: hints[0] },
    { id: "c", text: drill.wrong[1], isCorrect: false, whyWrongHint: hints[1] },
    { id: "d", text: drill.wrong[2], isCorrect: false, whyWrongHint: hints[2] },
  ];
  return {
    id,
    title: drill.title,
    problem: drill.problem,
    solutionCode: drill.solution,
    lang: drill.lang ?? "markdown",
    mcQuestion: drill.question,
    mcOptions,
  };
}

export function drillsForLf(lf: number, items: CompactDrill[]): LearningExercise[] {
  return items.map((d) => compactToExercise(lf, d));
}
