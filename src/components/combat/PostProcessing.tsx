import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { NexusPresetId } from "../../data/nexusPresets";

type PostProcessingProps = {
  playerHpRatio: number;
  hitPulseToken?: number | string;
  chromaticIntensity?: number;
  vignetteStrength?: number;
  presetId?: NexusPresetId;
  victoryFlashToken?: number;
  bossAggressionLevel?: number;
  finisherFreezeActive?: boolean;
  synapticOverloadToken?: number;
  synapticOverloadActive?: boolean;
  /** 0–100 — verstärkt Chromatic Aberration (performant: CSS-Transforms) */
  synapticFlow?: number;
  /** Steigt bei Schild-Absorption — kurzer Bloom-Puls */
  sentinelAbsorbToken?: number;
  /** Singularity: VHS-artiger Glitch + stärkeres Film Grain */
  isSingularityActive?: boolean;
  /** Globaler Trigger: 2 Frames White-Out + CA-Spike (Parry / Shatter) */
  impactFrameToken?: number;
  /** Retention-Streak: goldener Aufstiegs-Mix (0–1) */
  learningAscensionMix?: number;
  /** Bei falscher Lernantwort erhöht — kurzer Kälte-Puls am Rand */
  learningMentorColdToken?: number;
};

function useCoarseOrMobileVfx(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const fn = () => setCoarse(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return coarse;
}

export function PostProcessing({
  playerHpRatio,
  hitPulseToken,
  chromaticIntensity = 0.55,
  vignetteStrength = 1,
  presetId,
  victoryFlashToken = 0,
  bossAggressionLevel = 1,
  finisherFreezeActive = false,
  synapticOverloadToken = 0,
  synapticOverloadActive = false,
  synapticFlow = 0,
  sentinelAbsorbToken = 0,
  isSingularityActive = false,
  impactFrameToken = 0,
  learningAscensionMix = 0,
  learningMentorColdToken = 0,
}: PostProcessingProps) {
  const lightVfx = useCoarseOrMobileVfx();
  const [impactFlash, setImpactFlash] = useState(false);
  const [impactSpike, setImpactSpike] = useState(false);
  const impactPrevRef = useRef(0);

  useLayoutEffect(() => {
    if (impactFrameToken === 0 || impactFrameToken === impactPrevRef.current) return;
    impactPrevRef.current = impactFrameToken;
    setImpactFlash(true);
    setImpactSpike(true);
    let frames = 0;
    const step = () => {
      frames += 1;
      if (frames >= 2) {
        setImpactFlash(false);
        requestAnimationFrame(() => setImpactSpike(false));
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [impactFrameToken]);

  const playerHpRatioPrevRef = useRef(Math.max(0, Math.min(1, playerHpRatio)));
  const sentinelAbsorbPrevRef = useRef(sentinelAbsorbToken);

  useLayoutEffect(() => {
    const safe = Math.max(0, Math.min(1, playerHpRatio));
    const hpDrop = safe < playerHpRatioPrevRef.current - 0.0015;
    const absorbBump = sentinelAbsorbToken > sentinelAbsorbPrevRef.current;
    playerHpRatioPrevRef.current = safe;
    sentinelAbsorbPrevRef.current = sentinelAbsorbToken;

    if (!hpDrop && !absorbBump) return;

    const root = document.documentElement;
    root.dataset.nxPlayerRgbGlitch = "1";
    const t = window.setTimeout(() => {
      delete root.dataset.nxPlayerRgbGlitch;
    }, 150);
    return () => window.clearTimeout(t);
  }, [playerHpRatio, sentinelAbsorbToken]);

  const safeRatio = Math.max(0, Math.min(1, playerHpRatio));
  const vignetteOpacity =
    (0.2 + (1 - safeRatio) * 0.55) * Math.max(0.35, vignetteStrength);
  const vignetteInset = `${8 + (1 - safeRatio) * 13}%`;

  const levelFive = bossAggressionLevel === 5;
  const flowN = Math.max(0, Math.min(1, synapticFlow / 100));
  const caSpreadPx =
    (1.1 + flowN * 5.2) * Math.max(0.25, chromaticIntensity) * (lightVfx ? 0.62 : 1);
  const singularityBoost = isSingularityActive ? (lightVfx ? 0.55 : 1) : 0;
  const impactCaPx = (lightVfx ? 10 : 22) + (impactSpike ? 14 : 0);
  const ascN = Math.max(0, Math.min(1, learningAscensionMix));

  return (
    <motion.div
      key={presetId ?? "manual"}
      initial={{ opacity: 0.92 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at center, rgba(0,0,0,0) 35%, rgba(0,0,0,${vignetteOpacity}) 85%)`,
          transform: "translateZ(0)",
          willChange: "opacity, transform",
          clipPath: `inset(${vignetteInset} round 16px)`,
        }}
        animate={{ opacity: [0.82, 1, 0.82] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        key={String(hitPulseToken ?? "idle")}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.55, 0] }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        style={{
          position: "absolute",
          inset: 0,
          filter: "contrast(1.08) saturate(1.18)",
          transform: "translate3d(0,0,0)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            mixBlendMode: "screen",
            background:
              `linear-gradient(90deg, rgba(255,0,30,${0.24 * chromaticIntensity}) 0%, rgba(0,255,255,${0.14 * chromaticIntensity}) 50%, rgba(0,90,255,${0.22 * chromaticIntensity}) 100%)`,
            transform: `translateX(${-(caSpreadPx + (impactSpike ? impactCaPx * 0.5 : 0))}px)`,
            willChange: "transform",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            mixBlendMode: "screen",
            background:
              `linear-gradient(90deg, rgba(255,0,30,${0.2 * chromaticIntensity}) 0%, rgba(0,255,255,${0.1 * chromaticIntensity}) 55%, rgba(0,90,255,${0.2 * chromaticIntensity}) 100%)`,
            transform: `translateX(${caSpreadPx + (impactSpike ? impactCaPx * 0.5 : 0)}px)`,
            willChange: "transform",
          }}
        />
      </motion.div>

      {ascN > 0.04 ? (
        <motion.div
          aria-hidden
          animate={{
            opacity: [0.14 + ascN * 0.2, 0.22 + ascN * 0.38, 0.16 + ascN * 0.24],
          }}
          transition={{ duration: lightVfx ? 2.4 : 1.9, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: "-4%",
            pointerEvents: "none",
            mixBlendMode: "soft-light",
            background:
              "radial-gradient(ellipse 88% 72% at 50% 36%, rgba(255, 220, 150, 0.55) 0%, rgba(212, 175, 55, 0.22) 38%, rgba(120, 80, 20, 0) 72%)",
            filter: lightVfx ? "saturate(1.12)" : "saturate(1.28) brightness(1.04)",
            transform: "translateZ(0)",
          }}
        />
      ) : null}

      {learningMentorColdToken > 0 ? (
        <motion.div
          key={`mentor-cold-${learningMentorColdToken}`}
          initial={{ opacity: lightVfx ? 0.42 : 0.58 }}
          animate={{ opacity: 0 }}
          transition={{ duration: lightVfx ? 0.95 : 1.18, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            mixBlendMode: "color",
            background:
              "linear-gradient(168deg, rgba(34, 211, 238, 0.2) 0%, rgba(100, 116, 139, 0.42) 48%, rgba(15, 23, 42, 0.55) 100%)",
            transform: "translateZ(0)",
          }}
        />
      ) : null}

      {sentinelAbsorbToken > 0 ? (
        <motion.div
          key={`shield-bloom-${sentinelAbsorbToken}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, lightVfx ? 0.38 : 0.58, 0] }}
          transition={{ duration: lightVfx ? 0.32 : 0.42, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: "-2%",
            pointerEvents: "none",
            mixBlendMode: "screen",
            background:
              "radial-gradient(circle at 48% 52%, rgba(167,139,250,0.42) 0%, rgba(34,211,238,0.18) 38%, rgba(0,0,0,0) 72%)",
            filter: lightVfx ? "saturate(1.15)" : "saturate(1.35) brightness(1.08)",
            transform: "translateZ(0)",
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08 + singularityBoost * 0.11,
          mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
          backgroundSize: "220px 220px",
          willChange: "opacity",
        }}
      />

      {isSingularityActive ? (
        <>
          <motion.div
            aria-hidden
            animate={
              lightVfx
                ? {
                    opacity: [
                      0.05 * singularityBoost,
                      0.1 * singularityBoost,
                      0.06 * singularityBoost,
                    ],
                  }
                : {
                    opacity: [
                      0.07 * singularityBoost,
                      0.16 * singularityBoost,
                      0.09 * singularityBoost,
                      0.14 * singularityBoost,
                      0.08 * singularityBoost,
                    ],
                    skewX: ["0deg", "-0.6deg", "0.4deg", "0deg"],
                  }
            }
            transition={{
              duration: lightVfx ? 0.45 : 0.22,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              mixBlendMode: "screen",
              background:
                "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,0,80,0.09) 2px, rgba(255,0,80,0.09) 3px)",
              transform: "translateZ(0)",
            }}
          />
          <motion.div
            aria-hidden
            animate={{ x: lightVfx ? [0, -1, 0] : [0, -3, 2, -2, 0] }}
            transition={{ duration: lightVfx ? 0.55 : 0.14, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              mixBlendMode: "hard-light",
              background:
                "linear-gradient(92deg, rgba(255,0,60,0.14) 0%, transparent 35%, rgba(0,255,255,0.12) 62%, transparent 100%)",
              opacity: 0.55 * singularityBoost,
              transform: "translateZ(0)",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.14 * singularityBoost,
              mixBlendMode: "overlay",
              pointerEvents: "none",
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23g)' opacity='0.65'/%3E%3C/svg%3E\")",
              backgroundSize: lightVfx ? "140px 140px" : "100px 100px",
              transform: "translateZ(0)",
            }}
          />
        </>
      ) : null}

      {levelFive && (
        <>
          <motion.div
            animate={{ x: [0, -2, 2, -1, 1, 0] }}
            transition={{ duration: 0.16, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              mixBlendMode: "screen",
              background:
                "linear-gradient(90deg, rgba(255,0,51,0.12) 0%, rgba(0,255,255,0.08) 52%, rgba(0,68,255,0.12) 100%)",
              filter: "saturate(1.25) contrast(1.15)",
              transform: "translate3d(0,0,0)",
              willChange: "transform",
            }}
          />
          <motion.div
            animate={{ opacity: [0.06, 0.13, 0.07] }}
            transition={{ duration: 0.28, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              mixBlendMode: "overlay",
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='96' height='96' filter='url(%23n)' opacity='0.7'/%3E%3C/svg%3E\")",
              backgroundSize: "160px 160px",
              transform: "translate3d(0,0,0)",
            }}
          />
        </>
      )}

      {victoryFlashToken > 0 && (
        <motion.div
          key={`victory-flash-${victoryFlashToken}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.82, 0] }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at center, rgba(255,215,0,0.72) 0%, rgba(0,255,255,0.24) 45%, rgba(0,0,0,0) 78%)",
            mixBlendMode: "screen",
          }}
        />
      )}

      {synapticOverloadToken > 0 && (
        <motion.div
          key={`synaptic-overload-${synapticOverloadToken}`}
          initial={{ opacity: 0 }}
          animate={
            synapticOverloadActive
              ? { opacity: [0.55, 0.92, 0.62, 0.88], x: ["-0.35%", "0.35%", "-0.15%", "0%"] }
              : { opacity: 0 }
          }
          transition={{
            duration: synapticOverloadActive ? 0.48 : 0.22,
            ease: "easeInOut",
            repeat: synapticOverloadActive ? Infinity : 0,
            repeatType: "mirror",
          }}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            mixBlendMode: "screen",
            background:
              "linear-gradient(100deg, rgba(255,0,80,0.22) 0%, rgba(0,255,255,0.38) 38%, rgba(120,40,255,0.28) 100%)",
            filter: "saturate(1.65) contrast(1.22) hue-rotate(-8deg)",
          }}
        />
      )}

      {synapticOverloadActive ? (
        <motion.div
          aria-hidden
          animate={{ opacity: [0.12, 0.28, 0.14] }}
          transition={{ duration: 0.42, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            mixBlendMode: "overlay",
            background:
              "radial-gradient(circle at 50% 42%, rgba(0,255,255,0.2) 0%, rgba(0,0,0,0) 55%)",
            filter: "blur(0px)",
          }}
        />
      ) : null}

      {finisherFreezeActive && (
        <motion.div
          key="finisher-freeze"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.04 }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 36,
            pointerEvents: "none",
            mixBlendMode: "normal",
            backdropFilter: "contrast(1.62) saturate(1.42) brightness(1.08)",
            WebkitBackdropFilter: "contrast(1.62) saturate(1.42) brightness(1.08)",
            filter: "invert(1) contrast(2.05) saturate(1.45) brightness(1.06)",
          }}
        />
      )}

      {impactFlash ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 90,
            pointerEvents: "none",
            mixBlendMode: "normal",
            background: "rgba(255,255,255,0.94)",
            filter: "invert(1) brightness(1.85) contrast(1.35)",
            opacity: 0.88,
            transform: "translateZ(0)",
          }}
        />
      ) : null}
    </motion.div>
  );
}

export default PostProcessing;
