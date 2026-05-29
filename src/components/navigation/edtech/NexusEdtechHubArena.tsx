import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { publicAssetUrl, type LearningField } from "../../../data/nexusRegistry";
import { FRACTAL_COMMAND_BG_MP4 } from "../../../lib/ui/fractalConstants";
import type { NexusHubMapExtras } from "../../../lib/ui/hubMapNavigation";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { CURRICULUM_BY_LF } from "../../../lib/learning/learningRegistry";
import { useGameStore } from "../../../store/useGameStore";
import { EdtechLazyVideo } from "./EdtechLazyVideo";
import { EdtechLfThumb } from "./EdtechLfThumb";
import {
  cyanAccent,
  EDTECH_CARD,
  EDTECH_STAGGER,
  glassPanel,
  goldAccent,
  sectionH2,
  sectionH3,
} from "./edtechHubTokens";

const FEATURED_LFS = [1, 3, 5, 10, 11, 12] as const;

const FIELD_META: Record<number, { ap: string; titleKey: string }> = {
  1: { ap: "AP1", titleKey: "LF1" },
  3: { ap: "AP1", titleKey: "LF3" },
  5: { ap: "AP1", titleKey: "LF5" },
  10: { ap: "AP2", titleKey: "LF10" },
  11: { ap: "AP2", titleKey: "LF11" },
  12: { ap: "AP2", titleKey: "LF12" },
};

const FIELD_TITLES_DE: Record<string, string> = {
  LF1: "Wirtschaft & Recht",
  LF3: "Netzwerke",
  LF5: "Datenbanken",
  LF10: "Projektmanagement",
  LF11: "Security",
  LF12: "Projekt",
};

const CHANGELOG = [
  { version: "2.4", tag: "hub.edtech.feed.changelog.c1" },
  { version: "2.3", tag: "hub.edtech.feed.changelog.c2" },
  { version: "2.2", tag: "hub.edtech.feed.changelog.c3" },
] as const;

export type NexusEdtechHubArenaProps = {
  onOpenMap: () => void;
  onOpenFieldList: () => void;
  onBeginLearningField: (lf: number) => void;
  mapWithExtras: (extras: NexusHubMapExtras) => void;
};

export function NexusEdtechHubArena({
  onOpenMap,
  onOpenFieldList,
  onBeginLearningField,
  mapWithExtras,
}: NexusEdtechHubArenaProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const heroVideoPrimary = FRACTAL_COMMAND_BG_MP4;
  const heroVideoFallback = publicAssetUrl("/assets/LF1GIF.mp4");
  const [heroVideoSrc, setHeroVideoSrc] = useState(heroVideoPrimary);
  const [heroVideoOk, setHeroVideoOk] = useState(true);

  const playerName = useGameStore((s) => s.playerName);
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const nexusFragments = useGameStore((s) => s.nexusFragments);
  const dailyParticipationStreak = useGameStore((s) => s.dailyParticipationStreak);
  const unlockedSectors = useGameStore((s) => s.campaign.unlockedSectors);
  const lastEvents = useGameStore((s) => s.lastCombatLearningEvents);

  const { totalCorrect, totalCurriculum } = useMemo(() => {
    let correct = 0;
    let curriculum = 0;
    for (let lf = 1; lf <= 12; lf += 1) {
      const key = `LF${lf}` as LearningField;
      const ids = learningCorrectByLf[key] ?? [];
      correct += new Set(ids).size;
      curriculum += CURRICULUM_BY_LF[key]?.length ?? 0;
    }
    return { totalCorrect: correct, totalCurriculum: curriculum };
  }, [learningCorrectByLf]);

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
      <motion.div variants={EDTECH_CARD} style={bannerStyle}>
        <span style={bannerDot} aria-hidden />
        <span style={{ flex: "1 1 auto", minWidth: 0 }}>{t("hub.edtech.localBanner")}</span>
      </motion.div>

      <motion.header variants={EDTECH_CARD}>
        <h1 style={welcomeH1Style}>
          {t("hub.edtech.welcomeBefore")} {playerName}
          {t("hub.edtech.welcomeAfter")}
        </h1>
        <p style={welcomeSubStyle}>{lastLine}</p>
      </motion.header>

      <motion.section
        variants={EDTECH_CARD}
        style={heroShellStyle}
        aria-labelledby="nx-edtech-hero-title"
      >
        {!reduceMotion && heroVideoOk ? (
          <video
            key={heroVideoSrc}
            src={heroVideoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
            style={heroVideoStyle}
            onError={() => {
              if (heroVideoSrc === heroVideoPrimary) {
                setHeroVideoSrc(heroVideoFallback);
                return;
              }
              setHeroVideoOk(false);
            }}
          />
        ) : (
          <span
            aria-hidden
            style={{
              ...heroVideoStyle,
              background:
                "linear-gradient(145deg, #0f172a 0%, #1e3a5f 42%, rgba(6, 182, 212, 0.18) 100%)",
            }}
          />
        )}
        <motion.div style={heroOverlayStyle} aria-hidden />
        <div style={heroContentStyle}>
          <span style={heroBadgeStyle}>{t("hub.edtech.heroBadge")}</span>
          <h2 id="nx-edtech-hero-title" style={heroTitleStyle}>
            {t("hub.edtech.heroTitle")}
          </h2>
          <p style={heroLeadStyle}>{t("hub.edtech.heroLead")}</p>
          <motion.div style={heroBtnRowStyle}>
            <motion.button
              type="button"
              onClick={onOpenMap}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              style={heroPrimaryBtnStyle}
            >
              {t("hub.edtech.heroPrimary")}
            </motion.button>
            <motion.button
              type="button"
              onClick={onOpenFieldList}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              style={heroGhostBtnStyle}
            >
              {t("hub.edtech.heroSecondary")}
            </motion.button>
          </motion.div>
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

      <motion.section variants={EDTECH_CARD} aria-labelledby="nx-edtech-start">
        <h3 id="nx-edtech-start" style={sectionH3}>
          {t("hub.edtech.startTitle")}
        </h3>
        <motion.div style={startGridStyle}>
          <StartCard title={t("hub.edtech.tileTerminalTitle")} body={t("hub.edtech.tileTerminalBody")} onClick={onOpenMap} reduceMotion={!!reduceMotion} />
          <StartCard title={t("hub.edtech.tileFieldsTitle")} body={t("hub.edtech.tileFieldsBody")} onClick={onOpenFieldList} reduceMotion={!!reduceMotion} />
          <StartCard title={t("hub.edtech.tileBossTitle")} body={t("hub.edtech.tileBossBody")} onClick={onOpenMap} reduceMotion={!!reduceMotion} />
          <StartCard title={t("hub.edtech.tileLeitnerTitle")} body={t("hub.edtech.tileLeitnerBody")} onClick={() => onBeginLearningField(5)} reduceMotion={!!reduceMotion} />
        </motion.div>
      </motion.section>

      <motion.section variants={EDTECH_CARD} aria-labelledby="nx-edtech-courses">
        <h2 id="nx-edtech-courses" style={sectionH2}>
          {t("hub.edtech.feed.popularTitle")}
        </h2>
        <motion.div style={courseGridStyle}>
          {FEATURED_LFS.map((lf) => {
            const lfKey = `LF${lf}` as LearningField;
            const meta = FIELD_META[lf];
            const solved = new Set(learningCorrectByLf[lfKey] ?? []).size;
            const total = CURRICULUM_BY_LF[lfKey]?.length ?? 0;
            const title = FIELD_TITLES_DE[meta.titleKey] ?? meta.titleKey;
            return (
              <motion.button
                key={lf}
                type="button"
                onClick={() => onBeginLearningField(lf)}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                style={{ ...glassPanel, ...courseCardStyle, padding: 0, overflow: "hidden", textAlign: "left", cursor: "pointer" }}
              >
                <span style={courseThumbWrapStyle}>
                  <EdtechLfThumb lf={lf} />
                  <span style={courseLfBadgeStyle}>LF{lf}</span>
                </span>
                <span style={courseBodyStyle}>
                  <span style={courseApStyle}>{meta.ap}</span>
                  <strong style={courseTitleStyle}>{title}</strong>
                  <span style={courseProgressStyle}>
                    {solved}/{total} {t("hub.edtech.feed.exercises")}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.section>

      <motion.section variants={EDTECH_CARD} aria-labelledby="nx-edtech-leaderboard">
        <div style={sectionHeadRowStyle}>
          <h2 id="nx-edtech-leaderboard" style={{ ...sectionH2, margin: 0 }}>
            {t("hub.edtech.feed.leaderTitle")}
          </h2>
          <motion.button type="button" onClick={() => mapWithExtras({ overlay: "LEADERBOARD" })} style={sectionLinkBtnStyle}>
            {t("hub.edtech.feed.leaderOpen")}
          </motion.button>
        </div>
        <motion.div style={{ ...glassPanel, padding: "18px 20px" }}>
          <motion.div style={leaderRowStyle}>
            <span style={leaderRankStyle}>#1</span>
            <span style={leaderNameStyle}>{playerName}</span>
            <span style={leaderScoreStyle}>
              {nexusFragments} {t("hub.edtech.statFragments")}
            </span>
          </motion.div>
          <p style={leaderHintStyle}>{t("hub.edtech.feed.leaderHint")}</p>
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

      <motion.section variants={EDTECH_CARD} style={{ ...glassPanel, padding: "22px 24px" }} aria-labelledby="nx-edtech-daily">
        <h2 id="nx-edtech-daily" style={{ ...sectionH2, marginBottom: 8 }}>
          {t("hub.edtech.feed.dailyTitle")}
        </h2>
        <p style={dailyLeadStyle}>
          {t("hub.edtech.feed.dailyLead").replace("{streak}", String(dailyParticipationStreak))}
        </p>
        <motion.button
          type="button"
          onClick={() => mapWithExtras({ openDailyPanel: true })}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          style={dailyCtaStyle}
        >
          {t("hub.edtech.feed.dailyCta")}
        </motion.button>
      </motion.section>

      <motion.section variants={EDTECH_CARD} aria-labelledby="nx-edtech-exams">
        <h2 id="nx-edtech-exams" style={sectionH2}>
          {t("hub.edtech.feed.examTitle")}
        </h2>
        <motion.div style={examGridStyle}>
          <ExamCard
            title={t("hub.edtech.feed.examAp1")}
            body={t("hub.edtech.feed.examAp1Body")}
            onClick={() => onBeginLearningField(1)}
            reduceMotion={!!reduceMotion}
          />
          <ExamCard
            title={t("hub.edtech.feed.examAp2")}
            body={t("hub.edtech.feed.examAp2Body")}
            onClick={() => onBeginLearningField(7)}
            reduceMotion={!!reduceMotion}
          />
        </motion.div>
      </motion.section>

      <motion.section variants={EDTECH_CARD} aria-labelledby="nx-edtech-changelog">
        <h2 id="nx-edtech-changelog" style={sectionH2}>
          {t("hub.edtech.feed.changelogTitle")}
        </h2>
        <motion.div style={{ ...glassPanel, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {CHANGELOG.map((entry) => (
            <motion.div key={entry.version} style={changelogRowStyle}>
              <span style={changelogVerStyle}>v{entry.version}</span>
              <span style={changelogTextStyle}>{t(entry.tag)}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section variants={EDTECH_CARD} aria-labelledby="nx-edtech-community">
        <h2 id="nx-edtech-community" style={sectionH2}>
          {t("hub.edtech.mega.secCommunity")}
        </h2>
        <motion.div style={communityGridStyle}>
          {[t("hub.edtech.mega.chat"), t("hub.edtech.mega.forum"), t("hub.edtech.mega.questions")].map((label) => (
            <motion.div key={label} style={{ ...glassPanel, ...communityTileStyle, opacity: 0.55 }}>
              <span>{label}</span>
              <span style={communitySoonStyle}>{t("hub.edtech.mega.unavailable")}</span>
            </motion.div>
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

function StartCard({
  title,
  body,
  onClick,
  reduceMotion,
}: {
  title: string;
  body: string;
  onClick: () => void;
  reduceMotion: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      style={{ ...glassPanel, ...startCardStyle, cursor: "pointer", textAlign: "left" }}
    >
      <strong style={startCardTitleStyle}>{title}</strong>
      <span style={startCardBodyStyle}>{body}</span>
    </motion.button>
  );
}

function ExamCard({
  title,
  body,
  onClick,
  reduceMotion,
}: {
  title: string;
  body: string;
  onClick: () => void;
  reduceMotion: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      style={{ ...glassPanel, ...examCardStyle, cursor: "pointer", textAlign: "left" }}
    >
      <strong style={examTitleStyle}>{title}</strong>
      <span style={examBodyStyle}>{body}</span>
    </motion.button>
  );
}

const bannerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(6, 182, 212, 0.25)",
  background: "linear-gradient(90deg, rgba(6,182,212,0.08) 0%, rgba(214,181,111,0.06) 100%)",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  fontWeight: 650,
  color: "#334155",
};

const bannerDot: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: cyanAccent,
  boxShadow: `0 0 12px ${cyanAccent}`,
  flexShrink: 0,
};

const welcomeH1Style: CSSProperties = {
  margin: 0,
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(28px, 3.2vw, 40px)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: "#0f172a",
};

const welcomeSubStyle: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 17,
  fontWeight: 550,
  color: "#64748b",
  lineHeight: 1.45,
};

const heroShellStyle: CSSProperties = {
  position: "relative",
  borderRadius: 20,
  overflow: "hidden",
  minHeight: 280,
  border: "1px solid rgba(214, 181, 111, 0.35)",
  boxShadow: "0 28px 64px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
};

const heroVideoStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  filter: "saturate(1.05) contrast(1.08)",
};

const heroOverlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(125deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.45) 45%, rgba(6,182,212,0.22) 100%)",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "clamp(24px, 4vw, 40px)",
  maxWidth: 640,
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
