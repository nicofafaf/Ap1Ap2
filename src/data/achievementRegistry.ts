export type AchievementType =
  | "PERFECT_SYNC"
  | "IMMORTAL"
  | "FAST_TRACK"
  | "OVERKILL"
  | "ARCHITECT_BADGE";

export type AchievementRarity = "LEGENDARY" | "GODLIKE" | "ELITE" | "RARE";

export type AchievementDefinition = {
  title: string;
  subtitle: string;
  icon: "ShieldCheck" | "Zap" | "Timer" | "Target" | "Landmark";
  color: string;
  rarity: AchievementRarity;
  priority: number;
  boost?: string;
  passive?: boolean;
};

export const achievementRegistry: Record<AchievementType, AchievementDefinition> = {
  PERFECT_SYNC: {
    title: "PERFECT SYNC",
    subtitle: "No data-corruption detected",
    icon: "ShieldCheck",
    color: "var(--cyan, #22d3ee)",
    rarity: "LEGENDARY",
    priority: 90,
    boost: "5% Critical Damage",
    passive: true,
  },
  IMMORTAL: {
    title: "IMMORTAL ARCHITECT",
    subtitle: "Zero HP loss during combat",
    icon: "Zap",
    color: "var(--gold, #facc15)",
    rarity: "GODLIKE",
    priority: 100,
    boost: "10% Shield Strength",
    passive: true,
  },
  FAST_TRACK: {
    title: "LIGHTNING CODE",
    subtitle: "Victory in under 45 seconds",
    icon: "Timer",
    color: "var(--violet, #a78bfa)",
    rarity: "ELITE",
    priority: 50,
    boost: "15% Faster Card Draw",
    passive: true,
  },
  OVERKILL: {
    title: "BRUTE FORCE",
    subtitle: "Final blow exceeded 100% overkill",
    icon: "Target",
    color: "var(--red, #ef4444)",
    rarity: "RARE",
    priority: 40,
  },
  ARCHITECT_BADGE: {
    title: "ARCHITEKT-ABZEICHEN",
    subtitle: "Ein Lernfeld vollständig im Curriculum gemeistert",
    icon: "Landmark",
    color: "var(--gold, #facc15)",
    rarity: "LEGENDARY",
    priority: 88,
    boost: "Meisterleuchten auf der Sektor-Karte",
    passive: true,
  },
};

export const achievementOrder: AchievementType[] = [
  "PERFECT_SYNC",
  "IMMORTAL",
  "ARCHITECT_BADGE",
  "FAST_TRACK",
  "OVERKILL",
];
