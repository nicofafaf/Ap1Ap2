export type LearningMcOption = {
  id: string;
  text: string;
  isCorrect: boolean;
  whyWrongHint?: string;
};

export type LearningExercise = {
  id: string;
  title: string;
  problem: string;
  solutionCode: string;
  lang: "sql" | "javascript" | "csharp" | "plain-text" | "markdown";
  mcQuestion: string;
  mcOptions: LearningMcOption[];
  /** Kurze Lektion vor der Aufgabe — Lern-App-Flow statt Prüfungs-Sprung */
  lessonCards?: Array<{
    title: string;
    body: string;
  }>;
  /** Optionales Einsteigerbeispiel, das vor der Übung erklärt wird */
  example?: {
    label: string;
    body: string;
  };
  /** Optional: Diagramm/Foto — bei 404 nur einmaliger Fallback, kein Retry */
  illustrationSrc?: string;
  /** Optional: Kurz-Hilfe unter der Aufgabe (ADHD-freundlich, ohne Extra-Scroll) */
  solutionHint?: string;
};
