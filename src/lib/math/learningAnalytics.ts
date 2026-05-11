/**
 * Persistierte Lern-Analytics: Retention-Zeitreihe (Ebbinghaus/Leitner) + LF-Fehler-Heatmap
 */

import type { LearningField } from "../../data/nexusRegistry";
import { CURRICULUM_BY_LF } from "../learning/learningRegistry";
import {
  defaultLeitnerState,
  estimatedRetention,
  type LeitnerCardState,
} from "../learning/leitnerEngine";

const RETENTION_HISTORY_KEY = "nexus.analytics.retentionSeries.v1";
const MAX_POINTS = 120;

export type RetentionHistoryPoint = {
  t: number;
  /** Mittlere geschätzte Retention über alle bekannten Karten (0–1) */
  avgRetention: number;
};

export type LfHeatCell = {
  lf: number;
  /** 0 = ruhig, 1 = hoher Review-Druck / Schwäche */
  strain: number;
};

const MS_PER_DAY = 86400000;

export function loadRetentionSeries(): RetentionHistoryPoint[] {
  try {
    const raw = localStorage.getItem(RETENTION_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RetentionHistoryPoint[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (p) =>
          p &&
          typeof p.t === "number" &&
          typeof p.avgRetention === "number" &&
          p.avgRetention >= 0 &&
          p.avgRetention <= 1
      )
      .slice(-MAX_POINTS);
  } catch {
    return [];
  }
}

function persistSeries(next: RetentionHistoryPoint[]) {
  try {
    localStorage.setItem(
      RETENTION_HISTORY_KEY,
      JSON.stringify(next.slice(-MAX_POINTS))
    );
  } catch {
    // no-op
  }
}

/** Snapshot der durchschnittlichen Retention über alle Leitner-Karten */
export function appendRetentionSnapshot(
  leitner: Readonly<Record<string, LeitnerCardState>>,
  now = Date.now()
) {
  const ids = Object.keys(leitner);
  if (ids.length === 0) return;

  let sum = 0;
  let n = 0;
  for (const id of ids) {
    const card = leitner[id] ?? defaultLeitnerState();
    const elapsedDays = (now - card.lastReviewedAt) / MS_PER_DAY;
    const r = estimatedRetention(elapsedDays, card.intervalDays, card.easeFactor);
    sum += r;
    n += 1;
  }
  const avgRetention = n > 0 ? sum / n : 0.5;

  const prev = loadRetentionSeries();
  const last = prev[prev.length - 1];
  const merged =
    last && Math.abs(last.avgRetention - avgRetention) < 0.004 && now - last.t < 45000
      ? prev
      : [...prev, { t: now, avgRetention }];

  persistSeries(merged);
}

/** Fehler-/Review-Hotspots je LF aus Curriculum + Leitner-Zuständen */
export function computeLfErrorHeatmap(
  leitner: Readonly<Record<string, LeitnerCardState>>,
  now = Date.now()
): LfHeatCell[] {
  const raw: LfHeatCell[] = [];
  for (let lf = 1; lf <= 12; lf += 1) {
    const key = `LF${lf}` as LearningField;
    const curriculum = CURRICULUM_BY_LF[key] ?? [];
    if (curriculum.length === 0) {
      raw.push({ lf, strain: 0.12 });
      continue;
    }
    let sum = 0;
    for (const ex of curriculum) {
      const card = leitner[ex.id] ?? defaultLeitnerState();
      const elapsedDays = (now - card.lastReviewedAt) / MS_PER_DAY;
      const r = estimatedRetention(elapsedDays, card.intervalDays, card.easeFactor);
      const forget = 1 - r;
      const boxPenalty = (6 - Math.min(5, Math.max(1, card.box))) * 0.07;
      sum += forget + boxPenalty;
    }
    const strain = Math.min(1, (sum / curriculum.length) * 0.92);
    raw.push({ lf, strain });
  }
  return raw;
}

export function chartDataFromRetention(series: RetentionHistoryPoint[]) {
  return series.map((p, i) => ({
    i: i + 1,
    label: new Date(p.t).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    }),
    retention: Math.round(p.avgRetention * 1000) / 10,
    t: p.t,
  }));
}

/** „Neural Mentor“: Prognose + Coaching aus Leitner/Ebbinghaus (du-Ansprache) */
export type NeuralMentorFocus = {
  lf: number;
  label: string;
  reason: string;
};

export type NeuralMentorReport = {
  headline: string;
  /** 0–100 geschätzte Prüfungsnähe */
  examReadyScore: number;
  /** Kalenderwochen bis plausibles Prüfungsfenster (Heuristik) */
  estimatedWeeksToPruefung: number;
  focusAreas: NeuralMentorFocus[];
  coaching: string;
  actions: string[];
};

function avgCurriculumRetention(
  leitner: Readonly<Record<string, LeitnerCardState>>,
  now: number
): { avgR: number; totalEx: number } {
  let sum = 0;
  let n = 0;
  for (let lf = 1; lf <= 12; lf += 1) {
    const key = `LF${lf}` as LearningField;
    const curriculum = CURRICULUM_BY_LF[key] ?? [];
    for (const ex of curriculum) {
      n += 1;
      const card = leitner[ex.id];
      const c = card ?? defaultLeitnerState();
      const elapsedDays = (now - c.lastReviewedAt) / MS_PER_DAY;
      const r = estimatedRetention(elapsedDays, c.intervalDays, c.easeFactor);
      sum += r;
    }
  }
  return { avgR: n > 0 ? sum / n : 0.55, totalEx: n };
}

export function buildNeuralMentorReport(
  leitner: Readonly<Record<string, LeitnerCardState>>,
  learningCorrectByLf: Readonly<Partial<Record<LearningField, string[]>>>,
  now = Date.now()
): NeuralMentorReport {
  const heat = computeLfErrorHeatmap(leitner, now);
  const sorted = [...heat].sort((a, b) => b.strain - a.strain);
  const top = sorted.slice(0, 3).filter((c) => c.strain > 0.22);

  const { avgR, totalEx } = avgCurriculumRetention(leitner, now);
  const masteredRatio =
    totalEx > 0
      ? (Object.keys(CURRICULUM_BY_LF) as LearningField[]).reduce((acc, lf) => {
          const bag = CURRICULUM_BY_LF[lf] ?? [];
          const have = new Set(learningCorrectByLf[lf] ?? []);
          const ok = bag.filter((e) => have.has(e.id)).length;
          return acc + ok;
        }, 0) / totalEx
      : 0;

  const examReadyScore = Math.round(
    Math.max(0, Math.min(100, avgR * 62 + masteredRatio * 38))
  );
  const gap = Math.max(0, 0.82 - avgR);
  const estimatedWeeksToPruefung =
    examReadyScore >= 78 ? Math.max(0, Math.round((1 - avgR) * 4)) : Math.ceil(gap / 0.045);

  const focusAreas: NeuralMentorFocus[] = top.map((c) => {
    const lfKey = `LF${c.lf}` as LearningField;
    const weakEx = (CURRICULUM_BY_LF[lfKey] ?? [])
      .map((e) => ({
        id: e.id,
        title: e.title,
        card: leitner[e.id] ?? defaultLeitnerState(),
      }))
      .sort(
        (a, b) =>
          a.card.box - b.card.box ||
          estimatedRetention(
            (now - a.card.lastReviewedAt) / MS_PER_DAY,
            a.card.intervalDays,
            a.card.easeFactor
          ) -
            estimatedRetention(
              (now - b.card.lastReviewedAt) / MS_PER_DAY,
              b.card.intervalDays,
              b.card.easeFactor
            )
      );
    const hint = weakEx[0];
    let reason = `Stabilität sinkt — Fach ${hint?.card.box ?? 1} · Review überfällig`;
    if (c.lf === 5 && weakEx.some((w) => /sql|join/i.test(w.title))) {
      reason = "SQL-Logik braucht Tiefe — JOINs und Aggregates festigen";
    }
    return { lf: c.lf, label: `LF${c.lf}`, reason };
  });

  const actions: string[] = [];
  if (top[0]) {
    actions.push(
      `Heute 15 Minuten nur LF${top[0].lf} — die Kurve dort bremst deine Gesamt-Retention am stärksten`
    );
  }
  if (top.some((t) => t.lf === 5)) {
    actions.push("Fokus auf SQL-Joins verstärken — Stabilität in LF5 wirkt direkt auf die Prüfungssimulation");
  }
  if (avgR < 0.72) {
    actions.push("Kurze tägliche Review-Sessions statt Marathon — Ebbinghaus belohnt Abstände");
  }
  if (masteredRatio < 0.4) {
    actions.push("Mehr Aufgaben mindestens einmal grün spielen — dann springt der Mentor-Score sprunghaft");
  }
  if (actions.length === 0) {
    actions.push("Bleib im Rhythmus — deine Retention ist solide, jetzt Feinschliff und Zeitmanagement");
  }

  const coaching =
    examReadyScore >= 80
      ? `Du stehst kurz vor dem Level, das ich „prüfungsfest“ nenne — dein Gedächtnis hält ${(
          avgR * 100
        ).toFixed(
          0
        )}% der Stofflast aktiv, und das ist IHK-tauglich, wenn du die letzten schwachen LF wie ein Chirurg nachschärfst`
      : `Ich sehe dich auf dem Weg — aktuell trägst du etwa ${(avgR * 100).toFixed(
          0
        )}% der langfristigen Retention mit, und das ist dein echter Vorsprung vor Büffeln ohne System — nimm die nächsten ${estimatedWeeksToPruefung || 1} Wochen ernst, dann wird aus dem Raster echte Prüfungssicherheit`;

  const headline =
    examReadyScore >= 78
      ? "Neural Mentor · Du bist im Zielkorridor"
      : "Neural Mentor · Wir schärfen deine Kurve";

  return {
    headline,
    examReadyScore,
    estimatedWeeksToPruefung,
    focusAreas,
    coaching,
    actions: actions.slice(0, 4),
  };
}
