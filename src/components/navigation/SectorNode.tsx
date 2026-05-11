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

const NODE_SHARD_CLIP =
  "polygon(8% 0%, 100% 0%, 100% 90%, 91% 100%, 0% 100%, 0% 14%)";

const RANK_ACCENT_VAR: Record<CombatRank, string> = {
  S: "var(--gold, #facc15)",
  A: "var(--cyan, #22d3ee)",
  B: "var(--violet, #a78bfa)",
  C: "var(--red, #f87171)",
};

const TIER_LABEL: Record<StabilityTier, string> = {
  stable: "STABLE",
  unstable: "DRIFT",
  critical: "CRITICAL",
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
  /** Optional übersetzte Stabilitäts-Labels (i18n) */
  tierLabels?: Partial<Record<StabilityTier, string>>;
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
  tierLabels,
}: SectorNodeProps) {
  const beat = useFractalBeat();
  const [phase, setPhase] = useState<"idle" | "diving">("idle");
  const [shardGlassHover, setShardGlassHover] = useState(false);
  const engagedRef = useRef(false);

  const tierCopy = { ...TIER_LABEL, ...tierLabels };
  const rankAccent = lastRank ? RANK_ACCENT_VAR[lastRank] : "var(--cyan, #22d3ee)";
  const ringColor = isDailyIncursion ? DAILY_PURPLE_NEON : rankAccent;
  const outerGlow = isDailyIncursion
    ? `0 0 32px rgba(192,132,252,0.45), 0 0 14px rgba(192,132,252,0.35), inset 0 0 22px rgba(192,132,252,0.12)`
    : `0 0 28px color-mix(in srgb, var(--sector-prestige) 45%, transparent), 0 0 14px color-mix(in srgb, var(--sector-rank) 35%, transparent), inset 0 0 22px rgba(34,211,238,0.08)`;

  const handleClick = (e?: MouseEvent | PointerEvent) => {
    e?.stopPropagation();
    if (!unlocked || phase === "diving") return;
    if (seamlessEngage) {
      onEngage(lf, engageOptions ?? undefined);
      return;
    }
    engagedRef.current = false;
    setPhase("diving");
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
        marginLeft: -52,
        marginTop: -52,
        width: 104,
        height: 104,
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
          void playHoverResonancePing();
        }}
        onPointerLeave={() => setShardGlassHover(false)}
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
          borderRadius: 0,
          clipPath: NODE_SHARD_CLIP,
          border: isDailyIncursion
            ? `2px solid ${DAILY_PURPLE_BORDER}`
            : lfCurriculumMastered
              ? `2px solid color-mix(in srgb, var(--gold, #facc15) 70%, transparent)`
              : `2px solid color-mix(in srgb, ${ringColor} 65%, transparent)`,
          cursor: unlocked ? "pointer" : "not-allowed",
          padding: 0,
          touchAction: "manipulation",
          overflow: anomalyType ? "visible" : "hidden",
          background: isDailyIncursion
            ? "linear-gradient(155deg, rgba(24,10,40,0.94) 0%, rgba(6,12,24,0.9) 100%)"
            : "linear-gradient(155deg, rgba(6,18,28,0.92) 0%, rgba(4,12,20,0.88) 100%)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: unlocked
            ? `${outerGlow}, inset 0 0 ${10 + beat * 18}px rgba(34,211,238,${0.12 + beat * 0.24}), inset 0 0 0 1px rgba(255,255,255,0.05)`
            : "inset 0 0 12px rgba(0,0,0,0.5)",
        }}
      >
        <motion.div
          aria-hidden
          animate={{
            opacity: shardGlassHover ? NX_GLASS_NOISE_OPACITY_HOVER : NX_GLASS_NOISE_OPACITY_IDLE,
          }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
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
                "radial-gradient(circle at 35% 30%, rgba(250,250,255,0.95), rgba(34,211,238,0.35) 42%, rgba(15,23,42,0.2) 100%)",
              boxShadow:
                "0 0 28px rgba(34, 211, 238, 0.75), 0 0 52px rgba(250, 204, 21, 0.35), inset 0 0 18px rgba(255,255,255,0.45)",
              border: "1px solid rgba(186, 230, 253, 0.55)",
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
            background: `radial-gradient(circle at 40% 30%, color-mix(in srgb, var(--sector-prestige) 55%, transparent), transparent 62%)`,
            pointerEvents: "none",
            mixBlendMode: "screen",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 3,
            padding: "10px 8px",
            textAlign: "center",
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: ".24em",
              color: "rgba(103, 232, 249, 0.78)",
            }}
          >
            LF{lf}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".06em",
              color: "rgba(224, 250, 255, 0.94)",
              lineHeight: 1.2,
              maxHeight: 32,
              overflow: "hidden",
            }}
          >
            {bossName.slice(0, 18)}
            {bossName.length > 18 ? "…" : ""}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 8,
              letterSpacing: ".18em",
              color:
                tier === "critical"
                  ? "rgba(248, 113, 113, 0.9)"
                  : tier === "unstable"
                    ? "rgba(250, 204, 21, 0.88)"
                    : "rgba(52, 211, 153, 0.88)",
            }}
          >
            {shardLabel(tierCopy[tier])} {(stability * 100).toFixed(0)}
          </div>
          {isDailyIncursion ? (
            <div
              style={{
                marginTop: 5,
                fontSize: 7,
                letterSpacing: ".2em",
                color: dailyRankedSlotOpen ? DAILY_PURPLE_NEON : "rgba(248, 113, 113, 0.92)",
              }}
            >
              {dailyRankedSlotOpen ? "GLOBAL DAILY" : "PRAXIS"}
            </div>
          ) : null}
          <div
            style={{
              marginTop: 8,
              height: 4,
              borderRadius: 999,
              background: "rgba(15,23,42,0.75)",
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
                  ? "linear-gradient(90deg, rgba(250,204,21,0.95), rgba(52,211,153,0.85))"
                  : "linear-gradient(90deg, rgba(34,211,238,0.9), rgba(167,139,250,0.8))",
              }}
            />
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

export default SectorNode;
