import { motion } from "framer-motion";
import { useMemo } from "react";

type VictoryScreenProps = {
  children: React.ReactNode;
};

/** Data_Ascension: Geist Mono Gold-Regen */
function GhostDataColumns() {
  const columns = useMemo(() => {
    return Array.from({ length: 16 }, (_, col) => {
      const digits = Array.from({ length: 32 }, () =>
        String(Math.floor(Math.random() * 10))
      );
      const delay = col * 0.07;
      const duration = 12 + (col % 6) * 2.4;
      return { col, digits, delay, duration };
    });
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {columns.map(({ col, digits, delay, duration }) => (
        <motion.div
          key={col}
          initial={{ y: "-14%" }}
          animate={{ y: "118%" }}
          transition={{
            duration,
            repeat: Infinity,
            ease: "linear",
            delay,
          }}
          style={{
            position: "absolute",
            left: `${2.5 + col * 6.1}%`,
            top: 0,
            width: "1.15em",
            display: "flex",
            flexDirection: "column",
            gap: 11,
            fontFamily:
              '"Geist Mono","JetBrains Mono","SF Mono",ui-monospace,Menlo,Monaco,Consolas,monospace',
            fontSize: 14,
            fontWeight: 300,
            letterSpacing: "0.06em",
            color: "rgba(212, 175, 55, 0.11)",
            textShadow: `0 0 22px rgba(247, 244, 236, 0.14), 0 0 40px rgba(212, 175, 55, 0.09)`,
            userSelect: "none",
          }}
        >
          {digits.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

/** Chromatic_Shift: Cyan aus Ascension-Weißgold */
function ChromaticAscensionWash() {
  return (
    <>
      <motion.div
        aria-hidden
        initial={{ opacity: 0.45 }}
        animate={{ opacity: [0.45, 0.08, 0] }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          mixBlendMode: "screen",
          background:
            "radial-gradient(ellipse 90% 74% at 50% 40%, rgba(34,211,238,0.38) 0%, rgba(6,182,212,0.1) 48%, transparent 74%)",
        }}
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.72, 0.38, 0.26] }}
        transition={{ duration: 2.6, ease: "easeInOut", delay: 0.08 }}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          mixBlendMode: "soft-light",
          background: `linear-gradient(
            168deg,
            rgba(247,244,236,0.78) 0%,
            rgba(212,175,55,0.36) 34%,
            rgba(255,252,245,0.52) 68%,
            rgba(247,244,236,0.16) 100%
          )`,
        }}
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.18, 0.12] }}
        transition={{ duration: 3.2, ease: "easeOut", delay: 0.4 }}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          mixBlendMode: "overlay",
          background: `radial-gradient(ellipse 120% 80% at 50% 45%, rgba(255,255,255,0.35) 0%, transparent 62%)`,
        }}
      />
    </>
  );
}

/**
 * KINETIC_VICTORY_ASCENSION — Data-Stream, Weißgold-Raum, Shard-Glas für VictoryStats
 */
export function VictoryScreen({ children }: VictoryScreenProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 59,
        pointerEvents: "none",
        background: `radial-gradient(ellipse 140% 100% at 50% 20%, rgba(247,244,236,0.06) 0%, rgba(4,10,18,0.55) 55%, rgba(2,6,12,0.92) 100%)`,
      }}
    >
      <GhostDataColumns />
      <ChromaticAscensionWash />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{
            y: 90,
            opacity: 0,
            scale: 0.78,
            rotateX: 14,
            rotateZ: -2.5,
            filter: "blur(42px)",
          }}
          animate={{
            y: 0,
            opacity: 1,
            scale: 1,
            rotateX: 0,
            rotateZ: 0,
            filter: "blur(0px)",
          }}
          transition={{
            type: "spring",
            stiffness: 118,
            damping: 18,
            mass: 0.85,
          }}
          style={{
            position: "relative",
            pointerEvents: "auto",
            maxWidth: "min(560px, calc(100vw - 72px))",
            borderRadius: 20,
            padding: 3,
            perspective: 1400,
            background: `linear-gradient(
              132deg,
              rgba(247,244,236,0.62) 0%,
              rgba(212,175,55,0.38) 38%,
              rgba(255,253,248,0.48) 72%,
              rgba(34,211,238,0.12) 100%
            )`,
            boxShadow: `
              0 0 0 1px rgba(247,244,236,0.42),
              0 0 100px rgba(212,175,55,0.28),
              0 36px 110px rgba(0,8,20,0.72),
              inset 0 1px 0 rgba(255,255,255,0.55)
            `,
            backdropFilter: "blur(28px) saturate(185%)",
            WebkitBackdropFilter: "blur(28px) saturate(185%)",
          }}
        >
          <motion.div
            aria-hidden
            animate={{ opacity: [0.4, 0.68, 0.45] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: 6,
              borderRadius: 16,
              pointerEvents: "none",
              background: `radial-gradient(ellipse 92% 72% at 50% 0%, rgba(247,244,236,0.22) 0%, rgba(212,175,55,0.08) 40%, transparent 58%)`,
              mixBlendMode: "overlay",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
        </motion.div>
      </div>
    </div>
  );
}

export default VictoryScreen;
