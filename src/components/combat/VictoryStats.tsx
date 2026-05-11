import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RANK_COLORS } from "../../data/nexusPresets";
import { useBossAudioEngine } from "../../lib/audio/bossAudioEngine";
import { DAILY_PURPLE_NEON } from "../../lib/dailyIncursion";
import { getMentorDeepDive } from "../../lib/learning/terminalContent";
import { computeArchitectPersona } from "../../lib/math/statCalculations";
import { typography } from "../../theme/typography";
import { useGameStore } from "../../store/useGameStore";
import { NexusReturn } from "../navigation/NexusReturn";
import {
  downloadMasterCertNxc,
  downloadMasterCertPdfDossier,
  openCertVerifyHash,
} from "../../lib/security/certExporter";

type VictoryStatsProps = {
  elapsedSec: number;
  totalDamage: number;
  missedSkills: number;
  accuracyRate: number;
  timeGrade: "S" | "A" | "B" | "C";
  rank: "S" | "A" | "B" | "C";
  victoryQuote: string;
  onRankReveal?: () => void;
  onContinue?: () => void;
  /** Zentrierung über Eltern (z. B. VictoryScreen) statt Viewport */
  embeddedInVictoryScreen?: boolean;
};

const parentVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.12,
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 28 },
  },
};

/** Data_Ascension: keine Satzzeichen in ausgespielten Stat-Zeilen */
function ascensionStripPunct(s: string): string {
  return s
    .replace(/\s*·\s*/g, " ")
    .replace(/\s*\/\s*/g, " ")
    .replace(/[.,;:!?…]/g, " ")
    .replace(/[—–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ascensionParentVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.28,
    },
  },
};

const ascensionChildVariants = {
  hidden: {
    opacity: 0,
    y: 42,
    scale: 0.88,
    rotateZ: -2.4,
    filter: "blur(28px)",
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateZ: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 200, damping: 24 },
  },
};

const formatTime = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
};

const ARCHITECT_BY_RANK: Record<
  VictoryStatsProps["rank"],
  { place: string; stratum: string; distribution: string }
> = {
  S: { place: "1", stratum: "APEX-Σ", distribution: "Oberes 0,7 %" },
  A: { place: "2", stratum: "HIGH-Λ", distribution: "Oberes 12 %" },
  B: { place: "3", stratum: "MID-Κ", distribution: "Mittelfeld 38 %" },
  C: { place: "4", stratum: "BASE-Ω", distribution: "Breitenbasis 62 %" },
};

function TypewriterValue({
  text,
  startDelayMs,
  charMs = 26,
}: {
  text: string;
  startDelayMs: number;
  charMs?: number;
}) {
  const [n, setN] = useState(0);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setArmed(true), startDelayMs);
    return () => window.clearTimeout(id);
  }, [startDelayMs]);

  useEffect(() => {
    if (!armed || n >= text.length) return;
    const id = window.setTimeout(() => setN((c) => c + 1), charMs);
    return () => window.clearTimeout(id);
  }, [armed, n, text.length, charMs]);

  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>{text.slice(0, n)}</span>
  );
}

const rowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 12,
  alignItems: "baseline",
  fontFamily:
    '"JetBrains Mono","Inter",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
  fontSize: 12,
  color: "rgba(207, 242, 255, 0.96)",
  borderBottom: "1px solid rgba(34,211,238,0.18)",
  paddingBottom: 10,
};

const ascensionRowStyle: CSSProperties = {
  ...rowStyle,
  color: "rgba(247, 244, 236, 0.94)",
  borderBottom: "1px solid rgba(212, 175, 55, 0.32)",
};

export function VictoryStats({
  elapsedSec,
  totalDamage,
  missedSkills,
  accuracyRate,
  timeGrade,
  rank,
  victoryQuote,
  onRankReveal,
  onContinue,
  embeddedInVictoryScreen = false,
}: VictoryStatsProps) {
  const accuracyPercent = Math.round(Math.max(0, Math.min(1, accuracyRate)) * 100);
  const rankStyle = RANK_COLORS[rank];
  const activeLF = useGameStore((state) => state.activeLF);
  const combatShieldDamageAbsorbedTotal = useGameStore(
    (state) => state.combatShieldDamageAbsorbedTotal
  );
  const combatBossRawDamageAttempted = useGameStore(
    (state) => state.combatBossRawDamageAttempted
  );
  const combatComboCount = useGameStore((state) => state.combatComboCount);
  const synapticFlow = useGameStore((state) => state.synapticFlow);
  const appendCombatArchitectReportIfNew = useGameStore(
    (state) => state.appendCombatArchitectReportIfNew
  );
  const {
    playRankSound,
    playDossierTeletypeTick,
    stopDossierTeletypeTick,
    playArchiveSealKlunk,
    playArchitectPersonaReveal,
  } = useBossAudioEngine();
  const rankSoundPlayedForVictory = useGameStore((state) => state.rankSoundPlayedForVictory);
  const markRankSoundPlayed = useGameStore((state) => state.markRankSoundPlayed);
  const hardcoreDriftEnabled = useGameStore((state) => state.hardcoreDriftEnabled);
  const lastCombatLearningEvents = useGameStore((state) => state.lastCombatLearningEvents);
  const activeCombatIsSectorZero = useGameStore((state) => state.activeCombatIsSectorZero);
  const nexusMasterCertificateSealed = useGameStore((state) => state.nexusMasterCertificateSealed);
  const didTriggerRef = useRef(false);
  const personaSoundDoneRef = useRef(false);
  const sealImpactDoneRef = useRef(false);
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;

  const [dematerialize, setDematerialize] = useState(false);
  const [sealArmed, setSealArmed] = useState(false);
  const [redGlitch, setRedGlitch] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [wissenOpen, setWissenOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const architect = ARCHITECT_BY_RANK[rank];
  const docIdRef = useRef("");
  if (!docIdRef.current) {
    docIdRef.current = `NXI-${String(activeLF).padStart(2, "0")}-${Date.now()
      .toString(36)
      .slice(-6)
      .toUpperCase()}`;
  }
  const docId = docIdRef.current;

  const precisionLine = useMemo(
    () =>
      `${accuracyPercent}% Treffer · ${missedSkills} Fehlzyklen · Zeitnote ${timeGrade}`,
    [accuracyPercent, missedSkills, timeGrade]
  );

  const architectLine = useMemo(
    () =>
      `Platz ${architect.place} · ${architect.stratum} · ${architect.distribution} · Sektor LF${activeLF}`,
    [architect, activeLF]
  );

  const shieldMitigationLine = useMemo(() => {
    const raw = combatBossRawDamageAttempted;
    const abs = combatShieldDamageAbsorbedTotal;
    if (raw <= 0) {
      return "Kein Boss-Rohschaden — 0 % Shield Mitigation Efficiency";
    }
    const pct = Math.max(0, Math.min(100, Math.round((abs / raw) * 100)));
    return `${pct} % Efficiency · ${abs} absorbiert / ${raw} Roh`;
  }, [combatBossRawDamageAttempted, combatShieldDamageAbsorbedTotal]);

  const shieldEfficiencyPct = useMemo(() => {
    const raw = combatBossRawDamageAttempted;
    const abs = combatShieldDamageAbsorbedTotal;
    if (raw <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((abs / raw) * 100)));
  }, [combatBossRawDamageAttempted, combatShieldDamageAbsorbedTotal]);

  const architectPersona = useMemo(
    () =>
      computeArchitectPersona({
        shieldMitigationEfficiencyPct: shieldEfficiencyPct,
        combatComboCount,
        synapticFlow,
        missedSkills,
        accuracyRate,
        elapsedSec,
        combatRank: rank,
      }),
    [
      shieldEfficiencyPct,
      combatComboCount,
      synapticFlow,
      missedSkills,
      accuracyRate,
      elapsedSec,
      rank,
    ]
  );

  const personaLine = useMemo(
    () => `${architectPersona.title} · ${architectPersona.flavor}`,
    [architectPersona]
  );

  const baseTw = 280;
  const ascension = embeddedInVictoryScreen;
  const displayPrecision = useMemo(
    () => (ascension ? ascensionStripPunct(precisionLine) : precisionLine),
    [ascension, precisionLine]
  );
  const displayArchitect = useMemo(
    () => (ascension ? ascensionStripPunct(architectLine) : architectLine),
    [ascension, architectLine]
  );
  const displayShield = useMemo(
    () => (ascension ? ascensionStripPunct(shieldMitigationLine) : shieldMitigationLine),
    [ascension, shieldMitigationLine]
  );
  const displayPersona = useMemo(
    () => (ascension ? ascensionStripPunct(personaLine) : personaLine),
    [ascension, personaLine]
  );
  const displayDoc = useMemo(
    () =>
      ascension
        ? ascensionStripPunct(`Klassifiziert · ${docId}`)
        : `Klassifiziert · ${docId}`,
    [ascension, docId]
  );
  const displayQuote = useMemo(
    () => (ascension ? ascensionStripPunct(victoryQuote) : victoryQuote),
    [ascension, victoryQuote]
  );
  const statsParentVariants = ascension ? ascensionParentVariants : parentVariants;
  const statsChildVariants = ascension ? ascensionChildVariants : childVariants;
  const effectiveRowStyle = ascension ? ascensionRowStyle : rowStyle;

  const rankRevealDelayMs = useMemo(
    () => Math.round(120 + 7 * 140 + 320),
    []
  );

  const sealDelayMs = useMemo(
    () => 2600 + Math.min(displayQuote.length * 16, 2200),
    [displayQuote]
  );

  useEffect(() => {
    const t = window.setTimeout(() => setSealArmed(true), sealDelayMs);
    return () => window.clearTimeout(t);
  }, [sealDelayMs]);

  const handleSealSettled = useCallback(() => {
    if (sealImpactDoneRef.current) return;
    sealImpactDoneRef.current = true;
    void playArchiveSealKlunk();
    appendCombatArchitectReportIfNew();
    setRedGlitch(true);
    setShaking(true);
    window.setTimeout(() => setRedGlitch(false), 90);
  }, [appendCombatArchitectReportIfNew, playArchiveSealKlunk]);

  const handleDematerialized = useCallback(() => {
    onContinueRef.current?.();
  }, []);

  useEffect(() => {
    void playDossierTeletypeTick();
    const cap = window.setTimeout(() => {
      stopDossierTeletypeTick();
    }, 3400);
    return () => {
      window.clearTimeout(cap);
      stopDossierTeletypeTick();
    };
  }, [playDossierTeletypeTick, stopDossierTeletypeTick]);

  useEffect(() => {
    const personaRevealMs = baseTw + 430;
    const id = window.setTimeout(() => {
      if (personaSoundDoneRef.current) return;
      personaSoundDoneRef.current = true;
      void playArchitectPersonaReveal();
    }, personaRevealMs);
    return () => window.clearTimeout(id);
  }, [baseTw, playArchitectPersonaReveal]);

  useEffect(() => {
    if (didTriggerRef.current || rankSoundPlayedForVictory) return;

    const revealTimer = window.setTimeout(() => {
      didTriggerRef.current = true;
      onRankReveal?.();
      markRankSoundPlayed();
      window.setTimeout(() => {
        void playRankSound(rank);
      }, 100);
    }, rankRevealDelayMs);

    return () => {
      window.clearTimeout(revealTimer);
    };
  }, [markRankSoundPlayed, onRankReveal, playRankSound, rank, rankRevealDelayMs, rankSoundPlayedForVictory]);

  const hasLearningReview = lastCombatLearningEvents.length > 0;
  const showMasterCertDownload =
    activeCombatIsSectorZero && activeLF === 0 && Boolean(nexusMasterCertificateSealed);

  const downloadMasterCertBinary = useCallback(() => {
    const raw = useGameStore.getState().nexusMasterCertificateSealed;
    if (!raw) return;
    downloadMasterCertNxc(raw);
  }, []);

  const downloadMasterCertPdf = useCallback(async () => {
    const raw = useGameStore.getState().nexusMasterCertificateSealed;
    if (!raw || pdfBusy) return;
    setPdfBusy(true);
    try {
      await downloadMasterCertPdfDossier(raw);
    } finally {
      setPdfBusy(false);
    }
  }, [pdfBusy]);

  return (
    <>
      <AnimatePresence>
        {wissenOpen ? (
          <motion.div
            key="wissen-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Wissens-Analyse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 120000,
              background: "rgba(2,6,12,0.72)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 16px",
            }}
            onClick={() => setWissenOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(640px, calc(100vw - 32px))",
                maxHeight: "min(78vh, 720px)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.35)",
                background: "rgba(9,14,22,0.96)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
              }}
            >
              <div
                style={{
                  padding: "16px 18px 12px",
                  borderBottom: "1px solid rgba(51,65,85,0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: typography.fontSans,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    fontSize: 15,
                    color: typography.fg,
                  }}
                >
                  Wissens-Analyse
                </div>
                <button
                  type="button"
                  onClick={() => setWissenOpen(false)}
                  style={{
                    fontFamily: typography.fontSans,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    borderRadius: 8,
                    border: "1px solid rgba(148,163,184,0.4)",
                    background: "rgba(15,23,42,0.85)",
                    color: typography.fgMuted,
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  Schließen
                </button>
              </div>
              <div
                style={{
                  padding: "14px 18px 20px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {lastCombatLearningEvents.map((ev, idx) => (
                  <div
                    key={`${ev.exerciseId}-${idx}`}
                    style={{
                      paddingBottom: 16,
                      borderBottom:
                        idx < lastCombatLearningEvents.length - 1
                          ? "1px solid rgba(51,65,85,0.4)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: typography.fontSans,
                        fontSize: 13,
                        fontWeight: 700,
                        color: ev.wasCorrect ? "rgba(167,243,208,0.98)" : "rgba(252,165,165,0.95)",
                        marginBottom: 6,
                      }}
                    >
                      {ev.wasCorrect ? "Treffer" : "Fehlzündung"} · {ev.title}
                    </div>
                    <div
                      style={{
                        fontFamily: typography.fontSans,
                        fontSize: typography.bodySize,
                        lineHeight: typography.bodyLineHeight,
                        color: typography.fgMuted,
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontWeight: 650, color: typography.fg }}>Frage: </span>
                      {ev.mcQuestion}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: typography.fontSans,
                        fontSize: typography.bodySize,
                        lineHeight: 1.6,
                        color: typography.fg,
                      }}
                    >
                      {getMentorDeepDive(ev.exerciseId, ev.title, ev.problem)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {redGlitch ? (
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            pointerEvents: "none",
            background: "rgba(255, 0, 48, 0.26)",
            mixBlendMode: "screen",
          }}
        />
      ) : null}
      <motion.div
        {...(!embeddedInVictoryScreen
          ? {
              initial: { opacity: 0, scale: 0.94 },
              animate: { opacity: 1, scale: 1 },
              transition: { type: "spring" as const, stiffness: 200, damping: 26 },
            }
          : {})}
        style={{
          position: embeddedInVictoryScreen ? "relative" : "absolute",
          left: embeddedInVictoryScreen ? "auto" : "50%",
          top: embeddedInVictoryScreen ? "auto" : "52%",
          transform: embeddedInVictoryScreen ? "none" : "translate(-50%, -50%)",
          width: embeddedInVictoryScreen
            ? "100%"
            : "min(520px, calc(100vw - 96px))",
          zIndex: embeddedInVictoryScreen ? 1 : 60,
          perspective: 1200,
        }}
      >
        <motion.div
          animate={
            shaking
              ? {
                  x: [0, -13, 12, -8, 7, -4, 0],
                  y: [0, 9, -7, 5, -3, 0],
                }
              : { x: 0, y: 0 }
          }
          transition={{ duration: 0.34, ease: "easeOut" }}
          onAnimationComplete={() => {
            if (shaking) setShaking(false);
          }}
          style={{ position: "relative" }}
        >
        <NexusReturn dematerialize={dematerialize} onDematerialized={handleDematerialized}>
          <div
            style={{
              position: "relative",
              borderRadius: 4,
              padding: "28px 26px 26px 32px",
              border: hardcoreDriftEnabled
                ? "1px solid rgba(255,55,48,0.55)"
                : embeddedInVictoryScreen
                  ? ascension
                    ? "1px solid rgba(212,175,55,0.42)"
                    : "1px solid rgba(255,253,245,0.35)"
                  : "1px solid rgba(34,211,238,0.28)",
              background: hardcoreDriftEnabled
                ? "linear-gradient(175deg, rgba(28,6,8,0.94) 0%, rgba(12,4,6,0.97) 45%, rgba(22,8,10,0.95) 100%)"
                : embeddedInVictoryScreen
                  ? ascension
                    ? "linear-gradient(175deg, rgba(16,14,12,0.88) 0%, rgba(10,12,18,0.91) 48%, rgba(14,16,22,0.86) 100%)"
                    : "linear-gradient(175deg, rgba(8,14,22,0.82) 0%, rgba(6,10,18,0.9) 48%, rgba(12,18,28,0.84) 100%)"
                  : "linear-gradient(175deg, rgba(6,16,22,0.94) 0%, rgba(4,12,18,0.97) 45%, rgba(8,20,28,0.95) 100%)",
              boxShadow: hardcoreDriftEnabled
                ? "inset 0 0 0 1px rgba(255,80,72,0.12), 0 22px 48px rgba(0,0,0,0.55), 0 0 48px rgba(255,55,48,0.28)"
                : embeddedInVictoryScreen
                  ? ascension
                    ? "inset 0 0 0 1px rgba(247,244,236,0.12), 0 28px 72px rgba(0,0,0,0.55), 0 0 88px rgba(212,175,55,0.22), 0 0 48px rgba(247,244,236,0.08)"
                    : "inset 0 0 0 1px rgba(255,255,255,0.1), 0 28px 72px rgba(0,0,0,0.55), 0 0 72px rgba(250,204,21,0.18), 0 0 48px rgba(34,211,238,0.1)"
                  : "inset 0 0 0 1px rgba(255,255,255,0.04), 0 22px 48px rgba(0,0,0,0.55), 0 0 40px rgba(0,255,255,0.12)",
              backdropFilter: embeddedInVictoryScreen
                ? ascension
                  ? "blur(22px) saturate(178%)"
                  : "blur(16px) saturate(150%)"
                : undefined,
              WebkitBackdropFilter: embeddedInVictoryScreen
                ? ascension
                  ? "blur(22px) saturate(178%)"
                  : "blur(16px) saturate(150%)"
                : undefined,
              overflow: "hidden",
            }}
          >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            background: hardcoreDriftEnabled
              ? "linear-gradient(180deg, rgba(255,72,60,0.95), rgba(120,20,18,0.45))"
              : ascension
                ? "linear-gradient(180deg, rgba(212,175,55,0.95), rgba(247,244,236,0.35))"
                : "linear-gradient(180deg, rgba(34,211,238,0.85), rgba(6,182,212,0.35))",
            opacity: 0.9,
            pointerEvents: "none",
          }}
        />
        {hardcoreDriftEnabled ? (
          <>
            <motion.div
              aria-hidden
              animate={{ x: [0, -3, 2, -1, 0], opacity: [0.12, 0.22, 0.14, 0.2, 0.12] }}
              transition={{ duration: 0.28, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                mixBlendMode: "screen",
                background:
                  "repeating-linear-gradient(90deg, rgba(255,0,60,0.06) 0px, transparent 2px, rgba(0,255,255,0.05) 4px, transparent 6px)",
              }}
            />
            <motion.div
              aria-hidden
              animate={{ y: [0, 1, -1, 0] }}
              transition={{ duration: 0.08, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,55,48,0.09) 3px, rgba(255,55,48,0.09) 4px)",
                mixBlendMode: "overlay",
              }}
            />
          </>
        ) : null}
        <motion.div
          aria-hidden="true"
          animate={{ opacity: [0.06, 0.14, 0.07, 0.12, 0.06] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: ascension
              ? "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212,175,55,0.09) 2px, rgba(212,175,55,0.09) 3px)"
              : "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,211,238,0.07) 2px, rgba(34,211,238,0.07) 3px)",
            mixBlendMode: "screen",
          }}
        />
        <motion.div
          aria-hidden="true"
          animate={{ y: ["-5%", "105%"] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "28%",
            pointerEvents: "none",
            background: ascension
              ? "linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.06) 40%, transparent 100%)"
              : "linear-gradient(180deg, transparent 0%, rgba(0,255,255,0.04) 40%, transparent 100%)",
          }}
        />

        <motion.div
          variants={statsParentVariants}
          initial="hidden"
          animate="show"
          style={{ position: "relative", zIndex: 1 }}
        >
          <motion.div
            variants={statsChildVariants}
            style={{
              fontFamily:
                '"JetBrains Mono","Inter",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
              fontSize: 10,
              letterSpacing: ".34em",
              textTransform: "uppercase",
              color: hardcoreDriftEnabled
                ? "rgba(255, 120, 110, 0.95)"
                : ascension
                  ? "rgba(212, 175, 55, 0.94)"
                  : "rgba(103, 232, 249, 0.88)",
              marginBottom: 6,
            }}
          >
            {hardcoreDriftEnabled
              ? "Nexus Intelligence · HARDCORE DRIFT"
              : ascension
                ? "ASCENSION DATA CORE"
                : "Nexus Intelligence Report"}
          </motion.div>
          <motion.div
            variants={statsChildVariants}
            style={{
              fontFamily:
                '"JetBrains Mono","Inter",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
              fontSize: 11,
              letterSpacing: ".08em",
              color: ascension ? "rgba(247, 244, 236, 0.72)" : "rgba(148, 208, 232, 0.72)",
              marginBottom: 18,
            }}
          >
            <TypewriterValue text={displayDoc} startDelayMs={180} charMs={22} />
          </motion.div>

          <motion.div variants={statsChildVariants} style={effectiveRowStyle}>
            <span
              style={{
                letterSpacing: ".16em",
                textTransform: "uppercase",
                opacity: 0.82,
                fontSize: 11,
              }}
            >
              Einsatzzeit
            </span>
            <TypewriterValue
              text={formatTime(elapsedSec)}
              startDelayMs={baseTw + 40}
              charMs={24}
            />
          </motion.div>
          <motion.div variants={statsChildVariants} style={effectiveRowStyle}>
            <span
              style={{
                letterSpacing: ".16em",
                textTransform: "uppercase",
                opacity: 0.82,
                fontSize: 11,
              }}
            >
              Präzisionsprofil
            </span>
            <TypewriterValue text={displayPrecision} startDelayMs={baseTw + 120} charMs={24} />
          </motion.div>
          <motion.div variants={statsChildVariants} style={effectiveRowStyle}>
            <span
              style={{
                letterSpacing: ".16em",
                textTransform: "uppercase",
                opacity: 0.82,
                fontSize: 11,
              }}
            >
              Schadensintegral
            </span>
            <TypewriterValue
              text={`${totalDamage} Nexus-Einheiten`}
              startDelayMs={baseTw + 200}
              charMs={24}
            />
          </motion.div>
          <motion.div variants={statsChildVariants} style={effectiveRowStyle}>
            <span
              style={{
                letterSpacing: ".16em",
                textTransform: "uppercase",
                opacity: 0.82,
                fontSize: 11,
              }}
            >
              Shield Mitigation Efficiency
            </span>
            <TypewriterValue
              text={displayShield}
              startDelayMs={baseTw + 280}
              charMs={22}
            />
          </motion.div>
          <motion.div variants={statsChildVariants} style={effectiveRowStyle}>
            <span
              style={{
                letterSpacing: ".16em",
                textTransform: "uppercase",
                opacity: 0.82,
                fontSize: 11,
              }}
            >
              Global Architect Ranking
            </span>
            <TypewriterValue text={displayArchitect} startDelayMs={baseTw + 360} charMs={22} />
          </motion.div>

          <motion.div
            variants={statsChildVariants}
            style={{
              ...effectiveRowStyle,
              borderBottom: ascension
                ? `1px solid rgba(212,175,55,0.38)`
                : `1px solid rgba(192,132,252,0.28)`,
            }}
          >
            <span
              style={{
                letterSpacing: ".16em",
                textTransform: "uppercase",
                opacity: 0.88,
                fontSize: 11,
                color: ascension ? "rgba(212, 175, 55, 0.95)" : DAILY_PURPLE_NEON,
              }}
            >
              Architect Persona
            </span>
            <TypewriterValue text={displayPersona} startDelayMs={baseTw + 440} charMs={20} />
          </motion.div>

          <motion.div variants={statsChildVariants} style={{ marginTop: 4 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "center",
                paddingBottom: 10,
                borderBottom: ascension
                  ? "1px solid rgba(212,175,55,0.28)"
                  : "1px solid rgba(34,211,238,0.22)",
              }}
            >
              <span
                style={{
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  opacity: 0.82,
                  fontFamily:
                    '"JetBrains Mono","Inter",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
                  fontSize: 11,
                  color: ascension ? "rgba(247, 244, 236, 0.94)" : "rgba(207, 242, 255, 0.96)",
                }}
              >
                Combat Rank
              </span>
              <motion.span
                animate={
                  rank === "S"
                    ? { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }
                    : {}
                }
                transition={
                  rank === "S"
                    ? { duration: 1.4, repeat: Infinity, ease: "linear" }
                    : {}
                }
                style={{
                  fontFamily:
                    '"JetBrains Mono","Inter",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
                  fontSize: 34,
                  lineHeight: 1,
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  color: rankStyle.gradient ? "transparent" : rankStyle.textColor,
                  textShadow: rankStyle.textShadow,
                  backgroundImage: rankStyle.gradient,
                  backgroundSize: rank === "S" ? "220% 220%" : "100% 100%",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: rankStyle.gradient ? "transparent" : rankStyle.textColor,
                  willChange: rank === "S" ? "background-position" : "auto",
                }}
              >
                <TypewriterValue text={rank} startDelayMs={baseTw + 520} charMs={64} />
              </motion.span>
            </div>
          </motion.div>

          <motion.div variants={statsChildVariants} style={{ marginTop: 14 }}>
            <div
              style={{
                fontFamily:
                  '"JetBrains Mono","Inter",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
                fontSize: 11,
                lineHeight: 1.55,
                color: ascension ? "rgba(247, 244, 236, 0.78)" : "rgba(186, 230, 253, 0.78)",
                fontStyle: "italic",
              }}
            >
              <TypewriterValue text={displayQuote} startDelayMs={baseTw + 680} charMs={20} />
            </div>
          </motion.div>

          {hasLearningReview ? (
            <motion.button
              variants={statsChildVariants}
              type="button"
              disabled={dematerialize}
              onClick={() => {
                if (dematerialize) return;
                setWissenOpen(true);
              }}
              whileHover={dematerialize ? undefined : { scale: 1.02 }}
              whileTap={dematerialize ? undefined : { scale: 0.98 }}
              style={{
                marginTop: 22,
                width: "100%",
                borderRadius: 6,
                border: "1px solid color-mix(in srgb, var(--gold, #facc15) 50%, transparent)",
                background: "rgba(32, 26, 8, 0.88)",
                color: "rgba(254, 243, 199, 0.98)",
                fontSize: 12,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                padding: "12px 14px",
                cursor: dematerialize ? "default" : "pointer",
                opacity: dematerialize ? 0.65 : 1,
                fontFamily: typography.fontSans,
              }}
            >
              Wissens-Analyse
            </motion.button>
          ) : null}
          {showMasterCertDownload ? (
            <>
              <motion.button
                variants={statsChildVariants}
                type="button"
                disabled={dematerialize}
                onClick={() => {
                  if (dematerialize) return;
                  downloadMasterCertBinary();
                }}
                whileHover={dematerialize ? undefined : { scale: 1.02 }}
                whileTap={dematerialize ? undefined : { scale: 0.98 }}
                style={{
                  marginTop: hasLearningReview ? 12 : 22,
                  width: "100%",
                  borderRadius: 6,
                  border: "1px solid rgba(192,132,252,0.55)",
                  background: "rgba(28, 12, 48, 0.88)",
                  color: DAILY_PURPLE_NEON,
                  fontSize: 11,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  padding: "12px 14px",
                  cursor: dematerialize ? "default" : "pointer",
                  opacity: dematerialize ? 0.65 : 1,
                  fontFamily: typography.fontSans,
                }}
              >
                Nexus Master Dossier (.nxc)
              </motion.button>
              <motion.button
                variants={statsChildVariants}
                type="button"
                disabled={dematerialize || pdfBusy}
                onClick={() => {
                  if (dematerialize || pdfBusy) return;
                  void downloadMasterCertPdf();
                }}
                whileHover={dematerialize || pdfBusy ? undefined : { scale: 1.02 }}
                whileTap={dematerialize || pdfBusy ? undefined : { scale: 0.98 }}
                style={{
                  marginTop: 10,
                  width: "100%",
                  borderRadius: 6,
                  border: "1px solid rgba(250, 204, 21, 0.45)",
                  background: "rgba(40, 32, 8, 0.88)",
                  color: "rgba(254, 243, 199, 0.98)",
                  fontSize: 11,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  padding: "12px 14px",
                  cursor: dematerialize || pdfBusy ? "default" : "pointer",
                  opacity: dematerialize ? 0.65 : 1,
                  fontFamily: typography.fontSans,
                }}
              >
                {pdfBusy ? "PDF wird erzeugt…" : "PDF-Dossier exportieren"}
              </motion.button>
              <motion.button
                variants={statsChildVariants}
                type="button"
                disabled={dematerialize}
                onClick={() => {
                  if (dematerialize) return;
                  openCertVerifyHash();
                }}
                whileHover={dematerialize ? undefined : { scale: 1.02 }}
                whileTap={dematerialize ? undefined : { scale: 0.98 }}
                style={{
                  marginTop: 10,
                  width: "100%",
                  borderRadius: 6,
                  border: "1px solid rgba(34,211,238,0.45)",
                  background: "rgba(6, 22, 32, 0.88)",
                  color: "rgba(186, 230, 253, 0.96)",
                  fontSize: 10,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  padding: "10px 12px",
                  cursor: dematerialize ? "default" : "pointer",
                  opacity: dematerialize ? 0.65 : 1,
                  fontFamily: typography.fontSans,
                }}
              >
                Verify-Check (Ausbilder)
              </motion.button>
            </>
          ) : null}
          <motion.button
            variants={statsChildVariants}
            type="button"
            disabled={dematerialize}
            onClick={() => {
              if (dematerialize) return;
              appendCombatArchitectReportIfNew();
              setDematerialize(true);
            }}
            whileHover={dematerialize ? undefined : { scale: 1.02 }}
            whileTap={dematerialize ? undefined : { scale: 0.98 }}
            style={{
              marginTop:
                hasLearningReview || showMasterCertDownload ? 12 : 22,
              width: "100%",
              borderRadius: 6,
              border: "1px solid rgba(34,211,238,0.55)",
              background: "rgba(6, 22, 32, 0.92)",
              color: "rgba(186, 230, 253, 0.98)",
              fontSize: 12,
              letterSpacing: ".22em",
              textTransform: "uppercase",
              padding: "12px 14px",
              cursor: dematerialize ? "default" : "pointer",
              opacity: dematerialize ? 0.65 : 1,
              fontFamily:
                '"JetBrains Mono","Inter",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
            }}
          >
            Continue
          </motion.button>
        </motion.div>

        {sealArmed ? (
          <motion.div
            aria-hidden
            initial={{ x: 200, y: -220, rotate: -42, scale: 1.55, opacity: 0 }}
            animate={{ x: 0, y: 0, rotate: -14, scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 22,
              mass: 0.82,
            }}
            onAnimationComplete={handleSealSettled}
            style={{
              position: "absolute",
              right: "-2%",
              bottom: "6%",
              width: 148,
              height: 148,
              borderRadius: "50%",
              border: "3px solid rgba(94, 234, 255, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mixBlendMode: "screen",
              pointerEvents: "none",
              zIndex: 30,
              boxShadow:
                "0 0 52px rgba(0,255,255,0.55), inset 0 0 38px rgba(103,232,249,0.35), 0 0 0 2px rgba(255,255,255,0.08)",
              background:
                "radial-gradient(circle at 35% 30%, rgba(103,232,249,0.35) 0%, rgba(6,20,32,0.2) 55%, transparent 70%)",
            }}
          >
            <span
              style={{
                fontFamily:
                  '"JetBrains Mono","Inter",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
                fontSize: 11,
                letterSpacing: ".24em",
                fontWeight: 800,
                textTransform: "uppercase",
                color: "rgba(220, 255, 255, 0.98)",
                textShadow:
                  "0 0 20px rgba(0,255,255,0.95), 0 0 42px rgba(34,211,238,0.65)",
              }}
            >
              ARCHIVED
            </span>
          </motion.div>
        ) : null}
          </div>
        </NexusReturn>
        </motion.div>
      </motion.div>
    </>
  );
}

export default VictoryStats;
