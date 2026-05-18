import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { CodexIridium } from "../../archive/CodexIridium";
import ArtifactGallery from "../../gallery/ArtifactGallery";
import {
  getBossThumbnailCandidates,
  getNexusEntryForLF,
  type LearningField,
} from "../../../data/nexusRegistry";
import { FRACTAL_COMMAND_BG_MP4 } from "../../../lib/ui/fractalConstants";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { CURRICULUM_BY_LF } from "../../../lib/learning/learningRegistry";
import { computeAllSectorStabilities, stabilityTier } from "../../../lib/math/mapLogic";
import {
  formatCountdownHMS,
  getDailyIncursionDefinition,
  getUtcDateKey,
  secondsUntilNextUtcMidnight,
  type InitiateCombatOptions,
} from "../../../lib/dailyIncursion";
import { useGameStore } from "../../../store/useGameStore";
import { HallOfRecords } from "../../menu/HallOfRecords";
import { LegacyCredits } from "../../menu/LegacyCredits";
import { NexusSyncStatus } from "../../menu/NexusSyncStatus";
import { TechnicalDossier } from "../../menu/TechnicalDossier";
import { CoreAugmentations } from "../CoreAugmentations";
import {
  cyanAccent,
  EDTECH_CARD,
  EDTECH_STAGGER,
  edtechHeaderBar,
  edtechPageBackground,
  glassPanel,
  goldAccent,
  sectionH2,
} from "./edtechHubTokens";
import {
  edtechCourseAp,
  edtechCourseBody,
  edtechCourseCardShell,
  edtechCourseGridStyle,
  edtechCourseLfBadge,
  edtechCourseMeta,
  edtechCourseThumbImg,
  edtechCourseThumbWrap,
  edtechCourseTitle,
  edtechGhostBtn,
  edtechMenuBtn,
  edtechPrimaryBtn,
} from "./edtechCourseCardStyles";

export type EdtechSectorMapProps = {
  onEngage: (lf: number, opts?: InitiateCombatOptions) => void;
  onOpenLearningHub?: () => void;
};

function apLabel(lf: number): string {
  return lf <= 6 ? "AP1" : "AP2";
}

function EdtechScanStrip({ t }: { t: (key: string, fallback?: string) => string }) {
  const scan = useGameStore((s) => s.initialSkillScanByLf);
  const done = useGameStore((s) => s.initialSkillScanComplete);
  if (!done) return null;

  const dot = (lf: number) => {
    const k = `LF${lf}` as LearningField;
    const v = scan[k];
    const stable = v === true;
    const gap = v === false;
    return (
      <span
        key={lf}
        title={`LF${lf}`}
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          flexShrink: 0,
          background: stable
            ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            : gap
              ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
              : "rgba(148, 163, 184, 0.35)",
          boxShadow: stable
            ? "0 0 10px rgba(34, 197, 94, 0.35)"
            : gap
              ? "0 0 10px rgba(245, 158, 11, 0.3)"
              : "none",
        }}
      />
    );
  };

  return (
    <motion.div
      variants={EDTECH_CARD}
      style={{
        ...glassPanel,
        padding: "14px 18px",
        marginBottom: 18,
      }}
    >
      <motion.div
        style={{
          fontFamily: "var(--nx-font-sans)",
          fontSize: 13,
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: 10,
        }}
      >
        {t("map.edtechScanTitle")}
      </motion.div>
      <motion.div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <motion.div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", minWidth: 88 }}>
            {t("map.skillGapAp1")}
          </span>
          {[1, 2, 3, 4, 5, 6].map(dot)}
        </motion.div>
        <motion.div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", minWidth: 88 }}>
            {t("map.skillGapAp2")}
          </span>
          {[7, 8, 9, 10, 11, 12].map(dot)}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function EdtechSectorMap({ onEngage, onOpenLearningHub }: EdtechSectorMapProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  const campaign = useGameStore((s) => s.campaign);
  const history = useGameStore((s) => s.combatArchitectHistory);
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const initialSkillScanByLf = useGameStore((s) => s.initialSkillScanByLf);
  const initialSkillScanComplete = useGameStore((s) => s.initialSkillScanComplete);
  const dailyRankedClearDateUtc = useGameStore((s) => s.dailyRankedClearDateUtc);
  const overlayOpenState = useGameStore((s) => s.overlayOpenState);
  const setOverlayOpenState = useGameStore((s) => s.setOverlayOpenState);
  const codexCloseToken = useGameStore((s) => s.codexCloseToken);

  const [utcTick, setUtcTick] = useState(0);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  const [technicalDossierOpen, setTechnicalDossierOpen] = useState(false);
  const [hallRecordsOpen, setHallRecordsOpen] = useState(false);
  const [coreAugOpen, setCoreAugOpen] = useState(false);
  const [legacyCreditsOpen, setLegacyCreditsOpen] = useState(false);
  const lastCodexCloseRef = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => setUtcTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (codexCloseToken > lastCodexCloseRef.current) {
      lastCodexCloseRef.current = codexCloseToken;
      setCodexOpen(false);
    }
  }, [codexCloseToken]);

  useEffect(() => {
    const onDossier = () => setTechnicalDossierOpen(true);
    const onHall = () => setHallRecordsOpen(true);
    const onCodex = () => setCodexOpen(true);
    window.addEventListener("nx:sector-open-dossier", onDossier);
    window.addEventListener("nx:sector-open-hall-records", onHall);
    window.addEventListener("nx:sector-open-codex", onCodex);
    return () => {
      window.removeEventListener("nx:sector-open-dossier", onDossier);
      window.removeEventListener("nx:sector-open-hall-records", onHall);
      window.removeEventListener("nx:sector-open-codex", onCodex);
    };
  }, []);

  const dateKey = useMemo(() => getUtcDateKey(), [utcTick]);
  const dailyDef = useMemo(() => getDailyIncursionDefinition(dateKey), [dateKey]);
  const secToMidnight = useMemo(() => secondsUntilNextUtcMidnight(), [utcTick]);

  const stabilities = useMemo(() => computeAllSectorStabilities(history), [history]);

  const dailyEngageOptions = useMemo<InitiateCombatOptions | null>(
    () => ({
      applyDailyRules: true,
      dailyRanked: dailyRankedClearDateUtc !== dateKey,
    }),
    [dailyRankedClearDateUtc, dateKey]
  );

  const scanRingForLf = (lf: number): "stable" | "gap" | "neutral" | undefined => {
    if (!initialSkillScanComplete) return undefined;
    const k = `LF${lf}` as LearningField;
    const v = initialSkillScanByLf[k];
    if (v === true) return "stable";
    if (v === false) return "gap";
    return "neutral";
  };

  const fields = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const lf = i + 1;
      const lfKey = `LF${lf}` as LearningField;
      const entry = getNexusEntryForLF(lfKey);
      const thumb = getBossThumbnailCandidates(lfKey)[0];
      const solved = new Set(learningCorrectByLf[lfKey] ?? []).size;
      const total = CURRICULUM_BY_LF[lfKey]?.length ?? 0;
      const mastered = Boolean(campaign.masteryChecks[lfKey]);
      const unlocked = campaign.unlockedSectors.includes(lf);
      const isDaily = lf === dailyDef.targetLf;
      const scanRing = scanRingForLf(lf);
      return {
        lf,
        lfKey,
        entry,
        thumb,
        solved,
        total,
        mastered,
        unlocked,
        isDaily,
        scanRing,
        title: t(`lf.${lfKey}.boss`, entry.bossDisplayName),
      };
    });
  }, [
    campaign.masteryChecks,
    campaign.unlockedSectors,
    dailyDef.targetLf,
    initialSkillScanByLf,
    initialSkillScanComplete,
    learningCorrectByLf,
    t,
  ]);

  return (
    <motion.div
      data-nx-edtech-sector-map="1"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: edtechPageBackground,
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        src={FRACTAL_COMMAND_BG_MP4}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.14,
          pointerEvents: "none",
          filter: "saturate(1.05) contrast(1.02)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(248,250,252,0.88) 0%, rgba(241,245,249,0.94) 55%, rgba(226,232,240,0.96) 100%)",
        }}
      />

      <header style={edtechHeaderBar}>
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "#64748b",
              fontFamily: "var(--nx-font-sans)",
            }}
          >
            {t("map.edtechKicker")}
          </p>
          <h1
            style={{
              margin: "4px 0 0",
              fontSize: "clamp(22px, 2.6vw, 28px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#0f172a",
              fontFamily: "var(--nx-font-sans)",
              lineHeight: 1.12,
            }}
          >
            {t("map.edtechTitle")}
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              maxWidth: 480,
              fontSize: 15,
              lineHeight: 1.45,
              color: "#475569",
              fontFamily: "var(--nx-font-sans)",
            }}
          >
            {t("map.edtechLead")}
          </p>
          {onOpenLearningHub ? (
            <motion.button
              type="button"
              onClick={onOpenLearningHub}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              style={{ ...edtechPrimaryBtn, marginTop: 12 }}
            >
              {t("map.edtechBackToHub")}
            </motion.button>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <NexusSyncStatus />
          {!extrasOpen ? (
            <button type="button" onClick={() => setExtrasOpen(true)} style={edtechMenuBtn}>
              {t("map.openExtrasMenu")}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => setExtrasOpen(false)} style={edtechMenuBtn}>
                {t("map.closeExtrasMenu")}
              </button>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  data-nx-tutorial="codex"
                  onClick={() => setCodexOpen(true)}
                  style={edtechMenuBtn}
                >
                  {t("map.edtechMenuExercises")}
                </button>
                <button type="button" onClick={() => setTechnicalDossierOpen(true)} style={edtechMenuBtn}>
                  {t("map.edtechMenuInfo")}
                </button>
                <button type="button" onClick={() => setHallRecordsOpen(true)} style={edtechMenuBtn}>
                  {t("map.edtechMenuHistory")}
                </button>
                <button type="button" onClick={() => setOverlayOpenState("GALLERY")} style={edtechMenuBtn}>
                  {t("map.edtechMenuCollection")}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          padding: "clamp(14px, 2.5vw, 24px) clamp(16px, 3vw, 28px) max(24px, env(safe-area-inset-bottom))",
        }}
      >
        <motion.div
          variants={EDTECH_STAGGER}
          initial="hidden"
          animate="show"
          style={{ maxWidth: 1120, margin: "0 auto", width: "100%" }}
        >
          <motion.div
            variants={EDTECH_CARD}
            style={{
              ...glassPanel,
              padding: "16px 18px",
              marginBottom: 18,
              border: `1px solid ${cyanAccent}`,
              background:
                "linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(255,255,255,0.94) 48%, rgba(214,181,111,0.06) 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <motion.div>
                <span
                  style={{
                    fontFamily: "var(--nx-font-mono)",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    color: cyanAccent,
                  }}
                >
                  {t("map.edtechDailyBadge")}
                </span>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontFamily: "var(--nx-font-sans)",
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {t("map.edtechDailyLead").replace("{lf}", String(dailyDef.targetLf))}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                  {formatCountdownHMS(secToMidnight)} · {t("map.edtechDailyReset")}
                </p>
              </motion.div>
              <motion.button
                type="button"
                onClick={() => onEngage(dailyDef.targetLf, dailyEngageOptions ?? undefined)}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                style={edtechGhostBtn}
              >
                {t("map.edtechDailyCta")}
              </motion.button>
            </div>
          </motion.div>

          <EdtechScanStrip t={t} />

          <motion.h2 variants={EDTECH_CARD} style={{ ...sectionH2, marginBottom: 14 }}>
            {t("map.edtechGridTitle")}
          </motion.h2>

          <motion.div variants={EDTECH_CARD} style={edtechCourseGridStyle} data-nx-tutorial="map">
            {fields.map((field) => {
              const tier = stabilityTier(stabilities[field.lf] ?? 0);
              const tierLabel =
                tier === "stable"
                  ? t("map.tierStable")
                  : tier === "unstable"
                    ? t("map.tierUnstable")
                    : t("map.tierCritical");

              const border =
                field.isDaily
                  ? `2px solid ${cyanAccent}`
                  : field.mastered
                    ? `2px solid ${goldAccent}`
                    : field.scanRing === "stable"
                      ? "2px solid rgba(34, 197, 94, 0.65)"
                      : field.scanRing === "gap"
                        ? "2px solid rgba(245, 158, 11, 0.7)"
                        : "1px solid rgba(226, 232, 240, 0.95)";

              return (
                <motion.button
                  key={field.lf}
                  type="button"
                  disabled={!field.unlocked}
                  onClick={() =>
                    onEngage(
                      field.lf,
                      field.isDaily ? dailyEngageOptions ?? undefined : undefined
                    )
                  }
                  whileHover={
                    field.unlocked && !reduceMotion ? { y: -4, boxShadow: "0 20px 48px rgba(15,23,42,0.12)" } : undefined
                  }
                  whileTap={field.unlocked && !reduceMotion ? { scale: 0.99 } : undefined}
                  style={{
                    ...glassPanel,
                    ...edtechCourseCardShell,
                    border,
                    opacity: field.unlocked ? 1 : 0.52,
                    cursor: field.unlocked ? "pointer" : "not-allowed",
                  }}
                >
                  <span style={edtechCourseThumbWrap}>
                    {field.thumb ? (
                      <img src={field.thumb} alt="" style={edtechCourseThumbImg} />
                    ) : null}
                    <span style={edtechCourseLfBadge}>LF{field.lf}</span>
                    {field.isDaily ? (
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: ".1em",
                          textTransform: "uppercase",
                          color: "#0f172a",
                          background: "rgba(255,255,255,0.92)",
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: `1px solid ${cyanAccent}`,
                        }}
                      >
                        {t("map.edtechToday")}
                      </span>
                    ) : null}
                    {field.mastered ? (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 10,
                          right: 10,
                          fontFamily: "var(--nx-font-mono)",
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: ".08em",
                          color: "#0f172a",
                          background: "rgba(255,255,255,0.9)",
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: `1px solid ${goldAccent}`,
                        }}
                      >
                        {t("map.edtechMastered")}
                      </span>
                    ) : null}
                  </span>
                  <span style={edtechCourseBody}>
                    <span style={edtechCourseAp}>{apLabel(field.lf)}</span>
                    <strong style={edtechCourseTitle}>{field.title}</strong>
                    <span style={edtechCourseMeta}>
                      {field.solved}/{field.total} {t("hub.edtech.feed.exercises")} · {tierLabel}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>
      </main>

      <ArtifactGallery
        visible={overlayOpenState !== "NONE"}
        onClose={() => setOverlayOpenState("NONE")}
      />
      <TechnicalDossier open={technicalDossierOpen} onClose={() => setTechnicalDossierOpen(false)} />
      <LegacyCredits open={legacyCreditsOpen} onClose={() => setLegacyCreditsOpen(false)} />
      <HallOfRecords open={hallRecordsOpen} onClose={() => setHallRecordsOpen(false)} />
      <CoreAugmentations open={coreAugOpen} onClose={() => setCoreAugOpen(false)} />
      <AnimatePresence>
        {codexOpen ? (
          <motion.div
            key="edtech-codex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 70,
              background: "rgba(15, 23, 42, 0.55)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              padding: "min(5vh, 32px) min(4vw, 28px)",
              overflow: "auto",
            }}
          >
            <motion.div style={{ position: "absolute", top: 18, right: 20 }}>
              <button
                type="button"
                onClick={() => setCodexOpen(false)}
                style={edtechMenuBtn}
              >
                {t("map.edtechClose")}
              </button>
            </motion.div>
            <CodexIridium />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
