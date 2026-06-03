import { motion, useReducedMotion } from "framer-motion";
import { lazy, Suspense, useMemo } from "react";
import { publicAssetUrl } from "../../../../data/nexusRegistry";
import { useNexusI18n } from "../../../../lib/i18n/I18nProvider";
import { EdtechLazyVideo } from "../EdtechLazyVideo";
import { EdtechLearningRankPanel } from "../EdtechLearningRankPanel";
import { EdtechLfThumb } from "../EdtechLfThumb";
import { EDTECH_CARD } from "../edtechHubTokens";
import type { HubZoneContext } from "./hubZoneTypes";

const SkillRadarLazy = lazy(() =>
  import("../../SkillRadar").then((m) => ({ default: m.SkillRadar }))
);

export function HubZoneProgress({ ctx }: { ctx: HubZoneContext }) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const { learningTip, dailyLf, dailyParticipationStreak } = ctx;

  const simulators = useMemo(
    () => [
      {
        label: t("hub.edtech.mega.toolNetwork"),
        video: publicAssetUrl("/assets/LF3GIF.mp4"),
        onClick: () => ctx.onBeginLearningField(3),
      },
      {
        label: t("hub.edtech.mega.simSql"),
        video: publicAssetUrl("/assets/LF5GIF.mp4"),
        onClick: () => ctx.onBeginLearningField(5),
      },
      {
        label: t("hub.edtech.mega.simNetplan"),
        video: publicAssetUrl("/assets/LF10GIF.mp4"),
        onClick: () => ctx.onBeginLearningField(10),
      },
      {
        label: t("hub.edtech.tileTerminalTitle"),
        video: publicAssetUrl("/assets/LF1GIF.mp4"),
        onClick: ctx.onOpenMap,
      },
      {
        label: t("hub.edtech.mega.daily"),
        video: publicAssetUrl("/assets/LF11GIF.mp4"),
        onClick: () => ctx.mapWithExtras({ openDailyPanel: true }),
      },
      {
        label: t("hub.edtech.mega.codex"),
        video: publicAssetUrl("/assets/LF8GIF.mp4"),
        onClick: () => ctx.mapWithExtras({ openCodex: true }),
      },
    ],
    [ctx, t]
  );

  return (
    <div className="nx-edtech-zone-panel nx-edtech-zone-progress">
      <motion.section variants={EDTECH_CARD} className="nx-edtech-hub-section">
        <EdtechLearningRankPanel
          onBeginRanked={ctx.onBeginRanked}
          onOpenLadder={() => ctx.mapWithExtras({ overlay: "LEADERBOARD" })}
        />
      </motion.section>

      <motion.section
        variants={EDTECH_CARD}
        className="nx-edtech-hub-section nx-edtech-progress-tip"
        aria-labelledby="nx-edtech-tip"
      >
        <div className="nx-edtech-progress-tip-head">
          <h3 id="nx-edtech-tip" className="nx-edtech-progress-tip-title">
            {t("hub.edtech.tipTitle")}
          </h3>
          <span className="nx-edtech-progress-tip-score">
            {t("hub.edtech.tipExamLabel")}: {learningTip.examReadyPct}%
          </span>
        </div>
        <p className="nx-edtech-progress-tip-body">{learningTip.message}</p>
        <motion.button
          type="button"
          className="nx-edtech-progress-tip-cta"
          onClick={() => ctx.onBeginLearningField(learningTip.lf)}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        >
          {t("hub.edtech.tipCta")} · LF{learningTip.lf}
        </motion.button>
      </motion.section>

      <motion.section variants={EDTECH_CARD} className="nx-edtech-hub-section" aria-labelledby="nx-edtech-radar">
        <h3 id="nx-edtech-radar" className="nx-edtech-zone-block-title">
          {t("hub.edtech.radarTitle")}
        </h3>
        <p className="nx-edtech-zone-block-lead">{t("hub.edtech.radarLead")}</p>
        <div className="nx-edtech-progress-radar">
          <Suspense fallback={null}>
            <SkillRadarLazy layoutVariant="compact" epilogueActive />
          </Suspense>
        </div>
      </motion.section>

      <motion.section
        variants={EDTECH_CARD}
        className="nx-edtech-hub-section nx-edtech-progress-daily"
        aria-labelledby="nx-edtech-daily-inline"
      >
        <span className="nx-edtech-progress-daily-thumb">
          <EdtechLfThumb lf={dailyLf} />
        </span>
        <div className="nx-edtech-progress-daily-body">
          <h3 id="nx-edtech-daily-inline" className="nx-edtech-zone-block-title">
            {t("hub.edtech.feed.dailyTitle")}
          </h3>
          <p className="nx-edtech-zone-block-lead">
            {t("hub.edtech.dailyTodayLf").replace("{dailyLf}", String(dailyLf))} ·{" "}
            {t("hub.edtech.feed.dailyLead").replace("{streak}", String(dailyParticipationStreak))}
          </p>
          <motion.button
            type="button"
            className="nx-edtech-progress-daily-cta"
            onClick={() => ctx.onBeginLearningField(dailyLf)}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          >
            {t("hub.edtech.feed.dailyCta")}
          </motion.button>
        </div>
      </motion.section>

      <motion.section variants={EDTECH_CARD} className="nx-edtech-hub-section" aria-labelledby="nx-edtech-sim">
        <h3 id="nx-edtech-sim" className="nx-edtech-zone-block-title">
          {t("hub.edtech.feed.simTitle")}
        </h3>
        <div className="nx-edtech-progress-sim-scroll">
          {simulators.map((sim) => (
            <motion.button
              key={sim.label}
              type="button"
              className="nx-edtech-progress-sim-card"
              onClick={sim.onClick}
              whileHover={reduceMotion ? undefined : { y: -3 }}
            >
              <EdtechLazyVideo
                src={sim.video}
                mode="hover"
                style={{ width: "100%", height: "7.5rem", objectFit: "cover", display: "block" }}
              />
              <span className="nx-edtech-progress-sim-label">{sim.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
