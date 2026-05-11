/**
 * Leitner + Ebbinghaus: Gewichtung für die nächste Frage und Intervalle nach SM-2-ähnlicher easeFactor-Logik.
 * Vergessenskurve R(t) ≈ exp(-t/S): niedrige Retention → höhere Auswahlwahrscheinlichkeit.
 */

export type LeitnerCardState = {
  /** Leitner-Fach 1 (schwach) … 5 (stark) */
  box: number;
  /** SM-2-ähnlicher Erinnerungsfaktor, typ. 1,3…2,5 */
  easeFactor: number;
  /** Aktuelles Übertragungsintervall in Tagen (nach letzter korrekter Antwort) */
  intervalDays: number;
  /** Aufeinanderfolgende korrekte Reviews (für Intervallstaffel) */
  repetitions: number;
  lastReviewedAt: number;
  /** Zeitpunkt, ab dem die Karte „fällig“ ist (Ebbinghaus-Review) */
  nextDueAt: number;
};

const MS_PER_DAY = 86400000;

/** Staffel-Tage pro Fach (Basis), wird mit easeFactor skaliert */
const BOX_BASE_DAYS: Record<number, number> = {
  1: 0,
  2: 1,
  3: 3,
  4: 7,
  5: 14,
};

export function defaultLeitnerState(): LeitnerCardState {
  const now = Date.now();
  return {
    box: 1,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lastReviewedAt: now,
    nextDueAt: 0,
  };
}

/** Retentionsschätzung aus vergangener Zeit seit letztem Review (Ebbinghaus exponential decay) */
export function estimatedRetention(elapsedDays: number, intervalDays: number, easeFactor: number): number {
  const strength = Math.max(0.35, (intervalDays || 0.5) * (easeFactor / 2.2));
  return Math.exp(-elapsedDays / strength);
}

/** Gewicht für Auswahl: schwache/unfällige Karten häufiger */
export function leitnerPickWeight(
  exerciseId: string,
  leitner: Readonly<Record<string, LeitnerCardState>>,
  now: number
): number {
  const s = leitner[exerciseId] ?? defaultLeitnerState();
  const elapsedMs = now - s.lastReviewedAt;
  const elapsedDays = elapsedMs / MS_PER_DAY;
  const retention = estimatedRetention(elapsedDays, s.intervalDays, s.easeFactor);
  let w = 0.85 + (1 - retention) * 4.5;
  w += (6 - Math.min(5, Math.max(1, s.box))) * 0.55;
  const overdueDays = Math.max(0, (now - s.nextDueAt) / MS_PER_DAY);
  if (overdueDays > 0) {
    w *= 1 + Math.min(8, overdueDays) * 0.35;
  }
  if (s.box >= 5 && overdueDays <= 0 && s.nextDueAt > now) {
    w *= 0.18;
  }
  return Math.max(0.08, w);
}

export function pickWeightedExercise<T extends { id: string }>(
  bag: T[],
  rng: () => number,
  weightFor: (id: string) => number
): T | null {
  if (!bag.length) return null;
  const weights = bag.map((e) => weightFor(e.id));
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = rng() * sum;
  for (let i = 0; i < bag.length; i += 1) {
    r -= weights[i]!;
    if (r <= 0) return bag[i]!;
  }
  return bag[bag.length - 1]!;
}

/** Nach einem Review: falsch → Fach 1; richtig → Fach +1, Intervall wächst mit easeFactor */
export function applyLeitnerReview(
  prev: LeitnerCardState | undefined,
  correct: boolean,
  now: number
): LeitnerCardState {
  const p = prev ?? defaultLeitnerState();
  if (!correct) {
    return {
      box: 1,
      easeFactor: Math.max(1.3, p.easeFactor - 0.2),
      intervalDays: 0,
      repetitions: 0,
      lastReviewedAt: now,
      nextDueAt: now,
    };
  }
  const q = 5;
  let ease = p.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ease = Math.max(1.3, Math.min(2.6, ease));
  const reps = p.repetitions + 1;
  let interval: number;
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = 6;
  else interval = Math.max(1, Math.round(p.intervalDays * ease));
  const base = BOX_BASE_DAYS[Math.min(5, Math.max(1, p.box + 1))] ?? interval;
  interval = Math.max(interval, Math.round(base * (ease / 2.5)));
  const nextBox = Math.min(5, p.box + 1);
  const nextDue = now + interval * MS_PER_DAY;
  return {
    box: nextBox,
    easeFactor: ease,
    intervalDays: interval,
    repetitions: reps,
    lastReviewedAt: now,
    nextDueAt: nextDue,
  };
}
