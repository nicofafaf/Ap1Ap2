import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { LearningField } from "../../../data/nexusRegistry";
import { ensureCurriculumLoaded } from "../../../lib/learning/curriculumAccess";
import { getGrundlageTheoryChapters } from "../../../lib/learning/grundlageTheoryChapters";
import { getLfCourseMeta } from "../../../lib/learning/lfCourseCatalog";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { useGameStore } from "../../../store/useGameStore";
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
      className="nx-edtech-theory-root"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nx-edtech-theory-heading"
    >
      <header className="nx-edtech-theory-header">
        <div className="nx-edtech-theory-header-text">
          <span className="nx-edtech-theory-kicker">
            {meta?.ap ?? "AP"} · LF{lfNum}
          </span>
          <h1 id="nx-edtech-theory-heading" className="nx-edtech-theory-title">
            {meta?.title ?? lf}
          </h1>
          <p className="nx-edtech-theory-lead">
            {t("edtechTheory.lead", "Grundlagen kurz lesen — dieselben Texte wie vor den Übungen")}
          </p>
          {total > 0 ? (
            <div className="nx-edtech-theory-progress">
              <span>
                {t("edtechTheory.chapterProgress", "Kapitel {n} von {total}")
                  .replace("{n}", String(safeIdx + 1))
                  .replace("{total}", String(total))}
              </span>
              <div className="nx-edtech-theory-progress-track" aria-hidden>
                <div
                  className="nx-edtech-theory-progress-fill"
                  style={{ width: `${((safeIdx + 1) / total) * 100}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
        <button type="button" className="nx-edtech-theory-close" onClick={onClose}>
          {t("edtechTheory.close", "Schließen")}
        </button>
      </header>

      <div className="nx-edtech-theory-body">
        {!ready ? (
          <p className="nx-edtech-theory-loading">{t("edtechTheory.loading", "Inhalte werden geladen…")}</p>
        ) : total === 0 ? (
          <section className="nx-edtech-theory-card nx-edtech-theory-card--empty">
            <h2>{t("edtechTheory.emptyTitle", "Noch keine Lesekapitel")}</h2>
            <p>{t("edtechTheory.emptyBody", "Starte die Übungen — dort steht die Erklärung vor jeder Frage")}</p>
            {onStartExercises ? (
              <button type="button" className="nx-edtech-theory-cta-primary" onClick={onStartExercises}>
                {t("map.edtechCourse.ctaLearn", "Übungen starten")}
              </button>
            ) : null}
          </section>
        ) : chapter ? (
          <div className="nx-edtech-theory-layout">
            <main className="nx-edtech-theory-main">
              <nav className="nx-edtech-theory-nav" aria-label={t("edtechTheory.navAria", "Kapitel")}>
                <button type="button" className="nx-edtech-theory-nav-btn" onClick={() => goChapter(-1)}>
                  {t("edtechTheory.prev", "Zurück")}
                </button>
                <button type="button" className="nx-edtech-theory-nav-btn" onClick={() => goChapter(1)}>
                  {t("edtechTheory.next", "Weiter")}
                </button>
              </nav>

              <article className="nx-edtech-theory-card">
                <div className="nx-edtech-theory-card-label">
                  {chapter.topic || t("edtechTheory.topicFallback", "Grundlagen")}
                </div>
                <h2>{chapter.title}</h2>
                <p className="nx-edtech-theory-read-kicker">{chapter.readTitle}</p>
                {chapter.coachLine ? (
                  <p className="nx-edtech-theory-coach">{chapter.coachLine}</p>
                ) : null}
                <p className="nx-edtech-theory-body-text">{chapter.body}</p>
                {chapter.example ? (
                  <aside className="nx-edtech-theory-example">
                    <span className="nx-edtech-theory-example-label">{chapter.example.label}</span>
                    <p>{chapter.example.body}</p>
                  </aside>
                ) : null}
              </article>
            </main>

            <aside className="nx-edtech-theory-sidebar" aria-label={t("edtechTheory.tocAria", "Alle Kapitel")}>
              <h3 className="nx-edtech-theory-sidebar-title">
                {t("edtechTheory.tocTitle", "Kapitel")}
              </h3>
              <ul className="nx-edtech-theory-toc">
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
                      <span className="nx-edtech-theory-toc-label">{ch.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        ) : null}
      </div>

      {onStartExercises && total > 0 ? (
        <footer className="nx-edtech-theory-footer">
          <button type="button" className="nx-edtech-theory-cta-primary" onClick={onStartExercises}>
            {t("edtechTheory.ctaPractice", "Jetzt üben")}
          </button>
        </footer>
      ) : null}
    </motion.div>
  );
}
