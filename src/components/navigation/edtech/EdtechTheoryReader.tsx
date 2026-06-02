import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { LearningField } from "../../../data/nexusRegistry";
import { publicAssetUrl } from "../../../data/nexusRegistry";
import { ensureCurriculumLoaded } from "../../../lib/learning/curriculumAccess";
import { getGrundlageTheoryChapters } from "../../../lib/learning/grundlageTheoryChapters";
import { getLfCourseMeta } from "../../../lib/learning/lfCourseCatalog";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { useGameStore } from "../../../store/useGameStore";
import { NexusCinematicShell } from "../../ui/NexusCinematicShell";
import "./edtechLearningSession.css";
import "./edtechTheoryReader.css";

export type EdtechTheoryReaderProps = {
  lf: LearningField;
  onClose: () => void;
  onStartExercises?: () => void;
};

export function EdtechTheoryReader({ lf, onClose, onStartExercises }: EdtechTheoryReaderProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const learningStoryMode = useGameStore((s) => s.learningStoryMode);
  const [ready, setReady] = useState(false);
  const [chapterIdx, setChapterIdx] = useState(0);

  const lfNum = Number.parseInt(lf.replace("LF", ""), 10);
  const meta = getLfCourseMeta(lfNum);

  useEffect(() => {
    let cancelled = false;
    void ensureCurriculumLoaded().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const chapters = useMemo(
    () => (ready ? getGrundlageTheoryChapters(lf, learningStoryMode) : []),
    [ready, lf, learningStoryMode]
  );

  useEffect(() => {
    setChapterIdx(0);
  }, [lf, ready]);

  const safeIdx = Math.min(chapterIdx, Math.max(chapters.length - 1, 0));
  const chapter = chapters[safeIdx] ?? null;
  const total = chapters.length;

  const goChapter = (delta: number) => {
    if (total === 0) return;
    setChapterIdx((i) => (i + delta + total) % total);
  };

  return (
    <motion.div
      className="nx-edtech-learn-root nx-edtech-theory-root"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nx-edtech-theory-heading"
    >
      <div className="nx-edtech-learn-hero-wrap">
        <NexusCinematicShell
          variant="strip"
          videoSrc={publicAssetUrl(`/assets/LF${lfNum}GIF.mp4`)}
          kicker={`${meta?.ap ?? "AP"} · LF${lfNum}`}
          title={meta?.title ?? lf}
          lead={t("edtechTheory.lead", "Grundlagen — kurz lesen, dann üben")}
        />
      </div>

      <header className="nx-edtech-learn-header">
        <div className="nx-edtech-learn-header-text">
          <span className="nx-edtech-learn-lf" id="nx-edtech-theory-heading">
            {t("edtechTheory.title", "Theorie")}
          </span>
          <p className="nx-edtech-theory-sub">
            {t("edtechTheory.subtitle", "Gleiche Inhalte wie beim Üben — nur zum Lesen")}
          </p>
          {total > 0 ? (
            <div className="nx-edtech-learn-progress-wrap">
              <div className="nx-edtech-learn-progress-meta">
                <span>
                  {t("edtechTheory.chapterProgress", "Kapitel {n} von {total}")
                    .replace("{n}", String(safeIdx + 1))
                    .replace("{total}", String(total))}
                </span>
              </div>
              <div className="nx-edtech-learn-progress-track" aria-hidden>
                <div
                  className="nx-edtech-learn-progress-fill"
                  style={{ width: `${total > 0 ? ((safeIdx + 1) / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
        <button type="button" className="nx-edtech-learn-close" onClick={onClose}>
          {t("edtechTheory.close", "Schließen")}
        </button>
      </header>

      <div className="nx-edtech-learn-body">
        <div className="nx-edtech-learn-inner nx-edtech-theory-inner">
          {!ready ? (
            <p className="nx-edtech-theory-loading">{t("edtechTheory.loading", "Inhalte werden geladen…")}</p>
          ) : total === 0 ? (
            <section className="nx-edtech-learn-card">
              <h3>{t("edtechTheory.emptyTitle", "Noch keine Lesekapitel")}</h3>
              <p>{t("edtechTheory.emptyBody", "Starte die Übungen — dort steht die Erklärung vor jeder Frage")}</p>
              {onStartExercises ? (
                <button type="button" className="nx-edtech-theory-cta-primary" onClick={onStartExercises}>
                  {t("map.edtechCourse.ctaLearn", "Übungen starten")}
                </button>
              ) : null}
            </section>
          ) : chapter ? (
            <>
              <nav className="nx-edtech-theory-nav" aria-label={t("edtechTheory.navAria", "Kapitel")}>
                <button type="button" className="nx-edtech-theory-nav-btn" onClick={() => goChapter(-1)}>
                  {t("edtechTheory.prev", "Zurück")}
                </button>
                <button type="button" className="nx-edtech-theory-nav-btn" onClick={() => goChapter(1)}>
                  {t("edtechTheory.next", "Weiter")}
                </button>
              </nav>

              <section className="nx-edtech-learn-card" aria-label={chapter.title}>
                <div className="nx-edtech-learn-card-label">
                  {chapter.topic || t("edtechTheory.topicFallback", "Grundlagen")}
                </div>
                <h3>{chapter.title}</h3>
                <div className="nx-edtech-theory-cards">
                  {chapter.cards.map((card) => (
                    <article key={`${chapter.id}-${card.title}`} className="nx-edtech-theory-card">
                      <h4>{card.title}</h4>
                      <p>{card.body}</p>
                    </article>
                  ))}
                </div>
                {chapter.example ? (
                  <aside className="nx-edtech-theory-example">
                    <span className="nx-edtech-theory-example-label">{chapter.example.label}</span>
                    <p>{chapter.example.body}</p>
                  </aside>
                ) : null}
              </section>

              <ul className="nx-edtech-theory-toc" aria-label={t("edtechTheory.tocAria", "Alle Kapitel")}>
                {chapters.map((ch, i) => (
                  <li key={ch.id}>
                    <button
                      type="button"
                      className={
                        i === safeIdx
                          ? "nx-edtech-theory-toc-btn nx-edtech-theory-toc-btn--active"
                          : "nx-edtech-theory-toc-btn"
                      }
                      onClick={() => setChapterIdx(i)}
                    >
                      <span className="nx-edtech-theory-toc-n">{i + 1}</span>
                      {ch.title}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>

      {onStartExercises && total > 0 ? (
        <footer className="nx-edtech-theory-footer">
          <button type="button" className="nx-edtech-theory-cta-primary" onClick={onStartExercises}>
            {t("map.edtechCourse.ctaLearn", "Übungen starten")}
          </button>
        </footer>
      ) : null}
    </motion.div>
  );
}
