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
        bottom: "26px",
        transform: "translateX(-50%)",
        zIndex: 46,
        width: "min(1080px, calc(100vw - 40px))",
        pointerEvents: "none",
      }}
    >
      <motion.div
        layout
        style={{
          margin: "0 auto",
          borderRadius: "16px",
          padding: "12px 14px 14px",
          background: hcHud
            ? "linear-gradient(180deg, rgba(22,4,6,0.52) 0%, rgba(12,3,4,0.72) 100%)"
            : "linear-gradient(180deg, rgba(2,14,22,0.44) 0%, rgba(2,12,18,0.66) 100%)",
          border: hcHud
            ? "1px solid rgba(255, 55, 48, 0.42)"
            : "1px solid rgba(34, 211, 238, 0.26)",
          backdropFilter: "blur(10px)",
          boxShadow: hcHud
            ? "0 0 28px rgba(255,55,48,0.22)"
            : "0 0 26px rgba(0,255,255,0.14)",
          overflow: "hidden",
          pointerEvents: "auto",
        }}
      >
        <motion.div
          aria-hidden="true"
          animate={{ x: ["-40%", "140%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: "0 auto 0 -30%",
            width: "30%",
            background:
              "linear-gradient(90deg, rgba(0,255,255,0) 0%, rgba(0,255,255,0.15) 50%, rgba(0,255,255,0) 100%)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: "12px",
            minHeight: "190px",
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
