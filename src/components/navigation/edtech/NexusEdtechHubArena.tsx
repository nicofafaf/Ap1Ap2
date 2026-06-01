import { motion, useReducedMotion } from "framer-motion";
import { lazy, Suspense, useMemo, type CSSProperties } from "react";
import { publicAssetUrl, type LearningField } from "../../../data/nexusRegistry";
import type { NexusHubMapExtras } from "../../../lib/ui/hubMapNavigation";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import {
  getHubContinueTarget,
  getHubLearningTip,
  getHubPlatformStats,
} from "../../../lib/learning/hubDashboardInsights";
import { getAllLfCourseMeta } from "../../../lib/learning/lfCourseCatalog";
import { getDailyIncursionDefinition, getUtcDateKey } from "../../../lib/dailyIncursion";
import { useGameStore } from "../../../store/useGameStore";

const SkillRadarLazy = lazy(() =>
  import("../SkillRadar").then((m) => ({ default: m.SkillRadar }))
);
import { EdtechLazyVideo } from "./EdtechLazyVideo";
import { NexusCinematicShell } from "../../ui/NexusCinematicShell";
import { cinematicGhostBtn, cinematicPrimaryBtn } from "../../../lib/ui/nexusCinematicTokens";
import { EdtechExamReadinessCard } from "./EdtechExamReadinessCard";
import { EdtechSommer2026ExamCard } from "./EdtechSommer2026ExamCard";
import { EdtechLfThumb } from "./EdtechLfThumb";
import { StreakCelebration } from "./StreakCelebration";
import {
  edtechCourseAp,
  edtechCourseBody,
  edtechCourseCardShell,
  edtechCourseGridStyle,
  edtechCourseLfBadge,
  edtechCourseMeta,
  edtechCourseThumbWrap,
  edtechCourseTitle,
} from "./edtechCourseCardStyles";
import {
  cyanAccent,
  EDTECH_CARD,
  EDTECH_STAGGER,
  edtechCardPanel,
  glassPanel,
  goldAccent,
  sectionH2,
  sectionH3,
} from "./edtechHubTokens";

export type NexusEdtechHubArenaProps = {
  onOpenMap: () => void;
  onOpenFieldList: () => void;
  onBeginLearningField: (lf: number) => void;
  onBeginExamField?: (lf: number) => void;
  onBlitzTraining?: () => void;
  mapWithExtras: (extras: NexusHubMapExtras) => void;
};

export function NexusEdtechHubArena({
  onOpenMap,
  onOpenFieldList,
  onBeginLearningField,
  onBeginExamField,
  onBlitzTraining,
  mapWithExtras,
}: NexusEdtechHubArenaProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();

  const playerName = useGameStore((s) => s.playerName);
  const trainingTrack = useGameStore((s) => s.trainingTrack);
  const bundeslandId = useGameStore((s) => s.bundeslandId);
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const nexusFragments = useGameStore((s) => s.nexusFragments);
  const dailyParticipationStreak = useGameStore((s) => s.dailyParticipationStreak);
  const unlockedSectors = useGameStore((s) => s.campaign.unlockedSectors);
  const lastEvents = useGameStore((s) => s.lastCombatLearningEvents);
  const learningLeitnerByExerciseId = useGameStore((s) => s.learningLeitnerByExerciseId);
  const streakCelebrationMilestone = useGameStore((s) => s.streakCelebrationMilestone);
  const clearStreakCelebration = useGameStore((s) => s.clearStreakCelebration);
  const beginExamForLf = useGameStore((s) => s.beginExamForLf);
  const beginSommer2026Exam = useGameStore((s) => s.beginSommer2026Exam);

  const dateKey = getUtcDateKey();
  const dailyLf = useMemo(() => getDailyIncursionDefinition(dateKey).targetLf, [dateKey]);
  const platformStats = useMemo(() => getHubPlatformStats(), []);
  const allLfMeta = useMemo(() => getAllLfCourseMeta(), []);
  const continueTarget = useMemo(
    () => getHubContinueTarget(lastEvents[0], learningCorrectByLf),
    [lastEvents, learningCorrectByLf],
  );
  const learningTip = useMemo(
    () => getHubLearningTip(learningLeitnerByExerciseId, learningCorrectByLf),
    [learningLeitnerByExerciseId, learningCorrectByLf],
  );

  const learningModes = useMemo(
    () => [
      {
        title: t("hub.edtech.modeLearn"),
        body: t("hub.edtech.modeLearnBody"),
        accent: goldAccent,
        onClick: onOpenMap,
      },
      {
        title: t("hub.edtech.modeExam"),
        body: t("hub.edtech.modeExamBody"),
        accent: "rgba(239, 68, 68, 0.92)",
        onClick: () => {
          const lf = continueTarget?.lf ?? learningTip.lf;
          if (onBeginExamField) onBeginExamField(lf);
          else beginExamForLf(lf);
        },
      },
      {
        title: t("hub.edtech.modeBlitz"),
        body: t("hub.edtech.modeBlitzBody"),
        accent: cyanAccent,
        onClick: () => onBlitzTraining?.(),
      },
      {
        title: t("hub.edtech.modeDaily"),
        body: t("hub.edtech.modeDailyBody"),
        accent: "rgba(139, 92, 246, 0.95)",
        onClick: () => mapWithExtras({ openDailyPanel: true }),
      },
    ],
    [beginExamForLf, continueTarget?.lf, learningTip.lf, mapWithExtras, onBeginExamField, onBlitzTraining, t],
  );

  const { totalCorrect, totalCurriculum } = useMemo(() => {
    let correct = 0;
    let curriculum = 0;
    for (const meta of allLfMeta) {
      correct += new Set(learningCorrectByLf[meta.lfKey] ?? []).size;
      curriculum += meta.totalExercises;
    }
    return { totalCorrect: correct, totalCurriculum: curriculum };
  }, [allLfMeta, learningCorrectByLf]);

  const lastLine = useMemo(() => {
    const ev = lastEvents[0];
    if (!ev) return t("hub.edtech.lastActivityNone");
    const title = ev.title?.trim() || ev.exerciseId;
    return `${t("hub.edtech.lastActivityLabel")} ${title}`;
  }, [lastEvents, t]);

  const coveragePct =
    totalCurriculum > 0 ? Math.min(100, Math.round((totalCorrect / totalCurriculum) * 100)) : 0;

  const simulators = useMemo(
    () => [
      {
        label: t("hub.edtech.mega.toolNetwork"),
        video: publicAssetUrl("/assets/LF3GIF.mp4"),
        onClick: () => onBeginLearningField(3),
      },
      {
        label: t("hub.edtech.mega.simSql"),
        video: publicAssetUrl("/assets/LF5GIF.mp4"),
        onClick: () => onBeginLearningField(5),
      },
      {
        label: t("hub.edtech.mega.simNetplan"),
        video: publicAssetUrl("/assets/LF10GIF.mp4"),
        onClick: () => onBeginLearningField(10),
      },
      {
        label: t("hub.edtech.tileTerminalTitle"),
        video: publicAssetUrl("/assets/LF1GIF.mp4"),
        onClick: onOpenMap,
      },
      {
        label: t("hub.edtech.mega.daily"),
        video: publicAssetUrl("/assets/LF11GIF.mp4"),
        onClick: () => mapWithExtras({ openDailyPanel: true }),
      },
      {
        label: t("hub.edtech.mega.codex"),
        video: publicAssetUrl("/assets/LF8GIF.mp4"),
        onClick: () => mapWithExtras({ openCodex: true }),
      },
    ],
    [mapWithExtras, onBeginLearningField, onOpenMap, t]
  );

  return (
    <motion.div
      variants={EDTECH_STAGGER}
      initial="hidden"
      animate="show"
      style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 28 }}
    >
      <StreakCelebration
        milestone={streakCelebrationMilestone}
        onDismiss={clearStreakCelebration}
      />
      <motion.div variants={EDTECH_CARD}>
        <NexusCinematicShell
          variant="hero"
          videoPriority
          kicker={
            (trainingTrack === "ae"
              ? t("hub.edtech.profileTrackAe")
              : trainingTrack === "fisi"
                ? t("hub.edtech.profileTrackFisi")
                : t("hub.edtech.heroBadge")) +
            (bundeslandId
              ? ` · ${t("hub.edtech.profileRegion").replace("{region}", bundeslandId)}`
              : "")
          }
          title={`${t("hub.edtech.welcomeBefore")} ${playerName ?? ""}${t("hub.edtech.welcomeAfter")}`}
          lead={`${lastLine} — ${t("hub.edtech.heroTitle")}`}
        >
          <motion.button
            type="button"
            onClick={onOpenMap}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            style={cinematicPrimaryBtn}
          >
            {t("hub.edtech.heroPrimary")}
          </motion.button>
          <motion.button
            type="button"
            onClick={() => {
              document.getElementById("nx-edtech-all-fields")?.scrollIntoView({
                behavior: reduceMotion ? "auto" : "smooth",
                block: "start",
              });
            }}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            style={cinematicGhostBtn}
          >
            {t("hub.edtech.heroSecondary")}
          </motion.button>
        </NexusCinematicShell>
      </motion.div>

      <motion.section variants={EDTECH_CARD} aria-labelledby="nx-edtech-platform">
        <h2 id="nx-edtech-platform" style={sectionH2}>
          {t("hub.edtech.platformTitle")}
        </h2>
        <motion.div style={platformGridStyle}>
          <PlatformStat
            value={String(platformStats.totalExercises)}
            label={t("hub.edtech.platformExercises")}
            sub={t("hub.edtech.platformExercisesSub")}
            accent="cyan"
          />
          <PlatformStat
            value={String(platformStats.learningFieldCount)}
            label={t("hub.edtech.platformFields")}
            sub={t("hub.edtech.platformFieldsSub")}
            accent="gold"
          />
          <PlatformStat
            value={`${platformStats.practiceToolCount}+`}
            label={t("hub.edtech.platformTools")}
            sub={t("hub.edtech.platformToolsSub")}
            accent="violet"
          />
          <PlatformStat
            value={String(platformStats.examTrackCount)}
            label={t("hub.edtech.platformExams")}
            sub={t("hub.edtech.platformExamsSub")}
            accent="gold"
          />
        </motion.div>
      </motion.section>

      <motion.section variants={EDTECH_CARD}>
        <EdtechExamReadinessCard onFocusLf={onBeginLearningField} />
      </motion.section>

      <motion.section variants={EDTECH_CARD}>
        <EdtechSommer2026ExamCard onStartPack={beginSommer2026Exam} />
      </motion.section>

      <motion.section
        variants={EDTECH_CARD}
        style={continueShellStyle}
        aria-labelledby="nx-edtech-continue"
      >
        <div style={sectionHeadRowStyle}>
          <h2 id="nx-edtech-continue" style={{ ...sectionH2, margin: 0, color: "#f8fafc" }}>
            {t("hub.edtech.continueTitle")}
          </h2>
          {continueTarget ? (
            <span style={continueLfBadgeStyle}>LF{continueTarget.lf}</span>
          ) : null}
        </div>
        {continueTarget ? (
          <>
            <p style={continueTitleStyle}>{continueTarget.title}</p>
            <p style={continueMetaStyle}>
              {t("hub.edtech.continueProgress")
                .replace("{solved}", String(continueTarget.solved))
                .replace("{total}", String(continueTarget.total))
                .replace("{lf}", String(continueTarget.lf))}
            </p>
            <motion.button
              type="button"
              onClick={() => onBeginLearningField(continueTarget.lf)}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              style={continueCtaStyle}
            >
              {t("hub.edtech.continueCta")}
            </motion.button>
          </>
        ) : (
          <>
            <p style={continueTitleStyle}>{t("hub.edtech.continueNoneTitle")}</p>
            <p style={continueMetaStyle}>{t("hub.edtech.continueNoneBody")}</p>
            <motion.button
              type="button"
              onClick={onOpenMap}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              style={continueCtaStyle}
            >
              {t("hub.edtech.continueNoneCta")}
            </motion.button>
          </>
        )}
      </motion.section>

      <motion.section variants={EDTECH_CARD} aria-labelledby="nx-edtech-modes">
        <h2 id="nx-edtech-modes" style={sectionH2}>
          {t("hub.edtech.modesTitle")}
        </h2>
        <motion.div style={modeGridStyle}>
          {learningModes.map((mode) => (
            <motion.button
              key={mode.title}
              type="button"
              onClick={mode.onClick}
              whileHover={reduceMotion ? undefined : { y: -4 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              style={{ ...edtechCardPanel, ...modeCardStyle }}
            >
              <span style={{ ...modeAccentBarStyle, background: mode.accent }} aria-hidden />
              <strong style={modeTitleStyle}>{mode.title}</strong>
              <span style={modeBodyStyle}>{mode.body}</span>
            </motion.button>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        variants={EDTECH_CARD}
        style={{ ...edtechCardPanel, padding: "22px 24px" }}
        aria-labelledby="nx-edtech-tip"
      >
        <div style={sectionHeadRowStyle}>
          <h2 id="nx-edtech-tip" style={{ ...sectionH2, margin: 0 }}>
            {t("hub.edtech.tipTitle")}
          </h2>
          <span style={tipScoreStyle}>
            {t("hub.edtech.tipExamLabel")}: {learningTip.examReadyPct}%
          </span>
        </div>
        <p style={tipBodyStyle}>{learningTip.message}</p>
        <motion.button
          type="button"
          onClick={() => onBeginLearningField(learningTip.lf)}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          style={tipCtaStyle}
        >
          {t("hub.edtech.tipCta")} · LF{learningTip.lf}
        </motion.button>
      </motion.section>

      <motion.section variants={EDTECH_CARD} aria-labelledby="nx-edtech-radar">
        <h2 id="nx-edtech-radar" style={sectionH2}>
          {t("hub.edtech.radarTitle")}
        </h2>
        <p style={allFieldsLeadStyle}>{t("hub.edtech.radarLead")}</p>
        <div style={radarWrapStyle}>
          <Suspense fallback={null}>
            <SkillRadarLazy layoutVariant="compact" epilogueActive />
          </Suspense>
        </div>
      </motion.section>

      <motion.div
        variants={EDTECH_CARD}
        style={statsStripStyle}
        role="group"
        aria-label={t("hub.edtech.statsAria")}
      >
        <StatChip label={t("hub.edtech.statFragments")} value={String(nexusFragments)} accent="gold" />
        <StatChip
          label={t("hub.edtech.statCoverage")}
          value={`${coveragePct}%`}
          sub={`${totalCorrect}/${totalCurriculum}`}
          accent="cyan"
        />
        <StatChip label={t("hub.edtech.statStreak")} value={String(dailyParticipationStreak)} accent="violet" />
        <StatChip label={t("hub.edtech.statSectors")} value={String(unlockedSectors.length)} accent="cyan" />
        <StatChip label={t("hub.edtech.feed.livePulse")} value="●" accent="gold" sub={t("hub.edtech.feed.liveSub")} />
      </motion.div>

      <motion.section
        variants={EDTECH_CARD}
        style={{ ...glassPanel, padding: "22px 24px", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}
        aria-labelledby="nx-edtech-daily-inline"
      >
        <span style={dailyThumbWrapStyle}>
          <EdtechLfThumb lf={dailyLf} />
        </span>
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <h2 id="nx-edtech-daily-inline" style={{ ...sectionH2, marginBottom: 6 }}>
            {t("hub.edtech.feed.dailyTitle")}
          </h2>
          <p style={dailyLeadStyle}>
            {t("hub.edtech.dailyTodayLf").replace("{dailyLf}", String(dailyLf))} ·{" "}
            {t("hub.edtech.feed.dailyLead").replace("{streak}", String(dailyParticipationStreak))}
          </p>
          <motion.button
            type="button"
            onClick={() => onBeginLearningField(dailyLf)}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            style={{ ...dailyCtaStyle, marginTop: 12 }}
          >
            {t("hub.edtech.feed.dailyCta")}
          </motion.button>
        </div>
      </motion.section>

      <motion.section variants={EDTECH_CARD} aria-labelledby="nx-edtech-all-fields">
        <h2 id="nx-edtech-all-fields" style={sectionH2}>
          {t("hub.edtech.allFieldsTitle")}
        </h2>
        <p style={allFieldsLeadStyle}>{t("hub.edtech.allFieldsAp1")} · {t("hub.edtech.allFieldsAp2")}</p>
        <motion.div style={edtechCourseGridStyle}>
          {allLfMeta.map((meta) => {
            const lfKey = meta.lfKey;
            const solved = new Set(learningCorrectByLf[lfKey] ?? []).size;
            const total = meta.totalExercises;
            const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;
            return (
              <motion.button
                key={meta.lf}
                type="button"
                onClick={() => onBeginLearningField(meta.lf)}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                style={{ ...edtechCardPanel, ...edtechCourseCardShell }}
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

      <motion.section variants={EDTECH_CARD} aria-labelledby="nx-edtech-sim">
        <h2 id="nx-edtech-sim" style={sectionH2}>
          {t("hub.edtech.feed.simTitle")}
        </h2>
        <motion.div style={simScrollerStyle}>
          {simulators.map((sim) => (
            <motion.button
              key={sim.label}
              type="button"
              onClick={sim.onClick}
              whileHover={reduceMotion ? undefined : { y: -3 }}
              style={{ ...glassPanel, ...simCardStyle, padding: 0, overflow: "hidden", cursor: "pointer", flex: "0 0 220px" }}
            >
              <EdtechLazyVideo src={sim.video} mode="hover" style={simVideoStyle} />
              <span style={simLabelStyle}>{sim.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </motion.section>

      <motion.aside variants={EDTECH_CARD} style={{ ...glassPanel, padding: "22px 24px" }}>
        <h3 style={{ ...sectionH3, marginBottom: 8 }}>{t("hub.edtech.trustTitle")}</h3>
        <p style={trustBodyStyle}>{t("hub.edtech.trustBody")}</p>
        <p style={trustSubStyle}>{t("hub.edtech.feed.trustPwa")}</p>
      </motion.aside>
    </motion.div>
  );
}

function StatChip({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: "gold" | "cyan" | "violet";
}) {
  const accentColor =
    accent === "gold" ? goldAccent : accent === "cyan" ? cyanAccent : "rgba(139, 92, 246, 0.95)";
  return (
    <div style={statChipStyle}>
      <div style={{ ...statValueStyle, color: accentColor }}>{value}</div>
      <div style={statLabelStyle}>{label}</div>
      {sub ? <div style={statSubStyle}>{sub}</div> : null}
    </div>
  );
}

function PlatformStat({
  value,
  label,
  sub,
  accent,
}: {
  value: string;
  label: string;
  sub: string;
  accent: "gold" | "cyan" | "violet";
}) {
  const color =
    accent === "gold" ? goldAccent : accent === "cyan" ? cyanAccent : "rgba(139, 92, 246, 0.95)";
  return (
    <div style={platformStatCardStyle}>
      <div style={{ ...platformStatValueStyle, color }}>{value}</div>
      <div style={platformStatLabelStyle}>{label}</div>
      <div style={platformStatSubStyle}>{sub}</div>
    </div>
  );
}

const heroBannerOnVideoStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(6, 182, 212, 0.35)",
  background: "rgba(15, 23, 42, 0.45)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  fontWeight: 650,
  color: "rgba(248, 250, 252, 0.92)",
  marginBottom: 16,
  maxWidth: 720,
};

const bannerDot: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: cyanAccent,
  boxShadow: `0 0 12px ${cyanAccent}`,
  flexShrink: 0,
};

const welcomeOnVideoStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(28px, 3.2vw, 40px)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: "#f8fafc",
  textShadow: "0 2px 24px rgba(15, 23, 42, 0.65)",
};

const welcomeSubOnVideoStyle: CSSProperties = {
  margin: "8px 0 20px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 17,
  fontWeight: 550,
  color: "rgba(248, 250, 252, 0.82)",
  lineHeight: 1.45,
  textShadow: "0 1px 16px rgba(15, 23, 42, 0.55)",
};

const heroShellStyle: CSSProperties = {
  position: "relative",
  borderRadius: 20,
  overflow: "hidden",
  minHeight: "clamp(380px, 52vh, 560px)",
  width: "100%",
  border: "1px solid rgba(214, 181, 111, 0.35)",
  boxShadow: "0 28px 64px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
};

const heroVideoStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: "center center",
  minWidth: "100%",
  minHeight: "100%",
  transform: "scale(1.04)",
  filter: "saturate(1.08) contrast(1.1)",
};

const heroOverlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.38) 42%, rgba(15,23,42,0.62) 100%)",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "clamp(24px, 4vw, 44px)",
  maxWidth: 720,
  width: "100%",
};

const heroBadgeStyle: CSSProperties = {
  display: "inline-block",
  fontFamily: "var(--nx-font-mono)",
  fontSize: 12,
  fontWeight: 750,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: goldAccent,
  marginBottom: 12,
};

const heroTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(26px, 3vw, 36px)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: "#f8fafc",
};

const heroLeadStyle: CSSProperties = {
  margin: "0 0 20px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 17,
  fontWeight: 550,
  lineHeight: 1.5,
  color: "rgba(248,250,252,0.88)",
};

const heroBtnRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
};

const heroPrimaryBtnStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(214,181,111,0.55)",
  background: "linear-gradient(125deg, rgba(214,181,111,0.95) 0%, rgba(180,140,70,0.9) 100%)",
  color: "#0f172a",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 16,
  fontWeight: 800,
  padding: "12px 22px",
  cursor: "pointer",
  boxShadow: "0 12px 32px rgba(214,181,111,0.35)",
};

const heroGhostBtnStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(248,250,252,0.35)",
  background: "rgba(15,23,42,0.35)",
  color: "#f8fafc",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 16,
  fontWeight: 700,
  padding: "12px 22px",
  cursor: "pointer",
  backdropFilter: "blur(8px)",
};

const statsStripStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 12,
};

const statChipStyle: CSSProperties = {
  ...glassPanel,
  padding: "14px 16px",
};

const statValueStyle: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 26,
  fontWeight: 800,
  lineHeight: 1.1,
};

const statLabelStyle: CSSProperties = {
  marginTop: 4,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 14,
  fontWeight: 650,
  color: "#64748b",
};

const statSubStyle: CSSProperties = {
  marginTop: 2,
  fontFamily: "var(--nx-font-mono)",
  fontSize: 12,
  color: "#94a3b8",
};

const platformGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
};

const platformStatCardStyle: CSSProperties = {
  ...edtechCardPanel,
  padding: "20px 18px",
  textAlign: "center",
};

const platformStatValueStyle: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: "clamp(32px, 4vw, 42px)",
  fontWeight: 800,
  lineHeight: 1,
};

const platformStatLabelStyle: CSSProperties = {
  marginTop: 8,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 16,
  fontWeight: 800,
  color: "#0f172a",
};

const platformStatSubStyle: CSSProperties = {
  marginTop: 4,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 13,
  fontWeight: 550,
  color: "#64748b",
  lineHeight: 1.35,
};

const continueShellStyle: CSSProperties = {
  position: "relative",
  borderRadius: 20,
  overflow: "hidden",
  padding: "clamp(22px, 4vw, 32px)",
  background: "linear-gradient(125deg, #0f172a 0%, #1e3a5f 55%, rgba(6,182,212,0.35) 100%)",
  border: "1px solid rgba(214,181,111,0.45)",
  boxShadow: "0 24px 56px rgba(15,23,42,0.22)",
};

const continueLfBadgeStyle: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.1em",
  color: goldAccent,
  border: `1px solid rgba(214,181,111,0.5)`,
  borderRadius: 999,
  padding: "6px 12px",
};

const continueTitleStyle: CSSProperties = {
  margin: "12px 0 6px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(20px, 2.5vw, 26px)",
  fontWeight: 800,
  color: "#f8fafc",
  lineHeight: 1.25,
};

const continueMetaStyle: CSSProperties = {
  margin: "0 0 16px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 16,
  fontWeight: 550,
  color: "rgba(248,250,252,0.82)",
  lineHeight: 1.45,
};

const continueCtaStyle: CSSProperties = {
  ...heroPrimaryBtnStyle,
  border: "1px solid rgba(214,181,111,0.65)",
};

const modeGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const modeCardStyle: CSSProperties = {
  padding: "18px 18px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  textAlign: "left",
  cursor: "pointer",
  overflow: "hidden",
};

const modeAccentBarStyle: CSSProperties = {
  width: 48,
  height: 4,
  borderRadius: 999,
  marginBottom: 4,
};

const modeTitleStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
};

const modeBodyStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  fontWeight: 550,
  color: "#64748b",
  lineHeight: 1.45,
};

const tipScoreStyle: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 13,
  fontWeight: 750,
  color: cyanAccent,
  whiteSpace: "nowrap",
};

const tipBodyStyle: CSSProperties = {
  margin: "10px 0 16px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 17,
  fontWeight: 550,
  color: "#334155",
  lineHeight: 1.55,
};

const tipCtaStyle: CSSProperties = {
  borderRadius: 999,
  border: `1px solid rgba(6,182,212,0.45)`,
  background: "linear-gradient(125deg, rgba(6,182,212,0.18) 0%, rgba(15,23,42,0.06) 100%)",
  color: "#0f172a",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  fontWeight: 800,
  padding: "11px 20px",
  cursor: "pointer",
};

const dailyThumbWrapStyle: CSSProperties = {
  width: 120,
  height: 80,
  borderRadius: 14,
  overflow: "hidden",
  flexShrink: 0,
  border: "1px solid rgba(6,182,212,0.35)",
  boxShadow: "0 12px 28px rgba(15,23,42,0.12)",
};

const allFieldsLeadStyle: CSSProperties = {
  margin: "0 0 16px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  fontWeight: 600,
  color: "#64748b",
};

const radarWrapStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "8px 0 4px",
  maxWidth: 440,
  margin: "0 auto",
};

const focusGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 14,
};

const focusCardStyle: CSSProperties = {
  padding: "18px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const focusLabelStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 14,
  fontWeight: 650,
  color: "#64748b",
};

const focusValueStyle: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 28,
  fontWeight: 800,
  color: "#0f172a",
};

const focusSubStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 14,
  fontWeight: 600,
  color: "#334155",
  lineHeight: 1.35,
};

const startGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const startCardStyle: CSSProperties = {
  padding: "18px 18px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const startCardTitleStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
};

const startCardBodyStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  fontWeight: 550,
  color: "#64748b",
  lineHeight: 1.45,
};

const courseGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: 14,
};

const courseCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const courseThumbWrapStyle: CSSProperties = {
  position: "relative",
  height: 120,
  background: "#0f172a",
};

const courseThumbImgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const courseLfBadgeStyle: CSSProperties = {
  position: "absolute",
  top: 10,
  left: 10,
  fontFamily: "var(--nx-font-mono)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "#f8fafc",
  background: "rgba(15,23,42,0.65)",
  padding: "4px 8px",
  borderRadius: 6,
  border: `1px solid ${cyanAccent}`,
};

const courseBodyStyle: CSSProperties = {
  padding: "12px 14px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const courseApStyle: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 11,
  fontWeight: 750,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#94a3b8",
};

const courseTitleStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 17,
  fontWeight: 800,
  color: "#0f172a",
};

const courseProgressStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 14,
  color: "#64748b",
  marginTop: 4,
};

const sectionHeadRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 16,
  flexWrap: "wrap",
};

const sectionLinkBtnStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: cyanAccent,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  fontWeight: 750,
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: 4,
};

const leaderRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap",
};

const leaderRankStyle: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 22,
  fontWeight: 800,
  color: goldAccent,
};

const leaderNameStyle: CSSProperties = {
  flex: 1,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 20,
  fontWeight: 800,
  color: "#0f172a",
};

const leaderScoreStyle: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 14,
  fontWeight: 700,
  color: "#64748b",
};

const leaderHintStyle: CSSProperties = {
  margin: "12px 0 0",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  color: "#64748b",
  lineHeight: 1.45,
};

const simScrollerStyle: CSSProperties = {
  display: "flex",
  gap: 14,
  overflowX: "auto",
  paddingBottom: 8,
  scrollSnapType: "x mandatory",
};

const simCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  scrollSnapAlign: "start",
};

const simVideoStyle: CSSProperties = {
  width: "100%",
  height: 124,
  objectFit: "cover",
  background: "#0f172a",
};

const simLabelStyle: CSSProperties = {
  padding: "12px 14px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  fontWeight: 750,
  color: "#0f172a",
  textAlign: "left",
};

const dailyLeadStyle: CSSProperties = {
  margin: "0 0 16px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 16,
  color: "#475569",
  lineHeight: 1.5,
};

const dailyCtaStyle: CSSProperties = {
  borderRadius: 12,
  border: `1px solid ${cyanAccent}`,
  background: "linear-gradient(90deg, rgba(6,182,212,0.15) 0%, rgba(214,181,111,0.1) 100%)",
  color: "#0f172a",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 16,
  fontWeight: 800,
  padding: "12px 20px",
  cursor: "pointer",
};

const examGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 14,
};

const examCardStyle: CSSProperties = {
  padding: "20px 22px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const examTitleStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 20,
  fontWeight: 800,
  color: "#0f172a",
};

const examBodyStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  color: "#64748b",
  lineHeight: 1.45,
};

const changelogRowStyle: CSSProperties = {
  display: "flex",
  gap: 14,
  alignItems: "flex-start",
};

const changelogVerStyle: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 13,
  fontWeight: 800,
  color: goldAccent,
  flexShrink: 0,
  minWidth: 44,
};

const changelogTextStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  color: "#334155",
  lineHeight: 1.45,
};

const communityGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const communityTileStyle: CSSProperties = {
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 16,
  fontWeight: 700,
  color: "#334155",
};

const communitySoonStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#94a3b8",
};

const trustBodyStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 16,
  color: "#475569",
  lineHeight: 1.55,
};

const trustSubStyle: CSSProperties = {
  margin: "12px 0 0",
  fontFamily: "var(--nx-font-mono)",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: cyanAccent,
};
