import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  computeDailyRewardMultiplier,
  DAILY_PURPLE_BORDER,
  DAILY_PURPLE_GLOW,
  DAILY_PURPLE_MUTED,
  DAILY_PURPLE_NEON,
  formatCountdownHMS,
  getDailyIncursionDefinition,
  getUtcDateKey,
  secondsUntilNextUtcMidnight,
  simulateGlobalDailyLeaderboard,
} from "../../lib/dailyIncursion";
import { useGameStore } from "../../store/useGameStore";

export function GlobalLeaderboard() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const dateKey = useMemo(() => getUtcDateKey(), [tick]);
  const daily = useMemo(() => getDailyIncursionDefinition(dateKey), [dateKey]);
  const secLeft = useMemo(() => secondsUntilNextUtcMidnight(), [tick]);

  const dailyRankedClearDateUtc = useGameStore((s) => s.dailyRankedClearDateUtc);
  const streak = useGameStore((s) => s.dailyParticipationStreak);
  const playerDailyBest = useGameStore((s) => s.playerDailyBest);

  const playerRow = useMemo(() => {
    if (!playerDailyBest || playerDailyBest.dateKey !== dateKey) return null;
    return playerDailyBest.row;
  }, [playerDailyBest, dateKey]);

  const rows = useMemo(
    () => simulateGlobalDailyLeaderboard(dateKey, daily.seed, playerRow, 50),
    [dateKey, daily.seed, playerRow]
  );

  const nextMult = computeDailyRewardMultiplier(streak);
  const rankedDoneToday = dailyRankedClearDateUtc === dateKey;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          border: `1px solid ${DAILY_PURPLE_BORDER}`,
          background: "linear-gradient(168deg, rgba(30,12,48,0.88) 0%, rgba(8,6,18,0.94) 100%)",
          boxShadow: `0 0 32px ${DAILY_PURPLE_GLOW}`,
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: ".28em",
            color: DAILY_PURPLE_MUTED,
          }}
        >
          GLOBAL DAILY · UTC {dateKey}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: ".06em",
            color: DAILY_PURPLE_NEON,
          }}
        >
          Inkursions-Sektor LF{daily.targetLf} · Phase {daily.startCombatPhase}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            lineHeight: 1.55,
            color: "rgba(233,213,255,0.88)",
            maxWidth: 720,
          }}
        >
          Top 50 Architekten nach Score (Zeit, Präzision, Rang) — Konkurrenz simuliert aus globalem
          Tages-Seed · Nächster Reset{" "}
          <span style={{ color: DAILY_PURPLE_NEON }}>{formatCountdownHMS(secLeft)}</span>
        </div>
        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 11,
            letterSpacing: ".08em",
            color: "rgba(224, 231, 255, 0.82)",
          }}
        >
          <span>
            Streak{" "}
            <strong style={{ color: DAILY_PURPLE_NEON }}>{streak}</strong> Tage
          </span>
          <span>
            DailyRewardMultiplier{" "}
            <strong style={{ color: DAILY_PURPLE_NEON }}>×{nextMult.toFixed(2)}</strong>
          </span>
          <span style={{ color: rankedDoneToday ? DAILY_PURPLE_NEON : "rgba(248,113,113,0.9)" }}>
            {rankedDoneToday ? "Ranked-Slot heute vergeben · weitere Runs = Praxis" : "Ranked-Slot offen"}
          </span>
        </div>
      </div>

      <div
        style={{
          borderRadius: 12,
          border: `1px solid ${DAILY_PURPLE_BORDER}`,
          overflow: "hidden",
          background: "rgba(3,6,14,0.72)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "44px 1fr 120px 100px 80px 52px",
            gap: 8,
            padding: "10px 14px",
            fontSize: 9,
            letterSpacing: ".2em",
            color: DAILY_PURPLE_MUTED,
            borderBottom: `1px solid ${DAILY_PURPLE_BORDER}`,
          }}
        >
          <span>#</span>
          <span>ARCHITEKT</span>
          <span>ZEIT</span>
          <span>PRÄZISION</span>
          <span>RANG</span>
          <span>SCORE</span>
        </div>
        <div style={{ maxHeight: "min(52vh, 520px)", overflow: "auto" }}>
          {rows.map((r, i) => {
            const place = i + 1;
            const isYou = Boolean(r.isLocalPlayer);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.012, duration: 0.18 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr 120px 100px 80px 52px",
                  gap: 8,
                  alignItems: "center",
                  padding: "9px 14px",
                  fontSize: 12,
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  borderBottom: "1px solid rgba(192,132,252,0.12)",
                  background: isYou ? "rgba(192,132,252,0.12)" : "transparent",
                  color: isYou ? DAILY_PURPLE_NEON : "rgba(224,250,255,0.92)",
                }}
              >
                <span style={{ opacity: 0.75 }}>{place}</span>
                <span style={{ fontWeight: isYou ? 700 : 500 }}>{r.displayName}</span>
                <span>{r.elapsedSec.toFixed(1)}s</span>
                <span>{(r.accuracy * 100).toFixed(0)}%</span>
                <span>{r.combatRank}</span>
                <span style={{ fontWeight: 700 }}>{r.score}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GlobalLeaderboard;
