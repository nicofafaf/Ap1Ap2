import { motion } from "framer-motion";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { getTalentMultiplierForPath, useGameStore, type TalentPathId } from "../../store/useGameStore";

type BoostChip = {
  id: string;
  label: string;
  value: string;
  active: boolean;
  talentPath: TalentPathId | null;
};

export function ActiveBoostsHUD() {
  const state = useGameStore(
    useShallow((s) => ({
      activeCombatBoosts: s.activeCombatBoosts,
      talentLevels: s.talentLevels,
      damagePulseToken: s.damagePulseToken,
      skillVfxToken: s.skillVfxToken,
      gameState: s.gameState,
    }))
  );

  const chips = useMemo<BoostChip[]>(
    () => [
      {
        id: "crit",
        label: "CRIT",
        value: `+${Math.round((state.activeCombatBoosts.criticalDamageMultiplier - 1) * 100)}%`,
        active: state.activeCombatBoosts.criticalDamageMultiplier > 1.001,
        talentPath: "overclock",
      },
      {
        id: "draw",
        label: "DRAW",
        value: `+${Math.round((state.activeCombatBoosts.cardDrawMultiplier - 1) * 100)}%`,
        active: state.activeCombatBoosts.cardDrawMultiplier > 1.001,
        talentPath: "throughput",
      },
      {
        id: "shield",
        label: "SHIELD",
        value: `+${Math.round((state.activeCombatBoosts.shieldStrengthMultiplier - 1) * 100)}%`,
        active: state.activeCombatBoosts.shieldStrengthMultiplier > 1.001,
        talentPath: "firewall",
      },
    ].filter((chip) => chip.active),
    [state.activeCombatBoosts, state.talentLevels]
  );

  if (!chips.length) return null;
  const pulseKey = `${state.damagePulseToken}-${state.skillVfxToken}`;

  return (
    <motion.div
      layout
      style={{
        position: "absolute",
        left: "50%",
        bottom: "232px",
        transform: "translateX(-50%)",
        zIndex: 45,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {chips.map((chip) => {
        const tp = chip.talentPath;
        const tl = tp ? state.talentLevels[tp] : 0;
        const corePct =
          tp && tl > 0 ? Math.round((getTalentMultiplierForPath(tp, tl) - 1) * 100) : 0;
        return (
          <motion.div
            key={chip.id}
            layout
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <motion.div
              layout
              animate={
                state.gameState === "FIGHTING"
                  ? { scale: [1, 1.04, 1], opacity: [0.88, 1, 0.88] }
                  : { scale: 1, opacity: 0.8 }
              }
              transition={{
                duration: 1.15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(34,211,238,0.42)",
                background: "rgba(8, 26, 38, 0.76)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 0 16px rgba(34,211,238,0.24)",
                padding: "5px 10px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                mixBlendMode: "screen",
              }}
            >
              <motion.span
                key={`${chip.id}-${pulseKey}`}
                initial={{ scale: 1, opacity: 0.85 }}
                animate={{ scale: [1, 1.22, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 0.36, ease: "easeOut" }}
                style={{ fontSize: 12 }}
              >
                ✦
              </motion.span>
              <span style={{ fontSize: 10, letterSpacing: ".08em", opacity: 0.95 }}>{chip.label}</span>
              <strong style={{ fontSize: 11, letterSpacing: ".08em" }}>{chip.value}</strong>
            </motion.div>
            {tp && tl > 0 ? (
              <span
                style={{
                  fontSize: 8,
                  letterSpacing: ".14em",
                  opacity: 0.52,
                  color: "rgba(186, 230, 253, 0.85)",
                  whiteSpace: "nowrap",
                }}
              >
                Kern +{corePct}%
              </span>
            ) : null}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default ActiveBoostsHUD;
