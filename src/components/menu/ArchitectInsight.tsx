import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useGameStore } from "../../store/useGameStore";
import type { MenuSystemMood } from "../../store/useGameStore";

const IMPROVING_LINES = [
  "Synaptic firing rate stabilizing in Sector {s}",
  "Neural mesh converging — reward gradient ascending",
  "Pattern lock achieved — cognitive throughput optimal",
  "Heuristic drift correcting — trajectory nominal",
  "Signal-to-noise envelope widening in your favor",
  "Latency windows shrinking — reflex arc sharpening",
  "Confidence manifold expanding across recent runs",
];

const DECLINING_LINES = [
  "Pattern recognition failure detected — recalibrate",
  "Entropy spike in motor cortex simulation — audit inputs",
  "Sector {s} telemetry diverging from baseline manifold",
  "Synaptic fatigue model predicts regression — rest cycle advised",
  "Noise floor rising — attention bandwidth compromised",
  "Error surface steepening — reduce cognitive load",
  "Forecast: instability without intervention",
];

const STAGNATING_LINES = [
  "Baseline oscillation within expected deadband",
  "System holding steady — no drift vector registered",
  "Equilibrium plateau — await novel stimulus",
  "Variance collapsed — explore adjacent strategy space",
  "Sector {s} operating at steady-state resonance",
  "No significant gradient — maintenance mode engaged",
  "Telemetry flatline — acceptable for consolidation phase",
];

const IDLE_LINES = [
  "Awaiting neural archive — no runs ingested",
  "Core idle — performance substrate uninitialized",
];

function pickLine(
  mood: MenuSystemMood | null,
  sector: number,
  runCount: number
): string {
  const s = String(Math.max(1, Math.min(12, sector)));
  if (runCount === 0 || !mood) {
    const pool = IDLE_LINES;
    const i = Math.abs((sector * 13) % pool.length);
    return pool[i] ?? pool[0];
  }
  const pool =
    mood.direction === "improving"
      ? IMPROVING_LINES
      : mood.direction === "declining"
        ? DECLINING_LINES
        : STAGNATING_LINES;
  const salt = Math.round(mood.delta * 1000) + mood.runCount * 17 + sector * 31;
  const idx = Math.abs(salt) % pool.length;
  let line = pool[idx] ?? pool[0];
  line = line.replaceAll("{s}", s);
  return line;
}

export function ArchitectInsight() {
  const mood = useGameStore((m) => m.menuSystemMood);
  const activeLF = useGameStore((m) => m.activeLF);
  const historyLen = useGameStore((m) => m.combatArchitectHistory.length);

  const fullText = useMemo(() => {
    if (!mood && historyLen > 0) {
      return "Recalibrating insight matrix…";
    }
    return pickLine(mood, activeLF, mood?.runCount ?? historyLen);
  }, [mood, activeLF, historyLen]);

  const [shown, setShown] = useState(0);
  const moodKey = mood
    ? `${mood.direction}-${mood.delta.toFixed(3)}-${mood.updatedAt}`
    : `idle-${historyLen}`;

  useEffect(() => {
    setShown(0);
  }, [moodKey, fullText]);

  useEffect(() => {
    if (shown >= fullText.length) return;
    const t = window.setTimeout(() => setShown((c) => c + 1), 38);
    return () => window.clearTimeout(t);
  }, [shown, fullText]);

  const visible = fullText.slice(0, shown);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        flex: "0 1 280px",
        minWidth: 200,
        maxWidth: 300,
        alignSelf: "flex-start",
        padding: "12px 14px",
        borderRadius: 8,
        border: "1px solid rgba(34,211,238,0.28)",
        background:
          "linear-gradient(168deg, rgba(5,14,22,0.94) 0%, rgba(4,11,18,0.97) 100%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 20px rgba(0,255,255,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: ".28em",
          textTransform: "uppercase",
          color: "rgba(103, 232, 249, 0.72)",
          marginBottom: 8,
        }}
      >
        System Analysis
      </div>
      <div
        style={{
          position: "relative",
          minHeight: 72,
          fontFamily:
            '"JetBrains Mono","Inter",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
          fontSize: 11,
          lineHeight: 1.55,
          letterSpacing: ".04em",
          color: "rgba(186, 230, 253, 0.92)",
        }}
      >
        {visible}
        {shown < fullText.length ? (
          <motion.span
            aria-hidden
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
            style={{
              display: "inline-block",
              width: 7,
              height: 14,
              marginLeft: 2,
              verticalAlign: "text-bottom",
              background: "rgba(103, 232, 249, 0.92)",
              boxShadow: "0 0 8px rgba(34,211,238,0.65)",
            }}
          />
        ) : null}
      </div>
      {mood ? (
        <div
          style={{
            marginTop: 10,
            fontSize: 9,
            letterSpacing: ".12em",
            opacity: 0.55,
            color: "rgba(148, 208, 232, 0.85)",
          }}
        >
          Δ {(mood.delta * 100).toFixed(1)} PP · n={mood.runCount}
        </div>
      ) : null}
    </motion.aside>
  );
}

export default ArchitectInsight;
