import { useEffect, useRef } from "react";

type CriticalDebrisVFXProps = {
  criticalHitToken?: number | string;
  cameraZoom?: number;
};

type Fragment = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
};

export function CriticalDebrisVFX({ criticalHitToken, cameraZoom = 1 }: CriticalDebrisVFXProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const fragmentsRef = useRef<Fragment[]>([]);
  const pulseScaleRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      pulseScaleRef.current += (1 - pulseScaleRef.current) * 0.12;

      const next: Fragment[] = [];
      for (const f of fragmentsRef.current) {
        f.life -= 1;
        if (f.life <= 0) continue;
        f.x += f.vx;
        f.y += f.vy;
        f.vx *= 0.996;
        f.vy *= 0.996;
        const alpha = f.life / f.maxLife;
        const size = f.size * pulseScaleRef.current;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = f.color;
        ctx.fillRect(f.x, f.y, size, size);
        next.push(f);
      }
      ctx.globalAlpha = 1;
      fragmentsRef.current = next;
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (criticalHitToken == null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width * 0.5;
    const cy = rect.height * 0.5;
    const burstCount = 220;
    pulseScaleRef.current = 1 + Math.min(0.28, (cameraZoom - 1) * 1.4 + 0.12);
    const created: Fragment[] = [];
    for (let i = 0; i < burstCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8.5;
      const life = 20 + Math.floor(Math.random() * 26);
      created.push({
        x: cx + (Math.random() - 0.5) * 20,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        life,
        maxLife: life,
        color:
          i % 2 === 0
            ? "rgba(255, 83, 112, 0.92)"
            : "rgba(83, 244, 255, 0.92)",
      });
    }
    fragmentsRef.current = [...fragmentsRef.current, ...created].slice(-600);
  }, [criticalHitToken, cameraZoom]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        mixBlendMode: "color-dodge",
      }}
    />
  );
}

export default CriticalDebrisVFX;
