import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { cyanAccent, goldAccent } from "./edtechHubTokens";

export type EdtechExamTimerBarProps = {
  endsAt: number;
  compact?: boolean;
};

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function EdtechExamTimerBar({ endsAt, compact = false }: EdtechExamTimerBarProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    const tick = () => setRemainingMs(Math.max(0, endsAt - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const urgent = remainingMs < 3 * 60 * 1000;
  const pct = Math.min(100, Math.max(0, (remainingMs / (20 * 60 * 1000)) * 100));

  return (
    <motion.div
      role="timer"
      aria-live="polite"
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginBottom: compact ? 12 : 16,
        padding: compact ? "10px 14px" : "12px 16px",
        borderRadius: 14,
        border: `1px solid ${urgent ? "rgba(248,113,113,0.55)" : "rgba(214,181,111,0.45)"}`,
        background: urgent
          ? "linear-gradient(90deg, rgba(127,29,29,0.35) 0%, rgba(15,23,42,0.85) 100%)"
          : "linear-gradient(90deg, rgba(15,23,42,0.92) 0%, rgba(30,58,95,0.75) 100%)",
        boxShadow: urgent ? "0 0 24px rgba(248,113,113,0.2)" : "0 8px 28px rgba(15,23,42,0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--nx-font-mono)",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: urgent ? "rgba(254,202,202,0.95)" : goldAccent,
          }}
        >
          {t("hub.edtech.examTimerLabel")}
        </span>
        <span
          style={{
            fontFamily: "var(--nx-font-mono)",
            fontSize: compact ? 22 : 28,
            fontWeight: 800,
            color: urgent ? "#fecaca" : cyanAccent,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatRemaining(remainingMs)}
        </span>
      </div>
      <div
        aria-hidden
        style={{
          marginTop: 10,
          height: 4,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            height: "100%",
            borderRadius: 999,
            background: urgent
              ? "linear-gradient(90deg, #ef4444, #f97316)"
              : `linear-gradient(90deg, ${goldAccent}, ${cyanAccent})`,
          }}
          animate={{ width: `${pct}%` }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.35 }}
        />
      </div>
      <p
        style={{
          margin: "8px 0 0",
          fontFamily: "var(--nx-font-sans)",
          fontSize: 13,
          fontWeight: 600,
          color: "rgba(248,250,252,0.75)",
        }}
      >
        {t("hub.edtech.examTimerHint")}
      </p>
    </motion.div>
  );
}
