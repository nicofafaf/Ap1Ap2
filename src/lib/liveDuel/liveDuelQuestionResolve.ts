import { getCiscoPack } from "../../cisco/ccna1-v7/loadPacks";
import type { LearningField } from "../../data/nexusRegistry";
import { SOMMER2026_EXAM_PACKS } from "../curriculum/sommer2026Exams";
import type { NexusLocale } from "../i18n/translationEngine";
import {
  localizeCiscoLearningExercise,
  localizeLearningExercise,
  pickBilingualText,
} from "../i18n/questionLocale";
import { getLearningExerciseById } from "../learning/learningRegistry";
import type { LiveDuelQuestionRef } from "./liveDuelTypes";

export type ResolvedDuelQuestion = {
  prompt: string;
  options: { id: string; label: string; correct: boolean }[];
  imageSrc?: string;
  exhibitCode?: string;
};

function pickLocaleText(en: string, de: string | null | undefined, locale: NexusLocale): string {
  return pickBilingualText(en, de, locale);
}

export function resolveLiveDuelQuestion(
  ref: LiveDuelQuestionRef,
  locale: NexusLocale = "de"
): ResolvedDuelQuestion | null {
  if (ref.source === "lf") {
    const lfKey = `LF${ref.lf}` as LearningField;
    const ex = getLearningExerciseById(lfKey, ref.exerciseId);
    if (!ex?.mcOptions?.length) return null;
    return {
      prompt: ex.mcQuestion || ex.title || ex.id,
      options: ex.mcOptions.map((o) => ({
        id: o.id,
        label: o.text,
        correct: o.isCorrect,
      })),
      imageSrc: ex.illustrationSrc,
      exhibitCode: ex.exhibitCode,
    };
  }

  if (ref.source === "cisco") {
    const pack = getCiscoPack(ref.packId);
    const item = pack?.items.find((q) => q.id === ref.questionId);
    if (!item || (item.type !== "single" && item.type !== "multi")) return null;
    const options = item.options ?? [];
    return {
      prompt: pickLocaleText(item.question.en, item.question.de, locale),
      options: options.map((o) => ({
        id: o.id,
        label: pickLocaleText(o.text.en, o.text.de, locale),
        correct: o.correct,
      })),
      imageSrc: item.illustrationSrc,
      exhibitCode: item.exhibitCode,
    };
  }

  if (ref.source === "sommer2026") {
    const lf = SOMMER2026_EXAM_PACKS[ref.packId].primaryLf;
    const lfKey = `LF${lf}` as LearningField;
    const ex = getLearningExerciseById(lfKey, ref.missionId);
    if (!ex) return null;
    if (!ex.mcOptions?.length) return null;
    return {
      prompt: ex.mcQuestion || ex.title || ref.missionId,
      options: ex.mcOptions.map((o) => ({
        id: o.id,
        label: o.text,
        correct: o.isCorrect,
      })),
    };
  }

  return null;
}

/** Mit Auto-Übersetzung für fehlende DE/EN-Felder (CCNA, LF). */
export async function resolveLiveDuelQuestionAsync(
  ref: LiveDuelQuestionRef,
  locale: NexusLocale,
  autoTranslate: boolean
): Promise<ResolvedDuelQuestion | null> {
  const base = resolveLiveDuelQuestion(ref, locale);
  if (!base || !autoTranslate) return base;

  if (ref.source === "cisco") {
    const pack = getCiscoPack(ref.packId);
    const item = pack?.items.find((q) => q.id === ref.questionId);
    if (!item || locale !== "de" || item.question.de?.trim()) return base;
    const ex = {
      id: ref.questionId,
      title: base.prompt,
      problem: base.prompt,
      solutionCode: "",
      lang: "plain-text" as const,
      mcQuestion: base.prompt,
      mcOptions: base.options.map((o) => ({
        id: o.id,
        text: o.label,
        isCorrect: o.correct,
      })),
      illustrationSrc: base.imageSrc,
      exhibitCode: base.exhibitCode,
    };
    const localized = await localizeCiscoLearningExercise(ex, locale, true);
    return {
      prompt: localized.mcQuestion,
      options: localized.mcOptions.map((o) => ({
        id: o.id,
        label: o.text,
        correct: o.isCorrect,
      })),
      imageSrc: base.imageSrc,
      exhibitCode: base.exhibitCode,
    };
  }

  if (ref.source === "lf" || ref.source === "sommer2026") {
    if (locale !== "en") return base;
    const lfKey = `LF${ref.source === "lf" ? ref.lf : SOMMER2026_EXAM_PACKS[ref.packId].primaryLf}` as LearningField;
    const exId = ref.source === "lf" ? ref.exerciseId : ref.missionId;
    const ex = getLearningExerciseById(lfKey, exId);
    if (!ex?.mcOptions?.length) return base;
    const localized = await localizeLearningExercise(ex, locale, true);
    return {
      prompt: localized.mcQuestion || localized.title,
      options: localized.mcOptions.map((o) => ({
        id: o.id,
        label: o.text,
        correct: o.isCorrect,
      })),
      imageSrc: localized.illustrationSrc,
    };
  }

  return base;
}
