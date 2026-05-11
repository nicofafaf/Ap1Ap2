/**
 * Loot-Rarität, Theme-konforme Glows (--cyan / --violet / --gold) und gemeinsamer FX-Canvas
 * (Shatter-Physik + Legendary Loot — ein DOM-Node, weniger Compositing)
 */

export const NEXUS_COMBAT_FX_CANVAS_ID = "nexus-combat-fx-canvas";

/** Gewichte (Summe 1) — leicht erhöhtes LEGENDARY für Dopamin */
export const RARITY_WEIGHTS = {
  COMMON: 0.68,
  RARE: 0.24,
  LEGENDARY: 0.08,
} as const;

/**
 * UI-Theme assets/nexus-integration.css :root — exakt dieselben Custom Properties
 */
export const RARITY_LEVELS = {
  COMMON: {
    color: "var(--cyan)",
    chance: RARITY_WEIGHTS.COMMON,
    glow: "0 0 16px color-mix(in srgb, var(--cyan, #22d3ee) 62%, transparent)",
  },
  RARE: {
    color: "var(--violet)",
    chance: RARITY_WEIGHTS.RARE,
    glow: "0 0 22px color-mix(in srgb, var(--violet, #a78bfa) 58%, transparent)",
  },
  LEGENDARY: {
    color: "var(--gold)",
    chance: RARITY_WEIGHTS.LEGENDARY,
    glow: "0 0 40px color-mix(in srgb, var(--gold, #facc15) 70%, transparent)",
  },
} as const;

export type LootRarity = keyof typeof RARITY_LEVELS;

const TIER_ORDER: LootRarity[] = ["COMMON", "RARE", "LEGENDARY"];

export function rollLootRarity(): LootRarity {
  const r = Math.random();
  let acc = 0;
  for (const tier of TIER_ORDER) {
    acc += RARITY_LEVELS[tier].chance;
    if (r < acc) return tier;
  }
  return "COMMON";
}

/** Drop-Shadows für Karten-Flug (filter CSS) — Theme-Farben */
export function lootRarityFlightFilters(rarity: LootRarity): {
  burst: string;
  land: string;
  initial: string;
} {
  const cyan = "rgba(34, 211, 238, 0.55)";
  const violet = "rgba(167, 139, 250, 0.5)";
  const gold = "rgba(250, 204, 21, 0.88)";
  if (rarity === "LEGENDARY") {
    return {
      initial: `drop-shadow(0 0 26px ${gold})`,
      burst: `drop-shadow(0 0 38px ${gold}) drop-shadow(12px -4px 22px ${violet}) drop-shadow(-10px 6px 24px ${cyan})`,
      land: `drop-shadow(0 0 52px ${gold}) drop-shadow(0 0 18px ${cyan})`,
    };
  }
  if (rarity === "RARE") {
    return {
      initial: `drop-shadow(0 0 18px ${violet})`,
      burst: `drop-shadow(0 0 28px ${violet}) drop-shadow(-14px 4px 20px ${cyan})`,
      land: `drop-shadow(0 0 36px ${violet}) drop-shadow(0 0 14px ${cyan})`,
    };
  }
  return {
    initial: `drop-shadow(0 0 14px ${cyan})`,
    burst: `drop-shadow(0 0 22px ${cyan}) drop-shadow(10px -6px 18px ${violet})`,
    land: `drop-shadow(0 0 20px ${cyan}) drop-shadow(0 0 12px ${violet})`,
  };
}

/** RGBA fürs Canvas-Zeichnen — liest Theme vom :root */
export function readThemeColorRgb(cssVar: "--cyan" | "--violet" | "--gold"): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  if (typeof window === "undefined") {
    return { r: 34, g: 211, b: 238, a: 0.95 };
  }
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  const m = raw.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/
  );
  if (m) {
    return {
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3]),
      a: m[4] !== undefined ? Number(m[4]) : 1,
    };
  }
  const fallbacks: Record<typeof cssVar, { r: number; g: number; b: number; a: number }> = {
    "--cyan": { r: 34, g: 211, b: 238, a: 0.95 },
    "--violet": { r: 167, g: 139, b: 250, a: 0.98 },
    "--gold": { r: 250, g: 204, b: 21, a: 0.98 },
  };
  return fallbacks[cssVar];
}

type FxCanvasOpts = {
  zIndex?: string;
  mixBlendMode?: string;
};

export function obtainNexusCombatFxCanvas(opts: FxCanvasOpts = {}): HTMLCanvasElement {
  const z = opts.zIndex ?? "2147483000";
  const blend = opts.mixBlendMode ?? "screen";
  let el = document.getElementById(NEXUS_COMBAT_FX_CANVAS_ID) as HTMLCanvasElement | null;
  if (!el) {
    el = document.createElement("canvas");
    el.id = NEXUS_COMBAT_FX_CANVAS_ID;
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
  }
  el.style.cssText = [
    "position:fixed",
    "inset:0",
    `z-index:${z}`,
    "pointer-events:none",
    `mix-blend-mode:${blend}`,
    "display:block",
    "opacity:1",
  ].join(";");
  return el;
}

export function hideNexusCombatFxCanvas(): void {
  const el = document.getElementById(NEXUS_COMBAT_FX_CANVAS_ID) as HTMLCanvasElement | null;
  if (!el) return;
  const ctx = el.getContext("2d");
  if (ctx) {
    const w = el.width;
    const h = el.height;
    ctx.clearRect(0, 0, w, h);
  }
  el.style.display = "none";
}
