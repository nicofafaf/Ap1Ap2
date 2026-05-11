import type { CombatArchitectReportEntry } from "../../store/useGameStore";
import type { CombatRank } from "../../data/rankSoundConfig";

/** Gewichtung der Zeitnote / des Rangs für die Stabilitätsformel */
export const GRADE_WEIGHT: Record<CombatRank, number> = {
  S: 4,
  A: 3,
  B: 2,
  C: 1,
};

/** Mindest-Stabilität auf Sektor k, um Sektor k+1 zu öffnen */
export const STABILITY_PATH_THRESHOLD = 0.32;

export type StabilityTier = "critical" | "unstable" | "stable";

export function stabilityTier(stability: number): StabilityTier {
  if (stability >= 0.62) return "stable";
  if (stability >= 0.32) return "unstable";
  return "critical";
}

/**
 * Sektor-Stabilität S = Σ(Accuracy · GradeWeight) / Runs für diesen Sektor
 * (Accuracy ∈ [0,1], GradeWeight ∈ {1..4})
 */
export function sectorStabilityForLf(
  history: CombatArchitectReportEntry[],
  lf: number
): number {
  const runs = history.filter((r) => r.activeLF === lf);
  if (runs.length === 0) return 0;
  const sum = runs.reduce(
    (acc, r) => acc + r.accuracyRate * GRADE_WEIGHT[r.combatRank],
    0
  );
  return sum / runs.length;
}

/** Stabilität je Sektor 1…12 */
export function computeAllSectorStabilities(
  history: CombatArchitectReportEntry[]
): Record<number, number> {
  const out: Record<number, number> = {};
  for (let lf = 1; lf <= 12; lf += 1) {
    out[lf] = sectorStabilityForLf(history, lf);
  }
  return out;
}

/** Letzter Archiv-Eintrag pro Sektor (für Rang / UI) */
export function lastReportForLf(
  history: CombatArchitectReportEntry[],
  lf: number
): CombatArchitectReportEntry | null {
  const runs = history.filter((r) => r.activeLF === lf);
  if (runs.length === 0) return null;
  return [...runs].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  )[0]!;
}

/**
 * Linearer Pfad: Sektor n ist betretbar, wenn n===1 oder Stabilität auf n-1 ≥ Schwelle
 * (und n-1 mindestens einen Lauf hat)
 */
export function isSectorReachable(
  lf: number,
  history: CombatArchitectReportEntry[],
  stabilities: Record<number, number>,
  masteryChecks?: Partial<Record<`LF${number}`, boolean>>
): boolean {
  if (lf <= 1) return true;
  const prev = lf - 1;
  const prevRuns = history.filter((r) => r.activeLF === prev).length;
  if (prevRuns === 0) return false;
  const prevLf = `LF${prev}` as const;
  const masteryGate = masteryChecks ? Boolean(masteryChecks[prevLf]) : true;
  return masteryGate && (stabilities[prev] ?? 0) >= STABILITY_PATH_THRESHOLD;
}

/** „Corruption-Rate“ als kombinierter Schwierigkeits- / Stress-Indikator 0…1 */
export function sectorCorruptionRate(lf: number, stability: number): number {
  const tierBias = (lf - 1) * 0.048;
  const instability = Math.max(0, 0.5 - stability) * 0.52;
  return Math.min(0.98, 0.14 + tierBias + instability);
}
