import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type AssetDataStreamOverlayProps = {
  visible: boolean;
  lines: string[];
};

export function AssetDataStreamOverlay({
  visible,
  lines,
}: AssetDataStreamOverlayProps) {
  const [idx, setIdx] = useState(0);

  const cycle = useMemo(() => {
    if (!lines.length) return ["> nexus://sync/idle"];
    return lines;
  }, [lines]);

  useEffect(() => {
    if (!visible) {
      setIdx(0);
      return;
    }
    const id = window.setInterval(() => {
      setIdx((n) => (n + 1) % cycle.length);
    }, 320);
    return () => window.clearInterval(id);
  }, [visible, cycle.length]);

  if (!visible || cycle.length === 0) return null;

  const windowStart = Math.max(0, idx - 4);
  const shown = cycle.slice(windowStart, windowStart + 6);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 36,
        pointerEvents: "none",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-start",
        padding: "clamp(12px, 3vw, 28px)",
        background:
          "linear-gradient(180deg, rgba(2,8,14,0.02) 0%, rgba(2,10,18,0.72) 55%, rgba(2,6,12,0.88) 100%)",
      }}
    >
      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10,
          letterSpacing: ".04em",
          lineHeight: 1.55,
          color: "rgba(52, 211, 153, 0.88)",
          textShadow: "0 0 12px rgba(34, 211, 238, 0.35)",
          maxWidth: "min(92vw, 520px)",
        }}
      >
        <div style={{ color: "rgba(103, 232, 249, 0.75)", marginBottom: 6 }}>
          {"// ASSET STREAM · PWA PAYLOAD"}
        </div>
        {shown.map((line, i) => (
          <motion.div
            key={`${windowStart + i}-${line}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: i === shown.length - 1 ? 1 : 0.42, x: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span style={{ color: "rgba(148, 163, 184, 0.9)" }}>
              {i === shown.length - 1 ? "⟩ " : "· "}
            </span>
            {line}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default AssetDataStreamOverlay;
