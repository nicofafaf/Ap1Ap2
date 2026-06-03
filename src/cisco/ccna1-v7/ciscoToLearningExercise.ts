import type { NexusLocale } from "../../lib/i18n/translationEngine";
import type { LearningExercise, LearningMatchPair, LearningMcOption } from "../../lib/learning/learningExerciseTypes";
import type { CiscoQuestion } from "../types";
import { pickCiscoLocaleText } from "./ciscoLocale";
import { matchPromptFromQuestion, resolveCiscoMatchPairs } from "./parseMatchPairs";

const OPT_IDS = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function ciscoQuestionToLearningExercise(
  q: CiscoQuestion,
  locale: NexusLocale = "en"
): LearningExercise | null {
  const qText = pickCiscoLocaleText(q.question, locale);
  const expl = q.explanation ? pickCiscoLocaleText(q.explanation, locale) : undefined;

  if (q.type === "match") {
    const pairs = resolveCiscoMatchPairs(q);
    if (pairs.length < 2) return null;
    const matchPairs: LearningMatchPair[] = pairs.map((p, idx) => ({
      id: `m${idx}`,
      left: pickCiscoLocaleText(p.left, locale),
      right: pickCiscoLocaleText(p.right, locale),
    }));
    return {
      id: q.id,
      title: `CCNA · #${q.number}`,
      problem: matchPromptFromQuestion(qText),
      solutionCode: matchPairs.map((p) => `${p.left}→${p.right}`).join(" | "),
      lang: "plain-text",
      mcQuestion: matchPromptFromQuestion(qText),
      mcOptions: [],
      mcSelectMode: "match",
      matchPairs,
      solutionHint: expl,
      coachLine: q.topic ? `Topic ${q.topic}` : undefined,
      illustrationSrc: q.illustrationSrc,
      exhibitCode: q.exhibitCode,
    };
  }

  if (q.type !== "single" && q.type !== "multi") return null;
  if (!q.options || q.options.length < 2) return null;

  const mcSelectMode = q.type === "multi" ? "multi" : "single";
  const mcOptions: LearningMcOption[] = q.options.map((o, idx) => ({
    id: o.id ?? OPT_IDS[idx] ?? `o${idx}`,
    text: pickCiscoLocaleText(o.text, locale),
    isCorrect: o.correct,
    whyWrongHint: o.correct
      ? undefined
      : locale === "de"
        ? "Siehe Erklärung zu dieser Checkpoint-Frage."
        : "Review the explanation for this checkpoint item.",
  }));

  const correctLabels = q.options
    .filter((o) => o.correct)
    .map((o) => pickCiscoLocaleText(o.text, locale))
    .join(" | ");

  return {
    id: q.id,
    title: `CCNA · #${q.number}`,
    problem: qText,
    solutionCode: correctLabels,
    lang: "plain-text",
    mcQuestion: qText,
    mcOptions,
    mcSelectMode,
    solutionHint: expl,
    coachLine: q.topic ? `Topic ${q.topic}` : undefined,
    illustrationSrc: q.illustrationSrc,
    exhibitCode: q.exhibitCode,
  };
}
