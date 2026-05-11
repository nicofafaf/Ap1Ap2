import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  getComingSoonLootPlaceholder,
  type LearningField,
} from "../../data/nexusRegistry";
import { useNexusAssetProvider } from "../../lib/assets/nexusAssetProvider";
import { useGameStore } from "../../store/useGameStore";
import { bossSpatialMotionSync } from "../../lib/combat/bossSpatialMotion";
import NexusParticles from "./NexusParticles";
import type { SkillVfx } from "../../data/skillRegistry";
import CriticalDebrisVFX from "./CriticalDebrisVFX";
import BossAuraVFX from "./BossAuraVFX";
import NeuralStaticOverlay from "./NeuralStaticOverlay";
import {
  allowGlitchMotionForText,
  NX_UI_INSTANT,
  nxBossSharedLayoutTransition,
} from "../../lib/ui/textMotionPolicy";
import { NEXUS_DIVE_LAYOUT_ID } from "../../lib/ui/nexusLayoutBridge";
import { dispatchFractalBossDamageBurst } from "../../lib/combat/fractalAtmosphereEvents";

type BossStageProps = {
  currentLF: LearningField;
  className?: string;
  entryToken?: number | string;
  isVictory?: boolean;
  damagePulseToken?: number | string;
  skillVfxToken?: number | string;
  activeSkillVfx?: SkillVfx | null;
  onVictoryVisualComplete?: () => void;
  timeScale?: number;
  particleDensity?: "LOW" | "MEDIUM" | "HIGH";
  adaptivePulseToken?: number | string;
  bossAggressionLevel?: number;
  criticalHitToken?: number | string;
  cameraZoom?: number;
  currentCombatPhase?: 1 | 2;
  isTransitioning?: boolean;
  combatPhaseTransitionToken?: number;
  /** Gemeinsames layoutId mit Sektor-Knoten beim Map-Dive */
  diveLayoutBridgeActive?: boolean;
};

export function BossStage({
  currentLF,
  className,
  entryToken,
  isVictory = false,
  damagePulseToken,
  skillVfxToken,
  activeSkillVfx,
  onVictoryVisualComplete,
  timeScale = 1,
  particleDensity = "MEDIUM",
  adaptivePulseToken,
  bossAggressionLevel = 1,
  criticalHitToken,
  cameraZoom = 1,
  currentCombatPhase = 1,
  isTransitioning = false,
  combatPhaseTransitionToken = 0,
  diveLayoutBridgeActive = false,
}: BossStageProps) {
  const reduceMotion = useReducedMotion();
  const nexusEntry = useNexusAssetProvider(currentLF);
  const setBossPlaybackRate = useGameStore((state) => state.setBossPlaybackRate);
  const isCriticalPhase = useGameStore((state) => state.isCriticalPhase);
  const activeCombatAnomaly = useGameStore((state) => state.activeCombatAnomaly);
  const victoryFinisherPhase = useGameStore((state) => state.victoryFinisherPhase);
  const bossStrategyScanToken = useGameStore((state) => state.bossStrategyScanToken);
  const isSingularityActive = useGameStore((state) => state.isSingularityActive);
  const singularityEnteredToken = useGameStore((state) => state.singularityEnteredToken);
  const [mediaError, setMediaError] = useState(false);
  const [posterIndex, setPosterIndex] = useState(0);
  const [damageFxActive, setDamageFxActive] = useState(false);
  const [damageWave, setDamageWave] = useState(0);
  const [skillFxActive, setSkillFxActive] = useState(false);
  const [adaptiveActive, setAdaptiveActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const spatialRef = useRef<HTMLDivElement | null>(null);
  const trailARef = useRef<HTMLDivElement | null>(null);
  const trailBRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const prevSwayRef = useRef({ x: 0, y: 0 });
  const phaseMotionRef = useRef({
    phase: 1 as 1 | 2,
    transitioning: false,
    victory: false,
  });
  const damageFxRef = useRef(false);
  const skillFxRef = useRef(false);

  const posterCandidates = useMemo(
    () => nexusEntry.bossVisual.fallbackPaths,
    [nexusEntry]
  );

  useEffect(() => {
    setMediaError(false);
    setPosterIndex(0);
  }, [currentLF]);

  useEffect(() => {
    if (!isVictory || !onVictoryVisualComplete) return;
    const delayMs =
      useGameStore.getState().victoryFinisherToken > 0 ? 3380 : 920;
    const timer = window.setTimeout(() => {
      onVictoryVisualComplete();
    }, delayMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isVictory, onVictoryVisualComplete]);

  useEffect(() => {
    if (damagePulseToken == null) return;
    setDamageWave((n) => n + 1);
    setDamageFxActive(true);
    const st = useGameStore.getState();
    dispatchFractalBossDamageBurst(st.lastBossDamage, st.maxBossHP);
    const timer = window.setTimeout(() => {
      setDamageFxActive(false);
    }, 360);
    return () => {
      window.clearTimeout(timer);
    };
  }, [damagePulseToken]);

  useEffect(() => {
    if (skillVfxToken == null) return;
    setSkillFxActive(true);
    const timer = window.setTimeout(() => {
      setSkillFxActive(false);
    }, 520);
    return () => {
      window.clearTimeout(timer);
    };
  }, [skillVfxToken]);

  useEffect(() => {
    if (adaptivePulseToken == null) return;
    setAdaptiveActive(true);
    const timer = window.setTimeout(() => {
      setAdaptiveActive(false);
    }, 520);
    return () => {
      window.clearTimeout(timer);
    };
  }, [adaptivePulseToken]);

  const glitchDuration = useMemo(() => {
    const base = Math.max(0.7, 1.8 - bossAggressionLevel * 0.16);
    return currentCombatPhase === 2 ? base * 0.5 : base;
  }, [bossAggressionLevel, currentCombatPhase]);

  const bossMediaFilters = useMemo(
    () => ({
      dmg: "brightness(2) sepia(1) saturate(100) drop-shadow(0 0 24px rgba(255,64,64,0.85))",
      idle: "drop-shadow(0 0 24px rgba(0,255,255,0.45))",
      mid: "drop-shadow(0 0 40px rgba(0,255,255,0.6))",
      vict: "brightness(5) drop-shadow(0 0 40px rgba(0,255,255,0.9))",
    }),
    []
  );

  const bossNameGlitchOk = allowGlitchMotionForText(nexusEntry.bossDisplayName);
  const phasePrefixGlitchOk = allowGlitchMotionForText(nexusEntry.phase2TitlePrefix);
  const titleMotionOn =
    (currentCombatPhase === 2 || isTransitioning) && bossNameGlitchOk;

  const skillFxGradient = useMemo(() => {
    if (activeSkillVfx === "HEX_SHIELD") {
      return "radial-gradient(circle at center, rgba(183, 28, 28, 0.30) 0%, rgba(109,40,217,0.22) 52%, rgba(0,0,0,0) 78%)";
    }
    if (activeSkillVfx === "FRACTAL_GLITCH") {
      return "linear-gradient(120deg, rgba(59,130,246,0.18) 0%, rgba(34,211,238,0.28) 30%, rgba(168,85,247,0.24) 62%, rgba(0,0,0,0) 100%)";
    }
    return "linear-gradient(90deg, rgba(0,255,255,0.34) 0%, rgba(56,189,248,0.18) 45%, rgba(0,0,0,0) 100%)";
  }, [activeSkillVfx]);

  useEffect(() => {
    if (!videoRef.current) return;
    const cap = activeCombatAnomaly === "GLITCH_STORM" ? 1.24 : 1.12;
    const nextRate = Math.max(0.5, Math.min(cap, timeScale));
    videoRef.current.playbackRate = nextRate;
    setBossPlaybackRate(nextRate);
  }, [timeScale, setBossPlaybackRate, activeCombatAnomaly]);

  useEffect(() => {
    phaseMotionRef.current = {
      phase: currentCombatPhase,
      transitioning: isTransitioning,
      victory: isVictory,
    };
  }, [currentCombatPhase, isTransitioning, isVictory]);

  useEffect(() => {
    damageFxRef.current = damageFxActive;
  }, [damageFxActive]);

  useEffect(() => {
    skillFxRef.current = skillFxActive;
  }, [skillFxActive]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const { phase, transitioning, victory } = phaseMotionRef.current;
      if (phase !== 2 || transitioning || victory) return;
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      mouseRef.current = { x: nx, y: ny };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      const el = spatialRef.current;
      const { phase, transitioning, victory } = phaseMotionRef.current;
      const spatialOn = phase === 2 && !transitioning && !victory;

      if (!el) {
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      const singularityOn = useGameStore.getState().isSingularityActive;

      if (!spatialOn) {
        if (singularityOn && el) {
          const jx = (Math.random() - 0.5) * 10;
          const jy = (Math.random() - 0.5) * 10;
          el.style.willChange = "transform";
          el.style.transform = `translate3d(${jx.toFixed(2)}px,${jy.toFixed(2)}px,0) scale(1)`;
        } else if (el) {
          el.style.transform = "translate3d(0,0,0) scale(1)";
          el.style.willChange = "auto";
        }
        prevSwayRef.current = { x: 0, y: 0 };
        if (trailARef.current) {
          trailARef.current.style.opacity = "0";
          trailARef.current.style.transform = "translate3d(0,0,0) scale(1)";
        }
        if (trailBRef.current) {
          trailBRef.current.style.opacity = "0";
          trailBRef.current.style.transform = "translate3d(0,0,0) scale(1)";
        }
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();
      const { swayAmpMul, swaySpeedMul } = bossSpatialMotionSync;
      const baseAmp = 12 * swayAmpMul;
      const spd = 0.00031 * swaySpeedMul;
      const tt = now * spd;
      const swayX = baseAmp * Math.sin(tt);
      const swayY = baseAmp * 0.88 * Math.sin(2 * tt + 0.35);
      const stalk = 1.075 + 0.075 * Math.sin(now * 0.00038);
      const px = -mouseRef.current.x * 16;
      const py = -mouseRef.current.y * 12;
      const jx = singularityOn ? (Math.random() - 0.5) * 10 : 0;
      const jy = singularityOn ? (Math.random() - 0.5) * 10 : 0;
      const tx = swayX + px + jx;
      const ty = swayY + py + jy;

      el.style.willChange = "transform";
      el.style.transform = `translate3d(${tx.toFixed(3)}px,${ty.toFixed(3)}px,0) scale(${stalk.toFixed(5)})`;

      const dx = tx - prevSwayRef.current.x;
      const dy = ty - prevSwayRef.current.y;
      prevSwayRef.current = { x: tx, y: ty };
      const vel = Math.hypot(dx, dy);
      const attackBoost =
        (damageFxRef.current ? 0.42 : 0) + (skillFxRef.current ? 0.28 : 0);
      const ghost = Math.min(0.95, vel * 0.095 + attackBoost);
      const inv = vel > 0.015 ? 1 / vel : 0;
      const ux = dx * inv;
      const uy = dy * inv;

      const a = trailARef.current;
      const b = trailBRef.current;
      if (a) {
        a.style.opacity = String(Math.min(0.64, ghost * 0.78));
        a.style.transform = `translate3d(${(-ux * 26).toFixed(2)}px,${(-uy * 26).toFixed(2)}px,0) scale(1.03)`;
      }
      if (b) {
        b.style.opacity = String(Math.min(0.52, ghost * 0.58));
        b.style.transform = `translate3d(${(-ux * 40).toFixed(2)}px,${(-uy * 40).toFixed(2)}px,0) scale(1.07)`;
      }

      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  return (
    <motion.div
      key={`${currentLF}-${String(entryToken ?? "default")}`}
      className={className}
      initial={{ opacity: 0, scale: 0.72 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: reduceMotion ? 0 : damageFxActive ? [0, -10, 10, -7, 7, -4, 0] : 0,
      }}
      transition={{
        opacity: { duration: 2 / Math.max(0.75, timeScale), ease: "easeOut" as const },
        scale: { duration: 1.2 / Math.max(0.75, timeScale), ease: "easeOut" as const },
        x: reduceMotion
          ? NX_UI_INSTANT
          : { duration: 0.34 / Math.max(0.75, timeScale), ease: "easeInOut" as const },
      }}
      style={{
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {!isVictory && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 24,
            textAlign: "center",
            pointerEvents: "none",
            maxWidth: "min(92vw, 720px)",
          }}
        >
          <motion.div
            key={`boss-title-${combatPhaseTransitionToken}-${currentCombatPhase}`}
            initial={false}
            animate={
              reduceMotion
                ? { x: 0, opacity: 1, filter: "none" }
                : titleMotionOn
                  ? {
                      x: [0, -3, 4, -2, 2, 0],
                      opacity: [1, 0.35, 0.92, 0.5, 1, 0.88, 1],
                      filter: [
                        "none",
                        "hue-rotate(18deg) saturate(1.8)",
                        "none",
                        "hue-rotate(-12deg) contrast(1.15)",
                        "none",
                      ],
                    }
                  : { x: 0, opacity: 1, filter: "none" }
            }
            transition={{
              duration:
                reduceMotion
                  ? 0.01
                  : combatPhaseTransitionToken > 0 && (isTransitioning || currentCombatPhase === 2)
                    ? 1.2
                    : 0.2,
              ease: "easeOut" as const,
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "baseline",
                gap: "0.35em",
                fontSize: "clamp(13px, 2.1vw, 17px)",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                lineHeight: 1.25,
                color: "rgba(186, 230, 253, 0.96)",
                textShadow: "0 0 18px rgba(34, 211, 238, 0.35)",
              }}
            >
              {currentCombatPhase === 2 || isTransitioning ? (
                <>
                  <span
                    className={phasePrefixGlitchOk ? "boss-phase2-prefix" : undefined}
                    style={{
                      color: "#ff3d2e",
                      textShadow:
                        "0 0 20px rgba(255, 45, 30, 0.75), 0 0 42px rgba(255, 60, 40, 0.35)",
                      fontSize: "0.82em",
                    }}
                  >
                    {nexusEntry.phase2TitlePrefix}
                  </span>
                  <span style={{ color: "rgba(248, 250, 252, 0.92)", letterSpacing: "0.12em" }}>
                    {nexusEntry.bossDisplayName}
                  </span>
                </>
              ) : (
                <span style={{ letterSpacing: "0.14em" }}>{nexusEntry.bossDisplayName}</span>
              )}
            </div>
            <AnimatePresence>
              {currentCombatPhase === 2 && !isTransitioning && (
                <motion.div
                  key={`sub-${combatPhaseTransitionToken}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 0.88, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{
                    delay: reduceMotion ? 0 : 0.32,
                    duration: 0.45,
                    ease: "easeOut" as const,
                  }}
                  style={{
                    fontSize: "clamp(9px, 1.45vw, 11px)",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: "rgba(251, 113, 133, 0.88)",
                    textShadow: "0 0 14px rgba(244, 63, 94, 0.45)",
                  }}
                >
                  {nexusEntry.phase2StatusLine}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <style>{`
            .boss-phase2-prefix {
              animation: bossPrefixGlitch 1.15s steps(2, end) 1;
            }
            @keyframes bossPrefixGlitch {
              0% { opacity: 1; transform: translateX(0); }
              25% { opacity: 0.55; transform: translateX(-1px); }
              50% { opacity: 1; transform: translateX(1px); }
              75% { opacity: 0.65; transform: translateX(-2px); }
              100% { opacity: 1; transform: translateX(0); }
            }
            @media (prefers-reduced-motion: reduce) {
              .boss-phase2-prefix {
                animation: none !important;
              }
            }
          `}</style>
        </div>
      )}
      <NexusParticles
        primaryColor={
          isCriticalPhase
            ? "rgba(255, 69, 88, 0.92)"
            : nexusEntry.combatPalette.primary
        }
        accentColor={
          isCriticalPhase
            ? "rgba(167, 85, 255, 0.86)"
            : nexusEntry.combatPalette.accent
        }
        damagePulseToken={damagePulseToken}
        isVictory={isVictory}
        lootTarget={{ x: 0.88, y: 0.82 }}
        particleDensity={particleDensity}
        victoryFinisherZeroPoint={
          isVictory && victoryFinisherPhase === "implode"
        }
      />
      <div
        ref={spatialRef}
        style={{
          position: "absolute",
          inset: 0,
          transform: "translate3d(0,0,0)",
          transformOrigin: "50% 45%",
          willChange: "transform",
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "50% 45%",
            willChange: "transform",
          }}
          initial={false}
          animate={{
            scale: isVictory ? 0 : 1,
          }}
          transition={{
            scale: reduceMotion
              ? NX_UI_INSTANT
              : {
                  duration: isVictory ? 0.3 : 0.42,
                  ease: [0.68, -0.55, 0.265, 1.55],
                },
          }}
        >
        <motion.div
          aria-hidden="true"
          animate={
            reduceMotion
              ? { opacity: 0.68, filter: "blur(20px)" }
              : {
                  opacity: [0.45, 0.9, 0.45],
                  filter: ["blur(16px)", "blur(24px)", "blur(16px)"],
                }
          }
          transition={
            reduceMotion
              ? NX_UI_INSTANT
              : {
                  duration: 2.1,
                  ease: "easeInOut" as const,
                  repeat: Infinity,
                }
          }
          style={{
            position: "absolute",
            inset: "20% 8% 10%",
            zIndex: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at center, rgba(34,211,238,0.28) 0%, rgba(34,211,238,0.08) 45%, rgba(0,0,0,0) 72%)",
            mixBlendMode: "screen",
          }}
        />
        <motion.div
          aria-hidden
          animate={
            reduceMotion
              ? { opacity: 0.55, scale: 1 }
              : damageFxActive
                ? {
                    opacity: [0.55, 0.95, 0.72],
                    scale: [1, 1.04, 1],
                  }
                : {
                    opacity: [0.42, 0.68, 0.42],
                    scale: [1, 1.02, 1],
                  }
          }
          transition={
            reduceMotion
              ? NX_UI_INSTANT
              : damageFxActive
                ? { duration: 0.32, ease: "easeInOut" as const }
                : { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const }
          }
          style={{
            position: "absolute",
            left: "50%",
            top: "42%",
            width: "min(74vw, 540px)",
            height: "min(74vw, 540px)",
            marginLeft: "calc(min(74vw, 540px) / -2)",
            marginTop: "calc(min(74vw, 540px) / -2)",
            zIndex: 2,
            pointerEvents: "none",
            borderRadius: "50%",
            background: `
              radial-gradient(circle at 48% 46%, rgba(255,255,255,0.07) 0%, transparent 36%),
              radial-gradient(circle at 32% 38%, rgba(34,211,238,0.16) 0%, transparent 42%),
              radial-gradient(circle at 68% 58%, rgba(167,139,250,0.12) 0%, transparent 44%),
              radial-gradient(circle at 50% 50%, rgba(6,182,212,0.06) 22%, transparent 58%)
            `,
            backdropFilter: "blur(5px) saturate(155%) contrast(1.1)",
            WebkitBackdropFilter: "blur(5px) saturate(155%) contrast(1.1)",
            boxShadow:
              "inset 0 0 80px rgba(34, 211, 238, 0.14), inset 0 0 28px rgba(255,255,255,0.05)",
            maskImage: "radial-gradient(circle at 50% 50%, black 52%, transparent 74%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 52%, transparent 74%)",
            mixBlendMode: "screen",
          }}
        />
        <BossAuraVFX trailARef={trailARef} trailBRef={trailBRef}>
          <CriticalDebrisVFX
            criticalHitToken={criticalHitToken}
            cameraZoom={cameraZoom}
          />
          {diveLayoutBridgeActive && !isVictory ? (
            <motion.div
              layoutId={NEXUS_DIVE_LAYOUT_ID}
              transition={nxBossSharedLayoutTransition(reduceMotion)}
              style={{
                position: "absolute",
                left: "50%",
                top: "42%",
                width: 120,
                height: 120,
                marginLeft: -60,
                marginTop: -60,
                borderRadius: 999,
                zIndex: 4,
                pointerEvents: "none",
                background:
                  "radial-gradient(circle at 35% 30%, rgba(250,250,255,0.55), rgba(34,211,238,0.22) 48%, rgba(15,23,42,0.05) 100%)",
                boxShadow:
                  "0 0 40px rgba(34, 211, 238, 0.55), 0 0 80px rgba(250, 204, 21, 0.22), inset 0 0 28px rgba(255,255,255,0.2)",
                border: "1px solid rgba(186, 230, 253, 0.45)",
                mixBlendMode: "screen",
              }}
            />
          ) : null}
          {!mediaError ? (
            <motion.video
              ref={videoRef}
              src={nexusEntry.bossVisual.primaryPath}
              autoPlay
              loop
              muted
              playsInline
              poster={posterCandidates[posterIndex]}
              onError={() => {
                setMediaError(true);
              }}
              initial={{ opacity: 0, y: 26 }}
              animate={{
                opacity: isVictory ? 0 : 1,
                y: 0,
                scale: isVictory ? 1.16 : 1,
                filter: reduceMotion
                  ? isVictory
                    ? bossMediaFilters.vict
                    : damageFxActive
                      ? bossMediaFilters.dmg
                      : bossMediaFilters.idle
                  : [
                      damageFxActive ? bossMediaFilters.dmg : bossMediaFilters.idle,
                      isVictory ? bossMediaFilters.vict : bossMediaFilters.mid,
                      damageFxActive ? bossMediaFilters.dmg : bossMediaFilters.idle,
                    ],
              }}
              transition={{
                opacity: {
                  duration: isVictory ? 0.85 : 0.6,
                  ease: "easeOut" as const,
                },
                scale: { duration: isVictory ? 0.9 : 0.6, ease: "easeOut" as const },
                y: { duration: 0.6, ease: "easeOut" as const },
                filter: reduceMotion
                  ? { duration: 0.45, ease: "easeOut" as const }
                  : {
                      duration: adaptiveActive ? 0.5 : isCriticalPhase ? 0.85 : glitchDuration,
                      repeat: Infinity,
                      ease: "easeInOut" as const,
                    },
              }}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                mixBlendMode: "screen",
                willChange: "transform, filter, opacity",
                transform: "translateZ(0)",
              }}
            />
          ) : (
            <motion.img
              src={posterCandidates[posterIndex] ?? getComingSoonLootPlaceholder()}
              alt={`Titan ${currentLF}`}
              onError={() => {
                setPosterIndex((idx) =>
                  idx + 1 < posterCandidates.length ? idx + 1 : idx
                );
              }}
              initial={{ opacity: 0, y: 26 }}
              animate={{
                opacity: isVictory ? 0 : 1,
                y: 0,
                scale: isVictory ? 1.16 : 1,
                filter: reduceMotion
                  ? isVictory
                    ? bossMediaFilters.vict
                    : damageFxActive
                      ? bossMediaFilters.dmg
                      : bossMediaFilters.idle
                  : [
                      damageFxActive ? bossMediaFilters.dmg : bossMediaFilters.idle,
                      isVictory ? bossMediaFilters.vict : bossMediaFilters.mid,
                      damageFxActive ? bossMediaFilters.dmg : bossMediaFilters.idle,
                    ],
              }}
              transition={{
                opacity: {
                  duration: isVictory ? 0.85 : 0.6,
                  ease: "easeOut" as const,
                },
                scale: { duration: isVictory ? 0.9 : 0.6, ease: "easeOut" as const },
                y: { duration: 0.6, ease: "easeOut" as const },
                filter: reduceMotion
                  ? { duration: 0.45, ease: "easeOut" as const }
                  : {
                      duration: adaptiveActive ? 0.5 : isCriticalPhase ? 0.85 : glitchDuration,
                      repeat: Infinity,
                      ease: "easeInOut" as const,
                    },
              }}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                mixBlendMode: "screen",
                willChange: "transform, filter, opacity",
                transform: "translateZ(0)",
              }}
            />
          )}
        </BossAuraVFX>
        {currentCombatPhase === 2 && !isTransitioning && !isVictory && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0.65 }}
            animate={
              reduceMotion ? { opacity: 0.78 } : { opacity: [0.52, 0.95, 0.52] }
            }
            transition={
              reduceMotion
                ? NX_UI_INSTANT
                : { duration: 1.15, repeat: Infinity, ease: "easeInOut" as const }
            }
            style={{
              position: "absolute",
              inset: "-3px",
              zIndex: 2,
              pointerEvents: "none",
              borderRadius: 12,
              border: "2px solid rgba(255, 72, 48, 0.78)",
              boxShadow:
                "0 0 46px rgba(255, 55, 35, 0.58), inset 0 0 70px rgba(255, 30, 72, 0.14)",
              mixBlendMode: "screen",
            }}
          />
        )}
        </motion.div>
      </div>

      {skillFxActive && (
        <motion.div
          initial={{ opacity: 0.72 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.42, ease: "easeOut" as const }}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: skillFxGradient,
            mixBlendMode: "screen",
          }}
        />
      )}

      <AnimatePresence>
        {isCriticalPhase && (
          <motion.div
            key="critical-alarm-frame"
            initial={{ opacity: 0 }}
            animate={reduceMotion ? { opacity: 0.28 } : { opacity: [0.18, 0.42, 0.18] }}
            exit={{ opacity: 0 }}
            transition={
              reduceMotion
                ? NX_UI_INSTANT
                : {
                    opacity: { duration: 0.78, repeat: Infinity, ease: "easeInOut" as const },
                    duration: 0.24,
                  }
            }
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              border: "1px solid rgba(255, 84, 102, 0.72)",
              boxShadow:
                "inset 0 0 90px rgba(255, 64, 92, 0.24), 0 0 38px rgba(167,85,255,0.22)",
              background:
                "radial-gradient(circle at center, rgba(0,0,0,0) 58%, rgba(132, 18, 34, 0.28) 100%)",
              mixBlendMode: "screen",
            }}
          />
        )}
      </AnimatePresence>

      {damageFxActive && (
        <motion.div
          key={damageWave}
          initial={{ opacity: 0.55 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" as const }}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "rgba(255, 32, 32, 0.28)",
            mixBlendMode: "screen",
          }}
        />
      )}

      {!isVictory && isSingularityActive ? (
        <NeuralStaticOverlay active />
      ) : null}

      <AnimatePresence initial={false}>
        {singularityEnteredToken > 0 && !isVictory ? (
          <motion.div
            key={singularityEnteredToken}
            initial={{ opacity: 0 }}
            animate={reduceMotion ? { opacity: 0.22 } : { opacity: [0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={
              reduceMotion ? NX_UI_INSTANT : { duration: 0.5, ease: "easeOut" as const }
            }
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 22,
              pointerEvents: "none",
              background:
                "linear-gradient(118deg, #ffffff 0%, rgba(0,255,255,0.92) 42%, #f8fafc 100%)",
              mixBlendMode: "difference",
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {bossStrategyScanToken > 0 && !isVictory ? (
          <motion.div
            key={`boss-scan-${bossStrategyScanToken}`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, left: "-18%" }}
            animate={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: [0, 1, 1, 0], left: ["-18%", "108%"] }
            }
            exit={{ opacity: 0 }}
            transition={
              reduceMotion
                ? NX_UI_INSTANT
                : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
            }
            style={{
              position: "absolute",
              bottom: "8%",
              left: "-18%",
              width: "14%",
              height: 3,
              pointerEvents: "none",
              zIndex: 30,
              borderRadius: 2,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,48,40,0.92) 35%, rgba(255,220,200,0.95) 50%, rgba(255,48,40,0.92) 65%, transparent 100%)",
              boxShadow:
                "0 0 22px rgba(255, 55, 40, 0.85), 0 0 48px rgba(255, 30, 72, 0.45)",
              mixBlendMode: "screen",
              transform: "translateY(-50%) skewX(-8deg)",
            }}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export default BossStage;
