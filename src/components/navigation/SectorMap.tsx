import { AnimatePresence, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import ArtifactGallery from "../gallery/ArtifactGallery";
import {
  achievementOrder,
  achievementRegistry,
  type AchievementType,
} from "../../data/achievementRegistry";
import { getBossThumbnailCandidates, getNexusEntryForLF, type LearningField } from "../../data/nexusRegistry";
import { CURRICULUM_BY_LF } from "../../lib/learning/learningRegistry";
import { useGameStore } from "../../store/useGameStore";
import type { GlobalCollectionEntry } from "../../store/useGameStore";
import {
  computeAllSectorStabilities,
  lastReportForLf,
  sectorCorruptionRate,
  stabilityTier,
} from "../../lib/math/mapLogic";
import { SectorNode } from "./SectorNode";
import { SkillRadar } from "./SkillRadar";
import { CoreAugmentations } from "./CoreAugmentations";
import { SectorInstabilityBanner } from "./AnomalyOverlay";
import { HallOfRecords } from "../menu/HallOfRecords";
import { NexusSyncStatus } from "../menu/NexusSyncStatus";
import { TechnicalDossier } from "../menu/TechnicalDossier";
import { LegacyCredits } from "../menu/LegacyCredits";
import { CodexIridium } from "../archive/CodexIridium";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { readEpilogueUnlocked } from "../../lib/progression/nexusEpilogue";
import {
  buildGhostUploadEchoPaths,
  DAILY_PURPLE_BORDER,
  DAILY_PURPLE_MUTED,
  DAILY_PURPLE_NEON,
  findEchoPathCrossings,
  formatCountdownHMS,
  generateArchitectEchoPaths,
  getDailyIncursionDefinition,
  getUtcDateKey,
  isSectorZeroUnlocked,
  secondsUntilNextUtcMidnight,
  SECTOR_ZERO_STABILITY_THRESHOLD,
  type ArchitectEchoPath,
  type InitiateCombatOptions,
} from "../../lib/dailyIncursion";

type SectorMapProps = {
  onEngage: (lf: number, opts?: InitiateCombatOptions) => void;
  /** LF-Nummer für gemeinsames layoutId mit Boss-Stage (nur kurz nach Dive) */
  layoutBridgeLf?: number | null;
  /** Sofortiger Kampfstart ohne Zoom-Out-Animation — für Layout-Morph */
  seamlessEngage?: boolean;
  /** Ruhe-Übersicht (NeuralInitializer) über der Karte */
  onOpenLearningHub?: () => void;
};

function useGhostSyncDesktop(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const mqShort = window.matchMedia("(max-width: 1024px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setOk(!mqCoarse.matches && !mqShort.matches && !mqReduce.matches);
    fn();
    mqCoarse.addEventListener("change", fn);
    mqShort.addEventListener("change", fn);
    mqReduce.addEventListener("change", fn);
    return () => {
      mqCoarse.removeEventListener("change", fn);
      mqShort.removeEventListener("change", fn);
      mqReduce.removeEventListener("change", fn);
    };
  }, []);
  return ok;
}

function dominantPrestigeColor(
  globalCollection: Record<AchievementType, GlobalCollectionEntry>
): string {
  let best: AchievementType | null = null;
  for (const t of achievementOrder) {
    if ((globalCollection[t]?.count ?? 0) <= 0) continue;
    if (
      !best ||
      achievementRegistry[t].priority > achievementRegistry[best].priority
    ) {
      best = t;
    }
  }
  return best ? achievementRegistry[best].color : "var(--cyan, #22d3ee)";
}

function GridLayer({
  patternId,
  opacity,
  scale,
  shiftX,
  shiftY,
}: {
  patternId: string;
  opacity: number;
  scale: number;
  shiftX: MotionValue<number>;
  shiftY: MotionValue<number>;
}) {
  return (
    <motion.div
      style={{
        position: "absolute",
        inset: "-12%",
        x: shiftX,
        y: shiftY,
        scale,
        opacity,
        pointerEvents: "none",
        touchAction: "none",
      }}
    >
      <svg width="100%" height="100%" style={{ display: "block" }}>
        <defs>
          <pattern
            id={patternId}
            width={48}
            height={48}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="var(--nx-chroma-grid, rgba(34, 211, 238, 0.16))"
              strokeWidth={0.5}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </motion.div>
  );
}

function SkillGapStrip({ t }: { t: (key: string, fallback?: string) => string }) {
  const scan = useGameStore((s) => s.initialSkillScanByLf);
  const done = useGameStore((s) => s.initialSkillScanComplete);
  if (!done) return null;
  const dot = (lf: number) => {
    const k = `LF${lf}` as LearningField;
    const v = scan[k];
    const bg =
      v === true ? "rgba(52,211,153,0.92)" : v === false ? "rgba(248,113,113,0.92)" : "rgba(251,247,239,0.2)";
    return (
      <div
        key={k}
        title={`LF${lf}`}
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: bg,
          border: "1px solid rgba(251,247,239,0.28)",
        }}
      />
    );
  };
  return (
    <div
      style={{
        marginBottom: 12,
        padding: "12px 14px",
        borderRadius: 14,
        border: "1px solid rgba(251,247,239,0.2)",
        background: "rgba(8,12,10,0.55)",
        maxWidth: 480,
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 750,
          color: "rgba(251,247,239,0.95)",
          letterSpacing: ".04em",
        }}
      >
        {t("map.skillGapTitle")}
      </div>
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20, color: "rgba(251,247,239,0.72)", fontWeight: 650 }}>
          {t("map.skillGapAp1")}
        </span>
        {[1, 2, 3, 4, 5, 6].map(dot)}
      </div>
      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20, color: "rgba(251,247,239,0.72)", fontWeight: 650 }}>
          {t("map.skillGapAp2")}
        </span>
        {[7, 8, 9, 10, 11, 12].map(dot)}
      </div>
    </div>
  );
}

function BossPreview({ lf }: { lf: number }) {
  const lfKey = `LF${Math.max(1, Math.min(12, lf))}` as LearningField;
  const entry = getNexusEntryForLF(lfKey);
  const [step, setStep] = useState(0);
  const [hoverVideo, setHoverVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setStep(0);
    setHoverVideo(false);
  }, [lf, entry.bossVisual.primaryPath]);

  useEffect(() => {
    if (!hoverVideo || !videoRef.current) return;
    void videoRef.current.play().catch(() => {});
    return () => videoRef.current?.pause();
  }, [hoverVideo]);

  const thumbCandidates = useMemo(() => getBossThumbnailCandidates(lfKey), [lfKey]);
  const thumbSrc = thumbCandidates[Math.min(step, thumbCandidates.length - 1)]!;

  const advance = useCallback(() => setStep((s) => s + 1), []);

  return (
    <div
      onPointerEnter={() => setHoverVideo(true)}
      onPointerLeave={() => setHoverVideo(false)}
      style={{ position: "relative", width: "100%", borderRadius: 10, overflow: "hidden" }}
    >
      <img
        key={`${lf}-thumb-${step}`}
        src={thumbSrc}
        alt=""
        onError={advance}
        style={{
          width: "100%",
          maxHeight: 160,
          minHeight: 120,
          objectFit: "cover",
          display: "block",
          opacity: hoverVideo ? 0.2 : 1,
          transition: "opacity 0.3s ease",
          background: "rgba(0,0,0,0.35)",
        }}
      />
      {hoverVideo ? (
        <video
          ref={videoRef}
          src={entry.bossVisual.primaryPath}
          muted
          playsInline
          loop
          preload="none"
          onError={() => setHoverVideo(false)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : null}
    </div>
  );
}

export function SectorMap({
  onEngage,
  layoutBridgeLf = null,
  seamlessEngage = false,
  onOpenLearningHub,
}: SectorMapProps) {
  const { t, locale } = useNexusI18n();
  const tierLabels = useMemo(
    () => ({
      stable: t("map.tierStable"),
      unstable: t("map.tierUnstable"),
      critical: t("map.tierCritical"),
    }),
    [locale, t]
  );
  const history = useGameStore((s) => s.combatArchitectHistory);
  const campaign = useGameStore((s) => s.campaign);
  const globalCollection = useGameStore((s) => s.globalCollection);
  const setOverlayOpenState = useGameStore((s) => s.setOverlayOpenState);
  const sectorAnomalies = useGameStore((s) => s.sectorAnomalies);
  const regenerateSectorAnomalies = useGameStore((s) => s.regenerateSectorAnomalies);
  const dailyRankedClearDateUtc = useGameStore((s) => s.dailyRankedClearDateUtc);
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const nexusMasterCertificateSealed = useGameStore((s) => s.nexusMasterCertificateSealed);
  const initialSkillScanByLf = useGameStore((s) => s.initialSkillScanByLf);
  const initialSkillScanComplete = useGameStore((s) => s.initialSkillScanComplete);

  const skillScanRingForLf = useCallback(
    (lf: number): "stable" | "gap" | "neutral" | undefined => {
      if (!initialSkillScanComplete) return undefined;
      const k = `LF${lf}` as LearningField;
      const v = initialSkillScanByLf[k];
      if (v === true) return "stable";
      if (v === false) return "gap";
      return "neutral";
    },
    [initialSkillScanByLf, initialSkillScanComplete]
  );

  const [utcTick, setUtcTick] = useState(0);
  const [hoverLf, setHoverLf] = useState<number | null>(null);
  const [coreAugOpen, setCoreAugOpen] = useState(false);
  const [hallRecordsOpen, setHallRecordsOpen] = useState(false);
  const [endlessDeepDiveOptIn, setEndlessDeepDiveOptIn] = useState(false);
  const [technicalDossierOpen, setTechnicalDossierOpen] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  const codexCloseToken = useGameStore((s) => s.codexCloseToken);
  const lastCodexCloseTokenRef = useRef(0);
  const [epilogLoreOpen, setEpilogLoreOpen] = useState(false);
  const [legacyCreditsOpen, setLegacyCreditsOpen] = useState(false);
  const [dailyPanelOpen, setDailyPanelOpen] = useState(false);
  /** Ruhe-Modus: weniger gleichzeitig auf der Karte */
  const [heroGuideOpen, setHeroGuideOpen] = useState(false);
  const [extrasMenuOpen, setExtrasMenuOpen] = useState(false);
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const [coachDockCompact, setCoachDockCompact] = useState(false);

  const epilogueActive = useMemo(
    () => readEpilogueUnlocked() || Boolean(nexusMasterCertificateSealed),
    [nexusMasterCertificateSealed]
  );
  const isFirstBoot = useGameStore((s) => s.isFirstBoot);

  useEffect(() => {
    if (codexCloseToken > lastCodexCloseTokenRef.current) {
      lastCodexCloseTokenRef.current = codexCloseToken;
      setCodexOpen(false);
    }
  }, [codexCloseToken]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 780px), (max-height: 640px)");
    const fn = () => setCoachDockCompact(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  /** Erstes Mal auf der Karte: Menü offen, damit geführte Tour das Codex-Ziel findet */
  useEffect(() => {
    if (epilogueActive) return;
    if (isFirstBoot) setExtrasMenuOpen(true);
  }, [epilogueActive, isFirstBoot]);

  useEffect(() => {
    regenerateSectorAnomalies();
  }, [regenerateSectorAnomalies]);

  useEffect(() => {
    const id = window.setInterval(() => setUtcTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const dateKey = useMemo(() => getUtcDateKey(), [utcTick]);
  const dailyDef = useMemo(() => getDailyIncursionDefinition(dateKey), [dateKey]);
  const secToMidnight = useMemo(() => secondsUntilNextUtcMidnight(), [utcTick]);

  const learningByLfNum = useMemo(() => {
    const out: Record<number, { ratio: number; mastered: boolean }> = {};
    for (let lf = 1; lf <= 12; lf += 1) {
      const key = `LF${lf}` as LearningField;
      const curriculum = CURRICULUM_BY_LF[key] ?? [];
      const have = new Set(learningCorrectByLf[key] ?? []);
      const correct = curriculum.filter((e) => have.has(e.id)).length;
      const total = curriculum.length;
      const ratio = total > 0 ? correct / total : 0;
      const mastered = total > 0 && correct >= total;
      out[lf] = { ratio, mastered };
    }
    return out;
  }, [learningCorrectByLf]);

  const dailyEngageOptions = useMemo<InitiateCombatOptions | null>(() => {
    return {
      applyDailyRules: true,
      dailyRanked: dailyRankedClearDateUtc !== dateKey,
    };
  }, [dailyRankedClearDateUtc, dateKey]);

  const ghostSyncDesktop = useGhostSyncDesktop();
  const ghostUploadPaths = useMemo(
    () =>
      buildGhostUploadEchoPaths(
        history.map((e) => ({ activeLF: e.activeLF, recordedAt: e.recordedAt })),
        5
      ),
    [history]
  );
  const architectEchoPaths = useMemo(() => {
    const detCount = ghostSyncDesktop ? 6 : 8;
    const det = generateArchitectEchoPaths(dailyDef.seed, detCount);
    if (!ghostSyncDesktop || ghostUploadPaths.length === 0) return det;
    return [...ghostUploadPaths, ...det].slice(0, 16);
  }, [dailyDef.seed, ghostSyncDesktop, ghostUploadPaths]);

  const stabilities = useMemo(() => computeAllSectorStabilities(history), [history]);
  const sectorZeroGateOpen = useMemo(() => isSectorZeroUnlocked(stabilities), [stabilities]);
  const prestige = useMemo(
    () => dominantPrestigeColor(globalCollection),
    [globalCollection]
  );

  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const zoom = useMotionValue(1);

  const gridShiftX1 = useTransform(panX, (v) => v * 0.035);
  const gridShiftY1 = useTransform(panY, (v) => v * 0.035);
  const gridShiftX2 = useTransform(panX, (v) => v * 0.02);
  const gridShiftY2 = useTransform(panY, (v) => v * 0.02);

  const mapRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mapRootRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const z = zoom.get() - e.deltaY * 0.0011;
      zoom.set(Math.min(2.65, Math.max(0.36, z)));
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [zoom]);

  /** Karten-Bühne 900×640: ohne Auto-Fit wirkt die Oberwelt auf kleinen Screens „reingezoomt“ */
  useLayoutEffect(() => {
    const el = mapRootRef.current;
    if (!el) return;
    const STAGE_W = 900;
    const STAGE_H = 640;
    const apply = () => {
      const r = el.getBoundingClientRect();
      if (r.width < 96 || r.height < 96) return;
      const marginX = 48;
      const marginY = 168;
      const zw = (r.width - marginX) / STAGE_W;
      const zh = (r.height - marginY) / STAGE_H;
      const fit = Math.min(1.12, Math.max(0.34, Math.min(zw, zh)));
      zoom.set(Math.min(zoom.get(), fit));
    };
    apply();
    const ro = new ResizeObserver(() => requestAnimationFrame(apply));
    ro.observe(el);
    return () => ro.disconnect();
  }, [zoom]);

  const hoverEntry = hoverLf
    ? getNexusEntryForLF(`LF${hoverLf}` as LearningField)
    : null;
  const hoverStability = hoverLf != null ? (stabilities[hoverLf] ?? 0) : 0;
  const hoverCorruption =
    hoverLf != null ? sectorCorruptionRate(hoverLf, hoverStability) : 0;

  const nodeLayout = useMemo(() => {
    const cols = 4;
    const rows = 3;
    const sx = 172;
    const sy = 148;
    return Array.from({ length: 12 }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const offsetX = (col - (cols - 1) / 2) * sx;
      const offsetY = (row - (rows - 1) / 2) * sy;
      const parallaxZ = (col - 1.5) * 5 + (row - 1) * 6;
      return { lf: i + 1, offsetX, offsetY, parallaxZ };
    });
  }, []);

  const onHoverChange = useCallback((lf: number | null) => {
    setHoverLf(lf);
  }, []);

  const premiumAmbient = useMemo(() => {
    if (epilogueActive) return "";
    const parts: string[] = [];
    for (let i = 1; i <= 12; i += 1) {
      const e = getNexusEntryForLF(`LF${i}` as LearningField);
      const c = e.combatPalette.primary
        .replace("0.98", "0.16")
        .replace("0.95", "0.14")
        .replace("0.9", "0.12");
      const xp = 6 + ((i * 73) % 88);
      const yp = 10 + ((i * 47) % 72);
      parts.push(`radial-gradient(ellipse 42% 32% at ${xp}% ${yp}%, ${c}, transparent 58%)`);
    }
    return parts.join(", ");
  }, [epilogueActive]);

  return (
    <div
      ref={mapRootRef}
      data-nx-epilogue={epilogueActive ? "1" : undefined}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "100dvh",
        background: epilogueActive
          ? `radial-gradient(ellipse 82% 58% at 50% 36%, rgba(250, 204, 21, 0.34), rgba(255, 252, 245, 0.92) 52%, #f7f2e8), linear-gradient(165deg, #fffefb 0%, #f3ebe0 55%, #ebe4d4 100%)`
          : `radial-gradient(ellipse 80% 60% at 50% 20%, rgba(214,181,111,0.14), transparent 58%), radial-gradient(ellipse 70% 55% at 12% 88%, rgba(58,112,72,0.18), transparent 56%), rgba(8, 12, 10, 0.68)`,
        overflow: "hidden",
        touchAction: "none",
        transition: "background 1.1s ease",
      }}
    >
      {!epilogueActive && premiumAmbient ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            background: premiumAmbient,
            opacity: 0.55,
            mixBlendMode: "screen",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 24,
          right: 24,
          zIndex: 20,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto", maxWidth: 520 }}>
          {!epilogueActive ? <SkillGapStrip t={t} /> : null}
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".08em",
              color: epilogueActive ? "rgba(180, 130, 40, 0.88)" : "rgba(251,247,239,0.68)",
            }}
          >
            {epilogueActive ? "Lernstand gesichert" : t("map.heroKicker")}
          </div>
          <div
            className={epilogueActive ? undefined : "nx-title-ultra"}
            style={{
              marginTop: 6,
              fontSize: epilogueActive ? 20 : 22,
              fontWeight: epilogueActive ? 700 : undefined,
              letterSpacing: ".04em",
              color: epilogueActive ? "rgba(55, 42, 18, 0.94)" : "rgba(251,247,239,0.96)",
              lineHeight: 1.15,
            }}
          >
            {epilogueActive
              ? "Abschlussübersicht"
              : heroGuideOpen
                ? t("map.heroTitle")
                : t("map.heroTitleCalm")}
          </div>
          {epilogueActive ? (
            <>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  opacity: 0.82,
                  maxWidth: 420,
                  lineHeight: 1.45,
                  color: "rgba(80, 64, 38, 0.9)",
                }}
              >
                Der Kern ist gesichert — die Karte trägt dein Architekten-Siegel
              </div>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                style={{ marginTop: 12, maxWidth: 460 }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setEpilogLoreOpen((o) => !o)}
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(212, 175, 55, 0.55)",
                      background:
                        "linear-gradient(135deg, rgba(255,253,248,0.95) 0%, rgba(250,240,220,0.92) 100%)",
                      color: "rgba(62, 48, 22, 0.94)",
                      letterSpacing: ".14em",
                      fontSize: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                      boxShadow: "0 8px 28px rgba(180, 140, 60, 0.22)",
                    }}
                  >
                    {epilogLoreOpen ? "Epilog schließen" : "Epilog · Master-Architekt"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLegacyCreditsOpen(true)}
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(34, 211, 238, 0.45)",
                      background: "rgba(8, 22, 32, 0.55)",
                      color: "rgba(186, 230, 253, 0.95)",
                      letterSpacing: ".14em",
                      fontSize: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                    }}
                  >
                    Legacy · Credits
                  </button>
                </div>
                {epilogLoreOpen ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.35 }}
                    style={{
                      marginTop: 10,
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "1px solid rgba(202, 165, 80, 0.42)",
                      background: "rgba(255, 252, 246, 0.88)",
                      color: "rgba(55, 44, 26, 0.92)",
                      fontSize: 13,
                      lineHeight: 1.65,
                      boxShadow: "inset 0 0 24px rgba(250, 220, 160, 0.25)",
                    }}
                  >
                    Du hast Sektor Ø entladen — vom Lehrling der Zelllogik zum Master-Architekten der
                    Nexus-Lattice: Anomalien weichen, und das Raster leuchtet in Weißgold wie ein
                    wiederhergestelltes System, das deinen Abschluss als echte Architektur-Signatur
                    trägt
                  </motion.div>
                ) : null}
              </motion.div>
              {!sectorZeroGateOpen ? (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 10,
                    letterSpacing: ".06em",
                    color: "rgba(250, 204, 21, 0.72)",
                    maxWidth: 440,
                    lineHeight: 1.45,
                  }}
                >
                  Finale Prüfung — alle 12 Lernfelder über {(SECTOR_ZERO_STABILITY_THRESHOLD * 100).toFixed(0)} %
                  Stabilität
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setDailyPanelOpen((o) => !o)}
                style={{
                  marginTop: 12,
                  borderRadius: 10,
                  border: "1px solid rgba(251,247,239,0.22)",
                  background: "rgba(251,247,239,0.08)",
                  color: "rgba(251,247,239,0.9)",
                  letterSpacing: ".12em",
                  fontSize: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                {dailyPanelOpen ? t("map.dailyCollapse") : t("map.dailyExpand")}
              </button>
              {dailyPanelOpen ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.28 }}
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: `1px solid ${DAILY_PURPLE_BORDER}`,
                    background: "rgba(255, 252, 246, 0.55)",
                    maxWidth: 440,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: ".24em",
                      color: "rgba(90, 60, 120, 0.85)",
                    }}
                  >
                    Nächste Übungsrunde
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: ".08em",
                      color: "rgba(55, 42, 18, 0.92)",
                      fontFamily: "var(--nx-font-sans)",
                    }}
                  >
                    {formatCountdownHMS(secToMidnight)} · Reset 00:00 UTC
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 10,
                      color: "rgba(80, 64, 38, 0.82)",
                      lineHeight: 1.4,
                    }}
                  >
                    Tages-Lernfeld LF{dailyDef.targetLf} · Startphase {dailyDef.startCombatPhase}
                  </div>
                </motion.div>
              ) : null}
            </>
          ) : !heroGuideOpen ? (
            <>
              <p
                style={{
                  margin: "12px 0 0",
                  maxWidth: 440,
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: "rgba(251,247,239,0.82)",
                  fontWeight: 500,
                }}
              >
                {t("map.heroOneLine")}
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
                <button
                  type="button"
                  onClick={() => setHeroGuideOpen(true)}
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(251,247,239,0.28)",
                    background: "rgba(251,247,239,0.1)",
                    color: "rgba(251,247,239,0.95)",
                    letterSpacing: ".04em",
                    fontSize: 14,
                    fontWeight: 700,
                    padding: "10px 16px",
                    cursor: "pointer",
                  }}
                >
                  {t("map.heroExpand")}
                </button>
                {onOpenLearningHub ? (
                  <motion.button
                    type="button"
                    onClick={onOpenLearningHub}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      borderRadius: 999,
                      border: "1px solid rgba(214,181,111,0.45)",
                      background: "linear-gradient(135deg, rgba(251,247,239,0.14) 0%, rgba(58,112,72,0.22) 100%)",
                      color: "rgba(251,247,239,0.96)",
                      letterSpacing: ".04em",
                      fontSize: 14,
                      fontWeight: 700,
                      padding: "10px 16px",
                      cursor: "pointer",
                      boxShadow: "0 12px 36px rgba(0,0,0,0.22)",
                    }}
                  >
                    {t("map.openLearningHub")}
                  </motion.button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <motion.ol
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  margin: "12px 0 0",
                  paddingLeft: 22,
                  maxWidth: 480,
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: "rgba(251,247,239,0.88)",
                  fontWeight: 500,
                }}
              >
                <li style={{ marginBottom: 6 }}>{t("map.heroStep1")}</li>
                <li style={{ marginBottom: 6 }}>{t("map.heroStep2")}</li>
                <li>{t("map.heroStep3")}</li>
              </motion.ol>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  opacity: 0.72,
                  maxWidth: 440,
                  lineHeight: 1.45,
                  color: "rgba(251,247,239,0.78)",
                }}
              >
                {t("map.heroMapHint")}
              </div>
              {onOpenLearningHub ? (
                <motion.button
                  type="button"
                  onClick={onOpenLearningHub}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    marginTop: 14,
                    borderRadius: 999,
                    border: "1px solid rgba(214,181,111,0.45)",
                    background: "linear-gradient(135deg, rgba(251,247,239,0.14) 0%, rgba(58,112,72,0.22) 100%)",
                    color: "rgba(251,247,239,0.96)",
                    letterSpacing: ".04em",
                    fontSize: 15,
                    fontWeight: 700,
                    padding: "12px 18px",
                    cursor: "pointer",
                    boxShadow: "0 12px 36px rgba(0,0,0,0.22)",
                  }}
                >
                  {t("map.openLearningHub")}
                </motion.button>
              ) : null}
              {!sectorZeroGateOpen ? (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    letterSpacing: ".04em",
                    color: "rgba(250, 204, 21, 0.62)",
                    maxWidth: 440,
                    lineHeight: 1.45,
                  }}
                >
                  {t("map.heroFinalExamHint")}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setDailyPanelOpen((o) => !o)}
                style={{
                  marginTop: 12,
                  borderRadius: 10,
                  border: "1px solid rgba(251,247,239,0.22)",
                  background: "rgba(251,247,239,0.08)",
                  color: "rgba(251,247,239,0.9)",
                  letterSpacing: ".12em",
                  fontSize: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                {dailyPanelOpen ? t("map.dailyCollapse") : t("map.dailyExpand")}
              </button>
              {dailyPanelOpen ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.28 }}
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: `1px solid ${DAILY_PURPLE_BORDER}`,
                    background: "rgba(24,10,40,0.55)",
                    maxWidth: 440,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: ".24em",
                      color: DAILY_PURPLE_MUTED,
                    }}
                  >
                    Nächste Übungsrunde
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: ".08em",
                      color: "rgba(251,247,239,0.9)",
                      fontFamily: "var(--nx-font-sans)",
                    }}
                  >
                    {formatCountdownHMS(secToMidnight)} · Reset 00:00 UTC
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 10,
                      color: "rgba(233,213,255,0.82)",
                      lineHeight: 1.4,
                    }}
                  >
                    Tages-Lernfeld LF{dailyDef.targetLf} · Startphase {dailyDef.startCombatPhase}
                  </div>
                </motion.div>
              ) : null}
              <button
                type="button"
                onClick={() => setHeroGuideOpen(false)}
                style={{
                  marginTop: 12,
                  borderRadius: 10,
                  border: "1px solid rgba(251,247,239,0.18)",
                  background: "transparent",
                  color: "rgba(251,247,239,0.65)",
                  letterSpacing: ".08em",
                  fontSize: 11,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                {t("map.heroCollapse")}
              </button>
            </>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 10,
            pointerEvents: "auto",
          }}
        >
          {epilogueActive || extrasMenuOpen ? (
            <>
              {epilogueActive ? null : (
                <button
                  type="button"
                  onClick={() => setExtrasMenuOpen(false)}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(251,247,239,0.22)",
                    background: "rgba(251,247,239,0.08)",
                    color: "rgba(251,247,239,0.88)",
                    letterSpacing: ".1em",
                    fontSize: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  {t("map.closeExtrasMenu")}
                </button>
              )}
              <NexusSyncStatus />
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  fontSize: 10,
                  letterSpacing: ".14em",
                  color: "rgba(251,247,239,0.82)",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={endlessDeepDiveOptIn}
                  onChange={(e) => setEndlessDeepDiveOptIn(e.target.checked)}
                  style={{ accentColor: "#facc15" }}
                />
                Langlauf
              </label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  data-nx-tutorial="codex"
                  onClick={() => setCodexOpen(true)}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(251,247,239,0.18)",
                    background: "rgba(251,247,239,0.12)",
                    color: "rgba(251,247,239,0.96)",
                    letterSpacing: ".14em",
                    fontSize: 11,
                    padding: "10px 14px",
                    cursor: "pointer",
                  }}
                >
                  Übungen
                </button>
                <button
                  type="button"
                  onClick={() => setTechnicalDossierOpen(true)}
                  title={t("map.technicalPortfolioTitle")}
                  aria-label={t("map.openDossierAria")}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(251,247,239,0.18)",
                    background: "rgba(251,247,239,0.12)",
                    color: "rgba(251,247,239,0.96)",
                    letterSpacing: ".14em",
                    fontSize: 11,
                    padding: "10px 14px",
                    cursor: "pointer",
                  }}
                >
                  Info
                </button>
                <button
                  type="button"
                  onClick={() => setHallRecordsOpen(true)}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(251,247,239,0.18)",
                    background: "rgba(251,247,239,0.12)",
                    color: "rgba(251,247,239,0.96)",
                    letterSpacing: ".14em",
                    fontSize: 11,
                    padding: "10px 14px",
                    cursor: "pointer",
                  }}
                >
                  Verlauf
                </button>
                <button
                  type="button"
                  onClick={() => setOverlayOpenState("GALLERY")}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(251,247,239,0.18)",
                    background: "rgba(251,247,239,0.12)",
                    color: "rgba(251,247,239,0.96)",
                    letterSpacing: ".14em",
                    fontSize: 11,
                    padding: "10px 14px",
                    cursor: "pointer",
                  }}
                >
                  Sammlung
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setExtrasMenuOpen(true)}
              style={{
                borderRadius: 10,
                border: "1px solid rgba(251,247,239,0.22)",
                background: "rgba(251,247,239,0.1)",
                color: "rgba(251,247,239,0.92)",
                letterSpacing: ".14em",
                fontSize: 11,
                padding: "10px 16px",
                cursor: "pointer",
              }}
            >
              {t("map.openExtrasMenu")}
            </button>
          )}
        </div>
      </div>

      <nav
        aria-label="Direkte Lernfeldauswahl"
        style={{
          position: "fixed",
          left: "max(20px, env(safe-area-inset-left))",
          right: "max(20px, env(safe-area-inset-right))",
          bottom: "max(20px, env(safe-area-inset-bottom))",
          zIndex: 34,
          pointerEvents: "auto",
          padding: quickStartOpen ? 16 : 12,
          borderRadius: quickStartOpen ? 26 : 18,
          border: "1px solid rgba(251,247,239,0.16)",
          background: "rgba(8, 12, 10, 0.76)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          boxShadow: "0 22px 70px rgba(0,0,0,0.26)",
        }}
      >
        {!quickStartOpen ? (
          <button
            type="button"
            onClick={() => setQuickStartOpen(true)}
            style={{
              width: "100%",
              borderRadius: 14,
              border: "1px solid rgba(214,181,111,0.35)",
              background: "linear-gradient(160deg, rgba(251,247,239,0.12), rgba(58,112,72,0.12))",
              color: "rgba(251,247,239,0.94)",
              letterSpacing: ".06em",
              fontSize: 15,
              fontWeight: 700,
              padding: "14px 16px",
              cursor: "pointer",
            }}
          >
            {t("map.quickStartExpand")}
          </button>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div>
                <div
                  style={{
                    fontFamily: "var(--nx-font-mono)",
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(251,247,239,0.72)",
                  }}
                >
                  {t("map.directNavTitle")}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    lineHeight: 1.35,
                    color: "rgba(251,247,239,0.58)",
                    fontWeight: 500,
                  }}
                >
                  {t("map.directNavSubtitle")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickStartOpen(false)}
                style={{
                  flexShrink: 0,
                  borderRadius: 10,
                  border: "1px solid rgba(251,247,239,0.2)",
                  background: "rgba(251,247,239,0.08)",
                  color: "rgba(251,247,239,0.85)",
                  letterSpacing: ".08em",
                  fontSize: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                {t("map.quickStartCollapse")}
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))",
                gap: 10,
              }}
            >
              {Array.from({ length: 12 }, (_, idx) => {
                const lf = idx + 1;
                return (
                  <a
                    key={`direct-lf-${lf}`}
                    href={`/?startLf=${lf}`}
                    style={{
                      minHeight: 54,
                      borderRadius: 18,
                      border: "1px solid rgba(214,181,111,0.3)",
                      background:
                        "linear-gradient(160deg, rgba(251,247,239,0.92), rgba(238,229,213,0.82))",
                      color: "var(--nx-learn-ink)",
                      fontFamily: "var(--nx-font-mono)",
                      fontSize: 20,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      textAlign: "center",
                      textDecoration: "none",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.58)",
                    }}
                  >
                    LF{lf} starten
                  </a>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {hoverLf != null && hoverEntry ? (
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            position: "fixed",
            top: 100,
            right: 20,
            width: "min(280px, calc(100vw - 40px))",
            zIndex: 30,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(251,247,239,0.18)",
            background:
              "linear-gradient(168deg, rgba(251,247,239,0.94) 0%, rgba(238,229,213,0.92) 100%)",
            boxShadow: "0 20px 54px rgba(0,0,0,0.22)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: ".08em",
              color: "var(--nx-learn-muted)",
            }}
          >
            Lernfeld {hoverLf}
          </div>
          <div style={{ marginTop: 8 }}>
            <BossPreview lf={hoverLf} />
          </div>
          <SectorInstabilityBanner visible={Boolean(hoverLf && sectorAnomalies[hoverLf])} />
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: ".06em",
              color: "var(--nx-learn-ink)",
            }}
          >
            {t(`lf.LF${hoverLf}.boss`, hoverEntry.bossDisplayName)}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              lineHeight: 1.5,
              opacity: 0.82,
              color: "var(--nx-learn-muted)",
            }}
          >
            {hoverEntry.lore.slice(0, 160)}
            {hoverEntry.lore.length > 160 ? "…" : ""}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 10,
              letterSpacing: ".14em",
              color: "rgba(132, 92, 42, 0.9)",
            }}
          >
            Wiederholbedarf · {(hoverCorruption * 100).toFixed(0)}%
          </div>
        </motion.div>
      ) : null}

      <VaultOverlay />
      <TechnicalDossier
        open={technicalDossierOpen}
        onClose={() => setTechnicalDossierOpen(false)}
      />
      <LegacyCredits open={legacyCreditsOpen} onClose={() => setLegacyCreditsOpen(false)} />
      <HallOfRecords open={hallRecordsOpen} onClose={() => setHallRecordsOpen(false)} />
      <CoreAugmentations open={coreAugOpen} onClose={() => setCoreAugOpen(false)} />
      <AnimatePresence>
        {codexOpen ? (
          <motion.div
            key="codex-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 70,
              background: "rgba(5,5,7,0.8)",
              padding: "min(5vh, 32px) min(4vw, 28px)",
              overflow: "auto",
            }}
          >
            <div style={{ position: "absolute", top: 18, right: 20 }}>
              <button
                type="button"
                onClick={() => setCodexOpen(false)}
                style={{
                  borderRadius: 8,
                  border: "1px solid rgba(255,214,165,0.55)",
                  background: "rgba(20,16,10,0.72)",
                  color: "var(--nx-bone-90)",
                  letterSpacing: ".12em",
                  fontSize: 11,
                  padding: "8px 12px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                Schließen
              </button>
            </div>
            <CodexIridium />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        data-nx-tutorial="map"
        drag
        dragMomentum={false}
        dragElastic={0.06}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          x: panX,
          y: panY,
          scale: zoom,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          touchAction: "none",
        }}
        whileDrag={{ cursor: "grabbing" }}
      >
        <div
          style={{
            position: "relative",
            width: 900,
            height: 640,
            perspective: 1400,
            perspectiveOrigin: "50% 42%",
            transformStyle: "preserve-3d",
          }}
        >
          <GridLayer
            patternId="nexusGridBack"
            opacity={0.35}
            scale={1.12}
            shiftX={gridShiftX1}
            shiftY={gridShiftY1}
          />
          <GridLayer
            patternId="nexusGridFront"
            opacity={0.55}
            scale={1}
            shiftX={gridShiftX2}
            shiftY={gridShiftY2}
          />
          <ArchitectEchoLayer
            echoPaths={architectEchoPaths}
            nodeLayout={nodeLayout}
            ghostSyncEnabled={ghostSyncDesktop}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
            }}
          >
            {sectorZeroGateOpen ? (
              <>
                <motion.div
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 21,
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    pointerEvents: "none",
                    background: "radial-gradient(circle, rgba(250,204,21,0.95), rgba(250,204,21,0.15))",
                    boxShadow:
                      "0 0 22px rgba(250, 204, 21, 0.75), 0 0 42px rgba(192, 132, 252, 0.35)",
                  }}
                  animate={{
                    scale: [1, 1.35, 1],
                    opacity: [0.85, 1, 0.85],
                  }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEngage(0);
                  }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    marginTop: 40,
                    zIndex: 25,
                    pointerEvents: "auto",
                    cursor: "pointer",
                    borderRadius: 999,
                    border: "1px solid rgba(250, 204, 21, 0.55)",
                    background:
                      "radial-gradient(circle at 30% 30%, rgba(250,204,21,0.22), rgba(24, 10, 40, 0.92))",
                    boxShadow: "0 0 20px rgba(250, 204, 21, 0.35)",
                    color: "rgba(254, 243, 199, 0.98)",
                    fontSize: 10,
                    letterSpacing: ".28em",
                    padding: "10px 16px",
                  }}
                >
                  SEKTOR Ø
                </motion.button>
              </>
            ) : null}
            <motion.button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setCoreAugOpen(true);
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              animate={
                sectorZeroGateOpen
                  ? {
                      boxShadow: [
                        "0 0 32px rgba(34,211,238,0.5), 0 0 28px rgba(250,204,21,0.42), 0 0 24px rgba(192,132,252,0.45), inset 0 0 14px rgba(248,113,113,0.12)",
                        "0 0 36px rgba(192,132,252,0.52), 0 0 30px rgba(248,113,113,0.38), 0 0 26px rgba(34,211,238,0.48), inset 0 0 16px rgba(250,204,21,0.14)",
                        "0 0 32px rgba(34,211,238,0.5), 0 0 28px rgba(250,204,21,0.42), 0 0 24px rgba(192,132,252,0.45), inset 0 0 14px rgba(248,113,113,0.12)",
                      ],
                    }
                  : undefined
              }
              transition={
                sectorZeroGateOpen
                  ? { duration: 3.4, repeat: Infinity, ease: "easeInOut" }
                  : undefined
              }
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                marginTop: sectorZeroGateOpen ? -40 : 0,
                zIndex: 24,
                pointerEvents: "auto",
                cursor: "pointer",
                borderRadius: 999,
                border: sectorZeroGateOpen
                  ? "1px solid rgba(255,255,255,0.22)"
                  : "1px solid color-mix(in srgb, var(--cyan, #22d3ee) 55%, transparent)",
                background: sectorZeroGateOpen
                  ? "linear-gradient(125deg, color-mix(in srgb, var(--cyan, #22d3ee) 38%, transparent) 0%, color-mix(in srgb, var(--gold, #facc15) 32%, transparent) 34%, color-mix(in srgb, var(--violet, #a78bfa) 36%, transparent) 66%, color-mix(in srgb, #f87171 28%, transparent) 100%), radial-gradient(circle at 42% 32%, rgba(6, 14, 28, 0.72) 0%, rgba(8, 6, 22, 0.94) 72%)"
                  : "radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--cyan, #22d3ee) 35%, transparent), rgba(6, 18, 32, 0.92))",
                boxShadow: sectorZeroGateOpen
                  ? "0 0 32px rgba(34,211,238,0.45), 0 0 24px rgba(250,204,21,0.35)"
                  : "0 0 28px color-mix(in srgb, var(--cyan, #22d3ee) 35%, transparent), inset 0 0 12px rgba(167, 139, 250, 0.15)",
                color: "rgba(224, 250, 255, 0.96)",
                fontSize: 10,
                letterSpacing: ".22em",
                padding: "14px 20px",
              }}
            >
              CORE
            </motion.button>
            {nodeLayout.map(({ lf, offsetX, offsetY, parallaxZ }) => {
              const entry = getNexusEntryForLF(`LF${lf}` as LearningField);
              const lfKey = `LF${lf}` as LearningField;
              const stab = stabilities[lf] ?? 0;
              const tier = stabilityTier(stab);
              const unlocked = campaign.unlockedSectors.includes(lf);
              const last = lastReportForLf(history, lf);
              const isDaily = lf === dailyDef.targetLf;
              const displayAnomaly = dailyDef.anomalies[lf] ?? sectorAnomalies[lf] ?? null;
              const endlessOpts =
                !isDaily && endlessDeepDiveOptIn ? { endlessDeepDive: true } : null;
              const learn = learningByLfNum[lf] ?? { ratio: 0, mastered: false };
              return (
                <SectorNode
                  key={lf}
                  lf={lf}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  parallaxZ={parallaxZ}
                  bossName={t(`lf.${lfKey}.boss`, entry.bossDisplayName)}
                  unlocked={unlocked}
                  stability={stab}
                  tier={tier}
                  lastRank={last?.combatRank ?? null}
                  prestigeColor={prestige}
                  onHoverChange={onHoverChange}
                  onEngage={onEngage}
                  anomalyType={displayAnomaly}
                  engageOptions={isDaily ? dailyEngageOptions : endlessOpts}
                  isDailyIncursion={isDaily}
                  dailyRankedSlotOpen={isDaily && dailyRankedClearDateUtc !== dateKey}
                  learningProgressRatio={learn.ratio}
                  lfCurriculumMastered={learn.mastered}
                  layoutBridgeLf={layoutBridgeLf}
                  seamlessEngage={seamlessEngage}
                  tierLabels={tierLabels}
                  bossVideoSrc={entry.bossVisual.primaryPath}
                  bossThumbnailUrls={getBossThumbnailCandidates(lfKey)}
                  skillScanRing={skillScanRingForLf(lf)}
                  sectorMastered={Boolean(campaign.masteryChecks[lfKey])}
                />
              );
            })}
          </div>
        </div>
      </motion.div>

      <div
        data-nx-coach-dock
        style={
          coachDockCompact
            ? {
                position: "fixed",
                left: 10,
                right: 10,
                bottom: "max(88px, calc(env(safe-area-inset-bottom, 0px) + 72px))",
                top: "auto",
                zIndex: 28,
                maxHeight: "min(36dvh, 340px)",
                overflowY: "auto",
                overflowX: "hidden",
                display: "flex",
                justifyContent: "center",
                paddingBottom: 4,
                pointerEvents: "none",
              }
            : {
                position: "fixed",
                top: "clamp(104px, 11.5dvh, 152px)",
                right: "max(12px, env(safe-area-inset-right))",
                bottom: "auto",
                left: "auto",
                zIndex: 28,
                width: "min(392px, calc(100vw - 20px))",
                maxHeight: "min(50dvh, 432px)",
                overflowY: "auto",
                overflowX: "hidden",
                pointerEvents: "none",
              }
        }
      >
        <div
          style={{
            pointerEvents: "auto",
            width: "100%",
            display: "flex",
            justifyContent: coachDockCompact ? "center" : "flex-end",
          }}
        >
          <SkillRadar epilogueActive={epilogueActive} />
        </div>
      </div>
    </div>
  );
}

function ArchitectEchoLayer({
  echoPaths,
  nodeLayout,
  ghostSyncEnabled,
}: {
  echoPaths: ArchitectEchoPath[];
  nodeLayout: Array<{ lf: number; offsetX: number; offsetY: number; parallaxZ: number }>;
  ghostSyncEnabled: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const cx = 450;
  const cy = 320;
  const toXY = (lf: number) => {
    const row = nodeLayout.find((n) => n.lf === lf);
    return { x: cx + (row?.offsetX ?? 0), y: cy + (row?.offsetY ?? 0) };
  };
  const crossings = useMemo(() => {
    if (!ghostSyncEnabled || echoPaths.length < 2) return [];
    return findEchoPathCrossings(echoPaths, toXY);
  }, [echoPaths, ghostSyncEnabled, nodeLayout]);

  const filterId = `architectEchoGlow-${uid}`;
  return (
    <svg
      width={900}
      height={640}
      viewBox="0 0 900 640"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        pointerEvents: "none",
        zIndex: 7,
        overflow: "visible",
      }}
    >
      <defs>
        <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {echoPaths.map((p) => {
        const pts = p.chain.map(toXY);
        const d = pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");
        const stroke = p.isGhostUpload ? "rgba(244, 232, 255, 0.92)" : DAILY_PURPLE_NEON;
        return (
          <motion.path
            key={p.id}
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth={p.isGhostUpload ? 1.35 : 1.1}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={p.strokeOpacity}
            filter={`url(#${filterId})`}
            strokeDasharray="5 12"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -68 }}
            transition={{
              duration: Math.max(2.8, p.durationSec / 4.2),
              repeat: Infinity,
              ease: "linear",
              delay: p.phase * 2.8,
            }}
          />
        );
      })}
      {ghostSyncEnabled
        ? crossings.map((c, i) => (
            <motion.circle
              key={`cross-${i}-${Math.round(c.x)}-${Math.round(c.y)}`}
              cx={c.x}
              cy={c.y}
              r={5}
              fill="none"
              stroke={DAILY_PURPLE_NEON}
              strokeWidth={1.2}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{
                opacity: [0, 0.95, 0.35, 0.9, 0],
                scale: [0.4, 1.35, 0.85, 1.1, 0.5],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.31,
              }}
            />
          ))
        : null}
    </svg>
  );
}

function VaultOverlay() {
  const overlayOpenState = useGameStore((s) => s.overlayOpenState);
  const setOverlayOpenState = useGameStore((s) => s.setOverlayOpenState);
  const visible = overlayOpenState !== "NONE";
  return (
    <ArtifactGallery
      visible={visible}
      onClose={() => setOverlayOpenState("NONE")}
    />
  );
}
