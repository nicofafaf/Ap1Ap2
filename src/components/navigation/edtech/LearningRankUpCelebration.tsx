import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect } from "react";
import type { LearningRankId } from "../../../data/learningRankRegistry";
import { useBossAudioEngine } from "../../../lib/audio/bossAudioEngine";
import { downloadLearningRankCertificate } from "../../../lib/progression/learningRankCertificate";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { useGameStore } from "../../../store/useGameStore";
import { LearningRankBadge } from "./LearningRankBadge";
import "./edtechLearningRank.css";

export type LearningRankUpCelebrationProps = {
  rankId: LearningRankId | null;
  onDismiss: () => void;
};

export function LearningRankUpCelebration({ rankId, onDismiss }: LearningRankUpCelebrationProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const { playArchiveSealKlunk, playRankSound } = useBossAudioEngine();
  const playerName = useGameStore((s) => s.playerName);
  const learningRankLp = useGameStore((s) => s.learningRankLp);

  useEffect(() => {
    if (!rankId) return;
    void playArchiveSealKlunk();
    void playRankSound("S");
  }, [playArchiveSealKlunk, playRankSound, rankId]);

  const handleCert = useCallback(() => {
    if (!rankId) return;
    void downloadLearningRankCertificate({
      rankId,
      playerName: playerName?.trim() || t("learningRank.defaultPilot"),
      lp: learningRankLp,
    });
  }, [learningRankLp, playerName, rankId, t]);

  return (
    <AnimatePresence>
      {rankId ? (
        <motion.div
          key={`rank-up-${rankId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="nx-rank-up-overlay"
          onClick={onDismiss}
        >
          <motion.div
            className="nx-rank-up-card"
            initial={reduceMotion ? false : { scale: 0.82, y: 40, rotateX: 8 }}
            animate={{ scale: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {!reduceMotion ? (
              <motion.div
                className="nx-rank-up-glow"
                aria-hidden
                animate={{ opacity: [0.35, 0.75, 0.4], scale: [1, 1.12, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : null}
            <p className="nx-rank-up-kicker">{t("learningRank.rankUpKicker")}</p>
            <LearningRankBadge
              rankId={rankId}
              size="hero"
              showLabel
              label={t(`learningRank.${rankId}.title`)}
              sublabel={t(`learningRank.${rankId}.body`)}
            />
            <p className="nx-rank-up-lead">{t("learningRank.rankUpLead")}</p>
            <div className="nx-rank-up-actions">
              <motion.button
                type="button"
                className="nx-rank-up-btn nx-rank-up-btn--gold"
                onClick={handleCert}
                whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              >
                {t("learningRank.rankUpCert")}
              </motion.button>
              <motion.button
                type="button"
                className="nx-rank-up-btn nx-rank-up-btn--ghost"
                onClick={onDismiss}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              >
                {t("learningRank.rankUpContinue")}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
