import type { LearningExercise, LearningMatchPair, LearningMcOption } from "../../lib/learning/learningExerciseTypes";
import type { CiscoQuestion } from "../types";
import { matchPromptFromQuestion, resolveCiscoMatchPairs } from "./parseMatchPairs";

const OPT_IDS = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function ciscoQuestionToLearningExercise(q: CiscoQuestion): LearningExercise | null {
  if (q.type === "match") {
    const pairs = resolveCiscoMatchPairs(q);
    if (pairs.length < 2) return null;
    const matchPairs: LearningMatchPair[] = pairs.map((p, idx) => ({
      id: `m${idx}`,
      left: p.left.en,
      right: p.right.en,
    }));
    return {
      id: q.id,
      title: `CCNA · #${q.number}`,
      problem: matchPromptFromQuestion(q.question.en),
      solutionCode: matchPairs.map((p) => `${p.left}→${p.right}`).join(" | "),
      lang: "plain-text",
      mcQuestion: matchPromptFromQuestion(q.question.en),
      mcOptions: [],
      mcSelectMode: "match",
      matchPairs,
      solutionHint: q.explanation?.en,
      coachLine: q.topic ? `Topic ${q.topic}` : undefined,
      illustrationSrc: q.illustrationSrc,
    };
  }

  if (q.type !== "single" && q.type !== "multi") return null;
  if (!q.options || q.options.length < 2) return null;

  const mcSelectMode = q.type === "multi" ? "multi" : "single";
  const mcOptions: LearningMcOption[] = q.options.map((o, idx) => ({
    id: o.id ?? OPT_IDS[idx] ?? `o${idx}`,
    text: o.text.en,
    isCorrect: o.correct,
    whyWrongHint: o.correct ? undefined : "Review the explanation for this checkpoint item.",
  }));

  return {
    id: q.id,
    title: `CCNA · #${q.number}`,
    problem: q.question.en,
    solutionCode: q.options.filter((o) => o.correct).map((o) => o.text.en).join(" | "),
    lang: "plain-text",
    mcQuestion: q.question.en,
    mcOptions,
    mcSelectMode,
    solutionHint: q.explanation?.en,
    coachLine: q.topic ? `Topic ${q.topic}` : undefined,
    illustrationSrc: q.illustrationSrc,
  };
}
