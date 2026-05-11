/**
 * Anomalien auf der Weltkarte: deterministisch pro 4h-Epoche + erreichbare Sektoren,
 * damit alle Spieler zur selben „Wetterlage“ greifen können und trotzdem Variation pro Sektor bleibt
 */
export type NexusAnomalyType = "GLITCH_STORM" | "VOID_RESONANCE" | "DATA_TURBULENCE";

const ANOMALY_TYPES: NexusAnomalyType[] = [
  "GLITCH_STORM",
  "VOID_RESONANCE",
  "DATA_TURBULENCE",
];

export const ANOMALY_FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export function anomalySeedEpoch(now = Date.now()): number {
  return Math.floor(now / ANOMALY_FOUR_HOURS_MS);
}

export function createSeededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mischt Kalender-Epoche mit der Menge erreichbarer LF — gleiche Inputs ⇒ gleiche Anomalie-Ziehung (reproduzierbar, debugbar) */
export function mixSeed(epoch: number, reachableLf: number[]): number {
  let h = epoch >>> 0;
  for (const lf of reachableLf) {
    h = Math.imul(h ^ lf, 0x9e3779b1);
  }
  return h >>> 0;
}

export function countAnomaliesToSpawn(rng: () => number): number {
  return rng() < 0.48 ? 2 : 1;
}

export function pickSectorAnomalies(
  rng: () => number,
  reachable: number[],
  count: number
): Partial<Record<number, NexusAnomalyType>> {
  if (reachable.length === 0) return {};
  const n = Math.min(Math.max(1, count), reachable.length);
  const pool = [...reachable];
  const out: Partial<Record<number, NexusAnomalyType>> = {};
  for (let i = 0; i < n; i += 1) {
    const idx = Math.floor(rng() * pool.length);
    const lf = pool.splice(idx, 1)[0]!;
    const ti = Math.floor(rng() * ANOMALY_TYPES.length);
    out[lf] = ANOMALY_TYPES[ti] ?? "GLITCH_STORM";
  }
  return out;
}

export function rollGlitchMiss(rng: () => number): boolean {
  return rng() < 0.2;
}

export type AnomalyBoostSlice = {
  criticalDamageMultiplier: number;
  criticalResistanceMultiplier: number;
  shieldStrengthMultiplier: number;
};

export function outgoingDamageMultipliers(
  boosts: AnomalyBoostSlice,
  anomaly: NexusAnomalyType | null
): { critM: number; resistM: number } {
  let critM = boosts.criticalDamageMultiplier;
  const resistM = boosts.criticalResistanceMultiplier;
  if (anomaly === "VOID_RESONANCE") {
    critM *= 2;
  }
  return { critM, resistM };
}

export function shieldMultiplierEffective(
  base: number,
  anomaly: NexusAnomalyType | null
): number {
  if (anomaly === "VOID_RESONANCE") return base * 0.5;
  return base;
}

export function rollHandCosts(handLength: number, rng: () => number): number[] {
  return Array.from({ length: handLength }, () => Math.floor(rng() * 4));
}

export function nextDataTurbulenceStamina(current: number, cap = 10): number {
  return Math.min(cap, current + 3);
}

export function anomalyPlaybackPitch(anomaly: NexusAnomalyType | null): number {
  if (!anomaly) return 1;
  if (anomaly === "VOID_RESONANCE") return 0.972;
  if (anomaly === "DATA_TURBULENCE") return 1.016;
  return 0.984;
}

export function anomalyWaveShaperDrive(anomaly: NexusAnomalyType): number {
  if (anomaly === "GLITCH_STORM") return 3.55;
  if (anomaly === "VOID_RESONANCE") return 2.75;
  return 2.32;
}
