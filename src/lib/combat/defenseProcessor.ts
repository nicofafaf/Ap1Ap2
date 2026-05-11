import {
  shieldMultiplierEffective,
  type NexusAnomalyType,
} from "./anomalyProcessor";

export const MAX_PLAYER_SHIELD = 100;

/** Fenster vor dem Boss-Puls für Perfect Parry (DEFENSE) */
export const PARRY_WINDOW_MS = 200;

/** Sofortige Flow-Wiederherstellung bei Perfect Parry */
export const PARRY_FLOW_RESTORE = 15;

/**
 * Perfect Parry: DEFENSE innerhalb von `windowMs` vor dem geplanten Puls (performance.now()).
 */
export function isPerfectParryWindow(
  nowPerf: number,
  nextPulseDuePerf: number,
  windowMs = PARRY_WINDOW_MS
): boolean {
  if (nextPulseDuePerf <= 0) return false;
  return nowPerf >= nextPulseDuePerf - windowMs && nowPerf <= nextPulseDuePerf;
}

export function computeBossStrikeDamage(
  aggressionLevel: number,
  maxBossHp: number,
  combatPhase: 1 | 2
): number {
  const phaseBonus = combatPhase === 2 ? 9 : 0;
  return Math.round(
    11 + Math.max(1, aggressionLevel) * 4.2 + maxBossHp * 0.026 + phaseBonus
  );
}

export type MitigationResult = {
  nextHP: number;
  nextShield: number;
  absorbedByShield: number;
  shieldBroke: boolean;
};

/**
 * Schaden trifft zuerst das Schild; blockMult pro Schildpunkt absorbiert blockMult Rohschaden (Firewall / Anomalie).
 * armorPierceFraction: Anteil des Rohschadens als True Damage direkt auf HP (Schild wird umgangen).
 */
export function mitigateBossDamageOnPlayer(
  playerHP: number,
  maxPlayerHP: number,
  playerShield: number,
  rawDamage: number,
  shieldStrengthMult: number,
  anomaly: NexusAnomalyType | null,
  armorPierceFraction = 0
): MitigationResult {
  const pierce = Math.max(0, Math.min(1, armorPierceFraction));
  const trueToHp = Math.round(rawDamage * pierce);
  const pool = Math.max(0, rawDamage - trueToHp);

  const blockMult = Math.max(0.22, shieldMultiplierEffective(shieldStrengthMult, anomaly));
  const maxAbsorb = playerShield * blockMult;
  const toShield = Math.min(Math.max(0, pool), maxAbsorb);
  const shieldLoss = blockMult > 0 ? toShield / blockMult : 0;
  const nextShRaw = Math.max(0, playerShield - shieldLoss);
  const remainder = Math.max(0, pool - toShield);
  const hpAfterPool = Math.max(0, Math.min(maxPlayerHP, playerHP - remainder));
  const nextHp = Math.max(0, hpAfterPool - trueToHp);
  const shieldBroke = playerShield > 0 && nextShRaw <= 0;
  return {
    nextHP: nextHp,
    nextShield: nextShRaw,
    absorbedByShield: toShield,
    shieldBroke,
  };
}

/** Dezenter Verfall am Ende einer Boss-Angriffs-Runde (nach Mitigation) */
export function applyRoundEndShieldDecay(shield: number): number {
  if (shield <= 0) return 0;
  return Math.max(0, Math.floor(shield * 0.9));
}

export function computeShieldPulseHeal(params: {
  skillShieldPower: number;
  shieldStrengthMultiplier: number;
  anomaly: NexusAnomalyType | null;
}): number {
  const eff = Math.max(0.35, shieldMultiplierEffective(params.shieldStrengthMultiplier, params.anomaly));
  const base = params.skillShieldPower * 0.38 + 11;
  return Math.max(1, Math.round(base * eff));
}
