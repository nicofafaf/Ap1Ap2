import { useEffect, useRef } from "react";

type NeuralStaticOverlayProps = {
  active: boolean;
  className?: string;
};

/**
 * Leichtes analoges Rauschen per Canvas (niedrige Auflösung, skaliert) — schont GPU vs. Vollbild-Shader
 */
export function NeuralStaticOverlay({ active, className }: NeuralStaticOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!active) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const CSS_W = 320;
    const CSS_H = 180;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const dpr = 1;
    canvas.width = Math.floor(CSS_W * dpr);
    canvas.height = Math.floor(CSS_H * dpr);

    const cw = canvas.width;
    const ch = canvas.height;
    const cell = 3;

    const tick = () => {
      if (!activeRef.current) return;
      ctx.clearRect(0, 0, cw, ch);
      for (let y = 0; y < ch; y += cell) {
        for (let x = 0; x < cw; x += cell) {
          const n = Math.random();
          const a = 0.035 + n * 0.09;
          const g = 200 + Math.floor(n * 55);
          ctx.fillStyle = `rgba(${g},${g + 8},${g + 12},${a})`;
          ctx.fillRect(x, y, cell, cell);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        pointerEvents: "none",
        zIndex: 14,
        opacity: 0.72,
        mixBlendMode: "overlay",
      }}
    />
  );
}

export default NeuralStaticOverlay;
