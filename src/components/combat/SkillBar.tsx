import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../../store/useGameStore";
import { skillRegistry, type SkillId } from "../../data/skillRegistry";
import { SkillCard } from "./SkillCard";

export function SkillBar() {
  const {
    hand,
    handRarities,
    playCardFromHand,
    victoryFinisherComplete,
    isLootErupting,
    gameState,
    setIdentifiedSkill,
    activeCombatAnomaly,
      dataTurbulenceStamina,
      handAnomalyCosts,
      synapticFlow,
      triggerSynapticOverload,
      hardcoreDriftEnabled,
    } = useGameStore(
    useShallow((s) => ({
      hand: s.hand,
      handRarities: s.handRarities,
      playCardFromHand: s.playCardFromHand,
      victoryFinisherComplete: s.victoryFinisherComplete,
      isLootErupting: s.isLootErupting,
      gameState: s.gameState,
      setIdentifiedSkill: s.setIdentifiedSkill,
      activeCombatAnomaly: s.activeCombatAnomaly,
      dataTurbulenceStamina: s.dataTurbulenceStamina,
      handAnomalyCosts: s.handAnomalyCosts,
      synapticFlow: s.synapticFlow,
      triggerSynapticOverload: s.triggerSynapticOverload,
      hardcoreDriftEnabled: s.hardcoreDriftEnabled,
    }))
  );
  const combatLive = gameState === "FIGHTING" || gameState === "STARTING";
  const hcHud = combatLive && hardcoreDriftEnabled;
  const postVictoryInspect =
    gameState === "VICTORY" && victoryFinisherComplete && !isLootErupting;
  const useSharedHandLayout = victoryFinisherComplete && !isLootErupting;
  const [launchingCard, setLaunchingCard] = useState<SkillId | null>(null);

  const visibleCards = useMemo(() => hand.slice(0, 5), [hand]);

  const handlePlay = (skillId: SkillId) => {
    if (postVictoryInspect) {
      setIdentifiedSkill(skillId);
      return;
    }
    setLaunchingCard(skillId);
    window.setTimeout(() => {
      playCardFromHand(skillId);
      setLaunchingCard(null);
    }, 220);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: "22px",
        transform: "translateX(-50%)",
        zIndex: 46,
        width: "min(980px, calc(100vw - 40px))",
        pointerEvents: "none",
      }}
    >
      <motion.div
        layout
        style={{
          margin: "0 auto",
          borderRadius: "28px",
          padding: "12px 16px",
          background: hcHud
            ? "rgba(76, 32, 28, 0.55)"
            : "rgba(251,247,239,0.14)",
          border: hcHud
            ? "1px solid rgba(255, 55, 48, 0.42)"
            : "1px solid rgba(251,247,239,0.16)",
          backdropFilter: "blur(16px)",
          boxShadow: hcHud
            ? "0 0 28px rgba(255,55,48,0.22)"
            : "0 24px 70px rgba(0,0,0,0.22)",
          overflow: "hidden",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: "14px",
            minHeight: "154px",
          }}
        >
          <AnimatePresence initial={false}>
            {visibleCards.map((id, index) => {
              const skill = skillRegistry[id];
              if (!skill) return null;
              const center = (visibleCards.length - 1) / 2;
              const delta = index - center;
              const baseRotate = delta * 6;
              const isLaunching = launchingCard === id;
              const turbCost =
                activeCombatAnomaly === "DATA_TURBULENCE"
                  ? (handAnomalyCosts[index] ?? 0)
                  : null;
              const turbBlocked =
                activeCombatAnomaly === "DATA_TURBULENCE" &&
                dataTurbulenceStamina < (handAnomalyCosts[index] ?? 0);
              return (
                <motion.div
                  key={`${id}-${index}`}
                  layoutId={
                    useSharedHandLayout ? `skill-hand-${index}-${id}` : undefined
                  }
                  initial={
                    useSharedHandLayout
                      ? false
                      : { opacity: 0, y: 80, scale: 0.92 }
                  }
                  animate={{
                    opacity: 1,
                    y: isLaunching ? -180 : Math.abs(delta) * 8,
                    scale: isLaunching ? 0.9 : 1,
                    rotate: isLaunching ? baseRotate : baseRotate,
                  }}
                  exit={{ opacity: 0, y: -220, scale: 0.78 }}
                  transition={{
                    y: { type: "spring", stiffness: 220, damping: 20 },
                    opacity: { duration: 0.24 },
                    scale: { type: "spring", stiffness: 210, damping: 18 },
                    rotate: { type: "spring", stiffness: 220, damping: 21 },
                  }}
                  style={{
                    transformOrigin: "bottom center",
                    filter: isLaunching
                      ? "drop-shadow(0 0 24px rgba(0,255,255,0.55))"
                      : "none",
                  }}
                >
                  <SkillCard
                    skill={skill}
                    compact
                    lootRarity={handRarities[index] ?? "COMMON"}
                    onPlaySkill={(skillId) => handlePlay(skillId)}
                    dataTurbulenceCost={turbCost}
                    dataTurbulenceBlocked={turbBlocked}
                    overloadReady={!postVictoryInspect && synapticFlow >= 100}
                    onSynapticOverload={triggerSynapticOverload}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default SkillBar;
