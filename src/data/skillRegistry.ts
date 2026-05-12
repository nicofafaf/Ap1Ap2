export type SkillType = "ATTACK" | "DEFENSE" | "SPECIAL";
export type SkillVfx = "CYAN_LIGHTNING" | "HEX_SHIELD" | "FRACTAL_GLITCH";
export type SkillEffect = "NONE" | "DOUBLE_NEXT_HIT";

export interface SkillDefinition {
  id: SkillId;
  name: string;
  type: SkillType;
  damage?: number;
  shield?: number;
  effect?: SkillEffect;
  vfx: SkillVfx;
  lore: string;
  /** Kurzer Nexus-Ursprung für das Loot-Detail-Panel */
  discoveryLore: string;
  iconPrompt: string;
}

export type SkillId =
  | "SKILL_01_OVERCLOCK"
  | "SKILL_02_ENCRYPT"
  | "SKILL_03_RECURSION";

export const skillRegistry: Record<SkillId, SkillDefinition> = {
  SKILL_01_OVERCLOCK: {
    id: "SKILL_01_OVERCLOCK",
    name: "Lösung anwenden",
    type: "ATTACK",
    damage: 25,
    vfx: "CYAN_LIGHTNING",
    lore: "Wendet deine richtige Antwort direkt auf die Aufgabe an",
    discoveryLore:
      "Diese Karte steht für einen klaren Arbeitsschritt Erst verstehen, dann anwenden",
    iconPrompt:
      "Premium calm learning card icon, warm paper surface, brass check mark, soft studio light, isolated on deep green background",
  },
  SKILL_02_ENCRYPT: {
    id: "SKILL_02_ENCRYPT",
    name: "Kurz sichern",
    type: "DEFENSE",
    shield: 40,
    vfx: "HEX_SHIELD",
    lore: "Gibt dir Raum zum Nachdenken, wenn es zu viel wird",
    discoveryLore:
      "Eine ruhige Schutzkarte für Tempo rausnehmen, Überblick gewinnen und weiterlernen",
    iconPrompt:
      "Premium calm learning card icon, soft shield shape, warm ivory and brass, quiet green background, elegant minimal style",
  },
  SKILL_03_RECURSION: {
    id: "SKILL_03_RECURSION",
    name: "Verstärken",
    type: "SPECIAL",
    effect: "DOUBLE_NEXT_HIT",
    vfx: "FRACTAL_GLITCH",
    lore: "Verstärkt den nächsten richtigen Schritt",
    discoveryLore:
      "Diese Karte erinnert daran, dass ein guter Lösungsweg beim Wiederholen stärker wird",
    iconPrompt:
      "Premium calm learning card icon, layered brass circles, soft ivory glow, deep botanical green, elegant minimal style",
  },
};

export const allSkills: SkillDefinition[] = Object.values(skillRegistry);
