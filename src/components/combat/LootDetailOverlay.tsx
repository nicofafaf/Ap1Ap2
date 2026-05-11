import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../../store/useGameStore";
import { skillRegistry, type SkillDefinition } from "../../data/skillRegistry";
import { RARITY_LEVELS, type LootRarity } from "../../data/nexusRegistry";
import { SkillCard } from "./SkillCard";
import { useBossAudioEngine } from "../../lib/audio/bossAudioEngine";

type StatRow = {
  id: string;
  label: string;
  value: number;
  max: number;
  display: string;
};

function buildDiscoveryStats(
  skill: SkillDefinition,
  cardDrawMultiplier: number
): StatRow[] {
  const rows: StatRow[] = [];
  if (skill.type === "ATTACK" && skill.damage != null) {
    rows.push({
      id: "dmg",
      label: "Impuls-Stärke",
      value: skill.damage,
      max: 40,
      display: `${skill.damage} DMG`,
    });
  }
  if (skill.type === "DEFENSE" && skill.shield != null) {
    rows.push({
      id: "sh",
      label: "Barriere-Kapazität",
      value: skill.shield,
      max: 80,
      display: `${skill.shield} Schild`,
    });
  }
  if (skill.effect === "DOUBLE_NEXT_HIT") {
    rows.push({
      id: "dbl",
      label: "Resonanzkopplung",
      value: 100,
      max: 100,
      display: "×2 nächster Treffer",
    });
  }
  const drawBonusPct = Math.max(0, Math.round((cardDrawMultiplier - 1) * 100));
  const display =
    drawBonusPct > 0
      ? `+${drawBonusPct}% Kartenzieh-Rate`
      : "+15% Basis-Synergie (Nexus)";
  rows.push({
    id: "draw",
    label: "Technokratischer Zug",
    value: Math.min(100, 15 + drawBonusPct),
    max: 100,
    display,
  });
  return rows;
}

function MiniGraphBar({
  value,
  max,
  delay,
}: {
  value: number;
  max: number;
  delay: number;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div
      style={{
        height: 5,
        borderRadius: 3,
        background: "rgba(8, 24, 36, 0.92)",
        overflow: "hidden",
        border: "1px solid rgba(34,211,238,0.22)",
      }}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct }}
        transition={{
          type: "spring",
          stiffness: 180,
          damping: 22,
          delay: 0.12 + delay * 0.06,
        }}
        style={{
          height: "100%",
          transformOrigin: "0% 50%",
          background:
            "linear-gradient(90deg, rgba(34,211,238,0.85), rgba(167,139,250,0.88))",
          boxShadow: "0 0 12px rgba(0,255,255,0.35)",
        }}
      />
    </div>
  );
}

export function LootDetailOverlay() {
  const {
    identifiedSkillId,
    setIdentifiedSkill,
    collectIdentifiedSkill,
    hand,
    handRarities,
    activeCombatBoosts,
  } = useGameStore(
    useShallow((s) => ({
      identifiedSkillId: s.identifiedSkillId,
      setIdentifiedSkill: s.setIdentifiedSkill,
      collectIdentifiedSkill: s.collectIdentifiedSkill,
      hand: s.hand,
      handRarities: s.handRarities,
      activeCombatBoosts: s.activeCombatBoosts,
    }))
  );
  const { playArtifactHum, stopArtifactHum } = useBossAudioEngine();
  const [collectGlitch, setCollectGlitch] = useState(false);

  const skill = identifiedSkillId ? skillRegistry[identifiedSkillId] : null;
  const rarity: LootRarity = useMemo(() => {
    if (!identifiedSkillId) return "COMMON";
    const i = hand.indexOf(identifiedSkillId);
    return handRarities[i] ?? "COMMON";
  }, [hand, handRarities, identifiedSkillId]);

  const statRows = useMemo(
    () => (skill ? buildDiscoveryStats(skill, activeCombatBoosts.cardDrawMultiplier) : []),
    [skill, activeCombatBoosts.cardDrawMultiplier]
  );

  const tier = RARITY_LEVELS[rarity];

  useEffect(() => {
    if (!identifiedSkillId) return undefined;
    void playArtifactHum();
    return () => {
      stopArtifactHum();
    };
  }, [identifiedSkillId, playArtifactHum, stopArtifactHum]);

  const handleCollect = () => {
    setCollectGlitch(true);
    window.setTimeout(() => {
      collectIdentifiedSkill();
      setCollectGlitch(false);
    }, 520);
  };

  return (
    <AnimatePresence>
      {skill && identifiedSkillId ? (
        <motion.div
          key="loot-detail"
          role="dialog"
          aria-modal="true"
          aria-label="Beute-Identifikation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIdentifiedSkill(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
            background: "rgba(2, 8, 14, 0.52)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 24 }}
            animate={
              collectGlitch
                ? {
                    opacity: [1, 0.85, 1, 0.4, 1],
                    scale: [1, 1.03, 0.96, 1.08, 0.9],
                    x: [0, -6, 8, -5, 4, 0],
                    rotate: [0, -0.8, 1.1, -0.6, 0],
                    filter: [
                      "hue-rotate(0deg) contrast(1)",
                      "hue-rotate(25deg) contrast(1.15)",
                      "hue-rotate(-18deg) contrast(1.25)",
                      "hue-rotate(40deg) contrast(1.4)",
                      "hue-rotate(0deg) contrast(1)",
                    ],
                  }
                : { opacity: 1, scale: 1, y: 0, x: 0, rotate: 0, filter: "none" }
            }
            transition={
              collectGlitch
                ? { duration: 0.48, ease: "easeInOut" }
                : { type: "spring", stiffness: 118, damping: 22, mass: 0.85 }
            }
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(420px, 94vw)",
              maxHeight: "min(88vh, 720px)",
              overflow: "auto",
              borderRadius: 20,
              border: `1px solid ${tier.color}`,
              boxShadow: `0 0 60px rgba(0,0,0,0.45), ${tier.glow} ${tier.color}`,
              background:
                "linear-gradient(165deg, rgba(6,18,28,0.82) 0%, rgba(4,12,20,0.92) 100%)",
              padding: "22px 20px 20px",
            }}
          >
            <motion.div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 20,
                pointerEvents: "none",
                overflow: "hidden",
              }}
            >
              <motion.div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: "22%",
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(0,255,255,0.14) 50%, transparent 100%)",
                }}
                animate={{ top: ["-25%", "125%"] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>

            <button
              type="button"
              onClick={() => setIdentifiedSkill(null)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: 10,
                border: "1px solid rgba(34,211,238,0.35)",
                background: "rgba(3,14,22,0.75)",
                color: "rgba(186,230,253,0.95)",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                zIndex: 3,
              }}
              aria-label="Schließen"
            >
              ×
            </button>

            <div style={{ position: "relative", zIndex: 2 }}>
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 10,
                  letterSpacing: "0.28em",
                  fontSize: 10,
                  textTransform: "uppercase",
                  color: "rgba(103, 232, 249, 0.88)",
                }}
              >
                Nexus Identifikation
              </div>
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: "clamp(1.15rem, 3.2vw, 1.45rem)",
                  fontWeight: 700,
                  color: "rgba(248, 250, 252, 0.96)",
                  textAlign: "center",
                  letterSpacing: "0.04em",
                }}
              >
                {skill.name}
              </h2>
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 16,
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: tier.color,
                  textShadow: `${tier.glow} ${tier.color}`,
                }}
              >
                {rarity}
              </div>

              <div
                style={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 18,
                  perspective: 1200,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    transform: "rotateX(6deg)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: -2,
                      borderRadius: 18,
                      background:
                        "radial-gradient(ellipse at center, rgba(0,255,255,0.12), transparent 70%)",
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "relative",
                      borderRadius: 16,
                      overflow: "hidden",
                      boxShadow:
                        "0 0 40px rgba(0,255,255,0.18), inset 0 0 0 1px rgba(34,211,238,0.25)",
                    }}
                  >
                    <motion.div
                      aria-hidden
                      style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 4,
                        mixBlendMode: "screen",
                        background:
                          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 3px)",
                      }}
                    />
                    <motion.div
                      aria-hidden
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        height: "28%",
                        zIndex: 5,
                        pointerEvents: "none",
                        background:
                          "linear-gradient(180deg, transparent 0%, rgba(0,255,255,0.22) 45%, transparent 90%)",
                      }}
                      animate={{ top: ["-30%", "130%"] }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <SkillCard
                      skill={skill}
                      compact
                      lootRarity={rarity}
                      interactionDisabled
                    />
                  </div>
                </div>
              </div>

              <p
                style={{
                  margin: "0 0 18px",
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: "rgba(186, 230, 253, 0.9)",
                  textAlign: "center",
                  padding: "0 4px",
                }}
              >
                {skill.discoveryLore}
              </p>

              <div
                style={{
                  borderRadius: 14,
                  padding: "12px 12px 14px",
                  background: "rgba(2, 12, 20, 0.72)",
                  border: "1px solid rgba(34,211,238,0.2)",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(125, 211, 252, 0.85)",
                    marginBottom: 10,
                  }}
                >
                  System-Parameter
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {statRows.map((row, idx) => (
                    <div key={row.id}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          gap: 10,
                          marginBottom: 4,
                          fontSize: 11,
                          fontFamily:
                            '"JetBrains Mono",ui-monospace,monospace',
                          color: "rgba(207, 250, 254, 0.92)",
                        }}
                      >
                        <span style={{ letterSpacing: "0.06em" }}>{row.label}</span>
                        <span style={{ color: "rgba(34,211,238,0.95)" }}>
                          {row.display}
                        </span>
                      </div>
                      <MiniGraphBar value={row.value} max={row.max} delay={idx} />
                    </div>
                  ))}
                </div>
              </div>

              <motion.button
                type="button"
                onClick={handleCollect}
                disabled={collectGlitch}
                whileHover={collectGlitch ? undefined : { scale: 1.02 }}
                whileTap={collectGlitch ? undefined : { scale: 0.98 }}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(250, 204, 21, 0.55)",
                  background:
                    "linear-gradient(180deg, rgba(250,204,21,0.18) 0%, rgba(34,211,238,0.12) 100%)",
                  color: "rgba(254, 249, 195, 0.96)",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontSize: 11,
                  cursor: collectGlitch ? "wait" : "pointer",
                  boxShadow: "0 0 24px rgba(250, 204, 21, 0.22)",
                }}
              >
                In Sammlung überführen
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default LootDetailOverlay;
