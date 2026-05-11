import { motion } from "framer-motion";
import { useId } from "react";
import type { NexusAnomalyType } from "../../store/useGameStore";

type AuraProps = {
  anomaly: NexusAnomalyType | null | undefined;
  /** Knotengröße — Basis 104px */
  size?: number;
};

/** Verzerrtes rotes Leuchten um einen Sektor-Knoten */
export function SectorAnomalyAura({ anomaly, size = 104 }: AuraProps) {
  const fid = useId().replace(/:/g, "");
  if (!anomaly) return null;
  const r = size / 2 + 14;
  const filterRef = `nexus-anomaly-warp-${fid}`;
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute", overflow: "hidden" }} aria-hidden>
        <defs>
          <filter id={filterRef} x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.08"
              numOctaves="2"
              seed="11"
              result="n"
            />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <motion.div
        aria-hidden
        animate={{
          opacity: [0.45, 0.92, 0.45],
          scale: [1, 1.06, 1],
          rotate: [0, 1.5, -1.2, 0],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: r * 2,
          height: r * 2,
          marginLeft: -r,
          marginTop: -r,
          borderRadius: "28%",
          pointerEvents: "none",
          zIndex: -1,
          background:
            "radial-gradient(circle at 40% 35%, rgba(248,113,113,0.42) 0%, rgba(185,28,28,0.18) 42%, transparent 68%)",
          boxShadow:
            "0 0 28px rgba(248,113,113,0.55), 0 0 52px rgba(220,38,38,0.28), inset 0 0 22px rgba(254,202,202,0.12)",
          filter: `url(#${filterRef})`,
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}

type BannerProps = {
  visible: boolean;
};

export function SectorInstabilityBanner({ visible }: BannerProps) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        marginTop: 10,
        padding: "6px 10px",
        borderRadius: 8,
        border: "1px solid rgba(248,113,113,0.55)",
        background: "linear-gradient(90deg, rgba(69,10,10,0.88) 0%, rgba(30,8,8,0.92) 100%)",
        boxShadow: "0 0 18px rgba(248,113,113,0.25)",
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: ".28em",
          color: "rgba(254,202,202,0.95)",
          fontWeight: 700,
        }}
      >
        WARNING: SECTOR INSTABILITY
      </div>
    </motion.div>
  );
}
