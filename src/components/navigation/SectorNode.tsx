import { motion } from "framer-motion";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { NEXUS_DIVE_LAYOUT_ID } from "../../lib/ui/nexusLayoutBridge";
import type { CombatRank } from "../../data/rankSoundConfig";
import type { StabilityTier } from "../../lib/math/mapLogic";
import {
  DAILY_PURPLE_BORDER,
  DAILY_PURPLE_NEON,
  type InitiateCombatOptions,
} from "../../lib/dailyIncursion";
import type { NexusAnomalyType } from "../../store/useGameStore";
import { SectorAnomalyAura } from "./AnomalyOverlay";
import { useFractalBeat } from "../../lib/ui/fractalBeatContext";
import { shardLabel } from "../../lib/ui/shardLabel";
import { playHoverResonancePing } from "../../lib/audio/nexusUiAudio";
import {
  NX_GLASS_NOISE_BG,
  NX_GLASS_NOISE_OPACITY_HOVER,
  NX_GLASS_NOISE_OPACITY_IDLE,
} from "../../lib/ui/glassNoiseTexture";

const NODE_SHARD_CLIP = "inset(0 round 28px)";

const RANK_ACCENT_VAR: Record<CombatRank, string> = {
  S: "var(--gold, #facc15)",
  A: "var(--cyan, #22d3ee)",
  B: "var(--violet, #a78bfa)",
  C: "var(--red, #f87171)",
};

const TIER_LABEL: Record<StabilityTier, string> = {
  stable: "Ruhig",
  unstable: "Offen",
  critical: "Wiederholen",
};

export type SectorNodeProps = {
  lf: number;
  /** Layout-Position im Grid (px, zentrierte Ebene) */
  offsetX: number;
  offsetY: number;
  /** Pseudo-Tiefe für Parallax */
  parallaxZ: number;
  bossName: string;
  unlocked: boolean;
  stability: number;
  tier: StabilityTier;
  lastRank: CombatRank | null;
  /** Höchstes Achievement / Prestige — koppelt an CSS-Variablen */
  prestigeColor: string;
  onHoverChange: (lf: number | null) => void;
  onEngage: (lf: number, opts?: InitiateCombatOptions) => void;
  anomalyType?: NexusAnomalyType | null;
  engageOptions?: InitiateCombatOptions | null;
  isDailyIncursion?: boolean;
  /** true solange der erste Ranked-Slot des UTC-Tags nicht verbraucht ist */
  dailyRankedSlotOpen?: boolean;
  /** Anteil korrekt gelöster Curriculum-Übungen für dieses LF (0–1) */
  learningProgressRatio?: number;
  /** Alle Registry-Übungen dieses LF mindestens einmal korrekt */
  lfCurriculumMastered?: boolean;
  /** Aktives layoutId-Ziel — gleiche LF wie Bridge */
  layoutBridgeLf?: number | null;
  /** Direkter Dive ohne Karten-Zoom-Out */
  seamlessEngage?: boolean;
  /** Erst-Scan: Kartenrand nach stabilem / offenem LF */
  skillScanRing?: "stable" | "gap" | "neutral";
  /** Optional übersetzte Stabilitäts-Labels (i18n) */
  tierLabels?: Partial<Record<StabilityTier, string>>;
  /** Boss-Loop (MP4) — wird erst bei Hover geladen */
  bossVideoSrc?: string;
  /** Statische Kandidaten-Bilder (webp/png/…) bis eines lädt */
  bossThumbnailUrls?: string[];
  /** Persistierte Mastery (Boss Clear) — permanent Goldrahmen + Badge */
  sectorMastered?: boolean;
};

export function SectorNode({
  lf,
  offsetX,
  offsetY,
  parallaxZ,
  bossName,
  unlocked,
  stability,
  tier,
  lastRank,
  prestigeColor,
  onHoverChange,
  onEngage,
  anomalyType = null,
  engageOptions = null,
  isDailyIncursion = false,
  dailyRankedSlotOpen = false,
  learningProgressRatio = 0,
  lfCurriculumMastered = false,
  layoutBridgeLf = null,
  seamlessEngage = false,
  skillScanRing,
  tierLabels,
  bossVideoSrc,
  bossThumbnailUrls,
  sectorMastered = false,
}: SectorNodeProps) {
  const beat = useFractalBeat();
  const [phase, setPhase] = useState<"idle" | "diving">("idle");
  const [shardGlassHover, setShardGlassHover] = useState(false);
  const [thumbIndex, setThumbIndex] = useState(0);
  const [thumbFailedAll, setThumbFailedAll] = useState(false);
  const [videoArmed, setVideoArmed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const engagedRef = useRef(false);

  const thumbs = bossThumbnailUrls ?? [];
  const thumbSrc = !thumbFailedAll && thumbs.length > 0 ? thumbs[Math.min(thumbIndex, thumbs.length - 1)]! : null;
  const showBossMedia = thumbs.length > 0;

  useEffect(() => {
    if (!videoArmed || !videoRef.current || !bossVideoSrc) return;
    void videoRef.current.play().catch(() => {});
    return () => {
      videoRef.current?.pause();
    };
  }, [videoArmed, bossVideoSrc]);

  const tierCopy = { ...TIER_LABEL, ...tierLabels };
  const rankAccent = lastRank ? RANK_ACCENT_VAR[lastRank] : "var(--cyan, #22d3ee)";
  const scanRingBorder =
    skillScanRing === "stable"
      ? "2px solid rgba(52, 211, 153, 0.62)"
      : skillScanRing === "gap"
        ? "2px solid rgba(251, 113, 133, 0.78)"
        : skillScanRing === "neutral"
          ? "2px solid rgba(214, 181, 111, 0.42)"
          : null;
  const ringColor = isDailyIncursion ? DAILY_PURPLE_NEON : rankAccent;
  const outerGlow = isDailyIncursion
    ? `0 26px 60px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.54)`
    : `0 24px 54px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.62)`;

  const handleClick = (e?: MouseEvent | PointerEvent) => {
    e?.stopPropagation();
    if (!unlocked || phase === "diving") return;
    engagedRef.current = true;
    setPhase("diving");
    onEngage(lf, engageOptions ?? undefined);
  };

  useEffect(() => {
    if (phase !== "diving") return;
    const t = window.setTimeout(() => {
      if (engagedRef.current) return;
      engagedRef.current = true;
      onEngage(lf, engageOptions ?? undefined);
    }, 560);
    return () => window.clearTimeout(t);
  }, [phase, lf, onEngage, engageOptions]);

  return (
    <motion.div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        x: offsetX,
        y: offsetY,
        z: parallaxZ,
        marginLeft: -90,
        marginTop: -76,
        width: 180,
        height: 152,
        transformStyle: "preserve-3d",
        touchAction: "none",
        ["--sector-prestige" as string]: prestigeColor,
        ["--sector-rank" as string]: rankAccent,
      }}
      animate={
        phase === "diving"
          ? {
              scale: 16,
              opacity: 0,
              filter: ["blur(0px)", "blur(0px)", "blur(14px)"],
              z: parallaxZ + 400,
            }
          : { scale: 1, opacity: unlocked ? 1 : 0.38, filter: "blur(0px)", z: parallaxZ }
      }
      transition={{ duration: 0.58, ease: [0.32, 0, 0.2, 1] }}
      onMouseEnter={() => onHoverChange(lf)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <SectorAnomalyAura anomaly={anomalyType} />
      <motion.button
        type="button"
        data-sfx="off"
        disabled={!unlocked || phase === "diving"}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => handleClick(e)}
        onPointerEnter={() => {
          if (!unlocked || phase !== "idle") return;
          setShardGlassHover(true);
          if (showBossMedia && bossVideoSrc) setVideoArmed(true);
          void playHoverResonancePing();
        }}
        onPointerLeave={() => {
          setShardGlassHover(false);
          setVideoArmed(false);
        }}
        whileHover={unlocked && phase === "idle" ? { scale: 1.02 } : undefined}
        whileTap={unlocked ? { scale: 0.98 } : undefined}
        animate={
          lfCurriculumMastered && unlocked && phase === "idle"
            ? {
                boxShadow: [
                  "0 0 28px color-mix(in srgb, var(--gold, #facc15) 42%, transparent), inset 0 0 18px rgba(250,204,21,0.12)",
                  "0 0 40px color-mix(in srgb, var(--gold, #facc15) 62%, transparent), inset 0 0 22px rgba(250,204,21,0.2)",
                  "0 0 28px color-mix(in srgb, var(--gold, #facc15) 42%, transparent), inset 0 0 18px rgba(250,204,21,0.12)",
                ],
              }
            : false
        }
        transition={
          lfCurriculumMastered && unlocked && phase === "idle"
            ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 28,
          clipPath: NODE_SHARD_CLIP,
          border: isDailyIncursion
            ? `2px solid ${DAILY_PURPLE_BORDER}`
            : sectorMastered
              ? "2px solid rgba(212, 175, 55, 0.85)"
              : scanRingBorder
                ? scanRingBorder
                : lfCurriculumMastered
                  ? `2px solid rgba(214,181,111,0.58)`
                  : `1px solid rgba(251,247,239,0.2)`,
          cursor: unlocked ? "pointer" : "not-allowed",
          padding: 0,
          touchAction: "manipulation",
          overflow: anomalyType ? "visible" : "hidden",
          background: isDailyIncursion
            ? "linear-gradient(155deg, rgba(251,247,239,0.94) 0%, rgba(230,218,240,0.86) 100%)"
            : showBossMedia
              ? "rgba(6, 12, 10, 0.92)"
              : "linear-gradient(155deg, rgba(251,247,239,0.93) 0%, rgba(238,229,213,0.84) 100%)",
          backdropFilter: "blur(18px) saturate(105%)",
          WebkitBackdropFilter: "blur(18px) saturate(105%)",
          boxShadow: unlocked
            ? sectorMastered
              ? `0 0 0 2px rgba(212, 175, 55, 0.22), 0 0 44px rgba(212, 175, 55, 0.28), ${outerGlow}`
              : `${outerGlow}, inset 0 0 ${8 + beat * 6}px rgba(214,181,111,${0.08 + beat * 0.08})`
            : "inset 0 0 12px rgba(0,0,0,0.5)",
        }}
      >
        {sectorMastered ? (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 12,
              padding: "8px 10px",
              borderRadius: 12,
              border: "1px solid rgba(212, 175, 55, 0.65)",
              background: "rgba(8,12,10,0.72)",
              color: "rgba(251,247,239,0.95)",
              fontFamily: "var(--nx-font-mono)",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              boxShadow: "0 0 22px rgba(212, 175, 55, 0.22)",
              pointerEvents: "none",
            }}
          >
            MASTERED
          </div>
        ) : null}
        {showBossMedia ? (
          <>
            {thumbSrc ? (
              <img
                alt=""
                src={thumbSrc}
                onError={() => {
                  if (thumbIndex + 1 < thumbs.length) setThumbIndex((i) => i + 1);
                  else setThumbFailedAll(true);
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  zIndex: 0,
                  opacity: videoArmed ? 0.15 : 1,
                  transition: "opacity 0.35s ease",
                  pointerEvents: "none",
                }}
              />
            ) : (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 0,
                  background:
                    "linear-gradient(145deg, rgba(8,18,14,0.92) 0%, rgba(34,211,238,0.12) 48%, rgba(214,181,111,0.18) 100%)",
                  pointerEvents: "none",
                }}
              />
            )}
            {videoArmed && bossVideoSrc ? (
              <video
                ref={videoRef}
                key={`boss-${lf}-${bossVideoSrc}`}
                src={bossVideoSrc}
                muted
                playsInline
                loop
                preload="none"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  zIndex: 1,
                  pointerEvents: "none",
                }}
              />
            ) : null}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                pointerEvents: "none",
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(6,10,8,0.55) 55%, rgba(6,10,8,0.88) 100%)",
              }}
            />
          </>
        ) : null}
        <motion.div
          aria-hidden
          animate={{
            opacity: shardGlassHover ? NX_GLASS_NOISE_OPACITY_HOVER : NX_GLASS_NOISE_OPACITY_IDLE,
          }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 4,
            pointerEvents: "none",
            backgroundImage: NX_GLASS_NOISE_BG,
            mixBlendMode: "overlay",
          }}
        />
        {layoutBridgeLf === lf ? (
          <motion.div
            layoutId={NEXUS_DIVE_LAYOUT_ID}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 52,
              height: 52,
              marginLeft: -26,
              marginTop: -26,
              borderRadius: 999,
              zIndex: 6,
              pointerEvents: "none",
              background:
                "radial-gradient(circle at 35% 30%, rgba(251,247,239,0.95), rgba(214,181,111,0.35) 42%, rgba(21,34,25,0.18) 100%)",
              boxShadow:
                "0 18px 42px rgba(0,0,0,0.22), inset 0 0 18px rgba(255,255,255,0.45)",
              border: "1px solid rgba(251,247,239,0.55)",
            }}
          />
        ) : null}
        <motion.div
          aria-hidden
          animate={
            unlocked && tier === "stable"
              ? { opacity: [0.35, 0.65, 0.35] }
              : { opacity: 0.22 }
          }
          transition={
            unlocked && tier === "stable"
              ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3 }
          }
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: 18,
            background: `radial-gradient(circle at 40% 30%, rgba(214,181,111,0.18), transparent 62%)`,
            pointerEvents: "none",
            mixBlendMode: "multiply",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "14px 12px",
            textAlign: "center",
            fontFamily: "var(--nx-font-sans)",
          }}
        >
          <div
            style={{
              fontSize: 20,
              letterSpacing: ".04em",
              color: showBossMedia ? "rgba(251,247,239,0.92)" : "var(--nx-learn-muted)",
            }}
          >
            LF{lf}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 22,
              fontWeight: 850,
              letterSpacing: "-0.03em",
              color: showBossMedia ? "rgba(251,247,239,0.98)" : "var(--nx-learn-ink)",
              lineHeight: 1.2,
              maxHeight: 54,
              overflow: "hidden",
              textShadow: showBossMedia ? "0 2px 12px rgba(0,0,0,0.75)" : undefined,
            }}
          >
            {bossName}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 20,
              letterSpacing: ".04em",
              color:
                tier === "critical"
                  ? showBossMedia
                    ? "rgba(252, 165, 165, 0.95)"
                    : "rgba(150, 56, 48, 0.88)"
                  : tier === "unstable"
                    ? showBossMedia
                      ? "rgba(253, 224, 200, 0.95)"
                      : "rgba(132, 92, 42, 0.88)"
                    : showBossMedia
                      ? "rgba(187, 247, 208, 0.95)"
                      : "rgba(48, 92, 60, 0.88)",
              textShadow: showBossMedia ? "0 1px 10px rgba(0,0,0,0.8)" : undefined,
            }}
          >
            {shardLabel(tierCopy[tier])} {(stability * 100).toFixed(0)}
          </div>
          {isDailyIncursion ? (
            <div
              style={{
                marginTop: 5,
                fontSize: 20,
                letterSpacing: ".08em",
                color: dailyRankedSlotOpen ? DAILY_PURPLE_NEON : "rgba(248, 113, 113, 0.92)",
              }}
            >
              {dailyRankedSlotOpen ? "Heute" : "Praxis"}
            </div>
          ) : null}
          <div
            style={{
              marginTop: 8,
              height: 4,
              borderRadius: 999,
              background: "rgba(22,32,25,0.12)",
              overflow: "hidden",
            }}
            aria-hidden
          >
            <motion.div
              initial={false}
              animate={{ width: `${Math.round(Math.max(0, Math.min(1, learningProgressRatio)) * 100)}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              style={{
                height: "100%",
                borderRadius: 999,
                background: lfCurriculumMastered
                  ? "linear-gradient(90deg, rgba(214,181,111,0.95), rgba(58,112,72,0.85))"
                  : "linear-gradient(90deg, rgba(214,181,111,0.72), rgba(58,112,72,0.72))",
              }}
            />
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

export default SectorNode;
