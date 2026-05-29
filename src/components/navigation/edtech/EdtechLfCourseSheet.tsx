import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { getLfCourseMeta } from "../../../lib/learning/lfCourseCatalog";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { useGameStore } from "../../../store/useGameStore";
import { cyanAccent, edtechGhostBtn, edtechPrimaryBtn, goldAccent } from "./edtechHubTokens";
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
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);

  const meta = useMemo(() => (lf != null ? getLfCourseMeta(lf) : null), [lf]);

  const progress = useMemo(() => {
    if (!meta) return { solved: 0, pct: 0 };
    const lfKey = meta.lfKey;
    const solved = new Set(learningCorrectByLf[lfKey] ?? []).size;
    const total = meta.totalExercises;
    const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;
    return { solved, pct };
  }, [meta, learningCorrectByLf]);

  const discipline = meta
    ? t(`lf.${meta.lfKey}.discipline`, t(`lf.${meta.lfKey}.boss`, meta.title))
    : "";

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
            <div className="nx-edtech-course-sheet-scroll">
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--nx-font-mono)",
                  fontSize: 11,
                  fontWeight: 750,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: cyanAccent,
                }}
              >
                {meta.ap} · {t("map.edtechCourse.kicker")}
              </p>
              <h2
                id="nx-edtech-course-title"
                style={{
                  margin: "6px 0 0",
                  fontFamily: "var(--nx-font-sans)",
                  fontSize: "clamp(22px, 4vw, 26px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#0f172a",
                  lineHeight: 1.15,
                }}
              >
                LF{meta.lf} · {t(`lf.${meta.lfKey}.boss`, meta.title)}
              </h2>
              {discipline ? (
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 14,
                    lineHeight: 1.45,
                    color: "#64748b",
                    fontFamily: "var(--nx-font-sans)",
                  }}
                >
                  {discipline}
                </p>
              ) : null}

              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--nx-font-sans)",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {t("map.edtechCourse.progress")}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--nx-font-mono)",
                      fontSize: 12,
                      color: "#64748b",
                    }}
                  >
                    {progress.solved}/{meta.totalExercises} · {progress.pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: "rgba(148, 163, 184, 0.22)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progress.pct}%`,
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${cyanAccent}, ${goldAccent})`,
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <StatPill label={t("map.edtechCourse.statMissions")} value={String(meta.missions.length)} />
                <StatPill label={t("map.edtechCourse.statChapters")} value={String(meta.chapters.length)} />
                <StatPill label={t("map.edtechCourse.statExercises")} value={String(meta.totalExercises)} />
              </div>

              {meta.missions.length > 0 ? (
                <section style={{ marginTop: 20 }}>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: ".04em",
                      textTransform: "uppercase",
                      color: "#64748b",
                      fontFamily: "var(--nx-font-sans)",
                    }}
                  >
                    {t("map.edtechCourse.missionsTitle")}
                  </h3>
                  <div className="nx-edtech-course-missions">
                    {meta.missions.map((m) => (
                      <div key={m.id} className="nx-edtech-course-mission">
                        <strong
                          style={{
                            display: "block",
                            fontSize: 14,
                            color: "#0f172a",
                            fontFamily: "var(--nx-font-sans)",
                          }}
                        >
                          {m.title}
                        </strong>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            fontFamily: "var(--nx-font-sans)",
                          }}
                        >
                          {m.topic}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {meta.chapters.length > 0 ? (
                <section style={{ marginTop: 20 }}>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: ".04em",
                      textTransform: "uppercase",
                      color: "#64748b",
                      fontFamily: "var(--nx-font-sans)",
                    }}
                  >
                    {t("map.edtechCourse.chaptersTitle")}
                  </h3>
                  <div className="nx-edtech-course-chapters">
                    {meta.chapters.map((ch) => (
                      <div key={ch.id} className="nx-edtech-course-chapter">
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#0f172a",
                            fontFamily: "var(--nx-font-sans)",
                          }}
                        >
                          {ch.title}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "#64748b",
                            fontFamily: "var(--nx-font-mono)",
                            flexShrink: 0,
                          }}
                        >
                          {ch.noteCount} {t("map.edtechCourse.notes")}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {meta.tools.length > 0 ? (
                <section style={{ marginTop: 20 }}>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: ".04em",
                      textTransform: "uppercase",
                      color: "#64748b",
                      fontFamily: "var(--nx-font-sans)",
                    }}
                  >
                    {t("map.edtechCourse.toolsTitle")}
                  </h3>
                  <div className="nx-edtech-course-tools">
                    {meta.tools.map((tool) => (
                      <span key={tool.id} className="nx-edtech-course-tool-pill">
                        {t(tool.labelKey)}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              <p
                style={{
                  margin: "20px 0 0",
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: "#94a3b8",
                  fontFamily: "var(--nx-font-sans)",
                }}
              >
                {t("map.edtechCourse.compareHint")}
              </p>
            </div>

            <div className="nx-edtech-course-sheet-actions">
              <motion.button
                type="button"
                onClick={() => onEngage(meta.lf, "learn")}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                style={{ ...edtechPrimaryBtn, width: "100%" }}
              >
                {t("map.edtechCourse.ctaLearn")}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => onEngage(meta.lf, "exam")}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                style={{ ...edtechGhostBtn, width: "100%" }}
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
                style={{
                  ...edtechGhostBtn,
                  width: "100%",
                  borderColor: "rgba(148, 163, 184, 0.45)",
                  background: "#fff",
                }}
              >
                {t("map.edtechCourse.ctaCodex")}
              </motion.button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#64748b",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px 0",
                  fontFamily: "var(--nx-font-sans)",
                }}
              >
                {t("map.edtechClose")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "10px 8px",
        borderRadius: 10,
        border: "1px solid rgba(226, 232, 240, 0.92)",
        background: "#fff",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--nx-font-mono)",
          fontSize: 18,
          fontWeight: 800,
          color: "#0f172a",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: "#94a3b8",
          fontFamily: "var(--nx-font-sans)",
        }}
      >
        {label}
      </div>
    </div>
  );
}
