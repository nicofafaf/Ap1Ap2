import { motion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

const BINARY_STREAM = (() => {
  let s = "";
  for (let i = 0; i < 1200; i += 1) {
    s += Math.random() > 0.48 ? "1" : "0";
    if (i % 64 === 63) s += " ";
  }
  return s;
})();

type NexusReturnProps = {
  /** De-Materialisierung starten (Continue) */
  dematerialize: boolean;
  /** Nach ≤600 ms wenn Dematerialisation durch ist */
  onDematerialized: () => void;
  children: ReactNode;
};

/**
 * Auflösung des Dossiers in binären Code beim Übergang zum Nexus-Mainframe
 */
export function NexusReturn({
  dematerialize,
  onDematerialized,
  children,
}: NexusReturnProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!dematerialize) {
      firedRef.current = false;
    }
  }, [dematerialize]);

  useEffect(() => {
    if (!dematerialize || firedRef.current) return;
    const id = window.setTimeout(() => {
      if (firedRef.current) return;
      firedRef.current = true;
      onDematerialized();
    }, 560);
    return () => window.clearTimeout(id);
  }, [dematerialize, onDematerialized]);

  return (
    <motion.div
      animate={
        dematerialize
          ? {
              opacity: [1, 0.88, 0.35, 0],
              scale: [1, 0.985, 0.94],
              filter: ["blur(0px)", "blur(1px)", "blur(11px)"],
            }
          : {}
      }
      transition={{ duration: 0.52, ease: [0.4, 0, 0.2, 1] }}
      style={{ position: "relative" }}
    >
      {dematerialize ? (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0.85, 0.4] }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: -6,
            pointerEvents: "none",
            zIndex: 40,
            overflow: "hidden",
            fontFamily: "ui-monospace, monospace",
            fontSize: 8,
            lineHeight: 1.15,
            letterSpacing: "0.04em",
            color: "rgba(34, 211, 238, 0.75)",
            mixBlendMode: "screen",
            wordBreak: "break-all",
          }}
        >
          {BINARY_STREAM}
          {BINARY_STREAM}
        </motion.div>
      ) : null}
      {children}
    </motion.div>
  );
}

export default NexusReturn;
