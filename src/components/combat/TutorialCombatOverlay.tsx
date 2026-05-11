import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

const STEPS: readonly { kicker: string; line1: string; line2: string }[] = [
  {
    kicker: "Verteidigen",
    line1: "Boss-Puls wird rot",
    line2: "CIPHER SHIELD tippen",
  },
  {
    kicker: "Angreifen",
    line1: "Karte wählen",
    line2: "SYSTEM OVERCLOCK tippen",
  },
  {
    kicker: "Spezial",
    line1: "INFINITE RECURSION legen",
    line2: "Danach noch einmal angreifen",
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
              background:
                "linear-gradient(165deg, color-mix(in srgb, var(--nx-vantablack) 88%, rgba(255,214,165,0.08)) 0%, rgba(12,14,20,0.92) 100%)",
              border: "1px solid color-mix(in srgb, rgba(255,214,165,0.55) 40%, rgba(232,233,240,0.18))",
              boxShadow: "0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
              backdropFilter: "blur(18px) saturate(160%)",
              WebkitBackdropFilter: "blur(18px) saturate(160%)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--nx-font-mono)",
                fontSize: 11,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "color-mix(in srgb, var(--nx-bone) 72%, rgba(255,214,165,0.9))",
                marginBottom: 14,
              }}
            >
              Training · Schritt {idx + 1} / {STEPS.length}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(255,214,165,0.12)",
                color: "var(--nx-bone-90)",
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
                fontWeight: 100,
                fontSize: "clamp(20px, 3.2vw, 24px)",
                lineHeight: 1.35,
                color: "var(--nx-bone-90)",
              }}
            >
              {card.line1}
            </p>
            <p
              style={{
                margin: "10px 0 0",
                fontFamily: "var(--nx-font-sans)",
                fontWeight: 100,
                fontSize: "clamp(20px, 3.2vw, 24px)",
                lineHeight: 1.35,
                color: "color-mix(in srgb, var(--nx-bone) 88%, rgb(103,232,249))",
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
