import { motion, type Variants } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

const SHARD_CLIP =
  "polygon(5% 0%, 100% 0%, 100% 88%, 94% 100%, 0% 100%, 0% 12%)";

const ORIGIN_DELTA: Record<
  "tl" | "tr" | "bl" | "br",
  { x: number; y: number }
> = {
  tl: { x: -140, y: -100 },
  tr: { x: 140, y: -100 },
  bl: { x: -140, y: 100 },
  br: { x: 140, y: 100 },
};

const slideIn: Variants = {
  hidden: (origin: keyof typeof ORIGIN_DELTA) => ({
    opacity: 0,
    x: ORIGIN_DELTA[origin].x,
    y: ORIGIN_DELTA[origin].y,
    filter: "blur(6px)",
  }),
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
  },
};

export type TransmissionOrigin = keyof typeof ORIGIN_DELTA;

type TransmissionShardProps = {
  origin: TransmissionOrigin;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  delay?: number;
};

/**
 * Holografisches Transmission-Shard — gleitet aus HUD-Ecken herein
 */
export function TransmissionShard({
  origin,
  children,
  style,
  className,
  delay = 0,
}: TransmissionShardProps) {
  return (
    <motion.div
      className={["nx-transmission-shard", className].filter(Boolean).join(" ")}
      custom={origin}
      variants={slideIn}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: 10, filter: "blur(6px)" }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 30,
        delay,
        mass: 0.85,
        opacity: { duration: 0.28 },
      }}
      style={{
        clipPath: SHARD_CLIP,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(103, 232, 249, 0.38)",
        boxShadow:
          "inset 0 0 28px rgba(34, 211, 238, 0.22), inset 0 0 0 1px rgba(255,255,255,0.05), 0 12px 40px rgba(0, 8, 20, 0.55)",
        background:
          "linear-gradient(165deg, rgba(5, 14, 22, 0.82) 0%, rgba(4, 11, 18, 0.92) 100%)",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/** Abwechselnd Ecken für mehrzeilige Protokolle */
export function dialogueCornerForIndex(i: number): TransmissionOrigin {
  const cycle: TransmissionOrigin[] = ["tl", "tr", "bl", "br"];
  return cycle[i % 4]!;
}
