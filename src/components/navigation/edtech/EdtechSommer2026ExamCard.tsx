import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import {
  SOMMER2026_EXAM_PACKS,
  getSommer2026PackProgress,
  type Sommer2026PackId,
} from "../../../lib/curriculum/sommer2026Exams";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { useGameStore } from "../../../store/useGameStore";
import { cyanAccent, goldAccent } from "./edtechHubTokens";
import "./edtechSommer2026Exam.css";

const PACK_ORDER: Sommer2026PackId[] = ["wiso", "ga1", "ga2"];

const PACK_ACCENT: Record<Sommer2026PackId, string> = {
  wiso: goldAccent,
  ga1: cyanAccent,
  ga2: "rgba(139, 92, 246, 0.95)",
};

export type EdtechSommer2026ExamCardProps = {
  onStartPack: (packId: Sommer2026PackId) => void;
};

export function EdtechSommer2026ExamCard({ onStartPack }: EdtechSommer2026ExamCardProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);

  const rows = useMemo(
    () =>
      PACK_ORDER.map((id) => {
        const pack = SOMMER2026_EXAM_PACKS[id];
        const progress = getSommer2026PackProgress(id, learningCorrectByLf);
        return { id, pack, progress };
      }),
    [learningCorrectByLf]
  );

  return (
    <section
      className="nx-edtech-sommer26"
      aria-labelledby="nx-edtech-sommer26-title"
    >
      <div className="nx-edtech-sommer26-head">
        <div>
          <h2 id="nx-edtech-sommer26-title">{t("hub.edtech.sommer26.title")}</h2>
          <p className="nx-edtech-sommer26-lead">{t("hub.edtech.sommer26.lead")}</p>
        </div>
        <span className="nx-edtech-sommer26-badge">{t("hub.edtech.sommer26.badge")}</span>
      </div>

      <div className="nx-edtech-sommer26-grid" role="list">
        {rows.map(({ id, pack, progress }, idx) => (
          <motion.article
            key={id}
            role="listitem"
            className="nx-edtech-sommer26-pack"
            style={{ "--nx-sommer-accent": PACK_ACCENT[id] } as CSSProperties}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : idx * 0.06 }}
          >
            <header className="nx-edtech-sommer26-pack-head">
              <span className="nx-edtech-sommer26-pack-tag">
                {t(`hub.edtech.sommer26.pack.${id}.tag`)}
              </span>
              <h3>{pack.title}</h3>
              <p>{pack.subtitle}</p>
            </header>

            <dl className="nx-edtech-sommer26-meta">
              <div>
                <dt>{t("hub.edtech.sommer26.metaDate")}</dt>
                <dd>{pack.examDate}</dd>
              </div>
              <div>
                <dt>{t("hub.edtech.sommer26.metaTime")}</dt>
                <dd>
                  {t("hub.edtech.sommer26.metaTimeVal").replace(
                    "{min}",
                    String(pack.durationMinutes)
                  )}
                </dd>
              </div>
              <div>
                <dt>{t("hub.edtech.sommer26.metaTasks")}</dt>
                <dd>
                  {t("hub.edtech.sommer26.metaTasksVal")
                    .replace("{mc}", String(pack.missionIds.length))
                    .replace("{orig}", String(pack.taskCount))}
                </dd>
              </div>
            </dl>

            <div className="nx-edtech-sommer26-progress" aria-hidden>
              <div
                className="nx-edtech-sommer26-progress-fill"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <p className="nx-edtech-sommer26-progress-label">
              {t("hub.edtech.sommer26.progress")
                .replace("{solved}", String(progress.solved))
                .replace("{total}", String(progress.total))}
            </p>

            <motion.button
              type="button"
              className="nx-edtech-sommer26-cta"
              onClick={() => onStartPack(id)}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
            >
              {t("hub.edtech.sommer26.start")}
            </motion.button>
          </motion.article>
        ))}
      </div>

      <p className="nx-edtech-sommer26-note">{t("hub.edtech.sommer26.note")}</p>
    </section>
  );
}
