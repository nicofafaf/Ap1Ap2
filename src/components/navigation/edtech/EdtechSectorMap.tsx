import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CodexIridium } from "../../archive/CodexIridium";
import ArtifactGallery from "../../gallery/ArtifactGallery";
import { getNexusEntryForLF, type LearningField } from "../../../data/nexusRegistry";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { CURRICULUM_BY_LF } from "../../../lib/learning/learningRegistry";
import { computeAllSectorStabilities, stabilityTier } from "../../../lib/math/mapLogic";
import { getDailyIncursionDefinition, getUtcDateKey, type InitiateCombatOptions } from "../../../lib/dailyIncursion";
import { EdtechDailyCountdown } from "./EdtechDailyCountdown";
import { useGameStore } from "../../../store/useGameStore";
import { HallOfRecords } from "../../menu/HallOfRecords";
import { LegacyCredits } from "../../menu/LegacyCredits";
import { TechnicalDossier } from "../../menu/TechnicalDossier";
import { CoreAugmentations } from "../CoreAugmentations";
import { EdtechLfThumb } from "./EdtechLfThumb";
import "./edtechSectorMap.css";
import {
  cyanAccent,
  edtechGhostBtn,
  edtechHeaderBar,
  edtechMenuBtn,
  edtechPageBackground,
  edtechPrimaryBtn,
  edtechCardPanel,
  goldAccent,
} from "./edtechHubTokens";
import {
  edtechCourseAp,
  edtechCourseBody,
  edtechCourseCardShell,
  edtechCourseLfBadge,
  edtechCourseMeta,
  edtechCourseTitle,
  edtechLfFooterRow,
  edtechLfProgressFill,
  edtechLfProgressTrack,
  edtechLfSectionTitle,
  edtechLfTierPill,
} from "./edtechCourseCardStyles";

export type EdtechSectorMapProps = {
  onEngage: (lf: number, opts?: InitiateCombatOptions) => void;
  onOpenLearningHub?: () => void;
};

function apLabel(lf: number): string {
  return lf <= 6 ? "AP1" : "AP2";
}

function tierPillStyle(tier: "stable" | "unstable" | "critical"): CSSProperties {
  if (tier === "stable") {
    return {
      color: "#166534",
      background: "rgba(34, 197, 94, 0.12)",
      borderColor: "rgba(34, 197, 94, 0.38)",
    };
  }
  if (tier === "unstable") {
    return {
      color: "#9a3412",
      background: "rgba(245, 158, 11, 0.12)",
      borderColor: "rgba(245, 158, 11, 0.45)",
    };
  }
  return {
    color: "#475569",
    background: "rgba(148, 163, 184, 0.14)",
    borderColor: "rgba(148, 163, 184, 0.45)",
  };
}

export function EdtechSectorMap({ onEngage, onOpenLearningHub }: EdtechSectorMapProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();

  const campaign = useGameStore((s) => s.campaign);
  const history = useGameStore((s) => s.combatArchitectHistory);
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const initialSkillScanByLf = useGameStore((s) => s.initialSkillScanByLf);
  const initialSkillScanComplete = useGameStore((s) => s.initialSkillScanComplete);
  const dailyRankedClearDateUtc = useGameStore((s) => s.dailyRankedClearDateUtc);
  const overlayOpenState = useGameStore((s) => s.overlayOpenState);
  const setOverlayOpenState = useGameStore((s) => s.setOverlayOpenState);
  const codexCloseToken = useGameStore((s) => s.codexCloseToken);

  const [extrasOpen, setExtrasOpen] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  const [technicalDossierOpen, setTechnicalDossierOpen] = useState(false);
  const [hallRecordsOpen, setHallRecordsOpen] = useState(false);
  const [coreAugOpen, setCoreAugOpen] = useState(false);
  const [legacyCreditsOpen, setLegacyCreditsOpen] = useState(false);
  const lastCodexCloseRef = useRef(0);

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

  const dateKey = useMemo(() => getUtcDateKey(), []);
  const dailyDef = useMemo(() => getDailyIncursionDefinition(dateKey), [dateKey]);
  const stabilities = useMemo(() => computeAllSectorStabilities(history), [history]);

  const dailyEngageOptions = useMemo<InitiateCombatOptions>(
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
      const solved = new Set(learningCorrectByLf[lfKey] ?? []).size;
      const total = CURRICULUM_BY_LF[lfKey]?.length ?? 0;
      const mastered = Boolean(campaign.masteryChecks[lfKey]);
      const isDaily = lf === dailyDef.targetLf;
      const scanRing = scanRingForLf(lf);
      return {
        lf,
        lfKey,
        entry,
        solved,
        total,
        mastered,
        isDaily,
        scanRing,
        title: t(`lf.${lfKey}.boss`, entry.bossDisplayName),
        discipline: t(`lf.${lfKey}.discipline`, ""),
      };
    });
  }, [
    campaign.masteryChecks,
    dailyDef.targetLf,
    initialSkillScanByLf,
    initialSkillScanComplete,
    learningCorrectByLf,
    t,
  ]);

  const renderLfCard = (field: (typeof fields)[number]) => {
    const tier = stabilityTier(stabilities[field.lf] ?? 0);
    const tierLabel =
      tier === "stable"
        ? t("map.tierStable")
        : tier === "unstable"
          ? t("map.tierUnstable")
          : t("map.tierCritical");

    const border = field.isDaily
      ? `2px solid ${cyanAccent}`
      : field.mastered
        ? `2px solid ${goldAccent}`
        : field.scanRing === "stable"
          ? "2px solid rgba(34, 197, 94, 0.55)"
          : field.scanRing === "gap"
            ? "2px solid rgba(245, 158, 11, 0.6)"
            : "1px solid rgba(226, 232, 240, 0.92)";

    const pct = field.total > 0 ? Math.min(100, Math.round((field.solved / field.total) * 100)) : 0;
    const ariaLabel = t("map.edtechLfAria").replace("{lf}", String(field.lf)).replace("{title}", field.title);
    const disciplineLine = field.discipline.trim();

    return (
      <motion.button
        key={field.lf}
        type="button"
        layout={false}
        aria-label={ariaLabel}
        onClick={() => onEngage(field.lf, field.isDaily ? dailyEngageOptions : undefined)}
        whileHover={reduceMotion ? undefined : { y: -2 }}
        whileTap={reduceMotion ? undefined : { scale: 0.995 }}
        style={{
          ...edtechCardPanel,
          ...edtechCourseCardShell,
          border,
          cursor: "pointer",
          touchAction: "manipulation",
          contentVisibility: "auto",
          containIntrinsicSize: "0 320px",
          position: "relative",
          height: "100%",
          textAlign: "left",
        }}
      >
        <span className="nx-edtech-lf-thumb-wrap">
          <EdtechLfThumb lf={field.lf} fillContainer />
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
                background: "rgba(255,255,255,0.96)",
                padding: "5px 9px",
                borderRadius: 8,
                border: `1px solid ${cyanAccent}`,
                zIndex: 2,
                boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
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
                background: "rgba(255,255,255,0.94)",
                padding: "5px 9px",
                borderRadius: 8,
                border: `1px solid ${goldAccent}`,
                zIndex: 2,
                boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
              }}
            >
              {t("map.edtechMastered")}
            </span>
          ) : null}
        </span>
        <span style={{ ...edtechCourseBody, flex: "1 1 auto" }}>
          <span style={edtechCourseAp}>{apLabel(field.lf)}</span>
          <strong style={edtechCourseTitle}>{field.title}</strong>
          {disciplineLine ? (
            <span style={{ ...edtechCourseMeta, marginTop: 0 }} title={disciplineLine}>
              {disciplineLine}
            </span>
          ) : null}
          <span style={edtechLfProgressTrack} aria-hidden>
            <span style={{ ...edtechLfProgressFill, width: `${pct}%` }} />
          </span>
          <div style={edtechLfFooterRow} className="nx-edtech-lf-footer">
            <span
              style={{
                fontFamily: "var(--nx-font-mono)",
                fontSize: 11,
                fontWeight: 650,
                color: "#64748b",
                flex: "1 1 auto",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {field.solved}/{field.total} {t("hub.edtech.feed.exercises")}
            </span>
            <span style={{ ...edtechLfTierPill, ...tierPillStyle(tier) }}>{tierLabel}</span>
          </div>
        </span>
      </motion.button>
    );
  };

  return (
    <div
      data-nx-edtech-sector-map="1"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: edtechPageBackground,
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      <header
        className="nx-edtech-sector-header"
        style={{
          ...edtechHeaderBar,
          position: "relative",
          zIndex: 2,
          flexWrap: "wrap",
        }}
      >
        <motion.div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: cyanAccent,
              fontFamily: "var(--nx-font-mono)",
              fontWeight: 750,
            }}
          >
            {t("map.edtechKicker")}
          </p>
          <h1
            style={{
              margin: "4px 0 0",
              fontSize: "clamp(24px, 2.8vw, 32px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#0f172a",
              fontFamily: "var(--nx-font-sans)",
              lineHeight: 1.1,
            }}
          >
            {t("map.edtechTitle")}
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              maxWidth: 520,
              fontSize: "clamp(14px, 3.8vw, 15px)",
              lineHeight: 1.45,
              color: "#475569",
              fontFamily: "var(--nx-font-sans)",
            }}
          >
            {t("map.edtechLead")}
          </p>
          <div className="nx-edtech-header-actions">
            {onOpenLearningHub ? (
              <motion.button
                type="button"
                onClick={onOpenLearningHub}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                style={edtechPrimaryBtn}
              >
                {t("map.edtechBackToHub")}
              </motion.button>
            ) : null}
            <motion.button
              type="button"
              onClick={() => onEngage(dailyDef.targetLf, dailyEngageOptions)}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              style={edtechGhostBtn}
            >
              {t("map.edtechDailyCta")} · LF{dailyDef.targetLf}
            </motion.button>
          </div>
        </motion.div>

        <div className="nx-edtech-header-aside">
          <span className="nx-edtech-countdown-wrap">
            <EdtechDailyCountdown />
          </span>
          {!extrasOpen ? (
            <button type="button" onClick={() => setExtrasOpen(true)} style={edtechMenuBtn}>
              {t("map.openExtrasMenu")}
            </button>
          ) : (
            <motion.div
              className="nx-edtech-extras-menu"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}
            >
              <button type="button" onClick={() => setExtrasOpen(false)} style={edtechMenuBtn}>
                {t("map.closeExtrasMenu")}
              </button>
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
            </motion.div>
          )}
        </div>
      </header>

      <main className="nx-edtech-sector-main">
        <div className="nx-edtech-inner">
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--nx-font-sans)",
                fontSize: "clamp(20px, 2.2vw, 24px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#0f172a",
              }}
            >
              {t("map.edtechGridTitle")}
            </h2>
            <p
              style={{
                margin: "8px 0 0",
                maxWidth: 680,
                fontSize: "clamp(13px, 3.5vw, 14px)",
                lineHeight: 1.5,
                color: "#64748b",
                fontFamily: "var(--nx-font-sans)",
              }}
            >
              {t("map.edtechGridSubtitle")}
            </p>
          </div>

          <div className="nx-edtech-section-block" data-nx-tutorial="map">
            <h3 className="nx-edtech-section-title" style={edtechLfSectionTitle}>
              {t("map.edtechAp1Title")}
            </h3>
            <div className="nx-edtech-lf-grid">{fields.slice(0, 6).map(renderLfCard)}</div>
          </div>

          <div className="nx-edtech-section-block nx-edtech-section-block--last">
            <h3 className="nx-edtech-section-title" style={edtechLfSectionTitle}>
              {t("map.edtechAp2Title")}
            </h3>
            <div className="nx-edtech-lf-grid">{fields.slice(6, 12).map(renderLfCard)}</div>
          </div>
        </div>
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
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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
            <div style={{ position: "absolute", top: 18, right: 20 }}>
              <button type="button" onClick={() => setCodexOpen(false)} style={edtechMenuBtn}>
                {t("map.edtechClose")}
              </button>
            </div>
            <CodexIridium />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
