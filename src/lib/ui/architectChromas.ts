export type ArchitectChromaId = "default" | "deepsea-neon" | "monochrome-glitch";

const ROOT_KEYS = [
  "--cyan",
  "--violet",
  "--gold",
  "--nx-chroma-surface",
  "--nx-chroma-grid",
] as const;

type ChromaSpec = Record<(typeof ROOT_KEYS)[number], string>;

const SPECS: Record<ArchitectChromaId, ChromaSpec> = {
  default: {
    "--cyan": "rgba(34, 211, 238, 0.95)",
    "--violet": "rgba(167, 139, 250, 0.98)",
    "--gold": "rgba(250, 204, 21, 0.98)",
    "--nx-chroma-surface": "#030712",
    "--nx-chroma-grid": "rgba(34, 211, 238, 0.16)",
  },
  "deepsea-neon": {
    "--cyan": "rgba(45, 212, 191, 0.96)",
    "--violet": "rgba(99, 102, 241, 0.95)",
    "--gold": "rgba(56, 189, 248, 0.92)",
    "--nx-chroma-surface": "#020617",
    "--nx-chroma-grid": "rgba(45, 212, 191, 0.14)",
  },
  "monochrome-glitch": {
    "--cyan": "rgba(226, 232, 240, 0.92)",
    "--violet": "rgba(148, 163, 184, 0.88)",
    "--gold": "rgba(74, 222, 128, 0.55)",
    "--nx-chroma-surface": "#0a0a0b",
    "--nx-chroma-grid": "rgba(226, 232, 240, 0.1)",
  },
};

const STORAGE_ACTIVE = "nexus.architectChromaActive.v1";
const STORAGE_UNLOCKS = "nexus.architectChromaUnlocks.v1";

export function applyArchitectChromaToDocument(id: ArchitectChromaId): void {
  if (typeof document === "undefined") return;
  const spec = SPECS[id] ?? SPECS.default;
  const root = document.documentElement;
  for (const k of ROOT_KEYS) {
    root.style.setProperty(k, spec[k]);
  }
}

export function persistArchitectChromaActive(id: ArchitectChromaId): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE, id);
  } catch {
    /* no-op */
  }
}

export function persistArchitectChromaUnlocks(unlocks: Record<ArchitectChromaId, boolean>): void {
  try {
    localStorage.setItem(STORAGE_UNLOCKS, JSON.stringify(unlocks));
  } catch {
    /* no-op */
  }
}

export function loadArchitectChromaActive(): ArchitectChromaId {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE);
    if (raw === "deepsea-neon" || raw === "monochrome-glitch" || raw === "default") return raw;
  } catch {
    /* no-op */
  }
  return "default";
}

export function loadArchitectChromaUnlocks(): Record<ArchitectChromaId, boolean> {
  const base: Record<ArchitectChromaId, boolean> = {
    default: true,
    "deepsea-neon": false,
    "monochrome-glitch": false,
  };
  try {
    const raw = localStorage.getItem(STORAGE_UNLOCKS);
    if (!raw) return base;
    const o = JSON.parse(raw) as Record<string, boolean>;
    if (typeof o["deepsea-neon"] === "boolean") base["deepsea-neon"] = o["deepsea-neon"];
    if (typeof o["monochrome-glitch"] === "boolean")
      base["monochrome-glitch"] = o["monochrome-glitch"];
  } catch {
    /* no-op */
  }
  return base;
}

export function hydrateArchitectChromaFromStorage(): void {
  applyArchitectChromaToDocument(loadArchitectChromaActive());
}

export const ARCHITECT_CHROMA_LABELS: Record<
  ArchitectChromaId,
  { title: string; hint: string }
> = {
  default: { title: "Standard Cyan", hint: "Basis-Palette des Nexus" },
  "deepsea-neon": {
    title: "Deepsea Neon",
    hint: "Freischaltung: Endless Floor 10",
  },
  "monochrome-glitch": {
    title: "Monochrome Glitch",
    hint: "Freischaltung: Sieg in Sektor 0",
  },
};
