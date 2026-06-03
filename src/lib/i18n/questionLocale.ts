import type { NexusLocale } from "./translationEngine";
import type { LearningExercise } from "../learning/learningExerciseTypes";
import type { CiscoLocaleText } from "../../cisco/types";
import { pickCiscoLocaleText } from "../../cisco/ccna1-v7/ciscoLocale";
import { translateContentText } from "./contentTranslate";

/** Wie Fragen/Antworten angezeigt werden (UI kann separat bleiben). */
export type QuestionLocaleMode = "ui" | "de" | "en";

export const QUESTION_LOCALE_MODE_KEY = "nexus.questionLocaleMode.v1";
export const AUTO_TRANSLATE_QUESTIONS_KEY = "nexus.autoTranslateQuestions.v1";

export function isQuestionLocaleMode(v: string): v is QuestionLocaleMode {
  return v === "ui" || v === "de" || v === "en";
}

export function readStoredQuestionLocaleMode(): QuestionLocaleMode {
  try {
    const raw = localStorage.getItem(QUESTION_LOCALE_MODE_KEY);
    if (raw && isQuestionLocaleMode(raw)) return raw;
  } catch {
    /* no-op */
  }
  return "ui";
}

export function persistQuestionLocaleMode(mode: QuestionLocaleMode): void {
  try {
    localStorage.setItem(QUESTION_LOCALE_MODE_KEY, mode);
  } catch {
    /* no-op */
  }
}

export function readStoredAutoTranslateQuestions(): boolean {
  try {
    const raw = localStorage.getItem(AUTO_TRANSLATE_QUESTIONS_KEY);
    if (raw === "0" || raw === "false") return false;
    if (raw === "1" || raw === "true") return true;
  } catch {
    /* no-op */
  }
  return true;
}

export function persistAutoTranslateQuestions(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_TRANSLATE_QUESTIONS_KEY, enabled ? "1" : "0");
  } catch {
    /* no-op */
  }
}

export function resolveQuestionLocale(mode: QuestionLocaleMode, uiLocale: NexusLocale): NexusLocale {
  if (mode === "ui") return uiLocale;
  return mode;
}

export function pickBilingualText(
  en: string,
  de: string | null | undefined,
  locale: NexusLocale
): string {
  if (locale === "de" && de?.trim()) return de.trim();
  return en.trim();
}

export function pickCiscoBlock(block: CiscoLocaleText, locale: NexusLocale): string {
  return pickCiscoLocaleText(block, locale);
}

export function readQuestionLocalePrefs(): {
  mode: QuestionLocaleMode;
  autoTranslate: boolean;
} {
  return {
    mode: readStoredQuestionLocaleMode(),
    autoTranslate: readStoredAutoTranslateQuestions(),
  };
}

/** LF-Übungen sind primär DE — bei EN-Anzeige optional übersetzen. */
export async function localizeLearningExercise(
  exercise: LearningExercise,
  locale: NexusLocale,
  autoTranslate: boolean
): Promise<LearningExercise> {
  if (locale === "de") return exercise;

  const tr = async (text: string, from: "de" | "en") => {
    if (!text.trim()) return text;
    if (!autoTranslate) return text;
    return translateContentText(text, from, "en");
  };

  const mcOptions = await Promise.all(
    exercise.mcOptions.map(async (o) => ({
      ...o,
      text: await tr(o.text, "de"),
      whyWrongHint: o.whyWrongHint ? await tr(o.whyWrongHint, "de") : undefined,
    }))
  );

  const matchPairs = exercise.matchPairs
    ? await Promise.all(
        exercise.matchPairs.map(async (p) => ({
          ...p,
          left: await tr(p.left, "de"),
          right: await tr(p.right, "de"),
        }))
      )
    : undefined;

  return {
    ...exercise,
    title: await tr(exercise.title, "de"),
    problem: await tr(exercise.problem, "de"),
    mcQuestion: await tr(exercise.mcQuestion, "de"),
    mcOptions,
    matchPairs,
    solutionHint: exercise.solutionHint ? await tr(exercise.solutionHint, "de") : undefined,
    coachLine: exercise.coachLine ? await tr(exercise.coachLine, "de") : undefined,
    illustrationSrc: exercise.illustrationSrc,
    exhibitCode: exercise.exhibitCode,
  };
}

export async function localizeCiscoLearningExercise(
  exercise: LearningExercise,
  locale: NexusLocale,
  autoTranslate: boolean
): Promise<LearningExercise> {
  if (locale === "en") return exercise;

  const tr = async (text: string) => {
    if (!text.trim()) return text;
    if (!autoTranslate) return text;
    return translateContentText(text, "en", "de");
  };

  const mcOptions = await Promise.all(
    exercise.mcOptions.map(async (o) => ({
      ...o,
      text: await tr(o.text),
      whyWrongHint: o.whyWrongHint ? await tr(o.whyWrongHint) : undefined,
    }))
  );

  const matchPairs = exercise.matchPairs
    ? await Promise.all(
        exercise.matchPairs.map(async (p) => ({
          ...p,
          left: await tr(p.left),
          right: await tr(p.right),
        }))
      )
    : undefined;

  return {
    ...exercise,
    title: await tr(exercise.title),
    problem: await tr(exercise.problem),
    mcQuestion: await tr(exercise.mcQuestion),
    mcOptions,
    matchPairs,
    solutionHint: exercise.solutionHint ? await tr(exercise.solutionHint) : undefined,
    coachLine: exercise.coachLine ? await tr(exercise.coachLine) : undefined,
    illustrationSrc: exercise.illustrationSrc,
    exhibitCode: exercise.exhibitCode,
  };
}
