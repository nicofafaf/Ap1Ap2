import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type BossHealthBarProps = {
  currentBossHP: number;
  maxBossHP: number;
  damagePulseToken?: number | string;
  primaryColor: string;
  accentColor: string;
  fragmentBurstCount?: number;
  cameraZoom?: number;
  isCriticalPhase?: boolean;
};

type Fragment = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  ttl: number;
};

export function BossHealthBar({
  currentBossHP,
  maxBossHP,
  damagePulseToken,
  primaryColor,
  accentColor,
  fragmentBurstCount = 10,
  cameraZoom = 1,
  isCriticalPhase = false,
}: BossHealthBarProps) {
  const [ghostRatio, setGhostRatio] = useState(1);
  const [glitchOn, setGlitchOn] = useState(false);
  const prevRatioRef = useRef(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const fragmentsRef = useRef<Fragment[]>([]);

  const hpRatio = useMemo(
    () =>
      maxBossHP > 0
        ? Math.max(0, Math.min(1, currentBossHP / maxBossHP))
        : 0,
    [currentBossHP, maxBossHP]
  );

  const hpRatioRef = useRef(hpRatio);
  hpRatioRef.current = hpRatio;

  useEffect(() => {
    if (hpRatio < prevRatioRef.current) {
      setGhostRatio(prevRatioRef.current);
    }
    prevRatioRef.current = hpRatio;
  }, [hpRatio]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setGhostRatio(hpRatio);
    }, 70);
    return () => window.clearTimeout(timer);
  }, [hpRatio]);

  useEffect(() => {
    if (damagePulseToken == null) return;
    setGlitchOn(true);
    const timer = window.setTimeout(() => setGlitchOn(false), 220);
    return () => window.clearTimeout(timer);
  }, [damagePulseToken]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const holder = containerRef.current;
    if (!canvas || !holder) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = holder.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * window.devicePixelRatio));
      canvas.height = Math.max(
        1,
        Math.floor(rect.height * window.devicePixelRatio)
      );
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const spawnFragments = () => {
      const rect = holder.getBoundingClientRect();
      const edgeX = rect.width * hpRatioRef.current;
      const amount = isCriticalPhase
        ? Math.max(8, Math.min(96, Math.round(fragmentBurstCount * 2)))
        : Math.max(4, Math.min(56, fragmentBurstCount));
      for (let i = 0; i < amount; i += 1) {
        fragmentsRef.current.push({
          x: edgeX + (Math.random() - 0.5) * 14,
          y: 8 + Math.random() * 14,
          vx: (Math.random() - 0.5) * 0.9,
          vy: 0.35 + Math.random() * 1.25,
          size: 1 + Math.random() * 2.4,
          life: 0,
          ttl: 28 + Math.random() * 24,
        });
      }
      if (fragmentsRef.current.length > 240) {
        fragmentsRef.current.splice(0, fragmentsRef.current.length - 240);
      }
    };

    resize();
    if (damagePulseToken != null) {
      spawnFragments();
    }

    const loop = () => {
      if (fragmentsRef.current.length === 0) {
        frameRef.current = null;
        return;
      }
      const rect = holder.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      for (let i = fragmentsRef.current.length - 1; i >= 0; i -= 1) {
        const f = fragmentsRef.current[i];
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.04;
        f.life += 1;
        if (f.life >= f.ttl || f.y > h + 10) {
          fragmentsRef.current.splice(i, 1);
          continue;
        }
        const alpha = Math.max(0, 1 - f.life / f.ttl);
        ctx.globalAlpha = alpha * 0.95;
        ctx.fillStyle = primaryColor;
        ctx.fillRect(f.x, f.y, f.size, f.size);
      }
      ctx.globalAlpha = 1;
      frameRef.current = window.requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(holder);

    if (fragmentsRef.current.length > 0) {
      frameRef.current = window.requestAnimationFrame(loop);
    }

    return () => {
      observer.disconnect();
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [damagePulseToken, fragmentBurstCount, primaryColor, isCriticalPhase]);

  return (
    <motion.div
      style={{
        position: "relative",
        width: "min(880px, calc(100vw - 120px))",
        margin: "0 auto",
        transformOrigin: "center center",
        transform: `translateZ(0) scale(${1 + (cameraZoom - 1) * 0.35})`,
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "relative",
          height: 30,
          borderRadius: 999,
          overflow: "hidden",
          border: "1px solid rgba(125, 211, 252, 0.45)",
          background:
            "linear-gradient(180deg, rgba(5,16,24,0.72) 0%, rgba(5,12,20,0.88) 100%)",
          backdropFilter: "blur(6px)",
          boxShadow: "inset 0 0 14px rgba(34,211,238,0.18)",
        }}
      >
        <motion.div
          animate={{ width: `${ghostRatio * 100}%` }}
          transition={{ duration: 0.72, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            width: `${ghostRatio * 100}%`,
            background:
              "linear-gradient(90deg, rgba(248,113,113,0.42) 0%, rgba(239,68,68,0.35) 100%)",
            mixBlendMode: "screen",
          }}
        />

        <motion.div
          animate={{ width: `${hpRatio * 100}%` }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            width: `${hpRatio * 100}%`,
            background: `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%)`,
            boxShadow: "0 0 24px rgba(34,211,238,0.45)",
            filter: isCriticalPhase
              ? "hue-rotate(-35deg) brightness(1.22)"
              : "none",
          }}
        />

        <motion.div
          animate={{ opacity: [0.38, 0.9, 0.38] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 45%, rgba(255,255,255,0) 100%)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            mixBlendMode: "screen",
          }}
        />
      </div>

      <motion.div
        aria-hidden="true"
        animate={
          glitchOn
            ? { opacity: [0, 0.68, 0], x: [0, -2, 2, 0] }
            : { opacity: 0, x: 0 }
        }
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 999,
          pointerEvents: "none",
          background:
            "linear-gradient(90deg, rgba(255, 50, 60, 0.35) 0%, rgba(255, 110, 110, 0.22) 100%)",
          filter: "hue-rotate(-14deg) brightness(1.35)",
          mixBlendMode: "screen",
        }}
      />

      {isCriticalPhase && (
        <motion.div
          aria-hidden="true"
          animate={{ opacity: [0.2, 0.75, 0.2], x: [0, -1, 1, 0] }}
          transition={{ duration: 0.28, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            pointerEvents: "none",
            background:
              "linear-gradient(90deg, rgba(255, 46, 66, 0.26) 0%, rgba(181, 79, 255, 0.18) 100%)",
            filter: "hue-rotate(-20deg) brightness(1.35)",
            mixBlendMode: "screen",
          }}
        />
      )}
    </motion.div>
  );
}

export default BossHealthBar;
