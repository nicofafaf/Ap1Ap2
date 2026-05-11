import { AnimatePresence, motion } from "framer-motion";
import {
  achievementRegistry,
  type AchievementType,
} from "../../data/achievementRegistry";

type AchievementOverlayProps = {
  visible: boolean;
  type?: AchievementType | null;
  isGrandSlam?: boolean;
  comboCount?: number;
  comboStep?: number;
};

const particleIndices = Array.from({ length: 28 }, (_, i) => i);

export function AchievementOverlay({
  visible,
  type,
  isGrandSlam = false,
  comboCount = 0,
  comboStep = 0,
}: AchievementOverlayProps) {
  const achievement = type ? achievementRegistry[type] : null;
  const iconById: Record<string, string> = {
    ShieldCheck: "🛡",
    Zap: "⚡",
    Timer: "⏱",
    Target: "🎯",
    Landmark: "🏛",
  };
  const icon = achievement ? iconById[achievement.icon] ?? "✦" : "✦";

  return (
    <AnimatePresence>
      {visible && achievement && (
        <motion.div
          key={`achievement-overlay-${type}`}
          initial={{ y: -220, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -84, opacity: 0 }}
          transition={{
            y: { type: "spring", stiffness: 320, damping: 24, mass: 1.1 },
            opacity: { duration: 0.4 },
            scale: { duration: 0.45 },
          }}
          style={{
            position: "absolute",
            top: "7%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(820px, calc(100vw - 90px))",
            zIndex: 70,
            pointerEvents: "none",
          }}
        >
          <motion.div
            animate={{
              boxShadow: isGrandSlam
                ? [
                    "0 0 24px color-mix(in srgb, var(--gold, #facc15) 44%, transparent), 0 0 16px color-mix(in srgb, var(--cyan, #22d3ee) 34%, transparent)",
                    "0 0 48px color-mix(in srgb, var(--violet, #a78bfa) 54%, transparent), 0 0 28px color-mix(in srgb, var(--red, #ef4444) 40%, transparent)",
                    "0 0 24px color-mix(in srgb, var(--cyan, #22d3ee) 46%, transparent), 0 0 16px color-mix(in srgb, var(--gold, #facc15) 36%, transparent)",
                  ]
                : [
                    `0 0 22px color-mix(in srgb, ${achievement.color} 38%, transparent), 0 0 16px rgba(34,211,238,0.22)`,
                    `0 0 42px color-mix(in srgb, ${achievement.color} 68%, transparent), 0 0 28px rgba(34,211,238,0.42)`,
                    `0 0 22px color-mix(in srgb, ${achievement.color} 38%, transparent), 0 0 16px rgba(34,211,238,0.22)`,
                  ],
              borderColor: isGrandSlam
                ? [
                    "color-mix(in srgb, var(--gold, #facc15) 80%, transparent)",
                    "color-mix(in srgb, var(--cyan, #22d3ee) 80%, transparent)",
                    "color-mix(in srgb, var(--violet, #a78bfa) 80%, transparent)",
                    "color-mix(in srgb, var(--gold, #facc15) 80%, transparent)",
                  ]
                : "rgba(34, 211, 238, 0.45)",
            }}
            transition={{
              duration: isGrandSlam ? 1.2 : 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              display: "grid",
              gridTemplateColumns: "78px 1fr",
              alignItems: "center",
              gap: "16px",
              padding: "16px 20px",
              borderRadius: "16px",
              backdropFilter: "blur(15px)",
              border: "1px solid rgba(34, 211, 238, 0.45)",
              background:
                "linear-gradient(160deg, rgba(7,19,31,0.68) 0%, rgba(10,22,31,0.82) 58%, rgba(24,17,8,0.7) 100%)",
            }}
          >
            {isGrandSlam && (
              <motion.div
                key={`combo-${comboStep}`}
                initial={{ opacity: 0, scale: 0.82, x: 8, y: -8 }}
                animate={{
                  opacity: 1,
                  scale: [0.95, 1.08, 1],
                  x: [8, 10, 8],
                  y: [-8, -7, -8],
                }}
                transition={{ duration: 0.42, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  top: "-13px",
                  right: "-14px",
                  transform: "translate3d(0,0,22px) rotate(-1.4deg)",
                  borderRadius: "10px",
                  border: "1px solid color-mix(in srgb, var(--gold, #facc15) 84%, transparent)",
                  padding: "5px 11px",
                  fontSize: 11,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "var(--gold, #facc15)",
                  background:
                    "linear-gradient(145deg, rgba(56,34,3,0.9) 0%, rgba(26,18,2,0.84) 100%)",
                  textShadow:
                    "0 0 16px color-mix(in srgb, var(--gold, #facc15) 82%, transparent)",
                  boxShadow:
                    "0 0 24px color-mix(in srgb, var(--gold, #facc15) 58%, transparent), 0 0 12px color-mix(in srgb, var(--cyan, #22d3ee) 34%, transparent)",
                  zIndex: 5,
                }}
              >
                COMBO x{comboStep}/{comboCount}
              </motion.div>
            )}
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                border: `1px solid color-mix(in srgb, ${achievement.color} 72%, transparent)`,
                boxShadow: "inset 0 0 14px rgba(34,211,238,0.38)",
                fontSize: 28,
                color: achievement.color,
              }}
            >
              {icon}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily:
                    '"JetBrains Mono","Inter",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
                  textTransform: "uppercase",
                  letterSpacing: ".2em",
                  fontSize: 25,
                  fontWeight: 700,
                  color: achievement.color,
                  textShadow: `0 0 20px color-mix(in srgb, ${achievement.color} 60%, transparent), 0 0 8px rgba(34,211,238,0.5)`,
                }}
              >
                {achievement.title}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  letterSpacing: ".08em",
                  color: "rgba(186,230,253,0.93)",
                }}
              >
                {achievement.subtitle}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { staggerChildren: 0.016, delayChildren: 3.7 } },
              exit: { opacity: 0 },
            }}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            {particleIndices.map((idx) => (
              <motion.span
                key={idx}
                variants={{
                  initial: { opacity: 0, x: 0, y: 0, scale: 1 },
                  animate: {
                    opacity: [0, 0.8, 0],
                    x: (idx - 14) * 10,
                    y: 35 + (idx % 5) * 14,
                    scale: [1, 0.6, 0.2],
                    rotate: (idx - 14) * 4.5,
                    transition: { duration: 0.55, ease: "easeOut" },
                  },
                }}
                style={{
                  position: "absolute",
                  left: `${44 + (idx % 12) * 4.2}%`,
                  top: `${40 + (idx % 3) * 6}%`,
                  width: 5,
                  height: 5,
                  borderRadius: "1px",
                  background:
                    idx % 2 === 0 ? "rgba(250, 204, 21, 0.95)" : "rgba(34, 211, 238, 0.95)",
                  boxShadow:
                    idx % 2 === 0
                      ? "0 0 7px rgba(250, 204, 21, 0.72)"
                      : "0 0 7px rgba(34, 211, 238, 0.72)",
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AchievementOverlay;
