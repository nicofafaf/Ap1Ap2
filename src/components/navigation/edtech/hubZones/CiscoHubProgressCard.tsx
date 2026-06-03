import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CCNA1_ITN_PACKS } from "../../../../cisco/ccna1-v7/examCatalog";
import {
  ensureCiscoPacksLoaded,
  getPlayableCountForPack,
} from "../../../../cisco/ccna1-v7/loadPacks";
import type { CiscoPackId } from "../../../../cisco/types";
import { useNexusI18n } from "../../../../lib/i18n/I18nProvider";
import {
  ciscoCourseProgress,
  hasCiscoLeitnerData,
  pickWeakestCiscoModule,
  rankCiscoModuleWeaknesses,
} from "../../../../lib/cisco/ciscoProgress";
import { useGameStore } from "../../../../store/useGameStore";
import { EDTECH_CARD } from "../edtechHubTokens";
import type { HubZoneContext } from "./hubZoneTypes";

export function CiscoHubProgressCard({ ctx }: { ctx: HubZoneContext }) {
  const { t } = useNexusI18n();
  const leitner = useGameStore((s) => s.learningLeitnerByExerciseId);
  const beginCiscoWeaknessDrill = useGameStore((s) => s.beginCiscoWeaknessDrill);
  const [packsReady, setPacksReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void ensureCiscoPacksLoaded().then(() => {
      if (!cancelled) setPacksReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const packTotals = useMemo(() => {
    if (!packsReady) return {} as Partial<Record<CiscoPackId, number>>;
    const totals: Partial<Record<CiscoPackId, number>> = {};
    for (const meta of CCNA1_ITN_PACKS) {
      totals[meta.id] = getPlayableCountForPack(meta.id);
    }
    return totals;
  }, [packsReady]);

  const course = useMemo(
    () => (packsReady ? ciscoCourseProgress(leitner, packTotals) : { solved: 0, total: 0, pct: 0 }),
    [leitner, packTotals, packsReady]
  );

  const weakest = useMemo(
    () => (hasCiscoLeitnerData(leitner) ? pickWeakestCiscoModule(leitner) : null),
    [leitner]
  );

  const topWeak = useMemo(
    () => (hasCiscoLeitnerData(leitner) ? rankCiscoModuleWeaknesses(leitner, 3) : []),
    [leitner]
  );

  if (!packsReady) return null;

  const startWeakness = () => {
    beginCiscoWeaknessDrill(weakest?.packId);
    ctx.onBeginLearningField(10);
  };

  return (
    <motion.section
      variants={EDTECH_CARD}
      className="nx-edtech-hub-section nx-cisco-progress-card"
      aria-labelledby="nx-cisco-progress-title"
    >
      <div className="nx-cisco-progress-head">
        <h3 id="nx-cisco-progress-title" className="nx-edtech-zone-block-title">
          {t("cisco.progressCardTitle")}
        </h3>
        <span className="nx-cisco-progress-pct">{course.pct}%</span>
      </div>
      <p className="nx-edtech-zone-block-lead">
        {t("cisco.progressCardLead")
          .replace("{solved}", String(course.solved))
          .replace("{total}", String(course.total))}
      </p>
      <div className="nx-edtech-learn-progress-track nx-cisco-progress-track" aria-hidden>
        <div className="nx-edtech-learn-progress-fill" style={{ width: `${course.pct}%` }} />
      </div>

      {topWeak.length > 0 ? (
        <ul className="nx-cisco-progress-modules">
          {topWeak.map((w) => (
            <li key={w.module}>
              {t("cisco.progressModuleRow").replace("{n}", String(w.module))}
            </li>
          ))}
        </ul>
      ) : (
        <p className="nx-cisco-progress-hint">
          {t("cisco.progressCardHint")}
        </p>
      )}

      <div className="nx-cisco-progress-actions">
        <button type="button" className="nx-cisco-pack-btn" onClick={() => ctx.onZoneChange("ccna")}>
          {t("cisco.progressGoHub")}
        </button>
        {weakest ? (
          <button type="button" className="nx-cisco-pack-btn nx-cisco-pack-btn--exam" onClick={startWeakness}>
            {t("cisco.coachCta", "Schwächen üben")}
          </button>
        ) : null}
      </div>
    </motion.section>
  );
}
