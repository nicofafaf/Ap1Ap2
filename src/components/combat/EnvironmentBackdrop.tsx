import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";

type EnvironmentBackdropProps = {
  currentCombatPhase: 1 | 2;
  isTransitioning: boolean;
  cameraShake: number;
  combatPhaseTransitionToken: number;
  isSingularityActive?: boolean;
};

type Debris = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  hue: number;
};

const GRID_LINE_COUNT = 22;

function initDebris(w: number, h: number, count: number): Debris[] {
  const out: Debris[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push({
      x: Math.random() * w,
      y: Math.random() * h,
      w: 4 + Math.random() * 22,
      h: 2 + Math.random() * 10,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.42,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.018,
      hue: Math.random() > 0.5 ? 187 : 265,
    });
  }
  return out;
}

export function EnvironmentBackdrop({
  currentCombatPhase,
  isTransitioning,
  cameraShake,
  combatPhaseTransitionToken,
  isSingularityActive = false,
}: EnvironmentBackdropProps) {
  const readabilityMode = useGameStore((s) => s.readabilityMode);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debrisRef = useRef<Debris[]>([]);
  const rafRef = useRef<number | null>(null);
  const flashRef = useRef(0);
  const prevShakeRef = useRef(0);
  const prevTokenRef = useRef(0);

  const mode = useMemo(() => {
    if (isTransitioning) return "transition" as const;
    if (currentCombatPhase === 2) return "void" as const;
    return "grid" as const;
  }, [isTransitioning, currentCombatPhase]);

  const gridLines = useMemo(
    () =>
      Array.from({ length: GRID_LINE_COUNT }, (_, i) => ({
        id: i,
        isHorizontal: i % 2 === 0,
        offset: (i / GRID_LINE_COUNT) * 100,
        delay: i * 0.02,
      })),
    []
  );

  useEffect(() => {
    if (combatPhaseTransitionToken === 0) {
      prevTokenRef.current = 0;
      return;
    }
    if (combatPhaseTransitionToken !== prevTokenRef.current) {
      prevTokenRef.current = combatPhaseTransitionToken;
      flashRef.current = 1;
    }
  }, [combatPhaseTransitionToken]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode === "grid" || readabilityMode) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (canvas && readabilityMode) {
        const c2 = canvas.getContext("2d");
        if (c2) {
          c2.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const { clientWidth, clientHeight } = parent;
      canvas.width = Math.floor(clientWidth * dpr);
      canvas.height = Math.floor(clientHeight * dpr);
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (debrisRef.current.length === 0) {
        debrisRef.current = initDebris(clientWidth, clientHeight, 88);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    const parentEl = canvas.parentElement;
    if (parentEl) ro.observe(parentEl);

    const tick = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const cw = parent.clientWidth;
      const ch = parent.clientHeight;

      if (cameraShake > 0 && prevShakeRef.current === 0) {
        for (const d of debrisRef.current) {
          d.vx += (Math.random() - 0.5) * 6.2;
          d.vy += (Math.random() - 0.5) * 5.4;
        }
      }
      prevShakeRef.current = cameraShake;

      ctx.fillStyle = "rgba(0,2,6,0.42)";
      ctx.fillRect(0, 0, cw, ch);

      flashRef.current *= 0.92;
      if (Math.random() < 0.04 + flashRef.current * 0.12) {
        ctx.fillStyle = `rgba(220, 240, 255, ${0.04 + Math.random() * 0.09})`;
        ctx.fillRect(Math.random() * cw * 0.9, Math.random() * ch * 0.85, 40 + Math.random() * 120, 2);
      }

      for (const d of debrisRef.current) {
        d.x += d.vx;
        d.y += d.vy;
        d.rot += d.vr;
        d.vx *= 0.997;
        d.vy *= 0.997;
        if (d.x < -40) d.x = cw + 20;
        if (d.x > cw + 40) d.x = -20;
        if (d.y < -40) d.y = ch + 20;
        if (d.y > ch + 40) d.y = -20;

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);
        ctx.fillStyle = `hsla(${d.hue}, 82%, 58%, 0.21)`;
        ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      ro.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [mode, cameraShake, readabilityMode]);

  useEffect(() => {
    if (mode === "grid") {
      debrisRef.current = [];
    }
  }, [mode]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <AnimatePresence mode="sync">
        {(mode === "grid" || mode === "transition") && (
          <motion.div
            key="cyber-grid"
            initial={{ opacity: 1 }}
            animate={{
              opacity: mode === "transition" ? 0 : 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: mode === "transition" ? 0.85 : 0.35, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(4, 14, 22, 0.72)",
              backgroundImage: `
                linear-gradient(rgba(34, 211, 238, 0.11) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 211, 238, 0.11) 1px, transparent 1px)
              `,
              backgroundSize: "56px 56px",
            }}
          >
            <motion.div
              animate={{
                backgroundPosition: isSingularityActive
                  ? ["0px 56px", "0px -56px"]
                  : ["0px 0px", "56px 56px"],
              }}
              transition={{
                duration: isSingularityActive ? 2.8 : 42,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
                  linear-gradient(rgba(34, 211, 238, 0.11) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(34, 211, 238, 0.11) 1px, transparent 1px)
                `,
                backgroundSize: "56px 56px",
                opacity: isSingularityActive ? 0.95 : 0.85,
              }}
            />
            {!readabilityMode ? (
              <>
                <motion.div
                  className="nx-backdrop-sweep"
                  animate={{ x: ["-10%", "110%"] }}
                  transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                  style={{
                    position: "absolute",
                    inset: "0 0 40%",
                    background:
                      "linear-gradient(100deg, transparent 0%, rgba(34,211,238,0.08) 40%, rgba(125,211,252,0.12) 50%, rgba(34,211,238,0.08) 60%, transparent 100%)",
                    filter: "blur(1px)",
                  }}
                />
                <motion.div
                  className="nx-backdrop-sweep"
                  animate={{ x: ["108%", "-12%"] }}
                  transition={{ duration: 19, repeat: Infinity, ease: "linear" }}
                  style={{
                    position: "absolute",
                    inset: "35% 0 0",
                    background:
                      "linear-gradient(260deg, transparent 0%, rgba(56,189,248,0.06) 45%, rgba(34,211,238,0.1) 50%, rgba(56,189,248,0.06) 55%, transparent 100%)",
                    filter: "blur(1.5px)",
                  }}
                />
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mode === "transition" && (
          <motion.div
            key="shatter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ position: "absolute", inset: 0 }}
          >
            {gridLines.map((line) => {
              const spreadX = 40 + (line.id * 47) % 80;
              const spreadY = 60 + (line.id * 31) % 100;
              return (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0.55, x: 0, y: 0, rotate: 0, scale: 1 }}
                  animate={{
                    opacity: 0,
                    x: (line.id % 3 === 0 ? 1 : -1) * spreadX,
                    y: (line.isHorizontal ? -1 : 1) * spreadY,
                    rotate: line.isHorizontal
                      ? line.id % 2 === 0
                        ? 18
                        : -22
                      : line.id % 2 === 0
                        ? -16
                        : 20,
                    scale: 0.3,
                  }}
                  transition={{
                    duration: 1.15,
                    delay: line.delay,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    position: "absolute",
                    left: line.isHorizontal ? `${line.offset}%` : `${(line.id * 7) % 92}%`,
                    top: line.isHorizontal ? `${(line.id * 11) % 88}%` : `${line.offset}%`,
                    width: line.isHorizontal ? `${18 + (line.id % 5) * 8}%` : 2,
                    height: line.isHorizontal ? 2 : `${12 + (line.id % 4) * 6}%`,
                    background: "rgba(34, 211, 238, 0.55)",
                    boxShadow: "0 0 12px rgba(34,211,238,0.35)",
                    borderRadius: 1,
                    transformOrigin: "center center",
                  }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{
          opacity: mode === "void" || mode === "transition" ? 1 : 0,
        }}
        transition={{ duration: mode === "transition" ? 1.1 : 0.45, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(12, 18, 32, 0.2) 0%, rgba(0, 0, 0, 0.94) 62%, #000 100%)",
          pointerEvents: "none",
        }}
      />

      {(mode === "void" || mode === "transition") && (
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            mixBlendMode: "screen",
            opacity: readabilityMode ? 0 : mode === "transition" ? 0.92 : 1,
          }}
        />
      )}

      {isSingularityActive && mode === "void" && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            backgroundColor: "rgba(3, 8, 14, 0.42)",
            backgroundImage: `
              linear-gradient(rgba(255, 80, 120, 0.09) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
            pointerEvents: "none",
          }}
        >
          <motion.div
            animate={{ backgroundPosition: ["0px 48px", "0px -48px"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(255, 80, 120, 0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 211, 238, 0.09) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
              opacity: 0.85,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

export default EnvironmentBackdrop;
