import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  friendlyMissionTitle,
  friendlyTopicLine,
  getLfEdtechSummary,
} from "../../../lib/learning/edtechLfDisplay";
import { getLfCourseMeta } from "../../../lib/learning/lfCourseCatalog";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { useGameStore } from "../../../store/useGameStore";
import { publicAssetUrl } from "../../../data/nexusRegistry";
import { NexusCinematicShell } from "../../ui/NexusCinematicShell";
import { edtechGhostBtn, edtechPrimaryBtn } from "./edtechHubTokens";
import "./edtechLfCourseSheet.css";

export type EdtechLfCourseSheetProps = {
  lf: number | null;
  onClose: () => void;
  onEngage: (lf: number, mode: "learn" | "exam") => void;
  onOpenCodex: () => void;
};

export function EdtechLfCourseSheet({ lf, onClose, onEngage, onOpenCodex }: EdtechLfCourseSheetProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const learningStoryMode = useGameStore((s) => s.learningStoryMode);
  const trainingTrack = useGameStore((s) => s.trainingTrack);

  const meta = useMemo(() => (lf != null ? getLfCourseMeta(lf) : null), [lf]);

  const courseLead = useMemo(() => {
    if (lf == null) return "";
    return getLfEdtechSummary(lf, trainingTrack) || meta?.summary || "";
  }, [lf, trainingTrack, meta?.summary]);

  const progress = useMemo(() => {
    if (!meta) return { solved: 0, pct: 0 };
    const lfKey = meta.lfKey;
    const solved = new Set(learningCorrectByLf[lfKey] ?? []).size;
    const total = meta.totalExercises;
    const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;
    return { solved, pct };
  }, [meta, learningCorrectByLf]);

  const firstMission = meta?.missions[0];
  const friendlyStart = firstMission
    ? friendlyMissionTitle(firstMission.id, firstMission.title, learningStoryMode)
    : null;

  return (
    <AnimatePresence>
      {lf != null && meta ? (
        <motion.div
          key="edtech-lf-course-sheet"
          className="nx-edtech-course-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.22 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className="nx-edtech-course-sheet"
            initial={reduceMotion ? false : { y: 48, opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 32, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="nx-edtech-course-title"
          >
            <div className="nx-edtech-course-cinematic">
              <NexusCinematicShell
                variant="strip"
                videoSrc={publicAssetUrl(`/assets/LF${meta.lf}GIF.mp4`)}
                kicker={meta.ap}
                title={meta.title}
                lead={courseLead}
              />
            </div>
            <div className="nx-edtech-course-sheet-scroll">
              <h2 id="nx-edtech-course-title" className="nx-edtech-course-title-sr">
                {meta.title}
              </h2>

              <div className="nx-edtech-course-progress-block">
                <div className="nx-edtech-course-progress-head">
                  <span>{t("map.edtechCourse.progress")}</span>
                  <span className="nx-edtech-course-progress-num">
                    {progress.pct}% · {progress.solved}/{meta.totalExercises}
                  </span>
                </div>
                <div className="nx-edtech-course-progress-track">
                  <motion.div
                    className="nx-edtech-course-progress-fill"
                    initial={false}
                    animate={{ width: `${progress.pct}%` }}
                    transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              <ol className="nx-edtech-course-path" aria-label={t("map.edtechCourse.pathAria")}>
                <li className="nx-edtech-course-path-step nx-edtech-course-path-step--active">
                  <span className="nx-edtech-course-path-num">1</span>
                  <div>
                    <strong>{t("map.edtechCourse.pathRead")}</strong>
                    <p>{t("map.edtechCourse.pathReadBody")}</p>
                  </div>
                </li>
                <li className="nx-edtech-course-path-step">
                  <span className="nx-edtech-course-path-num">2</span>
                  <div>
                    <strong>{t("map.edtechCourse.pathPractice")}</strong>
                    <p>{t("map.edtechCourse.pathPracticeBody")}</p>
                  </div>
                </li>
                <li className="nx-edtech-course-path-step nx-edtech-course-path-step--optional">
                  <span className="nx-edtech-course-path-num">3</span>
                  <div>
                    <strong>{t("map.edtechCourse.pathExam")}</strong>
                    <p>{t("map.edtechCourse.pathExamBody")}</p>
                  </div>
                </li>
              </ol>

              {friendlyStart ? (
                <div className="nx-edtech-course-start-hint">
                  <span className="nx-edtech-course-start-label">
                    {t("map.edtechCourse.startLabel")}
                  </span>
                  <p className="nx-edtech-course-start-title">{friendlyStart}</p>
                </div>
              ) : null}

              <button
                type="button"
                className="nx-edtech-course-details-toggle"
                onClick={() => setDetailsOpen((v) => !v)}
                aria-expanded={detailsOpen}
              >
                {detailsOpen
                  ? t("map.edtechCourse.detailsHide")
                  : t("map.edtechCourse.detailsShow")}
              </button>

              <AnimatePresence initial={false}>
                {detailsOpen ? (
                  <motion.div
                    className="nx-edtech-course-details"
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.25 }}
                  >
                    {meta.missions.length > 0 ? (
                      <section>
                        <h3>{t("map.edtechCourse.missionsTitle")}</h3>
                        <ul className="nx-edtech-course-mission-list">
                          {meta.missions.map((m) => {
                            const topic = friendlyTopicLine(m.topic, learningStoryMode);
                            return (
                              <li key={m.id}>
                                <strong>{friendlyMissionTitle(m.id, m.title, learningStoryMode)}</strong>
                                {topic ? <span>{topic}</span> : null}
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    ) : null}
                    {meta.chapters.length > 0 ? (
                      <section>
                        <h3>{t("map.edtechCourse.chaptersTitle")}</h3>
                        <ul className="nx-edtech-course-chapter-list">
                          {meta.chapters.map((ch) => (
                            <li key={ch.id}>
                              <span>{ch.title}</span>
                              <span className="nx-edtech-course-chapter-count">
                                {ch.noteCount} {t("map.edtechCourse.notes")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="nx-edtech-course-sheet-actions">
              <motion.button
                type="button"
                onClick={() => onEngage(meta.lf, "learn")}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="nx-edtech-course-cta-primary"
                style={edtechPrimaryBtn}
              >
                {t("map.edtechCourse.ctaLearn")}
              </motion.button>
              <div className="nx-edtech-course-cta-row">
                <motion.button
                  type="button"
                  onClick={() => onEngage(meta.lf, "exam")}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  style={{ ...edtechGhostBtn, flex: 1 }}
                >
                  {t("map.edtechCourse.ctaExam")}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    onOpenCodex();
                    onClose();
                  }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  style={{ ...edtechGhostBtn, flex: 1 }}
                >
                  {t("map.edtechCourse.ctaCodex")}
                </motion.button>
              </div>
              <button type="button" className="nx-edtech-course-close" onClick={onClose}>
                {t("map.edtechClose")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
