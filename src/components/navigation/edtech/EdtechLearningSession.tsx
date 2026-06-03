import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import type { LearningField } from "../../../data/nexusRegistry";
import type { LearningExercise } from "../../../lib/learning/learningRegistry";
import type { LearningMcOption } from "../../../lib/learning/learningExerciseTypes";
import {
  formatLearningDisplayText,
  friendlyMissionTitle,
  mergeLessonCardsForEdtech,
} from "../../../lib/learning/edtechLfDisplay";
import { getLfCourseMeta } from "../../../lib/learning/lfCourseCatalog";
import { BEGINNER_EXERCISE_IDS_BY_LF } from "../../../lib/learning/learningRegistry";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { useGameStore } from "../../../store/useGameStore";
import { publicAssetUrl } from "../../../data/nexusRegistry";
import { NexusCinematicShell } from "../../ui/NexusCinematicShell";
import { CiscoMatchExercise } from "../../combat/CiscoMatchExercise";
import { EdtechExamTimerBar } from "./EdtechExamTimerBar";
import "./edtechLearningSession.css";

export type EdtechLearningSessionProps = {
  lf: LearningField;
  exercise: LearningExercise;
  pickedId: string | null;
  pickedIds?: ReadonlySet<string>;
  mcSubmitted?: boolean;
  examStrict: boolean;
  onPick: (opt: LearningMcOption) => void;
  onSubmitMulti?: () => void;
  onSubmitMatch?: (ok: boolean, selectionKey: string) => void;
  onPtLabComplete?: () => void;
};

export function EdtechLearningSession({
  lf,
  exercise,
  pickedId,
  pickedIds,
  mcSubmitted = false,
  examStrict,
  onPick,
  onSubmitMulti,
  onSubmitMatch,
  onPtLabComplete,
}: EdtechLearningSessionProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const learningStoryMode = useGameStore((s) => s.learningStoryMode);
  const examSessionEndsAt = useGameStore((s) => s.examSessionEndsAt);
  const isCiscoSession = useGameStore((s) => s.isCiscoSession);
  const ciscoPackId = useGameStore((s) => s.ciscoPackId);

  const lfNum = Number.parseInt(lf.replace("LF", ""), 10);
  const meta = getLfCourseMeta(lfNum);
  const isBeginner = Boolean(exercise.lessonCards?.length);
  const isMultiMc = exercise.mcSelectMode === "multi";
  const isMatchMc = exercise.mcSelectMode === "match";
  const isPtLab = Boolean(exercise.ptLab);
  const selectedIds = pickedIds ?? new Set<string>();

  const displayTitle = useMemo(
    () =>
      isBeginner
        ? friendlyMissionTitle(exercise.id, exercise.title, learningStoryMode)
        : exercise.title,
    [exercise.id, exercise.title, isBeginner, learningStoryMode]
  );

  const mergedLesson = useMemo(() => {
    if (!isBeginner || !exercise.lessonCards?.length) return null;
    return mergeLessonCardsForEdtech(exercise.lessonCards, learningStoryMode);
  }, [exercise.lessonCards, isBeginner, learningStoryMode]);

  const mcQuestion = useMemo(
    () => formatLearningDisplayText(exercise.mcQuestion, learningStoryMode),
    [exercise.mcQuestion, learningStoryMode]
  );

  const coachLine = useMemo(
    () => (exercise.coachLine ? formatLearningDisplayText(exercise.coachLine, learningStoryMode) : null),
    [exercise.coachLine, learningStoryMode]
  );

  const solved = new Set(learningCorrectByLf[lf] ?? []).size;
  const total = meta?.totalExercises ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;

  const beginnerIds = [...(BEGINNER_EXERCISE_IDS_BY_LF[lf] ?? [])];
  const beginnerIdx = beginnerIds.indexOf(exercise.id);
  const beginnerCurrent = beginnerIdx >= 0 ? beginnerIdx + 1 : null;

  const correctIds = useMemo(
    () => new Set(exercise.mcOptions.filter((o) => o.isCorrect).map((o) => o.id)),
    [exercise.mcOptions]
  );

  const multiOk =
    isMultiMc &&
    mcSubmitted &&
    correctIds.size === selectedIds.size &&
    [...correctIds].every((id) => selectedIds.has(id));

  const picked = exercise.mcOptions.find((o) => o.id === pickedId);
  const showHit = isMatchMc
    ? pickedId === "match:ok"
    : isMultiMc
      ? Boolean(multiOk)
      : Boolean(picked?.isCorrect && pickedId);
  const showMiss = isMatchMc
    ? Boolean(mcSubmitted && pickedId === "match:miss")
    : isMultiMc
      ? Boolean(mcSubmitted && !multiOk)
      : Boolean(picked && !picked.isCorrect && pickedId);

  const exitLearn = () => {
    window.dispatchEvent(new Event("nx:exit-edtech-learning"));
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

      <div className="nx-edtech-learn-hero-wrap">
        {isCiscoSession ? (
          <div className="nx-edtech-learn-cisco-hero">
            <span className="nx-edtech-learn-cisco-badge">{t("cisco.heroBadge", "NetAcad · Cisco ITN")}</span>
            <h2 className="nx-edtech-learn-cisco-title">{t("cisco.hubTitle", "CCNA ITN Checkpoint")}</h2>
            <p className="nx-edtech-learn-cisco-lead">{displayTitle}</p>
            {ciscoPackId ? (
              <p className="nx-edtech-learn-cisco-pack">{ciscoPackId.replace("modules-", "Module ")}</p>
            ) : null}
          </div>
        ) : (
          <NexusCinematicShell
            variant="strip"
            videoSrc={publicAssetUrl(`/assets/LF${lfNum}GIF.mp4`)}
            kicker={`${meta?.ap ?? "AP"} · LF${lfNum}`}
            title={meta?.title ?? lf}
            lead={displayTitle}
          />
        )}
      </div>

      <header className="nx-edtech-learn-header">
        <div className="nx-edtech-learn-header-text">
          <span className="nx-edtech-learn-lf" id="nx-edtech-learn-heading">
            {t("edtechLearn.progressLabel", "Dein Fortschritt")}
          </span>
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
        <button
          type="button"
          className="nx-edtech-learn-close"
          onClick={exitLearn}
          aria-label={t("edtechLearn.exitAria", "Lernen pausieren und zur Übersicht")}
        >
          {t("edtechLearn.exit", "Pause")}
        </button>
      </header>

      {examStrict && examSessionEndsAt ? <EdtechExamTimerBar endsAt={examSessionEndsAt} /> : null}

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
              {coachLine ? <p className="nx-edtech-learn-coach">{coachLine}</p> : null}
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
              {isPtLab
                ? t("cisco.ptLabLabel", "Packet Tracer Lab")
                : isMatchMc
                  ? t("learningTerminal.matchLabel", "Schritt 2 · Zuordnung")
                  : isMultiMc
                    ? t("learningTerminal.mcMultiLabel", "Schritt 2 · Mehrfachauswahl")
                    : t("learningTerminal.edtechQuestionLabel", "Schritt 2 · Deine Frage")}
            </div>
            <p className="nx-edtech-learn-question">{mcQuestion}</p>
            {exercise.exhibitCode ? (
              <pre className="nx-edtech-learn-exhibit-code">{exercise.exhibitCode}</pre>
            ) : null}
            {exercise.illustrationSrc ? (
              <img
                className="nx-edtech-learn-exhibit-img"
                src={exercise.illustrationSrc}
                alt={mcQuestion.slice(0, 120)}
              />
            ) : null}
            {isPtLab ? (
              <>
                <p className="nx-edtech-learn-coach" style={{ marginTop: 0, marginBottom: 12 }}>
                  {t(
                    "cisco.ptLabHint",
                    "Stelle das Szenario in Packet Tracer nach, dann tippe auf Weiter."
                  )}
                </p>
                {exercise.sourceUrl ? (
                  <a
                    className="nx-edtech-learn-pt-link"
                    href={exercise.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("cisco.ptLabOpenSource", "Referenz auf ITExamAnswers öffnen")}
                  </a>
                ) : null}
                <button
                  type="button"
                  className="nx-edtech-learn-close"
                  style={{ marginTop: 16, width: "100%" }}
                  onClick={onPtLabComplete}
                >
                  {t("cisco.ptLabComplete", "Lab abgeschlossen — weiter")}
                </button>
              </>
            ) : null}
            {isMultiMc && !isPtLab ? (
              <p className="nx-edtech-learn-coach" style={{ marginTop: 0, marginBottom: 12 }}>
                {t("learningTerminal.mcMultiHint", "Wähle alle zutreffenden Antworten und tippe dann auf Prüfen")}
              </p>
            ) : null}
            {!isPtLab && isMatchMc && exercise.matchPairs?.length ? (
              <CiscoMatchExercise
                key={exercise.id}
                pairs={exercise.matchPairs}
                submitted={mcSubmitted}
                onSubmit={(ok, key) => onSubmitMatch?.(ok, key)}
              />
            ) : null}
            {!isMatchMc && !isPtLab ? (
              <>
            <div className="nx-edtech-learn-options" role="group">
              {exercise.mcOptions.map((opt) => {
                const active = isMultiMc ? selectedIds.has(opt.id) : pickedId === opt.id;
                const hit = isMultiMc
                  ? mcSubmitted && opt.isCorrect && selectedIds.has(opt.id)
                  : active && opt.isCorrect;
                const miss = isMultiMc
                  ? mcSubmitted && ((selectedIds.has(opt.id) && !opt.isCorrect) || (!selectedIds.has(opt.id) && opt.isCorrect))
                  : active && !opt.isCorrect;
                const label = formatLearningDisplayText(opt.text, learningStoryMode);
                const locked = isMultiMc ? mcSubmitted : Boolean(pickedId);
                return (
                  <motion.button
                    key={opt.id}
                    type="button"
                    disabled={locked}
                    className={[
                      "nx-edtech-learn-opt",
                      active && !mcSubmitted ? "nx-edtech-learn-opt--active" : "",
                      hit ? "nx-edtech-learn-opt--hit" : "",
                      miss ? "nx-edtech-learn-opt--miss" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onPick(opt)}
                    whileTap={reduceMotion || locked ? undefined : { scale: 0.98 }}
                  >
                    <span aria-hidden style={{ fontWeight: 800, marginRight: 10 }}>
                      {opt.id.toUpperCase()}
                    </span>
                    {label}
                  </motion.button>
                );
              })}
            </div>
            {isMultiMc && !mcSubmitted ? (
              <button
                type="button"
                className="nx-edtech-learn-close"
                style={{ marginTop: 16, width: "100%" }}
                disabled={selectedIds.size === 0}
                onClick={onSubmitMulti}
              >
                {t("learningTerminal.mcSubmitMulti", "Antwort prüfen")}
              </button>
            ) : null}
              </>
            ) : null}
            {showHit ? (
              <div className="nx-edtech-learn-feedback nx-edtech-learn-feedback--hit" role="status">
                {t("learningTerminal.feedbackMcHitNext", "Richtig — gleich kommt die nächste Aufgabe")}
              </div>
            ) : null}
            {showMiss ? (
              <div className="nx-edtech-learn-feedback nx-edtech-learn-feedback--miss" role="status">
                <div>
                  {isMultiMc
                    ? t("learningTerminal.feedbackMcMultiWrong", "Noch nicht alle richtigen Antworten getroffen")
                    : t("learningTerminal.feedbackMcWrongTitle", "Das ist noch nicht richtig")}
                </div>
                {!examStrict && !isMultiMc && optWrongHint(picked) ? (
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
