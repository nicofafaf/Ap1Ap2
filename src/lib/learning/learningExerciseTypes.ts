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
  /** Optional: Diagramm/Foto — bei 404 nur einmaliger Fallback, kein Retry */
  illustrationSrc?: string;
};
