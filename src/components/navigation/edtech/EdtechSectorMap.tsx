import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { CodexIridium } from "../../archive/CodexIridium";
import ArtifactGallery from "../../gallery/ArtifactGallery";
import { getNexusEntryForLF, type LearningField } from "../../../data/nexusRegistry";
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
import { TechnicalDossier } from "../../menu/TechnicalDossier";
import { CoreAugmentations } from "../CoreAugmentations";
import { EdtechLfThumb } from "./EdtechLfThumb";
import {
  cyanAccent,
  edtechGhostBtn,
  edtechHeaderBar,
  edtechMenuBtn,
  edtechPageBackground,
  edtechPrimaryBtn,
  glassPanel,
  goldAccent,
} from "./edtechHubTokens";
import {
  edtechCourseAp,
  edtechCourseBody,
  edtechCourseCardShell,
  edtechCourseGridStyle,
  edtechCourseLfBadge,
  edtechCourseMeta,
  edtechCourseTitle,
} from "./edtechCourseCardStyles";

export type EdtechSectorMapProps = {
  onEngage: (lf: number, opts?: InitiateCombatOptions) => void;
  onOpenLearningHub?: () => void;
};

function apLabel(lf: number): string {
  return lf <= 6 ? "AP1" : "AP2";
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
              fontSize: 15,
              lineHeight: 1.45,
              color: "#475569",
              fontFamily: "var(--nx-font-sans)",
            }}
          >
            {t("map.edtechLead")}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 14,
              alignItems: "center",
            }}
          >
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
              {t("map.edtechDailyCta")} Â· LF{dailyDef.targetLf}
            </motion.button>
          </div>
        </motion.div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--nx-font-mono)",
              fontSize: 12,
              color: "#64748b",
              letterSpacing: ".06em",
            }}
          >
            {formatCountdownHMS(secToMidnight)} Â· {t("map.edtechDailyReset")}
          </span>
          {!extrasOpen ? (
            <button type="button" onClick={() => setExtrasOpen(true)} style={edtechMenuBtn}>
              {t("map.openExtrasMenu")}
            </button>
          ) : (
            <motion.div
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

      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          padding: "clamp(12px, 2vw, 20px) clamp(16px, 3vw, 28px) max(28px, env(safe-area-inset-bottom))",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto", width: "100%" }}>
          <h2
            style={{
              margin: "0 0 14px",
              fontFamily: "var(--nx-font-sans)",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#0f172a",
            }}
          >
            {t("map.edtechGridTitle")}
          </h2>

          <motion.div
            style={edtechCourseGridStyle}
            data-nx-tutorial="map"
            initial={false}
            animate={{ opacity: 1 }}
          >
            {fields.map((field) => {
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

              return (
                <motion.button
                  key={field.lf}
                  type="button"
                  layout={false}
                  onClick={() =>
                    onEngage(field.lf, field.isDaily ? dailyEngageOptions : undefined)
                  }
                  whileHover={
                    reduceMotion
                      ? undefined
                      : {
                          y: -3,
                          boxShadow: "0 18px 44px rgba(15,23,42,0.1), 0 0 0 1px rgba(6,182,212,0.12)",
                        }
                  }
                  whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                  style={{
                    ...glassPanel,
                    ...edtechCourseCardShell,
                    border,
                    cursor: "pointer",
                    touchAction: "manipulation",
                    contentVisibility: "auto",
                    containIntrinsicSize: "0 200px",
                    position: "relative",
                  }}
                >
                  <span style={{ position: "relative", display: "block" }}>
                    <EdtechLfThumb lf={field.lf} priority={field.isDaily} />
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
                          background: "rgba(255,255,255,0.94)",
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: `1px solid ${cyanAccent}`,
                          zIndex: 2,
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
                          background: "rgba(255,255,255,0.92)",
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: `1px solid ${goldAccent}`,
                          zIndex: 2,
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
                      {field.discipline}
                      {" Â· "}
                      {field.solved}/{field.total} {t("hub.edtech.feed.exercises")}
                      {" Â· "}
                      {tierLabel}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
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
