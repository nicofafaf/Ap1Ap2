import { motion } from "framer-motion";
import type { AchievementDefinition, AchievementType } from "../../data/achievementRegistry";

type ArtifactCardProps = {
  achievementType: AchievementType;
  definition: AchievementDefinition;
  unlocked: boolean;
  count: number;
  firstUnlocked: string;
  onOpen?: (achievementType: AchievementType) => void;
};

const glowByRarity: Record<AchievementDefinition["rarity"], string> = {
  GODLIKE: "0 0 34px color-mix(in srgb, var(--gold, #facc15) 62%, transparent)",
  LEGENDARY: "0 0 28px color-mix(in srgb, var(--cyan, #22d3ee) 54%, transparent)",
  ELITE: "0 0 22px color-mix(in srgb, var(--violet, #a78bfa) 46%, transparent)",
  RARE: "0 0 18px color-mix(in srgb, var(--red, #ef4444) 42%, transparent)",
};

const iconById: Record<AchievementDefinition["icon"], string> = {
  ShieldCheck: "🛡",
  Zap: "⚡",
  Timer: "⏱",
  Target: "🎯",
  Landmark: "🏛",
};

export function ArtifactCard({
  achievementType,
  definition,
  unlocked,
  count,
  firstUnlocked,
  onOpen,
}: ArtifactCardProps) {
  const dateLabel = firstUnlocked
    ? new Date(firstUnlocked).toLocaleDateString()
    : "Unknown";
  const glow = unlocked ? glowByRarity[definition.rarity] : "none";

  return (
    <motion.button
      type="button"
      onClick={() => unlocked && onOpen?.(achievementType)}
      whileHover={unlocked ? { y: -6, scale: 1.012 } : undefined}
      whileTap={unlocked ? { scale: 0.99 } : undefined}
      style={{
        position: "relative",
        textAlign: "left",
        borderRadius: 16,
        border: `1px solid ${
          unlocked
            ? "color-mix(in srgb, var(--cyan, #22d3ee) 48%, transparent)"
            : "rgba(148,163,184,0.18)"
        }`,
        background: unlocked
          ? "linear-gradient(145deg, rgba(8,20,30,0.68) 0%, rgba(12,16,24,0.82) 100%)"
          : "linear-gradient(145deg, rgba(15,18,25,0.74) 0%, rgba(10,13,20,0.9) 100%)",
        backdropFilter: "blur(30px)",
        boxShadow: `${glow}, inset 0 0 20px rgba(15,23,42,0.42)`,
        padding: "14px 14px 13px",
        minHeight: 150,
        color: unlocked ? "rgba(226, 232, 240, 0.98)" : "rgba(100,116,139,0.9)",
        cursor: unlocked ? "pointer" : "default",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 24% 16%, rgba(34,211,238,0.16), transparent 56%)",
          transform: "translateZ(0)",
          opacity: unlocked ? 1 : 0.25,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              fontSize: 24,
              mixBlendMode: "screen",
              background: unlocked
                ? "rgba(15,23,42,0.44)"
                : "rgba(51,65,85,0.24)",
              filter: unlocked ? "none" : "grayscale(1) contrast(.7)",
            }}
          >
            {unlocked ? iconById[definition.icon] : "◼"}
          </div>
          <span style={{ fontSize: 10, letterSpacing: ".08em", opacity: 0.9 }}>
            {definition.rarity}
          </span>
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: unlocked ? definition.color : "rgba(148,163,184,0.72)",
          }}
        >
          {unlocked ? definition.title : "Data Shadow"}
        </div>
        <div style={{ marginTop: 6, fontSize: 11, opacity: 0.85 }}>
          {unlocked ? definition.subtitle : "Artifact locked"}
        </div>
        <div style={{ marginTop: 10, fontSize: 10, opacity: 0.72 }}>
          First Unlock: {unlocked ? dateLabel : "----"}
        </div>
        <div style={{ marginTop: 4, fontSize: 10, opacity: 0.72 }}>
          Collection Count: {unlocked ? count : 0}
        </div>
        {definition.boost && (
          <div
            style={{
              marginTop: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              borderRadius: 999,
              border: "1px solid color-mix(in srgb, var(--cyan, #22d3ee) 46%, transparent)",
              background: "rgba(6, 78, 59, 0.34)",
              color: unlocked ? "rgba(153,246,228,0.98)" : "rgba(148,163,184,0.72)",
              fontSize: 10,
              letterSpacing: ".05em",
              padding: "3px 8px",
              boxShadow: unlocked
                ? "0 0 12px color-mix(in srgb, var(--cyan, #22d3ee) 28%, transparent)"
                : "none",
            }}
          >
            <span style={{ opacity: 0.9 }}>Passive Boost</span>
            <strong style={{ fontWeight: 700 }}>{definition.boost}</strong>
          </div>
        )}
      </div>

      {unlocked && (
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            right: 12,
            bottom: 11,
            width: 6,
            height: 6,
            borderRadius: "999px",
            background: "color-mix(in srgb, var(--cyan, #22d3ee) 88%, white)",
            boxShadow: "0 0 12px color-mix(in srgb, var(--cyan, #22d3ee) 72%, transparent)",
          }}
        />
      )}
    </motion.button>
  );
}

export default ArtifactCard;
