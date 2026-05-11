/**
 * Trend- und Glättungslogik für Architect Performance (Historie-Graphen)
 */

const DEFAULT_MA_WINDOW = 3;

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Gleitender Durchschnitt (trailing); kürzere Präfixe nutzen verfügbare Länge */
export function movingAverage(values: number[], window = DEFAULT_MA_WINDOW): number[] {
  if (values.length === 0) return [];
  const w = Math.max(1, Math.floor(window));
  const out: number[] = [];
  for (let i = 0; i < values.length; i += 1) {
    const start = Math.max(0, i - w + 1);
    const slice = values.slice(start, i + 1);
    out.push(mean(slice));
  }
  return out;
}

export type TrendDirection = "improving" | "stagnating" | "declining";

export type TrendVector = {
  movingAverage: number[];
  direction: TrendDirection;
  /** Differenz späterer vs früherer Performance-Hälfte auf Basis der MA (≈ −1…1) */
  delta: number;
};

const FLAT_EPS = 0.035;

/** Trend-Vektor aus einer Accuracy-Zeitreihe (0…1): gleitender Mittelwert + Richtung */
export function computePerformanceTrend(
  accuracyRates: number[],
  window = DEFAULT_MA_WINDOW
): TrendVector {
  const movingAvg = movingAverage(accuracyRates, window);
  if (movingAvg.length < 2) {
    return { movingAverage: movingAvg, direction: "stagnating", delta: 0 };
  }
  const mid = Math.floor(movingAvg.length / 2);
  const early = mean(movingAvg.slice(0, mid || 1));
  const late = mean(movingAvg.slice(mid));
  const delta = late - early;
  let direction: TrendDirection = "stagnating";
  if (delta > FLAT_EPS) direction = "improving";
  else if (delta < -FLAT_EPS) direction = "declining";
  return { movingAverage: movingAvg, direction, delta };
}

/** Zeitnote als normierte Skala 0…1 (S oben) */
export function timeGradeToUnit(grade: "S" | "A" | "B" | "C"): number {
  switch (grade) {
    case "S":
      return 1;
    case "A":
      return 0.75;
    case "B":
      return 0.5;
    case "C":
      return 0.25;
    default:
      return 0.25;
  }
}

export const CRITICAL_ACCURACY = 0.55;

export function hasSubCriticalAccuracy(accuracyRates: number[], threshold = CRITICAL_ACCURACY): boolean {
  return accuracyRates.some((a) => a < threshold);
}

/** Kampf-Signatur für narrative Persona (Dossier / Archiv) */
export type ArchitectPersonaInput = {
  shieldMitigationEfficiencyPct: number;
  combatComboCount: number;
  synapticFlow: number;
  missedSkills: number;
  accuracyRate: number;
  elapsedSec: number;
  combatRank: "S" | "A" | "B" | "C";
};

export type ArchitectPersona = {
  id: string;
  title: string;
  /** Kurzbeschreibung fürs Archiv */
  flavor: string;
};

const PERSONA_ORDER: ArchitectPersona[] = [
  {
    id: "methodical_aegis",
    title: "Methodical Aegis",
    flavor: "Hohe Shield-Effizienz, kontrolliertes Tempo",
  },
  {
    id: "relentless_synchronizer",
    title: "Relentless Synchronizer",
    flavor: "Synaptic Flow und Ketten dominieren das Raster",
  },
  {
    id: "precision_architect",
    title: "Precision Architect",
    flavor: "Präzision und Rang als primäre Konstanten",
  },
  {
    id: "velocity_ghost",
    title: "Velocity Ghost",
    flavor: "Kurze Einsatzzeit bei tragfähiger Trefferquote",
  },
  {
    id: "adaptive_construct",
    title: "Adaptive Construct",
    flavor: "Ausgewogenes Profil ohne klare Dominante",
  },
];

/**
 * Gewichtete Auswahl — deterministisch über Score, kein Zufall
 */
export function computeArchitectPersona(input: ArchitectPersonaInput): ArchitectPersona {
  const acc = Math.max(0, Math.min(1, input.accuracyRate));
  const eff = Math.max(0, Math.min(1, input.shieldMitigationEfficiencyPct / 100));
  const flowN = Math.max(0, Math.min(1, input.synapticFlow / 100));
  const comboN = Math.min(1, input.combatComboCount / 22);
  const rankBoost =
    input.combatRank === "S" ? 0.22 : input.combatRank === "A" ? 0.12 : input.combatRank === "B" ? 0.05 : 0;
  const tempoN = input.elapsedSec > 0 && input.elapsedSec < 95 ? 1 : input.elapsedSec < 150 ? 0.55 : 0.2;
  const missPenalty = Math.min(1, input.missedSkills / 14);

  const scores: Record<string, number> = {
    methodical_aegis: eff * 1.35 + (1 - comboN) * 0.25 + (eff > 0.38 ? 0.12 : 0),
    relentless_synchronizer: flowN * 1.05 + comboN * 0.95 + (input.missedSkills <= 2 ? 0.18 : 0) - missPenalty * 0.35,
    precision_architect: acc * 1.25 + rankBoost + (acc >= 0.82 ? 0.15 : 0),
    velocity_ghost: tempoN * 0.9 + acc * 0.55 + (input.elapsedSec < 75 && acc > 0.55 ? 0.2 : 0),
    adaptive_construct: 0.35,
  };

  let bestId = "adaptive_construct";
  let best = scores.adaptive_construct ?? 0;
  for (const id of [
    "methodical_aegis",
    "relentless_synchronizer",
    "precision_architect",
    "velocity_ghost",
  ] as const) {
    const s = scores[id] ?? 0;
    if (s > best + 0.02) {
      best = s;
      bestId = id;
    }
  }

  const found = PERSONA_ORDER.find((p) => p.id === bestId);
  return found ?? PERSONA_ORDER[PERSONA_ORDER.length - 1]!;
}
