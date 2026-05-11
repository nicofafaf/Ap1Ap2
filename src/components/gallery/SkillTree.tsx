import { motion } from "framer-motion";
import { useMemo } from "react";
import type { LearningField } from "../../data/nexusRegistry";
import { CURRICULUM_BY_LF } from "../../lib/learning/learningRegistry";
import { typography } from "../../theme/typography";
import { useGameStore } from "../../store/useGameStore";

const LF_ORDER: LearningField[] = [
  "LF1",
  "LF2",
  "LF3",
  "LF4",
  "LF5",
  "LF6",
  "LF7",
  "LF8",
  "LF9",
  "LF10",
  "LF11",
  "LF12",
];

export function SkillTree() {
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);

  const rows = useMemo(
    () =>
      LF_ORDER.map((lf) => {
        const curriculum = CURRICULUM_BY_LF[lf] ?? [];
        const total = curriculum.length;
        const have = new Set(learningCorrectByLf[lf] ?? []);
        const correctCount = curriculum.filter((e) => have.has(e.id)).length;
        const ratio = total > 0 ? correctCount / total : 0;
        const mastered = total > 0 && correctCount >= total;
        return { lf, ratio, mastered, correctCount, total };
      }),
    [learningCorrectByLf]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 14,
        fontFamily: typography.fontSans,
      }}
    >
      {rows.map(({ lf, ratio, mastered, correctCount, total }, i) => (
        <motion.article
          key={lf}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.32 }}
          style={{
            position: "relative",
            borderRadius: 16,
            padding: "16px 18px",
            border: mastered
              ? "1px solid color-mix(in srgb, var(--gold, #facc15) 55%, transparent)"
              : "1px solid rgba(148, 163, 184, 0.35)",
            background: mastered
              ? "linear-gradient(155deg, rgba(40,32,8,0.92) 0%, rgba(12,18,28,0.94) 100%)"
              : "linear-gradient(155deg, rgba(8,18,28,0.88) 0%, rgba(6,12,20,0.92) 100%)",
            boxShadow: mastered
              ? "0 0 28px color-mix(in srgb, var(--gold, #facc15) 28%, transparent), inset 0 0 24px rgba(250,204,21,0.08)"
              : "0 12px 32px rgba(0,0,0,0.35)",
          }}
        >
          {mastered ? (
            <motion.div
              aria-hidden
              animate={{ opacity: [0.35, 0.75, 0.35] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: -1,
                borderRadius: 16,
                pointerEvents: "none",
                background:
                  "radial-gradient(circle at 40% 20%, rgba(250,204,21,0.22), transparent 58%)",
                mixBlendMode: "screen",
              }}
            />
          ) : null}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: typography.fg,
                fontSize: "max(14px, 0.88rem)",
              }}
            >
              {lf}
            </span>
            <span style={{ fontSize: 12, color: typography.fgMuted, fontVariantNumeric: "tabular-nums" }}>
              {correctCount}/{total}
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: "rgba(15,23,42,0.85)",
              overflow: "hidden",
              border: "1px solid rgba(51,65,85,0.5)",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(ratio * 100)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              style={{
                height: "100%",
                borderRadius: 999,
                background: mastered
                  ? "linear-gradient(90deg, rgba(250,204,21,0.95), rgba(52,211,153,0.85))"
                  : "linear-gradient(90deg, rgba(34,211,238,0.9), rgba(167,139,250,0.85))",
              }}
            />
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              lineHeight: 1.45,
              color: mastered ? "rgba(254, 243, 199, 0.92)" : typography.fgMuted,
            }}
          >
            {mastered
              ? "Meisterstatus — Sektor leuchtet auf der Karte"
              : "Fortschritt aus korrekt gelösten Übungen im Lernterminal"}
          </div>
        </motion.article>
      ))}
    </motion.div>
  );
}

export default SkillTree;
