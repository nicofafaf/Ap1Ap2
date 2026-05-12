import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

const STEPS: readonly { kicker: string; line1: string; line2: string }[] = [
  {
    kicker: "Tempo rausnehmen",
    line1: "Wenn es zu viel wird",
    line2: "Kurz sichern tippen",
  },
  {
    kicker: "Antwort nutzen",
    line1: "Wenn du sicher bist",
    line2: "Lösung anwenden tippen",
  },
  {
    kicker: "Verstärken",
    line1: "Guter Lauf",
    line2: "Verstärken für den nächsten Schritt",
  },
];

export type TutorialCombatOverlayProps = {
  visible: boolean;
  step: number;
};

export function TutorialCombatOverlay({ visible, step }: TutorialCombatOverlayProps) {
  const reduceMotion = useReducedMotion();
  const idx = Math.min(Math.max(0, step), STEPS.length - 1);
  const card = useMemo(() => STEPS[idx]!, [idx]);

  return (
    <AnimatePresence>
      {visible ? (
        <div
          key="tutorial-action-stack"
          style={{
            position: "fixed",
            top: "max(52px, env(safe-area-inset-top))",
            left: 0,
            right: 0,
            zIndex: 160,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            padding: "0 max(16px, env(safe-area-inset-left)) 0 max(16px, env(safe-area-inset-right))",
            boxSizing: "border-box",
          }}
        >
          <motion.div
            role="status"
            aria-live="polite"
            initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={reduceMotion ? { duration: 0.01 } : { type: "spring", stiffness: 380, damping: 32 }}
            style={{
              width: "min(420px, 100%)",
              borderRadius: 16,
              padding: "22px 24px 20px",
              background: "rgba(251,247,239,0.94)",
              border: "1px solid var(--nx-learn-line)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
              backdropFilter: "blur(18px) saturate(105%)",
              WebkitBackdropFilter: "blur(18px) saturate(105%)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--nx-font-sans)",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--nx-learn-muted)",
                marginBottom: 14,
              }}
            >
              Training Schritt {idx + 1} von {STEPS.length}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(214,181,111,0.16)",
                color: "var(--nx-learn-ink)",
                fontFamily: "var(--nx-font-sans)",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.04em",
              }}
            >
              {card.kicker}
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--nx-font-sans)",
                fontWeight: 800,
                fontSize: "clamp(20px, 3.2vw, 24px)",
                lineHeight: 1.35,
                color: "var(--nx-learn-ink)",
              }}
            >
              {card.line1}
            </p>
            <p
              style={{
                margin: "10px 0 0",
                fontFamily: "var(--nx-font-sans)",
                fontWeight: 700,
                fontSize: "clamp(20px, 3.2vw, 24px)",
                lineHeight: 1.35,
                color: "var(--nx-learn-muted)",
              }}
            >
              {card.line2}
            </p>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export default TutorialCombatOverlay;
