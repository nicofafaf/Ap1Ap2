import { getCiscoPack } from "../../cisco/ccna1-v7/loadPacks";
import type { LearningField } from "../../data/nexusRegistry";
import { SOMMER2026_EXAM_PACKS } from "../curriculum/sommer2026Exams";
import { getLearningExerciseById } from "../learning/learningRegistry";
import type { LiveDuelQuestionRef } from "./liveDuelTypes";

export type ResolvedDuelQuestion = {
  prompt: string;
  options: { id: string; label: string; correct: boolean }[];
  imageSrc?: string;
};

function pickLocaleText(
  en: string,
  de?: string | null,
  preferDe?: boolean
): string {
  if (preferDe && de?.trim()) return de.trim();
  return en.trim();
}

export function resolveLiveDuelQuestion(
  ref: LiveDuelQuestionRef,
  preferDe = true
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
    };
  }

  if (ref.source === "cisco") {
    const pack = getCiscoPack(ref.packId);
    const item = pack?.items.find((q) => q.id === ref.questionId);
    if (!item || (item.type !== "single" && item.type !== "multi")) return null;
    const options = item.options ?? [];
    return {
      prompt: pickLocaleText(item.question.en, item.question.de, preferDe),
      options: options.map((o) => ({
        id: o.id,
        label: pickLocaleText(o.text.en, o.text.de, preferDe),
        correct: o.correct,
      })),
      imageSrc: item.illustrationSrc,
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
