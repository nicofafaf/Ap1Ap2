import { useMemo } from "react";
import { motion } from "framer-motion";
import { achievementOrder, achievementRegistry } from "../../data/achievementRegistry";
import type { GlobalCollectionEntry } from "../../store/useGameStore";

type LeaderboardSimProps = {
  globalCollection: Record<string, GlobalCollectionEntry>;
};

type LeaderboardRow = {
  id: string;
  name: string;
  score: number;
  rank: number;
  achievements: number;
  isUser?: boolean;
};

const botSeeds: Array<{ id: string; name: string; score: number; achievements: number }> = [
  { id: "bot-1", name: "Kara Voidforge", score: 1390, achievements: 39 },
  { id: "bot-2", name: "Izan Fluxline", score: 1250, achievements: 34 },
  { id: "bot-3", name: "Mira Synth", score: 1120, achievements: 31 },
  { id: "bot-4", name: "Dax Nebula", score: 980, achievements: 27 },
  { id: "bot-5", name: "Rei Nullbit", score: 910, achievements: 22 },
  { id: "bot-6", name: "Nova Grid", score: 840, achievements: 21 },
  { id: "bot-7", name: "Seth Ironbyte", score: 770, achievements: 19 },
];

export function LeaderboardSim({ globalCollection }: LeaderboardSimProps) {
  const rows = useMemo(() => {
    const userAchievementCount = achievementOrder.reduce(
      (sum, key) => sum + (globalCollection[key]?.count ?? 0),
      0
    );
    const userScore = achievementOrder.reduce((sum, key) => {
      const count = globalCollection[key]?.count ?? 0;
      return sum + count * achievementRegistry[key].priority;
    }, 0);

    const merged: LeaderboardRow[] = [
      ...botSeeds.map((b) => ({ ...b, rank: 0 })),
      {
        id: "user",
        name: "You - Nexus Architect",
        score: userScore,
        achievements: userAchievementCount,
        isUser: true,
        rank: 0,
      },
    ]
      .sort((a, b) => b.score - a.score)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    return merged.slice(0, 10);
  }, [globalCollection]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{
        borderRadius: 16,
        border: "1px solid rgba(34,211,238,0.28)",
        backdropFilter: "blur(25px)",
        background:
          "linear-gradient(145deg, rgba(7,19,31,0.78) 0%, rgba(9,16,26,0.92) 100%)",
        padding: "12px 12px 8px",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: ".14em", opacity: 0.86, marginBottom: 8 }}>
        GLOBAL LEADERBOARD SIM
      </div>
      <div style={{ maxHeight: 350, overflowY: "auto", display: "grid", gap: 6 }}>
        {rows.map((row) => {
          const isTop3 = row.rank <= 3;
          return (
            <div
              key={row.id}
              style={{
                display: "grid",
                gridTemplateColumns: "34px 1fr auto",
                gap: 10,
                alignItems: "center",
                borderRadius: 10,
                border: `1px solid ${
                  row.isUser
                    ? "rgba(34,211,238,0.7)"
                    : isTop3
                      ? "rgba(250,204,21,0.46)"
                      : "rgba(71,85,105,0.3)"
                }`,
                background: row.isUser
                  ? "rgba(8,44,58,0.5)"
                  : isTop3
                    ? "rgba(56,34,3,0.32)"
                    : "rgba(15,23,42,0.38)",
                padding: "8px 9px",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textAlign: "center",
                  color: isTop3 ? "var(--gold, #facc15)" : "rgba(191,219,254,0.92)",
                  textShadow: isTop3
                    ? "0 0 10px color-mix(in srgb, var(--gold, #facc15) 65%, transparent)"
                    : "none",
                }}
              >
                #{row.rank}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {row.name}
                </div>
                <div style={{ fontSize: 10, opacity: 0.75 }}>
                  Achievements {row.achievements}
                </div>
              </div>
              <div style={{ fontSize: 11, letterSpacing: ".06em", opacity: 0.9 }}>{row.score} pts</div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default LeaderboardSim;
