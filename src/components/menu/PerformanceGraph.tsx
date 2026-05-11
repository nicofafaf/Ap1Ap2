import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useGameStore } from "../../store/useGameStore";
import type { CombatArchitectReportEntry } from "../../store/useGameStore";
import {
  CRITICAL_ACCURACY,
  computePerformanceTrend,
  hasSubCriticalAccuracy,
  timeGradeToUnit,
  type TrendDirection,
} from "../../lib/math/statCalculations";

const MAX_RUNS = 20;
const W = 640;
const H = 220;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 28;
const PAD_B = 36;

function buildPathY(
  values: number[],
  width: number,
  height: number,
  padL: number,
  padR: number,
  padT: number,
  padB: number
): string {
  if (values.length === 0) return "";
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const n = values.length;
  const step = n <= 1 ? 0 : innerW / (n - 1);
  const pts = values.map((v, i) => {
    const x = padL + i * step;
    const y = padT + innerH * (1 - Math.max(0, Math.min(1, v)));
    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return pts.join(" ");
}

function formatRunDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16);
  }
}

function trendLabel(de: TrendDirection): { text: string; color: string } {
  switch (de) {
    case "improving":
      return { text: "Trend · Aufwärts", color: "rgba(52, 211, 153, 0.95)" };
    case "declining":
      return { text: "Trend · Abwärts", color: "rgba(248, 113, 113, 0.95)" };
    default:
      return { text: "Trend · Stagnation", color: "rgba(250, 204, 21, 0.9)" };
  }
}

export function PerformanceGraph() {
  const history = useGameStore((s) => s.combatArchitectHistory);
  const recomputeMenuSystemMood = useGameStore((s) => s.recomputeMenuSystemMood);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    recomputeMenuSystemMood();
  }, [history, recomputeMenuSystemMood]);

  const runs = useMemo(() => {
    const sorted = [...history].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );
    return sorted.slice(-MAX_RUNS);
  }, [history]);

  const accuracies = useMemo(() => runs.map((r) => r.accuracyRate), [runs]);
  const gradeUnits = useMemo(() => runs.map((r) => timeGradeToUnit(r.timeGrade)), [runs]);

  const accPath = useMemo(
    () => buildPathY(accuracies, W, H, PAD_L, PAD_R, PAD_T, PAD_B),
    [accuracies]
  );
  const gradePath = useMemo(
    () => buildPathY(gradeUnits, W, H, PAD_L, PAD_R, PAD_T, PAD_B),
    [gradeUnits]
  );

  const trend = useMemo(() => computePerformanceTrend(accuracies, 3), [accuracies]);
  const menuMood = useGameStore((s) => s.menuSystemMood);
  const glitchLine = useMemo(
    () => hasSubCriticalAccuracy(accuracies, CRITICAL_ACCURACY),
    [accuracies]
  );
  const trendAligned =
    menuMood && runs.length > 0 && menuMood.runCount === runs.length;
  const trendInfo = trendLabel(trendAligned ? menuMood.direction : trend.direction);
  const trendDeltaShow = trendAligned ? menuMood.delta : trend.delta;

  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const step = runs.length <= 1 ? 0 : innerW / (runs.length - 1);

  const hoverRun: CombatArchitectReportEntry | null =
    hoverIdx != null && runs[hoverIdx] ? runs[hoverIdx] : null;

  const pointCoords = (idx: number, v: number) => {
    const x = PAD_L + idx * step;
    const y = PAD_T + innerH * (1 - Math.max(0, Math.min(1, v)));
    return { x, y };
  };

  if (runs.length === 0) {
    return (
      <div
        style={{
          borderRadius: 12,
          border: "1px solid rgba(34,211,238,0.28)",
          background:
            "linear-gradient(165deg, rgba(5,14,22,0.88) 0%, rgba(4,12,18,0.94) 100%)",
          padding: "18px 20px",
          color: "rgba(148, 196, 216, 0.82)",
          fontSize: 12,
          letterSpacing: ".08em",
        }}
      >
        Noch keine Archiv-Läufe — nach dem nächsten Sieg erscheint der Seismograph
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        border: "1px solid rgba(34,211,238,0.32)",
        background:
          "linear-gradient(168deg, rgba(4,14,22,0.92) 0%, rgba(3,10,16,0.96) 55%, rgba(6,18,28,0.9) 100%)",
        padding: "14px 16px 12px",
        overflow: "hidden",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 28px rgba(0,255,255,0.08)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.07,
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="0.5"/></svg>'
          )}")`,
          pointerEvents: "none",
          mixBlendMode: "overlay",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: ".28em",
              color: "rgba(103, 232, 249, 0.78)",
              textTransform: "uppercase",
            }}
          >
            Architect Seismograph
          </div>
          <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, opacity: 0.92 }}>
            Letzte {runs.length} Läufe · Präzision & Zeitnote
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".12em",
            color: trendInfo.color,
            textAlign: "right",
            maxWidth: 160,
          }}
        >
          {trendInfo.text}
          <div style={{ opacity: 0.75, fontSize: 10, marginTop: 4, letterSpacing: ".06em" }}>
            MA Δ {trendDeltaShow >= 0 ? "+" : ""}
            {(trendDeltaShow * 100).toFixed(1)} PP
          </div>
        </div>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block", maxHeight: 240 }}
        role="img"
        aria-label="Performance-Verlauf Präzision und Zeitnote"
      >
        <defs>
          <pattern id="perfGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(34,211,238,0.12)"
              strokeWidth="0.5"
            />
          </pattern>
          <linearGradient id="accStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.35)" />
            <stop offset="50%" stopColor="rgba(103,232,249,0.95)" />
            <stop offset="100%" stopColor="rgba(165,243,252,0.55)" />
          </linearGradient>
          <linearGradient id="gradeStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(250,204,21,0.25)" />
            <stop offset="100%" stopColor="rgba(250,204,21,0.88)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="url(#perfGrid)" opacity={0.55} />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PAD_T + innerH * (1 - t);
          return (
            <g key={t}>
              <line
                x1={PAD_L}
                y1={y}
                x2={W - PAD_R}
                y2={y}
                stroke="rgba(34,211,238,0.14)"
                strokeDasharray="4 6"
              />
              <text
                x={4}
                y={y + 4}
                fill="rgba(148, 208, 232, 0.72)"
                fontSize="9"
                fontFamily="ui-monospace, monospace"
              >
                {Math.round(t * 100)}%
              </text>
            </g>
          );
        })}
        <text
          x={PAD_L + innerW * 0.5}
          y={H - 6}
          textAnchor="middle"
          fill="rgba(125, 211, 252, 0.55)"
          fontSize="9"
          fontFamily="ui-monospace, monospace"
        >
          Zeitachse · Run #{runs.length > 0 ? runs.length : 0} (älteste links)
        </text>

        <motion.path
          d={gradePath}
          fill="none"
          stroke="url(#gradeStroke)"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.5 }}
          animate={{ pathLength: 1, opacity: 0.85 }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
        />

        <motion.g
          animate={
            glitchLine
              ? { x: [0, 1.4, -1, 0.7, 0], y: [0, -0.8, 0.5, -0.3, 0] }
              : { x: 0, y: 0 }
          }
          transition={
            glitchLine
              ? { duration: 0.26, repeat: Infinity, ease: "linear" }
              : { duration: 0.2 }
          }
        >
          <motion.path
            d={accPath}
            fill="none"
            stroke="url(#accStroke)"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.92 }}
            animate={
              glitchLine
                ? { pathLength: 1, opacity: [0.82, 1, 0.72, 0.94] }
                : { pathLength: 1, opacity: 0.96 }
            }
            transition={
              glitchLine
                ? {
                    pathLength: { duration: 1.05, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.38, repeat: Infinity, ease: "easeInOut" },
                  }
                : { duration: 1.05, ease: [0.22, 1, 0.36, 1] }
            }
          />
        </motion.g>

        {runs.map((r, i) => {
          const { x, y } = pointCoords(i, r.accuracyRate);
          const active = hoverIdx === i;
          return (
            <circle
              key={r.reportId}
              cx={x}
              cy={y}
              r={active ? 6 : 3.5}
              fill={active ? "rgba(103,232,249,0.95)" : "rgba(34,211,238,0.45)"}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={active ? 1.2 : 0.6}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          );
        })}
      </svg>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 6,
          fontSize: 10,
          letterSpacing: ".1em",
          color: "rgba(148, 208, 232, 0.75)",
        }}
      >
        <span>
          <span style={{ color: "rgba(103,232,249,0.95)" }}>■</span> Präzision
        </span>
        <span>
          <span style={{ color: "rgba(250,204,21,0.9)" }}>■</span> Zeitnote (S–C)
        </span>
        {glitchLine ? (
          <span style={{ color: "rgba(248,113,113,0.85)" }}>Glitch · kritische Trefferquote</span>
        ) : null}
      </div>

      {hoverRun ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position: "absolute",
            right: 12,
            top: 72,
            width: 220,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(34,211,238,0.4)",
            background: "rgba(4,16,24,0.94)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: ".2em",
              color: "rgba(103,232,249,0.8)",
              textTransform: "uppercase",
            }}
          >
            Dossier · Mini
          </div>
          <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".06em" }}>
            LF{hoverRun.activeLF} · Rang {hoverRun.combatRank} · {hoverRun.architectStratum}
          </div>
          <div style={{ marginTop: 6, fontSize: 10, lineHeight: 1.5, opacity: 0.88 }}>
            Präzision {(hoverRun.accuracyRate * 100).toFixed(1)}%
            <br />
            Zeitnote {hoverRun.timeGrade} · Platz {hoverRun.architectPlace}
            <br />
            Zeit {Math.floor(hoverRun.elapsedSec / 60)}:
            {String(Math.floor(hoverRun.elapsedSec % 60)).padStart(2, "0")}
            <br />
            {formatRunDate(hoverRun.recordedAt)}
          </div>
          <div style={{ marginTop: 6, fontSize: 9, opacity: 0.5, wordBreak: "break-all" }}>
            {hoverRun.reportId}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

export default PerformanceGraph;
