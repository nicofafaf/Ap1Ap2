import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const STEPS = [
  { id: "CardSelection", label: "Card" },
  { id: "EffectCalculation", label: "Effect" },
  { id: "BossResponse", label: "Boss" },
  { id: "StateUpdate", label: "State" },
] as const;

type LogicFlowProps = {
  pulseToken: number;
};

/**
 * Exam-Mode: kurzer Rand-Graph — Observer / State-Machine sichtbar gemacht
 */
export function LogicFlow({ pulseToken }: LogicFlowProps) {
  const [phase, setPhase] = useState<"hidden" | "running" | "fade">("hidden");
  const [highlight, setHighlight] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTokenRef = useRef(0);

  useEffect(() => {
    if (pulseToken === 0) {
      lastTokenRef.current = 0;
      return;
    }
    if (pulseToken === lastTokenRef.current) return;
    lastTokenRef.current = pulseToken;

    if (timerRef.current) clearInterval(timerRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);

    setPhase("running");
    setHighlight(0);
    let step = 0;
    timerRef.current = setInterval(() => {
      step += 1;
      setHighlight(Math.min(step, STEPS.length - 1));
      if (step >= STEPS.length - 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        hideRef.current = setTimeout(() => {
          setPhase("hidden");
          setHighlight(0);
        }, 520);
      }
    }, 155);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
    };
  }, [pulseToken]);

  return (
    <AnimatePresence>
      {phase !== "hidden" ? (
        <motion.div
          key="logic-flow"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={{
            position: "absolute",
            right: "clamp(8px, 2vw, 16px)",
            bottom: "clamp(96px, 18vh, 140px)",
            zIndex: 58,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(34, 211, 238, 0.28)",
            background: "linear-gradient(120deg, rgba(8, 18, 28, 0.42) 0%, rgba(4, 12, 22, 0.58) 100%)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 0 24px rgba(34, 211, 238, 0.12)",
          }}
        >
          {STEPS.map((s, i) => (
            <motion.div
              key={s.id}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
              initial={false}
            >
              <motion.div
                animate={{
                  scale: highlight >= i ? 1 : 0.92,
                  opacity: highlight >= i ? 1 : 0.38,
                  boxShadow:
                    highlight === i
                      ? "0 0 14px rgba(250, 204, 21, 0.55)"
                      : "0 0 0 rgba(0,0,0,0)",
                }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                title={s.id}
                style={{
                  minWidth: 44,
                  padding: "4px 6px",
                  borderRadius: 6,
                  fontSize: 8,
                  letterSpacing: ".08em",
                  textAlign: "center",
                  color:
                    highlight === i ? "rgba(253, 230, 138, 0.96)" : "rgba(148, 163, 184, 0.82)",
                  border:
                    highlight === i
                      ? "1px solid rgba(250, 204, 21, 0.55)"
                      : "1px solid rgba(51, 65, 85, 0.55)",
                  background:
                    highlight === i
                      ? "rgba(250, 204, 21, 0.12)"
                      : "rgba(15, 23, 42, 0.45)",
                }}
              >
                {s.label}
              </motion.div>
              {i < STEPS.length - 1 ? (
                <motion.span
                  aria-hidden
                  animate={{ opacity: highlight > i ? 0.85 : 0.25 }}
                  style={{
                    fontSize: 9,
                    color: "rgba(34, 211, 238, 0.65)",
                    letterSpacing: ".06em",
                  }}
                >
                  →
                </motion.span>
              ) : null}
            </motion.div>
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
