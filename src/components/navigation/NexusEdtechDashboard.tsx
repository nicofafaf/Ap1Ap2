import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { useCallback, useMemo } from "react";
import type { LearningField } from "../../data/nexusRegistry";
import type { NexusHubMapExtras } from "../../lib/ui/hubMapNavigation";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { CURRICULUM_BY_LF } from "../../lib/learning/learningRegistry";
import { useGameStore } from "../../store/useGameStore";

const CARD = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 280, damping: 28 },
  },
};

export type NexusEdtechDashboardProps = {
  scrollParentRef: RefObject<HTMLDivElement | null>;
  railCompact: boolean;
  onOpenMap: () => void;
  onOpenFieldList: () => void;
  onBeginLearningField: (lf: number) => void;
  onSwapCompanion: () => void;
  onNavigateFromHubToMap?: (extras: NexusHubMapExtras) => void;
  onBlitzTraining?: () => void;
};

export function NexusEdtechDashboard({
  scrollParentRef,
  railCompact,
  onOpenMap,
  onOpenFieldList,
  onBeginLearningField,
  onSwapCompanion,
  onNavigateFromHubToMap,
  onBlitzTraining,
}: NexusEdtechDashboardProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
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

  const scrollHubTop = useCallback(() => {
    const el = scrollParentRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [reduceMotion, scrollParentRef]);

  const mapWithExtras = useCallback(
    (extras: NexusHubMapExtras) => {
      if (onNavigateFromHubToMap) onNavigateFromHubToMap(extras);
      else onOpenMap();
    },
    [onNavigateFromHubToMap, onOpenMap]
  );

  const megaNav = (
    <EdtechMegaAreaNav
      t={t}
      railCompact={railCompact}
      scrollHubTop={scrollHubTop}
      onOpenMap={onOpenMap}
      mapWithExtras={mapWithExtras}
      onOpenFieldList={onOpenFieldList}
      onBeginLearningField={onBeginLearningField}
      onSwapCompanion={onSwapCompanion}
      onBlitzTraining={onBlitzTraining}
    />
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: railCompact ? "column" : "row",
        gap: railCompact ? 16 : 28,
        width: "100%",
        alignItems: "stretch",
      }}
    >
      {!railCompact ? <div style={{ flexShrink: 0, width: 276, maxHeight: "min(78dvh, 900px)" }}>{megaNav}</div> : megaNav}

      <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 28 }}>
        <motion.div variants={CARD} initial="hidden" animate="show" style={bannerStyle}>
          <span style={bannerDot} aria-hidden />
          <span style={{ flex: "1 1 auto", minWidth: 0 }}>{t("hub.edtech.localBanner")}</span>
        </motion.div>

        <motion.header variants={CARD} initial="hidden" animate="show" style={{ margin: 0 }}>
          <h1 style={welcomeH1Style}>
            {t("hub.edtech.welcomeBefore")} {playerName}
            {t("hub.edtech.welcomeAfter")}
          </h1>
          <p style={welcomeSubStyle}>{lastLine}</p>
        </motion.header>

        <motion.section
          variants={CARD}
          initial="hidden"
          animate="show"
          style={heroCardStyle}
          aria-labelledby="nx-edtech-hero-title"
        >
          <span style={heroBadgeStyle}>{t("hub.edtech.heroBadge")}</span>
          <h2 id="nx-edtech-hero-title" style={heroTitleStyle}>
            {t("hub.edtech.heroTitle")}
          </h2>
          <p style={heroLeadStyle}>{t("hub.edtech.heroLead")}</p>
          <div style={heroBtnRowStyle}>
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
          </div>
        </motion.section>

        <motion.div
          variants={CARD}
          initial="hidden"
          animate="show"
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
          <StatChip
            label={t("hub.edtech.statStreak")}
            value={String(dailyParticipationStreak)}
            accent="violet"
          />
          <StatChip
            label={t("hub.edtech.statSectors")}
            value={String(unlockedSectors.length)}
            accent="cyan"
          />
        </motion.div>

        <motion.section variants={CARD} initial="hidden" animate="show" aria-labelledby="nx-edtech-start">
          <h3 id="nx-edtech-start" style={sectionTitleStyle}>
            {t("hub.edtech.startTitle")}
          </h3>
          <div style={startGridStyle}>
            <StartCard
              title={t("hub.edtech.tileTerminalTitle")}
              body={t("hub.edtech.tileTerminalBody")}
              onClick={onOpenMap}
              reduceMotion={!!reduceMotion}
            />
            <StartCard
              title={t("hub.edtech.tileFieldsTitle")}
              body={t("hub.edtech.tileFieldsBody")}
              onClick={onOpenFieldList}
              reduceMotion={!!reduceMotion}
            />
            <StartCard
              title={t("hub.edtech.tileBossTitle")}
              body={t("hub.edtech.tileBossBody")}
              onClick={onOpenMap}
              reduceMotion={!!reduceMotion}
            />
            <StartCard
              title={t("hub.edtech.tileLeitnerTitle")}
              body={t("hub.edtech.tileLeitnerBody")}
              onClick={() => onBeginLearningField(5)}
              reduceMotion={!!reduceMotion}
            />
          </div>
        </motion.section>

        <motion.aside variants={CARD} initial="hidden" animate="show" style={trustCardStyle}>
          <h3 style={trustTitleStyle}>{t("hub.edtech.trustTitle")}</h3>
          <p style={trustBodyStyle}>{t("hub.edtech.trustBody")}</p>
        </motion.aside>
      </div>
    </div>
  );
}

type Translate = (key: string, fallback?: string) => string;

function EdtechMegaAreaNav({
  t,
  railCompact,
  scrollHubTop,
  onOpenMap,
  mapWithExtras,
  onOpenFieldList,
  onBeginLearningField,
  onSwapCompanion,
  onBlitzTraining,
}: {
  t: Translate;
  railCompact: boolean;
  scrollHubTop: () => void;
  onOpenMap: () => void;
  mapWithExtras: (extras: NexusHubMapExtras) => void;
  onOpenFieldList: () => void;
  onBeginLearningField: (lf: number) => void;
  onSwapCompanion: () => void;
  onBlitzTraining?: () => void;
}) {
  const shellStyle: CSSProperties = {
    ...megaShellStyle,
    ...(railCompact ? megaShellCompactStyle : {}),
    ...(railCompact ? {} : { overflowY: "auto", overflowX: "hidden" as const }),
  };

  return (
    <nav aria-label={t("hub.edtech.navAria")} style={shellStyle}>
      <div style={megaTitleBarStyle}>{t("hub.edtech.mega.allAreas")}</div>

      <MegaSection title={t("hub.edtech.mega.secStart")} kicker="🏠">
        <MegaLink label={t("hub.edtech.mega.dashboard")} onClick={scrollHubTop} />
        <MegaLink label={t("hub.edtech.mega.lernStart")} onClick={onOpenMap} />
      </MegaSection>

      <MegaSection title={t("hub.edtech.mega.secLearn")} kicker="📖">
        <MegaLink
          label={t("hub.edtech.mega.blitz")}
          onClick={() => onBlitzTraining?.()}
          disabled={!onBlitzTraining}
          disabledHint={t("hub.edtech.mega.unavailable")}
        />
        <MegaLink label={t("hub.edtech.mega.exams")} onClick={onOpenMap} />
        <MegaLink label={t("hub.edtech.mega.courses")} onClick={onOpenFieldList} />
        <MegaLink label={t("hub.edtech.mega.roles")} onClick={() => mapWithExtras({ overlay: "GALLERY" })} />
        <MegaLink
          label={t("hub.edtech.mega.certs")}
          onClick={() => mapWithExtras({ openDossier: true })}
        />
        <MegaLink label={t("hub.edtech.mega.cards")} onClick={() => onBeginLearningField(5)} />
        <MegaLink label={t("hub.edtech.mega.progress")} onClick={() => mapWithExtras({ overlay: "LEADERBOARD" })} />
        <MegaLink label={t("hub.edtech.mega.daily")} onClick={() => mapWithExtras({ openDailyPanel: true })} />
        <MegaLink label={t("hub.edtech.mega.codex")} onClick={() => mapWithExtras({ openCodex: true })} />
      </MegaSection>

      <MegaSection title={t("hub.edtech.mega.secCommunity")} kicker="💬">
        <MegaDead label={t("hub.edtech.mega.chat")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.forum")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.questions")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.improve")} hint={t("hub.edtech.mega.unavailable")} />
      </MegaSection>

      <MegaSection title={t("hub.edtech.mega.secSim")} kicker="🧪">
        <MegaDead label={t("hub.edtech.mega.simItSupport")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.simSql")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.simLinux")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.simAzure")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.simDojo")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.simPseudo")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.simNorm")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.simNetplan")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.simCircuit")} hint={t("hub.edtech.mega.unavailable")} />
      </MegaSection>

      <MegaSection title={t("hub.edtech.mega.secGames")} kicker="🕹️">
        <MegaDead label={t("hub.edtech.mega.games")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.spaceGame")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.companyGame")} hint={t("hub.edtech.mega.unavailable")} />
      </MegaSection>

      <MegaSection title={t("hub.edtech.mega.secTools")} kicker="🛠️">
        <MegaLink label={t("hub.edtech.mega.toolDiagrams")} onClick={() => mapWithExtras({ overlay: "ARCHITECT_DATA" })} />
        <MegaLink label={t("hub.edtech.mega.toolDb")} onClick={() => onBeginLearningField(8)} />
        <MegaLink label={t("hub.edtech.mega.toolNetwork")} onClick={() => onBeginLearningField(3)} />
        <MegaLink label={t("hub.edtech.mega.toolNetplan")} onClick={() => onBeginLearningField(10)} />
        <MegaLink label={t("hub.edtech.mega.toolPlanner")} onClick={() => onBeginLearningField(10)} />
      </MegaSection>

      <MegaSection title={t("hub.edtech.mega.secCorrection")} kicker="✏️">
        <MegaDead label={t("hub.edtech.mega.examEditor")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaDead label={t("hub.edtech.mega.selfGrade")} hint={t("hub.edtech.mega.unavailable")} />
      </MegaSection>

      <MegaSection title={t("hub.edtech.mega.secAccount")} kicker="⚙️">
        <MegaDead label={t("hub.edtech.mega.requests")} hint={t("hub.edtech.mega.unavailable")} />
        <MegaLink label={t("hub.edtech.mega.profileMentor")} onClick={onSwapCompanion} />
        <MegaLink label={t("hub.edtech.mega.mapContext")} onClick={onOpenMap} />
      </MegaSection>
    </nav>
  );
}

function MegaSection({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <div style={megaDetailsStyle}>
      <div style={megaSummaryStyle}>
        {kicker ? <span style={{ marginRight: 6 }}>{kicker}</span> : null}
        {title}
      </div>
      <div style={megaSectionBodyStyle}>{children}</div>
    </div>
  );
}

function MegaLink({
  label,
  onClick,
  disabled,
  disabledHint,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  if (disabled) {
    return <MegaDead label={label} hint={disabledHint ?? ""} />;
  }
  return (
    <button type="button" onClick={onClick} style={megaLinkBtnStyle}>
      {label}
    </button>
  );
}

function MegaDead({ label, hint }: { label: string; hint: string }) {
  return (
    <button type="button" disabled style={megaDeadBtnStyle} title={hint}>
      {label}
    </button>
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
  const dot =
    accent === "gold"
      ? "rgba(214, 181, 111, 0.95)"
      : accent === "cyan"
        ? "rgba(6, 182, 212, 0.95)"
        : "rgba(139, 92, 246, 0.95)";
  return (
    <div style={statChipStyle}>
      <span style={{ ...statDotStyle, background: dot }} aria-hidden />
      <div style={{ minWidth: 0 }}>
        <div style={statLabelStyle}>{label}</div>
        <div style={statValueStyle}>{value}</div>
        {sub ? <div style={statSubStyle}>{sub}</div> : null}
      </div>
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
      whileHover={reduceMotion ? undefined : { y: -3, boxShadow: "0 20px 48px rgba(15,23,42,0.12)" }}
      whileTap={reduceMotion ? undefined : { scale: 0.995 }}
      style={startCardStyle}
    >
      <span style={startChevron} aria-hidden>
        ›
      </span>
      <strong style={startTitle}>{title}</strong>
      <span style={startBody}>{body}</span>
    </motion.button>
  );
}

const megaShellStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: 10,
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
};

const megaShellCompactStyle: CSSProperties = {
  maxHeight: 420,
};

const megaTitleBarStyle: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 13,
  fontWeight: 750,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#94a3b8",
  padding: "6px 8px 10px",
};

const megaDetailsStyle: CSSProperties = {
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  padding: "4px 6px 8px",
};

const megaSummaryStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 16,
  fontWeight: 800,
  color: "#0f172a",
  padding: "8px 8px 4px",
};

const megaSectionBodyStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "2px 4px 6px",
};

const megaLinkBtnStyle: CSSProperties = {
  width: "100%",
  textAlign: "left",
  borderRadius: 8,
  border: "1px solid transparent",
  background: "rgba(241, 245, 249, 0.85)",
  color: "#334155",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  fontWeight: 650,
  padding: "9px 10px",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
};

const megaDeadBtnStyle: CSSProperties = {
  ...megaLinkBtnStyle,
  opacity: 0.45,
  cursor: "not-allowed",
  background: "rgba(248, 250, 252, 0.6)",
};

const bannerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(251, 191, 36, 0.45)",
  background: "linear-gradient(90deg, rgba(254, 243, 199, 0.95) 0%, rgba(255, 251, 235, 0.98) 100%)",
  color: "#78350f",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 18,
  fontWeight: 650,
  lineHeight: 1.35,
};

const bannerDot: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "rgba(245, 158, 11, 0.95)",
  flexShrink: 0,
  boxShadow: "0 0 0 6px rgba(251, 191, 36, 0.25)",
};

const welcomeH1Style: CSSProperties = {
  margin: 0,
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(32px, 4vw, 44px)",
  fontWeight: 800,
  letterSpacing: "-0.04em",
  lineHeight: 1.1,
  color: "#0f172a",
};

const welcomeSubStyle: CSSProperties = {
  margin: "10px 0 0",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 19,
  fontWeight: 500,
  color: "#64748b",
  lineHeight: 1.45,
};

const heroCardStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 18,
  padding: "clamp(22px, 3vw, 32px)",
  border: "1px solid rgba(255,255,255,0.22)",
  background:
    "linear-gradient(125deg, #5b21b6 0%, #7c3aed 38%, #c026d3 72%, #22d3ee 120%)",
  color: "#fafafa",
  boxShadow: "0 28px 64px rgba(76, 29, 149, 0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
};

const heroBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.28)",
  marginBottom: 14,
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(26px, 3.2vw, 34px)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  lineHeight: 1.15,
};

const heroLeadStyle: CSSProperties = {
  margin: "12px 0 0",
  maxWidth: 560,
  fontSize: 19,
  lineHeight: 1.5,
  fontWeight: 500,
  color: "rgba(248, 250, 252, 0.92)",
};

const heroBtnRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  marginTop: 22,
};

const heroPrimaryBtnStyle: CSSProperties = {
  borderRadius: 999,
  border: "none",
  background: "#fafafa",
  color: "#5b21b6",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 19,
  fontWeight: 800,
  padding: "14px 22px",
  cursor: "pointer",
  boxShadow: "0 14px 36px rgba(15,23,42,0.18)",
};

const heroGhostBtnStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.55)",
  background: "rgba(255,255,255,0.12)",
  color: "#fafafa",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 19,
  fontWeight: 750,
  padding: "14px 22px",
  cursor: "pointer",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

const statsStripStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
  gap: 12,
  padding: 16,
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
};

const statChipStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  minWidth: 0,
};

const statDotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  marginTop: 7,
  flexShrink: 0,
};

const statLabelStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 650,
  color: "#64748b",
  letterSpacing: "0.02em",
};

const statValueStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "#0f172a",
  lineHeight: 1.2,
  marginTop: 2,
  fontFamily: "var(--nx-font-mono)",
};

const statSubStyle: CSSProperties = {
  fontSize: 15,
  color: "#94a3b8",
  marginTop: 2,
  fontFamily: "var(--nx-font-mono)",
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 14px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 22,
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const startGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
  gap: 14,
};

const startCardStyle: CSSProperties = {
  position: "relative",
  textAlign: "left",
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  padding: "20px 44px 20px 20px",
  cursor: "pointer",
  boxShadow: "0 8px 22px rgba(15,23,42,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  color: "#0f172a",
  WebkitTapHighlightColor: "transparent",
};

const startChevron: CSSProperties = {
  position: "absolute",
  right: 16,
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: 28,
  fontWeight: 300,
  color: "#94a3b8",
};

const startTitle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 20,
  fontWeight: 800,
};

const startBody: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 17,
  fontWeight: 500,
  color: "#64748b",
  lineHeight: 1.4,
};

const trustCardStyle: CSSProperties = {
  borderRadius: 16,
  padding: "20px 22px",
  border: "1px solid rgba(6, 182, 212, 0.35)",
  background: "linear-gradient(135deg, rgba(240, 253, 250, 0.95) 0%, rgba(224, 242, 254, 0.9) 100%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
};

const trustTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 20,
  fontWeight: 800,
  color: "#0f172a",
};

const trustBodyStyle: CSSProperties = {
  margin: "10px 0 0",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 17,
  fontWeight: 500,
  color: "#334155",
  lineHeight: 1.5,
};
