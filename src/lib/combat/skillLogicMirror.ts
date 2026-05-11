import type { SkillId } from "../../data/skillRegistry";

export type SkillMirrorPayload = {
  title: string;
  lang: "typescript";
  code: string;
  concepts: string;
};

/** Repräsentativer Store-naher Code + Kurz-Erklärung für das Source-Mirror-Overlay */
export const SKILL_LOGIC_MIRROR: Record<SkillId, SkillMirrorPayload> = {
  SKILL_01_OVERCLOCK: {
    title: "System Overclock — Schadenspfad",
    lang: "typescript",
    code: `// useGameStore.playSkillCard — vereinfacht (ATTACK)
const skill = skillRegistry[skillId];
const dmg = skill.damage ?? 0;
const { critM, resistM } = outgoingDamageMultipliers(
  state.activeCombatBoosts,
  state.activeCombatAnomaly
);
const flowMul = damageMultiplierForFlow(state.synapticFlow);
const scaledDamage = Math.round(dmg * critM * resistM * flowMul);
const appliedDamage = state.pendingDoubleHit ? scaledDamage * 2 : scaledDamage;
const nextHp = Math.max(0, state.currentBossHP - appliedDamage);`,
    concepts:
      "Variablen wie scaledDamage sammeln Zwischenergebnisse. Funktionen (outgoingDamageMultipliers, damageMultiplierForFlow) kapseln Regeln — so bleibt der Store lesbar. Der ternäre Ausdruck bei appliedDamage verdoppelt den Schaden nur, wenn vorher die Recursion-Karte pendingDoubleHit gesetzt hat",
  },
  SKILL_02_ENCRYPT: {
    title: "Cipher Shield — Schild & Parry-Fenster",
    lang: "typescript",
    code: `// DEFENSE-Zweig in playSkillCard
const rawGain = computeShieldPulseHeal({
  skillShieldPower: skill.shield ?? 0,
  shieldStrengthMultiplier: state.activeCombatBoosts.shieldStrengthMultiplier,
  anomaly: state.activeCombatAnomaly,
});
const gain = state.isSingularityActive ? 0 : rawGain;
const nextShield = Math.min(MAX_PLAYER_SHIELD, state.playerShield + gain);
const parry = isPerfectParryWindow(performance.now(), state.bossNextPulseDueAtPerf);`,
    concepts:
      "Objekt-Literale gruppieren Parameter für computeShieldPulseHeal — das ist ein typisches API-Muster. Math.min begrenzt den Schild auf MAX_PLAYER_SHIELD. performance.now liefert hochauflösende Zeit für das Parry-Fenster statt Date.now",
  },
  SKILL_03_RECURSION: {
    title: "Infinite Recursion — Zustands-Flag",
    lang: "typescript",
    code: `// SPECIAL: nächster Treffer doppelt
if (skill.type === "SPECIAL" && skill.effect === "DOUBLE_NEXT_HIT") {
  return {
    pendingDoubleHit: true,
    skillVfxToken: state.skillVfxToken + 1,
    activeSkillVfx: skill.vfx,
    // … Flow-Update via applyFlowAfterSuccessfulCard
  };
}`,
    concepts:
      "Statt sofort Schaden zu rechnen, setzt diese Karte nur ein Boolean im Zustand (pendingDoubleHit). Der nächste ATTACK-Zweig liest dieses Flag — das entkoppelt Spezial-Logik von der eigentlichen Trefferberechnung (State-Machine-Idee in wenigen Zeilen)",
  },
};
