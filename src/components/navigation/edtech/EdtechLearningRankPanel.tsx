import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import {
  CITADEL_RANK_IDS,
  LEARNING_RANKS,
  type LearningRankId,
} from "../../../data/learningRankRegistry";
import { buildLearningRankSnapshot } from "../../../lib/progression/learningRank";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { useGameStore } from "../../../store/useGameStore";
import { LearningRankBadge } from "./LearningRankBadge";
import { cyanAccent, goldAccent, sectionH2 } from "./edtechHubTokens";
import "./edtechLearningRank.css";

export type EdtechLearningRankPanelProps = {
  onBeginRanked?: () => void;
  onOpenLadder?: () => void;
};

export function EdtechLearningRankPanel({ onBeginRanked, onOpenLadder }: EdtechLearningRankPanelProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const activeRankedRun = useGameStore((s) => s.activeRankedRun);
  const rankedRunLpSession = useGameStore((s) => s.rankedRunLpSession);
  const lp = useGameStore((s) => s.learningRankLp);
  const snap = useMemo(
    () => buildLearningRankSnapshot(lp, learningCorrectByLf),
    [lp, learningCorrectByLf]
  );

  const rankTitle = t(`learningRank.${snap.rankId}.title`);
  const rankBody = t(`learningRank.${snap.rankId}.body`);

  return (
    <section className="nx-edtech-rank-panel" aria-labelledby="nx-edtech-rank-title">
      <div className="nx-edtech-rank-head">
        <div>
          <h2 id="nx-edtech-rank-title" style={sectionH2}>
            {t("learningRank.panelTitle")}
          </h2>
          <p className="nx-edtech-rank-lead">{t("learningRank.panelLead")}</p>
        </div>
        <div className="nx-edtech-rank-lp-block">
          <span className="nx-edtech-rank-lp-label">{t("learningRank.lpLabel")}</span>
          <span className="nx-edtech-rank-lp-value" style={{ color: goldAccent }}>
            {snap.lp}
            {activeRankedRun && rankedRunLpSession > 0 ? (
              <span className="nx-edtech-rank-lp-session">+{rankedRunLpSession}</span>
            ) : null}
          </span>
        </div>
      </div>

      <div className="nx-edtech-rank-hero">
        <LearningRankBadge rankId={snap.rankId} size="hero" showLabel label={rankTitle} sublabel={rankBody} />
        <div className="nx-edtech-rank-hero-stats">
          <div>
            <span className="nx-edtech-rank-stat-label">{t("learningRank.masteryLabel")}</span>
            <strong>
              {snap.masteryPct}% · {snap.solved}/{snap.total}
            </strong>
          </div>
          {snap.nextRank ? (
            <div>
              <span className="nx-edtech-rank-stat-label">{t("learningRank.nextRank")}</span>
              <strong style={{ color: snap.nextRank.accent }}>
                {t(`learningRank.${snap.nextRank.id}.title`)}
              </strong>
              <div className="nx-edtech-rank-progress-track" aria-hidden>
                <motion.span
                  className="nx-edtech-rank-progress-fill"
                  initial={false}
                  animate={{ width: `${snap.progressToNext}%` }}
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 26 }}
                  style={{
                    background: `linear-gradient(90deg, ${snap.rank.accent}, ${cyanAccent})`,
                  }}
                />
              </div>
              <span className="nx-edtech-rank-progress-hint">
                {t("learningRank.progressHint")
                  .replace("{lp}", String(snap.lpToNext))
                  .replace("{pct}", String(snap.masteryToNextPct))}
              </span>
            </div>
          ) : (
            <p className="nx-edtech-rank-maxed">{t("learningRank.maxRank")}</p>
          )}
        </div>
      </div>

      <div className="nx-edtech-rank-ladder" role="list" aria-label={t("learningRank.ladderAria")}>
        {LEARNING_RANKS.map((r) => {
          const unlocked =
            snap.lp >= r.minLp && snap.masteryPct >= r.minMasteryPct;
          const current = r.id === snap.rankId;
          return (
            <div
              key={r.id}
              role="listitem"
              className={`nx-edtech-rank-ladder-cell${current ? " nx-edtech-rank-ladder-cell--current" : ""}${unlocked ? "" : " nx-edtech-rank-ladder-cell--locked"}`}
              style={{ borderColor: current ? r.accent : undefined }}
            >
              <LearningRankBadge rankId={r.id} size="sm" locked={!unlocked} />
              <span className="nx-edtech-rank-ladder-name">{t(`learningRank.${r.id}.title`)}</span>
            </div>
          );
        })}
      </div>

      <div className="nx-edtech-rank-actions">
        {onBeginRanked ? (
          <motion.button
            type="button"
            className="nx-edtech-rank-cta nx-edtech-rank-cta--primary"
            onClick={onBeginRanked}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            {t("learningRank.rankedCta")}
          </motion.button>
        ) : null}
        {onOpenLadder ? (
          <motion.button
            type="button"
            className="nx-edtech-rank-cta nx-edtech-rank-cta--ghost"
            onClick={onOpenLadder}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          >
            {t("learningRank.ladderCta")}
          </motion.button>
        ) : null}
      </div>
    </section>
  );
}

/** Citadel / Briefing: vier Stufen mit Bildern */
export function CitadelRankCards({
  rankIds = CITADEL_RANK_IDS,
  dark = false,
}: {
  rankIds?: readonly LearningRankId[];
  dark?: boolean;
}) {
  const { t } = useNexusI18n();
  return (
    <div className="nx-citadel-rank-rail">
      {rankIds.map((id, i) => (
        <article
          key={id}
          className="nx-citadel-rank-card"
          style={
            dark
              ? {
                  background: "rgba(15, 23, 42, 0.72)",
                  borderColor: "rgba(214, 181, 111, 0.22)",
                }
              : undefined
          }
        >
          <LearningRankBadge rankId={id} size="lg" />
          <div className="nx-citadel-rank-tier">{t(`citadel.ranks.${i}.tier`)}</div>
          <h3
            className="nx-citadel-rank-title"
            style={dark ? { color: "rgba(251, 247, 239, 0.96)" } : undefined}
          >
            {t(`citadel.ranks.${i}.title`)}
          </h3>
          <p
            className="nx-citadel-rank-body"
            style={dark ? { color: "rgba(203, 213, 225, 0.82)" } : undefined}
          >
            {t(`citadel.ranks.${i}.body`)}
          </p>
        </article>
      ))}
    </div>
  );
}
