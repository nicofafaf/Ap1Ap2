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
    name: "System Overclock",
    type: "ATTACK",
    damage: 25,
    vfx: "CYAN_LIGHTNING",
    lore: "Zwingt die CPU in den roten Bereich für einen massiven Entladungs-Stoß",
    discoveryLore:
      "Im Nexus-Schrottplatz der Rechenkerne wurde diese Karte aus gebrochenen Taktzyklen rekonstruiert Sie trägt den Stempel der ersten Ebene wo Hardware noch physisch schmerzt",
    iconPrompt:
      "AAA high-tech game icon for 'System Overclock', a glowing cyan lightning bolt integrated into a dark titanium CPU core, frosted glass textures, electrical arcs, 8k, isolated on black.",
  },
  SKILL_02_ENCRYPT: {
    id: "SKILL_02_ENCRYPT",
    name: "Cipher Shield",
    type: "DEFENSE",
    shield: 40,
    vfx: "HEX_SHIELD",
    lore: "Erzeugt eine undurchdringliche Barriere aus rotierenden Primzahlen",
    discoveryLore:
      "Aus dem Verschlüsselungsgitter des Nexus gezogen wo Licht zu Matrize wird Diese Karte wurde in der Sicherheits-Schicht ausgesät und wartet auf einen würdigen Operator",
    iconPrompt:
      "AAA high-tech game icon for 'Cipher Shield', a complex hexagonal shield projection made of cyan laser-lines, dark metallic center, futuristic encryption runes, 8k, isolated on black.",
  },
  SKILL_03_RECURSION: {
    id: "SKILL_03_RECURSION",
    name: "Infinite Recursion",
    type: "SPECIAL",
    effect: "DOUBLE_NEXT_HIT",
    vfx: "FRACTAL_GLITCH",
    lore: "Spiegelt die Realität des Codes um die Schadenswirkung zu potenzieren",
    discoveryLore:
      "Ein Echo aus der rekursiven Tiefe des Nexus Jede Schleife hier hat ein Gesicht und diese Karte ist der Bruchpunkt zwischen Simulation und Wirkung",
    iconPrompt:
      "AAA high-tech game icon for 'Infinite Recursion', a digital fractal mirror effect, multiple glowing cyan glass squares collapsing into each other, glitch-art aesthetic, 8k, isolated on black.",
  },
};

export const allSkills: SkillDefinition[] = Object.values(skillRegistry);
