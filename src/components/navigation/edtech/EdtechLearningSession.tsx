import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import type { LearningField } from "../../../data/nexusRegistry";
import type { LearningExercise } from "../../../lib/learning/learningRegistry";
import type { LearningMcOption } from "../../../lib/learning/learningExerciseTypes";
import {
  friendlyMissionTitle,
  mergeLessonCardsForEdtech,
  sanitizeEdtechLearningText,
} from "../../../lib/learning/edtechLfDisplay";
import { getLfCourseMeta } from "../../../lib/learning/lfCourseCatalog";
import { BEGINNER_EXERCISE_IDS_BY_LF } from "../../../lib/learning/learningRegistry";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { useGameStore } from "../../../store/useGameStore";
import { EdtechExamTimerBar } from "./EdtechExamTimerBar";
import "./edtechLearningSession.css";

export type EdtechLearningSessionProps = {
  lf: LearningField;
  exercise: LearningExercise;
  pickedId: string | null;
  examStrict: boolean;
  onPick: (opt: LearningMcOption) => void;
};

export function EdtechLearningSession({
  lf,
  exercise,
  pickedId,
  examStrict,
  onPick,
}: EdtechLearningSessionProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const resetCombat = useGameStore((s) => s.resetCombat);
  const setOverworldLanding = useGameStore((s) => s.setOverworldLanding);

  const lfNum = Number.parseInt(lf.replace("LF", ""), 10);
  const meta = getLfCourseMeta(lfNum);
  const isBeginner = Boolean(exercise.lessonCards?.length);

  const displayTitle = useMemo(
    () => (isBeginner ? friendlyMissionTitle(exercise.id, exercise.title) : exercise.title),
    [exercise.id, exercise.title, isBeginner]
  );

  const mergedLesson = useMemo(() => {
    if (!isBeginner || !exercise.lessonCards?.length) return null;
    return mergeLessonCardsForEdtech(exercise.lessonCards);
  }, [exercise.lessonCards, isBeginner]);

  const mcQuestion = useMemo(
    () => (isBeginner ? sanitizeEdtechLearningText(exercise.mcQuestion) : exercise.mcQuestion),
    [exercise.mcQuestion, isBeginner]
  );

  const solved = new Set(learningCorrectByLf[lf] ?? []).size;
  const total = meta?.totalExercises ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;

  const beginnerIds = [...(BEGINNER_EXERCISE_IDS_BY_LF[lf] ?? [])];
  const beginnerIdx = beginnerIds.indexOf(exercise.id);
  const beginnerCurrent = beginnerIdx >= 0 ? beginnerIdx + 1 : null;

  const picked = exercise.mcOptions.find((o) => o.id === pickedId);
  const showHit = Boolean(picked?.isCorrect && pickedId);
  const showMiss = Boolean(picked && !picked.isCorrect && pickedId);

  const exitLearn = () => {
    resetCombat();
    setOverworldLanding("hub");
  };

  return (
    <motion.div
      className="nx-edtech-learn-root"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nx-edtech-learn-heading"
    >
      <AnimatePresence>
        {showHit && !reduceMotion ? (
          <motion.div
            className="nx-edtech-learn-success-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.85, ease: "easeOut" }}
          />
        ) : null}
      </AnimatePresence>

      <header className="nx-edtech-learn-header">
        <div className="nx-edtech-learn-header-text">
          <span className="nx-edtech-learn-lf">
            {meta?.ap ?? "AP"} · LF{lfNum}
          </span>
          <h1 id="nx-edtech-learn-heading" className="nx-edtech-learn-title">
            {meta?.title ?? lf}
          </h1>
          <div className="nx-edtech-learn-progress-wrap">
            <div className="nx-edtech-learn-progress-meta">
              <span>
                {t("edtechLearn.progressLabel", "Dein Fortschritt")} · {solved}/{total}
              </span>
              <span>{pct}%</span>
            </div>
            <div className="nx-edtech-learn-progress-track" aria-hidden>
              <div className="nx-edtech-learn-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
        <button type="button" className="nx-edtech-learn-close" onClick={exitLearn}>
          {t("edtechLearn.exit", "Pause")}
        </button>
      </header>

      {examStrict ? <EdtechExamTimerBar /> : null}

      <div className="nx-edtech-learn-body">
        <div className="nx-edtech-learn-inner">
          {isBeginner ? (
            <div className="nx-edtech-learn-steps" aria-hidden>
              <span className="nx-edtech-learn-step nx-edtech-learn-step--active">
                {t("edtechLearn.stepRead", "1 · Lesen")}
              </span>
              <span className="nx-edtech-learn-step nx-edtech-learn-step--active">
                {t("edtechLearn.stepAsk", "2 · Frage")}
              </span>
            </div>
          ) : null}

          {mergedLesson ? (
            <section className="nx-edtech-learn-card" aria-label={t("edtechLearn.readAria", "Kurz erklärt")}>
              <div className="nx-edtech-learn-card-label">
                {beginnerCurrent != null
                  ? t("edtechLearn.introProgress", "Einstieg {n} von {total}")
                      .replace("{n}", String(beginnerCurrent))
                      .replace("{total}", String(beginnerIds.length))
                  : t("learningTerminal.edtechStepLabel", "Schritt 1 · Kurz lesen")}
              </div>
              <h3>{displayTitle}</h3>
              <p>{mergedLesson.body}</p>
            </section>
          ) : (
            <section className="nx-edtech-learn-card">
              <div className="nx-edtech-learn-card-label">
                {t("learningTerminal.taskLabel", "Aufgabe")}
              </div>
              <h3>{displayTitle}</h3>
            </section>
          )}

          <section className="nx-edtech-learn-card" aria-label={t("learningTerminal.ariaMc")}>
            <div className="nx-edtech-learn-card-label">
              {t("learningTerminal.edtechQuestionLabel", "Schritt 2 · Deine Frage")}
            </div>
            <p className="nx-edtech-learn-question">{mcQuestion}</p>
            <div className="nx-edtech-learn-options" role="group">
              {exercise.mcOptions.map((opt) => {
                const active = pickedId === opt.id;
                const hit = active && opt.isCorrect;
                const miss = active && !opt.isCorrect;
                const label = isBeginner ? sanitizeEdtechLearningText(opt.text) : opt.text;
                return (
                  <motion.button
                    key={opt.id}
                    type="button"
                    disabled={Boolean(pickedId)}
                    className={[
                      "nx-edtech-learn-opt",
                      hit ? "nx-edtech-learn-opt--hit" : "",
                      miss ? "nx-edtech-learn-opt--miss" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onPick(opt)}
                    whileTap={reduceMotion || pickedId ? undefined : { scale: 0.98 }}
                  >
                    <span aria-hidden style={{ fontWeight: 800, marginRight: 10 }}>
                      {opt.id.toUpperCase()}
                    </span>
                    {label}
                  </motion.button>
                );
              })}
            </div>
            {showHit ? (
              <div className="nx-edtech-learn-feedback nx-edtech-learn-feedback--hit" role="status">
                {t("learningTerminal.feedbackMcHitNext", "Richtig — gleich kommt die nächste Aufgabe")}
              </div>
            ) : null}
            {showMiss ? (
              <div className="nx-edtech-learn-feedback nx-edtech-learn-feedback--miss" role="status">
                <div>{t("learningTerminal.feedbackMcWrongTitle", "Das ist noch nicht richtig")}</div>
                {!examStrict && optWrongHint(picked) ? (
                  <div style={{ marginTop: 8, fontWeight: 550 }}>{optWrongHint(picked)}</div>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </motion.div>
  );
}

function optWrongHint(opt: LearningMcOption | undefined): string | null {
  if (!opt || opt.isCorrect) return null;
  const h = opt.whyWrongHint?.trim();
  return h || null;
}
