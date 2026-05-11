import type { SkillDefinition, SkillType } from "../../data/skillRegistry";

/** Dauer Boss-Puls-Frost bei Synaptic Overload (ms) */
export const SYNAPTIC_OVERLOAD_FREEZE_MS = 3000;

/** Screen-Space FX / Zeitlupe-Fenster (ms) */
export const SYNAPTIC_OVERLOAD_FX_MS = 2800;

/** Basis-Flow pro erfolgreicher Karte */
export const FLOW_GAIN_BASE = 13;

/** Zusatz-Flow bei gleichem Kartentyp wie zuvor */
export const FLOW_SYNERGY_BONUS = 11;

/**
 * Flow-Verfall pro Sekunde (F_decay) — hält rhythmischen Druck aufrecht
 */
export const FLOW_DECAY_PER_SECOND = 8;

/** Flow-Verlust bei Boss-Treffer (Gegenschlag) */
export const FLOW_HIT_PENALTY = 22;

/** Flow-Verlust bei Glitch-Miss */
export const FLOW_GLITCH_MISS_PENALTY = 14;

export function applyFlowDecay(currentFlow: number, deltaSec: number): number {
  if (currentFlow <= 0 || deltaSec <= 0) return currentFlow;
  return Math.max(0, currentFlow - FLOW_DECAY_PER_SECOND * deltaSec);
}

export function flowGainForCard(lastType: SkillType | null, skillType: SkillType): number {
  const synergy = lastType === skillType;
  return FLOW_GAIN_BASE + (synergy ? FLOW_SYNERGY_BONUS : 0);
}

export function applyFlowAfterSuccessfulCard(
  flow: number,
  combo: number,
  lastType: SkillType | null,
  skillType: SkillType
): { synapticFlow: number; combatComboCount: number; lastFlowSkillType: SkillType } {
  const gain = flowGainForCard(lastType, skillType);
  return {
    synapticFlow: Math.min(100, flow + gain),
    combatComboCount: combo + 1,
    lastFlowSkillType: skillType,
  };
}

export function applyFlowAfterBossCounterHit(flow: number): {
  synapticFlow: number;
  combatComboCount: number;
  lastFlowSkillType: null;
} {
  return {
    synapticFlow: Math.max(0, flow - FLOW_HIT_PENALTY),
    combatComboCount: 0,
    lastFlowSkillType: null,
  };
}

export function applyFlowAfterGlitchMiss(flow: number): {
  synapticFlow: number;
  combatComboCount: number;
  lastFlowSkillType: null;
} {
  return {
    synapticFlow: Math.max(0, flow - FLOW_GLITCH_MISS_PENALTY),
    combatComboCount: 0,
    lastFlowSkillType: null,
  };
}

/** Schadens-Multiplikator aus aktuellem Flow (Anzeige + Kampf) */
export function damageMultiplierForFlow(flow: number): number {
  if (flow >= 100) return 2;
  if (flow >= 50) return 1.5;
  return 1;
}

export function flowMultiplierLabel(flow: number): string {
  const m = damageMultiplierForFlow(flow);
  if (m >= 2) return "×2.0";
  if (m >= 1.5) return "×1.5";
  return "×1.0";
}

/** Combo-Rang neben Flow (CombatHUD / Indikator) */
export function comboRankFromCount(combo: number): "D" | "C" | "B" | "A" | "S" | "NEXUS" {
  if (combo >= 20) return "NEXUS";
  if (combo >= 14) return "S";
  if (combo >= 9) return "A";
  if (combo >= 5) return "B";
  if (combo >= 2) return "C";
  return "D";
}

export function computeSynapticOverloadDamage(
  skill: SkillDefinition | undefined,
  maxBossHp: number
): number {
  const typeMul = skill?.type === "ATTACK" ? 2.35 : skill?.type === "DEFENSE" ? 1.85 : 2.05;
  const fromCard = Math.round((skill?.damage ?? skill?.shield ?? 26) * typeMul);
  const bossSlice = Math.round(maxBossHp * 0.055);
  return Math.max(24, fromCard + bossSlice);
}
