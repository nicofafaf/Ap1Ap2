import { useNexusI18n } from "./I18nProvider";
import {
  readQuestionLocalePrefs,
  resolveQuestionLocale,
  type QuestionLocaleMode,
} from "./questionLocale";
import { useGameStore } from "../../store/useGameStore";

export { readQuestionLocalePrefs };

export function useQuestionLocale(): {
  locale: "de" | "en";
  mode: QuestionLocaleMode;
  autoTranslate: boolean;
} {
  const { locale: uiLocale } = useNexusI18n();
  const mode = useGameStore((s) => s.questionLocaleMode);
  const autoTranslate = useGameStore((s) => s.autoTranslateQuestions);
  const locale = resolveQuestionLocale(mode, uiLocale);
  return { locale, mode, autoTranslate };
}
