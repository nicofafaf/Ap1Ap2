import { publicAssetUrl } from "./nexusRegistry";

/** Persistierter Lern-Rang (Karriereleiter) — unabhängig vom Kampf-Rang S/A/B/C */
export type LearningRankId =
  | "iron_node"
  | "copper_scripter"
  | "silver_proxy"
  | "gold_kernel"
  | "platinum_root"
  | "diamond_architect"
  | "apex_nexus"
  | "master_override";

export type LearningRankDefinition = {
  id: LearningRankId;
  order: number;
  imageFile: string;
  /** Optional WebP (kleiner); PNG als Fallback */
  imageFileWebp?: string;
  /** Mindest-Lernpunkte (Ranked / Aktivität) */
  minLp: number;
  /** Mindest-Plattform-Fortschritt in Prozent (gelöste Übungen / Gesamt) */
  minMasteryPct: number;
  accent: string;
  glow: string;
};

export const LEARNING_RANKS: readonly LearningRankDefinition[] = [
  {
    id: "iron_node",
    order: 0,
    imageFile: "iron_node.png",
    imageFileWebp: "iron_node.webp",
    minLp: 0,
    minMasteryPct: 0,
    accent: "#94a3b8",
    glow: "rgba(148, 163, 184, 0.45)",
  },
  {
    id: "copper_scripter",
    order: 1,
    imageFile: "copper_scripter.png",
    imageFileWebp: "copper_scripter.webp",
    minLp: 120,
    minMasteryPct: 5,
    accent: "#c2855a",
    glow: "rgba(194, 133, 90, 0.5)",
  },
  {
    id: "silver_proxy",
    order: 2,
    imageFile: "silver_proxy.png",
    imageFileWebp: "silver_proxy.webp",
    minLp: 350,
    minMasteryPct: 12,
    accent: "#cbd5e1",
    glow: "rgba(203, 213, 225, 0.55)",
  },
  {
    id: "gold_kernel",
    order: 3,
    imageFile: "gold_kernel.png",
    imageFileWebp: "gold_kernel.webp",
    minLp: 750,
    minMasteryPct: 22,
    accent: "#facc15",
    glow: "rgba(250, 204, 21, 0.55)",
  },
  {
    id: "platinum_root",
    order: 4,
    imageFile: "platinum_root.png",
    imageFileWebp: "platinum_root.webp",
    minLp: 1400,
    minMasteryPct: 35,
    accent: "#a5f3fc",
    glow: "rgba(165, 243, 252, 0.5)",
  },
  {
    id: "diamond_architect",
    order: 5,
    imageFile: "diamond_architect.png",
    imageFileWebp: "diamond_architect.webp",
    minLp: 2400,
    minMasteryPct: 50,
    accent: "#67e8f9",
    glow: "rgba(103, 232, 249, 0.55)",
  },
  {
    id: "apex_nexus",
    order: 6,
    imageFile: "apex_nexus.png",
    imageFileWebp: "apex_nexus.webp",
    minLp: 3800,
    minMasteryPct: 68,
    accent: "#c4b5fd",
    glow: "rgba(196, 181, 253, 0.55)",
  },
  {
    id: "master_override",
    order: 7,
    imageFile: "master_override.png",
    imageFileWebp: "master_override.webp",
    minLp: 5500,
    minMasteryPct: 82,
    accent: "#fde68a",
    glow: "rgba(253, 230, 138, 0.6)",
  },
] as const;

const RANK_BY_ID = Object.fromEntries(LEARNING_RANKS.map((r) => [r.id, r])) as Record<
  LearningRankId,
  LearningRankDefinition
>;

export function learningRankImageUrl(rankId: LearningRankId, preferWebp = true): string {
  const def = RANK_BY_ID[rankId] ?? RANK_BY_ID.iron_node;
  const file =
    preferWebp && def.imageFileWebp ? def.imageFileWebp : def.imageFile ?? "iron_node.png";
  return publicAssetUrl(`/assets/ranks/${file}`);
}

export function learningRankImageSources(rankId: LearningRankId): {
  webp: string | null;
  png: string;
} {
  const def = RANK_BY_ID[rankId] ?? RANK_BY_ID.iron_node;
  return {
    webp: def.imageFileWebp ? publicAssetUrl(`/assets/ranks/${def.imageFileWebp}`) : null,
    png: publicAssetUrl(`/assets/ranks/${def.imageFile}`),
  };
}

export function getLearningRankDef(rankId: LearningRankId): LearningRankDefinition {
  return RANK_BY_ID[rankId] ?? RANK_BY_ID.iron_node;
}

/** Vier Stufen für Citadel / Onboarding (Untermenge der Leiter) */
export const CITADEL_RANK_IDS: readonly LearningRankId[] = [
  "iron_node",
  "copper_scripter",
  "silver_proxy",
  "gold_kernel",
];
