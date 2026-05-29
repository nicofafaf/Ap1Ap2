import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { cyanAccent, goldAccent } from "./edtechHubTokens";

export type StreakCelebrationProps = {
  milestone: number | null;
  onDismiss: () => void;
};

export function StreakCelebration({ milestone, onDismiss }: StreakCelebrationProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!milestone) return;
    const id = window.setTimeout(onDismiss, reduceMotion ? 2400 : 4200);
    return () => window.clearTimeout(id);
  }, [milestone, onDismiss, reduceMotion]);

  return (
    <AnimatePresence>
      {milestone ? (
        <motion.div
          key={`streak-${milestone}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 12000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          onClick={onDismiss}
        >
          <motion.div
            initial={reduceMotion ? false : { scale: 0.88, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 420,
              width: "100%",
              padding: "32px 28px",
              borderRadius: 24,
              border: `1px solid rgba(214,181,111,0.5)`,
              background:
                "linear-gradient(165deg, rgba(15,23,42,0.98) 0%, rgba(30,58,95,0.92) 55%, rgba(6,182,212,0.15) 100%)",
              boxShadow: "0 32px 80px rgba(15,23,42,0.45), 0 0 48px rgba(6,182,212,0.2)",
              textAlign: "center",
            }}
          >
            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : { rotate: [0, -6, 6, 0], scale: [1, 1.08, 1] }
              }
              transition={{ duration: 1.2, repeat: 2 }}
              style={{ fontSize: 56, lineHeight: 1 }}
              aria-hidden
            >
              🔥
            </motion.div>
            <p
              style={{
                margin: "12px 0 0",
                fontFamily: "var(--nx-font-mono)",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: goldAccent,
              }}
            >
              {t("hub.edtech.streakCelebrateBadge")}
            </p>
            <h2
              style={{
                margin: "10px 0 8px",
                fontFamily: "var(--nx-font-sans)",
                fontSize: "clamp(28px, 4vw, 36px)",
                fontWeight: 800,
                color: "#f8fafc",
              }}
            >
              {t("hub.edtech.streakCelebrateTitle").replace("{days}", String(milestone))}
            </h2>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--nx-font-sans)",
                fontSize: 17,
                fontWeight: 550,
                lineHeight: 1.5,
                color: "rgba(248,250,252,0.85)",
              }}
            >
              {t("hub.edtech.streakCelebrateBody")}
            </p>
            <motion.button
              type="button"
              onClick={onDismiss}
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              style={{
                marginTop: 22,
                borderRadius: 999,
                border: `1px solid rgba(6,182,212,0.45)`,
                background: `linear-gradient(125deg, rgba(6,182,212,0.25) 0%, rgba(15,23,42,0.4) 100%)`,
                color: cyanAccent,
                fontFamily: "var(--nx-font-sans)",
                fontSize: 16,
                fontWeight: 800,
                padding: "12px 28px",
                cursor: "pointer",
              }}
            >
              {t("hub.edtech.streakCelebrateCta")}
            </motion.button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
