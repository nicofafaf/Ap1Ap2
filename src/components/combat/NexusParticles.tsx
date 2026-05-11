import { useEffect, useRef } from "react";
import { useGameStore } from "../../store/useGameStore";

type NexusParticlesProps = {
  primaryColor: string;
  accentColor: string;
  damagePulseToken?: number | string;
  isVictory?: boolean;
  lootTarget?: { x: number; y: number };
  particleDensity?: "LOW" | "MEDIUM" | "HIGH";
  /** Kurz zum Boss-Zentrum (Zero-Point) während Finisher-Implosion */
  victoryFinisherZeroPoint?: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  ttl: number;
  color: string;
};

export function NexusParticles({
  primaryColor,
  accentColor,
  damagePulseToken,
  isVictory = false,
  lootTarget = { x: 0.88, y: 0.82 },
  particleDensity = "MEDIUM",
  victoryFinisherZeroPoint = false,
}: NexusParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const accelRef = useRef(1);
  const frameRef = useRef<number | null>(null);
  const victoryStartMsRef = useRef<number | null>(null);

  useEffect(() => {
    accelRef.current = 2.7;
    const timer = window.setTimeout(() => {
      accelRef.current = 1;
    }, 260);
    return () => {
      window.clearTimeout(timer);
    };
  }, [damagePulseToken]);

  useEffect(() => {
    victoryStartMsRef.current = isVictory ? performance.now() : null;
  }, [isVictory]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * window.devicePixelRatio));
      canvas.height = Math.max(
        1,
        Math.floor(rect.height * window.devicePixelRatio)
      );
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    resize();

    const spawn = (w: number, h: number) => {
      const count =
        particleDensity === "HIGH" ? 28 : particleDensity === "LOW" ? 10 : 18;
      for (let i = 0; i < count; i += 1) {
        particlesRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.38,
          vy: -0.25 - Math.random() * 0.45,
          size: 1 + Math.random() * 2.6,
          life: 0,
          ttl: 240 + Math.random() * 200,
          color: Math.random() > 0.42 ? primaryColor : accentColor,
        });
      }
      const cap =
        particleDensity === "HIGH" ? 220 : particleDensity === "LOW" ? 90 : 150;
      if (particlesRef.current.length > cap) {
        particlesRef.current.splice(0, particlesRef.current.length - cap);
      }
    };

    let t = 0;
    const loop = () => {
      const rect = parent.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (useGameStore.getState().readabilityMode) {
        particlesRef.current = [];
        ctx.clearRect(0, 0, w, h);
        frameRef.current = window.requestAnimationFrame(loop);
        return;
      }
      t += 1;
      if (!isVictory && t % 3 === 0) spawn(w, h);

      ctx.clearRect(0, 0, w, h);
      for (let i = particlesRef.current.length - 1; i >= 0; i -= 1) {
        const p = particlesRef.current[i];
        const boost = accelRef.current;
        if (isVictory && victoryFinisherZeroPoint && victoryStartMsRef.current != null) {
          const elapsed = performance.now() - victoryStartMsRef.current;
          const progress = Math.max(0, Math.min(1, elapsed / 320));
          const ease = progress * progress;
          const tx = w * 0.5;
          const ty = h * 0.52;
          const pull = 0.05 + ease * 0.52;
          p.x += (tx - p.x) * pull;
          p.y += (ty - p.y) * pull;
          p.life += 2.2 + ease * 3.4;
        } else if (isVictory && victoryStartMsRef.current != null) {
          const elapsed = performance.now() - victoryStartMsRef.current;
          const progress = Math.max(0, Math.min(1, elapsed / 1500));
          const easeExpo = progress <= 0 ? 0 : Math.pow(2, 10 * (progress - 1));
          const tx = w * lootTarget.x;
          const ty = h * lootTarget.y;
          p.x += (tx - p.x) * (0.012 + easeExpo * 0.18);
          p.y += (ty - p.y) * (0.012 + easeExpo * 0.18);
          p.life += 1.4 + easeExpo * 2.2;
        } else {
          p.x += p.vx * boost;
          p.y += p.vy * boost;
          p.life += 1;
        }
        const txZone = victoryFinisherZeroPoint ? w * 0.5 : w * lootTarget.x;
        const tyZone = victoryFinisherZeroPoint ? h * 0.52 : h * lootTarget.y;
        const zoneR = victoryFinisherZeroPoint ? 14 : 8;
        const reachedLootZone =
          isVictory && Math.abs(p.x - txZone) < zoneR && Math.abs(p.y - tyZone) < zoneR;
        if (
          p.life >= p.ttl ||
          p.y < -10 ||
          p.x < -10 ||
          p.x > w + 10 ||
          reachedLootZone
        ) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        const alpha = Math.max(0, 1 - p.life / p.ttl);
        ctx.globalAlpha = alpha * 0.78;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      frameRef.current = window.requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(() => resize());
    observer.observe(parent);
    frameRef.current = window.requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [
    primaryColor,
    accentColor,
    isVictory,
    lootTarget,
    particleDensity,
    victoryFinisherZeroPoint,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        mixBlendMode: "screen",
        filter: "blur(0.2px) saturate(1.1)",
        transform: "translateZ(0)",
        opacity: "var(--nx-readability-particles, 1)",
      }}
    />
  );
}

export default NexusParticles;
