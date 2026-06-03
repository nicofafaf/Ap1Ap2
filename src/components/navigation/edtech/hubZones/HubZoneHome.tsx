import { motion } from "framer-motion";
import { NexusCinematicShell } from "../../../ui/NexusCinematicShell";
import { cinematicGhostBtn, cinematicPrimaryBtn } from "../../../../lib/ui/nexusCinematicTokens";
import { useNexusI18n } from "../../../../lib/i18n/I18nProvider";
import { getHubPlatformStats } from "../../../../lib/learning/hubDashboardInsights";
import { EDTECH_CARD } from "../edtechHubTokens";
import { EdtechHubStatStrip } from "./EdtechHubStatStrip";
import { EdtechHubPlatformStats } from "./EdtechHubPlatformStats";
import type { HubZoneContext } from "./hubZoneTypes";

export function HubZoneHome({ ctx }: { ctx: HubZoneContext }) {
  const { t } = useNexusI18n();
  const platformStats = getHubPlatformStats();
  const { reduceMotion, continueTarget, learningModes, coveragePct, totalCorrect, totalCurriculum, nexusFragments, dailyParticipationStreak, unlockedSectors } = ctx;

  return (
    <div className="nx-edtech-zone-panel">
      <motion.div variants={EDTECH_CARD}>
        <NexusCinematicShell
          variant="hero"
          videoPriority
          kicker={
            (ctx.trainingTrack === "ae"
              ? t("hub.edtech.profileTrackAe")
              : ctx.trainingTrack === "fisi"
                ? t("hub.edtech.profileTrackFisi")
                : t("hub.edtech.heroBadge")) +
            (ctx.bundeslandId ? ` · ${t("hub.edtech.profileRegion").replace("{region}", ctx.bundeslandId)}` : "")
          }
          title={`${t("hub.edtech.welcomeBefore")} ${ctx.playerName ?? ""}${t("hub.edtech.welcomeAfter")}`}
          lead={`${ctx.lastLine} — ${t("hub.edtech.heroTitle")}`}
        >
          <motion.button
            type="button"
            onClick={ctx.onOpenMap}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            style={cinematicPrimaryBtn}
          >
            {t("hub.edtech.heroPrimary")}
          </motion.button>
          <motion.button
            type="button"
            onClick={() => ctx.onZoneChange("courses")}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            style={cinematicGhostBtn}
          >
            {t("hub.edtech.heroSecondary")}
          </motion.button>
          <EdtechHubPlatformStats stats={platformStats} />
        </NexusCinematicShell>
      </motion.div>

      <motion.section
        variants={EDTECH_CARD}
        className="nx-edtech-hub-section nx-edtech-hub-continue"
        aria-labelledby="nx-edtech-continue"
      >
        <div className="nx-edtech-hub-continue-head">
          <h2 id="nx-edtech-continue" className="nx-edtech-hub-continue-title">
            {t("hub.edtech.continueTitle")}
          </h2>
          {continueTarget ? <span className="nx-edtech-hub-continue-badge">LF{continueTarget.lf}</span> : null}
        </div>
        {continueTarget ? (
          <>
            <p className="nx-edtech-hub-continue-topic">{continueTarget.title}</p>
            <p className="nx-edtech-hub-continue-meta">
              {t("hub.edtech.continueProgress")
                .replace("{solved}", String(continueTarget.solved))
                .replace("{total}", String(continueTarget.total))
                .replace("{lf}", String(continueTarget.lf))}
            </p>
            <motion.button
              type="button"
              className="nx-edtech-hub-continue-cta"
              onClick={() => ctx.onBeginLearningField(continueTarget.lf)}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            >
              {t("hub.edtech.continueCta")}
            </motion.button>
          </>
        ) : (
          <>
            <p className="nx-edtech-hub-continue-topic">{t("hub.edtech.continueNoneTitle")}</p>
            <p className="nx-edtech-hub-continue-meta">{t("hub.edtech.continueNoneBody")}</p>
            <motion.button type="button" className="nx-edtech-hub-continue-cta" onClick={ctx.onOpenMap}>
              {t("hub.edtech.continueNoneCta")}
            </motion.button>
          </>
        )}
      </motion.section>

      <motion.section variants={EDTECH_CARD} className="nx-edtech-hub-section" aria-labelledby="nx-edtech-modes">
        <header className="nx-edtech-hub-section-head">
          <span className="nx-edtech-hub-section-kicker">{t("hub.edtech.modesKicker", "Einstieg")}</span>
          <h2 id="nx-edtech-modes" className="nx-edtech-hub-section-title">
            {t("hub.edtech.modesTitle")}
          </h2>
        </header>
        <div className="nx-edtech-hub-mode-grid">
          {learningModes.map((mode) => (
            <motion.button
              key={mode.title}
              type="button"
              className="nx-edtech-hub-mode-card"
              style={{ ["--nx-mode-accent" as string]: mode.accent }}
              onClick={mode.onClick}
              whileHover={reduceMotion ? undefined : { y: -2 }}
            >
              <strong>{mode.title}</strong>
              <span>{mode.body}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      <EdtechHubStatStrip
        nexusFragments={nexusFragments}
        coveragePct={coveragePct}
        totalCorrect={totalCorrect}
        totalCurriculum={totalCurriculum}
        dailyParticipationStreak={dailyParticipationStreak}
        unlockedSectors={unlockedSectors}
      />

      <aside className="nx-edtech-hub-trust">
        <h3>{t("hub.edtech.trustTitle")}</h3>
        <p>{t("hub.edtech.trustBody")}</p>
        <p className="nx-edtech-hub-trust-sub">{t("hub.edtech.feed.trustPwa")}</p>
      </aside>
    </div>
  );
}
