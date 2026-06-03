import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNexusI18n } from "../../../../lib/i18n/I18nProvider";
import { getAllLfCourseMeta } from "../../../../lib/learning/lfCourseCatalog";
import { useGameStore } from "../../../../store/useGameStore";
import { EdtechLfThumb } from "../EdtechLfThumb";
import {
  edtechCourseAp,
  edtechCourseBody,
  edtechCourseLfBadge,
  edtechCourseMeta,
  edtechCourseThumbWrap,
  edtechCourseTitle,
} from "../edtechCourseCardStyles";
import { EDTECH_CARD } from "../edtechHubTokens";
import type { HubZoneContext } from "./hubZoneTypes";

export function HubZoneCourses({ ctx }: { ctx: HubZoneContext }) {
  const { t } = useNexusI18n();
  const reduceMotion = ctx.reduceMotion;
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const allLfMeta = useMemo(() => getAllLfCourseMeta(), []);

  return (
    <div className="nx-edtech-zone-panel">
      <motion.section variants={EDTECH_CARD} className="nx-edtech-hub-section" aria-labelledby="nx-edtech-courses">
        <header className="nx-edtech-hub-section-head">
          <span className="nx-edtech-hub-section-kicker">{t("hub.edtech.coursesKicker")}</span>
          <h2 id="nx-edtech-courses" className="nx-edtech-hub-section-title">
            {t("hub.edtech.allFieldsTitle")}
          </h2>
          <p className="nx-edtech-hub-section-lead">
            {t("hub.edtech.allFieldsAp1")} · {t("hub.edtech.allFieldsAp2")}
          </p>
        </header>
        <motion.div className="nx-edtech-lf-catalog-grid">
          {allLfMeta.map((meta) => {
            const lfKey = meta.lfKey;
            const solved = new Set(learningCorrectByLf[lfKey] ?? []).size;
            const total = meta.totalExercises;
            const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;
            return (
              <motion.button
                key={meta.lf}
                type="button"
                className="nx-edtech-lf-catalog-card"
                onClick={() => ctx.onBeginLearningField(meta.lf)}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              >
                <span style={edtechCourseThumbWrap}>
                  <EdtechLfThumb lf={meta.lf} />
                  <span style={edtechCourseLfBadge}>LF{meta.lf}</span>
                </span>
                <span style={edtechCourseBody}>
                  <span style={edtechCourseAp}>{meta.ap}</span>
                  <strong style={edtechCourseTitle}>{meta.title}</strong>
                  <span style={edtechCourseMeta}>
                    {solved}/{total} · {pct}%
                  </span>
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.section>
    </div>
  );
}
