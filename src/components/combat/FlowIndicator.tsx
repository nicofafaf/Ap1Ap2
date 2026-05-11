import { motion } from "framer-motion";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  damageMultiplierForFlow,
  flowMultiplierLabel,
} from "../../lib/combat/flowProcessor";
import { useGameStore } from "../../store/useGameStore";

const SIZE = 112;
const STROKE = 3.5;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function FlowIndicator() {
  const { gameState, synapticFlow, combatComboCount, isParrying } = useGameStore(
    useShallow((s) => ({
      gameState: s.gameState,
      synapticFlow: s.synapticFlow,
      combatComboCount: s.combatComboCount,
      isParrying: s.isParrying,
    }))
  );

  const active = gameState === "FIGHTING" || gameState === "STARTING";
  const pct = Math.max(0, Math.min(1, synapticFlow / 100));
  const dashOffset = C * (1 - pct);
  const mult = damageMultiplierForFlow(synapticFlow);
  const label = flowMultiplierLabel(synapticFlow);
  const burn = synapticFlow >= 100;

  const glowRgb = useMemo(
    () => (burn ? "0, 255, 255" : "103, 232, 249"),
    [burn]
  );

  if (!active) return null;

  return (
    <div
      className="nexus-flow-indicator"
      style={{
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: SIZE,
        height: SIZE,
        zIndex: 45,
        pointerEvents: "none",
      }}
    >
      <motion.div
        key={combatComboCount}
        initial={{ scale: 0.92 }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        style={{ width: SIZE, height: SIZE, position: "relative" }}
      >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ overflow: "visible" }}
        aria-hidden
      >
        <defs>
          <filter id="flowGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={burn ? 3.2 : 1.4} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="rgba(15,23,42,0.85)"
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={`rgba(${glowRgb},${burn ? 0.98 : 0.82})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          filter="url(#flowGlow)"
          style={{
            filter: burn ? "url(#flowGlow) drop-shadow(0 0 14px rgba(0,255,255,0.75))" : "url(#flowGlow)",
          }}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isParrying ? (
          <motion.div
            key="parry-flash"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: [0, 1, 0.35, 0], scale: [0.88, 1.15, 1.02, 1] }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            aria-hidden
            style={{
              position: "absolute",
              width: 48,
              height: 48,
              borderRadius: 999,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 35%, rgba(255,255,255,0) 72%)",
              boxShadow:
                "0 0 28px rgba(255,255,255,0.85), 0 0 64px rgba(255,255,255,0.45)",
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
        ) : null}
        <div
          style={{
            width: 22,
            height: 22,
            border: "1px solid rgba(103,232,249,0.9)",
            borderRadius: 999,
            boxShadow: burn
              ? "0 0 18px rgba(0,255,255,0.85), inset 0 0 12px rgba(0,255,255,0.35)"
              : "0 0 10px rgba(103,232,249,0.35)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 12,
              height: 1,
              background: burn ? "rgba(0,255,255,0.95)" : "rgba(103,232,249,0.92)",
              transform: "translate(-50%, -50%)",
              boxShadow: burn ? "0 0 8px rgba(0,255,255,0.9)" : undefined,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 1,
              height: 12,
              background: burn ? "rgba(0,255,255,0.95)" : "rgba(103,232,249,0.92)",
              transform: "translate(-50%, -50%)",
              boxShadow: burn ? "0 0 8px rgba(0,255,255,0.9)" : undefined,
            }}
          />
        </div>
      </div>

      <motion.div
        key={`mul-${mult}-${combatComboCount}`}
        initial={{ scale: 0.85, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        style={{
          position: "absolute",
          left: "50%",
          top: "100%",
          marginTop: 10,
          transform: "translateX(-50%)",
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: ".06em",
          color: mult >= 2 ? "rgba(0,255,255,0.98)" : "rgba(165,243,252,0.92)",
          textShadow:
            mult >= 1.5
              ? "0 0 14px rgba(0,255,255,0.55), 0 0 28px rgba(34,211,238,0.35)"
              : "0 0 8px rgba(103,232,249,0.35)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </motion.div>

      {burn ? (
        <motion.div
          aria-hidden
          animate={{ opacity: [0.45, 0.95, 0.45] }}
          transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: 999,
            border: "1px solid rgba(0,255,255,0.55)",
            boxShadow: "0 0 24px rgba(0,255,255,0.45)",
          }}
        />
      ) : null}
      </motion.div>
    </div>
  );
}

export default FlowIndicator;
