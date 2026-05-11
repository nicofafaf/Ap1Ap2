export type NexusPresetId = "CINEMATIC" | "COMPETITIVE" | "STREAMER";
export type ParticleDensity = "LOW" | "MEDIUM" | "HIGH";
export type CombatRank = "S" | "A" | "B" | "C";

export interface NexusPreset {
  id: NexusPresetId;
  vignette: number;
  chromatic: number;
  slowMo: number;
  particleDensity: ParticleDensity;
  description: string;
}

export const nexusPresets: Record<NexusPresetId, NexusPreset> = {
  CINEMATIC: {
    id: "CINEMATIC",
    vignette: 0.8,
    chromatic: 1.2,
    slowMo: 0.3,
    particleDensity: "HIGH",
    description: "Maximaler Fokus auf Atmosphäre und Gänsehaut",
  },
  COMPETITIVE: {
    id: "COMPETITIVE",
    vignette: 0.2,
    chromatic: 0.1,
    slowMo: 0.8,
    particleDensity: "LOW",
    description: "Minimale Ablenkung für volle Konzentration auf den Kampf",
  },
  STREAMER: {
    id: "STREAMER",
    vignette: 0.4,
    chromatic: 0.6,
    slowMo: 0.5,
    particleDensity: "MEDIUM",
    description: "Optimiert für Video-Encoding und visuelle Klarheit",
  },
};

export const RANK_COLORS: Record<
  CombatRank,
  {
    textColor: string;
    textShadow: string;
    gradient?: string;
  }
> = {
  S: {
    textColor: "#FFD700",
    textShadow: "0 0 15px rgba(255, 215, 0, 0.6)",
    gradient:
      "linear-gradient(to bottom, #FFD700 0%, #E9C14A 38%, #00FFFF 100%)",
  },
  A: {
    textColor: "#00FFFF",
    textShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
  },
  B: {
    textColor: "#BD00FF",
    textShadow: "0 0 10px rgba(189, 0, 255, 0.4)",
  },
  C: {
    textColor: "#FF4B4B",
    textShadow: "0 0 10px rgba(255, 75, 75, 0.4)",
  },
};
