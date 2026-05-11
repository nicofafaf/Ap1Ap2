import { createSeededRandom, type NexusAnomalyType } from "./combat/anomalyProcessor";

/** Alle Standard-Sektoren 1…12 müssen Stabilität **strikt über** diesem Wert haben (Final Exam) */
export const SECTOR_ZERO_STABILITY_THRESHOLD = 0.8;

export function isSectorZeroUnlocked(stabilities: Record<number, number>): boolean {
  for (let lf = 1; lf <= 12; lf += 1) {
    if ((stabilities[lf] ?? 0) <= SECTOR_ZERO_STABILITY_THRESHOLD) return false;
  }
  return true;
}

export type SectorZeroMorphRoll = {
  morphLf: number;
  phase: 1 | 2;
  anomaly: NexusAnomalyType | null;
  /** Kurzer Phasen-Übergangs-VFX zwischen Morphs */
  phaseSwap: boolean;
};

/** Shape-Shifter: zufällige Boss-Hülle, Phase, Anomalie */
export function rollSectorZeroMorph(seed: number): SectorZeroMorphRoll {
  const rng = createSeededRandom(seed >>> 0);
  const morphLf = 1 + Math.floor(rng() * 12);
  const phase: 1 | 2 = rng() < 0.5 ? 1 : 2;
  const anomalies: NexusAnomalyType[] = ["GLITCH_STORM", "VOID_RESONANCE", "DATA_TURBULENCE"];
  const anomaly: NexusAnomalyType | null =
    rng() < 0.72 ? anomalies[Math.floor(rng() * 3)]! : null;
  const phaseSwap = rng() < 0.42;
  return { morphLf, phase, anomaly, phaseSwap };
}

export const SECTOR_ZERO_ORIGIN_LORE =
  "Sektor Null — Der Gestaltwandler Er synthetisiert alle Titanen-Phasen in einem endlosen Wandel Kein Muster bleibt lange bestehen";

/** Neon-Purpur für Daily-Incursion UI (abgesetzt vom Standard-Cyan) */
export const DAILY_PURPLE_NEON = "#c084fc";
export const DAILY_PURPLE_GLOW = "rgba(192, 132, 252, 0.95)";
export const DAILY_PURPLE_MUTED = "rgba(167, 139, 250, 0.82)";
export const DAILY_PURPLE_BORDER = "rgba(192, 132, 252, 0.55)";

/** UTC-Kalendertag (YYYY-MM-DD) — Streak & Daily-Reset nur hier, unabhängig von lokaler DST */
export function getUtcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function addUtcCalendarDays(yyyyMmDd: string, deltaDays: number): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, (d ?? 1) + deltaDays));
  return dt.toISOString().slice(0, 10);
}

export function secondsUntilNextUtcMidnight(now = Date.now()): number {
  const d = new Date(now);
  const next = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.max(0, Math.ceil((next - now) / 1000));
}

export function formatCountdownHMS(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function fnv1a32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const ORDER_BASE: NexusAnomalyType[] = [
  "GLITCH_STORM",
  "VOID_RESONANCE",
  "DATA_TURBULENCE",
];

export type InitiateCombatOptions = {
  /** Daily-Sektor: globale Anomalie-Verteilung + feste Startphase */
  applyDailyRules?: boolean;
  /** Nur erster Run pro UTC-Tag zählt fürs Leaderboard & Bonus */
  dailyRanked?: boolean;
  /** Endless Deep Dive: nach Loot folgt nächster Boss mit skalierten Werten */
  endlessDeepDive?: boolean;
};

export type DailyIncursionDefinition = {
  dateKey: string;
  seed: number;
  /** Primär-Ziel für Ranked-Run & Boss-Modifikatoren */
  targetLf: number;
  /** Feste Start-Phase (1 oder 2) */
  startCombatPhase: 1 | 2;
  /** Bis zu drei Sektoren mit extremer Anomalien-Kombination (global identisch pro Tag) */
  anomalies: Partial<Record<number, NexusAnomalyType>>;
};

/**
 * Täglicher Seed: alle Nutzer sharen YYYY-MM-DD (UTC) → identische Incursion.
 */
export function getDailyIncursionDefinition(dateKey = getUtcDateKey()): DailyIncursionDefinition {
  const seed = fnv1a32(`NEXUS-GLOBAL-DAILY-v1|${dateKey}`);
  const rng = createSeededRandom(seed);
  const targetLf = 1 + Math.floor(rng() * 12);
  const startCombatPhase: 1 | 2 = rng() < 0.38 ? 2 : 1;

  const order = [...ORDER_BASE];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = order[i]!;
    order[i] = order[j]!;
    order[j] = a;
  }

  const anomalies: Partial<Record<number, NexusAnomalyType>> = {};
  anomalies[targetLf] = order[0]!;

  const neigh: number[] = [];
  if (targetLf > 1) neigh.push(targetLf - 1);
  if (targetLf < 12) neigh.push(targetLf + 1);
  if (neigh.length < 2) {
    if (targetLf > 2) neigh.push(targetLf - 2);
    if (targetLf < 11 && neigh.length < 2) neigh.push(targetLf + 2);
  }
  let oi = 1;
  for (const lf of neigh) {
    if (oi >= order.length) break;
    if (anomalies[lf] == null) {
      anomalies[lf] = order[oi]!;
      oi += 1;
    }
  }
  while (oi < order.length) {
    for (let lf = 1; lf <= 12; lf += 1) {
      if (anomalies[lf] == null) {
        anomalies[lf] = order[oi]!;
        oi += 1;
        break;
      }
    }
  }

  return { dateKey, seed, targetLf, startCombatPhase, anomalies };
}

/** Gitter-Nachbarn LF1…LF12 im 4×3-Sektor-Raster (wie SectorMap) */
export function getSectorGridNeighbors(lf: number): number[] {
  const i = Math.max(0, Math.min(11, lf - 1));
  const col = i % 4;
  const row = Math.floor(i / 4);
  const out: number[] = [];
  if (col > 0) out.push(lf - 1);
  if (col < 3) out.push(lf + 1);
  if (row > 0) out.push(lf - 4);
  if (row < 2) out.push(lf + 4);
  return out;
}

export type ArchitectEchoPath = {
  id: string;
  /** LF-Kette entlang Raster-Kanten */
  chain: number[];
  durationSec: number;
  /** Start-Phasenversatz für de-phasierte Bewegung */
  phase: number;
  strokeOpacity: number;
  /** Echte Sieg-Routen (letzte Runs) — nur Desktop-Ghost-Sync */
  isGhostUpload?: boolean;
};

/** Kürzester Raster-Pfad zwischen zwei Sektoren (BFS) */
export function gridShortestPath(fromLf: number, toLf: number): number[] {
  const from = Math.max(1, Math.min(12, fromLf));
  const to = Math.max(1, Math.min(12, toLf));
  if (from === to) return [from];
  const q: number[] = [from];
  const prev = new Map<number, number | null>();
  prev.set(from, null);
  while (q.length > 0) {
    const u = q.shift()!;
    if (u === to) break;
    for (const v of getSectorGridNeighbors(u)) {
      if (!prev.has(v)) {
        prev.set(v, u);
        q.push(v);
      }
    }
  }
  if (!prev.has(to)) return [from, to];
  const chain: number[] = [];
  let cur: number | null = to;
  while (cur != null) {
    chain.push(cur);
    cur = prev.get(cur) ?? null;
  }
  chain.reverse();
  return chain;
}

export type GhostHistoryEntry = {
  activeLF: number;
  recordedAt: string;
};

/**
 * „Ghost-Upload“: bis zu fünf letzte Siege als Raster-Pfade (anonymisiert nur LF + Reihenfolge)
 */
export function buildGhostUploadEchoPaths(
  history: GhostHistoryEntry[],
  maxRuns = 5
): ArchitectEchoPath[] {
  if (history.length === 0) return [];
  const sorted = [...history].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
  const last = sorted.slice(-maxRuns);
  const out: ArchitectEchoPath[] = [];
  const firstLf = last[0]!.activeLF;
  let ingress = firstLf === 1 ? 2 : firstLf - 1;
  if (ingress === firstLf) ingress = firstLf < 12 ? firstLf + 1 : firstLf - 1;
  let chain0 = gridShortestPath(ingress, firstLf);
  if (chain0.length < 2) chain0 = [ingress, firstLf];
  out.push({
    id: "ghost-upload-0",
    chain: chain0,
    durationSec: 17,
    phase: 0.08,
    strokeOpacity: 0.24,
    isGhostUpload: true,
  });
  for (let i = 1; i < last.length; i += 1) {
    const a = last[i - 1]!.activeLF;
    const b = last[i]!.activeLF;
    const c = gridShortestPath(a, b);
    if (c.length >= 2) {
      out.push({
        id: `ghost-upload-${i}`,
        chain: c,
        durationSec: 13 + i * 1.8,
        phase: 0.11 * i,
        strokeOpacity: 0.21,
        isGhostUpload: true,
      });
    }
  }
  return out;
}

type Pt = { x: number; y: number };

function segIntersection(p1: Pt, p2: Pt, p3: Pt, p4: Pt): Pt | null {
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;
  const x3 = p3.x;
  const y3 = p3.y;
  const x4 = p4.x;
  const y4 = p4.y;
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(den) < 1e-6) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  }
  return null;
}

function dedupeCrossings(points: Pt[], eps = 16): Pt[] {
  const out: Pt[] = [];
  for (const p of points) {
    if (!out.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < eps)) out.push(p);
  }
  return out;
}

/** Schnittpunkte von Echo-Pfaden (für Sync-Animation auf der Map) */
export function findEchoPathCrossings(
  paths: ArchitectEchoPath[],
  lfToPixel: (lf: number) => Pt
): Pt[] {
  const polylines = paths.map((p) => p.chain.map(lfToPixel));
  const hits: Pt[] = [];
  for (let i = 0; i < polylines.length; i += 1) {
    for (let j = i + 1; j < polylines.length; j += 1) {
      const A = polylines[i]!;
      const B = polylines[j]!;
      for (let ia = 0; ia < A.length - 1; ia += 1) {
        for (let ib = 0; ib < B.length - 1; ib += 1) {
          const hit = segIntersection(A[ia]!, A[ia + 1]!, B[ib]!, B[ib + 1]!);
          if (hit) hits.push(hit);
        }
      }
    }
  }
  return dedupeCrossings(hits);
}

/**
 * Deterministische „Architekten-Echos“ für die Weltkarte (Daily-Seed)
 */
export function generateArchitectEchoPaths(seed: number, count = 8): ArchitectEchoPath[] {
  const rng = createSeededRandom(seed ^ 0xe2983c71);
  const out: ArchitectEchoPath[] = [];
  for (let i = 0; i < count; i += 1) {
    const steps = 4 + Math.floor(rng() * 5);
    const chain: number[] = [];
    let cur = 1 + Math.floor(rng() * 12);
    for (let s = 0; s < steps; s += 1) {
      chain.push(cur);
      const nbrs = getSectorGridNeighbors(cur);
      if (nbrs.length === 0) break;
      cur = nbrs[Math.floor(rng() * nbrs.length)]!;
    }
    if (chain.length >= 2) {
      out.push({
        id: `echo-${seed}-${i}`,
        chain,
        durationSec: 12 + rng() * 20,
        phase: rng(),
        strokeOpacity: 0.1 + rng() * 0.16,
      });
    }
  }
  return out;
}

/** Fragment-Multiplikator für ersten erfolgreichen Daily-Ranked-Clear (Streak skaliert) */
export function computeDailyRewardMultiplier(streakDays: number): number {
  const s = Math.max(0, Math.floor(streakDays));
  return Math.min(4.2, 1.72 + s * 0.22);
}

export type CombatRankLetter = "S" | "A" | "B" | "C";

export type DailyLeaderboardRow = {
  id: string;
  displayName: string;
  score: number;
  elapsedSec: number;
  accuracy: number;
  combatRank: CombatRankLetter;
  isLocalPlayer?: boolean;
};

const RANK_SCORE: Record<CombatRankLetter, number> = {
  S: 4000,
  A: 2500,
  B: 1200,
  C: 400,
};

export function computeDailyRunScore(
  elapsedSec: number,
  accuracy01: number,
  rank: CombatRankLetter
): number {
  const t = Math.max(8, elapsedSec);
  const timePart = 420_000 / t;
  const accPart = Math.max(0, Math.min(1, accuracy01)) * 9000;
  return Math.round(timePart + accPart + RANK_SCORE[rank]);
}

/** Simulierte globale Konkurrenz — deterministisch aus Daily-Seed */
export function simulateGlobalDailyLeaderboard(
  dateKey: string,
  seed: number,
  playerRow: DailyLeaderboardRow | null,
  limit = 50
): DailyLeaderboardRow[] {
  const rng = createSeededRandom(seed ^ 0xface1234);
  const bots: DailyLeaderboardRow[] = [];
  const nBots = playerRow ? limit - 1 : limit;
  for (let i = 0; i < nBots; i += 1) {
    const id = `sim-${dateKey}-${i}`;
    const hex = ((rng() * 0xffffff) | 0).toString(16).padStart(6, "0").toUpperCase();
    const elapsedSec = 38 + rng() * 340;
    const accuracy = 0.42 + rng() * 0.57;
    const rkRoll = rng();
    const combatRank: CombatRankLetter =
      rkRoll > 0.92 ? "S" : rkRoll > 0.72 ? "A" : rkRoll > 0.35 ? "B" : "C";
    const score = computeDailyRunScore(elapsedSec, accuracy, combatRank);
    bots.push({
      id,
      displayName: `ARCH-${hex}`,
      score,
      elapsedSec,
      accuracy,
      combatRank,
    });
  }
  const merged = playerRow ? [...bots, { ...playerRow, isLocalPlayer: true }] : bots;
  merged.sort((a, b) => b.score - a.score);
  return merged.slice(0, limit);
}
