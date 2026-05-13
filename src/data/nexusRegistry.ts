export {
  RARITY_LEVELS,
  rollLootRarity,
  type LootRarity,
} from "../lib/combat/lootLogic";

export type LearningField =
  | "LF1"
  | "LF2"
  | "LF3"
  | "LF4"
  | "LF5"
  | "LF6"
  | "LF7"
  | "LF8"
  | "LF9"
  | "LF10"
  | "LF11"
  | "LF12";

export type BossTrackId =
  | "BossThemen"
  | "BossThemen2"
  | "BossThemen3"
  | "BossThemen4"
  | "BossThemen5";

export interface NexusRegistryEntry {
  currentLF: LearningField;
  bossDisplayName: string;
  phase2ThemePath: string;
  phase2TitlePrefix: string;
  phase2StatusLine: string;
  lore: string;
  victoryQuote: string;
  combatPalette: {
    primary: string;
    accent: string;
    semantic:
      | "HardwareNetworking"
      | "SecurityCryptography"
      | "DatabaseLogic";
  };
  bossVisual: {
    primaryPath: string;
    fallbackPaths: string[];
  };
  loot: {
    itemPath: string;
    comingSoonLabel?: string;
  };
  audio: {
    trackId: BossTrackId;
    trackPath: string;
    victoryPath: string;
    lootRevealPath: string;
  };
}

const ABS_ASSETS = "/assets";

/** Vite `base` — GitLab Pages Root bleibt `/`, Unterpfad-Deploys brauchen Präfix */
export function publicAssetUrl(absolutePath: string): string {
  const path = absolutePath.startsWith("/") ? absolutePath : `/${absolutePath}`;
  const base =
    typeof import.meta !== "undefined" && import.meta.env && typeof import.meta.env.BASE_URL === "string"
      ? import.meta.env.BASE_URL
      : "/";
  if (base === "/" || base === "") return path;
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmed}${path}`;
}

/** Dateiname `waifu-{n}.png` unter `public/assets/characters/` */
export function mentorPortraitSlug(id: number): string {
  const n = Math.max(1, Math.min(100, Math.floor(id)));
  return `waifu-${n}`;
}

function mentorPortraitPngUrl(mentorIndex: number): string {
  return publicAssetUrl(`/assets/characters/${mentorPortraitSlug(mentorIndex)}.png`);
}

/**
 * Anfangsauswahl: 128×128 unter `assets/Portraits/25-waifus-128x128/` → nach Build `public/assets/…`
 * Erwartete Dateien: `waifu-{n}.png` oder `.webp` (n = 1…24+)
 */
export function mentorPickPortraitCandidates(id: number): readonly string[] {
  const n = Math.max(1, Math.min(100, Math.floor(id)));
  const base = `/assets/Portraits/25-waifus-128x128/waifu-${n}`;
  return [publicAssetUrl(`${base}.png`), publicAssetUrl(`${base}.webp`), mentorPortraitPngUrl(n)];
}

const WAIFU_IDLE_FOLDER_ENC = encodeURIComponent("100 Waifus - Idle Animation 64x64");

/**
 * Überall sonst: 64×64 Idle unter `assets/Characters/100 Waifus - Idle Animation 64x64/V1.0/`
 * Erwartet u. a.: `waifu-{n}.webp`, `.gif`, `.webm` — danach Legacy-PNG
 */
export function mentorIdleAnimationCandidates(id: number): readonly string[] {
  const n = Math.max(1, Math.min(100, Math.floor(id)));
  const root = `/assets/Characters/${WAIFU_IDLE_FOLDER_ENC}/V1.0`;
  return [
    publicAssetUrl(`${root}/waifu-${n}.webp`),
    publicAssetUrl(`${root}/waifu-${n}.gif`),
    publicAssetUrl(`${root}/waifu-${n}.webm`),
    publicAssetUrl(`${root}/${n}.webp`),
    publicAssetUrl(`${root}/${n}.gif`),
    mentorPortraitPngUrl(n),
  ];
}

const makeBossVisual = (lfNumber: number) => {
  const stem = `LF${lfNumber}GIF`;
  const rel = (ext: string) => publicAssetUrl(`/assets/${stem}${ext}`);
  return {
    primaryPath: rel(".mp4"),
    fallbackPaths: [rel(".gif"), rel(".webp"), rel(".png")],
  };
};

const pickTrackForLF = (lfNumber: number): BossTrackId => {
  if (lfNumber === 12) return "BossThemen5";
  if (lfNumber <= 3) return "BossThemen";
  if (lfNumber <= 6) return "BossThemen2";
  if (lfNumber <= 9) return "BossThemen3";
  return "BossThemen4";
};

const BOSS_TRACK_CYCLE: BossTrackId[] = [
  "BossThemen",
  "BossThemen2",
  "BossThemen3",
  "BossThemen4",
  "BossThemen5",
];

const phase2TrackFromPhase1 = (phase1: BossTrackId): BossTrackId => {
  const i = BOSS_TRACK_CYCLE.indexOf(phase1);
  const idx = i >= 0 ? (i + 2) % BOSS_TRACK_CYCLE.length : 2;
  return BOSS_TRACK_CYCLE[idx];
};

const trackPathById: Record<BossTrackId, string> = {
  BossThemen: publicAssetUrl(`${ABS_ASSETS}/BossThemen.mp3`),
  BossThemen2: publicAssetUrl(`${ABS_ASSETS}/BossThemen2.mp3`),
  BossThemen3: publicAssetUrl(`${ABS_ASSETS}/BossThemen3.mp3`),
  BossThemen4: publicAssetUrl(`${ABS_ASSETS}/BossThemen4.mp3`),
  BossThemen5: publicAssetUrl(`${ABS_ASSETS}/BossThemen5.mp3`),
};

const sharedVictoryPath = publicAssetUrl(`${ABS_ASSETS}/lobbysound_2.mp3`);

const loreByLF: Record<LearningField, string> = {
  LF1: "Der schlafende Wächter der Hardware-Ebene Er prüft ob dein Fundament stark genug ist um die Last der digitalen Welt zu tragen",
  LF2: "Der Kerkermeister der Prozesse Er kontrolliert den Herzschlag des Systems und duldet keine ineffizienten Zyklen",
  LF3: "Ein Architekt aus purem Licht Er webt die Pfade der Logik und bestraft jeden Fehler in deinem Algorithmus",
  LF4: "Eine rohe Masse aus Metall und Zorn Er verkörpert die unbändige Kraft der Komponenten und die Hitze der Prozessoren",
  LF5: "Ein allsehendes Auge das jede deiner Abfragen seziert Verberge deine Daten denn er findet jede Inkonsistenz",
  LF6: "Der Wächter der Portale Er bewacht die Ströme der Informationen und blockiert jeden unbefugten Zugriff",
  LF7: "Ein Titan der die Zeit selbst krümmt Er erzwingt die Einhaltung der Meilensteine mit eiserner Disziplin",
  LF8: "Das Echo des Netzwerks Er transformiert Wünsche in Taten doch sein Preis ist absolute System-Treue",
  LF9: "Eine unbesiegbare Mauer aus Code und Plasma Nichts dringt an ihm vorbei das nicht durch das Feuer der Prüfung ging",
  LF10:
    "Ein Albtraum aus Kabeln und Korruption der alles verschlingt was nicht in seinen Speichern gesichert ist",
  LF11:
    "Der Geist der Verschlüsselung Er verbirgt die Wahrheit hinter unendlichen Schichten aus Glas und Schatten",
  LF12:
    "Die finale Singularität Die Verschmelzung von Mensch und Maschine Warte nicht auf Gnade hier endet dein Code",
};

const victoryQuoteByLF: Record<LearningField, string> = {
  LF1: "Die Hardware gehorcht nun deinem Willen Der Grundstein ist gelegt",
  LF2: "Die Prozesse sind befriedet Das System atmet wieder ruhig",
  LF3: "Die Fäden der Logik sind entwirrt Deine Gedanken sind nun Code",
  LF4: "Sogar Titanen brechen unter dem Druck des Wissens",
  LF5: "Die Wahrheit wurde extrahiert Keine Daten sind mehr vor dir sicher",
  LF6: "Die Tore stehen weit offen Dein Signal ist nun überall",
  LF7: "Die Deadline wurde besiegt Zeit ist nun dein stärkster Verbündeter",
  LF8: "Der Service ist wiederhergestellt Die Anwender verneigen sich",
  LF9: "Die Firewall ist gefallen Die Tiefen des Netzes gehören dir",
  LF10: "Das Monster wurde gebändigt Das Meer der Daten ist nun still",
  LF11:
    "Das Unentschlüsselbare wurde gelesen Das Licht der Erkenntnis vertreibt die Schatten",
  LF12: "Gott ist in der Maschine - und du bist sein Architekt",
};

const paletteByLF: Record<
  LearningField,
  {
    primary: string;
    accent: string;
    semantic: "HardwareNetworking" | "SecurityCryptography" | "DatabaseLogic";
  }
> = {
  LF1: {
    primary: "rgba(34, 211, 238, 0.95)",
    accent: "rgba(59, 130, 246, 0.85)",
    semantic: "HardwareNetworking",
  },
  LF2: {
    primary: "rgba(34, 211, 238, 0.95)",
    accent: "rgba(37, 99, 235, 0.85)",
    semantic: "HardwareNetworking",
  },
  LF3: {
    primary: "rgba(16, 185, 129, 0.95)",
    accent: "rgba(234, 179, 8, 0.88)",
    semantic: "DatabaseLogic",
  },
  LF4: {
    primary: "rgba(6, 182, 212, 0.95)",
    accent: "rgba(37, 99, 235, 0.85)",
    semantic: "HardwareNetworking",
  },
  LF5: {
    primary: "rgba(52, 211, 153, 0.95)",
    accent: "rgba(250, 204, 21, 0.9)",
    semantic: "DatabaseLogic",
  },
  LF6: {
    primary: "rgba(34, 211, 238, 0.95)",
    accent: "rgba(29, 78, 216, 0.88)",
    semantic: "HardwareNetworking",
  },
  LF7: {
    primary: "rgba(124, 58, 237, 0.95)",
    accent: "rgba(239, 68, 68, 0.88)",
    semantic: "SecurityCryptography",
  },
  LF8: {
    primary: "rgba(16, 185, 129, 0.95)",
    accent: "rgba(234, 179, 8, 0.9)",
    semantic: "DatabaseLogic",
  },
  LF9: {
    primary: "rgba(52, 211, 153, 0.95)",
    accent: "rgba(250, 204, 21, 0.9)",
    semantic: "DatabaseLogic",
  },
  LF10: {
    primary: "rgba(109, 40, 217, 0.95)",
    accent: "rgba(239, 68, 68, 0.9)",
    semantic: "SecurityCryptography",
  },
  LF11: {
    primary: "rgba(139, 92, 246, 0.95)",
    accent: "rgba(220, 38, 38, 0.9)",
    semantic: "SecurityCryptography",
  },
  LF12: {
    primary: "rgba(124, 58, 237, 0.98)",
    accent: "rgba(248, 113, 113, 0.95)",
    semantic: "SecurityCryptography",
  },
};

const comingSoonSvgDataUri = encodeURI(
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#081018"/><rect x="24" y="24" width="464" height="464" rx="16" fill="none" stroke="#22d3ee" stroke-width="3"/><text x="50%" y="44%" dominant-baseline="middle" text-anchor="middle" fill="#67e8f9" font-size="30" font-family="monospace">Loot Slot 12</text><text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" fill="#a5f3fc" font-size="24" font-family="monospace">Coming Soon</text></svg>`
);

const bossDisplayNameByLF: Record<LearningField, string> = {
  LF1: "Archivar der Leere",
  LF2: "Glimmer-Schlange",
  LF3: "Käfig-Wächter",
  LF4: "Spiegel-Sylphe",
  LF5: "Schlacken-Hund",
  LF6: "Schatten-Broker",
  LF7: "Lichtfänger-Spinne",
  LF8: "Neon-Requiem",
  LF9: "Uhrwerk-Inquisitor",
  LF10: "Obsidian-Schwarm",
  LF11: "Gravitations-Sirene",
  LF12: "Der Letzte Schlüssel",
};

const phase2TitlePrefixByLF: Record<LearningField, string> = {
  LF1: "CORRUPTED",
  LF2: "UNLEASHED",
  LF3: "VOID-BENT",
  LF4: "OVERCLOCKED",
  LF5: "FRAGMENTED",
  LF6: "BREACHING",
  LF7: "SINGULAR",
  LF8: "FERAL",
  LF9: "BURNING",
  LF10: "ABYSSAL",
  LF11: "ENCRYPTED",
  LF12: "OMEGA",
};

const phase2StatusByLF: Record<LearningField, string> = {
  LF1: "SYSTEM CRITICAL — OVERDRIVE ACTIVE",
  LF2: "THREAD STACK UNSTABLE — PURGE IMMINENT",
  LF3: "CONTAINMENT LOST — EXECUTE HARD RESET",
  LF4: "CLOCK DOMAIN FRACTURED — RUN HOT",
  LF5: "DATA INTEGRITY FAIL — BURN THE CACHE",
  LF6: "BACKCHANNEL OPEN — TRUST NULL",
  LF7: "LATTICE COLLAPSE — WEB TIGHTENS",
  LF8: "SIGNAL BLEED — CHROMATIC OVERLOAD",
  LF9: "CHRONO LOCK BROKEN — NO GRACE WINDOW",
  LF10: "SWARM PROTOCOL — SURFACE TENSION ZERO",
  LF11: "GRAVITY WELL ENGAGED — NO EXIT VECTOR",
  LF12: "FINAL KEY TURNED — REALITY UNHINGED",
};

const learningFields: LearningField[] = [
  "LF1",
  "LF2",
  "LF3",
  "LF4",
  "LF5",
  "LF6",
  "LF7",
  "LF8",
  "LF9",
  "LF10",
  "LF11",
  "LF12",
];

export const nexusRegistry: Record<LearningField, NexusRegistryEntry> =
  learningFields.reduce((acc, currentLF, index) => {
    const lfNumber = index + 1;
    const trackId = pickTrackForLF(lfNumber);
    const phase2TrackId = phase2TrackFromPhase1(trackId);
    const itemPath = lfNumber <= 11 ? mentorPortraitPngUrl(lfNumber) : comingSoonSvgDataUri;

    acc[currentLF] = {
      currentLF,
      bossDisplayName: bossDisplayNameByLF[currentLF],
      phase2ThemePath: trackPathById[phase2TrackId],
      phase2TitlePrefix: phase2TitlePrefixByLF[currentLF],
      phase2StatusLine: phase2StatusByLF[currentLF],
      lore: loreByLF[currentLF],
      victoryQuote: victoryQuoteByLF[currentLF],
      combatPalette: paletteByLF[currentLF],
      bossVisual: makeBossVisual(lfNumber),
      loot: {
        itemPath,
        comingSoonLabel: lfNumber <= 11 ? undefined : "Coming Soon",
      },
      audio: {
        trackId,
        trackPath: trackPathById[trackId],
        victoryPath: sharedVictoryPath,
        lootRevealPath: sharedVictoryPath,
      },
    };
    return acc;
  }, {} as Record<LearningField, NexusRegistryEntry>);

export const getNexusEntryForLF = (currentLF: LearningField): NexusRegistryEntry =>
  nexusRegistry[currentLF];

export const getAllNexusEntries = (): NexusRegistryEntry[] =>
  learningFields.map((lf) => nexusRegistry[lf]);

export const getComingSoonLootPlaceholder = (): string => comingSoonSvgDataUri;

/** Statische Boss-/Loot-Bilder für Karten (keine MP4), Video erst bei Hover */
export function getBossThumbnailCandidates(lf: LearningField): string[] {
  const entry = getNexusEntryForLF(lf);
  const out: string[] = [];
  for (const u of entry.bossVisual.fallbackPaths) {
    if (/\.(mp4|webm|mov)$/i.test(u)) continue;
    if (/\.(webp|png|gif|jpe?g|svg|avif)$/i.test(u)) out.push(u);
  }
  const n = lf.replace("LF", "");
  out.push(publicAssetUrl(`/assets/LF${n}.webp`), publicAssetUrl(`/assets/LF${n}.png`));
  if (entry.loot.itemPath && !/\.(mp4|webm|mov)$/i.test(entry.loot.itemPath)) {
    out.push(entry.loot.itemPath);
  }
  return [...new Set(out)];
}

/** Mentor-IDs 1…24 → Dateien `waifu-1.png` … unter `public/assets/characters/` */
export const MENTOR_WAIFU_IDS = Array.from({ length: 24 }, (_, i) => i + 1) as readonly number[];

/** Legacy-PNG unter `public/assets/characters/` — für einfache `<img src>` ohne Kette */
export function mentorWaifuUrl(id: number): string {
  return mentorPortraitPngUrl(id);
}
