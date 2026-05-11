import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../../store/useGameStore";
import { achievementOrder, achievementRegistry } from "../../data/achievementRegistry";
import { playNexusUiGlitchSound } from "../../lib/audio/nexusUiAudio";
import { NX_UI_SPRING } from "../../lib/ui/textMotionPolicy";

const TOP_NAME = "NEXUS-PRIME";
const TOP_SCORE = 5200;

const SAFE_L = "max(var(--nx-space-32), env(safe-area-inset-left, 0px))";
const SAFE_R = "max(var(--nx-space-32), env(safe-area-inset-right, 0px))";
const SAFE_B = "max(var(--nx-space-32), env(safe-area-inset-bottom, 0px))";

const MONO = "var(--nx-font-mono)";

export function LeaderboardTicker() {
  const state = useGameStore(
    useShallow((s) => ({
      gameState: s.gameState,
      globalCollection: s.globalCollection,
      unlockedAchievements: s.unlockedAchievements,
      bossAggressionLevel: s.bossAggressionLevel,
      killfeedActiveUntilMs: s.killfeedActiveUntilMs,
    }))
  );
  const [flashToken, setFlashToken] = useState(0);
  const [threatPulseToken, setThreatPulseToken] = useState(0);
  const prevUnlockCountRef = useRef(0);
  const prevAggroRef = useRef(1);
  const userScore = useMemo(
    () =>
      achievementOrder.reduce((sum, key) => {
        const count = state.globalCollection[key]?.count ?? 0;
        return sum + count * achievementRegistry[key].priority;
      }, 0),
    [state.globalCollection]
  );
  const diff = Math.max(0, TOP_SCORE - userScore);
  const loopText = `${TOP_NAME} +${diff} SYNC GAP  `;
  const killfeedActive = state.killfeedActiveUntilMs > Date.now();

  useEffect(() => {
    if (state.unlockedAchievements.length > prevUnlockCountRef.current) {
      setFlashToken((n) => n + 1);
    }
    prevUnlockCountRef.current = state.unlockedAchievements.length;
  }, [state.unlockedAchievements.length]);

  useEffect(() => {
    const prev = prevAggroRef.current;
    if (state.bossAggressionLevel > prev) {
      setThreatPulseToken((n) => n + 1);
      void playNexusUiGlitchSound();
    }
    prevAggroRef.current = state.bossAggressionLevel;
  }, [state.bossAggressionLevel]);

  return (
    <motion.div
      animate={{ opacity: state.gameState === "IDLE" ? 0.32 : 0.55 }}
      transition={NX_UI_SPRING}
      style={{
        position: "fixed",
        left: SAFE_L,
        right: SAFE_R,
        bottom: SAFE_B,
        height: "var(--nx-space-8)",
        overflow: "hidden",
        zIndex: 90,
        pointerEvents: "none",
      }}
    >
      <motion.div
        key={flashToken}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.35, 0] }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent 0%, var(--nx-bone-25) 50%, transparent 100%)",
        }}
      />
      {!killfeedActive ? (
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          style={{
            display: "inline-flex",
            whiteSpace: "nowrap",
            minWidth: "200%",
            paddingTop: 0,
            fontFamily: MONO,
            fontSize: 8,
            fontWeight: 300,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--nx-text-tertiary)",
          }}
        >
          <span style={{ paddingRight: "var(--nx-space-32)" }}>{loopText}</span>
          <span>{loopText}</span>
        </motion.div>
      ) : (
        <motion.div
          key={`critical-killfeed-${state.killfeedActiveUntilMs}`}
          initial={{ opacity: 1, x: 0 }}
          animate={{ opacity: [1, 1, 0], x: [0, 1, -1, 0] }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            fontFamily: MONO,
            fontSize: 8,
            fontWeight: 300,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--nx-bone-90)",
            background:
              "linear-gradient(90deg, transparent 0%, color-mix(in srgb, rgb(248 113 113) 14%, transparent) 50%, transparent 100%)",
          }}
        >
          CRITICAL STRIKE
        </motion.div>
      )}
      <motion.div
        key={threatPulseToken}
        animate={{ x: [0, -1, 1, 0] }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          display: "inline-flex",
          gap: 3,
          alignItems: "flex-end",
          paddingBottom: 1,
        }}
      >
        {[1, 2, 3, 4, 5].map((level) => {
          const active = level <= state.bossAggressionLevel;
          const h = 4 + level;
          return (
            <motion.span
              key={level}
              animate={
                active && level === state.bossAggressionLevel
                  ? { opacity: [0.55, 0.95, 0.55] }
                  : { opacity: active ? 0.55 : 0.12 }
              }
              transition={NX_UI_SPRING}
              style={{
                width: 1,
                height: h,
                borderRadius: 0,
                background: active ? "var(--nx-tungsten)" : "var(--nx-bone-25)",
              }}
            />
          );
        })}
      </motion.div>
    </motion.div>
  );
}

export default LeaderboardTicker;
