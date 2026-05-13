import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { FRACTAL_COMMAND_BG_MP4 } from "../lib/ui/fractalConstants";
import { FractalBeatBridge } from "../lib/ui/fractalBeatContext";
import {
  NX_FRACTAL_BOSS_DAMAGE,
  type FractalBossDamageDetail,
} from "../lib/combat/fractalAtmosphereEvents";
import {
  NX_VICTORY_ENERGY_WAVE,
  VICTORY_ENERGY_BRIGHTNESS_MULT,
  VICTORY_ENERGY_HOLD_MS,
  VICTORY_ENERGY_RELEASE_MS,
  VICTORY_FRAMER_SHARD_COUNT,
  type VictoryEnergyWaveDetail,
} from "../lib/combat/finishLogic";
import { NX_SPRING_PHYSICS } from "../lib/ui/textMotionPolicy";

const PARTICLE_SEED = [
  { x: 8, y: 12, s: 1.1 },
  { x: 18, y: 78, s: 0.85 },
  { x: 88, y: 22, s: 1 },
  { x: 42, y: 56, s: 0.9 },
  { x: 72, y: 88, s: 1.15 },
  { x: 55, y: 14, s: 0.75 },
  { x: 31, y: 91, s: 1 },
  { x: 94, y: 44, s: 0.95 },
  { x: 12, y: 48, s: 0.8 },
  { x: 63, y: 63, s: 1.05 },
  { x: 76, y: 28, s: 0.88 },
  { x: 25, y: 72, s: 0.92 },
  { x: 48, y: 38, s: 1 },
  { x: 91, y: 68, s: 0.82 },
  { x: 5, y: 88, s: 0.9 },
  { x: 58, y: 8, s: 1.12 },
  { x: 38, y: 84, s: 0.78 },
  { x: 82, y: 52, s: 1 },
  { x: 15, y: 30, s: 0.86 },
  { x: 67, y: 41, s: 0.94 },
];

function HoloParticle({
  px,
  py,
  sc,
  index,
  sx,
  sy,
}: {
  px: number;
  py: number;
  sc: number;
  index: number;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
}) {
  const tx = useTransform(sx, (v) => v * (0.35 + (index % 5) * 0.08));
  const ty = useTransform(sy, (v) => v * (0.35 + (index % 3) * 0.1));
  return (
    <motion.div
      className="nx-fractal-particle"
      style={{
        left: `${px}%`,
        top: `${py}%`,
        scale: sc,
        x: tx,
        y: ty,
      }}
    />
  );
}

function HologramParticles({
  burstActive,
  burstPointerMul,
}: {
  burstActive: boolean;
  burstPointerMul: number;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const burstRef = useRef(burstActive);
  burstRef.current = burstActive;
  const mulRef = useRef(burstPointerMul);
  mulRef.current = burstPointerMul;
  const sx = useSpring(mx, NX_SPRING_PHYSICS);
  const sy = useSpring(my, NX_SPRING_PHYSICS);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      const mul = burstRef.current ? mulRef.current : 1;
      mx.set(nx * 28 * mul);
      my.set(ny * 22 * mul);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  return (
    <div className="nx-fractal-particle-layer" aria-hidden>
      {PARTICLE_SEED.map((p, i) => (
        <HoloParticle key={i} px={p.x} py={p.y} sc={p.s} index={i} sx={sx} sy={sy} />
      ))}
    </div>
  );
}

function VictoryFramerShards({ token }: { token: number }) {
  const shards = useMemo(() => {
    return Array.from({ length: VICTORY_FRAMER_SHARD_COUNT }, (_, i) => {
      const ang = (Math.PI * 2 * i) / VICTORY_FRAMER_SHARD_COUNT + (Math.random() - 0.5) * 0.65;
      const dist = 380 + Math.random() * 540;
      return {
        tx: Math.cos(ang) * dist,
        ty: Math.sin(ang) * dist,
        rot: (Math.random() - 0.5) * 920,
        w: 14 + Math.random() * 36,
        h: 22 + Math.random() * 52,
      };
    });
  }, [token]);

  return (
    <div className="nx-fractal-victory-shards" aria-hidden>
      {shards.map((s, i) => (
        <motion.div
          key={`${token}-${i}`}
          initial={{ x: 0, y: 0, opacity: 0.92, rotate: 0, scale: 1 }}
          animate={{
            x: s.tx,
            y: s.ty,
            rotate: s.rot,
            opacity: 0,
            scale: 0.35,
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 10,
            mass: 0.55,
          }}
          style={{
            position: "absolute",
            left: "50%",
            top: "48%",
            width: s.w,
            height: s.h,
            marginLeft: -s.w / 2,
            marginTop: -s.h / 2,
            borderRadius: 3,
            background:
              "linear-gradient(145deg, rgba(247,244,236,0.48) 0%, rgba(212,175,55,0.32) 38%, rgba(15,23,42,0.55) 100%)",
            border: "1px solid rgba(247,244,236,0.42)",
            boxShadow:
              "0 0 32px rgba(212,175,55,0.42), 0 0 18px rgba(34,211,238,0.2), inset 0 0 12px rgba(255,255,255,0.22)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        />
      ))}
    </div>
  );
}

/** Volumetric Light Leaks — langsame Radials, overlay, Elfenbein/Gold-Nebel */
function VolumetricLightLeaks() {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className="nx-volumetric-leaks"
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: "var(--nx-z-bg-fx)",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <motion.div
        animate={
          reduceMotion
            ? { x: "-10%", y: "-8%" }
            : {
                x: ["-10%", "14%", "-6%", "-10%"],
                y: ["-8%", "6%", "10%", "-8%"],
              }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 52, repeat: Infinity, ease: "linear" }
        }
        style={{
          position: "absolute",
          width: "88vmin",
          height: "88vmin",
          left: "6%",
          top: "18%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 44% 46%, rgba(247,244,236,0.1) 0%, rgba(247,244,236,0.02) 40%, transparent 64%)",
          mixBlendMode: "overlay",
          filter: "blur(42px)",
        }}
      />
      <motion.div
        animate={
          reduceMotion
            ? { x: "10%", y: "6%" }
            : {
                x: ["10%", "-8%", "8%", "10%"],
                y: ["6%", "-12%", "4%", "6%"],
              }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 64, repeat: Infinity, ease: "linear" }
        }
        style={{
          position: "absolute",
          width: "78vmin",
          height: "78vmin",
          right: "4%",
          bottom: "12%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 56% 54%, rgba(212,175,55,0.065) 0%, rgba(247,244,236,0.025) 44%, transparent 68%)",
          mixBlendMode: "overlay",
          filter: "blur(52px)",
        }}
      />
    </div>
  );
}

type FractalDepthRootProps = {
  children: React.ReactNode;
};

const SHARD_RATTLE_INTENSITY_THRESHOLD = 0.38;

/** The_Collapse: Hintergrund explodiert in Unschärfe */
const COLLAPSE_BLUR_PX = 100;

export function FractalDepthRoot({ children }: FractalDepthRootProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const gameState = useGameStore((s) => s.gameState);
  const nexusChrome = useGameStore((s) => s.nexusChrome);
  const victoryFinisherPhase = useGameStore((s) => s.victoryFinisherPhase);
  const victoryFinisherToken = useGameStore((s) => s.victoryFinisherToken);
  const victoryFinisherComplete = useGameStore((s) => s.victoryFinisherComplete);

  const combatHot =
    gameState === "STARTING" || gameState === "FIGHTING" || gameState === "VICTORY";

  const edtechAtmosphere = nexusChrome === "edtech" && !combatHot;

  useEffect(() => {
    document.documentElement.dataset.nxChrome = nexusChrome;
  }, [nexusChrome]);

  const fractalCollapse =
    gameState === "VICTORY" &&
    (victoryFinisherPhase === "implode" ||
      victoryFinisherPhase === "freeze" ||
      victoryFinisherPhase === "shatter");

  const showVictoryShards =
    gameState === "VICTORY" &&
    victoryFinisherToken > 0 &&
    !victoryFinisherComplete &&
    victoryFinisherPhase !== "idle";

  const [damageBurst, setDamageBurst] = useState(false);
  const [burstIntensity, setBurstIntensity] = useState(0);
  const [burstLastDamage, setBurstLastDamage] = useState(0);
  const [burstDurationMs, setBurstDurationMs] = useState(280);
  const [burstParticleMul, setBurstParticleMul] = useState(5);
  const [energyMul, setEnergyMul] = useState(1);
  const [energyReleaseMs, setEnergyReleaseMs] = useState(VICTORY_ENERGY_RELEASE_MS);
  const [fractalVideoMissing, setFractalVideoMissing] = useState(false);
  const burstGenRef = useRef(0);
  const burstEndTimeoutRef = useRef<number | null>(null);
  const energyTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (v) {
        v.pause();
        v.removeAttribute("src");
        v.load();
      }
    };
  }, []);

  useEffect(() => {
    const onBossDamage = (ev: Event) => {
      const ce = ev as CustomEvent<FractalBossDamageDetail | undefined>;
      const intensity = Math.min(
        1,
        Math.max(0, ce.detail?.intensity ?? 0.35)
      );
      const lastDamage = Math.max(0, ce.detail?.lastDamage ?? 0);
      const duration = 280 + Math.round(intensity * 100);
      const particleMul = Math.min(
        12,
        Math.max(4, 4 + intensity * 7 + (lastDamage > 0 ? Math.min(2, lastDamage * 0.04) : 0))
      );

      burstGenRef.current += 1;
      const gen = burstGenRef.current;
      setBurstIntensity(intensity);
      setBurstLastDamage(lastDamage);
      setBurstDurationMs(duration);
      setBurstParticleMul(particleMul);
      setDamageBurst(true);

      const doc = document.documentElement;
      if (intensity >= SHARD_RATTLE_INTENSITY_THRESHOLD) {
        doc.dataset.nxFractalShardRattle = intensity.toFixed(3);
      }

      if (burstEndTimeoutRef.current !== null) {
        window.clearTimeout(burstEndTimeoutRef.current);
      }
      burstEndTimeoutRef.current = window.setTimeout(() => {
        burstEndTimeoutRef.current = null;
        if (burstGenRef.current === gen) {
          setDamageBurst(false);
          delete doc.dataset.nxFractalShardRattle;
        }
      }, duration);
    };
    window.addEventListener(NX_FRACTAL_BOSS_DAMAGE, onBossDamage);
    return () => {
      window.removeEventListener(NX_FRACTAL_BOSS_DAMAGE, onBossDamage);
      if (burstEndTimeoutRef.current !== null) {
        window.clearTimeout(burstEndTimeoutRef.current);
        burstEndTimeoutRef.current = null;
      }
      delete document.documentElement.dataset.nxFractalShardRattle;
    };
  }, []);

  useEffect(() => {
    const onWave = (ev: Event) => {
      const d = (ev as CustomEvent<VictoryEnergyWaveDetail>).detail;
      const peak = Math.min(
        8,
        Math.max(1, d?.brightnessMult ?? VICTORY_ENERGY_BRIGHTNESS_MULT)
      );
      const hold = d?.holdMs ?? VICTORY_ENERGY_HOLD_MS;
      const release = d?.releaseMs ?? VICTORY_ENERGY_RELEASE_MS;
      energyTimersRef.current.forEach((id) => window.clearTimeout(id));
      energyTimersRef.current = [];
      setEnergyReleaseMs(release);
      setEnergyMul(peak);
      const t = window.setTimeout(() => {
        setEnergyMul(1);
      }, hold);
      energyTimersRef.current.push(t);
    };
    window.addEventListener(NX_VICTORY_ENERGY_WAVE, onWave);
    return () => {
      window.removeEventListener(NX_VICTORY_ENERGY_WAVE, onWave);
      energyTimersRef.current.forEach((id) => window.clearTimeout(id));
      energyTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (gameState !== "VICTORY") {
      setEnergyMul(1);
    }
  }, [gameState]);

  const { br, ct } = useMemo(() => {
    const baseB = combatHot ? 0.28 : 0.24;
    const baseC = combatHot ? 0.98 : 0.92;
    if (damageBurst) {
      const hitB = 0.48 + burstIntensity * 0.36;
      return {
        br: Math.min(0.84, Math.max(0.42, hitB)),
        ct: Math.min(1.08, Math.max(0.94, 0.98 + burstIntensity * 0.08)),
      };
    }
    return { br: baseB, ct: baseC };
  }, [combatHot, damageBurst, burstIntensity]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--nx-bg-brightness", String(br));
    root.style.setProperty("--nx-bg-contrast", String(ct));
  }, [br, ct]);

  const litBrightness = Math.min(1.2, Math.max(0.08, br * energyMul));
  const blurPx = fractalCollapse ? COLLAPSE_BLUR_PX : 0;
  const bgFilterTransitionMs = fractalCollapse ? 520 : energyReleaseMs;
  const voidAtmosphereFilter = `saturate(0.34) sepia(0.12) hue-rotate(-12deg)`;

  const shakeX = Math.min(26, Math.max(2, burstLastDamage * 0.2 + burstIntensity * 10));
  const shakeY = shakeX * 0.72;
  const burstDurationSec = burstDurationMs / 1000;

  return (
    <FractalBeatBridge videoRef={videoRef}>
      <motion.div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: "var(--nx-z-bg)",
          pointerEvents: "none",
          transformOrigin: "50% 48%",
        }}
        animate={{ scale: fractalCollapse ? 0.2 : 1 }}
        transition={{ duration: 0.48, ease: [0.76, 0, 0.88, 0.12] }}
      >
        {edtechAtmosphere ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              pointerEvents: "none",
              background:
                "linear-gradient(180deg, rgba(248,250,252,0.94) 0%, rgba(241,245,249,0.9) 40%, rgba(248,250,252,0.93) 100%)",
            }}
          />
        ) : null}
        {fractalVideoMissing ? (
          <div
            aria-hidden
            className="nx-fractal-bg-fallback"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              filter: `brightness(${litBrightness}) contrast(${ct}) blur(${blurPx}px) ${voidAtmosphereFilter}`,
              transition: `filter ${bgFilterTransitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            }}
          />
        ) : null}
        <video
          ref={videoRef}
          className="nx-fractal-bg-video"
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
            filter: `brightness(${litBrightness}) contrast(${ct}) blur(${blurPx}px) ${voidAtmosphereFilter}`,
            transition: `filter ${bgFilterTransitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            setFractalVideoMissing(true);
          }}
        />
      </motion.div>
      <VolumetricLightLeaks />
      {showVictoryShards ? (
        <VictoryFramerShards token={victoryFinisherToken} />
      ) : null}
      <HologramParticles
        burstActive={damageBurst}
        burstPointerMul={burstParticleMul}
      />
      <motion.div
        className="nx-fractal-foreground"
        animate={
          damageBurst
            ? {
                x: [0, -shakeX, shakeX * 0.92, -shakeX * 0.55, shakeX * 0.28, 0],
                y: [0, shakeY * 0.55, -shakeY * 0.42, shakeY * 0.3, 0],
              }
            : { x: 0, y: 0 }
        }
        transition={{
          duration: Math.max(0.18, burstDurationSec * 0.92),
          ease: "easeOut",
        }}
        style={{ willChange: "transform" }}
      >
        {children}
      </motion.div>
    </FractalBeatBridge>
  );
}
